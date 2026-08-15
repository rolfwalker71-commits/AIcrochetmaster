import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const source = path.join(root, "public/icon-vorschlaege/icon-vorschlag-garnknauel.png");

function isBackground(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return sat < 0.055 && luma > 226;
}

function floodAlpha(data, width, height) {
  const alpha = new Uint8Array(width * height).fill(255);
  const seen = new Uint8Array(width * height);
  const stack = [];

  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const i = y * width + x;
    if (seen[i]) return;
    seen[i] = 1;
    const o = i * 3;
    if (isBackground(data[o], data[o + 1], data[o + 2])) stack.push(i);
  };

  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }

  while (stack.length) {
    const i = stack.pop();
    alpha[i] = 0;
    const x = i % width;
    const y = (i - x) / width;
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }

  const softened = new Uint8Array(alpha);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      if (alpha[i] === 0) continue;
      let clear = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (alpha[(y + dy) * width + (x + dx)] === 0) clear++;
        }
      }
      if (clear >= 3) softened[i] = Math.max(0, 255 - clear * 28);
    }
  }
  return softened;
}

function bbox(alpha, width, height) {
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (alpha[y * width + x] < 16) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  return { minX, minY, maxX, maxY };
}

async function cutout() {
  const { data, info } = await sharp(source).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const alpha = floodAlpha(data, width, height);
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    rgba[i * 4] = data[i * 3];
    rgba[i * 4 + 1] = data[i * 3 + 1];
    rgba[i * 4 + 2] = data[i * 3 + 2];
    rgba[i * 4 + 3] = alpha[i];
  }

  const box = bbox(alpha, width, height);
  const pad = 12;
  const left = Math.max(0, box.minX - pad);
  const top = Math.max(0, box.minY - pad);
  const cropW = Math.min(width - left, box.maxX - box.minX + 1 + pad * 2);
  const cropH = Math.min(height - top, box.maxY - box.minY + 1 + pad * 2);

  return sharp(rgba, { raw: { width, height, channels: 4 } })
    .extract({ left, top, width: cropW, height: cropH })
    .png()
    .toBuffer();
}

async function fitTransparent(cut, size, paddingRatio) {
  const pad = Math.round(size * paddingRatio);
  const inner = size - pad * 2;
  const resized = await sharp(cut)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: resized, left: pad, top: pad }])
    .png()
    .toBuffer();
}

async function onWhite(transparent) {
  const { width, height } = await sharp(transparent).metadata();
  return sharp({
    create: { width, height, channels: 3, background: "#ffffff" },
  })
    .composite([{ input: transparent }])
    .png()
    .toBuffer();
}

const iconsDir = path.join(root, "public/icons");
await mkdir(iconsDir, { recursive: true });

const cut = await cutout();
const app512 = await fitTransparent(cut, 512, 0.04);
const pwa512 = await onWhite(await fitTransparent(cut, 512, 0.08));
const pwa192 = await onWhite(await fitTransparent(cut, 192, 0.08));
const maskable512 = await onWhite(await fitTransparent(cut, 512, 0.18));
const apple180 = await onWhite(await fitTransparent(cut, 180, 0.08));

await writeFile(path.join(root, "app/icon.png"), app512);
await writeFile(path.join(root, "app/apple-icon.png"), apple180);
await writeFile(path.join(iconsDir, "app.png"), app512);
await writeFile(path.join(iconsDir, "pwa-192.png"), pwa192);
await writeFile(path.join(iconsDir, "pwa-512.png"), pwa512);
await writeFile(path.join(iconsDir, "pwa-maskable-512.png"), maskable512);

const check = await sharp(app512).metadata();
console.log("app icon", check.width, check.height, "alpha", check.hasAlpha);
