"use strict";
// ==========================================
// ACCESSIBILITY ENHANCEMENTS FOR PARKINSON'S PATIENTS
// ==========================================
// Theme Management
function initializeTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        if (themeToggle)
            themeToggle.innerHTML = '☀️';
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
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Alt+D: Log Dose
        if (e.altKey && e.key.toLowerCase() === 'd') {
            e.preventDefault();
            const logDoseBtn = document.querySelector('.btn-log-dose');
            if (logDoseBtn)
                logDoseBtn.click();
        }
        // Alt+S: Log Symptom
        if (e.altKey && e.key.toLowerCase() === 's') {
            e.preventDefault();
            const logSymptomBtn = document.querySelector('.btn-log-symptom');
            if (logSymptomBtn)
                logSymptomBtn.click();
        }
        // Alt+T: Toggle Theme
        if (e.altKey && e.key.toLowerCase() === 't') {
            e.preventDefault();
            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle)
                themeToggle.click();
        }
    });
}
// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    initializeKeyboardShortcuts();
});
// Store the symptomChart globally
let symptomChart = null;
// Symptom Trends Chart - Enhanced for Accessibility
const symptomCtx = document.getElementById('symptomChart').getContext('2d');
if (symptomCtx) {
    const symptomChartData = {
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
    const symptomChartOptions = {
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
const fallCtx = document.getElementById('fallChart').getContext('2d');
if (fallCtx) {
    const fallChartData = {
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
    const fallChartOptions = {
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
const doseTimes = [
    { time: '8:00 AM', label: 'Morning Dose', chartIndex: 4 },
    { time: '2:00 PM', label: 'Afternoon Dose', chartIndex: 7 },
    { time: '8:00 PM', label: 'Evening Dose', chartIndex: 10 }
];
// Function to get current dose based on time
function getCurrentDose() {
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
function markDoseAsTaken(doseTime) {
    const doseItems = document.querySelectorAll('.dose-item');
    doseItems.forEach((item) => {
        const timeElement = item.querySelector('.dose-time');
        if (timeElement && timeElement.textContent === doseTime) {
            // Add taken class
            item.classList.add('taken');
            // Add "Taken" badge if it doesn't exist
            if (!item.querySelector('.dose-status')) {
                const statusBadge = document.createElement('span');
                statusBadge.className = 'dose-status';
                statusBadge.textContent = 'Taken';
                item.appendChild(statusBadge);
            }
        }
    });
}
// Function to add medication marker to chart
function addMedicationMarker(chartIndex) {
    if (symptomCtx && symptomChart) {
        const medicationDataset = symptomChart.data.datasets[1];
        medicationDataset.data[chartIndex] = 4.5;
        symptomChart.update();
    }
}
// Button Click Handlers
const logDoseButton = document.querySelector('.btn-log-dose');
const logSymptomButton = document.querySelector('.btn-log-symptom');
if (logDoseButton) {
    logDoseButton.addEventListener('click', () => {
        const currentDose = getCurrentDose();
        if (currentDose) {
            // Mark dose as taken in the list
            markDoseAsTaken(currentDose.time);
            // Add marker to chart
            addMedicationMarker(currentDose.chartIndex);
            // Show success message
            alert(`✓ ${currentDose.label} logged successfully at ${new Date().toLocaleTimeString()}`);
        }
        else {
            alert('Unable to determine current dose time');
        }
    });
}
if (logSymptomButton) {
    logSymptomButton.addEventListener('click', () => {
        // Scroll to notes section and focus on textarea
        const notesTextarea = document.querySelector('.note-input textarea');
        if (notesTextarea) {
            // Smooth scroll to the notes section
            notesTextarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Focus on textarea after scrolling
            setTimeout(() => {
                notesTextarea.focus();
                // Add a visual highlight effect
                notesTextarea.style.borderColor = '#3b82f6';
                notesTextarea.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)';
                // Remove highlight after 2 seconds
                setTimeout(() => {
                    notesTextarea.style.borderColor = '';
                    notesTextarea.style.boxShadow = '';
                }, 2000);
            }, 500);
        }
    });
}
// Voice typing functionality using Web Speech API
const notesTextarea = document.querySelector('.note-input textarea');
if (notesTextarea) {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
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
            }
            else {
                recognition.stop();
                voiceButton.innerHTML = '🎤';
                voiceButton.title = 'Click to start voice typing';
                voiceButton.classList.remove('recording');
                isRecording = false;
            }
        });
        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                }
                else {
                    interimTranscript += transcript;
                }
            }
            if (finalTranscript) {
                notesTextarea.value += finalTranscript;
            }
        };
        recognition.onerror = (event) => {
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
    }
    else {
        console.log('Speech recognition not supported in this browser');
    }
}
// Animation on load
window.addEventListener('load', () => {
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        setTimeout(() => {
            const htmlCard = card;
            htmlCard.style.opacity = '0';
            htmlCard.style.transform = 'translateY(20px)';
            htmlCard.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            setTimeout(() => {
                htmlCard.style.opacity = '1';
                htmlCard.style.transform = 'translateY(0)';
            }, 50);
        }, index * 50);
    });
});
//# sourceMappingURL=script.js.map