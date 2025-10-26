/**
 * Patient Notes Module
 * Handles note creation, structured symptom capture, sensor correlation,
 * offline storage, media attachments, and voice-to-text.
 */
interface NoteMedia {
    type: 'photo' | 'video' | 'audio';
    url: string;
    thumbnail?: string;
    duration?: number;
}
interface SensorSnippet {
    from: string;
    to: string;
    metrics: {
        tremor?: number;
        rigidity?: number;
        slowness?: number;
        gait?: number;
    };
    sampled?: number[];
}
interface Note {
    id: string;
    patientId: string;
    text: string;
    symptom: 'tremor' | 'rigidity' | 'slowness' | 'gait' | 'other';
    severity: number;
    medicationState: 'on' | 'off' | 'unknown';
    tags: string[];
    timestamp: string;
    media: NoteMedia[];
    sensorSnippet?: SensorSnippet;
    createdBy: 'patient' | 'caregiver';
    sharedWith: string[];
    synced: boolean;
}
declare class PatientNotesManager {
    private notes;
    private currentMedia;
    private recognition;
    private isRecording;
    constructor();
    private initializeEventListeners;
    private initializeVoiceRecognition;
    private startVoiceRecording;
    private stopVoiceRecording;
    private updateVoiceButtonState;
    private selectMedia;
    private handleMediaFiles;
    private renderMediaPreview;
    private removeMedia;
    private saveNote;
    private fetchSensorSnippet;
    private uploadMedia;
    private syncNote;
    private syncPendingNotes;
    private showFallModal;
    private hideFallModal;
    private confirmFallReport;
    private sendFallAlert;
    private quickCaptureMed;
    private quickCaptureCheckin;
    private renderNotes;
    private renderNoteCard;
    private resetForm;
    private extractTags;
    private showToast;
    private loadNotesFromStorage;
    private saveNotesToStorage;
    private generateId;
    private escapeHtml;
}
//# sourceMappingURL=notes.d.ts.map