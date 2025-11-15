'use client';

import { useState } from 'react';

interface SettingsSection {
  id: string;
  title: string;
  icon: string;
}

export default function Settings() {
  const [activeSection, setActiveSection] = useState<string>('profile');
  const [notifications, setNotifications] = useState({
    medicationReminders: true,
    symptomAlerts: true,
    doctorMessages: true,
    weeklyReports: true,
    fallDetection: true,
  });
  const [preferences, setPreferences] = useState({
    theme: 'dark',
    language: 'English',
    timezone: 'UTC-5 (EST)',
    units: 'metric',
  });
  const [privacy, setPrivacy] = useState({
    shareWithDoctor: true,
    shareWithCaregiver: true,
    anonymousAnalytics: false,
  });
  const [deviceSettings, setDeviceSettings] = useState({
    autoSync: true,
    batteryNotification: true,
    vibrationFeedback: true,
    soundAlerts: true,
  });
  const [saveStatus, setSaveStatus] = useState<string>('');

  const sections: SettingsSection[] = [
    { id: 'profile', title: 'Profile Settings', icon: '👤' },
    { id: 'notifications', title: 'Notifications', icon: '🔔' },
    { id: 'preferences', title: 'Preferences', icon: '⚙️' },
    { id: 'privacy', title: 'Privacy & Data', icon: '🔒' },
    { id: 'devices', title: 'Device Settings', icon: '📱' },
    { id: 'support', title: 'Help & Support', icon: '❓' },
  ];

  const handleSave = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 2000);
    }, 800);
  };

  const ToggleSwitch = ({ active, onClick }: { active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      style={{
        width: '52px',
        height: '28px',
        background: active ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' : 'rgba(255, 255, 255, 0.1)',
        border: 'none',
        borderRadius: '14px',
        cursor: 'pointer',
        position: 'relative',
        transition: 'all 0.3s',
        flexShrink: 0
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '4px',
          left: active ? '26px' : '4px',
          width: '20px',
          height: '20px',
          background: 'white',
          borderRadius: '50%',
          transition: 'all 0.3s',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
        }}
      />
    </button>
  );

  return (
    <div style={{
      height: '100vh',
      overflowY: 'auto',
      overflowX: 'hidden',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '32px'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: '800',
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.02em'
        }}>⚙️ Settings</h1>
        <p style={{ fontSize: '15px', color: '#cbd5e1', margin: 0 }}>
          Customize your StanceSense experience
        </p>
      </div>

      {/* Layout */}
      <div style={{ display: 'flex', gap: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Left Navigation */}
        <nav style={{ width: '240px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 18px',
                background: activeSection === section.id ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: activeSection === section.id ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: activeSection === section.id ? '#a78bfa' : '#cbd5e1',
                fontSize: '15px',
                fontWeight: activeSection === section.id ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'left'
              }}
            >
              <span style={{ fontSize: '20px' }}>{section.icon}</span>
              <span>{section.title}</span>
            </button>
          ))}
        </nav>

        {/* Right Content */}
        <div style={{ flex: 1, paddingBottom: '40px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '32px'
          }}>
            {/* Profile Settings */}
            {activeSection === 'profile' && (
              <>
                <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span>👤</span> Profile Settings
                </h2>
                {[
                  { label: 'Full Name', type: 'text', value: 'John Doe', placeholder: 'Enter your full name' },
                  { label: 'Email Address', type: 'email', value: 'john.doe@example.com', placeholder: 'Enter your email' },
                  { label: 'Phone Number', type: 'tel', value: '+1 (555) 123-4567', placeholder: 'Enter your phone number' },
                  { label: 'Date of Birth', type: 'date', value: '1957-03-15', placeholder: '' },
                  { label: 'Emergency Contact', type: 'text', value: 'Jane Doe - +1 (555) 987-6543', placeholder: 'Name and phone number' }
                ].map((field) => (
                  <div key={field.label} style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#cbd5e1', marginBottom: '8px' }}>
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      defaultValue={field.value}
                      placeholder={field.placeholder}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '15px',
                        outline: 'none',
                        transition: 'all 0.2s'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#8b5cf6';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                ))}
              </>
            )}

            {/* Notifications */}
            {activeSection === 'notifications' && (
              <>
                <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span>🔔</span> Notification Settings
                </h2>
                <p style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '24px' }}>
                  Manage how you receive alerts and updates
                </p>
                {[
                  { key: 'medicationReminders', icon: '💊', label: 'Medication Reminders', desc: 'Get notified when it\'s time to take your medication' },
                  { key: 'symptomAlerts', icon: '⚠️', label: 'Symptom Alerts', desc: 'Receive alerts for unusual symptom patterns' },
                  { key: 'doctorMessages', icon: '💬', label: 'Doctor Messages', desc: 'Notifications for new messages from your doctor' },
                  { key: 'weeklyReports', icon: '📊', label: 'Weekly Reports', desc: 'Receive weekly health summary reports' },
                  { key: 'fallDetection', icon: '🚨', label: 'Fall Detection Alerts', desc: 'Immediate alerts for detected falls' }
                ].map((item) => (
                  <div key={item.key} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 0',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{item.icon}</span> {item.label}
                      </div>
                      <div style={{ fontSize: '13px', color: '#94a3b8' }}>{item.desc}</div>
                    </div>
                    <ToggleSwitch
                      active={notifications[item.key as keyof typeof notifications]}
                      onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof notifications] }))}
                    />
                  </div>
                ))}
              </>
            )}

            {/* Preferences */}
            {activeSection === 'preferences' && (
              <>
                <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span>⚙️</span> General Preferences
                </h2>
                {[
                  { label: 'Theme', value: preferences.theme, options: ['dark', 'light', 'auto'], key: 'theme' },
                  { label: 'Language', value: preferences.language, options: ['English', 'Spanish', 'French', 'German', 'Chinese'], key: 'language' },
                  { label: 'Timezone', value: preferences.timezone, options: ['UTC-5 (EST)', 'UTC-6 (CST)', 'UTC-7 (MST)', 'UTC-8 (PST)'], key: 'timezone' },
                  { label: 'Units', value: preferences.units, options: ['metric', 'imperial'], key: 'units' }
                ].map((field) => (
                  <div key={field.label} style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#cbd5e1', marginBottom: '8px' }}>
                      {field.label}
                    </label>
                    <select
                      value={field.value}
                      onChange={(e) => setPreferences(prev => ({ ...prev, [field.key]: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '15px',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {field.options.map((opt) => (
                        <option key={opt} value={opt} style={{ background: '#1e293b' }}>{opt}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </>
            )}

            {/* Privacy & Data */}
            {activeSection === 'privacy' && (
              <>
                <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span>🔒</span> Privacy & Data
                </h2>
                <p style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '24px' }}>
                  Control who can access your health data
                </p>
                {[
                  { key: 'shareWithDoctor', icon: '👨‍⚕️', label: 'Share with Doctor', desc: 'Allow your doctor to view your health data' },
                  { key: 'shareWithCaregiver', icon: '👥', label: 'Share with Caregiver', desc: 'Allow designated caregivers to access your data' },
                  { key: 'anonymousAnalytics', icon: '📊', label: 'Anonymous Analytics', desc: 'Help improve StanceSense with anonymous usage data' }
                ].map((item) => (
                  <div key={item.key} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 0',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{item.icon}</span> {item.label}
                      </div>
                      <div style={{ fontSize: '13px', color: '#94a3b8' }}>{item.desc}</div>
                    </div>
                    <ToggleSwitch
                      active={privacy[item.key as keyof typeof privacy]}
                      onClick={() => setPrivacy(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof privacy] }))}
                    />
                  </div>
                ))}
                
                <div style={{ marginTop: '32px', display: 'flex', gap: '12px', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Data Management</h3>
                  <button style={{
                    padding: '14px 20px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '12px',
                    color: '#3b82f6',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s'
                  }}>
                    <span>📥</span> Export My Data
                  </button>
                  <button style={{
                    padding: '14px 20px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '12px',
                    color: '#ef4444',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s'
                  }}>
                    <span>🗑️</span> Delete All Data
                  </button>
                </div>
              </>
            )}

            {/* Device Settings */}
            {activeSection === 'devices' && (
              <>
                <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span>📱</span> Device Settings
                </h2>
                <p style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '24px' }}>
                  Manage connected wearable devices
                </p>
                
                {/* Connected Devices */}
                <div style={{ marginBottom: '32px' }}>
                  {[
                    { icon: '⌚', name: 'Wrist Unit', status: 'Connected', battery: 82, color: '#10b981' },
                    { icon: '📡', name: 'Arm Patch', status: 'Standby', battery: 15, color: '#f59e0b' }
                  ].map((device) => (
                    <div key={device.name} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '12px',
                      marginBottom: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '32px' }}>{device.icon}</span>
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>{device.name}</div>
                          <div style={{ fontSize: '13px', color: device.color }}>
                            {device.status} • {device.battery}% Battery
                          </div>
                        </div>
                      </div>
                      <button style={{
                        padding: '8px 16px',
                        background: 'rgba(139, 92, 246, 0.2)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '8px',
                        color: '#a78bfa',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}>
                        Configure
                      </button>
                    </div>
                  ))}
                </div>

                {[
                  { key: 'autoSync', icon: '🔄', label: 'Auto-Sync', desc: 'Automatically sync device data' },
                  { key: 'batteryNotification', icon: '🔋', label: 'Battery Notifications', desc: 'Alert when device battery is low' },
                  { key: 'vibrationFeedback', icon: '📳', label: 'Vibration Feedback', desc: 'Enable haptic feedback on devices' },
                  { key: 'soundAlerts', icon: '🔊', label: 'Sound Alerts', desc: 'Enable audio notifications on devices' }
                ].map((item) => (
                  <div key={item.key} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 0',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{item.icon}</span> {item.label}
                      </div>
                      <div style={{ fontSize: '13px', color: '#94a3b8' }}>{item.desc}</div>
                    </div>
                    <ToggleSwitch
                      active={deviceSettings[item.key as keyof typeof deviceSettings]}
                      onClick={() => setDeviceSettings(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof deviceSettings] }))}
                    />
                  </div>
                ))}
              </>
            )}

            {/* Help & Support */}
            {activeSection === 'support' && (
              <>
                <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span>❓</span> Help & Support
                </h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '16px'
                }}>
                  {[
                    { icon: '📚', title: 'User Guide', desc: 'Learn how to use StanceSense features' },
                    { icon: '💬', title: 'Contact Support', desc: 'Get help from our support team' },
                    { icon: '🐛', title: 'Report a Bug', desc: 'Help us improve the app' },
                    { icon: '📖', title: 'Privacy Policy', desc: 'Read our privacy policy' },
                    { icon: '📋', title: 'Terms of Service', desc: 'View terms and conditions' },
                    { icon: 'ℹ️', title: 'About StanceSense', desc: 'Version 2.4.1' }
                  ].map((card) => (
                    <button
                      key={card.title}
                      style={{
                        padding: '20px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      }}
                    >
                      <div style={{ fontSize: '32px', marginBottom: '12px' }}>{card.icon}</div>
                      <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px', color: 'white' }}>
                        {card.title}
                      </div>
                      <div style={{ fontSize: '13px', color: '#94a3b8' }}>{card.desc}</div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            style={{
              marginTop: '24px',
              width: '100%',
              padding: '16px',
              background: saveStatus === 'saved' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '700',
              cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              boxShadow: '0 4px 16px rgba(139, 92, 246, 0.4)'
            }}
          >
            {saveStatus === 'saving' && '⏳ Saving...'}
            {saveStatus === 'saved' && '✓ Saved Successfully!'}
            {!saveStatus && '💾 Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
