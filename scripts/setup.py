import os
import secrets
import sys

def setup_environment():
    root_dir = os.path.join(os.path.dirname(__file__), '..')
    env_path = os.path.join(root_dir, '.env')
    
    if not os.path.exists(env_path):
        print("Creating .env file...")
        secret_key = secrets.token_hex(32)
        
        with open(env_path, 'w') as f:
            f.write(f"SECRET_KEY={secret_key}\n")
            f.write("DATABASE_URL=sqlite:///elimuai.db\n")
            f.write("MPESA_CONSUMER_KEY=\n")
            f.write("MPESA_CONSUMER_SECRET=\n")
            f.write("MPESA_SHORTCODE=\n")
            f.write("MPESA_PASSKEY=\n")
            f.write("MPESA_CALLBACK_URL=\n")
            f.write("FLASK_ENV=development\n")
        
        print("✓ .env file created with secure SECRET_KEY")
        print("⚠ Please add your M-Pesa credentials to .env file")
    else:
        print("✓ .env file already exists")

if __name__ == '__main__':
    setup_environment()
    print("\nSetup complete!")
    print("Run 'python scripts/run_app.py' or 'scripts/run.bat' to start the server.")
