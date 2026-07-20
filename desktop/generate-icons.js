const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const ICONS_DIR = path.join(__dirname, 'src-tauri', 'icons');
fs.mkdirSync(ICONS_DIR, { recursive: true });

function crc32(buf) {
  let c = 0xffffffff;
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let v = n;
    for (let k = 0; k < 8; k++) v = v & 1 ? 0xedb88320 ^ (v >>> 1) : v >>> 1;
    table[n] = v;
  }
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeData = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeData));
  return Buffer.concat([len, typeData, crc]);
}

function createPNG(size) {
  const r = 42, g = 170, b = 238;
  const raw = [];
  for (let y = 0; y < size; y++) {
    raw.push(0);
    for (let x = 0; x < size; x++) {
      const cx = (x / size - 0.5) * 2;
      const cy = (y / size - 0.5) * 2;
      const dist = Math.sqrt(cx * cx + cy * cy);
      if (dist < 0.8) {
        raw.push(r, g, b, 255);
      } else if (dist < 0.84) {
        raw.push(Math.round(r * 0.7), Math.round(g * 0.7), Math.round(b * 0.7), 255);
      } else {
        raw.push(0, 0, 0, 0);
      }
    }
  }
  const compressed = zlib.deflateSync(Buffer.from(raw));
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0))
  ]);
}

// icon.png (512x512)
const png512 = createPNG(512);
fs.writeFileSync(path.join(ICONS_DIR, 'icon.png'), png512);
console.log('Created icon.png (512x512)');

// icon.ico (256x256 as PNG inside ICO)
const png256 = createPNG(256);
const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0);
icoHeader.writeUInt16LE(1, 2);
icoHeader.writeUInt16LE(1, 4);
const icoEntry = Buffer.alloc(16);
icoEntry[0] = 0;
icoEntry[1] = 0;
icoEntry.writeUInt16LE(1, 2);
icoEntry.writeUInt16LE(32, 4);
icoEntry.writeUInt32LE(png256.length, 8);
icoEntry.writeUInt32LE(22, 12);
fs.writeFileSync(path.join(ICONS_DIR, 'icon.ico'), Buffer.concat([icoHeader, icoEntry, png256]));
console.log('Created icon.ico (256x256)');

// icon.icns (just embed 512x512 PNG as 'ic07' type for 512x512)
// ic07 = 512x512 PNG
const icnsType = Buffer.from('ic07');
const icnsData = png512;
const icnsEntry = Buffer.concat([icnsType, Buffer.alloc(4), icnsData]);
icnsEntry.writeUInt32BE(icnsEntry.length, 4);
const icnsMagic = Buffer.from('icns');
const icnsSize = Buffer.alloc(4);
icnsSize.writeUInt32BE(8 + icnsEntry.length, 0);
fs.writeFileSync(path.join(ICONS_DIR, 'icon.icns'), Buffer.concat([icnsMagic, icnsSize, icnsEntry]));
console.log('Created icon.icns (512x512)');

console.log('All icons generated in', ICONS_DIR);
