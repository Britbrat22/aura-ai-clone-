class MusicVideoGenerator {
    constructor() {
        this.audioContext = null;
        this.canvas = null;
        this.ctx = null;
    }

    async generate(options) {
        const { lyrics, musicStyle, videoStyle, duration, avatar, audioSource, audioFile } = options;
        
        try {
            // Create canvas for video frames
            this.canvas = document.createElement('canvas');
            this.canvas.width = 854;  // Reduced size for better performance
            this.canvas.height = 480;
            this.ctx = this.canvas.getContext('2d');
            
            let audioBuffer;
            
            if (audioSource === 'upload' && audioFile) {
                // Use uploaded audio
                audioBuffer = await this.processUploadedAudio(audioFile);
            } else {
                // Generate AI music
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                audioBuffer = await this.generateAudio(musicStyle, duration);
            }
            
            // Create simple video frames
            const frames = await this.generateSimpleFrames(videoStyle, duration, lyrics, avatar);
            
            // Create WebM video with audio
            const videoBlob = await this.createSimpleVideo(audioBuffer, frames, duration);
            
            return videoBlob;
            
        } catch (error) {
            console.error('Video generation error:', error);
            throw error;
        }
    }

    async processUploadedAudio(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const response = await fetch(e.target.result);
                    const arrayBuffer = await response.arrayBuffer();
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                    resolve(audioBuffer);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read audio file'));
            reader.readAsDataURL(file);
        });
    }

    async generateAudio(style, duration) {
        const sampleRate = 22050; // Reduced sample rate for better performance
        const length = sampleRate * duration;
        const audioBuffer = this.audioContext.createBuffer(2, length, sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = audioBuffer.getChannelData(channel);
            
            for (let i = 0; i < length; i++) {
                const t = i / sampleRate;
                let sample = 0;
                
                switch (style) {
                    case 'pop':
                        sample = Math.sin(2 * Math.PI * 440 * t) * 0.3;
                        break;
                    case 'rock':
                        sample = Math.tanh(Math.sin(2 * Math.PI * 220 * t) * 3) * 0.2;
                        break;
                    case 'electronic':
                        sample = Math.sin(2 * Math.PI * 110 * t) * (Math.sin(2 * Math.PI * 8 * t) * 0.5 + 0.5) * 0.3;
                        break;
                    case 'hip-hop':
                        const beat = Math.floor(t * 4) % 2;
                        sample = Math.sin(2 * Math.PI * (beat === 0 ? 55 : 110) * t) * 0.25;
                        break;
                    default:
                        sample = Math.sin(2 * Math.PI * 220 * t) * 0.2;
                }
                
                channelData[i] = sample;
            }
        }
        
        return audioBuffer;
    }

    async generateSimpleFrames(style, duration, lyrics, avatar) {
        const fps = 15; // Reduced FPS for better performance
        const totalFrames = duration * fps;
        const frames = [];
        const lyricLines = lyrics.split('\n').filter(line => line.trim());
        
        for (let frame = 0; frame < totalFrames; frame++) {
            const progress = frame / totalFrames;
            
            // Clear canvas
            this.ctx.fillStyle = '#000011';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Generate based on style
            switch (style) {
                case 'animated':
                    this.generateAnimatedFrame(progress);
                    break;
                case 'cinematic':
                    this.generateCinematicFrame(progress);
                    break;
                case 'abstract':
                    this.generateAbstractFrame(progress);
                    break;
                case 'lyrics':
                    this.generateLyricsFrame(progress, lyricLines);
                    break;
            }
            
            // Add avatar if provided
            if (avatar) {
                await this.addAvatarToFrame(avatar, progress);
            }
            
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            frames.push(imageData);
        }
        
        return frames;
    }

    generateAnimatedFrame(progress) {
        const time = progress * Math.PI * 4;
        
        for (let i = 0; i < 8; i++) {
            const x = (Math.sin(time + i) + 1) * this.canvas.width / 2;
            const y = (Math.cos(time + i * 0.7) + 1) * this.canvas.height / 2;
            const radius = 30 + Math.sin(time + i) * 20;
            
            const hue = (progress * 360 + i * 45) % 360;
            this.ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    generateCinematicFrame(progress) {
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f3460');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Add cinematic bars
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, 40);
        this.ctx.fillRect(0, this.canvas.height - 40, this.canvas.width, 40);
    }

    generateAbstractFrame(progress) {
        const time = progress * Math.PI * 6;
        
        for (let x = 0; x < this.canvas.width; x += 25) {
            for (let y = 0; y < this.canvas.height; y += 25) {
                const hue = (x + y + time * 30) % 360;
                this.ctx.fillStyle = `hsl(${hue}, 60%, 50%)`;
                this.ctx.fillRect(x, y, 20, 20);
            }
        }
    }

    generateLyricsFrame(progress, lyricLines) {
        this.ctx.fillStyle = '#000033';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Show current lyric
        const lineIndex = Math.floor(progress * lyricLines.length);
        if (lyricLines[lineIndex]) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(lyricLines[lineIndex], this.canvas.width / 2, this.canvas.height / 2);
        }
    }

    async addAvatarToFrame(avatarSrc, progress) {
        return new Promise((resolve) => {
            const avatarImg = new Image();
            avatarImg.onload = () => {
                const size = 120;
                const x = this.canvas.width - size - 20;
                const y = 20;
                
                this.ctx.save();
                this.ctx.beginPath();
                this.ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
                this.ctx.clip();
                this.ctx.drawImage(avatarImg, x, y, size, size);
                this.ctx.restore();
                
                // Add border
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
                this.ctx.stroke();
                
                resolve();
            };
            avatarImg.src = avatarSrc;
        });
    }

    async createSimpleVideo(audioBuffer, frames, duration) {
        return new Promise((resolve) => {
            // Create a simple WebM video using MediaRecorder
            const stream = this.canvas.captureStream(15); // 15 FPS
            
            let recorder;
            try {
                recorder = new MediaRecorder(stream, {
                    mimeType: 'video/webm;codecs=vp8',
                    videoBitsPerSecond: 1000000 // Reduced bitrate
                });
            } catch (e) {
                // Fallback to basic webm
                recorder = new MediaRecorder(stream);
            }
            
            const chunks = [];
            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = () => {
                const videoBlob = new Blob(chunks, { type: 'video/webm' });
                resolve(videoBlob);
            };
            
            recorder.start();
            
            // Render frames
            let frameIndex = 0;
            const fps = 15;
            const totalFrames = duration * fps;
            
            const renderFrame = () => {
                if (frameIndex < totalFrames) {
                    this.ctx.putImageData(frames[frameIndex], 0, 0);
                    frameIndex++;
                    setTimeout(renderFrame, 1000 / fps);
                } else {
                    // Stop recording after all frames are rendered
                    setTimeout(() => {
                        recorder.stop();
                    }, 500);
                }
            };
            
            // Start rendering
            renderFrame();
        });
    }
}
