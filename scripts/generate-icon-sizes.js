/**
 * Generate different icon sizes for PWA manifest
 * Creates 192x192 and 512x512 versions from the compass logo
 */

const sharp = require('sharp');
const path = require('path');

async function generateIcons() {
  const logoPath = path.join(__dirname, '../public/Brandassets/compass-only.png');

  const sizes = [
    { size: 192, filename: 'icon-192.png' },
    { size: 512, filename: 'icon-512.png' }
  ];

  try {
    for (const { size, filename } of sizes) {
      // Create a royal blue background
      const background = await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 30, g: 64, b: 175, alpha: 1 }
        }
      }).png().toBuffer();

      // Resize logo to 90% of canvas size (minimal padding)
      const logoSize = Math.floor(size * 0.9);
      const logo = await sharp(logoPath)
        .resize(logoSize, logoSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toBuffer();

      // Composite logo centered on background
      const offset = Math.floor((size - logoSize) / 2);
      await sharp(background)
        .composite([
          {
            input: logo,
            top: offset,
            left: offset
          }
        ])
        .png()
        .toFile(path.join(__dirname, '../public', filename));

      console.log(`✅ Generated ${filename} (${size}x${size})`);
    }

    console.log('\n✅ All icon sizes generated successfully!');
    console.log('Files created:');
    console.log('  - public/icon-192.png');
    console.log('  - public/icon-512.png');

  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    process.exit(1);
  }
}

generateIcons();
