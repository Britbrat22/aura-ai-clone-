class MusicVideoGenerator {
    constructor() {
        this.audioContext = null;
        this.canvas = null;
        this.ctx = null;
        this.audioBuffer = null;
        this.youtubeAudio = null;
        this.uploadedAudio = null;
    }

    async generate(options) {
        const { lyrics, musicStyle, videoStyle, duration, avatar, audioSource } = options;
        
        // Initialize audio context
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create canvas for video frames
        this.canvas = document.createElement('canvas');
        this.canvas.width = 1280;
        this.canvas.height = 720;
        this.ctx = this.canvas.getContext('2d');
        
        // Get audio based on source type
        let audioBuffer;
        if (audioSource.type === 'youtube') {
            audioBuffer = await this.processYouTubeAudio(audioSource.data);
        } else if (audioSource.type === 'upload') {
            audioBuffer = await this.processUploadedAudio(audioSource.data);
        } else {
            audioBuffer = await this.generateAudio(musicStyle, duration);
        }
        
        this.audioBuffer = audioBuffer;
        
        // Analyze audio for beat detection
        const beatData = await this.analyzeAudioBeats(audioBuffer);
        
        // Create video frames
        const frames = await this.generateVideoFrames(lyrics, videoStyle, duration, avatar, beatData);
        
        // Combine audio and video
        const videoBlob = await this.combineAudioVideo(audioBuffer, frames, duration);
        
        return videoBlob;
    }

    async processYouTubeAudio(youtubeData) {
        // Convert YouTube audio to audio buffer
        const audio = new Audio(youtubeData.audioUrl);
        audio.crossOrigin = 'anonymous';
        
        return new Promise((resolve, reject) => {
            const source = this.audioContext.createMediaElementSource(audio);
            const analyser = this.audioContext.createAnalyser();
            source.connect(analyser);
            
            audio.onloadedmetadata = () => {
                const duration = audio.duration;
                const sampleRate = this.audioContext.sampleRate;
                const length = sampleRate * duration;
                const audioBuffer = this.audioContext.createBuffer(2, length, sampleRate);
                
                // Process audio data
                this.extractAudioData(audio, audioBuffer).then(resolve).catch(reject);
            };
            
            audio.onerror = () => reject(new Error('Failed to load YouTube audio'));
            audio.load();
        });
    }

    async processUploadedAudio(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const audio = new Audio(e.target.result);
                    const audioBuffer = await this.audioContext.decodeAudioData(
                        await fetch(e.target.result).then(r => r.arrayBuffer())
                    );
                    resolve(audioBuffer);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read audio file'));
            reader.readAsDataURL(file);
        });
    }

    async extractAudioData(audioElement, audioBuffer) {
        // Create offline context for processing
        const offlineContext = new OfflineAudioContext(
            audioBuffer.numberOfChannels,
            audioBuffer.length,
            audioBuffer.sampleRate
        );
        
        const source = offlineContext.createMediaElementSource(audioElement);
        source.connect(offlineContext.destination);
        
        // Start rendering
        audioElement.play();
        const renderedBuffer = await offlineContext.startRendering();
        audioElement.pause();
        
        return renderedBuffer;
    }

    async analyzeAudioBeats(audioBuffer) {
        // Simple beat detection algorithm
        const sampleRate = audioBuffer.sampleRate;
        const channelData = audioBuffer.getChannelData(0);
        const bufferSize = 1024;
        const beatData = [];
        
        for (let i = 0; i < channelData.length; i += bufferSize) {
            const slice = channelData.slice(i, i + bufferSize);
            const energy = this.calculateEnergy(slice);
            const spectralCentroid = this.calculateSpectralCentroid(slice, sampleRate);
            
            beatData.push({
                time: i / sampleRate,
                energy: energy,
                spectralCentroid: spectralCentroid,
                isBeat: energy > 0.1 // Simple threshold
            });
        }
        
        return beatData;
    }

    calculateEnergy(audioData) {
        let energy = 0;
        for (let i = 0; i < audioData.length; i++) {
            energy += audioData[i] * audioData[i];
        }
        return Math.sqrt(energy / audioData.length);
    }

    calculateSpectralCentroid(audioData, sampleRate) {
        // Simplified spectral centroid calculation
        const fft = this.performFFT(audioData);
        let numerator = 0;
        let denominator = 0;
        
        for (let i = 0; i < fft.length / 2; i++) {
            const frequency = (i / fft.length) * sampleRate;
            const magnitude = Math.sqrt(fft[i * 2] * fft[i * 2] + fft[i * 2 + 1] * fft[i * 2 + 1]);
            
            numerator += frequency * magnitude;
            denominator += magnitude;
        }
        
        return denominator === 0 ? 0 : numerator / denominator;
    }

    performFFT(audioData) {
        // Simplified FFT implementation
        // In a real app, you'd use a proper FFT library
        const fft = new Array(audioData.length * 2);
        for (let i = 0; i < audioData.length; i++) {
            fft[i * 2] = audioData[i];
            fft[i * 2 + 1] = 0;
        }
        return fft;
    }

    async generateVideoFrames(lyrics, style, duration, avatar, beatData) {
        const fps = 30;
        const totalFrames = duration * fps;
        const frames = [];
        
        // Parse lyrics for timing
        const lyricLines = this.parseLyrics(lyrics, duration);
        
        for (let frame = 0; frame < totalFrames; frame++) {
            const progress = frame / totalFrames;
            const currentTime = frame / fps;
            
            // Find current beat and lyric
            const currentBeat = beatData.find(beat => 
                Math.abs(beat.time - currentTime) < 0.1
            );
            const currentLyric = lyricLines.find(line => 
                currentTime >= line.startTime && currentTime <= line.endTime
            );
            
            // Clear canvas
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Generate frame based on style and audio analysis
            await this.generateStyleFrame(style, progress, currentTime, currentBeat, currentLyric);
            
            // Add avatar if provided
            if (avatar) {
                this.addAvatarToFrame(avatar, progress);
            }
            
            // Convert canvas to image data
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            frames.push(imageData);
        }
        
        return frames;
    }

    parseLyrics(lyrics, duration) {
        // Simple lyric parsing - split by lines and distribute over duration
        const lines = lyrics.split('\n').filter(line => line.trim());
        const lineDuration = duration / lines.length;
        
        return lines.map((line, index) => ({
            text: line.trim(),
            startTime: index * lineDuration,
            endTime: (index + 1) * lineDuration
        }));
    }

    async generateStyleFrame(style, progress, currentTime, currentBeat, currentLyric) {
        const options = {
            lyricsSync: document.getElementById('lyrics-sync')?.checked ?? true,
            beatSync: document.getElementById('beat-sync')?.checked ?? false,
            waveformVisual: document.getElementById('waveform-visual')?.checked ?? false,
            subtitleLyrics: document.getElementById('subtitle-lyrics')?.checked ?? true
        };

        switch (style) {
            case 'animated':
                this.generateAnimatedFrame(progress, currentTime, currentBeat, options);
                break;
            case 'cinematic':
                this.generateCinematicFrame(progress, currentTime, currentBeat, options);
                break;
            case 'abstract':
                this.generateAbstractFrame(progress, currentTime, currentBeat, options);
                break;
            case 'lyrics':
                this.generateLyricsFrame(progress, currentTime, currentLyric, options);
                break;
            case 'story':
                this.generateStoryFrame(progress, currentTime, currentBeat, options);
                break;
        }

        // Add waveform visualization if enabled
        if (options.waveformVisual) {
            this.addWaveformVisualization(currentTime);
        }

        // Add subtitles if enabled and lyric available
        if (options.subtitleLyrics && currentLyric) {
            this.addLyricsSubtitle(currentLyric.text, progress);
        }
    }

    generateAnimatedFrame(progress, currentTime, currentBeat, options) {
        // Beat-reactive animation
        const intensity = currentBeat ? currentBeat.energy : 0.5;
        const time = currentTime * Math.PI * 4;
        
        for (let i = 0; i < 15; i++) {
            const x = (Math.sin(time + i) + 1) * this.canvas.width / 2;
            const y = (Math.cos(time + i * 0.7) + 1) * this.canvas.height / 2;
            const radius = 30 + (intensity * 50) + Math.sin(time + i) * 20;
            
            const hue = (progress * 360 + i * 24 + (intensity * 60)) % 360;
            const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, `hsla(${hue}, 70%, 60%, 0.8)`);
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    generateCinematicFrame(progress, currentTime, currentBeat, options) {
        // Cinematic with beat-reactive lighting
        const intensity = currentBeat ? currentBeat.energy : 0.3;
        
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, `rgba(26, 26, 46, ${0.8 + intensity * 0.2})`);
        gradient.addColorStop(0.5, `rgba(22, 33, 62, ${0.7 + intensity * 0.3})`);
        gradient.addColorStop(1, `rgba(15, 52, 96, ${0.6 + intensity * 0.4})`);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Add cinematic bars
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, 50);
        this.ctx.fillRect(0, this.canvas.height - 50, this.canvas.width, 50);
        
        // Beat-reactive light rays
        if (intensity > 0.5) {
            const lightX = this.canvas.width / 2 + Math.sin(currentTime * 2) * 200;
            const lightGradient = this.ctx.createRadialGradient(lightX, this.canvas.height / 2, 0, lightX, this.canvas.height / 2, 300);
            lightGradient.addColorStop(0, `rgba(255, 255, 255, ${intensity * 0.3})`);
            lightGradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = lightGradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    generateAbstractFrame(progress, currentTime, currentBeat, options) {
        // Abstract with beat-reactive colors
        const intensity = currentBeat ? currentBeat.energy : 0.5;
        const time = currentTime * Math.PI * 6;
        
        for (let x = 0; x < this.canvas.width; x += 15) {
            for (let y = 0; y < this.canvas.height; y += 15) {
                const hue = (x + y + time * 50 + (intensity * 100)) % 360;
                const saturation = 50 + Math.sin(time + x * 0.01) * 30 + (intensity * 20);
                const lightness = 30 + Math.cos(time + y * 0.01) * 20 + (intensity * 25);
                
                this.ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                this.ctx.fillRect(x, y, 13, 13);
            }
        }
    }

    generateLyricsFrame(progress, currentTime, currentLyric, options) {
        // Enhanced lyrics display with timing
        this.ctx.fillStyle = '#000033';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (currentLyric) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 64px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // Add glow effect
            this.ctx.shadowColor = '#ffffff';
            this.ctx.shadowBlur = 20;
            
            this.ctx.fillText(currentLyric.text, this.canvas.width / 2, this.canvas.height / 2);
            
            // Reset shadow
            this.ctx.shadowBlur = 0;
        }
        
        // Add subtitle
        this.ctx.font = '24px Arial';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.fillText('AI Generated Music Video', this.canvas.width / 2, this.canvas.height / 2 + 80);
    }

    generateStoryFrame(progress, currentTime, currentBeat, options) {
        // Storytelling with beat synchronization
        const intensity = currentBeat ? currentBeat.energy : 0.3;
        const sceneCount = 3;
        const currentScene = Math.floor(progress * sceneCount);
        const sceneProgress = (progress * sceneCount) % 1;
        
        switch (currentScene) {
            case 0: // Opening scene
                this.drawOpeningScene(sceneProgress, intensity);
                break;
            case 1: // Middle scene
                this.drawMiddleScene(sceneProgress, intensity);
                break;
            case 2: // Closing scene
                this.drawClosingScene(sceneProgress, intensity);
                break;
        }
    }

    drawOpeningScene(progress, intensity) {
        // Sunrise with intensity-based colors
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, `rgba(255, 107, 107, ${0.8 + intensity * 0.2})`);
        gradient.addColorStop(0.5, `rgba(254, 202, 87, ${0.7 + intensity * 0.3})`);
        gradient.addColorStop(1, `rgba(72, 219, 251, ${0.6 + intensity * 0.4})`);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Sun with intensity-based glow
        const sunY = this.canvas.height - 100 - progress * 200;
        const sunSize = 60 + intensity * 20;
        const sunGradient = this.ctx.createRadialGradient(100, sunY, 0, 100, sunY, sunSize * 1.5);
        sunGradient.addColorStop(0, '#ffffff');
        sunGradient.addColorStop(1, `rgba(254, 202, 87, ${0.8 + intensity * 0.2})`);
        
        this.ctx.fillStyle = sunGradient;
        this.ctx.beginPath();
        this.ctx.arc(100, sunY, sunSize, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawMiddleScene(progress, intensity) {
        // City with beat-reactive buildings
        this.ctx.fillStyle = `rgba(44, 62, 80, ${0.8 + intensity * 0.2})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Buildings with intensity-based heights
        for (let i = 0; i < 8; i++) {
            const baseHeight = 200;
            const height = baseHeight + Math.sin(i + progress) * 100 + (intensity * 50);
            const x = i * (this.canvas.width / 8);
            const width = this.canvas.width / 8 - 10;
            
            this.ctx.fillStyle = `rgba(52, 73, 94, ${0.9 + intensity * 0.1})`;
            this.ctx.fillRect(x, this.canvas.height - height, width, height);
            
            // Windows with intensity-based brightness
            this.ctx.fillStyle = `rgba(243, 156, 18, ${0.7 + intensity * 0.3})`;
            for (let j = 0; j < height / 30; j++) {
                if (Math.random() > 0.3) {
                    this.ctx.fillRect(x + 10, this.canvas.height - height + j * 30 + 5, width - 20, 20);
                }
            }
        }
    }

    drawClosingScene(progress, intensity) {
        // Starry night with intensity-based star brightness
        this.ctx.fillStyle = `rgba(44, 62, 80, ${0.9 + intensity * 0.1})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Stars with intensity-based brightness
        this.ctx.fillStyle = `rgba(255, 255, 255, ${0.7 + intensity * 0.3})`;
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const size = Math.random() * 3 + 1 + (intensity * 2);
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Moon with intensity-based glow
        const moonX = this.canvas.width - 100;
        const moonY = 100;
        const moonGradient = this.ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 60);
        moonGradient.addColorStop(0, `rgba(255, 255, 255, ${0.9 + intensity * 0.1})`);
        moonGradient.addColorStop(1, `rgba(189, 195, 199, ${0.7 + intensity * 0.3})`);
        
        this.ctx.fillStyle = moonGradient;
        this.ctx.beginPath();
        this.ctx.arc(moonX, moonY, 40, 0, Math.PI * 2);
        this.ctx.fill();
    }

    addWaveformVisualization(currentTime) {
        if (!this.audioBuffer) return;
        
        const channelData = this.audioBuffer.getChannelData(0);
        const sampleRate = this.audioBuffer.sampleRate;
        const startSample = Math.floor(currentTime * sampleRate);
        const samplesPerPixel = Math.floor(sampleRate / 60); // 60 FPS visualization
        
        this.ctx.strokeStyle = '#00ff88';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        for (let x = 0; x < this.canvas.width; x += 2) {
            const sampleIndex = startSample + (x * samplesPerPixel);
            if (sampleIndex >= channelData.length) break;
            
            const sample = channelData[sampleIndex] || 0;
            const y = this.canvas.height - 50 - (sample * 100);
            
            if (x === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.stroke();
    }

    addLyricsSubtitle(text, progress) {
        if (!text) return;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(50, this.canvas.height - 120, this.canvas.width - 100, 80);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Fade in/out effect
        const alpha = Math.sin(progress * Math.PI) * 0.8 + 0.2;
        this.ctx.globalAlpha = alpha;
        
        this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height - 80);
        this.ctx.globalAlpha = 1;
    }

    addAvatarToFrame(avatarSrc, progress) {
        const avatarImg = new Image();
        avatarImg.onload = () => {
            const size = 150;
            const x = this.canvas.width - size - 20;
            const y = 20;
            
            // Add pulsing effect based on progress
            const scale = 1 + Math.sin(progress * Math.PI * 4) * 0.05;
            const scaledSize = size * scale;
            const offset = (scaledSize - size) / 2;
            
            // Add circular mask
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
            this.ctx.clip();
            
            this.ctx.drawImage(avatarImg, x - offset, y - offset, scaledSize, scaledSize);
            this.ctx.restore();
            
            // Add border
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
            this.ctx.stroke();
        };
        avatarImg.src = avatarSrc;
    }

    async combineAudioVideo(audioBuffer, frames, duration) {
        const stream = this.canvas.captureStream(30);
        
        // Create audio track from buffer
        const audioTrack = await this.createAudioTrackFromBuffer(audioBuffer, duration);
        if (audioTrack) {
            stream.addTrack(audioTrack);
        }
        
        return new Promise((resolve) => {
            const recorder = new MediaRecorder(stream, {
                mimeType: 'video/webm',
                videoBitsPerSecond: 2500000,
                audioBitsPerSecond: 128000
            });
            
            const chunks = [];
            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                resolve(blob);
            };
            
            recorder.start();
            
            // Render frames with proper timing
            this.renderFramesWithTiming(frames, duration, recorder);
        });
    }

    async createAudioTrackFromBuffer(audioBuffer, duration) {
        // Create a media stream from audio buffer
        const offlineContext = new OfflineAudioContext(
            audioBuffer.numberOfChannels,
            audioBuffer.length,
            audioBuffer.sampleRate
        );
        
        const source = offlineContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(offlineContext.destination);
        source.start();
        
        const renderedBuffer = await offlineContext.startRendering();
        
        // Convert to media stream
        const mediaStreamDestination = this.audioContext.createMediaStreamDestination();
        const sourceNode = this.audioContext.createBufferSource();
        sourceNode.buffer = renderedBuffer;
        sourceNode.connect(mediaStreamDestination);
        sourceNode.start();
        
        return mediaStreamDestination.stream.getAudioTracks()[0];
    }

    renderFramesWithTiming(frames, duration, recorder) {
        let frameIndex = 0;
        const fps = 30;
        const frameInterval = 1000 / fps;
        
        const renderNextFrame = () => {
            if (frameIndex < frames.length) {
                this.ctx.putImageData(frames[frameIndex], 0, 0);
                frameIndex++;
                setTimeout(renderNextFrame, frameInterval);
            } else {
                recorder.stop();
            }
        };
        
        renderNextFrame();
    }
}
