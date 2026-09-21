const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Minimal CRC32 implementation
function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    table[n] = c;
  }
  return table;
}

const crcTable = makeCrcTable();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const toCrc = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(toCrc);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function createPng(width, height, isMaskable = false) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image data: height rows, each starting with filter byte 0, then width * 4 bytes
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  const cx = width / 2;
  const cy = height / 2;
  const maxR = Math.min(width, height) / 2;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // filter: none

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Cyber navy background
      let r = 9;
      let g = 13;
      let b = 22;
      let a = 255;

      // Outer boundary rounding (if not maskable)
      if (!isMaskable && dist > maxR * 0.96) {
        a = Math.max(0, Math.min(255, Math.floor((1 - (dist - maxR * 0.96) / (maxR * 0.04)) * 255)));
      }

      // Draw glowing shield emblem in center
      const shieldScale = maxR * 0.65;
      const nx = dx / shieldScale;
      const ny = dy / shieldScale;

      // Shield geometry approximation
      const inShield = ny >= -0.8 && ny <= 1.0 && Math.abs(nx) <= (ny <= 0 ? 0.85 : 0.85 * (1 - (ny * 0.7)));

      if (inShield) {
        // Shield gradient (emerald to cyan to deep tech blue)
        const t = (ny + 0.8) / 1.8;
        r = Math.floor(0 * (1 - t) + 10 * t);
        g = Math.floor(229 * (1 - t) + 140 * t);
        b = Math.floor(153 * (1 - t) + 220 * t);

        // Inner shield dark inset
        const inInnerShield = ny >= -0.65 && ny <= 0.8 && Math.abs(nx) <= (ny <= 0 ? 0.7 : 0.7 * (1 - (ny * 0.7)));
        if (inInnerShield) {
          r = 13;
          g = 24;
          b = 41;

          // Lock body in center
          if (nx >= -0.3 && nx <= 0.3 && ny >= -0.05 && ny <= 0.4) {
            // Emerald lock
            r = 0;
            g = 229;
            b = 153;
          }
          // Keyhole
          if (Math.abs(nx) <= 0.08 && ny >= 0.1 && ny <= 0.25) {
            r = 9;
            g = 13;
            b = 22;
          }
          // Shackle loop
          const inShackleArc = (nx * nx + (ny + 0.18) * (ny + 0.18)) <= 0.055 && (nx * nx + (ny + 0.18) * (ny + 0.18)) >= 0.015 && ny <= -0.05;
          if (inShackleArc) {
            r = 0;
            g = 229;
            b = 153;
          }
        }
      }

      // Tech circuit ring accent
      if (Math.abs(dist - maxR * 0.82) < 2) {
        r = 30;
        g = 50;
        b = 80;
      }

      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 192x192
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, false));
// 512x512
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, false));
// 512x512 maskable (safe padding, full bleed)
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, true));
// apple-touch-icon 180x180
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, false));
// favicon.ico (can be a small png)
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPng(64, 64, false));

console.log('Successfully generated all PWA icons in /public:');
console.log('- pwa-192x192.png');
console.log('- pwa-512x512.png');
console.log('- pwa-maskable-512x512.png');
console.log('- apple-touch-icon.png');
console.log('- favicon.ico');
