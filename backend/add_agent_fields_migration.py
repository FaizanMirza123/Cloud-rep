from sqlalchemy import create_engine, text
import os
import sys
import pathlib

# Get the absolute path to the database
current_dir = pathlib.Path(__file__).parent.absolute()
db_path = os.path.join(current_dir, "EmployAI.db")
DATABASE_URL = f"sqlite:///{db_path}"

print(f"Using database at: {db_path}")

def alter_table():
    """Add new columns to the agents table"""
    
    if not os.path.exists(db_path):
        print(f"ERROR: Database file not found at {db_path}")
        sys.exit(1)
        
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    conn = engine.connect()
    
    try:
        # Check if voice_provider column exists
        result = conn.execute(text("PRAGMA table_info(agents)")).fetchall()
        columns = [row[1] for row in result]
        
        # Add new columns if they don't exist
        if "voice_provider" not in columns:
            conn.execute(text("ALTER TABLE agents ADD COLUMN voice_provider VARCHAR DEFAULT 'openai'"))
            print("Added voice_provider column")
        
        if "voice_gender" not in columns:
            conn.execute(text("ALTER TABLE agents ADD COLUMN voice_gender VARCHAR"))
            print("Added voice_gender column")
            
        if "model_provider" not in columns:
            conn.execute(text("ALTER TABLE agents ADD COLUMN model_provider VARCHAR DEFAULT 'openai'"))
            print("Added model_provider column")
            
        # Update default model from gpt-4 to gpt-4o for newer/better default
        conn.execute(text("UPDATE agents SET model = 'gpt-4o' WHERE model = 'gpt-4'"))
        print("Updated default model to gpt-4o")
        
        conn.commit()
        print("Migration completed successfully")
    except Exception as e:
        print(f"Migration error: {str(e)}")
    finally:
        conn.close()

if __name__ == "__main__":
    alter_table()
