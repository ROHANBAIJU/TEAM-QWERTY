'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useSensorData } from '@/contexts/SensorDataContext';
import { logMedication } from '@/services/medicationService';
import jsPDF from 'jspdf';

interface SymptomData {
  tremor: number;
  rigidity: number;
  slowness: number;
  gait: number;
}

interface ChartConfig {
  type: string;
  data: { labels: string[]; datasets: Array<Record<string, unknown>> };
  options: Record<string, unknown>;
}

interface ChartInstance {
  data: {
    labels: string[];
    datasets: Array<{ data: number[] }>;
  };
  destroy(): void;
  update(mode?: string): void;
}

interface WindowWithChart extends Window {
  Chart?: new (ctx: HTMLCanvasElement, config: ChartConfig) => ChartInstance;
}

type SymptomKey = 'tremor' | 'rigidity' | 'slowness' | 'gait';

export default function Analytics() {
  const { user } = useAuth();
  const { latestData, alerts, ragAnalysis, isConnected, connectionStatus, hasPermanentError } = useSensorData();
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  const [symptomData, setSymptomData] = useState<SymptomData>({
    tremor: 0,
    rigidity: 0,
    slowness: 0,
    gait: 0,
  });

  const [chartInstance, setChartInstance] = useState<ChartInstance | null>(null);
  const [chartData, setChartData] = useState<{
    labels: string[];
    tremor: number[];
    rigidity: number[];
    gait: number[];
  }>({ labels: [], tremor: [], rigidity: [], gait: [] });

  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [medicationForm, setMedicationForm] = useState({
    medication_name: '',
    dosage: '',
    notes: ''
  });

  // Initialize Chart
  const initializeChart = useCallback(async () => {
    const ctx = document.getElementById('liveChart') as HTMLCanvasElement;
    const windowWithChart = window as WindowWithChart;
    if (!ctx || !windowWithChart.Chart) return;

    const Chart = windowWithChart.Chart;
    
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Tremor',
            data: [],
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4,
            fill: true,
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 6,
          },
          {
            label: 'Rigidity',
            data: [],
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            tension: 0.4,
            fill: true,
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 6,
          },
          {
            label: 'Gait',
            data: [],
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            tension: 0.4,
            fill: true,
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 6,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#d1d5db',
              font: { size: 14, weight: '600', family: "'Inter', sans-serif" },
              padding: 16,
              usePointStyle: true,
              pointStyle: 'circle',
            }
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(17, 24, 39, 0.98)',
            titleColor: '#f3f4f6',
            bodyColor: '#d1d5db',
            borderColor: '#374151',
            borderWidth: 1,
            padding: 14,
            titleFont: { size: 14, weight: '600' },
            bodyFont: { size: 13 },
            callbacks: {
              label: (context: { dataset: { label: string }; parsed: { y: number } }) => {
                return `${context.dataset.label}: ${Math.round(context.parsed.y)}%`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              color: '#9ca3af',
              font: { size: 12, family: "'Inter', sans-serif" },
              callback: (value: string | number) => `${value}%`
            },
            grid: { color: 'rgba(255, 255, 255, 0.06)' },
            border: { display: false }
          },
          x: {
            ticks: {
              color: '#9ca3af',
              font: { size: 11, family: "'Inter', sans-serif" },
              maxTicksLimit: 8
            },
            grid: { display: false },
            border: { display: false }
          }
        }
      }
    });

    setChartInstance(chart);
  }, []);

  // Load Chart.js
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.async = true;
    script.onload = () => initializeChart();
    document.body.appendChild(script);

    return () => {
      if (chartInstance) chartInstance.destroy();
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, [initializeChart]);

  // Update from real-time WebSocket data (reduced throttle to 500ms for more responsive updates)
  useEffect(() => {
    if (!latestData) return;
    
    const now = Date.now();
    // Reduced from 3000ms to 500ms for more responsive UI
    if (now - lastUpdateTime >= 500) {
      // Extract scores from either scores object or analysis object
      const scores: any = latestData.scores || {};
      const tremor = scores.tremor !== undefined ? scores.tremor * 100 : 
                     (latestData.analysis?.is_tremor_confirmed ? 50 : 0);
      const rigidity = scores.rigidity !== undefined ? scores.rigidity * 100 :
                       (latestData.analysis?.is_rigid ? 50 : 0);
      const slowness = scores.slowness !== undefined ? scores.slowness * 100 : 0;
      const gait = scores.gait !== undefined ? scores.gait * 100 :
                   (latestData.analysis?.gait_stability_score ? latestData.analysis.gait_stability_score * 100 : 0);
      
      console.log('📊 Updating UI with scores:', { tremor, rigidity, slowness, gait });
      
      setSymptomData({
        tremor,
        rigidity,
        slowness,
        gait,
      });
      setLastUpdateTime(now);
    }
  }, [latestData, lastUpdateTime]);

  // Update chart with live data
  useEffect(() => {
    if (!latestData || !chartInstance) return;

    const scores: any = latestData.scores || {};
    const hasSomeData = scores.tremor !== undefined || scores.rigidity !== undefined || scores.gait !== undefined;
    
    if (!hasSomeData) {
      console.log('⚠️ No score data available yet');
      return;
    }

    const now = new Date();
    const timeLabel = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setChartData(prev => {
      const tremorValue = scores.tremor !== undefined ? scores.tremor * 100 : 0;
      const rigidityValue = scores.rigidity !== undefined ? scores.rigidity * 100 : 0;
      const gaitValue = scores.gait !== undefined ? scores.gait * 100 : 
                        (latestData.analysis?.gait_stability_score ? latestData.analysis.gait_stability_score * 100 : 0);
      
      const newLabels = [...prev.labels, timeLabel].slice(-20);
      const newTremor = [...prev.tremor, tremorValue].slice(-20);
      const newRigidity = [...prev.rigidity, rigidityValue].slice(-20);
      const newGait = [...prev.gait, gaitValue].slice(-20);

      chartInstance.data.labels = newLabels;
      chartInstance.data.datasets[0].data = newTremor;
      chartInstance.data.datasets[1].data = newRigidity;
      chartInstance.data.datasets[2].data = newGait;
      chartInstance.update('none');

      return { labels: newLabels, tremor: newTremor, rigidity: newRigidity, gait: newGait };
    });
  }, [latestData, chartInstance]);

  const handleLogMedication = () => {
    setShowMedicationModal(true);
  };

  const generatePDFReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const leftMargin = 20;
    const rightMargin = pageWidth - 20;
    const contentWidth = rightMargin - leftMargin;
    let yPos = 20;

    // ========== PROFESSIONAL HEADER ==========
    // Dark header bar
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    // Title with subtle line
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.text('STANCESENSE', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Clinical Monitoring Report', pageWidth / 2, 30, { align: 'center' });
    
    // Subtle accent line
    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(0.5);
    doc.line(pageWidth / 2 - 40, 35, pageWidth / 2 + 40, 35);
    
    yPos = 55;

    // ========== PATIENT INFORMATION SECTION ==========
    doc.setFillColor(248, 250, 252);
    doc.rect(leftMargin, yPos, contentWidth, 30, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.rect(leftMargin, yPos, contentWidth, 30, 'S');
    
    yPos += 10;
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PATIENT INFORMATION', leftMargin + 5, yPos);
    
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Patient ID: ${user?.email || 'Anonymous'}`, leftMargin + 5, yPos);
    yPos += 6;
    doc.text(`Report Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, leftMargin + 5, yPos);
    yPos += 6;
    doc.text(`Generated: ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`, leftMargin + 5, yPos);
    
    yPos += 18;

    // ========== EXECUTIVE SUMMARY ==========
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('EXECUTIVE SUMMARY', leftMargin, yPos);
    
    // Underline
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(1);
    doc.line(leftMargin, yPos + 2, leftMargin + 60, yPos + 2);
    yPos += 12;

    const overallScore = Math.round(
      (symptomData.tremor + symptomData.rigidity + symptomData.slowness + symptomData.gait) / 4
    );

    const getProgressionStage = (score: number) => {
      if (score < 25) return { label: 'MILD', color: [16, 185, 129], desc: 'Symptoms are minimal and well-controlled' };
      if (score < 50) return { label: 'MODERATE', color: [245, 158, 11], desc: 'Noticeable symptoms requiring monitoring' };
      if (score < 75) return { label: 'SIGNIFICANT', color: [249, 115, 22], desc: 'Substantial symptoms affecting daily activities' };
      return { label: 'SEVERE', color: [239, 68, 68], desc: 'Advanced symptoms requiring immediate attention' };
    };

    const stage = getProgressionStage(overallScore);
    
    // Overall severity box
    doc.setFillColor(stage.color[0], stage.color[1], stage.color[2], 0.1);
    doc.rect(leftMargin, yPos - 5, contentWidth, 25, 'F');
    doc.setDrawColor(stage.color[0], stage.color[1], stage.color[2]);
    doc.setLineWidth(0.5);
    doc.rect(leftMargin, yPos - 5, contentWidth, 25, 'S');
    
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(stage.color[0], stage.color[1], stage.color[2]);
    doc.text(`${overallScore}%`, leftMargin + 10, yPos + 8);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(stage.label, leftMargin + 40, yPos + 4);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text(stage.desc, leftMargin + 40, yPos + 12);
    
    yPos += 35;

    // ========== SYMPTOM ANALYSIS WITH PROFESSIONAL GRAPHS ==========
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('SYMPTOM ANALYSIS', leftMargin, yPos);
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(1);
    doc.line(leftMargin, yPos + 2, leftMargin + 50, yPos + 2);
    yPos += 15;

    const symptoms = [
      { name: 'Tremor', score: symptomData.tremor, color: [71, 85, 105], abbr: 'TRM' },
      { name: 'Rigidity', score: symptomData.rigidity, color: [71, 85, 105], abbr: 'RGD' },
      { name: 'Slowness', score: symptomData.slowness, color: [71, 85, 105], abbr: 'SLW' },
      { name: 'Gait Issues', score: symptomData.gait, color: [71, 85, 105], abbr: 'GAT' }
    ];

    // Professional bar chart
    const chartHeight = 60;
    const barWidth = 25;
    const spacing = (contentWidth - (barWidth * 4)) / 5;
    
    // Draw chart background
    doc.setFillColor(248, 250, 252);
    doc.rect(leftMargin, yPos, contentWidth, chartHeight + 15, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.rect(leftMargin, yPos, contentWidth, chartHeight + 15, 'S');
    
    // Y-axis reference lines
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    [25, 50, 75].forEach(val => {
      const lineY = yPos + chartHeight - (chartHeight * val / 100);
      doc.line(leftMargin + 5, lineY, rightMargin - 5, lineY);
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(`${val}%`, leftMargin + 2, lineY + 1);
    });
    
    yPos += 5;
    
    symptoms.forEach((symptom, idx) => {
      const xPos = leftMargin + spacing + (idx * (barWidth + spacing));
      const barHeight = (chartHeight - 10) * (symptom.score / 100);
      
      // Bar shadow
      doc.setFillColor(203, 213, 225);
      doc.rect(xPos + 1, yPos + (chartHeight - 10) - barHeight + 1, barWidth, barHeight, 'F');
      
      // Main bar with gradient effect
      doc.setFillColor(symptom.color[0], symptom.color[1], symptom.color[2]);
      doc.rect(xPos, yPos + (chartHeight - 10) - barHeight, barWidth, barHeight, 'F');
      
      // Bar outline
      doc.setDrawColor(51, 65, 85);
      doc.setLineWidth(0.5);
      doc.rect(xPos, yPos + (chartHeight - 10) - barHeight, barWidth, barHeight, 'S');
      
      // Value on top
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(`${symptom.score}%`, xPos + barWidth / 2, yPos + (chartHeight - 10) - barHeight - 3, { align: 'center' });
      
      // Label below
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(symptom.abbr, xPos + barWidth / 2, yPos + chartHeight + 5, { align: 'center' });
    });
    
    yPos += chartHeight + 20;

    // Detailed symptom table
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Detailed Metrics', leftMargin, yPos);
    yPos += 8;
    
    // Table header
    doc.setFillColor(241, 245, 249);
    doc.rect(leftMargin, yPos - 5, contentWidth, 8, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(leftMargin, yPos - 5, contentWidth, 8, 'S');
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('SYMPTOM', leftMargin + 3, yPos);
    doc.text('SCORE', leftMargin + 60, yPos);
    doc.text('STATUS', leftMargin + 90, yPos);
    doc.text('TREND', leftMargin + 130, yPos);
    
    yPos += 8;
    
    // Table rows
    symptoms.forEach((symptom, idx) => {
      const rowY = yPos + (idx * 10);
      
      // Alternating row colors
      if (idx % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(leftMargin, rowY - 5, contentWidth, 10, 'F');
      }
      
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(leftMargin, rowY + 5, rightMargin, rowY + 5);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.text(symptom.name, leftMargin + 3, rowY + 2);
      
      doc.setFont('helvetica', 'bold');
      doc.text(`${symptom.score}%`, leftMargin + 60, rowY + 2);
      
      doc.setFont('helvetica', 'normal');
      const status = symptom.score < 40 ? 'Good' : symptom.score < 70 ? 'Monitor' : 'Alert';
      doc.setTextColor(symptom.score < 40 ? 16 : symptom.score < 70 ? 245 : 239, 
                       symptom.score < 40 ? 185 : symptom.score < 70 ? 158 : 68, 
                       symptom.score < 40 ? 129 : symptom.score < 70 ? 11 : 68);
      doc.text(status, leftMargin + 90, rowY + 2);
      
      doc.setTextColor(100, 116, 139);
      doc.text('Stable', leftMargin + 130, rowY + 2);
    });
    
    yPos += 50;

    // Check if we need a new page
    if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = 20;
    }

    // ========== PATIENT PERSONAL NOTES ==========
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('PATIENT NOTES & OBSERVATIONS', leftMargin, yPos);
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(1);
    doc.line(leftMargin, yPos + 2, leftMargin + 70, yPos + 2);
    yPos += 12;

    // Notes box with lines for writing
    const notesBoxHeight = 50;
    doc.setFillColor(255, 255, 255);
    doc.rect(leftMargin, yPos, contentWidth, notesBoxHeight, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.rect(leftMargin, yPos, contentWidth, notesBoxHeight, 'S');
    
    // Horizontal lines for writing
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    for (let i = 1; i <= 8; i++) {
      const lineY = yPos + (i * 6);
      doc.line(leftMargin + 2, lineY, rightMargin - 2, lineY);
    }
    
    // Placeholder text
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(148, 163, 184);
    doc.text('Space for patient or caregiver notes, observations, and comments...', leftMargin + 3, yPos + 4);
    
    yPos += notesBoxHeight + 15;

    // Check if we need a new page
    if (yPos > pageHeight - 90) {
      doc.addPage();
      yPos = 20;
    }

    // ========== SYMPTOM TREND GRAPH ==========
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('SYMPTOM PROGRESSION TREND', leftMargin, yPos);
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(1);
    doc.line(leftMargin, yPos + 2, leftMargin + 70, yPos + 2);
    yPos += 12;

    // Line graph area
    const graphHeight = 50;
    const graphWidth = contentWidth;
    
    // Graph background
    doc.setFillColor(248, 250, 252);
    doc.rect(leftMargin, yPos, graphWidth, graphHeight, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.rect(leftMargin, yPos, graphWidth, graphHeight, 'S');
    
    // Y-axis labels and grid
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    
    [0, 25, 50, 75, 100].forEach(val => {
      const lineY = yPos + graphHeight - (graphHeight * val / 100);
      doc.line(leftMargin, lineY, rightMargin, lineY);
      doc.text(`${val}`, leftMargin - 8, lineY + 1);
    });
    
    // Simulate trend data (last 7 readings)
    const trendData = chartData.labels.slice(-7).map((_, idx) => ({
      tremor: chartData.tremor[chartData.tremor.length - 7 + idx] || 0,
      rigidity: chartData.rigidity[chartData.rigidity.length - 7 + idx] || 0,
      gait: chartData.gait[chartData.gait.length - 7 + idx] || 0
    }));
    
    if (trendData.length > 0) {
      const plotWidth = graphWidth - 10;
      const pointSpacing = plotWidth / (trendData.length - 1 || 1);
      
      // Plot lines for each symptom
      const symptomLines = [
        { data: trendData.map(d => d.tremor), color: [71, 85, 105], label: 'Tremor' },
        { data: trendData.map(d => d.rigidity), color: [100, 116, 139], label: 'Rigidity' },
        { data: trendData.map(d => d.gait), color: [148, 163, 184], label: 'Gait' }
      ];
      
      symptomLines.forEach((line, lineIdx) => {
        doc.setDrawColor(line.color[0], line.color[1], line.color[2]);
        doc.setLineWidth(0.8);
        
        for (let i = 0; i < line.data.length - 1; i++) {
          const x1 = leftMargin + 5 + (i * pointSpacing);
          const y1 = yPos + graphHeight - (graphHeight * line.data[i] / 100);
          const x2 = leftMargin + 5 + ((i + 1) * pointSpacing);
          const y2 = yPos + graphHeight - (graphHeight * line.data[i + 1] / 100);
          
          doc.line(x1, y1, x2, y2);
          
          // Data points
          doc.setFillColor(line.color[0], line.color[1], line.color[2]);
          doc.circle(x1, y1, 1, 'F');
        }
        
        // Last point
        const lastX = leftMargin + 5 + ((line.data.length - 1) * pointSpacing);
        const lastY = yPos + graphHeight - (graphHeight * line.data[line.data.length - 1] / 100);
        doc.circle(lastX, lastY, 1, 'F');
      });
    }
    
    // X-axis time labels
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    const timeLabels = ['T-6', 'T-5', 'T-4', 'T-3', 'T-2', 'T-1', 'Now'];
    timeLabels.forEach((label, idx) => {
      const xPos = leftMargin + 5 + (idx * (graphWidth - 10) / (timeLabels.length - 1));
      doc.text(label, xPos, yPos + graphHeight + 5, { align: 'center' });
    });
    
    // Legend
    yPos += graphHeight + 12;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    
    [
      { label: '■ Tremor', color: [71, 85, 105] },
      { label: '■ Rigidity', color: [100, 116, 139] },
      { label: '■ Gait', color: [148, 163, 184] }
    ].forEach((item, idx) => {
      const xPos = leftMargin + (idx * 40);
      doc.setTextColor(item.color[0], item.color[1], item.color[2]);
      doc.text(item.label, xPos, yPos);
    });
    
    yPos += 15;

    // Check if we need a new page
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 20;
    }

    // ========== CARE RECOMMENDATIONS ==========
    if (latestData?.care_recommendations && latestData.care_recommendations.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('CARE RECOMMENDATIONS', leftMargin, yPos);
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(1);
      doc.line(leftMargin, yPos + 2, leftMargin + 60, yPos + 2);
      yPos += 12;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);

      latestData.care_recommendations.forEach((rec: string, idx: number) => {
        if (yPos + 15 > pageHeight - 20) {
          doc.addPage();
          yPos = 20;
        }
        
        // Recommendation box
        doc.setFillColor(248, 250, 252);
        const recHeight = 12;
        doc.rect(leftMargin, yPos - 3, contentWidth, recHeight, 'F');
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.3);
        doc.rect(leftMargin, yPos - 3, contentWidth, recHeight, 'S');
        
        // Number badge
        doc.setFillColor(59, 130, 246);
        doc.circle(leftMargin + 5, yPos + 3, 3, 'F');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(`${idx + 1}`, leftMargin + 5, yPos + 4, { align: 'center' });
        
        // Recommendation text (clean up emojis)
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 41, 59);
        // Remove emoji prefixes (first 2-3 characters that are typically emojis)
        const cleanRec = rec.replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*/gu, '').trim();
        const lines = doc.splitTextToSize(cleanRec, contentWidth - 18);
        doc.text(lines, leftMargin + 10, yPos + 2);
        
        yPos += recHeight + 3;
      });
      yPos += 10;
    }

    // ========== THERAPY GAME RECOMMENDATION ==========
    if (latestData?.recommended_game) {
      if (yPos > pageHeight - 50) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('RECOMMENDED THERAPY GAME', leftMargin, yPos);
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(1);
      doc.line(leftMargin, yPos + 2, leftMargin + 68, yPos + 2);
      yPos += 12;

      // Game info box
      doc.setFillColor(248, 250, 252);
      const gameBoxHeight = 30;
      doc.rect(leftMargin, yPos, contentWidth, gameBoxHeight, 'F');
      doc.setDrawColor(139, 92, 246);
      doc.setLineWidth(1);
      doc.rect(leftMargin, yPos, contentWidth, gameBoxHeight, 'S');
      
      yPos += 8;
      
      // Game name with icon box
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(139, 92, 246);
      doc.text('[GAME]', leftMargin + 5, yPos);
      
      doc.setFontSize(11);
      doc.text(latestData.recommended_game.name, leftMargin + 30, yPos);
      yPos += 8;

      // Reason
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const reasonLines = doc.splitTextToSize(latestData.recommended_game.reason, contentWidth - 12);
      doc.text(reasonLines, leftMargin + 5, yPos);
      yPos += reasonLines.length * 4 + 5;

      // Target symptom
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 116, 139);
      doc.text(`Target: ${latestData.recommended_game.target_symptom}`, leftMargin + 5, yPos);
      yPos += 15;
    }

    // ========== AI CLINICAL ANALYSIS ==========
    if (ragAnalysis) {
      if (yPos > pageHeight - 50) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('AI CLINICAL ANALYSIS', leftMargin, yPos);
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(1);
      doc.line(leftMargin, yPos + 2, leftMargin + 55, yPos + 2);
      yPos += 12;

      // Analysis box
      doc.setFillColor(248, 250, 252);
      const analysisText = typeof ragAnalysis === 'string' ? ragAnalysis : ragAnalysis.insights || '';
      const analysisLines = doc.splitTextToSize(analysisText, contentWidth - 8);
      const analysisBoxHeight = analysisLines.length * 5 + 8;
      doc.rect(leftMargin, yPos, contentWidth, analysisBoxHeight, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.rect(leftMargin, yPos, contentWidth, analysisBoxHeight, 'S');
      
      yPos += 6;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(analysisLines, leftMargin + 4, yPos);
      yPos += analysisBoxHeight + 5;
    }

    // ========== MEDICATION LOG SECTION ==========
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('MEDICATION LOG', leftMargin, yPos);
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(1);
    doc.line(leftMargin, yPos + 2, leftMargin + 45, yPos + 2);
    yPos += 12;

    // Medication table
    const medTableHeight = 40;
    doc.setFillColor(248, 250, 252);
    doc.rect(leftMargin, yPos, contentWidth, medTableHeight, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.rect(leftMargin, yPos, contentWidth, medTableHeight, 'S');
    
    // Table header
    yPos += 6;
    doc.setFillColor(241, 245, 249);
    doc.rect(leftMargin + 2, yPos - 3, contentWidth - 4, 7, 'F');
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('MEDICATION', leftMargin + 4, yPos);
    doc.text('DOSAGE', leftMargin + 70, yPos);
    doc.text('TIME', leftMargin + 120, yPos);
    
    // Table rows (empty for manual entry)
    yPos += 7;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    for (let i = 0; i < 4; i++) {
      doc.line(leftMargin + 2, yPos, rightMargin - 2, yPos);
      yPos += 7;
    }
    
    yPos += 10;

    // ========== PROFESSIONAL FOOTER ==========
    // Footer separator line
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(leftMargin, pageHeight - 25, rightMargin, pageHeight - 25);
    
    // Footer content
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('StanceSense - AI-Powered Parkinson\'s Monitoring System', leftMargin, pageHeight - 18);
    doc.text(`Report ID: SS-${Date.now().toString().slice(-8)}`, leftMargin, pageHeight - 12);
    
    doc.text('Confidential Medical Document', rightMargin, pageHeight - 18, { align: 'right' });
    doc.text(`Page 1 of ${doc.getNumberOfPages()}`, rightMargin, pageHeight - 12, { align: 'right' });
    
    // Disclaimer
    doc.setFontSize(6);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(148, 163, 184);
    const disclaimer = 'This report is generated by AI-assisted monitoring and should be reviewed by a qualified healthcare professional.';
    doc.text(disclaimer, pageWidth / 2, pageHeight - 6, { align: 'center' });

    // Save PDF
    const fileName = `StanceSense_Clinical_Report_${new Date().toISOString().split('T')[0]}_${Date.now().toString().slice(-6)}.pdf`;
    doc.save(fileName);
  };

  const handleSubmitMedication = async () => {
    if (!medicationForm.medication_name || !medicationForm.dosage) {
      alert('Please fill in medication name and dosage');
      return;
    }

    try {
      const now = new Date();
      await logMedication({
        timestamp: now.toISOString(),
        medication_name: medicationForm.medication_name,
        dosage: medicationForm.dosage,
        notes: medicationForm.notes || undefined,
        taken_at: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      });

      alert(`✓ ${medicationForm.medication_name} logged successfully!`);
      setShowMedicationModal(false);
      setMedicationForm({ medication_name: '', dosage: '', notes: '' });
    } catch (error) {
      console.error('Failed to log medication:', error);
      alert('Failed to log medication. Please try again.');
    }
  };

  const overallScore = useMemo(() => {
    return Math.round((symptomData.tremor + symptomData.rigidity + symptomData.slowness + symptomData.gait) / 4);
  }, [symptomData]);

  const progressionStage = useMemo(() => {
    if (overallScore < 30) return { label: 'Mild', color: '#10b981' };
    if (overallScore < 60) return { label: 'Moderate', color: '#f59e0b' };
    return { label: 'Severe', color: '#ef4444' };
  }, [overallScore]);

  const getSeverityColor = (value: number) => {
    if (value < 30) return '#10b981';
    if (value < 60) return '#f59e0b';
    return '#ef4444';
  };

  const getSeverityLabel = (value: number) => {
    if (value < 30) return 'Mild';
    if (value < 60) return 'Moderate';
    return 'Severe';
  };

  return (
    <ProtectedRoute>
    <div style={{
      minHeight: '100vh',
      height: '100vh',
      overflowY: 'auto',
      overflowX: 'hidden',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '24px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{
            fontSize: 'clamp(24px, 4vw, 36px)',
            fontWeight: '800',
            color: '#ffffff',
            marginBottom: '8px',
            letterSpacing: '-0.02em'
          }}>
            StanceSense Analytics
          </h1>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>
            Real-time AI symptom monitoring & clinical insights • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Connection Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: isConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            borderRadius: '12px',
            border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            boxShadow: isConnected ? '0 0 20px rgba(16, 185, 129, 0.2)' : 'none',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: isConnected ? '#10b981' : '#ef4444',
              animation: isConnected ? 'pulse 2s infinite' : 'none',
              boxShadow: isConnected ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none'
            }} />
            <span style={{ fontSize: '13px', fontWeight: '600', color: isConnected ? '#10b981' : '#ef4444' }}>
              {isConnected ? '● Live' : '○ Offline'}
            </span>
          </div>

          {/* Log Medication Button */}
          <button
            onClick={handleLogMedication}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
            }}
          >
            💊 Log Medication
          </button>

          {/* Download Report Button */}
          <button
            onClick={generatePDFReport}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
            }}
          >
            📄 Download Report
          </button>
        </div>
      </div>

      {/* AI Clinical Summary - MOVED TO TOP */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 95, 70, 0.1) 100%)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '32px',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        boxShadow: '0 8px 32px rgba(16, 185, 129, 0.2)',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            🤖
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#10b981', marginBottom: '4px' }}>
              AI Clinical Summary
            </h3>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>
              Powered by StanceSense AI Engine
            </p>
          </div>
        </div>

        <div style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: '1.8', marginBottom: '20px' }}>
          Patient is currently in <strong style={{ color: progressionStage.color }}>{progressionStage.label.toLowerCase()} stage</strong> with an overall symptom severity of <strong style={{ color: '#10b981' }}>{overallScore}%</strong>. 
          {symptomData.tremor > 60 && ' Tremor levels are elevated, indicating increased involuntary movement patterns.'}
          {symptomData.rigidity > 60 && ' Significant muscle rigidity detected, suggesting enhanced muscle tone resistance.'}
          {symptomData.slowness > 60 && ' Bradykinesia assessment shows notable movement slowness.'}
          {symptomData.gait > 60 && ' Gait instability is concerning - recommend fall prevention strategies.'}
          {overallScore < 40 && ' Symptoms are well-controlled. Continue current therapy regimen.'}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          <div style={{
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            borderLeft: '4px solid #10b981'
          }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: '600' }}>Dominant Symptom</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>
              {Object.entries(symptomData).reduce((a, b) => a[1] > b[1] ? a : b)[0].charAt(0).toUpperCase() + Object.entries(symptomData).reduce((a, b) => a[1] > b[1] ? a : b)[0].slice(1)}
            </div>
          </div>

          <div style={{
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            borderLeft: '4px solid #3b82f6'
          }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: '600' }}>Fall Risk Level</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: getSeverityColor(symptomData.gait) }}>
              {symptomData.gait < 30 ? 'Low' : symptomData.gait < 60 ? 'Moderate' : 'High'}
            </div>
          </div>

          <div style={{
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            borderLeft: '4px solid #8b5cf6'
          }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: '600' }}>Last Update</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>
              {lastUpdateTime ? new Date(lastUpdateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </div>
          </div>
        </div>
      </div>

      {/* 🎮 Personalized Therapy Games - RAG Analysis Results */}
      {ragAnalysis && ragAnalysis.game_recommendations && ragAnalysis.game_recommendations.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '32px',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          boxShadow: '0 8px 32px rgba(139, 92, 246, 0.2)',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(139, 92, 246, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              🎮
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#8b5cf6', marginBottom: '4px' }}>
                Personalized Therapy Games
              </h3>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                AI-recommended games based on your current symptoms
              </p>
            </div>
          </div>

          <div style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: '1.8', marginBottom: '20px' }}>
            <strong style={{ color: '#8b5cf6' }}>💡 RAG Insights:</strong> {ragAnalysis.insights}
          </div>

          <div style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: '1.8', marginBottom: '24px' }}>
            <strong style={{ color: '#3b82f6' }}>📋 Recommendations:</strong> {ragAnalysis.recommendations}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px'
          }}>
            {ragAnalysis.game_recommendations.map((game, index) => (
              <div key={index} style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(139, 92, 246, 0.3)';
                e.currentTarget.style.borderColor = '#8b5cf6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>
                    {game.name}
                  </div>
                  <div style={{
                    padding: '4px 10px',
                    background: game.difficulty === 'easy' ? 'rgba(16, 185, 129, 0.2)' : game.difficulty === 'medium' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: game.difficulty === 'easy' ? '#10b981' : game.difficulty === 'medium' ? '#f59e0b' : '#ef4444',
                    textTransform: 'uppercase'
                  }}>
                    {game.difficulty}
                  </div>
                </div>

                <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6', marginBottom: '12px' }}>
                  {game.description}
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    color: '#94a3b8'
                  }}>
                    ⏱️ {game.duration_minutes} min
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    color: '#94a3b8'
                  }}>
                    🎯 {game.symptom_target}
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '600', marginBottom: '8px' }}>
                  ✨ Benefits:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {game.benefits.map((benefit, bIndex) => (
                    <div key={bIndex} style={{
                      fontSize: '11px',
                      color: '#94a3b8',
                      paddingLeft: '16px',
                      position: 'relative'
                    }}>
                      <span style={{
                        position: 'absolute',
                        left: '0',
                        color: '#10b981'
                      }}>✓</span>
                      {benefit}
                    </div>
                  ))}
                </div>

                <button style={{
                  width: '100%',
                  marginTop: '16px',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(139, 92, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  🚀 Start Game
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Real-time Sensor Cards Grid */}
      {/* Backend Disconnected Warning - Show only when permanently failed */}
      {!latestData && hasPermanentError && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '32px',
          border: '2px solid rgba(239, 68, 68, 0.5)',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h3 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#ef4444',
            marginBottom: '12px'
          }}>
            Backend Not Connected
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#fca5a5',
            marginBottom: '20px'
          }}>
            Unable to receive data from the backend server. Please ensure the FastAPI server is running on port 8000.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              background: '#ef4444',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#dc2626';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ef4444';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Retry Connection
          </button>
        </div>
      )}
      
      {/* Loading skeleton - Show during initial connection only, not during reconnection */}
      {!latestData && !hasPermanentError && connectionStatus === 'connecting' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          marginBottom: '24px',
          animation: 'fadeIn 0.5s ease'
        }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              height: '180px'
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 100%)',
                backgroundSize: '1000px 100%',
                animation: 'shimmer 2s infinite',
                borderRadius: '12px'
              }} />
            </div>
          ))}
        </div>
      )}
      {latestData && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          marginBottom: '24px'
        }}>
          {/* Tremor Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.3s ease',
            animation: 'fadeIn 0.5s ease',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.4)';
            e.currentTarget.style.borderColor = getSeverityColor((latestData.scores?.tremor || 0) * 100) + '40';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          }}
          >
            {/* Glow effect */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: `linear-gradient(90deg, transparent, ${getSeverityColor((latestData.scores?.tremor || 0) * 100)}, transparent)`,
              opacity: 0.5
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tremor</div>
                <div style={{ fontSize: '40px', fontWeight: '800', color: getSeverityColor((latestData.scores?.tremor || 0) * 100), marginTop: '8px' }}>
                  {Math.round((latestData.scores?.tremor || 0) * 100)}%
                </div>
              </div>
              <div style={{
                padding: '8px 14px',
                background: `${getSeverityColor((latestData.scores?.tremor || 0) * 100)}20`,
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '700',
                color: getSeverityColor((latestData.scores?.tremor || 0) * 100)
              }}>
                {getSeverityLabel((latestData.scores?.tremor || 0) * 100)}
              </div>
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>
              Frequency: {latestData.tremor.frequency_hz.toFixed(1)} Hz • Amplitude: {latestData.tremor.amplitude_g.toFixed(2)}g
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              background: latestData.tremor.tremor_detected ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: '600',
              color: latestData.tremor.tremor_detected ? '#ef4444' : '#10b981'
            }}>
              {latestData.tremor.tremor_detected ? '⚠️ Tremor Detected' : '✓ Normal'}
            </div>
          </div>

          {/* Rigidity Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.3s ease',
            animation: 'fadeIn 0.6s ease',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.4)';
            e.currentTarget.style.borderColor = getSeverityColor((latestData.scores?.rigidity || 0) * 100) + '40';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          }}
          >
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: `linear-gradient(90deg, transparent, ${getSeverityColor((latestData.scores?.rigidity || 0) * 100)}, transparent)`,
              opacity: 0.5
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rigidity</div>
                <div style={{ fontSize: '40px', fontWeight: '800', color: getSeverityColor((latestData.scores?.rigidity || 0) * 100), marginTop: '8px' }}>
                  {Math.round((latestData.scores?.rigidity || 0) * 100)}%
                </div>
              </div>
              <div style={{
                padding: '8px 14px',
                background: `${getSeverityColor((latestData.scores?.rigidity || 0) * 100)}20`,
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '700',
                color: getSeverityColor((latestData.scores?.rigidity || 0) * 100)
              }}>
                {getSeverityLabel((latestData.scores?.rigidity || 0) * 100)}
              </div>
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>
              EMG Wrist: {latestData.rigidity.emg_wrist.toFixed(0)} µV • Arm: {latestData.rigidity.emg_arm.toFixed(0)} µV
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              background: latestData.rigidity.rigid ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: '600',
              color: latestData.rigidity.rigid ? '#ef4444' : '#10b981'
            }}>
              {latestData.rigidity.rigid ? '⚠️ Rigidity Detected' : '✓ Normal'}
            </div>
          </div>

          {/* Gait Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.3s ease',
            animation: 'fadeIn 0.7s ease',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.4)';
            e.currentTarget.style.borderColor = getSeverityColor(100 - (latestData.analysis?.gait_stability_score || 0)) + '40';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          }}
          >
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: `linear-gradient(90deg, transparent, ${getSeverityColor(100 - (latestData.analysis?.gait_stability_score || 0))}, transparent)`,
              opacity: 0.5
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gait Stability</div>
                <div style={{ fontSize: '40px', fontWeight: '800', color: getSeverityColor(100 - (latestData.analysis?.gait_stability_score || 0)), marginTop: '8px' }}>
                  {Math.round(latestData.analysis?.gait_stability_score || 0)}%
                </div>
              </div>
              <div style={{
                padding: '8px 14px',
                background: `${getSeverityColor(100 - (latestData.analysis?.gait_stability_score || 0))}20`,
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '700',
                color: getSeverityColor(100 - (latestData.analysis?.gait_stability_score || 0))
              }}>
                {getSeverityLabel(100 - (latestData.analysis?.gait_stability_score || 0))}
              </div>
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>
              Acceleration: X:{latestData.safety.accel_x_g.toFixed(2)}g Y:{latestData.safety.accel_y_g.toFixed(2)}g Z:{latestData.safety.accel_z_g.toFixed(2)}g
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              background: latestData.safety.fall_detected ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: '600',
              color: latestData.safety.fall_detected ? '#ef4444' : '#10b981'
            }}>
              {latestData.safety.fall_detected ? '🚨 FALL DETECTED' : '✓ No Fall Detected'}
            </div>
          </div>
        </div>
      )}

      {/* Side by Side: Live Chart + Overall Score */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
        gap: '24px',
        marginBottom: '24px'
      }}>
        {/* Live Chart Section - ENHANCED */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          animation: 'fadeIn 0.5s ease',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Animated gradient background */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
            pointerEvents: 'none'
          }} />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
              📊 Live Symptom Monitoring
            </h2>
            <div style={{
              padding: '6px 12px',
              background: 'rgba(239, 68, 68, 0.15)',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: '700',
              color: '#ef4444',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#ef4444',
                animation: 'pulse 1.5s infinite'
              }} />
              LIVE
            </div>
          </div>
          
          <div style={{ position: 'relative', zIndex: 1, height: '280px' }}>
            <canvas 
              id="liveChart"
              style={{ 
                width: '100%', 
                height: '100%',
                borderRadius: '12px'
              }}
            />
            {!latestData && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                color: '#64748b'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📡</div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>Waiting for live data...</div>
              </div>
            )}
          </div>
          
          <div style={{ 
            fontSize: '11px', 
            color: '#64748b', 
            marginTop: '12px', 
            textAlign: 'center',
            position: 'relative',
            zIndex: 1
          }}>
            Last 20 data points • Updates every 2s
          </div>
        </div>

        {/* Overall Score Card - ENHANCED */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '32px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          animation: 'fadeIn 0.5s ease'
        }}>
          {/* Radial gradient background */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '300px',
            height: '300px',
            background: `radial-gradient(circle, ${progressionStage.color}20 0%, transparent 70%)`,
            pointerEvents: 'none'
          }} />

          <h2 style={{ 
            fontSize: '16px', 
            fontWeight: '700', 
            color: '#94a3b8', 
            marginBottom: '32px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            position: 'relative',
            zIndex: 1
          }}>
            OVERALL SYMPTOM SEVERITY
          </h2>

          <div style={{ 
            position: 'relative', 
            width: '220px', 
            height: '220px',
            marginBottom: '24px',
            zIndex: 1
          }}>
            {/* Outer ring */}
            <svg style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              transform: 'rotate(-90deg)',
              filter: 'drop-shadow(0 0 20px ' + progressionStage.color + '40)'
            }} width="220" height="220">
              <circle 
                cx="110" 
                cy="110" 
                r="100" 
                fill="none" 
                stroke="rgba(255,255,255,0.1)" 
                strokeWidth="12"
              />
              <circle 
                cx="110" 
                cy="110" 
                r="100" 
                fill="none" 
                stroke={progressionStage.color} 
                strokeWidth="12"
                strokeDasharray={`${overallScore * 6.28} 628`}
                strokeLinecap="round"
                style={{ 
                  transition: 'stroke-dasharray 0.5s ease',
                  animation: 'fadeIn 1s ease'
                }}
              />
            </svg>

            {/* Center content */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}>
              <div style={{ 
                fontSize: '64px', 
                fontWeight: '900', 
                color: progressionStage.color,
                lineHeight: '1',
                marginBottom: '8px',
                textShadow: `0 0 30px ${progressionStage.color}40`
              }}>
                {overallScore}%
              </div>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: '700', 
                color: progressionStage.color,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {progressionStage.label}
              </div>
            </div>
          </div>

          {/* Care Recommendations */}
          {latestData?.care_recommendations && latestData.care_recommendations.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '700',
                color: '#10b981',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>💡</span> PERSONALIZED CARE TIPS
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {latestData.care_recommendations.map((rec: string, idx: number) => (
                  <div key={idx} style={{
                    fontSize: '13px',
                    color: '#e2e8f0',
                    padding: '10px 12px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #10b981'
                  }}>
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Game Recommendation */}
          {latestData?.recommended_game && (
            <div style={{
              padding: '20px',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2))',
              borderRadius: '12px',
              border: '2px solid rgba(139, 92, 246, 0.5)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                fontSize: '64px',
                opacity: 0.1
              }}>🎮</div>
              
              <h3 style={{
                fontSize: '14px',
                fontWeight: '700',
                color: '#a78bfa',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                🎯 RECOMMENDED THERAPY GAME
              </h3>
              
              <div style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#e2e8f0',
                marginBottom: '8px'
              }}>
                {latestData.recommended_game.name}
              </div>
              
              <div style={{
                fontSize: '13px',
                color: '#cbd5e1',
                marginBottom: '12px',
                lineHeight: '1.5'
              }}>
                {latestData.recommended_game.reason}
              </div>
              
              <div style={{
                display: 'inline-block',
                padding: '6px 12px',
                background: 'rgba(139, 92, 246, 0.3)',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '600',
                color: '#c4b5fd',
                marginBottom: '12px'
              }}>
                Target: {latestData.recommended_game.target_symptom.toUpperCase()}
              </div>
              
              <button
                onClick={() => window.location.href = '/games'}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                🎮 Play Now
              </button>
            </div>
          )}

          <div style={{ 
            fontSize: '13px', 
            color: '#94a3b8', 
            textAlign: 'center',
            marginTop: '20px'
          }}>
            Based on current sensor data and AI analysis
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          boxShadow: '0 8px 32px rgba(139, 92, 246, 0.2)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
            Overall Symptom Severity
          </div>
          <div style={{
            fontSize: 'clamp(56px, 8vw, 80px)',
            fontWeight: '900',
            background: `linear-gradient(135deg, ${progressionStage.color} 0%, ${progressionStage.color}dd 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '16px'
          }}>
            {overallScore}%
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 24px',
            background: `${progressionStage.color}20`,
            borderRadius: '16px',
            border: `2px solid ${progressionStage.color}40`,
            margin: '0 auto'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: progressionStage.color,
              animation: 'pulse 1.5s infinite'
            }} />
            <span style={{ fontSize: '16px', fontWeight: '700', color: progressionStage.color }}>
              {progressionStage.label} Stage
            </span>
          </div>
          <div style={{ marginTop: '20px', fontSize: '12px', color: '#94a3b8' }}>
            Based on UPDRS-III clinical assessment
          </div>
        </div>
      </div>

      {/* Individual Symptom Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Tremor Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '32px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-8px)';
          e.currentTarget.style.boxShadow = '0 12px 48px rgba(239, 68, 68, 0.3)';
          e.currentTarget.style.borderColor = '#ef4444';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              🤝
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Tremor</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: getSeverityColor(symptomData.tremor) }}>
                {Math.round(symptomData.tremor)}%
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div style={{
            width: '100%',
            height: '12px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '6px',
            overflow: 'hidden',
            marginBottom: '16px'
          }}>
            <div style={{
              width: `${symptomData.tremor}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${getSeverityColor(symptomData.tremor)} 0%, ${getSeverityColor(symptomData.tremor)}dd 100%)`,
              borderRadius: '6px',
              transition: 'width 0.6s ease'
            }} />
          </div>

          <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6' }}>
            Measures involuntary shaking frequency and amplitude
          </div>
        </div>

        {/* Rigidity Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '32px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-8px)';
          e.currentTarget.style.boxShadow = '0 12px 48px rgba(245, 158, 11, 0.3)';
          e.currentTarget.style.borderColor = '#f59e0b';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              💪
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Rigidity</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: getSeverityColor(symptomData.rigidity) }}>
                {Math.round(symptomData.rigidity)}%
              </div>
            </div>
          </div>
          
          <div style={{
            width: '100%',
            height: '12px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '6px',
            overflow: 'hidden',
            marginBottom: '16px'
          }}>
            <div style={{
              width: `${symptomData.rigidity}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${getSeverityColor(symptomData.rigidity)} 0%, ${getSeverityColor(symptomData.rigidity)}dd 100%)`,
              borderRadius: '6px',
              transition: 'width 0.6s ease'
            }} />
          </div>

          <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6' }}>
            EMG-based muscle stiffness and resistance detection
          </div>
        </div>

        {/* Slowness Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '32px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-8px)';
          e.currentTarget.style.boxShadow = '0 12px 48px rgba(59, 130, 246, 0.3)';
          e.currentTarget.style.borderColor = '#3b82f6';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              ⏱️
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Slowness</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: getSeverityColor(symptomData.slowness) }}>
                {Math.round(symptomData.slowness)}%
              </div>
            </div>
          </div>
          
          <div style={{
            width: '100%',
            height: '12px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '6px',
            overflow: 'hidden',
            marginBottom: '16px'
          }}>
            <div style={{
              width: `${symptomData.slowness}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${getSeverityColor(symptomData.slowness)} 0%, ${getSeverityColor(symptomData.slowness)}dd 100%)`,
              borderRadius: '6px',
              transition: 'width 0.6s ease'
            }} />
          </div>

          <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6' }}>
            Movement initiation speed and bradykinesia assessment
          </div>
        </div>

        {/* Gait Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '32px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-8px)';
          e.currentTarget.style.boxShadow = '0 12px 48px rgba(139, 92, 246, 0.3)';
          e.currentTarget.style.borderColor = '#8b5cf6';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(139, 92, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              🚶
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Gait Instability</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: getSeverityColor(symptomData.gait) }}>
                {Math.round(symptomData.gait)}%
              </div>
            </div>
          </div>
          
          <div style={{
            width: '100%',
            height: '12px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '6px',
            overflow: 'hidden',
            marginBottom: '16px'
          }}>
            <div style={{
              width: `${symptomData.gait}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${getSeverityColor(symptomData.gait)} 0%, ${getSeverityColor(symptomData.gait)}dd 100%)`,
              borderRadius: '6px',
              transition: 'width 0.6s ease'
            }} />
          </div>

          <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6' }}>
            Walking stability, balance, and fall risk evaluation
          </div>
        </div>
      </div>

      {/* Medication Modal */}
      {showMedicationModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }} onClick={() => setShowMedicationModal(false)}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            borderRadius: '24px',
            padding: '40px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#ffffff', marginBottom: '32px' }}>
              💊 Log Medication
            </h2>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '600', color: '#cbd5e1' }}>
                Medication Name *
              </label>
              <input
                type="text"
                value={medicationForm.medication_name}
                onChange={(e) => setMedicationForm({ ...medicationForm, medication_name: e.target.value })}
                placeholder="e.g., Levodopa, Carbidopa"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '600', color: '#cbd5e1' }}>
                Dosage *
              </label>
              <input
                type="text"
                value={medicationForm.dosage}
                onChange={(e) => setMedicationForm({ ...medicationForm, dosage: e.target.value })}
                placeholder="e.g., 100mg, 2 tablets"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff',
                  outline: 'none'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
              />
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '600', color: '#cbd5e1' }}>
                Notes (optional)
              </label>
              <textarea
                value={medicationForm.notes}
                onChange={(e) => setMedicationForm({ ...medicationForm, notes: e.target.value })}
                placeholder="Any additional notes..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowMedicationModal(false)}
                style={{
                  flex: 1,
                  padding: '14px',
                  fontSize: '16px',
                  fontWeight: '600',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'transparent',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitMedication}
                disabled={!medicationForm.medication_name || !medicationForm.dosage}
                style={{
                  flex: 1,
                  padding: '14px',
                  fontSize: '16px',
                  fontWeight: '600',
                  borderRadius: '12px',
                  border: 'none',
                  background: medicationForm.medication_name && medicationForm.dosage
                    ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                    : 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  cursor: medicationForm.medication_name && medicationForm.dosage ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  boxShadow: medicationForm.medication_name && medicationForm.dosage
                    ? '0 4px 12px rgba(59, 130, 246, 0.3)'
                    : 'none'
                }}
                onMouseEnter={(e) => {
                  if (medicationForm.medication_name && medicationForm.dosage) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = medicationForm.medication_name && medicationForm.dosage
                    ? '0 4px 12px rgba(59, 130, 246, 0.3)'
                    : 'none';
                }}
              >
                Log Medication
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pulse Animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @media (max-width: 768px) {
          body {
            padding: 16px;
          }
        }
      `}</style>
    </div>
    </ProtectedRoute>
  );
}
