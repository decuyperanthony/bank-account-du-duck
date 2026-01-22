import sharp from "sharp";
import { mkdirSync, existsSync } from "fs";
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
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <rect width="100%" height="100%" fill="${THEME_COLOR}"/>
        <g transform="translate(${width / 2 - 64}, ${height / 2 - 64})">
          <ellipse cx="64" cy="90" rx="52" ry="32" fill="white"/>
          <circle cx="103" cy="58" r="26" fill="white"/>
          <path d="M123 58 L143 53 L143 63 L123 58 Z" fill="#fbbf24"/>
          <circle cx="113" cy="53" r="4" fill="#0f172a"/>
        </g>
      </svg>
    `;

    await sharp(Buffer.from(svg))
      .png()
      .toFile(join(splashDir, `${name}.png`));

    console.log(`Generated: ${name}.png (${width}x${height})`);
  }
};

generateSplashScreens().catch(console.error);
