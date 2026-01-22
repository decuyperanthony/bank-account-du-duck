import sharp from "sharp";
import { readFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ICON_SIZES = [16, 32, 180, 192, 512];

const generateIcons = async () => {
  const publicDir = join(__dirname, "..", "public");
  const iconsDir = join(publicDir, "icons");

  if (!existsSync(iconsDir)) {
    mkdirSync(iconsDir, { recursive: true });
  }

  const svgPath = join(iconsDir, "icon.svg");
  const svgBuffer = readFileSync(svgPath);

  for (const size of ICON_SIZES) {
    const outputPath = join(iconsDir, `icon-${size}x${size}.png`);

    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log(`Generated: icon-${size}x${size}.png`);
  }

  // Generate favicon.ico (16x16)
  await sharp(svgBuffer)
    .resize(32, 32)
    .toFile(join(publicDir, "favicon.ico"));
  console.log("Generated: favicon.ico");

  // Generate apple-touch-icon
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(join(publicDir, "apple-touch-icon.png"));
  console.log("Generated: apple-touch-icon.png");
};

generateIcons().catch(console.error);
