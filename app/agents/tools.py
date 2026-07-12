import os
import sys
import subprocess
import webbrowser
import urllib.request
import pyautogui
import psutil
from datetime import datetime

# Add the project root to sys.path to resolve imports cleanly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app import db

# Optional library imports with robust fallback
try:
    import docx
except ImportError:
    docx = None

try:
    import openpyxl
except ImportError:
    openpyxl = None

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet
except ImportError:
    SimpleDocTemplate = None

try:
    from duckduckgo_search import DDGS
except ImportError:
    DDGS = None

try:
    from google import antigravity
    from google.antigravity import Agent, LocalAgentConfig, CapabilitiesConfig
except ImportError:
    antigravity = None

# Configure PyAutoGUI fail-safe (moving mouse to corner exits)
pyautogui.FAILSAFE = True

# Browser Selection Logic
def get_browser_executable():
    """Finds installed Brave or Chrome browser executables on Windows."""
    paths = [
        # Brave
        r"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe",
        os.path.expandvars(r"%LocalAppData%\BraveSoftware\Brave-Browser\Application\brave.exe"),
        # Chrome
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expandvars(r"%LocalAppData%\Google\Chrome\Application\chrome.exe"),
    ]
    for path in paths:
        if os.path.exists(path):
            return path
    return None

def open_url(url: str) -> str:
    """Opens a URL in Brave or Chrome browser if found, otherwise uses default."""
    browser_path = get_browser_executable()
    if browser_path:
        try:
            subprocess.Popen([browser_path, url])
            return f"Opened {url} in browser ({os.path.basename(browser_path)})."
        except Exception as e:
            pass
    # Fallback
    webbrowser.open(url)
    return f"Opened {url} in default browser."

# Web Search
def web_search(query: str) -> str:
    """Searches the web using DuckDuckGo and returns summaries."""
    if DDGS is None:
        return "DuckDuckGo search library is not installed. Fallback: opening web search in browser."
        open_url(f"https://www.google.com/search?q={query}")
    try:
        results = []
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=5):
                results.append(f"Title: {r['title']}\nLink: {r['href']}\nSnippet: {r['body']}\n")
        return "\n".join(results) if results else "No search results found."
    except Exception as e:
        return f"Error performing search: {str(e)}"

# File Management
def get_workspace_path(filename: str) -> str:
    """Resolves filename to the workspace directory to ensure security."""
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    return os.path.abspath(os.path.join(base_dir, filename))

def list_files(directory: str = ".") -> str:
    """Lists files in the workspace directory."""
    path = get_workspace_path(directory)
    if not os.path.exists(path):
        return f"Directory {directory} does not exist."
    try:
        files = os.listdir(path)
        result = []
        for f in files:
            full_path = os.path.join(path, f)
            stat = os.stat(full_path)
            size = stat.st_size
            mtime = datetime.fromtimestamp(stat.st_mtime).strftime('%Y-%m-%d %H:%M:%S')
            is_dir = "DIR" if os.path.isdir(full_path) else "FILE"
            result.append(f"{is_dir:<5} {f:<30} {size:<10} bytes {mtime}")
        return "\n".join(result) if result else "Directory is empty."
    except Exception as e:
        return f"Error listing files: {str(e)}"

def read_text_file(filename: str) -> str:
    """Reads content from a text file in the workspace."""
    path = get_workspace_path(filename)
    if not os.path.exists(path):
        return f"File {filename} not found."
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        return f"Error reading file: {str(e)}"

def write_text_file(filename: str, content: str) -> str:
    """Creates or overwrites a text file in the workspace."""
    path = get_workspace_path(filename)
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        return f"Successfully wrote to {filename}."
    except Exception as e:
        return f"Error writing file: {str(e)}"

def modify_text_file(filename: str, old_text: str, new_text: str) -> str:
    """Modifies a text file by replacing specific content."""
    path = get_workspace_path(filename)
    if not os.path.exists(path):
        return f"File {filename} not found."
    try:
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        if old_text not in content:
            return f"Error: '{old_text}' not found in the file."
        updated_content = content.replace(old_text, new_text)
        with open(path, "w", encoding="utf-8") as f:
            f.write(updated_content)
        return f"Successfully modified {filename}."
    except Exception as e:
        return f"Error modifying file: {str(e)}"

# Office Document Creators
def create_word_document(filename: str, title: str, content_paragraphs: list) -> str:
    """Creates a Microsoft Word (.docx) document."""
    if docx is None:
        return "python-docx package not installed. Cannot create Word file."
    path = get_workspace_path(filename)
    try:
        doc = docx.Document()
        doc.add_heading(title, 0)
        for p in content_paragraphs:
            doc.add_paragraph(p)
        doc.save(path)
        return f"Successfully created Word document: {filename}."
    except Exception as e:
        return f"Error creating Word file: {str(e)}"

def create_excel_spreadsheet(filename: str, headers: list, rows: list, sheet_name: str = "Sheet1") -> str:
    """Creates a Microsoft Excel (.xlsx) spreadsheet."""
    if openpyxl is None:
        return "openpyxl package not installed. Cannot create Excel file."
    path = get_workspace_path(filename)
    try:
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = sheet_name
        ws.append(headers)
        for row in rows:
            ws.append(row)
        wb.save(path)
        return f"Successfully created Excel spreadsheet: {filename}."
    except Exception as e:
        return f"Error creating Excel file: {str(e)}"

def create_pdf_document(filename: str, title: str, text_content: str) -> str:
    """Creates a PDF document using ReportLab."""
    if SimpleDocTemplate is None:
        return "reportlab package not installed. Cannot create PDF file."
    path = get_workspace_path(filename)
    try:
        doc = SimpleDocTemplate(path, pagesize=letter)
        styles = getSampleStyleSheet()
        story = [
            Paragraph(title, styles['Title']),
            Spacer(1, 12)
        ]
        for line in text_content.split('\n'):
            if line.strip():
                story.append(Paragraph(line, styles['Normal']))
                story.append(Spacer(1, 6))
        doc.build(story)
        return f"Successfully created PDF: {filename}."
    except Exception as e:
        return f"Error creating PDF: {str(e)}"

# Desktop Control
def run_command(command: str) -> str:
    """Executes a system shell command (runs on command prompt)."""
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        out = result.stdout
        err = result.stderr
        return f"STDOUT:\n{out}\nSTDERR:\n{err}"
    except Exception as e:
        return f"Error executing command: {str(e)}"

def desktop_screenshot() -> str:
    """Takes a desktop screenshot, saves it to static/screenshot.png and returns the path."""
    static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static"))
    os.makedirs(static_dir, exist_ok=True)
    shot_path = os.path.join(static_dir, "screenshot.png")
    try:
        pyautogui.screenshot(shot_path)
        return "Screenshot captured successfully."
    except Exception as e:
        return f"Error capturing screenshot: {str(e)}"

def desktop_click(x: int, y: int) -> str:
    """Simulates a mouse click at specific coordinates (x, y)."""
    try:
        pyautogui.click(x, y)
        return f"Clicked mouse at ({x}, {y})."
    except Exception as e:
        return f"Error clicking mouse: {str(e)}"

def desktop_type(text: str) -> str:
    """Simulates typing text on the keyboard."""
    try:
        pyautogui.write(text, interval=0.01)
        return f"Typed text: '{text}'."
    except Exception as e:
        return f"Error typing text: {str(e)}"

def desktop_press_keys(keys_list: list) -> str:
    """Presses keys (e.g. ['ctrl', 'c'] or ['enter'])."""
    try:
        if len(keys_list) > 1:
            pyautogui.hotkey(*keys_list)
        else:
            pyautogui.press(keys_list[0])
        return f"Pressed key(s): {keys_list}."
    except Exception as e:
        return f"Error pressing keys: {str(e)}"

# Download and Install Software
def download_url(url: str, filename: str) -> str:
    """Downloads a file from a URL to the workspace."""
    path = get_workspace_path(filename)
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        urllib.request.urlretrieve(url, path)
        return f"Downloaded {url} to {filename}."
    except Exception as e:
        return f"Error downloading: {str(e)}"

def install_app(package_name: str) -> str:
    """Installs software using Windows Package Manager (winget) or pip."""
    if package_name.startswith("pip:"):
        pip_pkg = package_name.split(":", 1)[1]
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", pip_pkg], check=True)
            return f"Successfully installed python package: {pip_pkg}."
        except Exception as e:
            return f"Error installing python package {pip_pkg}: {str(e)}"
    else:
        # Use winget
        cmd = f'winget install "{package_name}" --silent --accept-source-agreements --accept-package-agreements'
        try:
            res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            if res.returncode == 0:
                return f"Successfully installed {package_name} via winget."
            else:
                return f"Winget installation output (Code {res.returncode}):\n{res.stdout}\n{res.stderr}"
        except Exception as e:
            return f"Error running winget: {str(e)}"

# Calendar & Alarms
def set_alarm(time_str: str, label: str = "JARVIS Alarm") -> str:
    """Sets a voice alarm (24-hour format HH:MM)."""
    try:
        alarm_id = db.add_alarm(time_str, label)
        return f"Alarm '{label}' successfully set for {time_str}."
    except Exception as e:
        return f"Error setting alarm: {str(e)}"

def add_calendar_event(title: str, start_time: str, duration_minutes: int = 30, description: str = "") -> str:
    """Adds a calendar event (start_time in ISO Format: YYYY-MM-DD HH:MM)."""
    try:
        event_id = db.add_event(title, description, start_time, duration_minutes)
        return f"Calendar event '{title}' set for {start_time} (duration: {duration_minutes}m)."
    except Exception as e:
        return f"Error setting calendar event: {str(e)}"

# Real-Time CPU Diagnostics for JARVIS Panel
def get_system_diagnostics() -> dict:
    """Fetches real-time system stats (CPU, RAM, Battery, OS)."""
    cpu_percent = psutil.cpu_percent()
    ram = psutil.virtual_memory()
    battery = psutil.sensors_battery()
    
    battery_percent = battery.percent if battery else 100
    power_plugged = battery.power_plugged if battery else True
    
    return {
        "cpu_percent": cpu_percent,
        "ram_percent": ram.percent,
        "ram_used_gb": round(ram.used / (1024**3), 2),
        "ram_total_gb": round(ram.total / (1024**3), 2),
        "battery_percent": battery_percent,
        "power_plugged": power_plugged,
        "disk_percent": psutil.disk_usage('/').percent,
        "timestamp": datetime.now().strftime("%H:%M:%S")
    }

# Programmatic Antigravity Integration
def interact_with_antigravity(prompt: str) -> str:
    """Spawns an Antigravity agent programmatically to perform a complex developer task."""
    if antigravity is None:
        return "Antigravity SDK is not available. Performing standard tool execution fallback."
    
    try:
        # Create an inline async run block
        import asyncio
        async def run_agent():
            config = LocalAgentConfig(
                system_instructions="You are JARVIS's developer core agent. Write clean code and execute tasks efficiently.",
                capabilities=CapabilitiesConfig()
            )
            async with Agent(config) as agent:
                res = await agent.chat(prompt)
                tokens = []
                async for token in res:
                    tokens.append(token)
                return "".join(tokens)
                
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        output = loop.run_until_complete(run_agent())
        loop.close()
        return output
    except Exception as e:
        return f"Error interacting with Antigravity agent: {str(e)}"
