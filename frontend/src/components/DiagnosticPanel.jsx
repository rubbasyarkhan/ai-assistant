import React from 'react';
import { Cpu, Database, HardDrive, Battery, ShieldCheck } from 'lucide-react';

export default function DiagnosticPanel({ diagnostics }) {
  const {
    cpu_percent = 0,
    ram_percent = 0,
    ram_used_gb = 0,
    ram_total_gb = 0,
    disk_percent = 0,
    battery_percent = 100,
    power_plugged = true,
  } = diagnostics || {};

  return (
    <div className="hud-panel diagnostic-panel">
      <div className="panel-header">
        <ShieldCheck size={18} className="text-cyan animate-pulse" />
        <span className="panel-title">SYSTEM DIAGNOSTICS</span>
        <span className="panel-tag">SECURE_CORE</span>
      </div>
      
      <div className="panel-content">
        {/* Diagnostics grid */}
        <div className="diag-grid">
          {/* CPU Stats */}
          <div className="diag-item">
            <div className="diag-meta">
              <Cpu size={16} className="text-cyan" />
              <span>CORE_CPU_LOAD</span>
              <span className="text-cyan font-bold">{cpu_percent}%</span>
            </div>
            <div className="diag-bar-bg">
              <div className="diag-bar-fill fill-cyan" style={{ width: `${cpu_percent}%` }} />
            </div>
          </div>

          {/* RAM Stats */}
          <div className="diag-item">
            <div className="diag-meta">
              <Database size={16} className="text-cyan" />
              <span>MEMORY_MATRIX</span>
              <span className="text-cyan font-bold">{ram_percent}%</span>
            </div>
            <div className="diag-bar-bg">
              <div className="diag-bar-fill fill-cyan" style={{ width: `${ram_percent}%` }} />
            </div>
            <div className="diag-subtext">
              USED: {ram_used_gb} GB / TOTAL: {ram_total_gb} GB
            </div>
          </div>

          {/* Storage Disk Stats */}
          <div className="diag-item">
            <div className="diag-meta">
              <HardDrive size={16} className="text-cyan" />
              <span>STORAGE_VAULT</span>
              <span className="text-cyan font-bold">{disk_percent}%</span>
            </div>
            <div className="diag-bar-bg">
              <div className="diag-bar-fill fill-cyan" style={{ width: `${disk_percent}%` }} />
            </div>
          </div>

          {/* Battery Stats */}
          <div className="diag-item">
            <div className="diag-meta">
              <Battery size={16} className={power_plugged ? "text-green" : "text-orange"} />
              <span>POWER_CELLS</span>
              <span className="font-bold">{battery_percent}%</span>
            </div>
            <div className="diag-bar-bg">
              <div 
                className={`diag-bar-fill ${power_plugged ? 'fill-green' : 'fill-orange'}`} 
                style={{ width: `${battery_percent}%` }} 
              />
            </div>
            <div className="diag-subtext text-cyan">
              SOURCE: {power_plugged ? "GRID_POWER_ONLINE" : "CELL_DISCHARGING"}
            </div>
          </div>
        </div>

        {/* Diagonal Tech Separator */}
        <div className="hud-divider" />
        
        {/* Mock System State info */}
        <div className="tech-footer">
          <div className="telemetry-row">
            <span>JARVIS_KERNEL</span>
            <span className="text-cyan">v3.12-ACTIVE</span>
          </div>
          <div className="telemetry-row">
            <span>SECURITY_FIREWALL</span>
            <span className="text-green">SECURE</span>
          </div>
          <div className="telemetry-row">
            <span>ANTIGRAVITY_LINK</span>
            <span className="text-cyan">CONNECTED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
