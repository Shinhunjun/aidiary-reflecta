const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const screenshotsDir = path.join(__dirname, 'public', 'screenshots');
const images = [
  'mandalart-grid.png',
  'personas-selector.png',
  'chat-interface.png',
  'diary-converted.png',
  'ai-insights.png'
];

async function convertToWebP() {
  console.log('🖼️  Starting PNG → WebP conversion...\n');

  for (const imageName of images) {
    const inputPath = path.join(screenshotsDir, imageName);
    const outputPath = path.join(screenshotsDir, imageName.replace('.png', '.webp'));

    try {
      // Get original file size
      const originalStats = fs.statSync(inputPath);
      const originalSize = (originalStats.size / 1024).toFixed(2);

      // Convert to WebP with high quality
      await sharp(inputPath)
        .webp({ quality: 90, lossless: false })
        .toFile(outputPath);

      // Get new file size
      const newStats = fs.statSync(outputPath);
      const newSize = (newStats.size / 1024).toFixed(2);
      const savings = ((1 - newStats.size / originalStats.size) * 100).toFixed(1);

      console.log(`✅ ${imageName}`);
      console.log(`   Original: ${originalSize} KB`);
      console.log(`   WebP: ${newSize} KB`);
      console.log(`   Savings: ${savings}% smaller\n`);

    } catch (error) {
      console.error(`❌ Error converting ${imageName}:`, error.message);
    }
  }

  console.log('🎉 Conversion complete!');
}

convertToWebP();
