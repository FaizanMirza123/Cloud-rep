#!/usr/bin/env python3
"""
Database migration to add knowledge base support to agents table
"""

import sqlite3
import os

def migrate_database():
    """Add knowledge base fields to agents table"""
    
    # Database path
    db_path = os.path.join(os.path.dirname(__file__), "EmployAI.db")
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(agents)")
        columns = [row[1] for row in cursor.fetchall()]
        
        # Add knowledge_base_id column if it doesn't exist
        if 'knowledge_base_id' not in columns:
            cursor.execute("ALTER TABLE agents ADD COLUMN knowledge_base_id TEXT")
            print("Added knowledge_base_id column to agents table")
        
        # Add knowledge_base_name column if it doesn't exist
        if 'knowledge_base_name' not in columns:
            cursor.execute("ALTER TABLE agents ADD COLUMN knowledge_base_name TEXT")
            print("Added knowledge_base_name column to agents table")
        
        conn.commit()
        conn.close()
        
        print("Database migration completed successfully!")
        return True
        
    except Exception as e:
        print(f"Migration failed: {str(e)}")
        return False

if __name__ == "__main__":
    migrate_database()
