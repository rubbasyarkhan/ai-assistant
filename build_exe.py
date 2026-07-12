import os
import shutil
import subprocess
import sys

def build():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(base_dir, "frontend")
    dist_dir = os.path.join(frontend_dir, "dist")
    static_dir = os.path.join(base_dir, "app", "static")
    venv_pyinstaller = os.path.join(base_dir, "venv", "Scripts", "pyinstaller.exe")
    
    print("[JARVIS Builder] Starting compilation sequence...")

    # 1. Build React frontend
    print("[JARVIS Builder] Step 1: Compiling React JARVIS UI via Vite...")
    try:
        subprocess.run("npm run build", cwd=frontend_dir, shell=True, check=True)
    except subprocess.CalledProcessError as e:
        print(f"[JARVIS Builder] Error: Frontend compilation failed. {e}")
        sys.exit(1)

    # 2. Copy build assets to Python static folder
    print(f"[JARVIS Builder] Step 2: Copying build assets from {dist_dir} to {static_dir}...")
    if os.path.exists(static_dir):
        shutil.rmtree(static_dir)
    shutil.copytree(dist_dir, static_dir)

    # 3. Compile standalone executable using PyInstaller
    print("[JARVIS Builder] Step 3: Compiling Python & assets with PyInstaller...")
    pyinstaller_cmd = [
        "pyinstaller",
        "--clean",
        "--noconfirm",
        "--onefile",
        "--windowed",
        "--add-data", "app;app", # copies app folder contents
        "--name", "JarvisOS",
        "app/main.py"
    ]
    
    # Use venv's PyInstaller if available
    if os.path.exists(venv_pyinstaller):
        pyinstaller_cmd[0] = venv_pyinstaller
        print(f"[JARVIS Builder] Using virtual environment PyInstaller: {venv_pyinstaller}")
    else:
        print("[JARVIS Builder] Virtual environment PyInstaller not found. Falling back to global pyinstaller...")

    try:
        subprocess.run(pyinstaller_cmd, cwd=base_dir, check=True)
        print("\n" + "="*50)
        print("[JARVIS Builder] SUCCESS: JARVIS OS core compiled successfully!")
        print(f"[JARVIS Builder] Executable location: {os.path.join(base_dir, 'dist', 'JarvisOS.exe')}")
        print("="*50)
    except subprocess.CalledProcessError as e:
        print(f"[JARVIS Builder] Error: PyInstaller compilation failed. {e}")
        sys.exit(1)

if __name__ == "__main__":
    build()
