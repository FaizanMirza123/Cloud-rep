import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine, PhoneNumber
from sqlalchemy import inspect

try:
    inspector = inspect(engine)
    columns = inspector.get_columns('phone_numbers')
    print('Columns in phone_numbers table:')
    for col in columns:
        print(f'  {col["name"]} ({col["type"]})')
    
    # Check if assistant_id exists
    assistant_id_exists = any(col["name"] == "assistant_id" for col in columns)
    print(f'\nassistant_id column exists: {assistant_id_exists}')
    
except Exception as e:
    print(f"Error: {e}")
    print("Let's check if we can create the tables...")
    
    from database import Base
    Base.metadata.create_all(bind=engine)
    print("Tables created/updated successfully!")
