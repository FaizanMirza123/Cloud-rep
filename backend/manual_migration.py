import sqlite3
import os

# Path to the database - should be in api folder
db_path = r"D:\Work\Cloud-rep\backend\api\EmployAI.db"

print(f"Working with database: {db_path}")

try:
    # Connect to the database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check current schema
    print("Current phone_numbers table schema:")
    cursor.execute("PRAGMA table_info(phone_numbers)")
    columns = cursor.fetchall()
    
    column_names = [col[1] for col in columns]
    print("Columns:", column_names)
    
    # Add assistant_id column if it doesn't exist
    if 'assistant_id' not in column_names:
        print("Adding assistant_id column...")
        cursor.execute("ALTER TABLE phone_numbers ADD COLUMN assistant_id VARCHAR")
        conn.commit()
        print("✓ assistant_id column added!")
    else:
        print("✓ assistant_id column already exists!")
    
    # Verify the change
    print("\nUpdated phone_numbers table schema:")
    cursor.execute("PRAGMA table_info(phone_numbers)")
    columns = cursor.fetchall()
    for col in columns:
        print(f"  {col[1]} ({col[2]})")
    
    conn.close()
    print("\n🎉 Database migration completed!")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
