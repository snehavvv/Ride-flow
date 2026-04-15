from datetime import datetime, timedelta
import pandas as pd
from airflow import DAG
from airflow.decorators import task
from airflow.providers.postgres.hooks.postgres import PostgresHook
import sqlite3
import os

default_args = {
    'owner': 'rideflow',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

with DAG(
    'rideflow_daily_analytics_etl',
    default_args=default_args,
    description='Extracts daily ride & payment data, aggregates metrics, and loads into analytics engine',
    schedule_interval=timedelta(days=1),
    start_date=datetime(2023, 1, 1),
    catchup=False,
    tags=['analytics', 'etl'],
) as dag:

    @task()
    def extract_from_postgres():
        """Extract completed rides and driver efficiency data from primary PostgreSQL DB"""
        pg_hook = PostgresHook(postgres_conn_id='postgres_default') # Needs connection setup in airflow UI
        
        # In a real scenario, this extracts only yesterday's delta
        rides_sql = """
            SELECT ride_id, requested_at, completed_at, duration_minutes, distance_km, fare, rating
            FROM rides
            WHERE status = 'completed'
        """
        
        drivers_sql = """
            SELECT driver_id, vehicle_type, total_rides, total_earnings
            FROM drivers
            WHERE approval_status = 'approved'
        """
        
        rides_df = pg_hook.get_pandas_df(rides_sql)
        drivers_df = pg_hook.get_pandas_df(drivers_sql)
        
        # Save temp JSON for next task
        rides_df.to_json('/tmp/rides_extract.json')
        drivers_df.to_json('/tmp/drivers_extract.json')
        
        return True

    @task()
    def transform_data(_):
        """Clean data and calculate revenue, carbon saved, and peak patterns"""
        rides_df = pd.read_json('/tmp/rides_extract.json')
        drivers_df = pd.read_json('/tmp/drivers_extract.json')
        
        # 1. Clean Missing
        rides_df.fillna({'duration_minutes': 0, 'rating': 5.0}, inplace=True)
        
        # 2. Aggregations
        total_revenue = rides_df['fare'].sum() if not rides_df.empty else 0
        total_distance = rides_df['distance_km'].sum() if not rides_df.empty else 0
        
        # Approx 0.21 kg CO2 saved per km
        carbon_saved = total_distance * 0.21
        
        avg_wait_time = (rides_df['completed_at'] - rides_df['requested_at']).dt.total_seconds().mean() / 60 if not rides_df.empty else 0
        
        summary_df = pd.DataFrame([{
            'date': datetime.now().strftime('%Y-%m-%d'),
            'total_rides_completed': len(rides_df),
            'total_revenue': total_revenue,
            'avg_wait_minutes': avg_wait_time,
            'total_carbon_saved_kg': carbon_saved,
            'active_drivers': len(drivers_df)
        }])
        
        summary_df.to_json('/tmp/analytics_summary.json')
        return True

    @task()
    def load_to_warehouse(_):
        """Load aggregated summary into a local SQLite Data Warehouse for BI lookup"""
        summary_df = pd.read_json('/tmp/analytics_summary.json')
        
        # For this prototype we load directly into a separate SQLite file
        dw_path = '/opt/airflow/dags/data_warehouse.sqlite'
        conn = sqlite3.connect(dw_path)
        
        summary_df.to_sql('daily_metrics', conn, if_exists='append', index=False)
        conn.close()
        
        # Clean up
        for f in ['/tmp/rides_extract.json', '/tmp/drivers_extract.json', '/tmp/analytics_summary.json']:
            if os.path.exists(f):
                os.remove(f)

    # Define DAG flow
    extract_task = extract_from_postgres()
    transform_task = transform_data(extract_task)
    load_task = load_to_warehouse(transform_task)
