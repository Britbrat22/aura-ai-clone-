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
            
            canvas.width = 400;
            canvas.height = 400;
            
            const img = new Image();
            img.onload = () => {
                // Clear canvas with white background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Apply style
                if (this.styles[style]) {
                    this.styles[style](ctx, img, canvas);
                } else {
                    this.drawImageCentered(ctx, img, canvas);
                }
                
                resolve(canvas.toDataURL('image/png'));
            };
            img.src = sourceImage.src;
        });
    }

    drawImageCentered(ctx, img, canvas) {
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const width = img.width * scale;
        const height = img.height * scale;
        const x = (canvas.width - width) / 2;
        const y = (canvas.height - height) / 2;
        
        ctx.drawImage(img, x, y, width, height);
    }

    applyCartoonStyle(ctx, img, canvas) {
        // Simple cartoon effect with enhanced contrast
        ctx.filter = 'contrast(1.4) saturate(1.3)';
        this.drawImageCentered(ctx, img, canvas);
        
        // Add simple outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    }

    applyAnimeStyle(ctx, img, canvas) {
        ctx.filter = 'contrast(1.2) brightness(1.1) saturate(1.5)';
        this.drawImageCentered(ctx, img, canvas);
        
        // Add sparkles
        ctx.fillStyle = '#FFD700';
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    applyRealisticStyle(ctx, img, canvas) {
        ctx.filter = 'contrast(1.1)';
        this.drawImageCentered(ctx, img, canvas);
    }

    applyCyberpunkStyle(ctx, img, canvas) {
        ctx.filter = 'hue-rotate(180deg) saturate(2) contrast(1.3)';
        this.drawImageCentered(ctx, img, canvas);
        
        // Add neon border
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#FF00FF');
        gradient.addColorStop(1, '#00FFFF');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 5;
        ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
    }
}
