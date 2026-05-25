import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sizes = [16, 32, 48, 128];
const svgPath = join(__dirname, '../public/icons/icon.svg');
const outputDir = join(__dirname, '../public/icons');

mkdirSync(outputDir, { recursive: true });

const svgBuffer = readFileSync(svgPath);

for (const size of sizes) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(join(outputDir, `icon${size}.png`));
  console.log(`Generated icon${size}.png`);
}

console.log('All icons generated!');
