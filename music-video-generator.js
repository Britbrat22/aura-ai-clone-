class MusicVideoGenerator {
    constructor() {
        this.audioContext = null;
        this.canvas = null;
        this.ctx = null;
        this.mediaRecorder = null;
        this.recordedChunks = [];
    }

    async generate(options) {
        const { lyrics, musicStyle, videoStyle, duration, avatar, audioSource, audioFile } = options;
        
        try {
            // Create canvas for video frames
            this.canvas = document.createElement('canvas');
            this.canvas.width = 854;
            this.canvas.height = 480;
            this.ctx = this.canvas.getContext('2d');
            
            let audioBuffer;
            let audioUrl;
            
            if (audioSource === 'upload' && audioFile) {
                // Process uploaded audio file
                const audioData = await this.processUploadedAudio(audioFile);
                audioBuffer = audioData.buffer;
                audioUrl = audioData.url;
            } else {
                // Generate AI music
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                audioBuffer = await this.generateAudio(musicStyle, duration);
                audioUrl = null;
            }
            
            // Create video frames
            const frames = await this.generateVideoFrames(videoStyle, duration, lyrics, avatar);
            
            // Create final video with audio
            const videoBlob = await this.createVideoWithAudio(frames, audioBuffer, audioUrl, duration);
            
            return videoBlob;
            
        } catch (error) {
            console.error('Video generation error:', error);
            throw error;
        } finally {
            // Cleanup
            if (this.audioContext) {
                this.audioContext.close();
            }
        }
    }

    async processUploadedAudio(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    // Create audio element to get duration and play audio
                    const audio = new Audio(e.target.result);
                    
                    audio.addEventListener('loadedmetadata', async () => {
                        try {
                            // Create audio context and decode audio data
                            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                            const response = await fetch(e.target.result);
                            const arrayBuffer = await response.arrayBuffer();
                            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                            
                            resolve({
                                buffer: audioBuffer,
                                url: e.target.result,
                                duration: audio.duration
                            });
                        } catch (decodeError) {
                            console.error('Audio decode error:', decodeError);
                            reject(new Error('Failed to decode audio file. Please ensure it\'s a valid MP3 or WAV file.'));
                        }
                    });
                    
                    audio.addEventListener('error', () => {
                        reject(new Error('Failed to load audio file'));
                    });
                    
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read audio file'));
            reader.readAsDataURL(file);
        });
    }

    async generateAudio(style, duration) {
        const sampleRate = 22050;
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

    async generateVideoFrames(style, duration, lyrics, avatar) {
        const fps = 12; // Reduced FPS for better performance
        const totalFrames = duration * fps;
        const frames = [];
        const lyricLines = lyrics ? lyrics.split('\n').filter(line => line.trim()) : ['Enjoy the music!'];
        
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

    async createVideoWithAudio(frames, audioBuffer, audioUrl, duration) {
        return new Promise(async (resolve, reject) => {
            try {
                let finalVideoBlob;
                
                if (audioUrl) {
                    // Use uploaded audio - create video first, then combine
                    finalVideoBlob = await this.createVideoWithUploadedAudio(frames, audioUrl, duration);
                } else {
                    // Use generated audio - combine everything
                    finalVideoBlob = await this.createVideoWithGeneratedAudio(frames, audioBuffer, duration);
                }
                
                resolve(finalVideoBlob);
                
            } catch (error) {
                reject(error);
            }
        });
    }

    async createVideoWithUploadedAudio(frames, audioUrl, duration) {
        return new Promise((resolve, reject) => {
            try {
                // Create video stream from canvas
                const stream = this.canvas.captureStream(12); // 12 FPS
                
                let recorder;
                try {
                    recorder = new MediaRecorder(stream, {
                        mimeType: 'video/webm;codecs=vp8,opus',
                        videoBitsPerSecond: 1000000,
                        audioBitsPerSecond: 128000
                    });
                } catch (e) {
                    recorder = new MediaRecorder(stream);
                }
                
                const chunks = [];
                recorder.ondataavailable = (e) => chunks.push(e.data);
                recorder.onstop = () => {
                    const videoBlob = new Blob(chunks, { type: 'video/webm' });
                    resolve(videoBlob);
                };
                
                recorder.start();
                
                // Render frames with timing
                this.renderFramesWithTiming(frames, duration, recorder);
                
                // Add audio track separately for better compatibility
                setTimeout(() => {
                    this.addAudioTrackToVideo(stream, audioUrl).then(() => {
                        setTimeout(() => {
                            recorder.stop();
                        }, 1000);
                    }).catch(reject);
                }, 100);
                
            } catch (error) {
                reject(error);
            }
        });
    }

    async createVideoWithGeneratedAudio(frames, audioBuffer, duration) {
        return new Promise((resolve, reject) => {
            try {
                // Create audio element from buffer
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const audioSource = audioContext.createBufferSource();
                audioSource.buffer = audioBuffer;
                
                // Create destination for recording
                const destination = audioContext.createMediaStreamDestination();
                audioSource.connect(destination);
                
                // Create video stream
                const videoStream = this.canvas.captureStream(12);
                
                // Combine streams
                const combinedStream = new MediaStream([
                    ...videoStream.getVideoTracks(),
                    ...destination.stream.getAudioTracks()
                ]);
                
                let recorder;
                try {
                    recorder = new MediaRecorder(combinedStream, {
                        mimeType: 'video/webm;codecs=vp8,opus',
                        videoBitsPerSecond: 1000000,
                        audioBitsPerSecond: 128000
                    });
                } catch (e) {
                    recorder = new MediaRecorder(combinedStream);
                }
                
                const chunks = [];
                recorder.ondataavailable = (e) => chunks.push(e.data);
                recorder.onstop = () => {
                    const videoBlob = new Blob(chunks, { type: 'video/webm' });
                    resolve(videoBlob);
                };
                
                recorder.start();
                
                // Start audio and render frames
                audioSource.start();
                this.renderFramesWithTiming(frames, duration, recorder);
                
                // Stop recording after duration
                setTimeout(() => {
                    recorder.stop();
                    audioSource.stop();
                    audioContext.close();
                }, (duration + 1) * 1000);
                
            } catch (error) {
                reject(error);
            }
        });
    }

    async addAudioTrackToVideo(stream, audioUrl) {
        return new Promise((resolve, reject) => {
            const audio = new Audio(audioUrl);
            audio.loop = false;
            
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createMediaElementSource(audio);
            const destination = audioContext.createMediaStreamDestination();
            
            source.connect(destination);
            stream.addTrack(destination.stream.getAudioTracks()[0]);
            
            audio.play().then(resolve).catch(reject);
        });
    }

    renderFramesWithTiming(frames, duration, recorder) {
        let frameIndex = 0;
        const fps = 12;
        const totalFrames = duration * fps;
        const frameInterval = 1000 / fps;
        
        const renderNextFrame = () => {
            if (frameIndex < totalFrames && recorder.state === 'recording') {
                this.ctx.putImageData(frames[frameIndex], 0, 0);
                frameIndex++;
                setTimeout(renderNextFrame, frameInterval);
            }
        };
        
        renderNextFrame();
    }
}
