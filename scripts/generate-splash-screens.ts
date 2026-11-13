import sharp from "sharp";
import { readFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// iOS splash screen sizes (portrait only for simplicity)
const SPLASH_SIZES = [
  { width: 1125, height: 2436, name: "iphone-x" },
  { width: 1170, height: 2532, name: "iphone-12" },
  { width: 1179, height: 2556, name: "iphone-14-pro" },
  { width: 1284, height: 2778, name: "iphone-12-pro-max" },
  { width: 1290, height: 2796, name: "iphone-14-pro-max" },
  { width: 1242, height: 2688, name: "iphone-xs-max" },
  { width: 828, height: 1792, name: "iphone-xr" },
  { width: 750, height: 1334, name: "iphone-8" },
  { width: 1536, height: 2048, name: "ipad" },
];

const THEME_COLOR = "#2dd4bf";

const generateSplashScreens = async () => {
  const publicDir = join(__dirname, "..", "public");
  const splashDir = join(publicDir, "splash");

  if (!existsSync(splashDir)) {
    mkdirSync(splashDir, { recursive: true });
  }

  for (const { width, height, name } of SPLASH_SIZES) {
    // Icône V2 centrée sur fond sombre
    const iconSize = Math.round(Math.min(width, height) * 0.32);
    const icon = await sharp(readFileSync(join(publicDir, "icons", "icon.svg")))
      .resize(iconSize, iconSize)
      .png()
      .toBuffer();

    await sharp({ create: { width, height, channels: 4, background: "#0d0d0d" } })
      .composite([{ input: icon, gravity: "center" }])
      .png()
      .toFile(join(splashDir, `${name}.png`));

    console.log(`Generated: ${name}.png (${width}x${height})`);
  }
};

generateSplashScreens().catch(console.error);
