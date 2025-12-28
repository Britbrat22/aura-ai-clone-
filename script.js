// Main application controller
class AuraAIApp {
    constructor() {
        this.currentTab = 'avatar';
        this.generatedAvatar = null;
        this.currentAvatarStyle = null;
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
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Update tab content
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
            
            // Simulate avatar generation
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Generate avatar using canvas
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
        const lyrics = document.getElementById('lyrics-input').value.trim();
        const musicStyle = document.getElementById('music-style').value;
        const videoStyle = document.getElementById('video-style').value;
        const duration = document.getElementById('duration').value;
        
        if (!lyrics) {
            alert('Please enter lyrics or scene description');
            return;
        }

        const generateBtn = document.getElementById('generate-video');
        const spinner = generateBtn.querySelector('.fa-cog');
        const resultSection = document.getElementById('video-result');
        
        generateBtn.disabled = true;
        spinner.style.display = 'inline-block';
        
        try {
            this.showProgress('Creating your music video...');
            
            // Simulate music video generation
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Generate video using canvas and audio
            const videoGenerator = new MusicVideoGenerator();
            const videoDataUrl = await videoGenerator.generate({
                lyrics,
                musicStyle,
                videoStyle,
                duration,
                avatar: this.generatedAvatar
            });
            
            document.getElementById('generated-video').src = videoDataUrl;
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
        
        // Simulate progress
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

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AuraAIApp();
});
initializeYouTubeIntegration() {
    this.youtubeUI = new YouTubeUI();
    
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
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('audio/')) {
            this.handleAudioUpload(files[0]);
        }
    });
    
    audioInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            this.handleAudioUpload(e.target.files[0]);
        }
    });
}

handleAudioUpload(file) {
    if (!file.type.startsWith('audio/')) {
        alert('Please upload an audio file');
        return;
    }
    
    // Store audio file
    this.uploadedAudio = file;
    
    // Display audio info
    const audio = new Audio(URL.createObjectURL(file));
    audio.addEventListener('loadedmetadata', () => {
        document.getElementById('audio-filename').textContent = file.name;
        document.getElementById('audio-duration').textContent = AppUtils.formatDuration(Math.floor(audio.duration));
        document.getElementById('audio-info').style.display = 'block';
        
        // Update duration slider
        document.getElementById('duration').max = Math.floor(audio.duration);
        document.getElementById('duration').value = Math.floor(audio.duration);
        document.getElementById('duration-value').textContent = AppUtils.formatDuration(Math.floor(audio.duration)) + 's';
    });
}

async generateMusicVideo() {
    const lyrics = document.getElementById('lyrics-input').value.trim();
    const musicStyle = document.getElementById('music-style').value;
    const videoStyle = document.getElementById('video-style').value;
    const duration = parseInt(document.getElementById('duration').value);
    
    if (!lyrics && !this.uploadedAudio && !window.youtubeVideoInfo) {
        alert('Please enter lyrics, upload an audio file, or provide a YouTube URL');
        return;
    }

    const generateBtn = document.getElementById('generate-video');
    const spinner = generateBtn.querySelector('.fa-cog');
    const resultSection = document.getElementById('video-result');
    
    generateBtn.disabled = true;
    spinner.style.display = 'inline-block';
    
    try {
        this.showProgress('Creating your music video...');
        
        // Determine audio source
        let audioSource = { type: 'generated', data: null };
        if (this.uploadedAudio) {
            audioSource = { type: 'upload', data: this.uploadedAudio };
        } else if (window.youtubeVideoInfo) {
            audioSource = { type: 'youtube', data: window.youtubeVideoInfo };
        }
        
        // Generate video
        const videoGenerator = new MusicVideoGenerator();
        const videoBlob = await videoGenerator.generate({
            lyrics: lyrics || 'Enjoy the music',
            musicStyle,
            videoStyle,
            duration,
            avatar: this.generatedAvatar,
            audioSource
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
