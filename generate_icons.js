import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SRC_LOGO = 'src/logo/inwhite.png';
const PUBLIC_DIR = 'public';

async function generateIcons() {
    try {
        if (!fs.existsSync(PUBLIC_DIR)) {
            fs.mkdirSync(PUBLIC_DIR);
        }

        const sizes = [64, 192, 512];

        for (const size of sizes) {
            await sharp(SRC_LOGO)
                .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                .toFile(path.join(PUBLIC_DIR, `pwa-${size}x${size}.png`));
            console.log(`Generated pwa-${size}x${size}.png`);
        }

        // Maskable icon (usually needs some padding)
        await sharp(SRC_LOGO)
            .resize(512, 512, { fit: 'contain', background: '#F56028' }) // Or any background color suitable for the maskable icon
            .toFile(path.join(PUBLIC_DIR, `maskable-icon-512x512.png`));
        console.log(`Generated maskable-icon-512x512.png`);

        // Apple touch icon
        await sharp(SRC_LOGO)
            .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .toFile(path.join(PUBLIC_DIR, `apple-touch-icon.png`));
        console.log(`Generated apple-touch-icon.png`);

        // Favicon (just copy the 64x64 or 32x32 one)
        await sharp(SRC_LOGO)
            .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .toFile(path.join(PUBLIC_DIR, `favicon.ico`));
        console.log(`Generated favicon.ico`);

    } catch (error) {
        console.error('Error generating icons:', error);
    }
}

generateIcons();
