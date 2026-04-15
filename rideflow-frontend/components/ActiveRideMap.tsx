"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface ActiveRideMapProps {
  ride: any;
}

const ActiveRideMap = ({ ride }: ActiveRideMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    // Fix default icon issues
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });

    if (mapRef.current && !mapInstance.current && ride?.pickup_lat) {
      const map = L.map(mapRef.current);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      mapInstance.current = map;

      const pMarker = L.marker([ride.pickup_lat, ride.pickup_lng] as L.LatLngExpression).addTo(map).bindPopup("<b>Pickup</b>");
      const dMarker = L.marker([ride.dropoff_lat, ride.dropoff_lng] as L.LatLngExpression).addTo(map).bindPopup("<b>Drop-off</b>");

      L.polyline([pMarker.getLatLng(), dMarker.getLatLng()] as L.LatLngExpression[], {
        color: "#3B82F6",
        weight: 5,
        dashArray: "10, 10",
      }).addTo(map);

      map.fitBounds([
        [pMarker.getLatLng().lat, pMarker.getLatLng().lng],
        [dMarker.getLatLng().lat, dMarker.getLatLng().lng],
      ] as [number, number][], { padding: [50, 50] });
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [ride]);

  return <div ref={mapRef} className="w-full h-full rounded-xl z-0 bg-gray-100" />;
};

export default ActiveRideMap;
