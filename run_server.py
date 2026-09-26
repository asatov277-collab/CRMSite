import sys
import os
import time
import socket
import threading
import webbrowser
import uvicorn

script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(script_dir, "backend")

# Ensure backend is on sys.path
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Reconfigure stdout/stderr encoding for Windows console compatibility
if hasattr(sys.stdout, 'reconfigure') and sys.stdout is not None:
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
if hasattr(sys.stderr, 'reconfigure') and sys.stderr is not None:
    try:
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

def get_local_ip():
    """Detect local LAN IP address"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.5)
        s.connect(('8.8.8.8', 1))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def kill_existing_port_8000():
    """Safely terminate any process already occupying port 8000 on Windows"""
    if sys.platform == "win32":
        try:
            import subprocess
            cmd = 'powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique"'
            output = subprocess.check_output(cmd, shell=True, text=True).strip()
            if output:
                for pid_str in output.splitlines():
                    pid_str = pid_str.strip()
                    if pid_str.isdigit() and int(pid_str) != os.getpid():
                        if sys.stdout:
                            print(f"[*] Port 8000 dagi eski jarayon (PID: {pid_str}) to'xtatilmoqda...")
                        subprocess.run(f"taskkill /F /PID {pid_str}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                time.sleep(0.5)
        except Exception:
            pass

def open_browser():
    time.sleep(1.8)
    try:
        webbrowser.open("http://localhost:8000")
    except Exception:
        pass

def run():
    kill_existing_port_8000()

    local_ip = get_local_ip()

    if sys.stdout is not None:
        print("=" * 66)
        print("  🏛️  WESTMINSTER CRM EDUCATIONAL CENTER - PRODUCTION SERVER")
        print("=" * 66)
        print(f"  [1] Ushbu kompyuterda kirish : http://localhost:8000")
        print(f"  [2] Bir xil Wi-Fi dagi barcha : http://{local_ip}:8000")
        print(f"  [3] Internet (Tashqi tarmoq) : INTERNETGA_ULASHISH.bat ni bosing")
        print("=" * 66)
        print("\n[1/2] Ma'lumotlar bazasi tekshirilmoqda...")

    # Run database initialization
    try:
        import database
        database.init_db()
        if sys.stdout is not None:
            print("  ✓ Ma'lumotlar bazasi tayyor!")
    except Exception as e:
        if sys.stdout is not None:
            print(f"  Bazani yuklash eslatmasi: {e}")

    if sys.stdout is not None:
        print("\n[2/2] Server ishga tushirilmoqda (FastAPI + Uvicorn)...")
        print("  -> Brauzeringizda tizim ochilmoqda...")

    # Auto open browser
    threading.Thread(target=open_browser, daemon=True).start()

    # Launch uvicorn directly
    os.chdir(backend_dir)
    from main import app
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")

if __name__ == "__main__":
    run()
