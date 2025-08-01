#!/usr/bin/env python3
"""
Direct database test to check if assistant_id column exists
"""

import sys
import os
import sqlite3

# Navigate to the correct database file - should be in the same api folder
db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "EmployAI.db")
print(f"Checking database at: {db_path}")

if not os.path.exists(db_path):
    print("❌ Database file not found!")
    sys.exit(1)

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get table schema
    cursor.execute("PRAGMA table_info(phone_numbers)")
    columns = cursor.fetchall()
    
    print("Current columns in phone_numbers table:")
    column_names = []
    for col in columns:
        print(f"  - {col[1]} ({col[2]})")
        column_names.append(col[1])
    
    # Check if assistant_id exists
    if 'assistant_id' in column_names:
        print("\n✓ assistant_id column exists!")
    else:
        print("\n⚠ assistant_id column missing, adding it...")
        cursor.execute("ALTER TABLE phone_numbers ADD COLUMN assistant_id VARCHAR")
        conn.commit()
        print("✓ assistant_id column added!")
    
    # Now test a simple query
    print("\nTesting query with assistant_id...")
    cursor.execute("SELECT id, user_id, number, assistant_id FROM phone_numbers LIMIT 5")
    results = cursor.fetchall()
    print(f"Found {len(results)} phone numbers")
    for row in results:
        print(f"  {row}")
    
    conn.close()
    print("\n🎉 Database check completed successfully!")
    
except Exception as e:
    print(f"❌ Database error: {e}")
    import traceback
    traceback.print_exc()
