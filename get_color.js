import sharp from 'sharp';
import fs from 'fs';

async function getBgColor() {
    try {
        const { data, info } = await sharp('src/logo/inwhite.png')
            .raw()
            .toBuffer({ resolveWithObject: true });

        // Get the top-left pixel
        const r = data[0];
        const g = data[1];
        const b = data[2];

        // Convert to hex
        const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
        console.log('Detected Top-Left Pixel Color:', hex);
    } catch (e) {
        console.error(e);
    }
}
getBgColor();
