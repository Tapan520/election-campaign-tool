/**
 * generate-icons.js
 * Generates PWA icon PNGs for the Election Campaign Tool
 * Run: node generate-icons.js
 */
const fs   = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, 'wwwroot', 'icons');
fs.mkdirSync(ICONS_DIR, { recursive: true });

/**
 * Builds a minimal valid PNG binary from scratch.
 * Draws a solid background + simple bar-chart bars matching the app brand.
 */
function generatePng(size) {
  const BRAND_BG  = [0x1a, 0x1f, 0x2e];   // #1a1f2e  (dark navy)
  const BRAND_BLU = [0x3b, 0x5b, 0xdb];   // #3b5bdb  (blue)
  const BRAND_YLW = [0xf5, 0x9f, 0x00];   // #f59f00  (yellow)
  const WHITE     = [0xff, 0xff, 0xff];

  // ?? pixel canvas ??????????????????????????????????????????
  const pixels = new Uint8Array(size * size * 4);

  function setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const i = (y * size + x) * 4;
    pixels[i] = r; pixels[i+1] = g; pixels[i+2] = b; pixels[i+3] = a;
  }

  function fillRect(x, y, w, h, [r, g, b], a = 255) {
    for (let row = y; row < y + h; row++)
      for (let col = x; col < x + w; col++)
        setPixel(col, row, r, g, b, a);
  }

  function fillCircle(cx, cy, radius, [r, g, b], a = 255) {
    for (let row = cy - radius; row <= cy + radius; row++)
      for (let col = cx - radius; col <= cx + radius; col++)
        if ((col - cx) ** 2 + (row - cy) ** 2 <= radius ** 2)
          setPixel(col, row, r, g, b, a);
  }

  // 1. Background — rounded square (BRAND_BLU)
  const r = Math.round(size * 0.18);   // corner radius
  fillRect(0, 0, size, size, BRAND_BG);

  // Simulate rounded-rect background
  fillRect(r, 0, size - 2*r, size, BRAND_BLU);
  fillRect(0, r, size, size - 2*r, BRAND_BLU);
  fillCircle(r,        r,        r, BRAND_BLU);
  fillCircle(size-1-r, r,        r, BRAND_BLU);
  fillCircle(r,        size-1-r, r, BRAND_BLU);
  fillCircle(size-1-r, size-1-r, r, BRAND_BLU);

  // 2. Bar chart icon — 5 bars
  const pad    = Math.round(size * 0.18);
  const bottom = Math.round(size * 0.78);
  const bW     = Math.round(size * 0.10);
  const gap    = Math.round(size * 0.035);
  const totalW = 5 * bW + 4 * gap;
  const startX = Math.round((size - totalW) / 2);
  const maxH   = Math.round(size * 0.50);

  const heights   = [0.50, 0.70, 1.00, 0.65, 0.80];
  const barColors = [WHITE, WHITE, BRAND_YLW, WHITE, WHITE];

  heights.forEach((hRatio, i) => {
    const bH = Math.round(maxH * hRatio);
    const bX = startX + i * (bW + gap);
    const bY = bottom - bH;
    fillRect(bX, bY, bW, bH, barColors[i]);
  });

  // 3. Baseline
  const baseH = Math.max(2, Math.round(size * 0.018));
  fillRect(pad, bottom + 1, size - 2*pad, baseH, WHITE, 180);

  // ?? encode to PNG ?????????????????????????????????????????
  return encodePng(pixels, size, size);
}

// ?? Minimal PNG encoder (no external deps) ????????????????????
function encodePng(rgba, width, height) {
  function crc32(buf) {
    let crc = 0xFFFFFFFF;
    for (const b of buf) {
      crc ^= b;
      for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function chunk(type, data) {
    const len  = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const tBuf = Buffer.from(type);
    const crc  = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([tBuf, data])));
    return Buffer.concat([len, tBuf, data, crc]);
  }

  function adler32(buf) {
    let a = 1, b = 0;
    for (const byte of buf) { a = (a + byte) % 65521; b = (b + a) % 65521; }
    return (b << 16) | a;
  }

  function deflateStore(data) {
    const chunks = [];
    const BLK = 65535;
    for (let i = 0; i < data.length; i += BLK) {
      const slice = data.slice(i, i + BLK);
      const last  = (i + BLK >= data.length) ? 1 : 0;
      const hdr   = Buffer.alloc(5);
      hdr[0] = last; hdr.writeUInt16LE(slice.length, 1); hdr.writeUInt16LE(~slice.length & 0xFFFF, 3);
      chunks.push(hdr, Buffer.from(slice));
    }
    // zlib header (deflate, no dict) + adler checksum
    const header = Buffer.from([0x78, 0x01]);
    const adlerBuf = Buffer.alloc(4);
    adlerBuf.writeUInt32BE(adler32(data));
    return Buffer.concat([header, ...chunks, adlerBuf]);
  }

  // Build raw scanlines with filter byte 0 (None) per row
  const rows = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 4);
    row[0] = 0; // filter None
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4;
      row.writeUInt8(rgba[src],   1 + x*4);
      row.writeUInt8(rgba[src+1], 2 + x*4);
      row.writeUInt8(rgba[src+2], 3 + x*4);
      row.writeUInt8(rgba[src+3], 4 + x*4);
    }
    rows.push(row);
  }
  const raw = Buffer.concat(rows);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width,  0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8]  = 8;  // bit depth
  ihdr[9]  = 6;  // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const sig = Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateStore(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ?? Generate icons ????????????????????????????????????????????
const sizes = [192, 512];
sizes.forEach(sz => {
  const outPath = path.join(ICONS_DIR, `icon-${sz}.png`);
  const buf     = generatePng(sz);
  fs.writeFileSync(outPath, buf);
  const kb = (buf.length / 1024).toFixed(1);
  console.log(`  ? icon-${sz}.png  (${kb} KB)`);
});

// ?? Also copy as favicon ???????????????????????????????????????
const faviconPath = path.join(__dirname, 'wwwroot', 'favicon.png');
const smallBuf    = generatePng(32);
fs.writeFileSync(faviconPath, smallBuf);
console.log(`  ? favicon.png    (32x32)`);

console.log('\n? PWA icons generated in wwwroot/icons/\n');
