class SimpleVideoMaker {
    constructor() {
        this.audioFile = null;
        this.selectedStyle = null;
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.animationId = null;
        this.canvas = null;
        this.ctx = null;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        this.uploadArea = document.getElementById('audio-upload');
        this.audioInput = document.getElementById('audio-input');
        this.audioStatus = document.getElementById('audio-status');
        this.audioName = document.getElementById('audio-name');
        this.audioLength = document.getElementById('audio-length');
        this.generateBtn = document.getElementById('generate-btn');
        this.result = document.getElementById('result');
        this.outputVideo = document.getElementById('output-video');
        this.downloadBtn = document.getElementById('download-btn');
        this.progress = document.getElementById('progress');
        this.progressFill = this.progress.querySelector('.progress-fill');
        this.progressText = this.progress.querySelector('.progress-text');
    }

    setupEventListeners() {
        // File upload
        this.uploadArea.addEventListener('click', () => this.audioInput.click());
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        });
        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('dragover');
        });
        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) this.handleAudioFile(files[0]);
        });

        this.audioInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) this.handleAudioFile(e.target.files[0]);
        });

        // Style selection
        document.querySelectorAll('.style-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.style-option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
                this.selectedStyle = option.dataset.style;
                this.updateGenerateButton();
            });
        });

        // Generate video
        this.generateBtn.addEventListener('click', () => this.generateVideo());

        // Download
        this.downloadBtn.addEventListener('click', () => this.downloadVideo());
    }

    handleAudioFile(file) {
        if (!file.type.startsWith('audio/')) {
            alert('Please upload an audio file (MP3 or WAV)');
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            alert('File too large. Maximum size is 10MB.');
            return;
        }

        this.audioFile = file;
        this.audioName.textContent = file.name;
        
        // Get audio duration
        const audio = new Audio(URL.createObjectURL(file));
        audio.addEventListener('loadedmetadata', () => {
            this.audioLength.textContent = this.formatTime(audio.duration);
            this.audioStatus.style.display = 'block';
            this.updateGenerateButton();
        });
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    updateGenerateButton() {
        this.generateBtn.disabled = !this.audioFile || !this.selectedStyle;
    }

    async generateVideo() {
        if (!this.audioFile || !this.selectedStyle) return;

        this.generateBtn.disabled = true;
        this.generateBtn.querySelector('.fa-cog').style.display = 'inline-block';
        this.progress.style.display = 'block';

        try {
            this.progressText.textContent = 'Loading audio...';
            this.updateProgress(20);

            // Create canvas for video
            this.canvas = document.createElement('canvas');
            this.canvas.width = 640;
            this.canvas.height = 360;
            this.ctx = this.canvas.getContext('2d');

            // Load audio
            const audioUrl = URL.createObjectURL(this.audioFile);
            const audio = new Audio(audioUrl);
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            this.updateProgress(40);

            // Create audio analyzer
            const response = await fetch(audioUrl);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            this.analyser = audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.analyser);
            source.connect(audioContext.destination);
            
            this.updateProgress(60);

            // Create video with audio
            this.progressText.textContent = 'Creating video...';
            
            const videoBlob = await this.createVideo(audioBuffer.duration);
            
            this.updateProgress(100);
            
            // Display result
            const videoUrl = URL.createObjectURL(videoBlob);
            this.outputVideo.src = videoUrl;
            this.result.style.display = 'block';
            
            // Cleanup
            audioContext.close();
            
        } catch (error) {
            console.error('Error creating video:', error);
            alert('Error creating video. Please try again.');
        } finally {
            this.generateBtn.disabled = false;
            this.generateBtn.querySelector('.fa-cog').style.display = 'none';
            this.progress.style.display = 'none';
            this.progressFill.style.width = '0%';
        }
    }

    updateProgress(percent) {
        this.progressFill.style.width = percent + '%';
    }

    createVideo(duration) {
        return new Promise((resolve, reject) => {
            try {
                // Create media recorder
                const stream = this.canvas.captureStream(30);
                const audioTrack = this.createAudioTrack();
                if (audioTrack) {
                    stream.addTrack(audioTrack);
                }
                
                let recorder;
                try {
                    recorder = new MediaRecorder(stream, {
                        mimeType: 'video/webm;codecs=vp8,opus',
                        videoBitsPerSecond: 800000,
                        audioBitsPerSecond: 128000
                    });
                } catch (e) {
                    recorder = new MediaRecorder(stream);
                }
                
                const chunks = [];
                recorder.ondataavailable = (e) => chunks.push(e.data);
                recorder.onstop = () => {
                    const blob = new Blob(chunks, { type: 'video/webm' });
                    resolve(blob);
                };
                
                recorder.start();
                
                // Start animation
                this.animate(duration, () => {
                    setTimeout(() => {
                        recorder.stop();
                    }, 500);
                });
                
            } catch (error) {
                reject(error);
            }
        });
    }

    createAudioTrack() {
        // Create a silent audio track if needed
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const destination = audioContext.createMediaStreamDestination();
        
        oscillator.frequency.value = 0; // Silent
        oscillator.connect(destination);
        oscillator.start();
        
        return destination.stream.getAudioTracks()[0];
    }

    animate(duration, onComplete) {
        const startTime = Date.now();
        const durationMs = duration * 1000;
        
        const animateFrame = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / durationMs, 1);
            
            // Clear canvas
            this.ctx.fillStyle = '#000011';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Get audio data
            if (this.analyser && this.dataArray) {
                this.analyser.getByteFrequencyData(this.dataArray);
            }
            
            // Draw based on selected style
            switch (this.selectedStyle) {
                case 'waveform':
                    this.drawWaveform(progress);
                    break;
                case 'particles':
                    this.drawParticles(progress);
                    break;
                case 'bars':
                    this.drawBars(progress);
                    break;
                case 'circle':
                    this.drawCircle(progress);
                    break;
            }
            
            if (progress < 1) {
                requestAnimationFrame(animateFrame);
            } else {
                onComplete();
            }
        };
        
        animateFrame();
    }

    drawWaveform(progress) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const barWidth = width / this.dataArray.length;
        
        this.ctx.fillStyle = '#00ff88';
        for (let i = 0; i < this.dataArray.length; i++) {
            const barHeight = (this.dataArray[i] / 255) * height * 0.8;
            const x = i * barWidth;
            const y = (height - barHeight) / 2;
            
            this.ctx.fillRect(x, y, barWidth, barHeight);
        }
    }

    drawParticles(progress) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        for (let i = 0; i < this.dataArray.length; i += 4) {
            const value = this.dataArray[i];
            const angle = (i / this.dataArray.length) * Math.PI * 2;
            const radius = (value / 255) * 150;
            
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            this.ctx.fillStyle = `hsl(${(i / this.dataArray.length) * 360}, 70%, 60%)`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawBars(progress) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const barCount = 64;
        const barWidth = width / barCount;
        
        for (let i = 0; i < barCount; i++) {
            const dataIndex = Math.floor(i * this.dataArray.length / barCount);
            const barHeight = (this.dataArray[dataIndex] / 255) * height * 0.8;
            
            const hue = (i / barCount) * 360;
            this.ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
            this.ctx.fillRect(i * barWidth, height - barHeight, barWidth - 2, barHeight);
        }
    }

    drawCircle(progress) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const average = this.dataArray.reduce((a, b) => a + b, 0) / this.dataArray.length;
        const radius = (average / 255) * 100;
        
        this.ctx.strokeStyle = '#00ff88';
        this.ctx.lineWidth = 5;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Inner circle
        this.ctx.fillStyle = `hsl(${(average / 255) * 360}, 70%, 60%)`;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius * 0.7, 0, Math.PI * 2);
        this.ctx.fill();
    }

    downloadVideo() {
        const videoUrl = this.outputVideo.src;
        if (videoUrl) {
            const link = document.createElement('a');
            link.href = videoUrl;
            link.download = 'music-video.webm';
            link.click();
        }
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    new SimpleVideoMaker();
});
