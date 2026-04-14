import requests
import sys
import json
from datetime import datetime

class UMKMAPITester:
    def __init__(self, base_url="https://umkm-marketplace-2.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.session = requests.Session()

    def run_test(self, name, method, endpoint, expected_status, data=None, auth_required=False):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if auth_required and self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 200:
                        print(f"   Response: {response_data}")
                except:
                    pass
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response text: {response.text[:200]}")

            return success, response.json() if success and response.content else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@umkm.com", "password": "admin123"}
        )
        if success and 'token' in response:
            self.token = response['token']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_auth_me(self):
        """Test get current user"""
        return self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200,
            auth_required=True
        )[0]

    def test_logout(self):
        """Test logout"""
        return self.run_test(
            "Logout",
            "POST",
            "auth/logout",
            200,
            data={},
            auth_required=True
        )[0]

    def test_get_umkm_list(self):
        """Test get UMKM list (public endpoint)"""
        success, response = self.run_test(
            "Get UMKM List",
            "GET",
            "umkm?limit=5",
            200
        )
        if success:
            items = response.get('items', [])
            total = response.get('total', 0)
            print(f"   Found {len(items)} items out of {total} total")
            return len(items) > 0
        return False

    def test_get_umkm_with_search(self):
        """Test UMKM search functionality"""
        return self.run_test(
            "Search UMKM",
            "GET",
            "umkm?search=warung&limit=3",
            200
        )[0]

    def test_get_umkm_with_category_filter(self):
        """Test UMKM category filter"""
        return self.run_test(
            "Filter UMKM by Category",
            "GET",
            "umkm?kategori=kuliner&limit=3",
            200
        )[0]

    def test_get_umkm_with_badge_filter(self):
        """Test UMKM badge filter"""
        return self.run_test(
            "Filter UMKM by Badge",
            "GET",
            "umkm?badge=viral&limit=3",
            200
        )[0]

    def test_get_umkm_pagination(self):
        """Test UMKM pagination"""
        return self.run_test(
            "UMKM Pagination",
            "GET",
            "umkm?page=2&limit=3",
            200
        )[0]

    def test_get_stats(self):
        """Test get stats (admin only)"""
        success, response = self.run_test(
            "Get Stats",
            "GET",
            "stats",
            200,
            auth_required=True
        )
        if success:
            total = response.get('total_umkm', 0)
            print(f"   Total UMKM: {total}")
        return success

    def test_create_umkm(self):
        """Test create new UMKM (admin only)"""
        test_umkm = {
            "nama": "Test UMKM API",
            "kategori": "kuliner",
            "deskripsi": "Test UMKM created via API testing",
            "alamat": "Jl. Test No. 123",
            "telepon": "081234567999",
            "harga_range": "Rp 10.000 - Rp 25.000",
            "rating": 4.5,
            "badges": ["viral"],
            "image_url": "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600"
        }
        
        success, response = self.run_test(
            "Create UMKM",
            "POST",
            "umkm",
            200,
            data=test_umkm,
            auth_required=True
        )
        
        if success and 'id' in response:
            self.test_umkm_id = response['id']
            print(f"   Created UMKM with ID: {self.test_umkm_id}")
            return True
        return False

    def test_get_single_umkm(self):
        """Test get single UMKM by ID"""
        if not hasattr(self, 'test_umkm_id'):
            print("   Skipping - no test UMKM ID available")
            return True
            
        return self.run_test(
            "Get Single UMKM",
            "GET",
            f"umkm/{self.test_umkm_id}",
            200
        )[0]

    def test_update_umkm(self):
        """Test update UMKM (admin only)"""
        if not hasattr(self, 'test_umkm_id'):
            print("   Skipping - no test UMKM ID available")
            return True
            
        update_data = {
            "nama": "Updated Test UMKM API",
            "rating": 4.8,
            "badges": ["viral", "best_seller"]
        }
        
        return self.run_test(
            "Update UMKM",
            "PUT",
            f"umkm/{self.test_umkm_id}",
            200,
            data=update_data,
            auth_required=True
        )[0]

    def test_delete_umkm(self):
        """Test delete UMKM (admin only)"""
        if not hasattr(self, 'test_umkm_id'):
            print("   Skipping - no test UMKM ID available")
            return True
            
        return self.run_test(
            "Delete UMKM",
            "DELETE",
            f"umkm/{self.test_umkm_id}",
            200,
            auth_required=True
        )[0]

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        return self.run_test(
            "Invalid Login",
            "POST",
            "auth/login",
            401,
            data={"email": "wrong@email.com", "password": "wrongpass"}
        )[0]

    def test_unauthorized_access(self):
        """Test accessing protected endpoint without auth"""
        # Temporarily remove token
        old_token = self.token
        self.token = None
        
        success = self.run_test(
            "Unauthorized Access",
            "GET",
            "stats",
            401
        )[0]
        
        # Restore token
        self.token = old_token
        return success

def main():
    print("🚀 Starting UMKM API Testing...")
    print("=" * 50)
    
    tester = UMKMAPITester()
    
    # Test sequence
    tests = [
        # Public endpoints
        ("Get UMKM List", tester.test_get_umkm_list),
        ("Search UMKM", tester.test_get_umkm_with_search),
        ("Filter by Category", tester.test_get_umkm_with_category_filter),
        ("Filter by Badge", tester.test_get_umkm_with_badge_filter),
        ("Pagination", tester.test_get_umkm_pagination),
        
        # Authentication
        ("Admin Login", tester.test_login),
        ("Get Current User", tester.test_auth_me),
        
        # Protected endpoints
        ("Get Stats", tester.test_get_stats),
        ("Create UMKM", tester.test_create_umkm),
        ("Get Single UMKM", tester.test_get_single_umkm),
        ("Update UMKM", tester.test_update_umkm),
        ("Delete UMKM", tester.test_delete_umkm),
        
        # Error cases
        ("Invalid Login", tester.test_invalid_login),
        ("Unauthorized Access", tester.test_unauthorized_access),
        
        # Logout
        ("Logout", tester.test_logout),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            if not test_func():
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} - Exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if failed_tests:
        print(f"\n❌ Failed tests ({len(failed_tests)}):")
        for test in failed_tests:
            print(f"   - {test}")
    else:
        print("\n✅ All tests passed!")
    
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"📈 Success rate: {success_rate:.1f}%")
    
    return 0 if len(failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())