#!/usr/bin/env python3
"""
Simple server startup script
"""

import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    print("Importing dependencies...")
    from database import create_tables
    from main import app
    
    print("Creating/updating database tables...")
    create_tables()
    print("✓ Database tables ready!")
    
    print("Starting server...")
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
