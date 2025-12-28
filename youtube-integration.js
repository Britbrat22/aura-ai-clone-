class YouTubeIntegration {
    constructor() {
        this.apiKey = 'YOUR_YOUTUBE_API_KEY'; // You'll need to get this from Google Cloud Console
        this.proxyUrl = 'https://cors-anywhere.herokuapp.com/'; // For CORS issues
    }

    async fetchYouTubeVideo(url) {
        try {
            const videoId = this.extractVideoId(url);
            if (!videoId) {
                throw new Error('Invalid YouTube URL');
            }

            // Get video info
            const videoInfo = await this.getVideoInfo(videoId);
            
            // Get audio stream URL (this is simplified - in reality you'd need more complex processing)
            const audioUrl = await this.getAudioUrl(videoId);
            
            return {
                title: videoInfo.title,
                duration: videoInfo.duration,
                thumbnail: videoInfo.thumbnail,
                audioUrl: audioUrl,
                videoId: videoId
            };
        } catch (error) {
            console.error('YouTube fetch error:', error);
            throw new Error('Failed to fetch YouTube video. Please check the URL and try again.');
        }
    }

    extractVideoId(url) {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }

    async getVideoInfo(videoId) {
        // Using YouTube Data API v3
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${this.apiKey}`
        );
        
        if (!response.ok) {
            throw new Error('Failed to fetch video info');
        }
        
        const data = await response.json();
        
        if (data.items.length === 0) {
            throw new Error('Video not found');
        }
        
        const video = data.items[0];
        const duration = this.parseDuration(video.contentDetails.duration);
        
        return {
            title: video.snippet.title,
            duration: duration,
            thumbnail: video.snippet.thumbnails.medium.url
        };
    }

    parseDuration(isoDuration) {
        // Parse ISO 8601 duration (PT#M#S)
        const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        const hours = parseInt(match[1] || 0);
        const minutes = parseInt(match[2] || 0);
        const seconds = parseInt(match[3] || 0);
        
        return hours * 3600 + minutes * 60 + seconds;
    }

    async getAudioUrl(videoId) {
        // This is a simplified approach - in reality, you'd need to use
        // a service like youtube-dl or a proper YouTube to MP3 API
        // For now, we'll return a placeholder that won't work in production
        
        // WARNING: This is for educational purposes only
        // You should use proper YouTube API services or get permission
        
        return `https://www.youtube.com/watch?v=${videoId}`; // This won't work directly
    }

    // Alternative method using a proxy service (educational purposes only)
    async getAudioStreamUrl(videoId) {
        // This would typically require a backend service or proper API
        // For demonstration, we'll show the concept
        
        const response = await fetch(`${this.proxyUrl}https://www.youtube.com/watch?v=${videoId}`);
        const html = await response.text();
        
        // Extract audio stream URL from the page (this is very simplified)
        // In reality, this is much more complex and requires parsing JavaScript
        const audioMatch = html.match(/"audioUrl":"([^"]+)"/);
        
        if (audioMatch) {
            return audioMatch[1].replace(/\\u0026/g, '&');
        }
        
        throw new Error('Could not extract audio URL');
    }
}

// YouTube UI Handler
class YouTubeUI {
    constructor() {
        this.youtubeIntegration = new YouTubeIntegration();
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const fetchButton = document.getElementById('fetch-youtube');
        const youtubeUrlInput = document.getElementById('youtube-url');

        fetchButton.addEventListener('click', () => this.handleYouTubeFetch());
        youtubeUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleYouTubeFetch();
        });
    }

    async handleYouTubeFetch() {
        const url = document.getElementById('youtube-url').value.trim();
        if (!url) {
            alert('Please enter a YouTube URL');
            return;
        }

        const fetchButton = document.getElementById('fetch-youtube');
        const originalText = fetchButton.innerHTML;
        
        fetchButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Fetching...';
        fetchButton.disabled = true;

        try {
            const videoInfo = await this.youtubeIntegration.fetchYouTubeVideo(url);
            this.displayYouTubePreview(videoInfo);
            
            // Store for later use
            window.youtubeVideoInfo = videoInfo;
            
        } catch (error) {
            console.error('YouTube fetch error:', error);
            alert('Failed to fetch YouTube video. Please check the URL and try again.');
        } finally {
            fetchButton.innerHTML = originalText;
            fetchButton.disabled = false;
        }
    }

    displayYouTubePreview(videoInfo) {
        const preview = document.getElementById('youtube-preview');
        const thumbnail = document.getElementById('youtube-thumbnail');
        const title = document.getElementById('youtube-title');
        const duration = document.getElementById('youtube-duration');

        thumbnail.src = videoInfo.thumbnail;
        title.textContent = videoInfo.title;
        duration.textContent = `Duration: ${this.formatDuration(videoInfo.duration)}`;

        preview.style.display = 'block';
    }

    formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}
