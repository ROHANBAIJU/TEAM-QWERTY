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
  const [messages, setMessages] = useState<Message[]>([{
    id: 'welcome-1',
    sender: 'doctor' as const,
    content: "Hello John! 👋 I hope you're doing well today. I'm here to help you with any questions or concerns about your Parkinson's treatment. Feel free to send me a daily health report anytime!",
    timestamp: new Date(Date.now() - 3600000),
  }]);
  const [inputMessage, setInputMessage] = useState('');
  const [showQuickStats, setShowQuickStats] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getTrendIcon = (value: number): string => {
    if (value >= 65) return '⬆️ High';
    if (value >= 45) return '➡️ Moderate';
    return '⬇️ Low';
  };

  const generateStatusReport = (): string => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

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
💪 Rigidity: ${patientData.rigidityLevel}/100 ${getTrendIcon(patientData.rigidityLevel)}
⏱️ Slowness: ${patientData.slownessLevel}/100 ${getTrendIcon(patientData.slownessLevel)}
🚶 Gait Stability: ${patientData.gaitLevel}/100 ${getTrendIcon(patientData.gaitLevel)}

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
    
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{
      height: '100vh',
      overflowY: 'hidden',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Doctor Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '20px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            position: 'relative'
          }}>
            👨‍⚕️
            <span style={{
              position: 'absolute',
              bottom: '2px',
              right: '2px',
              width: '14px',
              height: '14px',
              background: '#10b981',
              border: '2px solid #0f172a',
              borderRadius: '50%'
            }} />
          </div>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: 'white' }}>
              Dr. Sarah Mitchell
            </h3>
            <div style={{ fontSize: '13px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span style={{
                width: '8px',
                height: '8px',
                background: '#10b981',
                borderRadius: '50%',
                animation: 'pulse 2s infinite'
              }} />
              Online • Available Now
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {[
            { icon: '📹', label: 'Video Call' },
            { icon: '📞', label: 'Call' },
            { icon: '📅', label: 'Schedule', onClick: scheduleAppointment }
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={btn.onClick}
              style={{
                padding: '10px 18px',
                background: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '10px',
                color: '#a78bfa',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)';
              }}
            >
              <span style={{ fontSize: '16px' }}>{btn.icon}</span>
              <span>{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              flexDirection: message.sender === 'patient' ? 'row-reverse' : 'row'
            }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: message.sender === 'doctor' ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' : 'rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              flexShrink: 0
            }}>
              {message.sender === 'doctor' ? '👨‍⚕️' : patientData.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div style={{
              maxWidth: '70%',
              background: message.sender === 'doctor' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid ' + (message.sender === 'doctor' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)'),
              borderRadius: '16px',
              padding: '14px 18px'
            }}>
              {message.isStatusReport && (
                <div style={{
                  padding: '6px 12px',
                  background: 'rgba(59, 130, 246, 0.2)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#3b82f6',
                  marginBottom: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>📊</span> Comprehensive Daily Report
                </div>
              )}
              {message.isScheduled && (
                <div style={{
                  padding: '6px 12px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#10b981',
                  marginBottom: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>📅</span> Appointment Request
                </div>
              )}
              <pre style={{
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                margin: 0,
                fontFamily: 'inherit',
                fontSize: '14px',
                lineHeight: '1.6',
                color: 'white'
              }}>
                {message.content}
              </pre>
              <div style={{
                fontSize: '11px',
                color: '#64748b',
                marginTop: '8px',
                textAlign: message.sender === 'patient' ? 'right' : 'left'
              }}>
                {formatTimestamp(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px'
            }}>
              👨‍⚕️
            </div>
            <div style={{
              padding: '16px 20px',
              background: 'rgba(139, 92, 246, 0.15)',
              borderRadius: '16px',
              display: 'flex',
              gap: '8px'
            }}>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    width: '8px',
                    height: '8px',
                    background: '#a78bfa',
                    borderRadius: '50%',
                    animation: `bounce 1.4s ${i * 0.2}s infinite`
                  }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions Bar */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '12px 32px',
        display: 'flex',
        gap: '12px',
        flexShrink: 0
      }}>
        <button
          onClick={sendStatusReport}
          style={{
            flex: 1,
            padding: '10px 16px',
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '10px',
            color: '#3b82f6',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span>📊</span> Send Daily Report
        </button>
        <button
          onClick={() => setShowQuickStats(!showQuickStats)}
          style={{
            flex: 1,
            padding: '10px 16px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            color: '#10b981',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span>📈</span> Health Stats
        </button>
        <button
          onClick={scheduleAppointment}
          style={{
            flex: 1,
            padding: '10px 16px',
            background: 'rgba(139, 92, 246, 0.15)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '10px',
            color: '#a78bfa',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span>📅</span> Schedule
        </button>
      </div>

      {/* Quick Stats Panel */}
      {showQuickStats && (
        <div style={{
          position: 'fixed',
          bottom: '180px',
          right: '32px',
          width: '320px',
          background: 'rgba(15, 23, 42, 0.98)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          zIndex: 1000
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>📊 Today&apos;s Quick Stats</h4>
            <button
              onClick={() => setShowQuickStats(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '0',
                lineHeight: '1'
              }}
            >
              ×
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {[
              { icon: '🤝', label: 'Tremor', value: patientData.tremorLevel },
              { icon: '💪', label: 'Rigidity', value: patientData.rigidityLevel },
              { icon: '⏱️', label: 'Slowness', value: patientData.slownessLevel },
              { icon: '🚶', label: 'Gait', value: patientData.gaitLevel }
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '10px',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '6px' }}>{stat.icon}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>{stat.label}</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#a78bfa' }}>{stat.value}/100</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '20px 32px',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-end',
        flexShrink: 0
      }}>
        <button
          style={{
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            color: '#cbd5e1',
            fontSize: '20px',
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          📎
        </button>
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message to Dr. Sarah Mitchell..."
          rows={1}
          style={{
            flex: 1,
            padding: '14px 18px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            color: 'white',
            fontSize: '14px',
            resize: 'none',
            outline: 'none',
            minHeight: '48px',
            maxHeight: '120px'
          }}
        />
        <button
          onClick={handleSendMessage}
          disabled={inputMessage.trim() === ''}
          style={{
            padding: '12px 20px',
            background: inputMessage.trim() !== '' ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' : 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            borderRadius: '10px',
            color: inputMessage.trim() !== '' ? 'white' : '#64748b',
            fontSize: '18px',
            cursor: inputMessage.trim() !== '' ? 'pointer' : 'not-allowed',
            flexShrink: 0,
            transition: 'all 0.2s'
          }}
        >
          ➤
        </button>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}
          onClick={() => setShowScheduleModal(false)}
        >
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.98)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '20px',
              padding: '32px',
              width: '90%',
              maxWidth: '480px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>📅 Schedule Appointment</h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '32px',
                  cursor: 'pointer',
                  padding: '0',
                  lineHeight: '1'
                }}
              >
                ×
              </button>
            </div>
            <p style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '24px' }}>
              Request a video or phone consultation with Dr. Sarah Mitchell
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { icon: '📹', title: 'Video Consultation', desc: 'Next Available: This Week' },
                { icon: '📞', title: 'Phone Call', desc: 'Next Available: Tomorrow' }
              ].map((option) => (
                <button
                  key={option.title}
                  onClick={confirmAppointment}
                  style={{
                    padding: '16px 20px',
                    background: 'rgba(139, 92, 246, 0.15)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    transition: 'all 0.2s',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)';
                  }}
                >
                  <span style={{ fontSize: '32px' }}>{option.icon}</span>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '4px' }}>
                      {option.title}
                    </div>
                    <div style={{ fontSize: '13px', color: '#94a3b8' }}>{option.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
