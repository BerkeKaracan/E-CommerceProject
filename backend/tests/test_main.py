import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from main import app, get_db, Base

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_market.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            db.close()
    
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    del app.dependency_overrides[get_db]

# --- TESTS ---

def test_health_check(client):
    """Is the system up and running?"""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_get_categories(client):
    """Is there a list of categories?"""
    response = client.get("/api/categories")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_invalid_product_detail(client):
    """Does a missing product return a 404 error?"""
    response = client.get("/api/products/999999")
    assert response.status_code == 404
    assert "detail" in response.json()

def test_register_and_login(client):
    """Tests the user registration and login flow."""
    register_data = {
        "name": "Test User",
        "email": "test_auth@example.com",
        "password": "securepassword123"
    }
    reg_response = client.post("/api/register", json=register_data)
    assert reg_response.status_code == 200
    assert reg_response.json()["email"] == "test_auth@example.com"

    login_data = {
        "email": "test_auth@example.com",
        "password": "securepassword123"
    }
    login_response = client.post("/api/login", json=login_data)
    assert login_response.status_code == 200
    assert "access_token" in login_response.json()