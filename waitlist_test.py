#!/usr/bin/env python3
import requests
import sys
import json
import uuid
from datetime import datetime

class WaitlistTester:
    def __init__(self, base_url="https://qr-stripe-pay.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.test_email = f"test_{uuid.uuid4().hex[:8]}@waitlisttest.com"

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=headers, timeout=10)

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

            return success, response.json() if response.content else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def authenticate_backoffice(self):
        """Authenticate to backoffice"""
        print("\n🔑 Authenticating to Backoffice...")
        success, response = self.run_test(
            "Backoffice Login",
            "POST",
            "backoffice/auth/login",
            200,
            data={"password": "zentra2024admin"}
        )
        return success

    def test_global_settings_get(self):
        """Test GET /api/settings/global"""
        success, response = self.run_test(
            "Get Global Settings",
            "GET",
            "settings/global",
            200
        )
        if success:
            # Check if landing_mode is present in response
            landing_mode = response.get('landing_mode')
            print(f"   Landing Mode: {landing_mode}")
            if 'landing_mode' in response:
                print("   ✅ landing_mode field present")
            else:
                print("   ❌ landing_mode field missing")
                return False
        return success

    def test_waitlist_submit(self):
        """Test POST /api/waitlist"""
        waitlist_data = {
            "name": "Test User",
            "business_name": "Test Restaurant",
            "email": self.test_email,
            "phone": "+351123456789",
            "table_count": 15,
            "message": "Testing waitlist submission"
        }
        
        success, response = self.run_test(
            "Submit Waitlist Entry",
            "POST",
            "waitlist",
            200,
            data=waitlist_data
        )
        
        # Response doesn't include ID, we'll get it later from backoffice list
        return success

    def test_waitlist_duplicate_email(self):
        """Test POST /api/waitlist with duplicate email"""
        waitlist_data = {
            "name": "Another User",
            "business_name": "Another Restaurant", 
            "email": self.test_email,  # Same email as previous test
            "phone": "+351987654321",
            "table_count": 20
        }
        
        success, response = self.run_test(
            "Submit Duplicate Waitlist Email",
            "POST",
            "waitlist",
            400,
            data=waitlist_data
        )
        
        if success:
            detail = response.get('detail', '')
            if 'whitelist' in detail.lower() or 'already' in detail.lower():
                print("   ✅ Correctly rejected duplicate email")
            else:
                print(f"   ❌ Wrong error message: {detail}")
                return False
                
        return success

    def test_backoffice_settings_update(self):
        """Test PUT /api/backoffice/settings/global"""
        # Test updating landing_mode
        settings_data = {
            "landing_mode": "waitlist",
            "plans_sales_enabled": False
        }
        
        success, response = self.run_test(
            "Update Global Settings (Landing Mode)",
            "PUT",
            "backoffice/settings/global",
            200,
            data=settings_data
        )
        
        if success:
            # Verify the settings were updated
            verify_success, verify_response = self.run_test(
                "Verify Updated Settings",
                "GET", 
                "settings/global",
                200
            )
            if verify_success:
                if verify_response.get('landing_mode') == 'waitlist':
                    print("   ✅ Landing mode updated successfully")
                else:
                    print(f"   ❌ Landing mode not updated correctly: {verify_response.get('landing_mode')}")
                    return False
        
        return success

    def test_backoffice_waitlist_list(self):
        """Test GET /api/backoffice/waitlist"""
        success, response = self.run_test(
            "Get Backoffice Waitlist Entries",
            "GET",
            "backoffice/waitlist",
            200
        )
        
        if success and isinstance(response, list):
            # Check if our test entry is in the list and get its ID
            for entry in response:
                if entry.get('email') == self.test_email:
                    self.waitlist_entry_id = entry.get('id')
                    print(f"   ✅ Test waitlist entry found with ID: {self.waitlist_entry_id}")
                    return True
            
            print("   ❌ Test waitlist entry not found in backoffice list")
            return False
        
        return success

    def test_backoffice_waitlist_status_update(self):
        """Test PUT /api/backoffice/waitlist/{id}/status"""
        if not hasattr(self, 'waitlist_entry_id'):
            print("   ❌ No waitlist entry ID available for status update test")
            return False
        
        # Update status to 'contacted'
        success, response = self.run_test(
            "Update Waitlist Entry Status",
            "PUT",
            f"backoffice/waitlist/{self.waitlist_entry_id}/status",
            200,
            data={"status": "contacted"}
        )
        
        return success

    def test_backoffice_waitlist_delete(self):
        """Test DELETE /api/backoffice/waitlist/{id}"""
        if not hasattr(self, 'waitlist_entry_id'):
            print("   ❌ No waitlist entry ID available for delete test")
            return False
        
        success, response = self.run_test(
            "Delete Waitlist Entry", 
            "DELETE",
            f"backoffice/waitlist/{self.waitlist_entry_id}",
            200
        )
        
        return success

def main():
    print("🚀 Starting Waitlist System Testing")
    print("=" * 50)
    
    tester = WaitlistTester()
    
    # Test 1: Get global settings (should work without auth)
    print("\n📋 Testing Global Settings")
    print("-" * 30)
    if not tester.test_global_settings_get():
        print("❌ Global settings test failed")
        return 1
    
    # Test 2: Submit waitlist entry
    print("\n📝 Testing Waitlist Submission")
    print("-" * 35)
    if not tester.test_waitlist_submit():
        print("❌ Waitlist submission failed")
        return 1
    
    # Test 3: Test duplicate email rejection
    print("\n🚫 Testing Duplicate Email Rejection")
    print("-" * 40)
    if not tester.test_waitlist_duplicate_email():
        print("❌ Duplicate email test failed")
        return 1
    
    # Test 4: Authenticate to backoffice for protected routes
    print("\n🔐 Authenticating for Protected Routes")
    print("-" * 40)
    if not tester.authenticate_backoffice():
        print("❌ Backoffice authentication failed")
        return 1
    
    # Test 5: Update global settings (requires auth)
    print("\n⚙️ Testing Settings Update")
    print("-" * 30)
    if not tester.test_backoffice_settings_update():
        print("❌ Settings update test failed")
    
    # Test 6: Get waitlist entries from backoffice (requires auth)
    print("\n📊 Testing Backoffice Waitlist Access")
    print("-" * 40)
    if not tester.test_backoffice_waitlist_list():
        print("❌ Backoffice waitlist access failed")
    
    # Test 7: Update waitlist entry status (requires auth)
    print("\n🔄 Testing Waitlist Status Update")
    print("-" * 40)
    if not tester.test_backoffice_waitlist_status_update():
        print("❌ Waitlist status update failed")
    
    # Test 8: Delete waitlist entry (requires auth)
    print("\n🗑️ Testing Waitlist Entry Deletion")
    print("-" * 40)
    if not tester.test_backoffice_waitlist_delete():
        print("❌ Waitlist deletion failed")
    
    # Print final results
    print("\n" + "=" * 50)
    print("📊 TESTING SUMMARY")
    print("=" * 50)
    print(f"Tests run: {tester.tests_run}")
    print(f"Tests passed: {tester.tests_passed}")
    print(f"Tests failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("\n🎉 All waitlist tests passed!")
        return 0
    else:
        print(f"\n⚠️ {tester.tests_run - tester.tests_passed} test(s) failed.")
        return 1

if __name__ == "__main__":
    sys.exit(main())