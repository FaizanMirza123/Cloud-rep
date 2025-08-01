#!/usr/bin/env python3
"""
Test Phone Number Validation
"""

import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_phone_validation():
    """Test phone number validation logic"""
    
    # Test cases
    test_cases = [
        ("1234567890", "+11234567890"),  # 10 digits, should add +1
        ("5551234567", "+15551234567"),   # 10 digits, should add +1
        ("+15551234567", "+15551234567"), # Already E.164, should pass
        ("+442071234567", "+442071234567"), # UK number, should pass
        ("555123456", None),              # 9 digits, should fail
        ("123456789012", None),           # 12 digits, should fail
        ("abc123def", None),              # Invalid format, should fail
        ("(555) 123-4567", "+15551234567"), # Formatted US number, should work
        ("+1-555-123-4567", "+15551234567"), # E.164 with dashes, should work
    ]
    
    def validate_phone_number(phone):
        """Python version of the phone validation logic"""
        import re
        
        if not phone:
            return None
            
        # Remove all non-digit characters
        digits = re.sub(r'\D', '', phone)
        
        # Check if it's a valid US phone number (10 digits)
        if len(digits) == 10:
            return f"+1{digits}"
        
        # Check if it's already in E.164 format
        if phone.startswith('+') and len(digits) >= 10:
            return phone
        
        return None
    
    print("🧪 Testing Phone Number Validation")
    print("=" * 50)
    
    all_passed = True
    
    for input_phone, expected in test_cases:
        result = validate_phone_number(input_phone)
        status = "✅" if result == expected else "❌"
        
        print(f"{status} Input: '{input_phone}' -> Output: '{result}' (Expected: '{expected}')")
        
        if result != expected:
            all_passed = False
    
    print("\n" + "=" * 50)
    if all_passed:
        print("🎉 All phone number validation tests passed!")
    else:
        print("❌ Some tests failed")
    
    return all_passed

def test_backend_endpoint():
    """Test the backend endpoint with various phone numbers"""
    
    print("\n🔗 Testing Backend Endpoint Logic")
    print("=" * 50)
    
    # This simulates the backend validation logic
    def backend_validate(phone_number):
        if not phone_number:
            return False, "Phone number is required for test call"
        
        # Ensure phone number is in E.164 format
        if not phone_number.startswith('+'):
            # If it's a US number without +1, add it
            if len(phone_number) == 10 and phone_number.isdigit():
                phone_number = f"+1{phone_number}"
                return True, phone_number
            else:
                return False, "Phone number must be in E.164 format (e.g., +1234567890)"
        
        return True, phone_number
    
    test_numbers = [
        "5551234567",      # Valid US number
        "+15551234567",    # Already E.164
        "123456789",       # Too short
        "+442071234567",   # UK number
        "",                # Empty
        "abc123def"        # Invalid
    ]
    
    for num in test_numbers:
        is_valid, result = backend_validate(num)
        status = "✅" if is_valid else "❌"
        print(f"{status} '{num}' -> {result}")

if __name__ == "__main__":
    success1 = test_phone_validation()
    test_backend_endpoint()
    
    if success1:
        print("\n🎯 Phone number validation is working correctly!")
        print("📞 You can now test calls with properly formatted numbers.")
    else:
        print("\n⚠️  Some validation tests failed.")
