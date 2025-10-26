"use strict";
/**
 * Patient Notes Module
 * Handles note creation, structured symptom capture, sensor correlation,
 * offline storage, media attachments, and voice-to-text.
 */
class PatientNotesManager {
    constructor() {
        this.notes = [];
        this.currentMedia = [];
        this.recognition = null;
        this.isRecording = false;
        this.loadNotesFromStorage();
        this.initializeEventListeners();
        this.initializeVoiceRecognition();
        this.renderNotes();
    }
    initializeEventListeners() {
        // Quick capture buttons
        const btnReportFall = document.getElementById('btnReportFall');
        const btnMedTaken = document.getElementById('btnMedTaken');
        const btnMorningCheckin = document.getElementById('btnMorningCheckin');
        btnReportFall === null || btnReportFall === void 0 ? void 0 : btnReportFall.addEventListener('click', () => this.showFallModal());
        btnMedTaken === null || btnMedTaken === void 0 ? void 0 : btnMedTaken.addEventListener('click', () => this.quickCaptureMed());
        btnMorningCheckin === null || btnMorningCheckin === void 0 ? void 0 : btnMorningCheckin.addEventListener('click', () => this.quickCaptureCheckin());
        // Fall modal actions
        const btnFallCancel = document.getElementById('btnFallCancel');
        const btnFallConfirm = document.getElementById('btnFallConfirm');
        const fallModal = document.getElementById('fallModal');
        btnFallCancel === null || btnFallCancel === void 0 ? void 0 : btnFallCancel.addEventListener('click', () => this.hideFallModal());
        btnFallConfirm === null || btnFallConfirm === void 0 ? void 0 : btnFallConfirm.addEventListener('click', () => this.confirmFallReport());
        fallModal === null || fallModal === void 0 ? void 0 : fallModal.addEventListener('click', (e) => {
            if (e.target === fallModal)
                this.hideFallModal();
        });
        // Severity slider
        const severitySlider = document.getElementById('severitySlider');
        const severityValue = document.getElementById('severityValue');
        severitySlider === null || severitySlider === void 0 ? void 0 : severitySlider.addEventListener('input', () => {
            if (severityValue) {
                severityValue.textContent = severitySlider.value;
            }
        });
        // Voice button
        const btnVoice = document.getElementById('btnVoice');
        btnVoice === null || btnVoice === void 0 ? void 0 : btnVoice.addEventListener('mousedown', () => this.startVoiceRecording());
        btnVoice === null || btnVoice === void 0 ? void 0 : btnVoice.addEventListener('mouseup', () => this.stopVoiceRecording());
        btnVoice === null || btnVoice === void 0 ? void 0 : btnVoice.addEventListener('mouseleave', () => {
            if (this.isRecording)
                this.stopVoiceRecording();
        });
        btnVoice === null || btnVoice === void 0 ? void 0 : btnVoice.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startVoiceRecording();
        });
        btnVoice === null || btnVoice === void 0 ? void 0 : btnVoice.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopVoiceRecording();
        });
        // Media button
        const btnMedia = document.getElementById('btnMedia');
        btnMedia === null || btnMedia === void 0 ? void 0 : btnMedia.addEventListener('click', () => this.selectMedia());
        // Save button
        const saveNoteBtn = document.getElementById('saveNoteBtn');
        saveNoteBtn === null || saveNoteBtn === void 0 ? void 0 : saveNoteBtn.addEventListener('click', () => this.saveNote());
        // Online/offline sync
        window.addEventListener('online', () => this.syncPendingNotes());
    }
    initializeVoiceRecognition() {
        // Check for Web Speech API support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';
            this.recognition.onresult = (event) => {
                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                }
                const textarea = document.getElementById('noteTextarea');
                if (textarea) {
                    textarea.value = transcript;
                }
            };
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.isRecording = false;
                this.updateVoiceButtonState();
            };
        }
    }
    startVoiceRecording() {
        if (!this.recognition) {
            alert('Voice recording is not supported in your browser. Please type your note.');
            return;
        }
        try {
            this.recognition.start();
            this.isRecording = true;
            this.updateVoiceButtonState();
        }
        catch (error) {
            console.error('Failed to start voice recognition:', error);
        }
    }
    stopVoiceRecording() {
        if (this.recognition && this.isRecording) {
            this.recognition.stop();
            this.isRecording = false;
            this.updateVoiceButtonState();
        }
    }
    updateVoiceButtonState() {
        const btnVoice = document.getElementById('btnVoice');
        if (btnVoice) {
            if (this.isRecording) {
                btnVoice.classList.add('recording');
            }
            else {
                btnVoice.classList.remove('recording');
            }
        }
    }
    selectMedia() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,video/*,audio/*';
        input.multiple = true;
        input.onchange = (e) => {
            const target = e.target;
            if (target.files) {
                this.handleMediaFiles(Array.from(target.files));
            }
        };
        input.click();
    }
    handleMediaFiles(files) {
        const maxSizes = {
            image: 5 * 1024 * 1024, // 5MB
            video: 15 * 1024 * 1024, // 15MB
            audio: 1 * 1024 * 1024 // 1MB
        };
        for (const file of files) {
            const type = file.type.split('/')[0];
            let maxSize = maxSizes.image;
            if (type === 'video')
                maxSize = maxSizes.video;
            else if (type === 'audio')
                maxSize = maxSizes.audio;
            if (file.size > maxSize) {
                alert(`File too large: ${file.name}. Max size: ${Math.round(maxSize / 1024 / 1024)}MB`);
                continue;
            }
            this.currentMedia.push(file);
        }
        this.renderMediaPreview();
    }
    renderMediaPreview() {
        const preview = document.getElementById('mediaPreview');
        if (!preview)
            return;
        if (this.currentMedia.length === 0) {
            preview.style.display = 'none';
            return;
        }
        preview.style.display = 'flex';
        preview.innerHTML = '';
        this.currentMedia.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'media-item';
            const reader = new FileReader();
            reader.onload = (e) => {
                var _a;
                const url = (_a = e.target) === null || _a === void 0 ? void 0 : _a.result;
                const type = file.type.split('/')[0];
                if (type === 'image') {
                    item.innerHTML = `<img src="${url}" alt="Preview">`;
                }
                else if (type === 'video') {
                    item.innerHTML = `<video src="${url}"></video>`;
                }
                else {
                    item.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;background:rgba(0,0,0,0.5);">🎵</div>`;
                }
                const removeBtn = document.createElement('button');
                removeBtn.className = 'media-remove';
                removeBtn.textContent = '×';
                removeBtn.onclick = () => this.removeMedia(index);
                item.appendChild(removeBtn);
            };
            reader.readAsDataURL(file);
            preview.appendChild(item);
        });
    }
    removeMedia(index) {
        this.currentMedia.splice(index, 1);
        this.renderMediaPreview();
    }
    async saveNote() {
        const textarea = document.getElementById('noteTextarea');
        const symptomSelect = document.getElementById('symptomType');
        const severitySlider = document.getElementById('severitySlider');
        const medToggle = document.getElementById('medStateToggle');
        const text = textarea.value.trim();
        if (!text) {
            alert('Please enter a note before saving.');
            return;
        }
        const note = {
            id: this.generateId(),
            patientId: 'demo-patient',
            text,
            symptom: symptomSelect.value,
            severity: parseInt(severitySlider.value),
            medicationState: medToggle.checked ? 'on' : 'off',
            tags: this.extractTags(text),
            timestamp: new Date().toISOString(),
            media: [],
            createdBy: 'patient',
            sharedWith: [],
            synced: false
        };
        // Mock sensor snippet correlation
        note.sensorSnippet = await this.fetchSensorSnippet(note.timestamp);
        // Handle media upload (mock for now)
        if (this.currentMedia.length > 0) {
            note.media = await this.uploadMedia(note.id);
        }
        this.notes.unshift(note);
        this.saveNotesToStorage();
        this.renderNotes();
        this.resetForm();
        // Show success message
        this.showToast('Saved. Thank you — this helps your care team.');
        // Try to sync if online
        if (navigator.onLine) {
            this.syncNote(note);
        }
    }
    async fetchSensorSnippet(timestamp) {
        // Mock sensor data correlation (±30 minutes)
        const date = new Date(timestamp);
        const from = new Date(date.getTime() - 30 * 60 * 1000).toISOString();
        const to = new Date(date.getTime() + 30 * 60 * 1000).toISOString();
        // Generate demo sensor metrics
        return {
            from,
            to,
            metrics: {
                tremor: Math.round(Math.random() * 40 + 30),
                rigidity: Math.round(Math.random() * 40 + 20),
                slowness: Math.round(Math.random() * 40 + 25),
                gait: Math.round(Math.random() * 40 + 30)
            },
            sampled: Array.from({ length: 12 }, () => Math.random() * 100)
        };
    }
    async uploadMedia(noteId) {
        // Mock media upload - in production, upload to server
        const mediaItems = [];
        for (const file of this.currentMedia) {
            const fileType = file.type.split('/')[0]; // 'image', 'video', 'audio'
            const url = URL.createObjectURL(file);
            let mediaType = 'photo';
            if (fileType === 'video')
                mediaType = 'video';
            else if (fileType === 'audio')
                mediaType = 'audio';
            mediaItems.push({
                type: mediaType,
                url,
                thumbnail: fileType === 'image' || fileType === 'video' ? url : undefined,
                duration: fileType === 'audio' || fileType === 'video' ? 8 : undefined
            });
        }
        return mediaItems;
    }
    async syncNote(note) {
        // Mock API call
        try {
            // In production: await fetch('/api/notes', { method: 'POST', body: JSON.stringify(note) });
            console.log('Syncing note:', note.id);
            setTimeout(() => {
                const index = this.notes.findIndex(n => n.id === note.id);
                if (index !== -1) {
                    this.notes[index].synced = true;
                    this.saveNotesToStorage();
                    this.renderNotes();
                }
            }, 1000);
        }
        catch (error) {
            console.error('Failed to sync note:', error);
        }
    }
    async syncPendingNotes() {
        const pendingNotes = this.notes.filter(n => !n.synced);
        for (const note of pendingNotes) {
            await this.syncNote(note);
        }
    }
    showFallModal() {
        const modal = document.getElementById('fallModal');
        if (modal)
            modal.style.display = 'flex';
    }
    hideFallModal() {
        const modal = document.getElementById('fallModal');
        if (modal)
            modal.style.display = 'none';
    }
    async confirmFallReport() {
        this.hideFallModal();
        // Create fall report note
        const note = {
            id: this.generateId(),
            patientId: 'demo-patient',
            text: '🚨 Fall reported',
            symptom: 'other',
            severity: 10,
            medicationState: 'unknown',
            tags: ['fall', 'alert'],
            timestamp: new Date().toISOString(),
            media: [],
            createdBy: 'patient',
            sharedWith: [],
            synced: false
        };
        // Get sensor snippet for last 60 seconds
        const now = new Date();
        note.sensorSnippet = {
            from: new Date(now.getTime() - 60 * 1000).toISOString(),
            to: now.toISOString(),
            metrics: {
                tremor: Math.round(Math.random() * 40 + 30),
                gait: Math.round(Math.random() * 40 + 30)
            },
            sampled: Array.from({ length: 6 }, () => Math.random() * 100)
        };
        this.notes.unshift(note);
        this.saveNotesToStorage();
        this.renderNotes();
        // Mock alert API call
        this.sendFallAlert(note);
        this.showToast('Fall alert sent to your caregiver.');
    }
    async sendFallAlert(note) {
        // Mock API call to alert endpoint
        console.log('Sending fall alert:', note);
        // In production: await fetch('/api/alerts', { method: 'POST', body: JSON.stringify(note) });
    }
    quickCaptureMed() {
        const note = {
            id: this.generateId(),
            patientId: 'demo-patient',
            text: '💊 Medication taken',
            symptom: 'other',
            severity: 0,
            medicationState: 'on',
            tags: ['medication'],
            timestamp: new Date().toISOString(),
            media: [],
            createdBy: 'patient',
            sharedWith: [],
            synced: false
        };
        this.notes.unshift(note);
        this.saveNotesToStorage();
        this.renderNotes();
        this.showToast('Medication logged.');
        if (navigator.onLine)
            this.syncNote(note);
    }
    quickCaptureCheckin() {
        const note = {
            id: this.generateId(),
            patientId: 'demo-patient',
            text: '☀️ Morning check-in',
            symptom: 'other',
            severity: 5,
            medicationState: 'unknown',
            tags: ['morning', 'checkin'],
            timestamp: new Date().toISOString(),
            media: [],
            createdBy: 'patient',
            sharedWith: [],
            synced: false
        };
        this.notes.unshift(note);
        this.saveNotesToStorage();
        this.renderNotes();
        this.showToast('Check-in recorded.');
        if (navigator.onLine)
            this.syncNote(note);
    }
    renderNotes() {
        const notesList = document.getElementById('notesList');
        if (!notesList)
            return;
        if (this.notes.length === 0) {
            notesList.innerHTML = '<p style="text-align:center;color:rgba(255,255,255,0.5);padding:40px;">No notes yet. Add your first note above.</p>';
            return;
        }
        notesList.innerHTML = this.notes.map(note => this.renderNoteCard(note)).join('');
    }
    renderNoteCard(note) {
        const date = new Date(note.timestamp);
        const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
        const symptomLabel = {
            tremor: 'Tremor',
            rigidity: 'Rigidity',
            slowness: 'Slowness',
            gait: 'Gait',
            other: 'General'
        }[note.symptom];
        const mediaHtml = note.media.length > 0 ? `
            <div class="note-media">
                ${note.media.map(m => {
            if (m.type === 'photo')
                return `<img src="${m.url}" alt="Photo">`;
            if (m.type === 'video')
                return `<video src="${m.url}" controls></video>`;
            return `<div style="width:60px;height:60px;background:rgba(0,0,0,0.5);border-radius:8px;display:flex;align-items:center;justify-content:center;">🎵</div>`;
        }).join('')}
            </div>
        ` : '';
        const sensorHtml = note.sensorSnippet ? `
            <div class="note-sensor-snippet">
                <div class="sensor-metrics">
                    ${note.sensorSnippet.metrics.tremor ? `<div class="sensor-metric">Tremor: <span class="sensor-metric-value">${note.sensorSnippet.metrics.tremor}</span></div>` : ''}
                    ${note.sensorSnippet.metrics.rigidity ? `<div class="sensor-metric">Rigidity: <span class="sensor-metric-value">${note.sensorSnippet.metrics.rigidity}</span></div>` : ''}
                    ${note.sensorSnippet.metrics.slowness ? `<div class="sensor-metric">Slowness: <span class="sensor-metric-value">${note.sensorSnippet.metrics.slowness}</span></div>` : ''}
                    ${note.sensorSnippet.metrics.gait ? `<div class="sensor-metric">Gait: <span class="sensor-metric-value">${note.sensorSnippet.metrics.gait}</span></div>` : ''}
                </div>
            </div>
        ` : '';
        return `
            <div class="note-entry">
                <div class="note-header">
                    <div class="note-badge ${note.symptom}">${symptomLabel}</div>
                    ${note.severity > 0 ? `<div class="note-severity">${note.severity}</div>` : ''}
                    ${note.medicationState !== 'unknown' ? `<div class="note-med-state ${note.medicationState}">Med ${note.medicationState.toUpperCase()}</div>` : ''}
                    ${!note.synced ? '<span class="note-pending">⏳ Pending sync</span>' : ''}
                </div>
                <div class="note-content">${this.escapeHtml(note.text)}</div>
                ${mediaHtml}
                ${sensorHtml}
                <div class="note-footer">
                    <div class="note-timestamp">⏰ ${formattedDate}</div>
                    <div class="note-actions">
                        <button class="note-action-btn">Share</button>
                        <button class="note-action-btn">Export</button>
                    </div>
                </div>
            </div>
        `;
    }
    resetForm() {
        const textarea = document.getElementById('noteTextarea');
        const symptomSelect = document.getElementById('symptomType');
        const severitySlider = document.getElementById('severitySlider');
        const severityValue = document.getElementById('severityValue');
        const medToggle = document.getElementById('medStateToggle');
        if (textarea)
            textarea.value = '';
        if (symptomSelect)
            symptomSelect.value = 'other';
        if (severitySlider)
            severitySlider.value = '5';
        if (severityValue)
            severityValue.textContent = '5';
        if (medToggle)
            medToggle.checked = false;
        this.currentMedia = [];
        this.renderMediaPreview();
    }
    extractTags(text) {
        const tags = [];
        const lowerText = text.toLowerCase();
        const tagKeywords = {
            'fall': ['fall', 'fell', 'trip'],
            'medication': ['med', 'medication', 'pill'],
            'morning': ['morning', 'woke', 'wake'],
            'evening': ['evening', 'night', 'dinner'],
            'stiffness': ['stiff', 'rigid', 'tight'],
            'fatigue': ['tired', 'fatigue', 'exhausted']
        };
        for (const [tag, keywords] of Object.entries(tagKeywords)) {
            if (keywords.some(kw => lowerText.includes(kw))) {
                tags.push(tag);
            }
        }
        return tags;
    }
    showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    loadNotesFromStorage() {
        try {
            const stored = localStorage.getItem('patientNotes');
            if (stored) {
                this.notes = JSON.parse(stored);
            }
        }
        catch (error) {
            console.error('Failed to load notes from storage:', error);
        }
    }
    saveNotesToStorage() {
        try {
            localStorage.setItem('patientNotes', JSON.stringify(this.notes));
        }
        catch (error) {
            console.error('Failed to save notes to storage:', error);
        }
    }
    generateId() {
        return `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new PatientNotesManager();
    });
}
else {
    new PatientNotesManager();
}
//# sourceMappingURL=notes.js.map