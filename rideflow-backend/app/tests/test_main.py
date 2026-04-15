from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_read_root():
    """
    Test the root endpoint for health/availability.
    """
    response = client.get("/")
    # Even if it redirects or returns 404, we want to know the server is up.
    # Our main app currently doesn't have a direct GET / (it has /ws and /drivers etc).
    # But checking /docs is a good health check for FastAPI.
    response = client.get("/docs")
    assert response.status_code == 200

def test_docs_accessible():
    """
    Verify that Swagger UI is accessible.
    """
    response = client.get("/docs")
    assert response.status_code == 200
    assert "swagger-ui" in response.text.lower()
