"use client";

import { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  sender: 'patient' | 'doctor';
  content: string;
  timestamp: Date;
  isStatusReport?: boolean;
  isScheduled?: boolean;
}

interface PatientData {
  name: string;
  age: number;
  diagnosis: string;
  tremorLevel: number;
  rigidityLevel: number;
  slownessLevel: number;
  gaitLevel: number;
  lastDoseTime: string;
  nextDoseTime: string;
  fallRiskLevel: string;
  weeklyFalls: number;
}

export default function Profile() {
  const [messages, setMessages] = useState<Message[]>(() => [{
    id: 'welcome-1',
    sender: 'doctor' as const,
    content: "Hello John! 👋 I hope you're doing well today. I'm here to help you with any questions or concerns about your Parkinson's treatment. Feel free to send me a daily health report anytime!",
    timestamp: new Date(Date.now() - 3600000), // 1 hour ago
  }]);
  const [inputMessage, setInputMessage] = useState('');
  const [showQuickStats, setShowQuickStats] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock patient data
  const [patientData] = useState<PatientData>({
    name: "John Doe",
    age: 68,
    diagnosis: "Parkinson's Disease (Stage 2)",
    tremorLevel: 46,
    rigidityLevel: 36,
    slownessLevel: 48,
    gaitLevel: 55,
    lastDoseTime: "2 hours ago",
    nextDoseTime: "In 2 hours",
    fallRiskLevel: "Moderate",
    weeklyFalls: 5,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getTrendIcon = (value: number): string => {
    if (value >= 65) return '⬆️ High';
    if (value >= 45) return '➡️ Moderate';
    return '⬇️ Low';
  };

  const generateStatusReport = (): string => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const timeStr = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return `📊 COMPREHENSIVE DAILY HEALTH REPORT

📅 Generated: ${dateStr} at ${timeStr}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 PATIENT INFORMATION
• Name: ${patientData.name}
• Age: ${patientData.age} years
• Diagnosis: ${patientData.diagnosis}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 CURRENT SYMPTOM LEVELS

🤝 Tremor: ${patientData.tremorLevel}/100 ${getTrendIcon(patientData.tremorLevel)}
� Rigidity: ${patientData.rigidityLevel}/100 ${getTrendIcon(patientData.rigidityLevel)}
⏱️ Slowness: ${patientData.slownessLevel}/100 ${getTrendIcon(patientData.slownessLevel)}
� Gait Stability: ${patientData.gaitLevel}/100 ${getTrendIcon(patientData.gaitLevel)}

Average Score: ${Math.round((patientData.tremorLevel + patientData.rigidityLevel + patientData.slownessLevel + patientData.gaitLevel) / 4)}/100

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💊 MEDICATION ADHERENCE
• Last Dose: ${patientData.lastDoseTime}
• Next Scheduled: ${patientData.nextDoseTime}
• Today's Compliance: 85%
• Weekly Compliance: 92%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ FALL RISK ASSESSMENT
• Risk Level: ${patientData.fallRiskLevel}
• Falls This Week: ${patientData.weeklyFalls}
• Fall Prevention Status: Active Monitoring

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 AI-POWERED RECOMMENDATIONS
Based on your current gait stability score (${patientData.gaitLevel}/100):
• Primary Focus: Balance & Coordination Exercises
• Recommended Therapy: "Rhythm Walker" Game
• Suggested Session: 15-20 minutes daily
• Expected Improvement: 2-3 weeks

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📱 DEVICE STATUS
• Wrist Unit: Connected (82% Battery)
• Arm Patch: Standby (15% Battery - Charge Soon)
• Data Quality: Excellent

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This comprehensive report was automatically generated from real-time dashboard and analytics data. All metrics are continuously monitored by StanceSense AI.`;
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (inputMessage.trim() === '') return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'patient',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputMessage('');

    // Simulate doctor typing
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const doctorResponse: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'doctor',
        content: "Thank you for reaching out! I've received your message. Let me review your latest health data and get back to you shortly with personalized recommendations. 👨‍⚕️",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, doctorResponse]);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const sendStatusReport = () => {
    const report = generateStatusReport();
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'patient',
      content: report,
      timestamp: new Date(),
      isStatusReport: true,
    };
    setMessages([...messages, newMessage]);

    // Doctor acknowledges report
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const ackMessage: Message = {
          id: (Date.now() + 2).toString(),
          sender: 'doctor',
          content: "📊 Thank you for the comprehensive report! I've reviewed your daily metrics. Your symptom levels are stable, and medication adherence is excellent. Keep up the great work with your therapy exercises! I'll schedule a follow-up call if needed.",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, ackMessage]);
      }, 2000);
    }, 1000);
  };

  const scheduleAppointment = () => {
    setShowScheduleModal(true);
  };

  const confirmAppointment = () => {
    const scheduledMsg: Message = {
      id: Date.now().toString(),
      sender: 'patient',
      content: "📅 Appointment Request: I would like to schedule a video consultation for this week to discuss my progress and any medication adjustments.",
      timestamp: new Date(),
      isScheduled: true,
    };
    setMessages([...messages, scheduledMsg]);
    setShowScheduleModal(false);

    // Doctor confirms
    setTimeout(() => {
      const confirmMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'doctor',
        content: "✅ Appointment Confirmed! I've scheduled a video consultation for Thursday at 2:00 PM. You'll receive a reminder 15 minutes before. Looking forward to discussing your progress!",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, confirmMsg]);
    }, 1500);
  };

  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="profile-fullscreen">
      <div className="profile-wrapper-full">
        {/* Messaging Interface - Full Width */}
        <div className="messaging-container-full">
          <div className="messaging-header">
            <div className="doctor-info">
              <div className="doctor-avatar online">
                <span>👨‍⚕️</span>
              </div>
              <div className="doctor-details">
                <h3>Dr. Sarah Mitchell</h3>
                <span className="doctor-status">
                  <span className="status-dot online"></span>
                  Online • Available Now
                </span>
              </div>
            </div>
            <div className="header-actions">
              <button className="action-btn video-btn" title="Start Video Call">
                <span className="btn-icon">�</span>
                <span className="btn-text">Video Call</span>
              </button>
              <button className="action-btn call-btn" title="Start Voice Call">
                <span className="btn-icon">📞</span>
                <span className="btn-text">Call</span>
              </button>
              <button className="action-btn schedule-btn" onClick={scheduleAppointment} title="Schedule Appointment">
                <span className="btn-icon">📅</span>
                <span className="btn-text">Schedule</span>
              </button>
              <button className="action-btn menu-btn" title="More Options">
                <span>⋮</span>
              </button>
            </div>
          </div>

          <div className="messages-area">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`message ${message.sender} ${message.isStatusReport ? 'status-report' : ''} ${message.isScheduled ? 'scheduled' : ''}`}
              >
                {message.sender === 'doctor' && (
                  <div className="message-avatar">
                    <span>👨‍⚕️</span>
                  </div>
                )}
                <div className="message-content">
                  {message.isStatusReport && (
                    <div className="report-badge">
                      <span className="badge-icon">📊</span>
                      <span>Comprehensive Daily Report</span>
                    </div>
                  )}
                  {message.isScheduled && (
                    <div className="scheduled-badge">
                      <span className="badge-icon">�</span>
                      <span>Appointment Request</span>
                    </div>
                  )}
                  <pre className="message-text">{message.content}</pre>
                  <span className="message-time">{formatTimestamp(message.timestamp)}</span>
                </div>
                {message.sender === 'patient' && (
                  <div className="message-avatar patient-avatar">
                    <span>{patientData.name.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="message doctor typing-indicator">
                <div className="message-avatar">
                  <span>👨‍⚕️</span>
                </div>
                <div className="typing-bubble">
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="message-input-container">
            <div className="quick-actions-bar">
              <button className="quick-action-btn report-btn" onClick={sendStatusReport} title="Send Daily Health Report">
                <span className="action-icon">�</span>
                <span className="action-label">Send Daily Report</span>
              </button>
              <button className="quick-action-btn stats-btn" onClick={() => setShowQuickStats(!showQuickStats)} title="View Quick Stats">
                <span className="action-icon">�</span>
                <span className="action-label">Health Stats</span>
              </button>
              <button className="quick-action-btn appointment-btn" onClick={scheduleAppointment} title="Schedule Appointment">
                <span className="action-icon">📅</span>
                <span className="action-label">Schedule</span>
              </button>
            </div>

            {showQuickStats && (
              <div className="quick-stats-panel">
                <div className="quick-stats-header">
                  <h4>📊 Today&apos;s Quick Stats</h4>
                  <button className="close-stats" onClick={() => setShowQuickStats(false)}>×</button>
                </div>
                <div className="quick-stats-grid">
                  <div className="quick-stat">
                    <span className="stat-icon">🤝</span>
                    <div className="stat-info">
                      <span className="stat-label">Tremor</span>
                      <span className="stat-value">{patientData.tremorLevel}/100</span>
                    </div>
                  </div>
                  <div className="quick-stat">
                    <span className="stat-icon">💪</span>
                    <div className="stat-info">
                      <span className="stat-label">Rigidity</span>
                      <span className="stat-value">{patientData.rigidityLevel}/100</span>
                    </div>
                  </div>
                  <div className="quick-stat">
                    <span className="stat-icon">⏱️</span>
                    <div className="stat-info">
                      <span className="stat-label">Slowness</span>
                      <span className="stat-value">{patientData.slownessLevel}/100</span>
                    </div>
                  </div>
                  <div className="quick-stat">
                    <span className="stat-icon">🚶</span>
                    <div className="stat-info">
                      <span className="stat-label">Gait</span>
                      <span className="stat-value">{patientData.gaitLevel}/100</span>
                    </div>
                  </div>
                  <div className="quick-stat">
                    <span className="stat-icon">💊</span>
                    <div className="stat-info">
                      <span className="stat-label">Next Dose</span>
                      <span className="stat-value">{patientData.nextDoseTime}</span>
                    </div>
                  </div>
                  <div className="quick-stat">
                    <span className="stat-icon">⚠️</span>
                    <div className="stat-info">
                      <span className="stat-label">Fall Risk</span>
                      <span className="stat-value">{patientData.fallRiskLevel}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="message-input-area">
              <button className="attachment-btn" title="Attach File">
                <span>📎</span>
              </button>
              <textarea
                className="message-input"
                placeholder="Type your message to Dr. Sarah Mitchell..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                rows={1}
              />
              <button 
                className={`send-btn ${inputMessage.trim() !== '' ? 'active' : ''}`}
                onClick={handleSendMessage}
                disabled={inputMessage.trim() === ''}
                title="Send Message"
              >
                <span>➤</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Appointment Modal */}
      {showScheduleModal && (
        <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📅 Schedule Appointment</h3>
              <button className="modal-close" onClick={() => setShowScheduleModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Request a video or phone consultation with Dr. Sarah Mitchell</p>
              <div className="appointment-options">
                <button className="appointment-option" onClick={confirmAppointment}>
                  <span className="option-icon">📹</span>
                  <div className="option-details">
                    <strong>Video Consultation</strong>
                    <span>Next Available: This Week</span>
                  </div>
                </button>
                <button className="appointment-option" onClick={confirmAppointment}>
                  <span className="option-icon">📞</span>
                  <div className="option-details">
                    <strong>Phone Call</strong>
                    <span>Next Available: Tomorrow</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
