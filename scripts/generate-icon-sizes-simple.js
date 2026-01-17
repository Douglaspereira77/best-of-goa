/**
 * Generate PWA icons - simple version with full compass on blue background
 */

const sharp = require('sharp');
const path = require('path');

async function generateIcons() {
  // Use the compass-only icon
  const logoPath = path.join(__dirname, '../public/Brandassets/compass-icon.png');

  const sizes = [
    { size: 192, filename: 'icon-192.png' },
    { size: 512, filename: 'icon-512.png' }
  ];

  try {
    for (const { size, filename } of sizes) {
      // Simply resize the icon and composite on blue background
      await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 30, g: 64, b: 175, alpha: 1 }
        }
      })
        .composite([
          {
            input: await sharp(logoPath)
              .resize(Math.floor(size * 0.75), Math.floor(size * 0.75), {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
              })
              .toBuffer(),
            gravity: 'center'
          }
        ])
        .png()
        .toFile(path.join(__dirname, '../public', filename));

      console.log(`✅ Generated ${filename} (${size}x${size})`);
    }

    console.log('\n✅ All icon sizes generated successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

generateIcons();
