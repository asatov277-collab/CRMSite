import subprocess
import sys
import os
import time
import threading
import webbrowser

# Reconfigure stdout/stderr encoding for Windows console compatibility
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
if hasattr(sys.stderr, 'reconfigure'):
    try:
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

def open_browser():
    time.sleep(1.5)
    try:
        webbrowser.open("http://localhost:8000")
    except Exception:
        pass

def run():
    print("=" * 60)
    print("  WESTMINSTER CRM EDUCATIONAL CENTER SERVER")
    print("=" * 60)

    # Ensure working directory is set to script location
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    backend_dir = os.path.join(script_dir, "backend")
    
    # Run database initialization
    print("\n[1/2] Database checking & seeding...")
    try:
        subprocess.run([sys.executable, "database.py"], cwd=backend_dir, check=True)
    except Exception as e:
        print(f"Database initialization note/error: {e}")

    print("\n[2/2] Launching FastAPI server on http://localhost:8000 ...")
    print("-> Brauzer avtomatik ravishda ochiladi...")
    
    # Auto open browser
    threading.Thread(target=open_browser, daemon=True).start()

    cmd = [sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
    
    try:
        subprocess.run(cmd, cwd=backend_dir)
    except KeyboardInterrupt:
        print("\nServer to'xtatildi.")

if __name__ == "__main__":
    run()
