#!/usr/bin/env python3
"""
Project Startup Script
Initializes database and starts the FastAPI server
"""

import os
import sys
import subprocess
import time
from pathlib import Path

def setup_database():
    """Setup and verify database"""
    print("🔧 Setting up database...")
    
    # Run the database setup script
    backend_dir = Path(__file__).parent
    setup_script = backend_dir / "setup_database.py"
    
    if setup_script.exists():
        result = subprocess.run([sys.executable, str(setup_script)], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ Database setup completed")
            return True
        else:
            print(f"❌ Database setup failed: {result.stderr}")
            return False
    else:
        print("⚠️  Database setup script not found")
        return False

def start_server():
    """Start the FastAPI server"""
    print("🚀 Starting FastAPI server...")
    
    api_dir = Path(__file__).parent / "api"
    os.chdir(str(api_dir))
    
    try:
        # Start the server
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "main:app", "--reload", "--port", "8000"
        ])
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Server failed to start: {e}")

def main():
    print("🎯 Cloud-Rep Backend Startup")
    print("=" * 50)
    
    # Setup database
    if not setup_database():
        print("❌ Database setup failed. Exiting.")
        sys.exit(1)
    
    print("\n" + "=" * 50)
    print("🌐 Server will start at: http://localhost:8000")
    print("📚 API Docs will be at: http://localhost:8000docs")
    print("🔍 Health check: http://localhost:8000health")
    print("=" * 50)
    
    # Start server
    start_server()

if __name__ == "__main__":
    main()
