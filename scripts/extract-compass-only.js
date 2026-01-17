/**
 * Extract just the compass icon from the horizontal logo
 */

const sharp = require('sharp');
const path = require('path');

async function extractCompass() {
  const logoPath = path.join(__dirname, '../public/Brandassets/logo-blue.png');

  try {
    // Read the image to get its dimensions
    const metadata = await sharp(logoPath).metadata();
    console.log(`Original logo dimensions: ${metadata.width}x${metadata.height}`);

    // The compass takes up about 40% of the width on the left side
    // Center it vertically
    const compassWidth = Math.floor(metadata.width * 0.35);
    const compassHeight = compassWidth; // Keep it square
    const leftOffset = Math.floor(metadata.width * 0.02); // Small padding from left
    const topOffset = Math.floor((metadata.height - compassHeight) / 2);

    // Extract just the compass portion
    await sharp(logoPath)
      .extract({
        left: leftOffset,
        top: topOffset,
        width: compassWidth,
        height: compassHeight
      })
      .resize(500, 500, { // Resize to standard size
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toFile(path.join(__dirname, '../public/Brandassets/compass-only.png'));

    console.log('✅ Compass-only icon extracted successfully!');
    console.log('   Saved to: public/Brandassets/compass-only.png');
    console.log(`   Size: ${compassSize}x${compassSize}px`);

  } catch (error) {
    console.error('❌ Error extracting compass:', error.message);
    process.exit(1);
  }
}

extractCompass();
