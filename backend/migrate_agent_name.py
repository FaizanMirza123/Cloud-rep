"""
Migration script to add agent_name column to calls table
"""
import sqlite3
import os

def migrate_database():
    db_path = "EmployAI.db"
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if agent_name column already exists
        cursor.execute("PRAGMA table_info(calls)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'agent_name' not in columns:
            print("Adding agent_name column to calls table...")
            cursor.execute("ALTER TABLE calls ADD COLUMN agent_name TEXT")
            
            # Update existing calls with agent names where possible
            cursor.execute("""
                UPDATE calls 
                SET agent_name = (
                    SELECT agents.name 
                    FROM agents 
                    WHERE agents.id = calls.agent_id
                )
                WHERE calls.agent_id IS NOT NULL
            """)
            
            conn.commit()
            print("Migration completed successfully")
        else:
            print("agent_name column already exists")
            
    except Exception as e:
        print(f"Migration failed: {str(e)}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database()
