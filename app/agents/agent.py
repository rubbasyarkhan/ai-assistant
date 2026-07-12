import os
import sys
from google import genai
from google.genai import types

# Add the project root to sys.path to resolve imports cleanly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.agents import tools

JARVIS_SYSTEM_INSTRUCTION = """You are JARVIS, a highly advanced artificial intelligence and personal assistant, reminiscent of the AI from Iron Man. Speak with a refined, respectful, slightly British, and tech-savvy persona. Your tone should be helpful, sophisticated, and occasionally witty.

You have access to tools that can control the host machine, write/read/modify files (including Word, Excel, PDF), take screenshots, click/type on the screen, download files, install programs via winget, set alarms, manage the calendar, and run code using the Antigravity agent core.

Always choose the appropriate tool for user actions. When you complete an action, summarize the outcome in a concise, conversational manner suitable for Text-to-Speech playback. 
Keep your verbal replies relatively short and direct. If you need to print a long list of items, state that you have listed them, and let the UI display it.
"""

# Map function names to their python implementations
TOOL_MAPPING = {
    "open_url": tools.open_url,
    "web_search": tools.web_search,
    "list_files": tools.list_files,
    "read_text_file": tools.read_text_file,
    "write_text_file": tools.write_text_file,
    "modify_text_file": tools.modify_text_file,
    "create_word_document": tools.create_word_document,
    "create_excel_spreadsheet": tools.create_excel_spreadsheet,
    "create_pdf_document": tools.create_pdf_document,
    "run_command": tools.run_command,
    "desktop_screenshot": tools.desktop_screenshot,
    "desktop_click": tools.desktop_click,
    "desktop_type": tools.desktop_type,
    "desktop_press_keys": tools.desktop_press_keys,
    "download_url": tools.download_url,
    "install_app": tools.install_app,
    "set_alarm": tools.set_alarm,
    "add_calendar_event": tools.add_calendar_event,
    "interact_with_antigravity": tools.interact_with_antigravity
}

# Declarations list for Gemini API
GEMINI_TOOLS_LIST = [
    tools.open_url,
    tools.web_search,
    tools.list_files,
    tools.read_text_file,
    tools.write_text_file,
    tools.modify_text_file,
    tools.create_word_document,
    tools.create_excel_spreadsheet,
    tools.create_pdf_document,
    tools.run_command,
    tools.desktop_screenshot,
    tools.desktop_click,
    tools.desktop_type,
    tools.desktop_press_keys,
    tools.download_url,
    tools.install_app,
    tools.set_alarm,
    tools.add_calendar_event,
    tools.interact_with_antigravity
]

class JarvisAgent:
    def __init__(self, api_key=None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
        self.client = None
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
            
    def update_key(self, api_key):
        self.api_key = api_key
        self.client = genai.Client(api_key=api_key)

    def process_query(self, query: str, log_callback=None) -> str:
        """Processes the query using Gemini, resolves any function calls, and returns final text."""
        if not self.client:
            # Check if key is available in env now
            self.api_key = os.environ.get("GEMINI_API_KEY")
            if not self.api_key:
                return "JARVIS: Sir, I require a Gemini API Key to function. Please provide it in the system settings panel."
            self.client = genai.Client(api_key=self.api_key)
            
        try:
            # Initial prompt to Gemini
            config = types.GenerateContentConfig(
                system_instruction=JARVIS_SYSTEM_INSTRUCTION,
                tools=GEMINI_TOOLS_LIST,
                temperature=0.7
            )
            
            if log_callback:
                log_callback("Querying JARVIS intelligence core...")
                
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=query,
                config=config
            )
            
            # Loop to handle function execution (Gemini may chain multiple function calls)
            # Limit loop count to prevent infinite cycles
            for loop_count in range(5):
                # Check if model requested a tool call
                function_calls = response.function_calls
                if not function_calls:
                    break
                    
                tool_responses = []
                for call in function_calls:
                    func_name = call.name
                    func_args = call.args
                    
                    if log_callback:
                        log_callback(f"Executing protocol: {func_name} with arguments {dict(func_args)}")
                        
                    # Execute tool function
                    if func_name in TOOL_MAPPING:
                        try:
                            # Arguments from Gemini are dict-like objects
                            result = TOOL_MAPPING[func_name](**func_args)
                        except Exception as e:
                            result = f"Error during execution: {str(e)}"
                    else:
                        result = f"Error: Tool '{func_name}' is not registered."
                        
                    if log_callback:
                        log_callback(f"Protocol response: {result}")
                        
                    # Prepare function response content block
                    tool_responses.append(
                        types.Part.from_function_response(
                            name=func_name,
                            response={'result': result}
                        )
                    )
                
                # Send the function execution results back to Gemini
                # We need to pass the conversation history
                history = [
                    types.Content(role='user', parts=[types.Part.from_text(text=query)]),
                    response.candidates[0].content, # Model's tool request
                    types.Content(role='tool', parts=tool_responses) # Tool execution replies
                ]
                
                response = self.client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=history,
                    config=config
                )
                
            # Return final text content
            return response.text or "Sir, I have completed the request but have no verbal report."
            
        except Exception as e:
            return f"JARVIS Diagnostics Error: {str(e)}"
