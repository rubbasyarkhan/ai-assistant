import React, { useEffect, useRef } from 'react';
import { Terminal, Trash2 } from 'lucide-react';

export default function TerminalLogs({ logs, onClear }) {
  const containerRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to bottom on new logs
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="hud-panel terminal-panel">
      <div className="panel-header">
        <Terminal size={18} className="text-cyan animate-pulse" />
        <span className="panel-title">TELEMETRY LOGS</span>
        <button onClick={onClear} className="btn-icon text-cyan" title="Clear Logs">
          <Trash2 size={14} />
        </button>
      </div>

      <div className="panel-content terminal-content" ref={containerRef}>
        {logs.length === 0 ? (
          <div className="telemetry-line text-cyan opacity-50">
            [00:00:00] JARVIS Core Initialized. Awaiting voice protocols...
          </div>
        ) : (
          logs.map((log, index) => {
            let className = "telemetry-line";
            if (log.includes("User:")) {
              className += " text-white font-bold";
            } else if (log.includes("JARVIS:")) {
              className += " text-cyan font-semibold";
            } else if (log.includes("Executing protocol:")) {
              className += " text-orange-400";
            } else if (log.includes("Error:") || log.includes("Diagnostics Error:")) {
              className += " text-red-500 font-bold";
            } else if (log.includes("Protocol response:")) {
              className += " text-green-400 opacity-80";
            } else {
              className += " text-cyan opacity-80";
            }

            return (
              <div key={index} className={className}>
                {log}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
