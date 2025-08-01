import sqlite3

conn = sqlite3.connect('EmployAI.db')
cursor = conn.cursor()

# Check if phone_numbers table exists and get its schema
cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='phone_numbers'")
result = cursor.fetchone()

if result:
    print("Current phone_numbers table schema:")
    print(result[0])
    print("\n" + "="*50 + "\n")
    
    # Check if assistant_id column exists
    cursor.execute("PRAGMA table_info(phone_numbers)")
    columns = cursor.fetchall()
    print("Current columns:")
    for col in columns:
        print(f"  {col[1]} ({col[2]})")
    
    assistant_id_exists = any(col[1] == 'assistant_id' for col in columns)
    print(f"\nassistant_id column exists: {assistant_id_exists}")
    
    if not assistant_id_exists:
        print("\nAdding assistant_id column...")
        cursor.execute("ALTER TABLE phone_numbers ADD COLUMN assistant_id VARCHAR")
        conn.commit()
        print("Column added successfully!")
else:
    print("phone_numbers table not found")

conn.close()
