"use client";

import { useState, useEffect, useMemo } from 'react';

interface SymptomData {
  tremor: number;
  rigidity: number;
  slowness: number;
  gait: number;
  history: { tremor: number[]; rigidity: number[]; slowness: number[]; gait: number[] };
}

type SymptomKey = "tremor" | "rigidity" | "slowness" | "gait";

const symptomLabels: Record<SymptomKey, string> = {
  tremor: "Tremor",
  rigidity: "Rigidity",
  slowness: "Slowness",
  gait: "Gait",
};

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

export default function Analytics() {
  const [demoMode, setDemoMode] = useState(true);
  const [symptomData, setSymptomData] = useState<SymptomData>({
    tremor: 45,
    rigidity: 38,
    slowness: 55,
    gait: 50,
    history: {
      tremor: [42, 44, 43, 45, 46, 45, 44, 43, 45],
      rigidity: [35, 37, 36, 38, 39, 38, 37, 36, 38],
      slowness: [52, 54, 53, 55, 56, 55, 54, 53, 55],
      gait: [48, 50, 49, 50, 51, 50, 49, 48, 50],
    },
  });
  const [showGamesPanel, setShowGamesPanel] = useState(false);

  useEffect(() => {
    if (demoMode) {
      const interval = setInterval(() => {
        setSymptomData((prev) => ({
          tremor: Math.max(0, Math.min(100, prev.tremor + (Math.random() - 0.5) * 10)),
          rigidity: Math.max(0, Math.min(100, prev.rigidity + (Math.random() - 0.5) * 10)),
          slowness: Math.max(0, Math.min(100, prev.slowness + (Math.random() - 0.5) * 10)),
          gait: Math.max(0, Math.min(100, prev.gait + (Math.random() - 0.5) * 10)),
          history: {
            tremor: [...prev.history.tremor.slice(-8), prev.tremor],
            rigidity: [...prev.history.rigidity.slice(-8), prev.rigidity],
            slowness: [...prev.history.slowness.slice(-8), prev.slowness],
            gait: [...prev.history.gait.slice(-8), prev.gait],
          },
        }));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [demoMode]);

  const closeGamesPanel = () => {
    setShowGamesPanel(false);
  };

  const launchGame = (url: string) => {
    window.open(url, '_blank');
    setShowGamesPanel(false);
  };

  const measurementKeys: SymptomKey[] = useMemo(() => ["tremor", "rigidity", "slowness", "gait"], []);

  const dominantSymptom = useMemo(() => {
    return measurementKeys.reduce<SymptomKey>((currentMax, candidate) => {
      return symptomData[candidate] > symptomData[currentMax] ? candidate : currentMax;
    }, measurementKeys[0]);
  }, [symptomData, measurementKeys]);

  const recommendedGame = gameDirectory[dominantSymptom];

  const fallRiskScore = useMemo(() => {
    return Math.round((symptomData.gait + symptomData.rigidity) / 2);
  }, [symptomData.gait, symptomData.rigidity]);

  const fallRiskLevel = useMemo(() => {
    if (fallRiskScore >= 65) return "High";
    if (fallRiskScore >= 45) return "Moderate";
    return "Low";
  }, [fallRiskScore]);

  const fallHistory = useMemo(() => {
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const recentGait = symptomData.history.gait.slice(-7);

    return labels.map((label, index) => {
      const gaitValue = recentGait[index] ?? symptomData.gait;
      const incidents = gaitValue >= 65 ? 2 : gaitValue >= 50 ? 1 : 0;
      return {
        day: label,
        incidents,
        gait: Math.round(gaitValue),
      };
    });
  }, [symptomData]);

  const totalWeeklyFalls = useMemo(() => {
    return fallHistory.reduce((sum, day) => sum + day.incidents, 0);
  }, [fallHistory]);

  const fallTrendDirection = useMemo(() => {
    const firstDayIncidents = fallHistory[0]?.incidents ?? 0;
    const lastDayIncidents = fallHistory[fallHistory.length - 1]?.incidents ?? 0;
    if (lastDayIncidents > firstDayIncidents) return "Increasing";
    if (lastDayIncidents < firstDayIncidents) return "Decreasing";
    return "Stable";
  }, [fallHistory]);

  const highestFallRiskDay = useMemo(() => {
    return fallHistory.reduce((maxDay, current) => {
      if (!maxDay || current.incidents > maxDay.incidents) {
        return current;
      }
      return maxDay;
    }, fallHistory[0]);
  }, [fallHistory]);

  const mostRecentIncidentDay = useMemo(() => {
    const lastIncident = [...fallHistory].reverse().find((day) => day.incidents > 0);
    return lastIncident ? lastIncident.day : "None";
  }, [fallHistory]);

  const geminiSummary = useMemo(() => {
    const history = symptomData.history[dominantSymptom];
    const recent = Math.round(symptomData[dominantSymptom]);
    const previous = Math.round(history[history.length - 1] ?? recent);
    const delta = recent - previous;

    const trendDescriptor = (() => {
      if (delta > 2) return `trending up by ${delta} pts`;
      if (delta < -2) return `trending down by ${Math.abs(delta)} pts`;
      return "holding steady";
    })();

    const fallRiskDescriptor = fallRiskLevel.toLowerCase();

    return `Gemini AI Summary: ${symptomLabels[dominantSymptom]} symptoms are ${trendDescriptor}. Gait stability score is ${Math.round(
      symptomData.gait
    )}, indicating ${fallRiskDescriptor} fall risk. Recommended game: ${recommendedGame.name} — ${recommendedGame.benefit}.`;
  }, [dominantSymptom, fallRiskLevel, recommendedGame, symptomData]);

  return (
    <>
      <div className="analytics-view">
        <div className="analytics-view-content">
          <div className="analytics-core-card">
            <div className="analytics-core-header">
              <div className="analytics-core-heading-copy">
                <h2>Symptom Analytics</h2>
                <p>Live measurements, AI insight, and fall risk monitoring in one view.</p>
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
                  onClick={() => setShowGamesPanel(true)}
                >
                  🎮 Games
                </button>
              </div>
            </div>

            <section className="gemini-summary-card">
              <div className="gemini-summary-title">Gemini AI Summary</div>
              <p>{geminiSummary}</p>
              <div className="gemini-game-recommendation">
                <span className="gemini-game-label">Recommended game:</span>
                <span className="gemini-game-name">{recommendedGame.name}</span>
              </div>
            </section>

            <div className="analytics-main-grid">
              <div className="progression-card">
                <div className="progression-header">
                  <h3>Parkinson&apos;s Progression</h3>
                  <span className="progression-badge">UPDRS-III</span>
                </div>
                <p className="progression-subtitle">Disease severity index</p>

                <div className="progression-main-score">
                  <div className="score-number">
                    {Math.round((symptomData.tremor + symptomData.rigidity + symptomData.slowness + symptomData.gait) / 4)}%
                  </div>
                  <div className="score-change">
                    ↗ {Math.round(((symptomData.tremor + symptomData.rigidity + symptomData.slowness + symptomData.gait) / 4) * 0.04)}% vs. baseline
                  </div>
                </div>

                <div className="progression-stage">
                  Stage: <span className="stage-value">
                    {Math.round((symptomData.tremor + symptomData.rigidity + symptomData.slowness + symptomData.gait) / 4) < 40 ? 'Early' : 
                     Math.round((symptomData.tremor + symptomData.rigidity + symptomData.slowness + symptomData.gait) / 4) < 60 ? 'Moderate' : 'Advanced'}
                  </span>
                </div>

                <div className="symptom-breakdown-section">
                  <h4 className="breakdown-title">Symptom Breakdown</h4>
                  
                  <div className="symptom-bar-item">
                    <div className="symptom-bar-header">
                      <span className="symptom-bar-label">Motor</span>
                      <span className="symptom-bar-value">{Math.round((symptomData.tremor + symptomData.slowness) / 2)}%</span>
                    </div>
                    <div className="symptom-bar-track">
                      <div 
                        className="symptom-bar-fill motor-fill" 
                        style={{ width: `${(symptomData.tremor + symptomData.slowness) / 2}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="symptom-bar-item">
                    <div className="symptom-bar-header">
                      <span className="symptom-bar-label">Tremor</span>
                      <span className="symptom-bar-value">{Math.round(symptomData.tremor)}%</span>
                    </div>
                    <div className="symptom-bar-track">
                      <div 
                        className="symptom-bar-fill tremor-fill" 
                        style={{ width: `${symptomData.tremor}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="symptom-bar-item">
                    <div className="symptom-bar-header">
                      <span className="symptom-bar-label">Rigidity</span>
                      <span className="symptom-bar-value">{Math.round(symptomData.rigidity)}%</span>
                    </div>
                    <div className="symptom-bar-track">
                      <div 
                        className="symptom-bar-fill rigidity-fill" 
                        style={{ width: `${symptomData.rigidity}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="symptom-bar-item">
                    <div className="symptom-bar-header">
                      <span className="symptom-bar-label">Gait</span>
                      <span className="symptom-bar-value">{Math.round(symptomData.gait)}%</span>
                    </div>
                    <div className="symptom-bar-track">
                      <div 
                        className="symptom-bar-fill gait-fill" 
                        style={{ width: `${symptomData.gait}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <section className="fall-alert-card">
                <div className="fall-alert-header">
                  <h3>Fall Alert</h3>
                  <span className={`fall-risk-badge fall-risk-${fallRiskLevel.toLowerCase()}`}>
                    {fallRiskLevel} Risk
                  </span>
                </div>
                <p className="fall-alert-overview">
                  {totalWeeklyFalls} incidents reported this week.
                </p>
                <div className="fall-chart">
                  {fallHistory.map((day) => (
                    <div key={day.day} className="fall-bar">
                      <div
                        className="fall-bar-fill"
                        style={{ height: `${day.incidents === 0 ? 8 : day.incidents * 30 + 20}%` }}
                        title={`${day.incidents} alerts`}
                      ></div>
                      <span className="fall-bar-label">{day.day}</span>
                    </div>
                  ))}
                </div>
                <p className="fall-alert-footnote">
                  Monitoring gait variability (avg {Math.round(symptomData.gait)}%) and rigidity to anticipate falls.
                </p>
                <div className="fall-insights">
                  <div className="fall-insight">
                    <span className="fall-insight-label">Incident trend</span>
                    <span className={`fall-insight-value fall-insight-${fallTrendDirection.toLowerCase()}`}>
                      {fallTrendDirection}
                    </span>
                  </div>
                  <div className="fall-insight">
                    <span className="fall-insight-label">Peak day</span>
                    <span className="fall-insight-value">
                      {highestFallRiskDay?.day ?? "—"}
                    </span>
                  </div>
                  <div className="fall-insight">
                    <span className="fall-insight-label">Last incident</span>
                    <span className="fall-insight-value">{mostRecentIncidentDay}</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      {showGamesPanel && (
        <div className="game-modal-overlay" onClick={closeGamesPanel}>
          <div
            className="game-modal-content games-directory"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="games-directory-header">
              <h3>Select a Game</h3>
              <button type="button" className="game-modal-close" onClick={closeGamesPanel}>
                ✕
              </button>
            </div>
            <p className="games-directory-intro">
              Choose a training experience tailored by Gemini AI to reinforce today&apos;s therapy focus.
            </p>
            <ul className="games-directory-list">
              {measurementKeys.map((key) => {
                const game = gameDirectory[key];
                return (
                  <li key={game.name} onClick={() => launchGame(game.url)} style={{ cursor: 'pointer' }}>
                    <div className="games-directory-name">{game.name}</div>
                    <div className="games-directory-description">{game.description}</div>
                  </li>
                );
              })}
            </ul>
            <button type="button" className="games-directory-primary" onClick={closeGamesPanel}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
