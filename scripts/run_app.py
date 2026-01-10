import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app import app, db
from seed_data import seed_database
from models import Course

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        
        if Course.query.count() == 0:
            print("Seeding database with sample data...")
            seed_database()
            print("Database seeded successfully!")
    
    print("Starting ElimuAI server...")
    print("Access the application at: http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
