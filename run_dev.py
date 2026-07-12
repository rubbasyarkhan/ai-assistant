import subprocess
import time
import sys
import os
import signal

def run_dev():
    print("[JARVIS Dev Launcher] Booting Dev Systems...")
    
    # Path setup
    base_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(base_dir, "frontend")
    venv_python = os.path.join(base_dir, "venv", "Scripts", "python.exe")
    if not os.path.exists(venv_python):
        venv_python = "python" # fallback to global python if venv not found
        
    print(f"[JARVIS Dev Launcher] 1. Launching Vite frontend dev server in {frontend_dir}...")
    # Launch Vite in background
    # Use shell=True for windows to run npm.cmd
    vite_proc = subprocess.Popen(
        "npm run dev", 
        cwd=frontend_dir, 
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    # Wait for Vite dev server to bind (usually takes ~1.5s)
    time.sleep(3)
    
    print("[JARVIS Dev Launcher] 2. Spawning PyWebview Python backend wrapper...")
    # Launch python app with --dev flag
    try:
        backend_proc = subprocess.run([venv_python, "app/main.py", "--dev"], cwd=base_dir)
        print("[JARVIS Dev Launcher] PyWebview window closed.")
    except KeyboardInterrupt:
        print("[JARVIS Dev Launcher] Interrupt received.")
    finally:
        print("[JARVIS Dev Launcher] 3. Cleaning up dev servers...")
        # Terminate Vite process tree on Windows
        if os.name == 'nt':
            subprocess.run(f"taskkill /F /T /PID {vite_proc.pid}", shell=True, capture_output=True)
        else:
            vite_proc.terminate()
        print("[JARVIS Dev Launcher] Dev environment teardown complete.")

if __name__ == "__main__":
    run_dev()
