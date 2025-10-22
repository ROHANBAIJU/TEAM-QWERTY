declare class Chart {
    constructor(ctx: CanvasRenderingContext2D, config: any);
}
declare function initializeTheme(): void;
declare function initializeKeyboardShortcuts(): void;
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
declare let symptomChart: any;
declare const symptomCtx: CanvasRenderingContext2D | null;
declare const fallCtx: CanvasRenderingContext2D | null;
interface DoseTime {
    time: string;
    label: string;
    chartIndex: number;
}
declare const doseTimes: DoseTime[];
declare function getCurrentDose(): DoseTime | null;
declare function markDoseAsTaken(doseTime: string): void;
declare function addMedicationMarker(chartIndex: number): void;
declare const logDoseButton: HTMLButtonElement;
declare const logSymptomButton: HTMLButtonElement;
declare const notesTextarea: HTMLTextAreaElement;
declare function initializeSaveNote(): void;
//# sourceMappingURL=script.d.ts.map