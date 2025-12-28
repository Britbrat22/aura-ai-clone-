class AvatarGenerator {
    constructor() {
        this.styles = {
            cartoon: this.applyCartoonStyle.bind(this),
            anime: this.applyAnimeStyle.bind(this),
            realistic: this.applyRealisticStyle.bind(this),
            cyberpunk: this.applyCyberpunkStyle.bind(this)
        };
    }

    async generate(sourceImage, style) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = 512;
            canvas.height = 512;
            
            const img = new Image();
            img.onload = () => {
                // Clear canvas
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Apply style-specific transformations
                if (this.styles[style]) {
                    this.styles[style](ctx, img, canvas);
                } else {
                    // Default: just resize and center
                    this.drawImageCentered(ctx, img, canvas);
                }
                
                resolve(canvas.toDataURL('image/png'));
            };
            img.src = sourceImage.src;
        });
    }

    drawImageCentered(ctx, img, canvas) {
        const size = Math.min(img.width, img.height);
        const scale = 512 / size;
        const width = img.width * scale;
        const height = img.height * scale;
        const x = (canvas.width - width) / 2;
        const y = (canvas.height - height) / 2;
        
        ctx.drawImage(img, x, y, width, height);
    }

    applyCartoonStyle(ctx, img, canvas) {
        // Simplified cartoon effect
        ctx.filter = 'contrast(1.4) saturate(1.3)';
        this.drawImageCentered(ctx, img, canvas);
        
        // Add bold outline effect
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Simple edge detection for cartoon effect
        for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            if (gray < 100) {
                data[i] = 0;
                data[i + 1] = 0;
                data[i + 2] = 0;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    applyAnimeStyle(ctx, img, canvas) {
        // Anime-style with bright colors
        ctx.filter = 'contrast(1.2) brightness(1.1) saturate(1.5)';
        this.drawImageCentered(ctx, img, canvas);
        
        // Add sparkle effects
        this.addSparkles(ctx, canvas);
    }

    applyRealisticStyle(ctx, img, canvas) {
        // Realistic with enhanced details
        ctx.filter = 'contrast(1.1) sharpness(1.2)';
        this.drawImageCentered(ctx, img, canvas);
    }

    applyCyberpunkStyle(ctx, img, canvas) {
        // Cyberpunk with neon colors
        ctx.filter = 'hue-rotate(180deg) saturate(2) contrast(1.3)';
        this.drawImageCentered(ctx, img, canvas);
        
        // Add neon glow effect
        this.addNeonGlow(ctx, canvas);
    }

    addSparkles(ctx, canvas) {
        ctx.fillStyle = '#FFD700';
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 5 + 2;
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    addNeonGlow(ctx, canvas) {
        // Add neon border
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#FF00FF');
        gradient.addColorStop(1, '#00FFFF');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 10;
        ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
    }
}
