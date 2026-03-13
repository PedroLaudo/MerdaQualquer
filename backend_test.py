#!/usr/bin/env python3
import requests
import sys
import json
from datetime import datetime

class QRCodeEditorTester:
    def __init__(self, base_url="https://qr-portal-4.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user = None
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 500:
                        print(f"   Response: {json.dumps(response_data, indent=2)}")
                    elif isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                except:
                    print(f"   Response: Non-JSON or large response")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text[:200]}")

            return success, response.json() if response.content and response.status_code < 400 else {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout")
            return False, {}
        except requests.exceptions.ConnectionError:
            print(f"❌ Failed - Connection error")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_login(self, email, password):
        """Test login and get token"""
        success, response = self.run_test(
            "Login",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        if success and 'token' in response:
            self.token = response['token']
            self.user = response['user']
            print(f"   Logged in as: {self.user.get('name')} ({self.user.get('email')})")
            print(f"   Restaurant ID: {self.user.get('restaurant_id')}")
            return True
        return False

    def test_get_qr_settings(self, restaurant_id):
        """Test GET /api/qr-settings/{restaurant_id}"""
        success, response = self.run_test(
            "GET QR Settings",
            "GET",
            f"qr-settings/{restaurant_id}",
            200
        )
        return success, response

    def test_update_qr_settings(self, restaurant_id):
        """Test PUT /api/qr-settings/{restaurant_id}"""
        settings_data = {
            "title": "TESTE QR",
            "subtitle": "MENU TESTE",
            "cta_text": "Teste de texto",
            "table_prefix": "MESA",
            "show_logo": True,
            "logo_position": "center",
            "layout_style": "layout2",
            "background_color": "#ffffff",
            "text_color": "#000000",
            "qr_color": "#ff0000",
            "card_style": "sharp",
            "show_instructions": False
        }
        
        success, response = self.run_test(
            "PUT QR Settings",
            "PUT",
            f"qr-settings/{restaurant_id}",
            200,
            data=settings_data
        )
        return success, response

    def test_get_tables(self, restaurant_id):
        """Test GET tables for restaurant"""
        success, response = self.run_test(
            "GET Tables",
            "GET",
            f"tables/restaurant/{restaurant_id}",
            200
        )
        return success, response

    def test_table_qr_code(self, table_id):
        """Test table QR code generation"""
        # Test QR code image endpoint
        print(f"\n🔍 Testing Table QR Code Image...")
        url = f"{self.base_url}/api/tables/{table_id}/qrcode"
        print(f"   URL: {url}")
        
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200 and response.headers.get('content-type') == 'image/png':
                print(f"✅ Passed - QR Code image generated successfully")
                print(f"   Content-Type: {response.headers.get('content-type')}")
                print(f"   Content-Length: {len(response.content)} bytes")
                self.tests_passed += 1
            else:
                print(f"❌ Failed - Expected PNG image, got {response.status_code} with {response.headers.get('content-type')}")
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
        
        self.tests_run += 1
        
        # Test QR code data endpoint
        success, response = self.run_test(
            "GET Table QR Code Data",
            "GET",
            f"tables/{table_id}/qrcode-data",
            200
        )
        return success, response

def main():
    # Setup
    tester = QRCodeEditorTester("https://qr-portal-4.preview.emergentagent.com")
    
    print("🚀 Starting QR Code Editor Backend Testing")
    print("=" * 50)
    
    # Test login
    if not tester.test_login("demo@zentraqr.com", "demo123"):
        print("❌ Login failed, stopping tests")
        return 1

    restaurant_id = tester.user.get('restaurant_id')
    if not restaurant_id:
        print("❌ No restaurant ID found, stopping tests")
        return 1

    # Test QR Settings endpoints
    print("\n📋 Testing QR Settings Endpoints")
    print("-" * 30)
    
    # Get initial settings
    success, initial_settings = tester.test_get_qr_settings(restaurant_id)
    if not success:
        print("❌ Failed to get initial QR settings")
        return 1

    # Update settings
    success, updated_settings = tester.test_update_qr_settings(restaurant_id)
    if not success:
        print("❌ Failed to update QR settings")
        return 1

    # Verify settings were updated
    success, final_settings = tester.test_get_qr_settings(restaurant_id)
    if success:
        if final_settings.get('title') == 'TESTE QR':
            print("✅ QR settings update verification passed")
            tester.tests_passed += 1
        else:
            print("❌ QR settings update verification failed - title not updated")
        tester.tests_run += 1

    # Test Tables and QR Code generation
    print("\n🏷️  Testing Tables and QR Code Generation")
    print("-" * 40)
    
    success, tables = tester.test_get_tables(restaurant_id)
    if success and tables:
        # Test QR code for first table
        first_table = tables[0]
        table_id = first_table.get('id')
        print(f"   Testing with Table: {first_table.get('table_number')} (ID: {table_id})")
        
        success, qr_data = tester.test_table_qr_code(table_id)
        if success:
            print(f"   QR URL: {qr_data.get('qr_url')}")
    elif not tables:
        print("⚠️  No tables found for testing QR generation")

    # Print final results
    print("\n" + "=" * 50)
    print("📊 TESTING SUMMARY")
    print("=" * 50)
    print(f"Tests run: {tester.tests_run}")
    print(f"Tests passed: {tester.tests_passed}")
    print(f"Tests failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("\n🎉 All tests passed! QR Code Editor backend is working correctly.")
        return 0
    else:
        print(f"\n⚠️  {tester.tests_run - tester.tests_passed} test(s) failed. Check the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())