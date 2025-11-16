"use client";

import { useState } from 'react';

type SymptomKey = "tremor" | "rigidity" | "gait";

const gameDirectory: Record<SymptomKey, { name: string; description: string; benefit: string; url: string }> = {
  tremor: {
    name: "Steady Hand",
    description: "Targeted hand-eye coordination with steady tracing drills.",
    benefit: "reinforce fine motor control and reduce tremor variance",
    url: "/games/steady-hand/index.html",
  },
  rigidity: {
    name: "EMG Strength Dial",
    description: "Marvel-themed muscle strength gauge with real-time EMG monitoring.",
    benefit: "measure and improve grip strength from Starlord to Thanos level",
    url: "/games/emg-strength-dial/index.html",
  },
  gait: {
    name: "Rhythm Walker",
    description: "Adaptive stepping paths that coach balanced walking.",
    benefit: "steady gait cadence and improve balance awareness",
    url: "/games/rhythm-walker/index.html",
  },
};

export default function GamesPage() {
  const [demoMode, setDemoMode] = useState(true);
  const [selectedGame, setSelectedGame] = useState<{ name: string; url: string } | null>(null);
  const measurementKeys: SymptomKey[] = ["tremor", "rigidity", "gait"];

  const launchGame = (name: string, url: string) => {
    setSelectedGame({ name, url });
    document.body.style.overflow = 'hidden';
  };

  const closeGame = () => {
    setSelectedGame(null);
    document.body.style.overflow = '';
  };

  if (selectedGame) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#000000',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10000 }}>
          <button
            onClick={closeGame}
            style={{
              padding: '16px 32px',
              background: 'rgba(239, 68, 68, 0.9)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '12px',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '20px',
              fontWeight: '700',
              transition: 'all 0.3s',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <span style={{ fontSize: '24px' }}>←</span>
            <span>Back to Games</span>
          </button>
        </div>
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 10000,
          padding: '16px 24px',
          background: 'rgba(139, 92, 246, 0.9)',
          borderRadius: '12px',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>
            {selectedGame.name}
          </div>
        </div>
        <iframe
          src={selectedGame.url}
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          title={selectedGame.name}
          allow="accelerometer; gyroscope"
        />
      </div>
    );
  }

  const gameIcons: Record<SymptomKey, string> = {
    tremor: "🎯",
    rigidity: "⚡",
    gait: "👣"
  };

  const gameColors: Record<SymptomKey, { primary: string; hover: string; shadow: string }> = {
    tremor: { primary: 'rgba(16, 185, 129, 0.15)', hover: 'rgba(16, 185, 129, 0.25)', shadow: 'rgba(16, 185, 129, 0.4)' },
    rigidity: { primary: 'rgba(220, 38, 38, 0.15)', hover: 'rgba(220, 38, 38, 0.25)', shadow: 'rgba(220, 38, 38, 0.4)' },
    gait: { primary: 'rgba(139, 92, 246, 0.15)', hover: 'rgba(139, 92, 246, 0.25)', shadow: 'rgba(139, 92, 246, 0.4)' }
  };

  return (
    <div style={{
      height: '100vh',
      overflowY: 'auto',
      overflowX: 'hidden',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '32px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '24px'
      }}>
        <div>
          <h1 style={{
            fontSize: '48px',
            fontWeight: '800',
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em'
          }}>🎮 Training Games</h1>
          <p style={{ fontSize: '15px', color: '#cbd5e1', margin: 0 }}>
            Choose a game to start your personalized training session
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 16px',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={demoMode}
              onChange={(e) => setDemoMode(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#cbd5e1' }}>Demo Mode</span>
          </label>
          <div style={{
            padding: '10px 16px',
            background: demoMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            border: `1px solid ${demoMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            borderRadius: '10px',
            color: demoMode ? '#3b82f6' : '#10b981',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            {demoMode ? '📡 Demo' : '🔌 Connected'}
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        maxWidth: '1400px',
        margin: '0 auto',
        paddingBottom: '40px'
      }}>
        {measurementKeys.map((key) => {
          const game = gameDirectory[key];
          const colors = gameColors[key];
          const icon = gameIcons[key];
          
          return (
            <div
              key={game.name}
              onClick={() => launchGame(game.name, game.url)}
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, rgba(15, 23, 42, 0.8) 100%)`,
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                padding: '32px',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '280px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: `0 8px 32px ${colors.shadow}15`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `linear-gradient(135deg, ${colors.hover} 0%, rgba(15, 23, 42, 0.6) 100%)`;
                e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                e.currentTarget.style.borderColor = colors.shadow;
                e.currentTarget.style.boxShadow = `0 16px 48px ${colors.shadow}40`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `linear-gradient(135deg, ${colors.primary} 0%, rgba(15, 23, 42, 0.8) 100%)`;
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                e.currentTarget.style.boxShadow = `0 8px 32px ${colors.shadow}15`;
              }}
            >
              {/* Decorative background icon */}
              <div style={{
                position: 'absolute',
                top: '-30px',
                right: '-30px',
                fontSize: '150px',
                opacity: '0.08',
                transform: 'rotate(15deg)',
                pointerEvents: 'none'
              }}>
                {icon}
              </div>

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  fontSize: '64px',
                  marginBottom: '16px',
                  display: 'inline-block',
                  animation: 'float 3s ease-in-out infinite'
                }}>
                  {icon}
                </div>
                <div style={{
                  fontSize: '28px',
                  fontWeight: '800',
                  marginBottom: '12px',
                  color: '#ffffff',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                }}>
                  {game.name}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#cbd5e1',
                  lineHeight: '1.6',
                  marginBottom: '16px'
                }}>
                  {game.description}
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 18px',
                background: 'rgba(139, 92, 246, 0.2)',
                borderRadius: '12px',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                position: 'relative',
                zIndex: 1
              }}>
                <span style={{ fontSize: '18px' }}>🎯</span>
                <span style={{
                  fontSize: '13px',
                  color: '#e0e7ff',
                  fontWeight: '600',
                  lineHeight: '1.4'
                }}>
                  {game.benefit}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Banner */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '20px 28px',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        boxShadow: '0 4px 16px rgba(139, 92, 246, 0.2)'
      }}>
        <p style={{
          fontSize: '14px',
          color: '#e0e7ff',
          margin: 0,
          textAlign: 'center',
          fontWeight: '500'
        }}>
          💡 <strong style={{ color: '#ffffff' }}>Tip:</strong> Click any game card to start. Demo Mode works without hardware sensors.
        </p>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
      `}</style>
    </div>
  );
}
