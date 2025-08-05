import sqlite3
import os
import pathlib

# Get the absolute path to the database
current_dir = pathlib.Path(__file__).parent.absolute()
db_path = os.path.join(current_dir, "EmployAI.db")

def check_database():
    """Check database structure"""
    print(f"Checking database at: {db_path}")
    
    if not os.path.exists(db_path):
        print(f"ERROR: Database file not found at {db_path}")
        return
        
    try:
        # Connect to the database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get list of tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        print("Tables in the database:")
        for table in tables:
            table_name = table[0]
            print(f"  - {table_name}")
            
            # Get table schema
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = cursor.fetchall()
            
            print(f"    Columns in {table_name}:")
            for col in columns:
                print(f"      - {col[1]} ({col[2]})")
                
            # Get row count
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            print(f"    Row count: {count}")
            print()
            
    except Exception as e:
        print(f"Error checking database: {str(e)}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    check_database()
