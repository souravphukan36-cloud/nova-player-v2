import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const COVERS_DIR = path.join(process.cwd(), 'public', 'covers');

async function enhanceCovers() {
  const files = fs.readdirSync(COVERS_DIR).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
  console.log(`Found ${files.length} cover files in ${COVERS_DIR}...`);

  for (const file of files) {
    const fullPath = path.join(COVERS_DIR, file);
    try {
      const meta = await sharp(fullPath).metadata();
      const needsUpscale = (meta.width || 0) < 800 || (meta.height || 0) < 800;

      if (needsUpscale) {
        console.log(`Enhancing & upscaling ${file} (original ${meta.width}x${meta.height}) to 800x800 HD...`);
        const buffer = await sharp(fullPath)
          .resize(800, 800, {
            kernel: sharp.kernel.lanczos3,
            fit: 'cover',
            position: 'center'
          })
          .sharpen({
            sigma: 1.2,
            m1: 0.8,
            m2: 0.3
          })
          .jpeg({ quality: 96, chromaSubsampling: '4:4:4' })
          .toBuffer();

        fs.writeFileSync(fullPath, buffer);
      } else {
        // Just optimize quality
        const buffer = await sharp(fullPath)
          .sharpen({ sigma: 0.8 })
          .jpeg({ quality: 96 })
          .toBuffer();
        fs.writeFileSync(fullPath, buffer);
      }
    } catch (err) {
      console.warn(`Error enhancing ${file}:`, err.message);
    }
  }

  console.log('Finished enhancing all cover images to studio quality!');
}

enhanceCovers();
