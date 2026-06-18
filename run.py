import os
import sys
import subprocess

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    venv_dir = os.path.join(base_dir, ".venv")
    
    # 1. Create python virtual environment if it doesn't exist
    if not os.path.exists(venv_dir):
        print("Creating local python virtual environment (.venv)...")
        try:
            subprocess.run([sys.executable, "-m", "venv", ".venv"], check=True)
            print("Virtual environment created successfully.")
        except Exception as e:
            print(f"Error creating virtual environment: {e}")
            sys.exit(1)
            
    # Locate virtual environment binaries based on OS
    if os.name == "nt":
        python_exe = os.path.join(venv_dir, "Scripts", "python.exe")
        pip_exe = os.path.join(venv_dir, "Scripts", "pip.exe")
    else:
        python_exe = os.path.join(venv_dir, "bin", "python")
        pip_exe = os.path.join(venv_dir, "bin", "pip")
        
    # 2. Install requirements
    print("\nInstalling & updating backend dependencies...")
    try:
        subprocess.run([python_exe, "-m", "pip", "install", "--upgrade", "pip"], check=True)
        subprocess.run([python_exe, "-m", "pip", "install", "-r", "requirements.txt"], check=True)
        print("Dependencies installed successfully.")
    except Exception as e:
        print(f"Error installing dependencies: {e}")
        sys.exit(1)
        
    # 3. Quick .env configurations validation
    env_path = os.path.join(base_dir, ".env")
    port = 8000
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            lines = f.readlines()
            for line in lines:
                if line.strip().startswith("PORT="):
                    try:
                        port = int(line.split("=")[1].strip())
                    except ValueError:
                        pass
                if "<db_username>" in line or "<db_password>" in line:
                    print("\n[WARNING] It looks like you still have placeholder values in your '.env' file.")
                    print("Please open the '.env' file in your editor and replace the placeholder text with your actual MongoDB credentials.")
    
    # 4. Start ASGI Application Server
    print(f"\n=======================================================")
    print(f" Starting Prince Form Server on http://localhost:{port}")
    print(f" Open http://localhost:{port} in your browser to build forms.")
    print(f" Press Ctrl+C to stop the server.")
    print(f"=======================================================\n")
    
    try:
        subprocess.run([python_exe, "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", str(port), "--reload"])
    except KeyboardInterrupt:
        print("\nStopping Prince Form Server...")
    except Exception as e:
        print(f"Server execution error: {e}")

if __name__ == "__main__":
    main()
