/**
 * fix-icons.mjs
 * Adds safe-zone padding to all app icons so nothing gets clipped by
 * Android's adaptive icon mask (circle / squircle) or iOS rounded rect.
 *
 * Run from the frontend directory:
 *   node fix-icons.mjs
 */

import { Jimp } from 'jimp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.join(__dirname, 'assets');

const WHITE = 0xFFFFFFFF;
const DARK  = 0x121212FF; // matches backgroundDark from theme/colors.ts

async function addPadding(filename, bgColor, paddingFraction) {
  const inputPath = path.join(ASSETS, filename);
  const SIZE = 1024;
  const innerSize = Math.round(SIZE * (1 - 2 * paddingFraction));
  const offset    = Math.round((SIZE - innerSize) / 2);

  const src = await Jimp.read(inputPath);
  src.resize({ w: innerSize, h: innerSize });

  const bg = new Jimp({ width: SIZE, height: SIZE, color: bgColor });
  bg.composite(src, offset, offset);

  await bg.write(inputPath);
  console.log(`✅  ${filename.padEnd(28)} content: ${Math.round((1 - paddingFraction * 2) * 100)}%  offset: ${offset}px`);
}

async function main() {
  console.log('Fixing icon padding…\n');

  // icon.png — used for iOS + EAS fallback
  // iOS clips to a rounded rect; 12% padding each side keeps content clear
  await addPadding('icon.png',               WHITE, 0.12);
  await addPadding('icon-dark.png',          DARK,  0.12);

  // adaptive-icon.png — Android foreground layer
  // Android safe zone = inner 66.7%; 17% padding each side ensures nothing is clipped
  await addPadding('adaptive-icon.png',      WHITE, 0.17);
  await addPadding('adaptive-icon-dark.png', DARK,  0.17);

  console.log('\nAll icons updated. Now rebuild:');
  console.log('  eas build -p android --profile preview');
}

main().catch(err => { console.error(err); process.exit(1); });
