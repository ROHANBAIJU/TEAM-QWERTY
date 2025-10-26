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
    dataExport: false,
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

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const togglePrivacy = (key: keyof typeof privacy) => {
    setPrivacy(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleDevice = (key: keyof typeof deviceSettings) => {
    setDeviceSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1 className="settings-title">⚙️ Settings</h1>
        <p className="settings-subtitle">Customize your StanceSense experience</p>
      </div>

      <div className="settings-layout">
        {/* Left Navigation */}
        <nav className="settings-nav">
          {sections.map((section) => (
            <button
              key={section.id}
              className={`settings-nav-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <span className="settings-nav-icon">{section.icon}</span>
              <span className="settings-nav-text">{section.title}</span>
            </button>
          ))}
        </nav>

        {/* Right Content Area */}
        <div className="settings-content">
          {/* Profile Settings */}
          {activeSection === 'profile' && (
            <div className="settings-section">
              <h2 className="section-title">👤 Profile Settings</h2>
              
              <div className="settings-card">
                <div className="settings-group">
                  <label className="settings-label">Full Name</label>
                  <input 
                    type="text" 
                    className="settings-input" 
                    defaultValue="John Doe"
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="settings-group">
                  <label className="settings-label">Email Address</label>
                  <input 
                    type="email" 
                    className="settings-input" 
                    defaultValue="john.doe@example.com"
                    placeholder="Enter your email"
                  />
                </div>

                <div className="settings-group">
                  <label className="settings-label">Phone Number</label>
                  <input 
                    type="tel" 
                    className="settings-input" 
                    defaultValue="+1 (555) 123-4567"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="settings-group">
                  <label className="settings-label">Date of Birth</label>
                  <input 
                    type="date" 
                    className="settings-input" 
                    defaultValue="1957-03-15"
                  />
                </div>

                <div className="settings-group">
                  <label className="settings-label">Emergency Contact</label>
                  <input 
                    type="text" 
                    className="settings-input" 
                    defaultValue="Jane Doe - +1 (555) 987-6543"
                    placeholder="Name and phone number"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeSection === 'notifications' && (
            <div className="settings-section">
              <h2 className="section-title">🔔 Notification Settings</h2>
              
              <div className="settings-card">
                <p className="section-description">Manage how you receive alerts and updates</p>

                <div className="toggle-group">
                  <div className="toggle-item">
                    <div className="toggle-info">
                      <span className="toggle-label">💊 Medication Reminders</span>
                      <span className="toggle-description">Get notified when it&apos;s time to take your medication</span>
                    </div>
                    <button 
                      className={`toggle-switch ${notifications.medicationReminders ? 'active' : ''}`}
                      onClick={() => toggleNotification('medicationReminders')}
                    >
                      <span className="toggle-slider"></span>
                    </button>
                  </div>

                  <div className="toggle-item">
                    <div className="toggle-info">
                      <span className="toggle-label">⚠️ Symptom Alerts</span>
                      <span className="toggle-description">Receive alerts for unusual symptom patterns</span>
                    </div>
                    <button 
                      className={`toggle-switch ${notifications.symptomAlerts ? 'active' : ''}`}
                      onClick={() => toggleNotification('symptomAlerts')}
                    >
                      <span className="toggle-slider"></span>
                    </button>
                  </div>

                  <div className="toggle-item">
                    <div className="toggle-info">
                      <span className="toggle-label">💬 Doctor Messages</span>
                      <span className="toggle-description">Notifications for new messages from your doctor</span>
                    </div>
                    <button 
                      className={`toggle-switch ${notifications.doctorMessages ? 'active' : ''}`}
                      onClick={() => toggleNotification('doctorMessages')}
                    >
                      <span className="toggle-slider"></span>
                    </button>
                  </div>

                  <div className="toggle-item">
                    <div className="toggle-info">
                      <span className="toggle-label">📊 Weekly Reports</span>
                      <span className="toggle-description">Receive weekly health summary reports</span>
                    </div>
                    <button 
                      className={`toggle-switch ${notifications.weeklyReports ? 'active' : ''}`}
                      onClick={() => toggleNotification('weeklyReports')}
                    >
                      <span className="toggle-slider"></span>
                    </button>
                  </div>

                  <div className="toggle-item">
                    <div className="toggle-info">
                      <span className="toggle-label">🚨 Fall Detection Alerts</span>
                      <span className="toggle-description">Immediate alerts for detected falls</span>
                    </div>
                    <button 
                      className={`toggle-switch ${notifications.fallDetection ? 'active' : ''}`}
                      onClick={() => toggleNotification('fallDetection')}
                    >
                      <span className="toggle-slider"></span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preferences */}
          {activeSection === 'preferences' && (
            <div className="settings-section">
              <h2 className="section-title">⚙️ General Preferences</h2>
              
              <div className="settings-card">
                <div className="settings-group">
                  <label className="settings-label">Theme</label>
                  <select 
                    className="settings-select"
                    value={preferences.theme}
                    onChange={(e) => setPreferences(prev => ({ ...prev, theme: e.target.value }))}
                  >
                    <option value="dark">Dark Mode</option>
                    <option value="light">Light Mode</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </div>

                <div className="settings-group">
                  <label className="settings-label">Language</label>
                  <select 
                    className="settings-select"
                    value={preferences.language}
                    onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Chinese">Chinese</option>
                  </select>
                </div>

                <div className="settings-group">
                  <label className="settings-label">Timezone</label>
                  <select 
                    className="settings-select"
                    value={preferences.timezone}
                    onChange={(e) => setPreferences(prev => ({ ...prev, timezone: e.target.value }))}
                  >
                    <option value="UTC-5 (EST)">UTC-5 (Eastern)</option>
                    <option value="UTC-6 (CST)">UTC-6 (Central)</option>
                    <option value="UTC-7 (MST)">UTC-7 (Mountain)</option>
                    <option value="UTC-8 (PST)">UTC-8 (Pacific)</option>
                  </select>
                </div>

                <div className="settings-group">
                  <label className="settings-label">Units</label>
                  <select 
                    className="settings-select"
                    value={preferences.units}
                    onChange={(e) => setPreferences(prev => ({ ...prev, units: e.target.value }))}
                  >
                    <option value="metric">Metric (kg, cm)</option>
                    <option value="imperial">Imperial (lbs, ft)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Privacy & Data */}
          {activeSection === 'privacy' && (
            <div className="settings-section">
              <h2 className="section-title">🔒 Privacy & Data</h2>
              
              <div className="settings-card">
                <p className="section-description">Control who can access your health data</p>

                <div className="toggle-group">
                  <div className="toggle-item">
                    <div className="toggle-info">
                      <span className="toggle-label">👨‍⚕️ Share with Doctor</span>
                      <span className="toggle-description">Allow your doctor to view your health data</span>
                    </div>
                    <button 
                      className={`toggle-switch ${privacy.shareWithDoctor ? 'active' : ''}`}
                      onClick={() => togglePrivacy('shareWithDoctor')}
                    >
                      <span className="toggle-slider"></span>
                    </button>
                  </div>

                  <div className="toggle-item">
                    <div className="toggle-info">
                      <span className="toggle-label">👥 Share with Caregiver</span>
                      <span className="toggle-description">Allow designated caregivers to access your data</span>
                    </div>
                    <button 
                      className={`toggle-switch ${privacy.shareWithCaregiver ? 'active' : ''}`}
                      onClick={() => togglePrivacy('shareWithCaregiver')}
                    >
                      <span className="toggle-slider"></span>
                    </button>
                  </div>

                  <div className="toggle-item">
                    <div className="toggle-info">
                      <span className="toggle-label">📊 Anonymous Analytics</span>
                      <span className="toggle-description">Help improve StanceSense with anonymous usage data</span>
                    </div>
                    <button 
                      className={`toggle-switch ${privacy.anonymousAnalytics ? 'active' : ''}`}
                      onClick={() => togglePrivacy('anonymousAnalytics')}
                    >
                      <span className="toggle-slider"></span>
                    </button>
                  </div>
                </div>

                <div className="data-management">
                  <h3 className="subsection-title">Data Management</h3>
                  <button className="action-button">
                    <span>📥</span>
                    <span>Export My Data</span>
                  </button>
                  <button className="action-button danger">
                    <span>🗑️</span>
                    <span>Delete All Data</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Device Settings */}
          {activeSection === 'devices' && (
            <div className="settings-section">
              <h2 className="section-title">📱 Device Settings</h2>
              
              <div className="settings-card">
                <p className="section-description">Manage connected wearable devices</p>

                <div className="connected-devices">
                  <div className="device-item">
                    <div className="device-info">
                      <span className="device-icon">⌚</span>
                      <div className="device-details">
                        <span className="device-name">Wrist Unit</span>
                        <span className="device-status connected">Connected • 82% Battery</span>
                      </div>
                    </div>
                    <button className="device-action">Configure</button>
                  </div>

                  <div className="device-item">
                    <div className="device-info">
                      <span className="device-icon">📡</span>
                      <div className="device-details">
                        <span className="device-name">Arm Patch</span>
                        <span className="device-status standby">Standby • 15% Battery</span>
                      </div>
                    </div>
                    <button className="device-action">Configure</button>
                  </div>
                </div>

                <div className="toggle-group">
                  <div className="toggle-item">
                    <div className="toggle-info">
                      <span className="toggle-label">🔄 Auto-Sync</span>
                      <span className="toggle-description">Automatically sync device data</span>
                    </div>
                    <button 
                      className={`toggle-switch ${deviceSettings.autoSync ? 'active' : ''}`}
                      onClick={() => toggleDevice('autoSync')}
                    >
                      <span className="toggle-slider"></span>
                    </button>
                  </div>

                  <div className="toggle-item">
                    <div className="toggle-info">
                      <span className="toggle-label">🔋 Battery Notifications</span>
                      <span className="toggle-description">Alert when device battery is low</span>
                    </div>
                    <button 
                      className={`toggle-switch ${deviceSettings.batteryNotification ? 'active' : ''}`}
                      onClick={() => toggleDevice('batteryNotification')}
                    >
                      <span className="toggle-slider"></span>
                    </button>
                  </div>

                  <div className="toggle-item">
                    <div className="toggle-info">
                      <span className="toggle-label">📳 Vibration Feedback</span>
                      <span className="toggle-description">Enable haptic feedback on devices</span>
                    </div>
                    <button 
                      className={`toggle-switch ${deviceSettings.vibrationFeedback ? 'active' : ''}`}
                      onClick={() => toggleDevice('vibrationFeedback')}
                    >
                      <span className="toggle-slider"></span>
                    </button>
                  </div>

                  <div className="toggle-item">
                    <div className="toggle-info">
                      <span className="toggle-label">🔊 Sound Alerts</span>
                      <span className="toggle-description">Enable audio notifications on devices</span>
                    </div>
                    <button 
                      className={`toggle-switch ${deviceSettings.soundAlerts ? 'active' : ''}`}
                      onClick={() => toggleDevice('soundAlerts')}
                    >
                      <span className="toggle-slider"></span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Help & Support */}
          {activeSection === 'support' && (
            <div className="settings-section">
              <h2 className="section-title">❓ Help & Support</h2>
              
              <div className="settings-card">
                <div className="support-grid">
                  <a href="#" className="support-card">
                    <span className="support-icon">📚</span>
                    <h3>User Guide</h3>
                    <p>Learn how to use StanceSense features</p>
                  </a>

                  <a href="#" className="support-card">
                    <span className="support-icon">💬</span>
                    <h3>Contact Support</h3>
                    <p>Get help from our support team</p>
                  </a>

                  <a href="#" className="support-card">
                    <span className="support-icon">🐛</span>
                    <h3>Report a Bug</h3>
                    <p>Help us improve the app</p>
                  </a>

                  <a href="#" className="support-card">
                    <span className="support-icon">📖</span>
                    <h3>Privacy Policy</h3>
                    <p>Read our privacy policy</p>
                  </a>

                  <a href="#" className="support-card">
                    <span className="support-icon">📋</span>
                    <h3>Terms of Service</h3>
                    <p>View terms and conditions</p>
                  </a>

                  <a href="#" className="support-card">
                    <span className="support-icon">ℹ️</span>
                    <h3>About StanceSense</h3>
                    <p>Version 2.4.1</p>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="settings-actions">
            <button 
              className={`save-button ${saveStatus}`}
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
            >
              {saveStatus === 'saving' && '⏳ Saving...'}
              {saveStatus === 'saved' && '✓ Saved Successfully!'}
              {!saveStatus && '💾 Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
