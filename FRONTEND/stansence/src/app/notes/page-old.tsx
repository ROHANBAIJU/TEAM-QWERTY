'use client';

import { useState, useEffect } from 'react';
import { submitPatientNote, getNotesHistory } from '@/services/medicationService';

interface Note {
  id: string;
  content: string;
  timestamp: string;
  date: Date;
  category?: 'symptom' | 'observation' | 'general';
}

type ViewMode = 'today' | 'history';

const INITIAL_NOTES: Note[] = [
  {
    id: '1',
    content: 'Felt very stiff getting out of bed this morning',
    timestamp: 'Oct 21, 9:00 AM',
    date: new Date('2024-10-21T09:00:00'),
    category: 'symptom',
  },
  {
    id: '2',
    content: 'Had a good afternoon walk, felt steady',
    timestamp: 'Oct 20, 3:15 PM',
    date: new Date('2024-10-20T15:15:00'),
    category: 'observation',
  },
  {
    id: '3',
    content: 'Tremors more noticeable before dinner',
    timestamp: 'Oct 20, 5:45 PM',
    date: new Date('2024-10-20T17:45:00'),
    category: 'symptom',
  },
];

// Mock historical notes data
const generateHistoricalNotes = (): Note[] => {
  const historicalData = [
    { content: 'Felt very stiff getting out of bed this morning', days: 0, hour: 9, minute: 0, category: 'symptom' as const },
    { content: 'Had a good afternoon walk, felt steady', days: 1, hour: 15, minute: 15, category: 'observation' as const },
    { content: 'Tremors more noticeable before dinner', days: 1, hour: 17, minute: 45, category: 'symptom' as const },
    { content: 'Medication taken on time, no issues', days: 2, hour: 8, minute: 30, category: 'general' as const },
    { content: 'Balance felt off during morning routine', days: 3, hour: 7, minute: 45, category: 'symptom' as const },
    { content: 'Completed physical therapy exercises', days: 3, hour: 14, minute: 0, category: 'observation' as const },
    { content: 'Experienced mild headache in evening', days: 4, hour: 19, minute: 20, category: 'symptom' as const },
    { content: 'Good night sleep, woke up refreshed', days: 5, hour: 7, minute: 0, category: 'observation' as const },
    { content: 'Joint stiffness reduced after warm bath', days: 6, hour: 20, minute: 15, category: 'observation' as const },
    { content: 'Slight dizziness when standing quickly', days: 7, hour: 11, minute: 30, category: 'symptom' as const },
    { content: 'Energy levels good throughout the day', days: 8, hour: 16, minute: 0, category: 'observation' as const },
    { content: 'Minor tremors in left hand during writing', days: 9, hour: 10, minute: 45, category: 'symptom' as const },
    { content: 'Successfully completed all daily tasks', days: 10, hour: 18, minute: 30, category: 'observation' as const },
    { content: 'Feeling more stable with new medication', days: 12, hour: 9, minute: 15, category: 'general' as const },
    { content: 'Stiffness worse in cold weather', days: 14, hour: 8, minute: 0, category: 'symptom' as const },
    { content: 'Enjoyed family gathering, felt alert', days: 15, hour: 14, minute: 30, category: 'observation' as const },
    { content: 'Night-time restlessness, difficulty sleeping', days: 16, hour: 22, minute: 45, category: 'symptom' as const },
    { content: 'Morning exercises helped with mobility', days: 18, hour: 7, minute: 30, category: 'observation' as const },
    { content: 'Experienced muscle cramps in legs', days: 20, hour: 21, minute: 0, category: 'symptom' as const },
    { content: 'Overall improvement in balance this week', days: 22, hour: 16, minute: 15, category: 'observation' as const },
  ];

  return historicalData.map((item, index) => {
    const date = new Date();
    date.setDate(date.getDate() - item.days);
    date.setHours(item.hour, item.minute, 0, 0);
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const minutes = item.minute < 10 ? '0' + item.minute : item.minute;
    const hours = item.hour > 12 ? item.hour - 12 : (item.hour === 0 ? 12 : item.hour);
    const ampm = item.hour >= 12 ? 'PM' : 'AM';
    const timestamp = `${months[date.getMonth()]} ${date.getDate()}, ${hours}:${minutes} ${ampm}`;

    return {
      id: `hist-${index}`,
      content: item.content,
      timestamp,
      date,
      category: item.category,
    };
  });
};

export default function PatientNotes() {
  const [viewMode, setViewMode] = useState<ViewMode>('today');
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES);
  const [historicalNotes, setHistoricalNotes] = useState<Note[]>(generateHistoricalNotes());
  const [noteText, setNoteText] = useState('');
  const [noteCategory, setNoteCategory] = useState<'symptom' | 'observation' | 'general'>('symptom');
  const [noteSeverity, setNoteSeverity] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [saveButtonText, setSaveButtonText] = useState('SAVE NOTE');
  const [saveButtonBg, setSaveButtonBg] = useState('');
  const isTodayView = viewMode === 'today';
  const isHistoryView = viewMode === 'history';

  useEffect(() => {
    // Fetch notes history from API
    const fetchNotes = async () => {
      try {
        const response = await getNotesHistory(100, 30);
        if (response.notes.length > 0) {
          const formattedNotes = response.notes.map(note => ({
            id: note.id,
            content: note.content,
            timestamp: new Date(note.timestamp).toLocaleString(),
            date: new Date(note.timestamp),
            category: note.category
          }));
          setHistoricalNotes(formattedNotes);
        }
      } catch (error) {
        console.error('Failed to fetch notes:', error);
      }
    };
    fetchNotes();
  }, []);

  useEffect(() {
    // Auto-focus on textarea when coming from LOG SYMPTOM button
    if (isTodayView) {
      const textarea = document.getElementById('noteTextarea') as HTMLTextAreaElement;
      if (textarea) {
        setTimeout(() => {
          textarea.focus();
          textarea.style.borderColor = '#3b82f6';
          textarea.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)';
          setTimeout(() => {
            textarea.style.borderColor = '';
            textarea.style.boxShadow = '';
          }, 2000);
        }, 300);
      }
    }
  }, [isTodayView]);

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;

    try {
      const now = new Date();
      await submitPatientNote({
        timestamp: now.toISOString(),
        content: noteText,
        severity: noteSeverity,
        category: noteCategory,
        tags: []
      });

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const minutes = now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes();
      const hours = now.getHours() > 12 ? now.getHours() - 12 : (now.getHours() === 0 ? 12 : now.getHours());
      const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
      const timestamp = `${months[now.getMonth()]} ${now.getDate()}, ${hours}:${minutes} ${ampm}`;

      const newNote: Note = {
        id: Date.now().toString(),
        content: noteText,
        timestamp,
        date: now,
        category: noteCategory,
      };

      setNotes(prev => [newNote, ...prev]);
      setNoteText('');
      setNoteCategory('symptom');
      setNoteSeverity('moderate');

      // Show success feedback
      setSaveButtonText('✓ SAVED!');
      setSaveButtonBg('#10b981');
      
      setTimeout(() => {
        setSaveButtonText('SAVE NOTE');
        setSaveButtonBg('');
      }, 2000);
    } catch (error) {
      console.error('Failed to save note:', error);
      alert('Failed to save note. Please try again.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSaveNote();
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'symptom': return '🩺';
      case 'observation': return '🔍';
      default: return '📝';
    }
  };

  const renderToggleButtons = () => (
    <div className="notes-view-toggle">
      <button 
        className={`toggle-btn ${isTodayView ? 'active' : ''}`}
        onClick={() => setViewMode('today')}
      >
        📅 Today&apos;s Notes
      </button>
      <button 
        className={`toggle-btn ${isHistoryView ? 'active' : ''}`}
        onClick={() => setViewMode('history')}
      >
        📊 Monthly Timeline
      </button>
    </div>
  );

  return (
    <section className="notes-page">
      <div className="notes-main">
        {isTodayView ? (
          <>
            <div className="notes-input-section">
              <div className="input-header">
                <h2>✍️ Add New Entry</h2>
                <span className="input-hint">Ctrl+Enter to save quickly</span>
              </div>
              
              {/* Category and Severity Selectors */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    Category
                  </label>
                  <select
                    value={noteCategory}
                    onChange={(e) => setNoteCategory(e.target.value as 'symptom' | 'observation' | 'general')}
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontSize: '15px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-bg)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="symptom">🩺 Symptom</option>
                    <option value="observation">🔍 Observation</option>
                    <option value="general">📝 General</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    Severity
                  </label>
                  <select
                    value={noteSeverity}
                    onChange={(e) => setNoteSeverity(e.target.value as 'low' | 'moderate' | 'high')}
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontSize: '15px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-bg)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="low">🟢 Low</option>
                    <option value="moderate">🟡 Moderate</option>
                    <option value="high">🔴 High</option>
                  </select>
                </div>
              </div>
              
              <textarea 
                id="noteTextarea"
                className="notes-textarea"
                placeholder="Describe your symptoms, observations, or any health-related notes here..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={6}
              ></textarea>
              <button 
                className="btn-save-note" 
                onClick={handleSaveNote}
                disabled={!noteText.trim()}
                style={{ background: saveButtonBg }}
              >
                {saveButtonText}
              </button>
            </div>

            <div className="notes-list-section">
              <div className="list-header">
                <h2>📖 Recent Entries</h2>
                <span className="entry-count">{notes.length} {notes.length === 1 ? 'entry' : 'entries'}</span>
              </div>
              <div className="notes-list">
                {notes.length === 0 ? (
                  <div className="empty-state">
                    <p>No notes logged yet today.</p>
                    <p>Start tracking your symptoms and observations above.</p>
                  </div>
                ) : (
                  notes.map((note) => (
                    <div key={note.id} className="note-entry">
                      <div className="note-header-row">
                        <span className="note-category">{getCategoryIcon(note.category)}</span>
                        <span className="note-timestamp">⏰ {note.timestamp}</span>
                      </div>
                      <div className="note-content">{note.content}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="notes-history-section">
              <div className="history-header">
                <h2>📊 Monthly Timeline</h2>
                <p className="history-subtitle">Complete history of all logged entries this month</p>
              </div>
              <div className="notes-timeline">
                {historicalNotes.map((note) => (
                  <div key={note.id} className="timeline-entry">
                    <div className="timeline-marker">
                      <span className="timeline-icon">{getCategoryIcon(note.category)}</span>
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-timestamp">{note.timestamp}</div>
                      <div className="timeline-text">{note.content}</div>
                      {note.category && (
                        <span className={`timeline-badge badge-${note.category}`}>
                          {note.category}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        <div className="notes-bottom-bar">
          {renderToggleButtons()}
        </div>
      </div>
    </section>
  );
}
