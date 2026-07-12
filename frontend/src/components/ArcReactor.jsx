import React from 'react';
import '../styles/jarvis.css';

export default function ArcReactor({ state = 'idle', onClick }) {
  // state: 'idle', 'listening', 'thinking', 'speaking', 'error'
  
  const getThemeColor = () => {
    switch (state) {
      case 'listening': return '#3b82f6'; // Bright Blue
      case 'thinking': return '#f97316';  // Neon Orange
      case 'speaking': return '#10b981';  // Cyber Green
      case 'error': return '#ef4444';     // Emergency Red
      case 'idle':
      default: return '#00f0ff';          // Hologram Cyan
    }
  };

  const getStatusText = () => {
    switch (state) {
      case 'listening': return 'SYS_LISTENING';
      case 'thinking': return 'THINK_CORE_ACTIVE';
      case 'speaking': return 'SYS_SPEAKING';
      case 'error': return 'DIAGNOSTIC_ERR';
      case 'idle':
      default: return 'JARVIS_STANDBY';
    }
  };

  const color = getThemeColor();

  return (
    <div className={`reactor-container state-${state}`} onClick={onClick}>
      <svg className="reactor-svg" viewBox="0 0 200 200" width="100%" height="100%">
        <defs>
          <filter id="reactor-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          <radialGradient id="core-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.8" />
            <stop offset="50%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer Circular Ring with tick marks */}
        <circle cx="100" cy="100" r="95" stroke={color} strokeWidth="1" fill="none" opacity="0.3" strokeDasharray="3, 3" />
        
        {/* Outer rotating tech rings */}
        <g className="ring-outer">
          <circle cx="100" cy="100" r="88" stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" strokeDasharray="20, 10, 5, 10" />
          <circle cx="100" cy="100" r="82" stroke={color} strokeWidth="0.8" fill="none" opacity="0.4" strokeDasharray="40, 5, 10, 5" />
        </g>
        
        {/* Counter-rotating middle rings */}
        <g className="ring-middle">
          <circle cx="100" cy="100" r="72" stroke={color} strokeWidth="2" fill="none" opacity="0.6" strokeDasharray="15, 25, 45, 10" />
          <path d="M 100 28 A 72 72 0 0 1 172 100" stroke={color} strokeWidth="4" fill="none" opacity="0.8" />
          <path d="M 100 172 A 72 72 0 0 1 28 100" stroke={color} strokeWidth="4" fill="none" opacity="0.8" />
        </g>

        {/* Inner Tech Ring (Inner circle with triangular nodes) */}
        <g className="ring-inner">
          <circle cx="100" cy="100" r="55" stroke={color} strokeWidth="1.5" fill="none" opacity="0.7" strokeDasharray="5, 8" />
          {/* Triangular pointer nodes inside the reactor */}
          <polygon points="100,50 96,40 104,40" fill={color} opacity="0.8" />
          <polygon points="100,150 96,160 104,160" fill={color} opacity="0.8" />
          <polygon points="50,100 40,96 40,104" fill={color} opacity="0.8" />
          <polygon points="150,100 160,96 160,104" fill={color} opacity="0.8" />
        </g>

        {/* Center Reactor Core Shield */}
        <circle cx="100" cy="100" r="30" fill="url(#core-glow)" />
        <circle cx="100" cy="100" r="25" stroke={color} strokeWidth="2" fill="none" opacity="0.8" />
        
        {/* Solid Center Node */}
        <circle className="core-node" cx="100" cy="100" r="15" fill={color} filter="url(#reactor-glow)" />
        
        {/* Hexagonal Core Grid Overlay */}
        <circle cx="100" cy="100" r="15" fill="none" stroke="#000" strokeWidth="0.5" opacity="0.3" strokeDasharray="1, 1" />
      </svg>
      
      {/* HUD Info Labels */}
      <div className="reactor-labels" style={{ '--reactor-color': color }}>
        <span className="status-code">{getStatusText()}</span>
        <span className="status-percent">
          {state === 'thinking' ? 'PROCESSING...' : state === 'listening' ? 'LISTENING...' : 'READY'}
        </span>
      </div>
      
      {/* Arc Reactor Glowing Core Ray Rings */}
      <div className="glowing-ripple" style={{ borderColor: color }} />
      {state === 'listening' && (
        <>
          <div className="glowing-ripple ripple-2" style={{ borderColor: color }} />
          <div className="glowing-ripple ripple-3" style={{ borderColor: color }} />
        </>
      )}
    </div>
  );
}
