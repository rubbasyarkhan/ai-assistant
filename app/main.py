import os
import sys
import json
import webview
import threading
import time

try:
    from app import db
    from app.agents import agent, tools
except ImportError:
    import db
    import agents.agent as agent
    import agents.tools as tools

# Define PyWebview JavaScript API Bridge
class JarvisAPI:
    def __init__(self, window_ref, jarvis_agent):
        self._window = window_ref
        self._agent = jarvis_agent
        self._logs = []

    def log(self, message):
        """Append log message and send it to the UI in real-time."""
        timestamp = time.strftime("%H:%M:%S")
        log_entry = f"[{timestamp}] {message}"
        self._logs.append(log_entry)
        # Safely evaluate JS on the main thread
        try:
            self._window.evaluate_js(f"window.appendTelemetryLog({json.dumps(log_entry)})")
        except Exception:
            pass

    def process_speech(self, query):
        """Processes the voice query through Gemini."""
        self.log(f"User: {query}")
        
        # Define callback to stream function executions
        def log_cb(msg):
            self.log(msg)
            
        reply = self._agent.process_query(query, log_callback=log_cb)
        self.log(f"JARVIS: {reply}")
        return reply

    def get_diagnostics(self):
        """Fetches real-time system stats (CPU, RAM, etc.)."""
        try:
            stats = tools.get_system_diagnostics()
            return stats
        except Exception as e:
            return {"error": str(e)}

    # Database: Calendar
    def list_calendar_events(self):
        return db.list_events()

    def add_calendar_event(self, title, description, start_time, duration_minutes):
        try:
            db.add_event(title, description, start_time, duration_minutes)
            self.log(f"Protocol: Event '{title}' added to database.")
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def delete_calendar_event(self, event_id):
        try:
            db.delete_event(event_id)
            self.log(f"Protocol: Event {event_id} deleted.")
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    # Database: Alarms
    def list_alarms(self):
        return db.list_alarms()

    def add_alarm(self, time_str, label):
        try:
            db.add_alarm(time_str, label)
            self.log(f"Protocol: Alarm set for {time_str} ({label}).")
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def toggle_alarm(self, alarm_id, is_active):
        db.toggle_alarm(alarm_id, is_active)
        state = "activated" if is_active else "deactivated"
        self.log(f"Protocol: Alarm {alarm_id} {state}.")
        return {"success": True}

    def delete_alarm(self, alarm_id):
        db.delete_alarm(alarm_id)
        self.log(f"Protocol: Alarm {alarm_id} deleted.")
        return {"success": True}

    # Workspace Files
    def get_workspace_files(self):
        try:
            base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
            files = os.listdir(base_dir)
            file_list = []
            for f in files:
                full_path = os.path.join(base_dir, f)
                # Filter out system and build directories
                if f in ["venv", "__pycache__", "frontend", "build", "dist", "app", "jarvis.db", ".git", ".github", ".agents"]:
                    continue
                if os.path.isfile(full_path):
                    stat = os.stat(full_path)
                    file_list.append({
                        "name": f,
                        "size": stat.st_size,
                        "mtime": datetime_str(stat.st_mtime),
                        "type": "file"
                    })
                elif os.path.isdir(full_path):
                    file_list.append({
                        "name": f,
                        "type": "directory"
                    })
            return file_list
        except Exception as e:
            return []

    # Settings API
    def set_api_key(self, api_key):
        os.environ["GEMINI_API_KEY"] = api_key
        self._agent.update_key(api_key)
        self.log("System config updated: Gemini API Key registered.")
        return {"success": True}

    def has_api_key(self):
        # Return True/False if key exists
        return bool(self._agent.api_key)

def datetime_str(timestamp):
    return time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(timestamp))

def start_app():
    # 1. Initialize SQLite Database
    db.init_db()

    # 2. Setup Jarvis LLM Agent
    jarvis_agent = agent.JarvisAgent()

    # 3. Choose entry URL (Dev Server vs Compiled Assets)
    is_dev = "--dev" in sys.argv
    if is_dev:
        entry_url = "http://localhost:5173"
    else:
        # Resolve path to built HTML index file
        base_dir = os.path.dirname(os.path.abspath(__file__))
        entry_url = os.path.join(base_dir, "static", "index.html")
        if not os.path.exists(entry_url):
            # Fallback if UI is not yet built
            entry_url = "data:text/html,<html><body style='background:#0d0e15;color:#00f0ff;font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;'><h2>JARVIS UI assets not found. Run npm build and place in app/static.</h2></body></html>"

    # 4. Create Webview Window
    # Size 1280x768, frameless option if desired, or standard window
    window = webview.create_window(
        title="Nexus JARVIS OS v1.0",
        url=entry_url,
        width=1280,
        height=800,
        min_size=(1024, 768),
        background_color="#0b0c10"
    )

    # 5. Connect API bridge
    api_bridge = JarvisAPI(window, jarvis_agent)
    window.js_api = api_bridge

    # 6. Setup Alarm Monitor Thread Callback
    def alarm_callback(alarm_dict):
        # Push notification to the React window
        try:
            window.evaluate_js(f"window.triggerAlarm({json.dumps(alarm_dict)})")
        except Exception:
            pass

    alarm_thread = db.AlarmMonitor(alarm_callback)
    alarm_thread.start()

    # 7. Start Webview Gui Loop
    try:
        webview.start(debug=is_dev)
    finally:
        # Ensure thread closes on exit
        alarm_thread.stop()

if __name__ == "__main__":
    start_app()
