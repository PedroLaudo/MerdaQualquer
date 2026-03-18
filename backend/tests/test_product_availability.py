"""
Test Product Availability Feature
Tests for real-time product availability toggle (available/sold_out)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://menu-unify.preview.emergentagent.com')

# Test data
RESTAURANT_ID = "42075462-798e-4f1c-aa88-163306477ecf"
PRODUCT_ID = "23daa9ff-b4df-4181-b84f-5b5a26696862"  # Classic Burger
TABLE_ID = "0af1b474-3201-4a67-a85e-78c59a2994b8"

@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for API calls"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "test@test.com", "password": "Test1234"}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json()["token"]


@pytest.fixture(scope="module")
def api_client(auth_token):
    """Requests session with auth header"""
    session = requests.Session()
    session.headers.update({
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    })
    return session


@pytest.fixture(autouse=True)
def restore_product_availability(api_client):
    """Ensure product is available before and after each test"""
    # Reset to available before test
    api_client.patch(
        f"{BASE_URL}/api/products/{PRODUCT_ID}/availability",
        json={"availability_status": "available"}
    )
    yield
    # Reset to available after test
    api_client.patch(
        f"{BASE_URL}/api/products/{PRODUCT_ID}/availability",
        json={"availability_status": "available"}
    )


class TestBackendAvailabilityAPI:
    """Tests for PATCH /api/products/{id}/availability endpoint"""

    def test_mark_product_sold_out(self, api_client):
        """Test 1: Backend PATCH - mark product as sold_out"""
        response = api_client.patch(
            f"{BASE_URL}/api/products/{PRODUCT_ID}/availability",
            json={"availability_status": "sold_out"}
        )
        
        # Assert status code
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Assert response data
        data = response.json()
        assert data["id"] == PRODUCT_ID
        assert data["availability_status"] == "sold_out"
        
        # Verify persistence via GET
        verify_response = requests.get(f"{BASE_URL}/api/products/restaurant/{RESTAURANT_ID}")
        assert verify_response.status_code == 200
        products = verify_response.json()
        product = next((p for p in products if p["id"] == PRODUCT_ID), None)
        assert product is not None, "Product not found in GET response"
        assert product["availability_status"] == "sold_out", "Product status not persisted"

    def test_mark_product_available(self, api_client):
        """Test 2: Backend PATCH - mark product back to available"""
        # First mark as sold_out
        api_client.patch(
            f"{BASE_URL}/api/products/{PRODUCT_ID}/availability",
            json={"availability_status": "sold_out"}
        )
        
        # Then mark as available
        response = api_client.patch(
            f"{BASE_URL}/api/products/{PRODUCT_ID}/availability",
            json={"availability_status": "available"}
        )
        
        # Assert status code
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Assert response data
        data = response.json()
        assert data["id"] == PRODUCT_ID
        assert data["availability_status"] == "available"
        
        # Verify persistence via GET
        verify_response = requests.get(f"{BASE_URL}/api/products/restaurant/{RESTAURANT_ID}")
        assert verify_response.status_code == 200
        products = verify_response.json()
        product = next((p for p in products if p["id"] == PRODUCT_ID), None)
        assert product is not None, "Product not found in GET response"
        assert product["availability_status"] == "available", "Product status not persisted"

    def test_reject_invalid_status(self, api_client):
        """Test 3: Backend PATCH - reject invalid status"""
        response = api_client.patch(
            f"{BASE_URL}/api/products/{PRODUCT_ID}/availability",
            json={"availability_status": "invalid_status"}
        )
        
        # Assert 400 status code for invalid input
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        
        # Assert error message
        data = response.json()
        assert "detail" in data
        assert "available" in data["detail"].lower() or "sold_out" in data["detail"].lower()

    def test_returns_availability_status_field(self):
        """Test 4: Backend GET returns availability_status field"""
        response = requests.get(f"{BASE_URL}/api/products/restaurant/{RESTAURANT_ID}")
        
        assert response.status_code == 200
        products = response.json()
        
        # Ensure at least one product exists
        assert len(products) > 0, "No products found"
        
        # Check that all products have availability_status field
        for product in products:
            assert "availability_status" in product, f"Product {product['id']} missing availability_status field"
            assert product["availability_status"] in ["available", "sold_out"], \
                f"Invalid availability_status value: {product['availability_status']}"

    def test_unauthorized_patch_rejected(self):
        """Test 5: PATCH without auth token is rejected"""
        response = requests.patch(
            f"{BASE_URL}/api/products/{PRODUCT_ID}/availability",
            json={"availability_status": "sold_out"},
            headers={"Content-Type": "application/json"}
        )
        
        # Should return 401 Unauthorized
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"

    def test_nonexistent_product_returns_404(self, api_client):
        """Test 6: PATCH on non-existent product returns 404"""
        fake_product_id = "00000000-0000-0000-0000-000000000000"
        response = api_client.patch(
            f"{BASE_URL}/api/products/{fake_product_id}/availability",
            json={"availability_status": "sold_out"}
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
