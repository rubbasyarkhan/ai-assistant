import sqlite3
import time
import os
import threading
from datetime import datetime

appdata = os.environ.get("APPDATA", os.path.expanduser("~"))
db_dir = os.path.join(appdata, "NexusJarvis")
os.makedirs(db_dir, exist_ok=True)
DB_PATH = os.path.join(db_dir, "jarvis.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Create Calendar Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS calendar (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            start_time TEXT NOT NULL, -- ISO Format: YYYY-MM-DD HH:MM
            duration_minutes INTEGER DEFAULT 30
        )
    """)
    
    # Create Alarms Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS alarms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            time_str TEXT NOT NULL, -- HH:MM format
            label TEXT,
            is_active INTEGER DEFAULT 1
        )
    """)
    
    conn.commit()
    conn.close()

# Calendar Operations
def add_event(title, description, start_time, duration_minutes=30):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO calendar (title, description, start_time, duration_minutes) VALUES (?, ?, ?, ?)",
        (title, description, start_time, int(duration_minutes))
    )
    conn.commit()
    event_id = cursor.lastrowid
    conn.close()
    return event_id

def list_events():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM calendar ORDER BY start_time ASC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def delete_event(event_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM calendar WHERE id = ?", (event_id,))
    conn.commit()
    conn.close()
    return True

# Alarm Operations
def add_alarm(time_str, label="JARVIS Alarm"):
    # Ensure correct format (HH:MM)
    try:
        datetime.strptime(time_str, "%H:%M")
    except ValueError:
        raise ValueError("Alarm time must be in HH:MM format (24-hour)")
        
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO alarms (time_str, label, is_active) VALUES (?, ?, 1)",
        (time_str, label)
    )
    conn.commit()
    alarm_id = cursor.lastrowid
    conn.close()
    return alarm_id

def list_alarms():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM alarms ORDER BY time_str ASC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def toggle_alarm(alarm_id, is_active):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE alarms SET is_active = ? WHERE id = ?", (int(is_active), alarm_id))
    conn.commit()
    conn.close()
    return True

def delete_alarm(alarm_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM alarms WHERE id = ?", (alarm_id,))
    conn.commit()
    conn.close()
    return True

# Background Alarm Monitor
class AlarmMonitor(threading.Thread):
    def __init__(self, callback_func):
        super().__init__()
        self.callback = callback_func
        self.daemon = True
        self.running = True
        
    def run(self):
        last_checked_minute = ""
        while self.running:
            now = datetime.now()
            current_time = now.strftime("%H:%M")
            
            # Avoid triggering multiple times in the same minute
            if current_time != last_checked_minute:
                conn = get_connection()
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM alarms WHERE time_str = ? AND is_active = 1", (current_time,))
                triggered_alarms = cursor.fetchall()
                conn.close()
                
                for alarm in triggered_alarms:
                    # Execute callback (which will evaluate Javascript in the WebView)
                    self.callback(dict(alarm))
                    
                last_checked_minute = current_time
            time.sleep(10)
            
    def stop(self):
        self.running = False
