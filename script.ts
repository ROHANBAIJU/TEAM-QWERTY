// Type definitions for Chart.js
declare class Chart {
    constructor(ctx: CanvasRenderingContext2D, config: any);
}

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

// Symptom Trends Chart
const symptomCtx = (document.getElementById('symptomChart') as HTMLCanvasElement).getContext('2d');

if (symptomCtx) {
    const symptomChartData: ChartData = {
        labels: ['12AM', '2AM', '4AM', '6AM', '8AM', '10AM', '12PM', '2PM', '4PM', '6PM', '8PM', '10PM', '12AM'],
        datasets: [
            {
                label: 'Your Symptoms',
                data: [3, 2.8, 3.5, 4, 3.2, 2.5, 2, 3.5, 4.2, 3.8, 3.2, 3, 3.5],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 0,
                fill: true
            },
            {
                label: 'Medication Taken',
                data: [null, null, null, null, 4.5, null, null, null, 4.5, null, null, null, null],
                borderColor: '#fbbf24',
                backgroundColor: '#fbbf24',
                pointRadius: 6,
                pointHoverRadius: 8,
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
                backgroundColor: 'rgba(20, 25, 45, 0.95)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 8
            }
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                    drawBorder: false
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.6)',
                    font: {
                        size: 11
                    }
                }
            },
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                    drawBorder: false
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.6)',
                    font: {
                        size: 11
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

    const symptomChart = new Chart(symptomCtx, {
        type: 'line',
        data: symptomChartData,
        options: symptomChartOptions
    });
}

// Fall Events Chart
const fallCtx = (document.getElementById('fallChart') as HTMLCanvasElement).getContext('2d');

if (fallCtx) {
    const fallChartData: ChartData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
            label: 'Fall Events',
            data: [1, 0, 2, 1, 3, 2, 1],
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            tension: 0.4,
            borderWidth: 3,
            pointRadius: 5,
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
                backgroundColor: 'rgba(20, 25, 45, 0.95)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 8
            }
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                    drawBorder: false
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.6)',
                    font: {
                        size: 11
                    }
                }
            },
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                    drawBorder: false
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.6)',
                    font: {
                        size: 11
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

// Button Click Handlers
const logDoseButton = document.querySelector('.btn-log-dose') as HTMLButtonElement;
const logSymptomButton = document.querySelector('.btn-log-symptom') as HTMLButtonElement;

if (logDoseButton) {
    logDoseButton.addEventListener('click', (): void => {
        alert('Log Dose functionality - This would open a modal to log medication intake');
    });
}

if (logSymptomButton) {
    logSymptomButton.addEventListener('click', (): void => {
        alert('Log Symptom functionality - This would open a modal to record symptoms');
    });
}

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
