import React, { useState } from 'react';
import { Bell, Calendar, Trash2, Check, Plus } from 'lucide-react';

export default function CalendarPanel({ 
  alarms, 
  events, 
  onAddAlarm, 
  onToggleAlarm, 
  onDeleteAlarm,
  onAddEvent,
  onDeleteEvent 
}) {
  const [activeTab, setActiveTab] = useState('alarms'); // 'alarms' or 'calendar'
  
  // Alarm Form state
  const [alarmTime, setAlarmTime] = useState('');
  const [alarmLabel, setAlarmLabel] = useState('');
  
  // Event Form state
  const [eventTitle, setEventTitle] = useState('');
  const [eventStart, setEventStart] = useState('');
  const [eventDesc, setEventDesc] = useState('');

  const submitAlarm = (e) => {
    e.preventDefault();
    if (!alarmTime) return;
    onAddAlarm(alarmTime, alarmLabel || 'JARVIS Alarm');
    setAlarmTime('');
    setAlarmLabel('');
  };

  const submitEvent = (e) => {
    e.preventDefault();
    if (!eventTitle || !eventStart) return;
    onAddEvent(eventTitle, eventDesc, eventStart.replace('T', ' '), 30);
    setEventTitle('');
    setEventStart('');
    setEventDesc('');
  };

  return (
    <div className="hud-panel calendar-panel">
      <div className="panel-header tab-header">
        <button 
          className={`tab-btn ${activeTab === 'alarms' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('alarms')}
        >
          <Bell size={14} />
          <span>ALARMS</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'calendar' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          <Calendar size={14} />
          <span>CALENDAR</span>
        </button>
      </div>

      <div className="panel-content tab-content">
        {activeTab === 'alarms' && (
          <div className="alarms-tab">
            {/* Alarm Quick Add */}
            <form onSubmit={submitAlarm} className="quick-form">
              <input 
                type="time" 
                value={alarmTime}
                onChange={e => setAlarmTime(e.target.value)}
                className="input-tech"
                required
              />
              <input 
                type="text" 
                placeholder="LABEL"
                value={alarmLabel}
                onChange={e => setAlarmLabel(e.target.value)}
                className="input-tech flex-grow"
              />
              <button type="submit" className="btn-tech btn-glow-cyan">
                <Plus size={14} />
              </button>
            </form>

            {/* Alarms List */}
            <div className="items-list">
              {alarms.length === 0 ? (
                <div className="empty-state text-cyan">NO_ACTIVE_ALARMS</div>
              ) : (
                alarms.map((alarm) => (
                  <div key={alarm.id} className="alarm-item">
                    <div className="alarm-meta">
                      <span className="alarm-time">{alarm.time_str}</span>
                      <span className="alarm-label text-cyan">{alarm.label}</span>
                    </div>
                    <div className="alarm-actions">
                      <input 
                        type="checkbox" 
                        checked={alarm.is_active === 1}
                        onChange={(e) => onToggleAlarm(alarm.id, e.target.checked)}
                        className="checkbox-tech"
                      />
                      <button 
                        onClick={() => onDeleteAlarm(alarm.id)}
                        className="btn-icon text-red-400 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="calendar-tab">
            {/* Event Quick Add */}
            <form onSubmit={submitEvent} className="quick-form-col">
              <div className="quick-form-row">
                <input 
                  type="text" 
                  placeholder="EVENT TITLE"
                  value={eventTitle}
                  onChange={e => setEventTitle(e.target.value)}
                  className="input-tech flex-grow"
                  required
                />
                <input 
                  type="datetime-local" 
                  value={eventStart}
                  onChange={e => setEventStart(e.target.value)}
                  className="input-tech"
                  required
                />
              </div>
              <div className="quick-form-row">
                <input 
                  type="text" 
                  placeholder="DESCRIPTION"
                  value={eventDesc}
                  onChange={e => setEventDesc(e.target.value)}
                  className="input-tech flex-grow"
                />
                <button type="submit" className="btn-tech btn-glow-cyan">
                  <Plus size={14} /> ADD
                </button>
              </div>
            </form>

            {/* Events List */}
            <div className="items-list">
              {events.length === 0 ? (
                <div className="empty-state text-cyan">NO_SCHEDULED_EVENTS</div>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="event-item">
                    <div className="event-meta">
                      <div className="event-time text-cyan font-bold">{event.start_time}</div>
                      <span className="event-title font-bold text-white">{event.title}</span>
                      {event.description && <p className="event-desc">{event.description}</p>}
                    </div>
                    <button 
                      onClick={() => onDeleteEvent(event.id)}
                      className="btn-icon text-red-400 hover:text-red-600 self-center"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
