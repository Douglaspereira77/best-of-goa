/**
 * Generate OG Image (1200x630) for Best of Goa
 *
 * This script creates a social sharing image with:
 * - Royal Blue background (#1e40af)
 * - Compass logo centered
 * - "Best of Goa" text
 * - Tagline
 *
 * Requires: sharp (npm install sharp)
 */

const sharp = require('sharp');
const path = require('path');

async function generateOGImage() {
  const width = 1200;
  const height = 630;

  // Create SVG with gradient background and text
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <!-- Gradient Background -->
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1e40af;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1e3a8a;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#grad)"/>

      <!-- Title -->
      <text
        x="${width / 2}"
        y="420"
        font-family="Inter, system-ui, -apple-system, sans-serif"
        font-size="72"
        font-weight="700"
        fill="white"
        text-anchor="middle"
      >Best of Goa</text>

      <!-- Tagline -->
      <text
        x="${width / 2}"
        y="490"
        font-family="Inter, system-ui, -apple-system, sans-serif"
        font-size="32"
        font-weight="400"
        fill="#f59e0b"
        text-anchor="middle"
      >Discover Goa's Finest Places</text>

      <!-- Small decoration line -->
      <line x1="400" y1="520" x2="800" y2="520" stroke="#f59e0b" stroke-width="3" opacity="0.6"/>
    </svg>
  `;

  try {
    // Load the compass logo
    const logoPath = path.join(__dirname, '../public/Brandassets/text-white.png');

    // Create base image from SVG
    const baseImage = await sharp(Buffer.from(svg))
      .resize(width, height)
      .png()
      .toBuffer();

    // Resize compass logo to fit nicely (300x300)
    const logo = await sharp(logoPath)
      .resize(300, 300, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer();

    // Composite logo onto the base image (centered, top portion)
    await sharp(baseImage)
      .composite([
        {
          input: logo,
          top: 60,
          left: Math.floor((width - 300) / 2)
        }
      ])
      .png()
      .toFile(path.join(__dirname, '../public/og-image.png'));

    console.log('âœ… OG image generated successfully: public/og-image.png');
    console.log('   Dimensions: 1200x630px');
    console.log('   Location: /og-image.png');

  } catch (error) {
    console.error('âŒ Error generating OG image:', error.message);
    console.error('\nMake sure you have sharp installed:');
    console.error('npm install sharp');
    process.exit(1);
  }
}

// Run the generator
generateOGImage();
