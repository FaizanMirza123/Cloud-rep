#!/usr/bin/env python3
"""
Simple test script to verify the EmployAI application setup
"""

import sys
import subprocess
import os
import time
import requests
import sqlite3
from pathlib import Path

def check_python_packages():
    """Check if required Python packages are installed"""
    required_packages = [
        'fastapi', 'uvicorn', 'sqlalchemy', 'pydantic', 
        'python-jose', 'passlib', 'httpx', 'python-dotenv'
    ]
    
    missing_packages = []
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            print(f"✅ {package} is installed")
        except ImportError:
            missing_packages.append(package)
            print(f"❌ {package} is missing")
    
    return len(missing_packages) == 0

def check_database():
    """Check if database can be created and tables exist"""
    try:
        # Import our database modules
        sys.path.append(os.path.join(os.path.dirname(__file__)))
        from api.database import create_tables, engine
        
        # Create tables
        create_tables()
        print("✅ Database tables created successfully")
        
        # Check if tables exist
        conn = sqlite3.connect('EmployAI.db')
        cursor = conn.cursor()
        
        tables = ['users', 'agents', 'phone_numbers', 'calls']
        for table in tables:
            cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table}'")
            if cursor.fetchone():
                print(f"✅ Table '{table}' exists")
            else:
                print(f"❌ Table '{table}' missing")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Database error: {e}")
        return False

def test_backend_startup():
    """Test if backend starts successfully"""
    try:
        print("🚀 Testing backend startup...")
        
        # Start backend in background
        process = subprocess.Popen([
            sys.executable, 'main.py'
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Wait a bit for startup
        time.sleep(3)
        
        # Check if process is still running
        if process.poll() is None:
            print("✅ Backend process started successfully")
            
            # Test health endpoint
            try:
                response = requests.get('http://localhost:8000/health', timeout=5)
                if response.status_code == 200:
                    print("✅ Health endpoint responding")
                    
                    # Test API docs
                    response = requests.get('http://localhost:8000/docs', timeout=5)
                    if response.status_code == 200:
                        print("✅ API documentation accessible")
                    else:
                        print("⚠️  API docs not accessible")
                else:
                    print("❌ Health endpoint not responding")
            except requests.exceptions.RequestException as e:
                print(f"❌ HTTP request failed: {e}")
            
            # Clean up
            process.terminate()
            process.wait()
            return True
        else:
            stdout, stderr = process.communicate()
            print(f"❌ Backend failed to start")
            print(f"STDOUT: {stdout.decode()}")
            print(f"STDERR: {stderr.decode()}")
            return False
            
    except Exception as e:
        print(f"❌ Backend startup test failed: {e}")
        return False

def check_frontend_setup():
    """Check if frontend is properly set up"""
    frontend_path = Path('../frontend')
    
    if not frontend_path.exists():
        print("❌ Frontend directory not found")
        return False
    
    # Check if node_modules exists
    node_modules = frontend_path / 'node_modules'
    if node_modules.exists():
        print("✅ Frontend dependencies installed")
    else:
        print("❌ Frontend dependencies not installed (run 'npm install')")
        return False
    
    # Check if package.json has required dependencies
    package_json = frontend_path / 'package.json'
    if package_json.exists():
        print("✅ Package.json found")
        
        # Check for key dependencies
        required_deps = ['react', 'react-router-dom', 'axios', 'framer-motion']
        try:
            import json
            with open(package_json) as f:
                package_data = json.load(f)
                deps = package_data.get('dependencies', {})
                
                for dep in required_deps:
                    if dep in deps:
                        print(f"✅ {dep} dependency found")
                    else:
                        print(f"❌ {dep} dependency missing")
        except Exception as e:
            print(f"⚠️  Could not parse package.json: {e}")
    
    return True

def main():
    """Run all tests"""
    print("🔍 EmployAI Application Setup Verification")
    print("=" * 50)
    
    all_passed = True
    
    print("\n📦 Checking Python packages...")
    if not check_python_packages():
        all_passed = False
        print("💡 Install missing packages with: pip install -r requirements.txt")
    
    print("\n🗄️  Checking database setup...")
    if not check_database():
        all_passed = False
    
    print("\n🖥️  Checking backend startup...")
    if not test_backend_startup():
        all_passed = False
    
    print("\n🌐 Checking frontend setup...")
    if not check_frontend_setup():
        all_passed = False
    
    print("\n" + "=" * 50)
    if all_passed:
        print("🎉 All tests passed! Your EmployAI application is ready to run.")
        print("\n📋 Next steps:")
        print("1. Configure your .env file with VAPI_API_KEY")
        print("2. Start backend: python main.py")
        print("3. Start frontend: cd ../frontend && npm run dev")
        print("4. Open http://localhost:5173 in your browser")
    else:
        print("❌ Some tests failed. Please fix the issues above.")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
