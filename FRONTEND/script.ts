// ==========================================
// ACCESSIBILITY ENHANCEMENTS FOR PARKINSON'S PATIENTS
// ==========================================

// Type definitions for Chart.js
declare class Chart {
    constructor(ctx: CanvasRenderingContext2D, config: any);
}

// Theme Management
function initializeTheme(): void {
    const themeToggle = document.getElementById('themeToggle') as HTMLButtonElement;
    const savedTheme = localStorage.getItem('theme') || 'dark';
    
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        if (themeToggle) themeToggle.innerHTML = '☀️';
    }
    
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            const isLight = document.body.classList.contains('light-mode');
            themeToggle.innerHTML = isLight ? '☀️' : '🌙';
            themeToggle.title = isLight ? 'Switch to dark mode (Alt+T)' : 'Switch to light mode (Alt+T)';
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
        });
    }
}

// Keyboard Shortcuts for Accessibility
function initializeKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
        // Alt+D: Log Dose
        if (e.altKey && e.key.toLowerCase() === 'd') {
            e.preventDefault();
            const logDoseBtn = document.querySelector('.btn-log-dose') as HTMLButtonElement;
            if (logDoseBtn) logDoseBtn.click();
        }
        
        // Alt+S: Log Symptom
        if (e.altKey && e.key.toLowerCase() === 's') {
            e.preventDefault();
            const logSymptomBtn = document.querySelector('.btn-log-symptom') as HTMLButtonElement;
            if (logSymptomBtn) logSymptomBtn.click();
        }
        
        // Alt+T: Toggle Theme
        if (e.altKey && e.key.toLowerCase() === 't') {
            e.preventDefault();
            const themeToggle = document.getElementById('themeToggle') as HTMLButtonElement;
            if (themeToggle) themeToggle.click();
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    initializeKeyboardShortcuts();
    initializeCharts();
});

interface ChartDataset {
    label: string;
    data: (number | null)[];
    borderColor: string;
    backgroundColor: string | string[];
    tension?: number;
    borderWidth?: number;
    pointRadius?: number | number[];
    fill?: boolean;
    pointBackgroundColor?: string;
    pointHoverRadius?: number;
    showLine?: boolean;
}

interface ChartData {
    labels: string[];
    datasets: ChartDataset[];
}

interface ChartOptions {
    responsive: boolean;
    maintainAspectRatio: boolean;
    plugins: {
        legend: {
            display: boolean;
        };
        tooltip: {
            backgroundColor: string;
            titleColor: string;
            bodyColor: string;
            borderColor: string;
            borderWidth: number;
            padding: number;
            cornerRadius: number;
        };
    };
    scales: {
        x: {
            grid: {
                color: string;
                drawBorder: boolean;
            };
            ticks: {
                color: string;
                font: {
                    size: number;
                };
            };
        };
        y: {
            grid: {
                color: string;
                drawBorder: boolean;
            };
            ticks: {
                color: string;
                font: {
                    size: number;
                };
                stepSize: number;
            };
            min: number;
            max: number;
        };
    };
    interaction?: {
        intersect: boolean;
        mode: string;
    };
}

// Store the symptomChart globally
let symptomChart: any = null;

// Initialize Charts
function initializeCharts(): void {
    // Symptom Trends Chart - Enhanced for Accessibility
    const symptomCtx = (document.getElementById('symptomChart') as HTMLCanvasElement)?.getContext('2d');

    if (symptomCtx) {
        const symptomChartData: ChartData = {
            labels: ['12AM', '2AM', '4AM', '6AM', '8AM', '10AM', '12PM', '2PM', '4PM', '6PM', '8PM', '10PM', '12AM'],
            datasets: [
                {
                    label: 'Your Symptoms',
                    data: [3, 2.8, 3.5, 4, 3.2, 2.5, 2, 3.5, 4.2, 3.8, 3.2, 3, 3.5],
                    borderColor: '#60a5fa', // High-contrast blue
                    backgroundColor: 'rgba(96, 165, 250, 0.15)',
                    tension: 0.4,
                    borderWidth: 6, // Thicker line for visibility
                    pointRadius: 0,
                    fill: true
                },
                {
                    label: 'Medication Taken',
                    data: [null, null, null, null, 4.5, null, null, null, 4.5, null, null, null, null],
                    borderColor: '#fbbf24', // High-contrast yellow
                    backgroundColor: '#fbbf24',
                    pointRadius: 10, // Larger dots
                    pointHoverRadius: 14,
                    showLine: false
                }
            ]
        };

        const symptomChartOptions: ChartOptions = {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(10, 12, 16, 0.98)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#fbbf24',
                    borderWidth: 2,
                    padding: 16,
                    cornerRadius: 12
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.15)',
                        drawBorder: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.9)',
                        font: {
                            size: 16
                        }
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.15)',
                        drawBorder: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.9)',
                        font: {
                            size: 16
                        },
                        stepSize: 1
                    },
                    min: 0,
                    max: 5
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        };

        symptomChart = new Chart(symptomCtx, {
            type: 'line',
            data: symptomChartData,
            options: symptomChartOptions
        });
    }

    // Fall Events Chart - Enhanced for Accessibility
    const fallCtx = (document.getElementById('fallChart') as HTMLCanvasElement)?.getContext('2d');

    if (fallCtx) {
        const fallChartData: ChartData = {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Fall Events',
                data: [1, 0, 2, 1, 3, 2, 1],
                borderColor: '#f87171', // High-contrast red
                backgroundColor: 'rgba(248, 113, 113, 0.25)',
                tension: 0.4,
                borderWidth: 6,
                pointRadius: 9,
                pointBackgroundColor: '#ef4444',
                fill: true
            }]
        };

        const fallChartOptions: ChartOptions = {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(10, 12, 16, 0.98)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#ef4444',
                    borderWidth: 2,
                    padding: 16,
                    cornerRadius: 12
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.15)',
                        drawBorder: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.9)',
                        font: {
                            size: 16
                        }
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.15)',
                        drawBorder: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.9)',
                        font: {
                            size: 16
                        },
                        stepSize: 1
                    },
                    min: 0,
                    max: 4
                }
            }
        };

        const fallChart = new Chart(fallCtx, {
            type: 'line',
            data: fallChartData,
            options: fallChartOptions
        });
    }
}

// Dose tracking
interface DoseTime {
    time: string;
    label: string;
    chartIndex: number;
}

const doseTimes: DoseTime[] = [
    { time: '8:00 AM', label: 'Morning Dose', chartIndex: 4 },
    { time: '2:00 PM', label: 'Afternoon Dose', chartIndex: 7 },
    { time: '8:00 PM', label: 'Evening Dose', chartIndex: 10 }
];

// Function to get current dose based on time
function getCurrentDose(): DoseTime | null {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Morning dose: 6 AM - 11 AM
    if (currentHour >= 6 && currentHour < 11) {
        return doseTimes[0];
    }
    // Afternoon dose: 11 AM - 6 PM
    else if (currentHour >= 11 && currentHour < 18) {
        return doseTimes[1];
    }
    // Evening dose: 6 PM - 12 AM or 12 AM - 6 AM
    else {
        return doseTimes[2];
    }
}

// Function to mark dose as taken
function markDoseAsTaken(doseTime: string): void {
    const doseItems = document.querySelectorAll('.dose-item');
    
    doseItems.forEach((item: Element): void => {
        const timeElement = item.querySelector('.dose-time');
        if (timeElement && timeElement.textContent === doseTime) {
            // Add taken class
            item.classList.add('taken');
            
            // Get current time for the badge
            const now = new Date();
            const hours = now.getHours() > 12 ? now.getHours() - 12 : (now.getHours() === 0 ? 12 : now.getHours());
            const minutes = now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes();
            const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
            const actualTime = `${hours}:${minutes} ${ampm}`;
            
            // Add or update "Taken" badge with actual time
            let statusBadge = item.querySelector('.dose-status') as HTMLElement;
            if (!statusBadge) {
                statusBadge = document.createElement('span');
                statusBadge.className = 'dose-status';
                item.appendChild(statusBadge);
            }
            statusBadge.innerHTML = `✓ Taken<br><small style="font-size: 10px; opacity: 0.8;">${actualTime}</small>`;
        }
    });
}

// Function to add medication marker to chart
function addMedicationMarker(chartIndex: number): void {
    if (symptomChart) {
        const medicationDataset = symptomChart.data.datasets[1];
        medicationDataset.data[chartIndex] = 4.5;
        symptomChart.update();
    }
}

// Button Click Handlers
const logDoseButton = document.querySelector('.btn-log-dose') as HTMLButtonElement;
const logSymptomButton = document.querySelector('.btn-log-symptom') as HTMLButtonElement;

if (logDoseButton) {
    logDoseButton.addEventListener('click', (): void => {
        const currentDose = getCurrentDose();
        
        if (currentDose) {
            // Mark dose as taken in the list
            markDoseAsTaken(currentDose.time);
            
            // Add marker to chart
            addMedicationMarker(currentDose.chartIndex);
            
            // Show success message with actual time
            const now = new Date();
            const hours = now.getHours() > 12 ? now.getHours() - 12 : (now.getHours() === 0 ? 12 : now.getHours());
            const minutes = now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes();
            const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
            const actualTime = `${hours}:${minutes} ${ampm}`;
            
            alert(`✓ ${currentDose.label} logged successfully\nRecorded at: ${actualTime}`);
        } else {
            alert('Unable to determine current dose time');
        }
    });
}

if (logSymptomButton) {
    logSymptomButton.addEventListener('click', (): void => {
        // Switch to Patient Notes tab
        const patientNotesTab = document.querySelector('.menu-item[data-tab="patient-notes"]') as HTMLElement;
        if (patientNotesTab) {
            patientNotesTab.click();
            
            // After tab switch, focus on textarea
            setTimeout(() => {
                const notesTextarea = document.querySelector('#noteTextarea') as HTMLTextAreaElement;
                if (notesTextarea) {
                    notesTextarea.focus();
                    
                    // Add a visual highlight effect
                    notesTextarea.style.borderColor = '#3b82f6';
                    notesTextarea.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)';
                    
                    // Remove highlight after 2 seconds
                    setTimeout(() => {
                        notesTextarea.style.borderColor = '';
                        notesTextarea.style.boxShadow = '';
                    }, 2000);
                }
            }, 300);
        }
    });
}

// Voice typing functionality using Web Speech API
const notesTextarea = document.querySelector('.note-input textarea') as HTMLTextAreaElement;

if (notesTextarea) {
    // Check if browser supports speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        let isRecording = false;
        
        // Create voice button
        const voiceButton = document.createElement('button');
        voiceButton.className = 'voice-button';
        voiceButton.innerHTML = '🎤';
        voiceButton.title = 'Click to start voice typing';
        voiceButton.type = 'button';
        
        // Insert voice button next to textarea
        const noteInput = notesTextarea.parentElement;
        if (noteInput) {
            noteInput.style.position = 'relative';
            noteInput.appendChild(voiceButton);
        }
        
        voiceButton.addEventListener('click', () => {
            if (!isRecording) {
                recognition.start();
                voiceButton.innerHTML = '⏹️';
                voiceButton.title = 'Click to stop voice typing';
                voiceButton.classList.add('recording');
                isRecording = true;
            } else {
                recognition.stop();
                voiceButton.innerHTML = '🎤';
                voiceButton.title = 'Click to start voice typing';
                voiceButton.classList.remove('recording');
                isRecording = false;
            }
        });
        
        recognition.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }
            
            if (finalTranscript) {
                notesTextarea.value += finalTranscript;
            }
        };
        
        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            voiceButton.innerHTML = '🎤';
            voiceButton.classList.remove('recording');
            isRecording = false;
            
            if (event.error === 'not-allowed') {
                alert('Microphone access denied. Please allow microphone access in your browser settings.');
            }
        };
        
        recognition.onend = () => {
            if (isRecording) {
                voiceButton.innerHTML = '🎤';
                voiceButton.classList.remove('recording');
                isRecording = false;
            }
        };
    } else {
        console.log('Speech recognition not supported in this browser');
    }
}

// Save Note Functionality
function initializeSaveNote(): void {
    const saveNoteBtn = document.getElementById('saveNoteBtn') as HTMLButtonElement;
    const noteTextarea = document.getElementById('noteTextarea') as HTMLTextAreaElement;
    const notesList = document.querySelector('.notes-list') as HTMLElement;
    
    if (saveNoteBtn && noteTextarea && notesList) {
        // Enable/disable button based on textarea content
        noteTextarea.addEventListener('input', () => {
            saveNoteBtn.disabled = noteTextarea.value.trim().length === 0;
        });
        
        // Initially disable if empty
        saveNoteBtn.disabled = noteTextarea.value.trim().length === 0;
        
        saveNoteBtn.addEventListener('click', () => {
            const noteContent = noteTextarea.value.trim();
            
            if (noteContent) {
                // Create new note entry
                const noteEntry = document.createElement('div');
                noteEntry.className = 'note-entry';
                
                // Get current timestamp
                const now = new Date();
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const minutes = now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes();
                const hours = now.getHours() > 12 ? now.getHours() - 12 : (now.getHours() === 0 ? 12 : now.getHours());
                const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
                const timestamp = `${months[now.getMonth()]} ${now.getDate()}, ${hours}:${minutes} ${ampm}`;
                
                noteEntry.innerHTML = `
                    <div class="note-content">${noteContent}</div>
                    <div class="note-timestamp">⏰ ${timestamp}</div>
                `;
                
                // Add to top of notes list with animation
                noteEntry.style.opacity = '0';
                noteEntry.style.transform = 'translateY(-10px)';
                notesList.insertBefore(noteEntry, notesList.firstChild);
                
                // Animate in
                setTimeout(() => {
                    noteEntry.style.transition = 'all 0.3s ease';
                    noteEntry.style.opacity = '1';
                    noteEntry.style.transform = 'translateY(0)';
                }, 10);
                
                // Clear textarea
                noteTextarea.value = '';
                saveNoteBtn.disabled = true;
                
                // Show success feedback
                const originalText = saveNoteBtn.innerHTML;
                const originalBg = saveNoteBtn.style.background;
                saveNoteBtn.innerHTML = '✓ SAVED!';
                saveNoteBtn.style.background = '#10b981';
                
                setTimeout(() => {
                    saveNoteBtn.innerHTML = originalText;
                    saveNoteBtn.style.background = originalBg;
                }, 2000);
            }
        });
        
        // Also allow Enter key to save (Ctrl+Enter or Cmd+Enter)
        noteTextarea.addEventListener('keydown', (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (!saveNoteBtn.disabled) {
                    saveNoteBtn.click();
                }
            }
        });
    }
}

// Logout functionality
function initializeLogout(): void {
    const logoutBtn = document.querySelector('.menu-item-logout') as HTMLAnchorElement;
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e: Event) => {
            e.preventDefault();
            
            // Clear authentication
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userName');
            localStorage.removeItem('userEmail');
            
            // Redirect to login page
            window.location.href = 'login.html';
        });
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    initializeKeyboardShortcuts();
    initializeSaveNote();
    initializeLogout();
});

// Animation on load
window.addEventListener('load', (): void => {
    const cards = document.querySelectorAll('.card');
    
    cards.forEach((card: Element, index: number): void => {
        setTimeout((): void => {
            const htmlCard = card as HTMLElement;
            htmlCard.style.opacity = '0';
            htmlCard.style.transform = 'translateY(20px)';
            htmlCard.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            
            setTimeout((): void => {
                htmlCard.style.opacity = '1';
                htmlCard.style.transform = 'translateY(0)';
            }, 50);
        }, index * 50);
    });
});
