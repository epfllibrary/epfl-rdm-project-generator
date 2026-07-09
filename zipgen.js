// zipgen.js — Générateur ZIP pur JS (méthode STORE, sans dépendance)

// ── CRC-32 ─────────────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? (c >>> 1) ^ 0xEDB88320 : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(data) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ data[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// ── Writer de champs binaires ──────────────────────────────────────────────────
class BinaryWriter {
  constructor(size) {
    this.buf = new ArrayBuffer(size);
    this.view = new DataView(this.buf);
    this.pos = 0;
  }
  u16(v) { this.view.setUint16(this.pos, v, true); this.pos += 2; return this; }
  u32(v) { this.view.setUint32(this.pos, v, true); this.pos += 4; return this; }
  bytes(arr) { new Uint8Array(this.buf).set(arr, this.pos); this.pos += arr.length; return this; }
  result() { return new Uint8Array(this.buf, 0, this.pos); }
}

// ── Concaténation de Uint8Arrays ──────────────────────────────────────────────
function concatU8(...arrays) {
  const flat = arrays.flat(Infinity);
  const total = flat.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(total);
  let i = 0;
  for (const a of flat) { out.set(a, i); i += a.length; }
  return out;
}

// ── Encodeur texte ─────────────────────────────────────────────────────────────
const enc = new TextEncoder();

// ── Entrée de dossier vide ────────────────────────────────────────────────────
function makeDirEntry(path) {
  return { name: path.endsWith("/") ? path : path + "/", content: new Uint8Array(0), isDir: true };
}

// ── Entrée de fichier ─────────────────────────────────────────────────────────
function makeFileEntry(name, content) {
  const bytes = typeof content === "string" ? enc.encode(content) : content;
  return { name, content: bytes, isDir: false };
}

// ── Construction du ZIP ────────────────────────────────────────────────────────
export function buildZipBuffer(entries) {
  // entries = [{ name, content (Uint8Array), isDir }]
  const localHeaders = [];
  const centralDirs = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = enc.encode(entry.name);
    const data = entry.content;
    const crc = entry.isDir ? 0 : crc32(data);
    const sz = data.length;
    const dosDate = dosDateTimeNow();

    // Local file header (30 bytes + name)
    const lh = new BinaryWriter(30 + nameBytes.length);
    lh.u32(0x04034b50)      // signature
      .u16(20)              // version needed
      .u16(0)               // flags
      .u16(0)               // compression: STORE
      .u16(dosDate.time)    // mod time
      .u16(dosDate.date)    // mod date
      .u32(crc)             // CRC-32
      .u32(sz)              // compressed size
      .u32(sz)              // uncompressed size
      .u16(nameBytes.length)// name length
      .u16(0)               // extra length
      .bytes(nameBytes);

    const lhBytes = lh.result();

    // Central directory entry (46 bytes + name)
    const cd = new BinaryWriter(46 + nameBytes.length);
    cd.u32(0x02014b50)      // central dir signature
      .u16(20)              // version made by
      .u16(20)              // version needed
      .u16(0)               // flags
      .u16(0)               // compression: STORE
      .u16(dosDate.time)    // mod time
      .u16(dosDate.date)    // mod date
      .u32(crc)             // CRC-32
      .u32(sz)              // compressed size
      .u32(sz)              // uncompressed size
      .u16(nameBytes.length)// name length
      .u16(0)               // extra length
      .u16(0)               // comment length
      .u16(0)               // disk number start
      .u16(entry.isDir ? 16 : 0)  // internal attrs
      .u32(entry.isDir ? 0x41ED0000 : 0x81A40000) // external attrs (unix mode)
      .u32(offset)          // local header offset
      .bytes(nameBytes);

    localHeaders.push(lhBytes);
    localHeaders.push(data);
    centralDirs.push(cd.result());
    offset += lhBytes.length + sz;
  }

  const cdBytes = concatU8(centralDirs);
  const cdOffset = offset;
  const cdSize = cdBytes.length;
  const count = entries.length;

  // End of central directory record
  const eocd = new BinaryWriter(22);
  eocd.u32(0x06054b50)  // EOCD signature
      .u16(0)           // disk number
      .u16(0)           // disk with CD start
      .u16(count)       // entries on this disk
      .u16(count)       // total entries
      .u32(cdSize)      // CD size
      .u32(cdOffset)    // CD offset
      .u16(0);          // comment length

  return concatU8(localHeaders, cdBytes, eocd.result());
}

// ── Convertit Date → DOS format ───────────────────────────────────────────────
function dosDateTimeNow() {
  const d = new Date();
  const time = ((d.getHours() & 0x1F) << 11) | ((d.getMinutes() & 0x3F) << 5) | ((d.getSeconds() >> 1) & 0x1F);
  const date = (((d.getFullYear() - 1980) & 0x7F) << 9) | (((d.getMonth() + 1) & 0x0F) << 5) | (d.getDate() & 0x1F);
  return { time, date };
}

// ── API publique ───────────────────────────────────────────────────────────────
export { makeFileEntry, makeDirEntry };

export function downloadZip(entries, filename) {
  const buffer = buildZipBuffer(entries);
  const blob = new Blob([buffer], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after download starts — or rely on page unload to clean up
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
