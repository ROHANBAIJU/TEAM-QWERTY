'use client';

import { useState, useEffect } from 'react';
import { submitPatientNote, getNotesHistory } from '@/services/medicationService';

interface Note {
  id: string;
  content: string;
  timestamp: string;
  date: Date;
  category?: 'symptom' | 'observation' | 'general';
  severity?: 'low' | 'moderate' | 'high';
}

export default function PatientNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteText, setNoteText] = useState('');
  const [noteCategory, setNoteCategory] = useState<'symptom' | 'observation' | 'general'>('symptom');
  const [noteSeverity, setNoteSeverity] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await getNotesHistory(100, 30);
        if (response.notes.length > 0) {
          const formattedNotes = response.notes.map(note => ({
            id: note.id,
            content: note.content,
            timestamp: new Date(note.timestamp).toLocaleString(),
            date: new Date(note.timestamp),
            category: note.category,
            severity: note.severity
          }));
          setNotes(formattedNotes);
        }
      } catch (error) {
        console.error('Failed to fetch notes:', error);
      }
    };
    fetchNotes();
  }, []);

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;

    setSaving(true);
    try {
      const now = new Date();
      await submitPatientNote({
        timestamp: now.toISOString(),
        content: noteText,
        severity: noteSeverity,
        category: noteCategory,
        tags: []
      });

      const newNote: Note = {
        id: Date.now().toString(),
        content: noteText,
        timestamp: now.toLocaleString(),
        date: now,
        category: noteCategory,
        severity: noteSeverity
      };

      setNotes(prev => [newNote, ...prev]);
      setNoteText('');
      setNoteCategory('symptom');
      setNoteSeverity('moderate');
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to save note:', error);
      alert('Failed to save note. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'symptom': return '🩺';
      case 'observation': return '🔍';
      default: return '📝';
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'symptom': return '#ef4444';
      case 'observation': return '#3b82f6';
      default: return '#8b5cf6';
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'low': return '#10b981';
      case 'moderate': return '#f59e0b';
      case 'high': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const groupNotesByDate = (notes: Note[]) => {
    const groups: { [key: string]: Note[] } = {};
    notes.forEach(note => {
      const dateKey = note.date.toLocaleDateString();
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(note);
    });
    return groups;
  };

  const groupedNotes = groupNotesByDate(notes);

  return (
    <div style={{
      minHeight: '100vh',
      height: '100vh',
      overflowY: 'auto',
      overflowX: 'hidden',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '24px',
      paddingBottom: '60px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: 'clamp(24px, 4vw, 36px)',
          fontWeight: '800',
          color: '#ffffff',
          marginBottom: '8px',
          letterSpacing: '-0.02em'
        }}>
          Patient Notes
        </h1>
        <p style={{ fontSize: '14px', color: '#94a3b8' }}>
          Track symptoms, observations, and daily health updates
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Input Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '32px',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          boxShadow: '0 8px 32px rgba(139, 92, 246, 0.15)',
          gridColumn: 'span 1'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(139, 92, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px'
            }}>
              ✍️
            </div>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', marginBottom: '4px' }}>
                Add New Entry
              </h3>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                Ctrl+Enter to save
              </p>
            </div>
          </div>

          {/* Category Selector */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontSize: '13px', fontWeight: '600', color: '#cbd5e1' }}>
              Category
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['symptom', 'observation', 'general'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setNoteCategory(cat)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    fontSize: '13px',
                    fontWeight: '600',
                    borderRadius: '10px',
                    border: noteCategory === cat ? `2px solid ${getCategoryColor(cat)}` : '1px solid rgba(255, 255, 255, 0.1)',
                    background: noteCategory === cat ? `${getCategoryColor(cat)}20` : 'rgba(255, 255, 255, 0.03)',
                    color: noteCategory === cat ? getCategoryColor(cat) : '#94a3b8',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {getCategoryIcon(cat)} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Severity Selector */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontSize: '13px', fontWeight: '600', color: '#cbd5e1' }}>
              Severity
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['low', 'moderate', 'high'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setNoteSeverity(sev)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    fontSize: '13px',
                    fontWeight: '600',
                    borderRadius: '10px',
                    border: noteSeverity === sev ? `2px solid ${getSeverityColor(sev)}` : '1px solid rgba(255, 255, 255, 0.1)',
                    background: noteSeverity === sev ? `${getSeverityColor(sev)}20` : 'rgba(255, 255, 255, 0.03)',
                    color: noteSeverity === sev ? getSeverityColor(sev) : '#94a3b8',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {sev.charAt(0).toUpperCase() + sev.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Text Area */}
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                handleSaveNote();
              }
            }}
            placeholder="Describe your symptoms, observations, or any health-related notes..."
            style={{
              width: '100%',
              minHeight: '120px',
              padding: '16px',
              fontSize: '15px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.03)',
              color: '#ffffff',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit',
              marginBottom: '16px',
              lineHeight: '1.6'
            }}
          />

          {/* Save Button */}
          <button
            onClick={handleSaveNote}
            disabled={!noteText.trim() || saving}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '15px',
              fontWeight: '700',
              borderRadius: '12px',
              border: 'none',
              background: noteText.trim() && !saving
                ? showSuccess ? '#10b981' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                : 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              cursor: noteText.trim() && !saving ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              boxShadow: noteText.trim() && !saving ? '0 4px 12px rgba(139, 92, 246, 0.3)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {saving ? '⏳ Saving...' : showSuccess ? '✓ Saved!' : '💾 Save Note'}
          </button>
        </div>

        {/* Stats Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '32px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', marginBottom: '24px' }}>
            📊 Summary
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '14px', color: '#94a3b8' }}>Total Entries</span>
              <span style={{ fontSize: '24px', fontWeight: '800', color: '#8b5cf6' }}>{notes.length}</span>
            </div>

            <div style={{
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '14px', color: '#94a3b8' }}>Symptoms</span>
              <span style={{ fontSize: '24px', fontWeight: '800', color: '#ef4444' }}>
                {notes.filter(n => n.category === 'symptom').length}
              </span>
            </div>

            <div style={{
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '14px', color: '#94a3b8' }}>Observations</span>
              <span style={{ fontSize: '24px', fontWeight: '800', color: '#3b82f6' }}>
                {notes.filter(n => n.category === 'observation').length}
              </span>
            </div>

            <div style={{
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '14px', color: '#94a3b8' }}>High Severity</span>
              <span style={{ fontSize: '24px', fontWeight: '800', color: '#ef4444' }}>
                {notes.filter(n => n.severity === 'high').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '32px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', marginBottom: '24px' }}>
          📖 Timeline
        </h3>

        {notes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
            <div style={{ fontSize: '16px', marginBottom: '8px' }}>No notes yet</div>
            <div style={{ fontSize: '14px' }}>Start tracking your symptoms and observations above</div>
          </div>
        ) : (
          Object.entries(groupedNotes).map(([date, dateNotes]) => (
            <div key={date} style={{ marginBottom: '32px' }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '700',
                color: '#8b5cf6',
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {date}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {dateNotes.map((note) => (
                  <div
                    key={note.id}
                    style={{
                      padding: '20px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '14px',
                      borderLeft: `4px solid ${getCategoryColor(note.category)}`,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>{getCategoryIcon(note.category)}</span>
                        <span style={{
                          padding: '4px 10px',
                          background: `${getCategoryColor(note.category)}20`,
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700',
                          color: getCategoryColor(note.category),
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          {note.category}
                        </span>
                        {note.severity && (
                          <span style={{
                            padding: '4px 10px',
                            background: `${getSeverityColor(note.severity)}20`,
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '700',
                            color: getSeverityColor(note.severity),
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>
                            {note.severity}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {new Date(note.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: '1.6' }}>
                      {note.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
