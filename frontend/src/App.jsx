import React, { useState, useEffect, useRef } from 'react';
import { Settings, Volume2, Mic, Play, RefreshCw, X, Radio } from 'lucide-react';
import ArcReactor from './components/ArcReactor';
import DiagnosticPanel from './components/DiagnosticPanel';
import VaultPanel from './components/VaultPanel';
import CalendarPanel from './components/CalendarPanel';
import TerminalLogs from './components/TerminalLogs';
import { playSound } from './utils/sound';
import './styles/jarvis.css';

export default function App() {
  const [isWoken, setIsWoken] = useState(false);
  const [agentState, setAgentState] = useState('idle'); // idle, listening, thinking, speaking, error
  const [transcript, setTranscript] = useState('JARVIS Core offline. Press WAKE UP to initialize.');
  const [telemetryLogs, setTelemetryLogs] = useState([]);
  const [files, setFiles] = useState([]);
  const [alarms, setAlarms] = useState([]);
  const [events, setEvents] = useState([]);
  const [diagnostics, setDiagnostics] = useState(null);
  
  // Settings
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en-US');
  const [voicesList, setVoicesList] = useState([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState('');

  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);

  // Initialize Speech Recognition
  const initSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      appendLog("Error: Browser speech recognition is not supported.");
      return;
    }
    
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = selectedLang;

    rec.onstart = () => {
      isListeningRef.current = true;
      setAgentState('listening');
      setTranscript('Awaiting voice protocol...');
      playSound('ping');
    };

    rec.onresult = async (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      
      // Send query to python backend
      if (text.trim()) {
        try {
          setAgentState('thinking');
          appendLog(`Voice Input Recognized: "${text}"`);
          
          if (window.pywebview && window.pywebview.api) {
            const reply = await window.pywebview.api.processSpeech(text);
            speakResponse(reply);
          } else {
            // Demo Mode fallback
            setTimeout(() => {
              const fallbackReply = `Sir, I received your query: "${text}". However, the Python Core link is currently offline.`;
              speakResponse(fallbackReply);
            }, 1000);
          }
        } catch (err) {
          setAgentState('error');
          playSound('error');
          setTranscript(`Error: ${err.message}`);
          appendLog(`Error during speech processing: ${err.message}`);
        }
      }
    };

    rec.onerror = (event) => {
      // Don't flag error on simple no-speech aborts
      if (event.error !== 'no-speech') {
        setAgentState('error');
        playSound('error');
        setTranscript(`Recognition Protocol Fault: ${event.error}`);
        appendLog(`Speech recognition error: ${event.error}`);
      } else {
        setAgentState('idle');
        setTranscript('Voice command aborted. Standby.');
      }
    };

    rec.onend = () => {
      isListeningRef.current = false;
      if (agentState === 'listening') {
        setAgentState('idle');
      }
    };

    recognitionRef.current = rec;
  };

  // Speaks response text using Web Speech Synthesis
  const speakResponse = (text) => {
    if (!window.speechSynthesis) {
      setAgentState('idle');
      setTranscript(text);
      return;
    }

    // Cancel any active speech
    window.speechSynthesis.cancel();

    // Remove markdown symbols for clean reading
    const cleanText = text.replace(/[*#`_\-]/g, '').replace(/JARVIS:/i, '');
    setTranscript(cleanText);
    setAgentState('speaking');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = selectedLang;

    // Apply voice
    if (selectedVoiceName) {
      const voice = window.speechSynthesis.getVoices().find(v => v.name === selectedVoiceName);
      if (voice) utterance.voice = voice;
    } else {
      // Try to find a male English/default voice to sound like JARVIS
      const voices = window.speechSynthesis.getVoices();
      const jarvisVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('David') || v.name.includes('Google US English Male') || v.name.includes('Microsoft David') || v.name.includes('Natural') || v.name.includes('male') || v.name.includes('Great Britain')));
      if (jarvisVoice) utterance.voice = jarvisVoice;
    }

    utterance.onend = () => {
      setAgentState('idle');
      playSound('success');
    };

    utterance.onerror = (e) => {
      setAgentState('error');
      playSound('error');
      appendLog(`Speech synthesis error: ${e.error}`);
    };

    window.speechSynthesis.speak(utterance);
  };

  const startVoiceListening = () => {
    playSound('click');
    if (isListeningRef.current) {
      recognitionRef.current.abort();
    } else {
      if (!recognitionRef.current) {
        initSpeechRecognition();
      }
      try {
        recognitionRef.current.lang = selectedLang;
        recognitionRef.current.start();
      } catch (e) {
        appendLog(`Speech start fault: ${e.message}`);
      }
    }
  };

  // Append logs
  const appendLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setTelemetryLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // Wake Up sequence (unlocks AudioContext and initializes)
  const handleWakeUp = () => {
    setIsWoken(true);
    playSound('startup');
    setTranscript('JARVIS Systems Online. Awaiting voice protocol.');
    appendLog('JARVIS Core boot sequence completed successfully.');
    appendLog('All telemetry links ONLINE.');
    
    // Load voices
    if (window.speechSynthesis) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setVoicesList(voices);
      };
      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }

    // Sync variables immediately
    syncData();
  };

  // Sync data with Python Backend
  const syncData = async () => {
    if (!window.pywebview || !window.pywebview.api) return;
    try {
      const filesList = await window.pywebview.api.getWorkspaceFiles();
      setFiles(filesList);

      const alarmsList = await window.pywebview.api.listAlarms();
      setAlarms(alarmsList);

      const eventsList = await window.pywebview.api.listCalendarEvents();
      setEvents(eventsList);

      const keyStatus = await window.pywebview.api.hasApiKey();
      setHasApiKey(keyStatus);
    } catch (err) {
      console.warn("Failed to sync backend metrics:", err);
    }
  };

  // Diagnostics fetch loop
  const fetchDiagnostics = async () => {
    if (!window.pywebview || !window.pywebview.api) return;
    try {
      const stats = await window.pywebview.api.getDiagnostics();
      setDiagnostics(stats);
    } catch (err) {
      console.warn("Failed to fetch diagnostics:", err);
    }
  };

  // Alarm callback register
  useEffect(() => {
    // Bind functions globally so Python pywebview window can trigger them
    window.triggerAlarm = (alarm) => {
      setAgentState('error');
      playSound('error');
      appendLog(`[ALERT] Alarm triggered: "${alarm.label}" at ${alarm.time_str}!`);
      
      // Multi-sound beep
      setTimeout(() => playSound('error'), 1000);
      setTimeout(() => playSound('error'), 2000);
      
      // Voice notify
      speakResponse(`Sir, this is your alarm reminder: ${alarm.label}`);
    };

    window.appendTelemetryLog = (logEntry) => {
      setTelemetryLogs(prev => [...prev, logEntry]);
    };

    return () => {
      window.triggerAlarm = null;
      window.appendTelemetryLog = null;
    };
  }, []);

  // Sync loops when woken
  useEffect(() => {
    if (!isWoken) return;

    fetchDiagnostics();
    const diagInterval = setInterval(fetchDiagnostics, 1500);
    const dataInterval = setInterval(syncData, 5000);

    return () => {
      clearInterval(diagInterval);
      clearInterval(dataInterval);
    };
  }, [isWoken]);

  // Handle setting updates
  const saveSettings = async (e) => {
    e.preventDefault();
    playSound('click');
    if (apiKey.trim()) {
      if (window.pywebview && window.pywebview.api) {
        await window.pywebview.api.setApiKey(apiKey);
      }
      setHasApiKey(true);
      setApiKey('');
    }
    setIsModalOpen(false);
    appendLog(`Voice lang protocol updated to: ${selectedLang}`);
    if (recognitionRef.current) {
      recognitionRef.current.lang = selectedLang;
    }
  };

  // DB Handlers (exposed to CalendarPanel)
  const addAlarm = async (timeStr, label) => {
    playSound('click');
    if (window.pywebview && window.pywebview.api) {
      await window.pywebview.api.addAlarm(timeStr, label);
      syncData();
    } else {
      setAlarms(prev => [...prev, { id: Date.now(), time_str: timeStr, label, is_active: 1 }]);
    }
  };

  const toggleAlarm = async (alarmId, isChecked) => {
    playSound('click');
    if (window.pywebview && window.pywebview.api) {
      await window.pywebview.api.toggleAlarm(alarmId, isChecked);
      syncData();
    } else {
      setAlarms(prev => prev.map(a => a.id === alarmId ? { ...a, is_active: isChecked ? 1 : 0 } : a));
    }
  };

  const deleteAlarm = async (alarmId) => {
    playSound('click');
    if (window.pywebview && window.pywebview.api) {
      await window.pywebview.api.deleteAlarm(alarmId);
      syncData();
    } else {
      setAlarms(prev => prev.filter(a => a.id !== alarmId));
    }
  };

  const addEvent = async (title, description, startTime, duration) => {
    playSound('click');
    if (window.pywebview && window.pywebview.api) {
      await window.pywebview.api.addCalendarEvent(title, description, startTime, duration);
      syncData();
    } else {
      setEvents(prev => [...prev, { id: Date.now(), title, description, start_time: startTime }]);
    }
  };

  const deleteEvent = async (eventId) => {
    playSound('click');
    if (window.pywebview && window.pywebview.api) {
      await window.pywebview.api.deleteCalendarEvent(eventId);
      syncData();
    } else {
      setEvents(prev => prev.filter(e => e.id !== eventId));
    }
  };

  if (!isWoken) {
    return (
      <div className="wake-overlay">
        <button className="wake-button" onClick={handleWakeUp}>
          <Radio size={40} className="wake-logo" />
          <span>WAKE UP</span>
        </button>
        <div className="wake-text">INITIALIZE JARVIS OS PROTOCOLS</div>
      </div>
    );
  }

  return (
    <div className="jarvis-hud-container">
      {/* Header Panel */}
      <header className="hud-header">
        <div className="hud-title-block">
          <h1>JARVIS</h1>
          <span className="hud-subtitle">MARK_VII_INTELLIGENCE_CORE</span>
        </div>
        <div className="hud-header-info">
          <span>LANG: {selectedLang}</span>
          <span>KEY_LINK: {hasApiKey ? "ACTIVE" : "MISSING"}</span>
          <span>ONLINE_TIME: {new Date().toLocaleTimeString()}</span>
        </div>
      </header>

      {/* Grid Dashboard */}
      <main className="hud-grid">
        {/* Left Column */}
        <div className="hud-column">
          <DiagnosticPanel diagnostics={diagnostics} />
        </div>

        {/* Center Column */}
        <div className="center-column">
          <button 
            className="settings-gear-btn" 
            onClick={() => { playSound('click'); setIsModalOpen(true); }}
            title="System Settings"
          >
            <Settings size={20} />
          </button>

          {/* Glowing Arc Reactor */}
          <ArcReactor state={agentState} onClick={startVoiceListening} />

          {/* Voice Speech Info Hud */}
          <div className="console-speech-hud">
            <div className="speech-transcript-box">
              {transcript}
            </div>
            
            <div className="speech-controls-row">
              <button 
                onClick={startVoiceListening} 
                className={`mic-btn-main ${agentState === 'listening' ? 'mic-listening' : ''}`}
                title={agentState === 'listening' ? "Mute Microphone" : "Speak to JARVIS"}
              >
                <Mic size={24} />
              </button>
              
              <div className="speech-wave-wrapper">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="wave-bar" 
                    style={{ 
                      animationDelay: `${i * 0.08}s`,
                      height: agentState === 'idle' ? '4px' : undefined
                    }} 
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="hud-column">
          <CalendarPanel 
            alarms={alarms}
            events={events}
            onAddAlarm={addAlarm}
            onToggleAlarm={toggleAlarm}
            onDeleteAlarm={deleteAlarm}
            onAddEvent={addEvent}
            onDeleteEvent={deleteEvent}
          />
          <VaultPanel files={files} onRefresh={syncData} />
        </div>
      </main>

      {/* Telemetry Logs Footer */}
      <TerminalLogs logs={telemetryLogs} onClear={() => { playSound('click'); setTelemetryLogs([]); }} />

      {/* Settings Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>JARVIS SYSTEM SETTINGS</span>
            </div>
            <form onSubmit={saveSettings} className="modal-body">
              <div className="form-group">
                <label>GEMINI API KEY</label>
                <input 
                  type="password"
                  placeholder={hasApiKey ? "••••••••••••••••••••••••" : "ENTER KEY"}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  className="input-tech"
                />
              </div>

              <div className="form-group">
                <label>RECOGNITION LANGUAGE</label>
                <select 
                  value={selectedLang}
                  onChange={e => setSelectedLang(e.target.value)}
                  className="input-tech"
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="es-ES">Español (España)</option>
                  <option value="fr-FR">Français (France)</option>
                  <option value="de-DE">Deutsch (Deutschland)</option>
                  <option value="it-IT">Italiano (Italia)</option>
                  <option value="ja-JP">日本語 (日本)</option>
                  <option value="zh-CN">中文 (简体)</option>
                  <option value="hi-IN">हिन्दी (भारत)</option>
                  <option value="ar-SA">العربية (السعودية)</option>
                </select>
              </div>

              <div className="form-group">
                <label>TTS SYNTH VOICE</label>
                <select 
                  value={selectedVoiceName}
                  onChange={e => setSelectedVoiceName(e.target.value)}
                  className="input-tech"
                >
                  <option value="">System Default (JARVIS Auto)</option>
                  {voicesList.map((voice, idx) => (
                    <option key={idx} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => { playSound('click'); setIsModalOpen(false); }} className="btn-tech">
                  CANCEL
                </button>
                <button type="submit" className="btn-tech btn-glow-cyan">
                  APPLY CHANGES
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
