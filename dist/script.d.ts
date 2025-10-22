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
declare const symptomCtx: CanvasRenderingContext2D | null;
declare const fallCtx: CanvasRenderingContext2D | null;
declare const logDoseButton: HTMLButtonElement;
declare const logSymptomButton: HTMLButtonElement;
//# sourceMappingURL=script.d.ts.map