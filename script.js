class AuraAIApp {
    constructor() {
        this.currentTab = 'avatar';
        this.generatedAvatar = null;
        this.currentAvatarStyle = null;
        this.uploadedAudio = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Avatar upload
        const uploadArea = document.getElementById('avatar-upload-area');
        const fileInput = document.getElementById('avatar-input');

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleAvatarUpload(files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleAvatarUpload(e.target.files[0]);
            }
        });

        // Style selection
        document.querySelectorAll('.style-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.style-option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
                this.currentAvatarStyle = option.dataset.style;
                this.updateGenerateButton();
            });
        });

        // Avatar generation
        document.getElementById('generate-avatar').addEventListener('click', () => {
            this.generateAvatar();
        });

        // Audio source toggle
        document.getElementById('audio-source').addEventListener('change', (e) => {
            this.toggleAudioSource(e.target.value);
        });

        // Audio file upload
        const audioUploadArea = document.getElementById('audio-upload-area');
        const audioInput = document.getElementById('audio-input');

        audioUploadArea.addEventListener('click', () => audioInput.click());
        audioUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            audioUploadArea.classList.add('dragover');
        });
        audioUploadArea.addEventListener('dragleave', () => {
            audioUploadArea.classList.remove('dragover');
        });
        audioUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            audioUploadArea.classList.remove('dragover');
            const files = e.target.files || e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('audio/')) {
                this.handleAudioUpload(files[0]);
            }
        });

        audioInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleAudioUpload(e.target.files[0]);
            }
        });

        // Music video generation
        document.getElementById('generate-video').addEventListener('click', () => {
            this.generateMusicVideo();
        });

        // Duration slider
        const durationSlider = document.getElementById('duration');
        const durationValue = document.getElementById('duration-value');
        durationSlider.addEventListener('input', (e) => {
            durationValue.textContent = e.target.value + 's';
        });

        // Avatar selection for music video
        document.querySelectorAll('.avatar-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
            });
        });

        // Download buttons
        document.getElementById('download-avatar').addEventListener('click', () => {
            if (this.generatedAvatar) {
                AppUtils.downloadFile(this.generatedAvatar, 'my-avatar.png');
            }
        });

        document.getElementById('download-video').addEventListener('click', () => {
            const video = document.getElementById('generated-video');
            if (video.src) {
                AppUtils.downloadFile(video.src, 'music-video.webm');
            }
        });
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
    }

    handleAvatarUpload(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.getElementById('avatar-source-img');
            img.src = e.target.result;
            document.getElementById('avatar-preview').style.display = 'block';
            this.updateGenerateButton();
        };
        reader.readAsDataURL(file);
    }

    handleAudioUpload(file) {
        if (!file.type.startsWith('audio/')) {
            alert('Please upload an audio file');
            return;
        }

        this.uploadedAudio = file;
        
        const audio = new Audio(URL.createObjectURL(file));
        audio.addEventListener('loadedmetadata', () => {
            document.getElementById('audio-filename').textContent = file.name;
            document.getElementById('audio-duration').textContent = this.formatDuration(Math.floor(audio.duration));
            document.getElementById('audio-info').style.display = 'block';
            
            // Update duration slider
            const durationSlider = document.getElementById('duration');
            durationSlider.max = Math.floor(audio.duration);
            durationSlider.value = Math.floor(audio.duration);
            document.getElementById('duration-value').textContent = this.formatDuration(Math.floor(audio.duration));
        });
    }

    formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    toggleAudioSource(source) {
        const generatedOptions = document.getElementById('generated-audio-options');
        const uploadOptions = document.getElementById('upload-audio-options');
        
        if (source === 'upload') {
            generatedOptions.style.display = 'none';
            uploadOptions.style.display = 'block';
        } else {
            generatedOptions.style.display = 'block';
            uploadOptions.style.display = 'none';
        }
    }

    updateGenerateButton() {
        const generateBtn = document.getElementById('generate-avatar');
        const hasImage = document.getElementById('avatar-source-img').src;
        const hasStyle = this.currentAvatarStyle;
        generateBtn.disabled = !hasImage || !hasStyle;
    }

    async generateAvatar() {
        const generateBtn = document.getElementById('generate-avatar');
        const spinner = generateBtn.querySelector('.fa-cog');
        const resultSection = document.getElementById('avatar-result');
        
        generateBtn.disabled = true;
        spinner.style.display = 'inline-block';
        
        try {
            this.showProgress('Creating your avatar...');
            
            // Simple avatar generation using canvas
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const avatarGenerator = new AvatarGenerator();
            const avatarDataUrl = await avatarGenerator.generate(
                document.getElementById('avatar-source-img'),
                this.currentAvatarStyle
            );
            
            this.generatedAvatar = avatarDataUrl;
            document.getElementById('generated-avatar').src = avatarDataUrl;
            resultSection.style.display = 'block';
            
            this.hideProgress();
            
        } catch (error) {
            console.error('Avatar generation failed:', error);
            alert('Failed to generate avatar. Please try again.');
        } finally {
            generateBtn.disabled = false;
            spinner.style.display = 'none';
        }
    }

    async generateMusicVideo() {
        const audioSource = document.getElementById('audio-source').value;
        const lyrics = document.getElementById('lyrics-input').value.trim();
        const musicStyle = document.getElementById('music-style').value;
        const videoStyle = document.getElementById('video-style').value;
        const duration = parseInt(document.getElementById('duration').value);
        
        if (audioSource === 'generated' && !lyrics) {
            alert('Please enter lyrics for AI music generation');
            return;
        }
        
        if (audioSource === 'upload' && !this.uploadedAudio) {
            alert('Please upload an audio file');
            return;
        }

        const generateBtn = document.getElementById('generate-video');
        const spinner = generateBtn.querySelector('.fa-cog');
        const resultSection = document.getElementById('video-result');
        
        generateBtn.disabled = true;
        spinner.style.display = 'inline-block';
        
        try {
            this.showProgress('Creating your music video...');
            
            // Simple video generation
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const videoGenerator = new MusicVideoGenerator();
            const videoBlob = await videoGenerator.generate({
                lyrics: lyrics || 'Enjoy the music',
                musicStyle,
                videoStyle,
                duration,
                avatar: this.generatedAvatar,
                audioSource: audioSource,
                audioFile: this.uploadedAudio
            });
            
            const videoUrl = URL.createObjectURL(videoBlob);
            document.getElementById('generated-video').src = videoUrl;
            resultSection.style.display = 'block';
            
            this.hideProgress();
            
        } catch (error) {
            console.error('Music video generation failed:', error);
            alert('Failed to generate music video. Please try again.');
        } finally {
            generateBtn.disabled = false;
            spinner.style.display = 'none';
        }
    }

    showProgress(message) {
        const progressBar = document.getElementById('progress-bar');
        const progressText = progressBar.querySelector('.progress-text');
        const progressFill = progressBar.querySelector('.progress-fill');
        
        progressText.textContent = message;
        progressBar.style.display = 'block';
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            progressFill.style.width = progress + '%';
        }, 500);
        
        this.progressInterval = interval;
    }

    hideProgress() {
        const progressBar = document.getElementById('progress-bar');
        progressBar.style.display = 'none';
        
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
    }
}

// Utility functions
class AppUtils {
    static downloadFile(dataUrl, filename) {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    new AuraAIApp();
});
