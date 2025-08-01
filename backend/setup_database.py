#!/usr/bin/env python3
"""
Comprehensive Database Setup Script
This script ensures the database is properly initialized with all required columns
"""

import os
import sys
import sqlite3
from pathlib import Path

def main():
    print("🚀 Starting Database Setup...")
    
    # Find the database file
    backend_dir = Path(__file__).parent
    db_path = backend_dir / "EmployAI.db"
    
    print(f"📍 Database location: {db_path}")
    
    if not db_path.exists():
        print("⚠️  Database file doesn't exist, it will be created.")
    
    try:
        # Connect to database
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        print("✅ Connected to database successfully")
        
        # Check if phone_numbers table exists
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='phone_numbers'
        """)
        
        table_exists = cursor.fetchone() is not None
        
        if not table_exists:
            print("📝 Creating phone_numbers table...")
            cursor.execute("""
                CREATE TABLE phone_numbers (
                    id VARCHAR PRIMARY KEY,
                    vapi_id VARCHAR UNIQUE,
                    user_id VARCHAR NOT NULL,
                    number VARCHAR NOT NULL,
                    name VARCHAR NOT NULL,
                    country VARCHAR DEFAULT 'US',
                    area_code VARCHAR,
                    provider VARCHAR DEFAULT 'byo-phone-number',
                    type VARCHAR DEFAULT 'voice',
                    status VARCHAR DEFAULT 'active',
                    assistant_id VARCHAR,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            print("✅ phone_numbers table created")
        else:
            print("✅ phone_numbers table already exists")
            
            # Check if assistant_id column exists
            cursor.execute("PRAGMA table_info(phone_numbers)")
            columns = cursor.fetchall()
            column_names = [col[1] for col in columns]
            
            if 'assistant_id' not in column_names:
                print("➕ Adding assistant_id column...")
                cursor.execute("ALTER TABLE phone_numbers ADD COLUMN assistant_id VARCHAR")
                print("✅ assistant_id column added")
            else:
                print("✅ assistant_id column already exists")
        
        # Verify the final schema
        print("\n📋 Final phone_numbers table schema:")
        cursor.execute("PRAGMA table_info(phone_numbers)")
        columns = cursor.fetchall()
        for col in columns:
            print(f"   {col[1]} ({col[2]})" + (" - Primary Key" if col[5] else ""))
        
        # Create other tables if they don't exist
        tables_to_check = ['users', 'agents', 'calls']
        for table_name in tables_to_check:
            cursor.execute(f"""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='{table_name}'
            """)
            if not cursor.fetchone():
                print(f"⚠️  {table_name} table missing - will be created by SQLAlchemy")
        
        # Commit changes
        conn.commit()
        conn.close()
        
        print("\n🎉 Database setup completed successfully!")
        print("🔧 You can now start the FastAPI server")
        
        return True
        
    except Exception as e:
        print(f"❌ Database setup failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
