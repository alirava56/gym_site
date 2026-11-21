import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const originalsDir = path.join(root, "public", "assets", "icons", "originals");
const optimizedDir = path.join(root, "public", "assets", "icons", "optimized");

const approvedIconSources = {
  "brand-logo": "ChatGPT Image Sep 13, 2026, 11_04_47 AM (1).png.jpeg",
  account: "ChatGPT Image Sep 13, 2026, 11_04_47 AM (2).png.jpeg",
  "professional-coach": "ChatGPT Image Sep 13, 2026, 11_04_47 AM (3).png.jpeg",
  "support-motivation": "ChatGPT Image Sep 13, 2026, 11_04_48 AM (4).png.jpeg",
  "advanced-equipment": "ChatGPT Image Sep 13, 2026, 11_04_48 AM (5).png.jpeg",
  "weight-plate": "ChatGPT Image Sep 13, 2026, 11_04_48 AM (6).png.jpeg",
  "personalized-program": "ChatGPT Image Sep 13, 2026, 11_04_49 AM (7).png.jpeg",
  "muscle-gain": "ChatGPT Image Sep 13, 2026, 11_04_49 AM (8).png.jpeg",
  "fat-loss": "ChatGPT Image Sep 13, 2026, 11_04_49 AM (9).png.jpeg",
  "functional-fitness": "ChatGPT Image Sep 13, 2026, 11_04_50 AM (10).png.jpeg",
  schedule: "ChatGPT Image Sep 13, 2026, 11_04_50 AM (11).png.jpeg",
  timing: "ChatGPT Image Sep 13, 2026, 11_04_50 AM (12).png.jpeg",
  testimonial: "ChatGPT Image Sep 13, 2026, 11_04_51 AM (14).png.jpeg",
  "faq-help": "ChatGPT Image Sep 13, 2026, 11_04_51 AM (15).png.jpeg",
  location: "ChatGPT Image Sep 13, 2026, 11_04_52 AM (16).png.jpeg",
  phone: "ChatGPT Image Sep 13, 2026, 11_04_52 AM (17).png.jpeg",
  email: "ChatGPT Image Sep 13, 2026, 11_04_52 AM (18).png.jpeg",
  instagram: "ChatGPT Image Sep 13, 2026, 11_04_53 AM (19).png.jpeg",
  telegram: "ChatGPT Image Sep 13, 2026, 11_04_53 AM (20).png.jpeg",
  whatsapp: "ChatGPT Image Sep 13, 2026, 11_04_53 AM (21).png.jpeg",
  "plan-base": "ChatGPT Image Sep 13, 2026, 11_05_00 AM (1).png.jpeg",
  "plan-professional": "ChatGPT Image Sep 13, 2026, 11_05_00 AM (2).png.jpeg",
  "plan-vip": "ChatGPT Image Sep 13, 2026, 11_05_00 AM (3).png.jpeg",
};

await fs.mkdir(optimizedDir, { recursive: true });

for (const [semanticName, sourceName] of Object.entries(approvedIconSources)) {
  const sourcePath = path.join(originalsDir, sourceName);
  const { data, info } = await sharp(sourcePath)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rgba = Buffer.alloc(info.width * info.height * 4);

  for (let source = 0, target = 0; source < data.length; source += 3, target += 4) {
    const red = data[source];
    const green = data[source + 1];
    const blue = data[source + 2];
    const difference = Math.max(255 - red, 255 - green, 255 - blue);
    const alpha = difference <= 6 ? 0 : Math.min(255, Math.round(((difference - 6) * 255) / 249));

    rgba[target + 3] = alpha;
    if (alpha === 0) continue;

    rgba[target] = Math.max(0, Math.min(255, Math.round(255 - ((255 - red) * 255) / alpha)));
    rgba[target + 1] = Math.max(0, Math.min(255, Math.round(255 - ((255 - green) * 255) / alpha)));
    rgba[target + 2] = Math.max(0, Math.min(255, Math.round(255 - ((255 - blue) * 255) / alpha)));
  }

  await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize({ width: 384, height: 384, fit: "inside", withoutEnlargement: true })
    .webp({ lossless: true, effort: 6 })
    .toFile(path.join(optimizedDir, `${semanticName}.webp`));
}

console.log(`Processed ${Object.keys(approvedIconSources).length} approved icons.`);
