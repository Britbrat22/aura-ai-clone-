class SimpleVideoMaker {
    constructor() {
        this.audioFile = null;
        this.selectedStyle = null;
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.canvas = null;
        this.ctx = null;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
        this.audioElement = null;
        
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
            this.audioElement = audio; // Store for later use
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
            this.progressText.textContent = 'Setting up recording...';
            this.updateProgress(10);

            // Create canvas for video
            this.canvas = document.createElement('canvas');
            this.canvas.width = 640;
            this.canvas.height = 360;
            this.ctx = this.canvas.getContext('2d');
            document.body.appendChild(this.canvas); // Add to DOM to ensure it's rendered
            this.canvas.style.display = 'none'; // Hide it but keep it in DOM

            this.progressText.textContent = 'Loading audio...';
            this.updateProgress(30);

            // Set up audio
            const audioUrl = URL.createObjectURL(this.audioFile);
            this.audioElement = new Audio(audioUrl);
            
            // Create audio context for analysis
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const audioSource = this.audioContext.createMediaElementSource(this.audioElement);
            
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 128; // Smaller size for better performance
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            
            audioSource.connect(this.analyser);
            audioSource.connect(this.audioContext.destination);
            
            this.progressText.textContent = 'Creating video...';
            this.updateProgress(60);

            // Create the video with proper recording
            const videoBlob = await this.recordVideoWithAudio();
            
            this.updateProgress(100);
            
            // Display result
            const videoUrl = URL.createObjectURL(videoBlob);
            this.outputVideo.src = videoUrl;
            this.result.style.display = 'block';
            
            this.progressText.textContent = 'Complete!';
            
        } catch (error) {
            console.error('Error creating video:', error);
            alert('Error creating video: ' + error.message);
        } finally {
            this.generateBtn.disabled = false;
            this.generateBtn.querySelector('.fa-cog').style.display = 'none';
            this.progress.style.display = 'none';
            this.progressFill.style.width = '0%';
            
            // Cleanup
            if (this.canvas && this.canvas.parentNode) {
                this.canvas.parentNode.removeChild(this.canvas);
            }
            if (this.audioContext) {
                this.audioContext.close();
            }
        }
    }

    updateProgress(percent) {
        this.progressFill.style.width = percent + '%';
    }

    async recordVideoWithAudio() {
        return new Promise(async (resolve, reject) => {
            try {
                // Wait for audio to be ready
                await new Promise((resolve) => {
                    this.audioElement.addEventListener('canplaythrough', resolve, { once: true });
                });

                const audioDuration = this.audioElement.duration;
                console.log('Audio duration:', audioDuration);

                // Set up MediaRecorder with canvas stream
                const stream = this.canvas.captureStream(30); // 30 FPS
                
                // Create audio track from audio element
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const audioSource = audioContext.createMediaElementSource(this.audioElement);
                const audioDestination = audioContext.createMediaStreamDestination();
                
                audioSource.connect(audioDestination);
                audioSource.connect(audioContext.destination); // Also play audio
                
                // Add audio track to stream
                const audioTrack = audioDestination.stream.getAudioTracks()[0];
                if (audioTrack) {
                    stream.addTrack(audioTrack);
                }

                console.log('Stream tracks:', stream.getTracks().length);

                // Create MediaRecorder
                let recorder;
                const mimeTypes = [
                    'video/webm;codecs=vp8,opus',
                    'video/webm;codecs=vp9,opus',
                    'video/webm'
                ];
                
                for (const mimeType of mimeTypes) {
                    if (MediaRecorder.isTypeSupported(mimeType)) {
                        recorder = new MediaRecorder(stream, {
                            mimeType: mimeType,
                            videoBitsPerSecond: 1000000,
                            audioBitsPerSecond: 128000
                        });
                        console.log('Using mimeType:', mimeType);
                        break;
                    }
                }

                if (!recorder) {
                    throw new Error('No supported MediaRecorder format found');
                }

                const chunks = [];
                
                recorder.ondataavailable = (event) => {
                    console.log('Data available, size:', event.data.size);
                    if (event.data.size > 0) {
                        chunks.push(event.data);
                    }
                };

                recorder.onstop = () => {
                    console.log('Recording stopped, chunks:', chunks.length);
                    if (chunks.length > 0) {
                        const blob = new Blob(chunks, { type: chunks[0].type });
                        console.log('Final blob size:', blob.size, 'type:', blob.type);
                        resolve(blob);
                    } else {
                        reject(new Error('No video data recorded'));
                    }
                };

                recorder.onerror = (error) => {
                    console.error('MediaRecorder error:', error);
                    reject(error);
                };

                // Start recording
                recorder.start(1000); // Collect data every second
                console.log('MediaRecorder started');

                // Start audio playback and animation
                this.audioElement.currentTime = 0;
                this.audioElement.play();
                
                // Start animation
                this.startAnimation();

                // Stop recording when audio ends
                this.audioElement.addEventListener('ended', () => {
                    console.log('Audio ended, stopping recording');
                    setTimeout(() => {
                        recorder.stop();
                        audioContext.close();
                    }, 500);
                }, { once: true });

                // Safety timeout
                setTimeout(() => {
                    if (recorder.state === 'recording') {
                        console.log('Safety timeout, stopping recording');
                        recorder.stop();
                        audioContext.close();
                    }
                }, (audioDuration + 2) * 1000);

            } catch (error) {
                reject(error);
            }
        });
    }

    startAnimation() {
        if (!this.canvas || !this.ctx) return;

        const animate = () => {
            if (!this.audioElement || this.audioElement.ended) return;

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
                    this.drawWaveform();
                    break;
                case 'particles':
                    this.drawParticles();
                    break;
                case 'bars':
                    this.drawBars();
                    break;
                case 'circle':
                    this.drawCircle();
                    break;
            }

            // Request next frame
            requestAnimationFrame(animate);
        };

        animate();
    }

    drawWaveform() {
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

    drawParticles() {
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

    drawBars() {
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

    drawCircle() {
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
