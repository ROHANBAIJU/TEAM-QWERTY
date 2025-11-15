"use client";

import { useState } from 'react';

type SymptomKey = "tremor" | "rigidity" | "slowness" | "gait";

const gameDirectory: Record<
  SymptomKey,
  { name: string; description: string; benefit: string; url: string }
> = {
  tremor: {
    name: "Steady Hand",
    description: "Targeted hand-eye coordination with steady tracing drills.",
    benefit: "reinforce fine motor control and reduce tremor variance",
    url: "/games/steady-hand/index.html",
  },
  rigidity: {
    name: "Strength Meter",
    description: "Grip and release exercises with progressive resistance cues.",
    benefit: "loosen muscle stiffness with rhythmic isometric reps",
    url: "/games/strength-meter/index.html",
  },
  slowness: {
    name: "Rhythm Tap",
    description: "Tempo-matched tap patterns to quicken initiation speed.",
    benefit: "boost movement timing and reaction speed",
    url: "/games/rhythm-tap/index.html",
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
  const measurementKeys: SymptomKey[] = ["tremor", "rigidity", "slowness", "gait"];

  const launchGame = (name: string, url: string) => {
    setSelectedGame({ name, url });
    // Hide sidebar and navbar when game starts
    document.body.style.overflow = 'hidden';
  };

  const closeGame = () => {
    setSelectedGame(null);
    // Restore normal scrolling when returning to games list
    document.body.style.overflow = '';
  };

  // If a game is selected, show fullscreen game view
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
        {/* Large, accessible back button */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 10000
        }}>
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
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 1)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span style={{ fontSize: '24px' }}>←</span>
            <span>Back to Games</span>
          </button>
        </div>

        {/* Game title indicator */}
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
          <div style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#ffffff'
          }}>
            {selectedGame.name}
          </div>
        </div>

        {/* Fullscreen iframe */}
        <iframe
          src={selectedGame.url}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block'
          }}
          title={selectedGame.name}
          allow="accelerometer; gyroscope"
        />
      </div>
    );
  }

  // Game icon mapping for visual appeal
  const gameIcons: Record<SymptomKey, string> = {
    tremor: "🎯",
    rigidity: "💪",
    slowness: "⚡",
    gait: "👣"
  };

  // Color schemes for each game
  const gameColors: Record<SymptomKey, { primary: string; hover: string; shadow: string }> = {
    tremor: { primary: 'rgba(16, 185, 129, 0.15)', hover: 'rgba(16, 185, 129, 0.25)', shadow: 'rgba(16, 185, 129, 0.4)' },
    rigidity: { primary: 'rgba(251, 146, 60, 0.15)', hover: 'rgba(251, 146, 60, 0.25)', shadow: 'rgba(251, 146, 60, 0.4)' },
    slowness: { primary: 'rgba(59, 130, 246, 0.15)', hover: 'rgba(59, 130, 246, 0.25)', shadow: 'rgba(59, 130, 246, 0.4)' },
    gait: { primary: 'rgba(139, 92, 246, 0.15)', hover: 'rgba(139, 92, 246, 0.25)', shadow: 'rgba(139, 92, 246, 0.4)' }
  };

  return (
    <div className="analytics-view" style={{ overflow: 'hidden', height: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
      <div className="analytics-view-content" style={{ overflow: 'hidden', height: '100%' }}>
        <div className="analytics-core-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(10px)' }}>
          <div className="analytics-core-header" style={{ flexShrink: 0, borderBottom: '2px solid rgba(139, 92, 246, 0.3)', paddingBottom: '12px' }}>
            <div className="analytics-core-heading-copy">
              <h2 style={{ marginBottom: '4px', fontSize: '28px', fontWeight: '800', background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🎮 Training Games</h2>
              <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1' }}>Choose a game to start your personalized training session</p>
            </div>
            <div className="analytics-core-actions">
              <div className="demo-toggle">
                <input
                  type="checkbox"
                  id="demo-mode"
                  checked={demoMode}
                  onChange={(e) => setDemoMode(e.target.checked)}
                />
                <label htmlFor="demo-mode">Demo Mode</label>
              </div>
              <div
                id="sensor-status"
                className={`sensor-status ${demoMode ? "demo" : "connected"}`}
              >
                {demoMode ? "📡 Demo" : "🔌 Connected"}
              </div>
              <button
                className="analytics-games-btn"
                type="button"
                style={{ cursor: 'default', opacity: 0.7 }}
              >
                🎮 Games
              </button>
            </div>
          </div>

          <div className="games-page-content" style={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            padding: '16px 24px 16px'
          }}>
            <div className="games-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px',
              flex: 1,
              alignContent: 'center',
              maxWidth: '1200px',
              margin: '0 auto',
              width: '100%'
            }}>
              {measurementKeys.map((key) => {
                const game = gameDirectory[key];
                const colors = gameColors[key];
                const icon = gameIcons[key];
                return (
                  <div 
                    key={game.name} 
                    className="game-card"
                    onClick={() => launchGame(game.name, game.url)}
                    style={{
                      background: `linear-gradient(135deg, ${colors.primary} 0%, rgba(15, 23, 42, 0.8) 100%)`,
                      borderRadius: '16px',
                      padding: '24px',
                      cursor: 'pointer',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: '2px solid rgba(139, 92, 246, 0.3)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '180px',
                      maxHeight: '180px',
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
                      top: '-15px',
                      right: '-15px',
                      fontSize: '100px',
                      opacity: '0.08',
                      transform: 'rotate(15deg)'
                    }}>
                      {icon}
                    </div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{
                        fontSize: '40px',
                        marginBottom: '10px',
                        display: 'inline-block',
                        animation: 'float 3s ease-in-out infinite'
                      }}>
                        {icon}
                      </div>
                      <div style={{
                        fontSize: '22px',
                        fontWeight: '800',
                        marginBottom: '8px',
                        color: '#ffffff',
                        textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                      }}>
                        {game.name}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: '#cbd5e1',
                        lineHeight: '1.5',
                        marginBottom: '10px'
                      }}>
                        {game.description}
                      </div>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '10px 14px',
                      background: 'rgba(139, 92, 246, 0.2)',
                      borderRadius: '10px',
                      border: '1px solid rgba(139, 92, 246, 0.4)',
                      position: 'relative',
                      zIndex: 1
                    }}>
                      <span style={{ fontSize: '14px' }}>🎯</span>
                      <span style={{ 
                        fontSize: '12px', 
                        color: '#e0e7ff',
                        fontWeight: '600',
                        lineHeight: '1.3'
                      }}>
                        {game.benefit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{
              marginTop: '16px',
              padding: '12px 20px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
              borderRadius: '10px',
              border: '2px solid rgba(139, 92, 246, 0.3)',
              flexShrink: 0,
              boxShadow: '0 4px 16px rgba(139, 92, 246, 0.2)'
            }}>
              <p style={{ 
                fontSize: '13px', 
                color: '#e0e7ff', 
                margin: 0,
                textAlign: 'center',
                fontWeight: '500'
              }}>
                💡 <strong style={{ color: '#ffffff' }}>Tip:</strong> Click any game card to start. Demo Mode works without hardware sensors.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add floating animation keyframes */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
