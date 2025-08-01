#!/usr/bin/env python3
"""
Database Migration Script
Ensures the database schema matches the current models
"""

import sys
import os

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine, Base, create_tables
from sqlalchemy import text

def main():
    print("Starting database migration...")
    
    try:
        # Create/update all tables
        print("Creating/updating tables...")
        create_tables()
        print("✓ Tables created/updated successfully!")
        
        # Test the connection and verify assistant_id column exists
        with engine.connect() as conn:
            result = conn.execute(text("PRAGMA table_info(phone_numbers)"))
            columns = result.fetchall()
            
            print("\nCurrent columns in phone_numbers table:")
            for col in columns:
                print(f"  - {col[1]} ({col[2]})")
            
            # Check if assistant_id exists
            assistant_id_exists = any(col[1] == 'assistant_id' for col in columns)
            
            if assistant_id_exists:
                print("\n✓ assistant_id column exists!")
            else:
                print("\n⚠ assistant_id column not found, adding it...")
                conn.execute(text("ALTER TABLE phone_numbers ADD COLUMN assistant_id VARCHAR"))
                conn.commit()
                print("✓ assistant_id column added!")
        
        print("\n🎉 Database migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
