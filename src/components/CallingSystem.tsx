import React, { useState, useEffect, useRef } from 'react';
import { Lead, CallLog } from '../types';
import { 
  Phone, 
  PhoneOff, 
  User, 
  Building2, 
  Plus, 
  Clock, 
  Volume2, 
  MicOff, 
  Mic, 
  LogOut, 
  FileText,
  CheckCircle,
  Delete,
  X
} from 'lucide-react';

interface CallingSystemProps {
  leads: Lead[];
  calls: CallLog[];
  onAddCallLog: (log: Omit<CallLog, 'id' | 'timestamp'>) => void;
}

export default function CallingSystem({ leads, calls, onAddCallLog }: CallingSystemProps) {
  // Call status
  // 'idle' | 'dialing' | 'connected' | 'completed'
  const [callState, setCallState] = useState<'idle' | 'dialing' | 'connected' | 'completed'>('idle');
  const [dialNumber, setDialNumber] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState('');
  
  // Timer State
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  
  // Log results state
  const [callStatus, setCallStatus] = useState<CallLog['status']>('Connected');
  const [callNotes, setCallNotes] = useState('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-fill phone number when a lead is selected
  useEffect(() => {
    if (selectedLeadId) {
      const lead = leads.find(l => l.id === selectedLeadId);
      if (lead) {
        setDialNumber(lead.phone);
      }
    }
  }, [selectedLeadId, leads]);

  // Duration Timer logic
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  // Format call duration string
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Keypad click handler
  const handleKeypadPress = (val: string) => {
    if (callState === 'idle') {
      setDialNumber(prev => prev + val);
    }
  };

  // Start outbound call simulation
  const handleStartCall = () => {
    if (!dialNumber.trim()) return;
    
    setCallState('dialing');
    setSeconds(0);
    
    // Simulate answering after 2.5 seconds
    setTimeout(() => {
      setCallState('connected');
    }, 2500);
  };

  // End outbound call
  const handleEndCall = () => {
    setCallState('completed');
    // Set notes suggestions based on selected lead if any
    const lead = leads.find(l => l.id === selectedLeadId);
    if (lead) {
      setCallNotes(`Spoke with ${lead.name} regarding active requirements. `);
    } else {
      setCallNotes(`Called ${dialNumber}. `);
    }
  };

  // Reset Dialer back to Idle
  const handleResetDialer = () => {
    setCallState('idle');
    setDialNumber('');
    setSelectedLeadId('');
    setSeconds(0);
    setCallNotes('');
  };

  // Log the Call Submission
  const handleSaveCallLog = (e: React.FormEvent) => {
    e.preventDefault();
    
    const lead = leads.find(l => l.id === selectedLeadId);
    const leadName = lead ? lead.name : 'Unknown Prospect';

    onAddCallLog({
      leadId: selectedLeadId || 'unknown',
      leadName,
      duration: seconds,
      status: callStatus,
      notes: callNotes || 'Outbound call completed.'
    });

    handleResetDialer();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[var(--crm-heading)] tracking-tight">Agent Calling Console</h2>
        <p className="text-sm text-[var(--crm-subtitle)] font-normal italic mt-1">Conduct client outreach, run VOIP callbacks, and log interactions in real-time.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 4k:grid-cols-7 5k:grid-cols-10 gap-6">
        
        {/* Left column: Dialer */}
        <div className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] rounded-xl border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)]/80 shadow-sm p-6 space-y-5">
          <h4 className="text-sm font-medium text-[var(--crm-text)] border-b border-slate-100 dark:border-[var(--crm-card-border)] pb-3">Outbound Dial Pad</h4>
          
          {/* Lead Dropdown Selection */}
          {callState === 'idle' && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--crm-text-secondary)] block">Select Prospect to Dial</label>
              <select
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-lg text-xs outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-[var(--crm-card)] dark:bg-[var(--crm-card)]"
              >
                <option value="">-- Manual Direct Dialing --</option>
                {leads.map(lead => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name} - {lead.company} ({lead.phone})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Dialing Display */}
          <div className="bg-slate-950 text-white p-5 rounded-xl border border-slate-800 text-center relative overflow-hidden min-h-[120px] flex flex-col justify-center items-center">
            {/* Background pulsing ring for active calls */}
            {(callState === 'dialing' || callState === 'connected') && (
              <div className="absolute inset-0 bg-indigo-50 dark:bg-indigo-500/10/10 animate-pulse pointer-events-none" />
            )}

            {callState === 'idle' && (
              <div className="space-y-1 w-full">
                <input 
                  type="text"
                  placeholder="Enter phone number"
                  value={dialNumber}
                  onChange={(e) => setDialNumber(e.target.value)}
                  className="w-full text-center bg-transparent text-xl font-mono focus:outline-hidden  border-none text-white placeholder-slate-600"
                />
                <span className="text-[10px] text-[var(--crm-text-secondary)] ">Type or click dial keys below</span>
              </div>
            )}

            {callState === 'dialing' && (
              <div className="space-y-2">
                <p className="text-xs text-indigo-400    animate-pulse">Connecting Outbound Dial...</p>
                <p className="text-lg font-mono  ">{dialNumber}</p>
                <p className="text-xs text-[var(--crm-text-muted)] ">
                  {selectedLeadId ? leads.find(l => l.id === selectedLeadId)?.name : 'Unknown Prospect'}
                </p>
              </div>
            )}

            {callState === 'connected' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-50 dark:bg-emerald-500/10 animate-ping"></span>
                  <p className="text-xs text-emerald-400   ">Call Active</p>
                </div>
                <p className="text-2xl font-mono  ">{formatTime(seconds)}</p>
                <p className="text-sm  text-slate-200">
                  {selectedLeadId ? leads.find(l => l.id === selectedLeadId)?.name : dialNumber}
                </p>
              </div>
            )}

            {callState === 'completed' && (
              <div className="space-y-1">
                <p className="text-xs text-rose-400   ">Call Disconnected</p>
                <p className="text-lg font-mono  text-slate-300">Duration: {formatTime(seconds)}</p>
                <span className="text-[10px] text-[var(--crm-text-secondary)] ">Ready to log details on the right</span>
              </div>
            )}
          </div>

          {/* Keypad UI */}
          {callState === 'idle' && (
            <div className="grid grid-cols-3 gap-3 pt-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleKeypadPress(key)}
                  className="py-3 bg-[var(--crm-sidebar)] hover:bg-slate-100/80 active:bg-slate-200/60 border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)]/60 rounded-xl font-medium text-[var(--crm-text)] font-mono text-base transition-colors select-none cursor-pointer"
                >
                  {key}
                </button>
              ))}
            </div>
          )}

          {/* Call Controls Toggle */}
          {(callState === 'dialing' || callState === 'connected') && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`py-2 px-3 border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  isMuted ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 text-amber-700' : 'border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar)] '
                }`}
              >
                {isMuted ? <MicOff size={14} /> : <Mic size={14} />} {isMuted ? 'Muted' : 'Mute'}
              </button>
              <button
                onClick={() => setIsSpeaker(!isSpeaker)}
                className={`py-2 px-3 border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  isSpeaker ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 text-indigo-700' : 'border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar)] '
                }`}
              >
                <Volume2 size={14} /> Speaker {isSpeaker ? 'On' : 'Off'}
              </button>
            </div>
          )}

          {/* Trigger Dial Action Button */}
          <div className="pt-2">
            {callState === 'idle' ? (
              <button
                onClick={handleStartCall}
                disabled={!dialNumber.trim()}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-50 dark:bg-emerald-500/10 disabled:opacity-50 text-white font-medium text-sm rounded-xl transition-colors shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Phone size={18} /> Call Outbound
              </button>
            ) : (callState === 'dialing' || callState === 'connected') ? (
              <button
                onClick={handleEndCall}
                className="w-full py-3 bg-rose-600 hover:bg-rose-50 dark:bg-rose-500/10 text-white font-medium text-sm rounded-xl transition-colors shadow-lg shadow-rose-600/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                <PhoneOff size={18} /> End Active Call
              </button>
            ) : (
              <button
                onClick={handleResetDialer}
                className="w-full py-2.5 border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar)] text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Reset Outbound Dial
              </button>
            )}
          </div>
        </div>

        {/* Middle column: Active Call Logging */}
        <div className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] rounded-xl border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)]/80 shadow-sm p-6 space-y-4">
          <h4 className="text-sm font-medium text-[var(--crm-text)] border-b border-slate-100 dark:border-[var(--crm-card-border)] pb-3">Active Log Card</h4>
          
          {callState !== 'completed' ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-[var(--crm-text-muted)] border border-dashed border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl p-4">
              <FileText size={36} className="text-slate-300 mb-2" />
              <p className="text-xs  text-[var(--crm-subtitle)]">Pending Outbound call</p>
              <p className="text-[11px] mt-1 max-w-[200px] 2xl:max-w-[350px] 3xl:max-w-[600px] 4k:max-w-none">Please hang up or end your call to record the callback notes and outcomes.</p>
            </div>
          ) : (
            <form onSubmit={handleSaveCallLog} className="space-y-4 text-sm text-[var(--crm-text)] animate-in fade-in duration-200">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--crm-text-secondary)] block">Contact Call Outcome</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Connected', 'Voicemail', 'Busy', 'No Answer'] as Array<CallLog['status']>).map((outcome) => (
                    <button
                      key={outcome}
                      type="button"
                      onClick={() => setCallStatus(outcome)}
                      className={`py-2 px-3 border text-xs font-medium rounded-lg transition-colors cursor-pointer text-center ${
                        callStatus === outcome 
                          ? 'bg-indigo-600 border-indigo-600 text-white font-medium' 
                          : 'bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar)] '
                      }`}
                    >
                      {outcome}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--crm-text-secondary)] block">Outreach Notes / Updates</label>
                <textarea
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder="Record summary of call, scheduling dates, feature requests, or followup actions..."
                  rows={4}
                  className="w-full px-3 py-2 border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-lg outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm resize-none"
                />
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-50 dark:bg-indigo-500/10 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle size={14} /> Save Outbound Call Log
                </button>
                <button
                  type="button"
                  onClick={handleResetDialer}
                  className="w-full py-2 border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar)] text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Discard Call Log
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right column: Recent Calling History list */}
        <div className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] rounded-xl border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)]/80 shadow-sm p-6 space-y-4">
          <h4 className="text-sm font-medium text-[var(--crm-text)] border-b border-slate-100 dark:border-[var(--crm-card-border)] pb-3">Calling History Log</h4>
          
          {calls.length === 0 ? (
            <div className="text-center py-12 text-[var(--crm-text-muted)] space-y-2 flex flex-col items-center">
              <Clock size={28} className="text-slate-300" />
              <div>
                <p className="text-xs  text-[var(--crm-text)]">No outbound calls recorded</p>
                <p className="text-[10px] mt-0.5">Logs will automatically accumulate here.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
              {calls.map((call) => (
                <div key={call.id} className="text-xs border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className=" text-[var(--crm-text)] text-[var(--crm-text)]">{call.leadName}</p>
                      <p className="text-[10px] text-[var(--crm-text-muted)] flex items-center gap-1 mt-0.5">
                        <Clock size={10} /> {new Date(call.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {call.duration > 0 ? `${call.duration}s` : 'Missed'}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full font-medium text-[9px] ${
                      call.status === 'Connected' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700' :
                      call.status === 'Voicemail' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700' :
                      call.status === 'Busy' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700'
                    }`}>
                      {call.status}
                    </span>
                  </div>
                  <p className="text-[var(--crm-subtitle)] mt-1 italic leading-relaxed font-sans  text-[10px]">
                    "{call.notes}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
