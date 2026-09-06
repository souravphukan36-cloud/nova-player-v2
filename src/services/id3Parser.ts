// Enhanced audio metadata and album cover art parser for MP3, FLAC, M4A, AAC, WAV, etc.
export interface ExtractedMetadata {
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
  year?: number;
  coverArtUrl?: string; // base64 data URI
}

export async function extractId3Metadata(file: File): Promise<ExtractedMetadata> {
  const result: ExtractedMetadata = {};

  try {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    // Check first 16 bytes to detect format
    const headerBuffer = await file.slice(0, 16).arrayBuffer();
    const headerView = new DataView(headerBuffer);

    // 1. MP3 / ID3v2
    if (
      headerBuffer.byteLength >= 10 &&
      headerView.getUint8(0) === 0x49 && // 'I'
      headerView.getUint8(1) === 0x44 && // 'D'
      headerView.getUint8(2) === 0x33    // '3'
    ) {
      const majorVersion = headerView.getUint8(3); // 2, 3, or 4
      const tagSize =
        ((headerView.getUint8(6) & 0x7f) << 21) |
        ((headerView.getUint8(7) & 0x7f) << 14) |
        ((headerView.getUint8(8) & 0x7f) << 7) |
        (headerView.getUint8(9) & 0x7f);

      const bufferSize = Math.min(file.size, Math.max(tagSize + 10, 64 * 1024));
      const fullBuffer = await file.slice(0, Math.min(bufferSize, 8 * 1024 * 1024)).arrayBuffer();
      const view = new DataView(fullBuffer);

      if (majorVersion === 2) {
        parseId3v22(view, fullBuffer.byteLength, result);
      } else {
        parseId3v23or4(view, fullBuffer.byteLength, majorVersion, result);
      }
    } 
    // 2. FLAC detection ("fLaC" = 0x66 0x4C 0x61 0x43)
    else if (
      headerBuffer.byteLength >= 4 &&
      headerView.getUint8(0) === 0x66 &&
      headerView.getUint8(1) === 0x4c &&
      headerView.getUint8(2) === 0x61 &&
      headerView.getUint8(3) === 0x43
    ) {
      await parseFlacMetadata(file, result);
    }
    // 3. M4A / MP4 / AAC container
    else if (ext === 'm4a' || ext === 'aac' || ext === 'mp4') {
      await parseM4aMetadata(file, result);
    }

    // 4. If title or artist still missing, check ID3v1 at the end of the file (last 128 bytes)
    if ((!result.title || !result.artist) && file.size > 128) {
      try {
        const v1Buffer = await file.slice(file.size - 128).arrayBuffer();
        const v1View = new DataView(v1Buffer);
        // ID3v1 starts with "TAG" (0x54, 0x41, 0x47)
        if (v1View.getUint8(0) === 0x54 && v1View.getUint8(1) === 0x41 && v1View.getUint8(2) === 0x47) {
          const v1Title = decodeIsoString(v1Buffer, 3, 30).trim();
          const v1Artist = decodeIsoString(v1Buffer, 33, 30).trim();
          const v1Album = decodeIsoString(v1Buffer, 63, 30).trim();
          const v1Year = decodeIsoString(v1Buffer, 93, 4).trim();

          if (!result.title && v1Title) result.title = v1Title;
          if (!result.artist && v1Artist) result.artist = v1Artist;
          if (!result.album && v1Album) result.album = v1Album;
          if (!result.year && v1Year && !isNaN(parseInt(v1Year, 10))) {
            result.year = parseInt(v1Year, 10);
          }
        }
      } catch {
        // ignore v1 error
      }
    }
  } catch (err) {
    console.warn('ID3 parser encountered an issue:', err);
  }

  // 5. Smart filename regex parsing fallback if title or artist is empty
  const cleanInfo = parseArtistTitleFromFilename(file.name);
  if (!result.title || result.title.trim() === '') {
    result.title = cleanInfo.title;
  }
  if (!result.artist || result.artist.trim() === '' || result.artist === 'Unknown Artist') {
    result.artist = cleanInfo.artist;
  }
  if (!result.album || result.album.trim() === '') {
    result.album = 'Local Tracks';
  }

  return result;
}

// Parse ID3v2.3 or ID3v2.4
function parseId3v23or4(view: DataView, maxBytes: number, majorVersion: number, result: ExtractedMetadata) {
  let offset = 10;

  while (offset + 10 < maxBytes) {
    // 4-byte frame ID
    const frameId = String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3)
    );

    // End of tag marker (zeros)
    if (frameId.charCodeAt(0) === 0) break;

    let frameSize = 0;
    if (majorVersion === 4) {
      frameSize =
        ((view.getUint8(offset + 4) & 0x7f) << 21) |
        ((view.getUint8(offset + 5) & 0x7f) << 14) |
        ((view.getUint8(offset + 6) & 0x7f) << 7) |
        (view.getUint8(offset + 7) & 0x7f);
    } else {
      frameSize = view.getUint32(offset + 4);
    }

    if (frameSize <= 0 || offset + 10 + frameSize > maxBytes) {
      break;
    }

    const frameBodyOffset = offset + 10;

    // TIT2 = Title
    if (frameId === 'TIT2' && !result.title) {
      result.title = decodeTextFrame(view, frameBodyOffset, frameSize);
    }
    // TPE1 = Singer / Artist
    else if (frameId === 'TPE1' && !result.artist) {
      result.artist = decodeTextFrame(view, frameBodyOffset, frameSize);
    }
    // TALB = Album
    else if (frameId === 'TALB' && !result.album) {
      result.album = decodeTextFrame(view, frameBodyOffset, frameSize);
    }
    // TCON = Genre
    else if (frameId === 'TCON' && !result.genre) {
      result.genre = decodeTextFrame(view, frameBodyOffset, frameSize);
    }
    // TYER / TDRC = Year
    else if ((frameId === 'TYER' || frameId === 'TDRC') && !result.year) {
      const yearStr = decodeTextFrame(view, frameBodyOffset, frameSize);
      const parsedYear = parseInt(yearStr.substring(0, 4), 10);
      if (!isNaN(parsedYear)) result.year = parsedYear;
    }
    // APIC = Picture (Album Cover)
    else if (frameId === 'APIC' && !result.coverArtUrl) {
      const coverUrl = parseApicFrame(view, frameBodyOffset, frameSize);
      if (coverUrl) {
        result.coverArtUrl = coverUrl;
      }
    }

    offset += 10 + frameSize;
  }
}

// Parse ID3v2.2
function parseId3v22(view: DataView, maxBytes: number, result: ExtractedMetadata) {
  let offset = 10;

  while (offset + 6 < maxBytes) {
    const frameId = String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2)
    );

    if (frameId.charCodeAt(0) === 0) break;

    const frameSize =
      (view.getUint8(offset + 3) << 16) |
      (view.getUint8(offset + 4) << 8) |
      view.getUint8(offset + 5);

    if (frameSize <= 0 || offset + 6 + frameSize > maxBytes) {
      break;
    }

    const frameBodyOffset = offset + 6;

    if (frameId === 'TT2' && !result.title) {
      result.title = decodeTextFrame(view, frameBodyOffset, frameSize);
    } else if (frameId === 'TP1' && !result.artist) {
      result.artist = decodeTextFrame(view, frameBodyOffset, frameSize);
    } else if (frameId === 'TAL' && !result.album) {
      result.album = decodeTextFrame(view, frameBodyOffset, frameSize);
    } else if (frameId === 'PIC' && !result.coverArtUrl) {
      const coverUrl = parsePicFrameV22(view, frameBodyOffset, frameSize);
      if (coverUrl) {
        result.coverArtUrl = coverUrl;
      }
    }

    offset += 6 + frameSize;
  }
}

// Parse APIC frame (ID3v2.3/v2.4)
function parseApicFrame(view: DataView, offset: number, length: number): string | null {
  try {
    const max = offset + length;
    const encoding = view.getUint8(offset);
    let cursor = offset + 1;

    // MIME Type (null-terminated string)
    let mimeType = '';
    while (cursor < max && view.getUint8(cursor) !== 0) {
      mimeType += String.fromCharCode(view.getUint8(cursor));
      cursor++;
    }
    cursor++; // skip null terminator

    if (!mimeType || mimeType === 'image/') {
      mimeType = 'image/jpeg';
    }

    // Skip Picture Type (1 byte)
    cursor++;

    // Skip Description string based on encoding
    if (encoding === 1 || encoding === 2) {
      while (cursor + 1 < max) {
        if (view.getUint8(cursor) === 0 && view.getUint8(cursor + 1) === 0) {
          cursor += 2;
          break;
        }
        cursor += 2;
      }
    } else {
      while (cursor < max && view.getUint8(cursor) !== 0) {
        cursor++;
      }
      cursor++;
    }

    if (cursor >= max) return null;

    const imgBytes = new Uint8Array(view.buffer.slice(cursor, max));
    if (imgBytes.length < 16) return null;

    // Verify format magic
    if (imgBytes[0] === 0xff && imgBytes[1] === 0xd8) {
      mimeType = 'image/jpeg';
    } else if (
      imgBytes[0] === 0x89 &&
      imgBytes[1] === 0x50 &&
      imgBytes[2] === 0x4e &&
      imgBytes[3] === 0x47
    ) {
      mimeType = 'image/png';
    } else if (
      imgBytes[0] === 0x52 &&
      imgBytes[1] === 0x49 &&
      imgBytes[2] === 0x46 &&
      imgBytes[3] === 0x46
    ) {
      mimeType = 'image/webp';
    }

    return uint8ArrayToDataUrl(imgBytes, mimeType);
  } catch (err) {
    console.warn('APIC image extraction error:', err);
    return null;
  }
}

// Extract PIC frame (ID3v2.2)
function parsePicFrameV22(view: DataView, offset: number, length: number): string | null {
  try {
    const max = offset + length;
    const encoding = view.getUint8(offset);
    let cursor = offset + 1;

    const format = String.fromCharCode(
      view.getUint8(cursor),
      view.getUint8(cursor + 1),
      view.getUint8(cursor + 2)
    ).toLowerCase();
    cursor += 3;

    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    cursor++; // picture type

    if (encoding === 1) {
      while (cursor + 1 < max) {
        if (view.getUint8(cursor) === 0 && view.getUint8(cursor + 1) === 0) {
          cursor += 2;
          break;
        }
        cursor += 2;
      }
    } else {
      while (cursor < max && view.getUint8(cursor) !== 0) {
        cursor++;
      }
      cursor++;
    }

    if (cursor >= max) return null;

    const imgBytes = new Uint8Array(view.buffer.slice(cursor, max));
    return uint8ArrayToDataUrl(imgBytes, mimeType);
  } catch {
    return null;
  }
}

// Parse FLAC metadata blocks (picture & Vorbis comments)
async function parseFlacMetadata(file: File, result: ExtractedMetadata): Promise<void> {
  try {
    const sliceBuffer = await file.slice(4, Math.min(file.size, 4 * 1024 * 1024)).arrayBuffer();
    const view = new DataView(sliceBuffer);
    let offset = 0;
    const len = sliceBuffer.byteLength;

    while (offset + 4 < len) {
      const header = view.getUint8(offset);
      const isLast = (header & 0x80) !== 0;
      const blockType = header & 0x7f;
      const blockSize =
        (view.getUint8(offset + 1) << 16) |
        (view.getUint8(offset + 2) << 8) |
        view.getUint8(offset + 3);

      offset += 4;
      if (offset + blockSize > len) break;

      // blockType 4 = VORBIS_COMMENT
      if (blockType === 4 && (!result.title || !result.artist)) {
        try {
          const vendorLength = view.getUint32(offset, true);
          let cOffset = offset + 4 + vendorLength;
          const numComments = view.getUint32(cOffset, true);
          cOffset += 4;

          for (let i = 0; i < numComments && cOffset + 4 < offset + blockSize; i++) {
            const commentLen = view.getUint32(cOffset, true);
            cOffset += 4;
            if (cOffset + commentLen > offset + blockSize) break;

            const commentBytes = new Uint8Array(sliceBuffer, cOffset, commentLen);
            const comment = new TextDecoder('utf-8').decode(commentBytes);
            cOffset += commentLen;

            const eqIndex = comment.indexOf('=');
            if (eqIndex > 0) {
              const tag = comment.substring(0, eqIndex).toUpperCase();
              const val = comment.substring(eqIndex + 1).trim();
              if (tag === 'TITLE' && !result.title) result.title = val;
              if (tag === 'ARTIST' && !result.artist) result.artist = val;
              if (tag === 'ALBUM' && !result.album) result.album = val;
              if (tag === 'GENRE' && !result.genre) result.genre = val;
            }
          }
        } catch {
          // ignore
        }
      }

      // blockType 6 = PICTURE
      if (blockType === 6 && !result.coverArtUrl) {
        try {
          let pOffset = offset;
          pOffset += 4; // picture type
          const mimeLen = view.getUint32(pOffset);
          pOffset += 4;
          const mimeBytes = new Uint8Array(sliceBuffer, pOffset, mimeLen);
          const mimeType = new TextDecoder('ascii').decode(mimeBytes) || 'image/jpeg';
          pOffset += mimeLen;

          const descLen = view.getUint32(pOffset);
          pOffset += 4 + descLen; // skip description
          pOffset += 16; // width, height, color depth, colors used

          const picDataLen = view.getUint32(pOffset);
          pOffset += 4;

          if (pOffset + picDataLen <= offset + blockSize) {
            const picBytes = new Uint8Array(sliceBuffer, pOffset, picDataLen);
            result.coverArtUrl = uint8ArrayToDataUrl(picBytes, mimeType);
          }
        } catch {
          // ignore
        }
      }

      offset += blockSize;
      if (isLast) break;
    }
  } catch (err) {
    console.warn('FLAC metadata parsing error:', err);
  }
}

// Parse basic M4A metadata
async function parseM4aMetadata(file: File, result: ExtractedMetadata): Promise<void> {
  try {
    const sliceBuffer = await file.slice(0, Math.min(file.size, 2 * 1024 * 1024)).arrayBuffer();
    const bytes = new Uint8Array(sliceBuffer);
    const text = new TextDecoder('iso-8859-1').decode(bytes);

    // Look for covr (cover art atom)
    const covrIdx = text.indexOf('covr');
    if (covrIdx !== -1 && !result.coverArtUrl) {
      // Find JPEG or PNG header within 64 bytes of covr
      for (let i = covrIdx; i < Math.min(covrIdx + 64, bytes.length - 4); i++) {
        if (bytes[i] === 0xff && bytes[i + 1] === 0xd8) {
          const imgSlice = bytes.subarray(i);
          result.coverArtUrl = uint8ArrayToDataUrl(imgSlice, 'image/jpeg');
          break;
        } else if (bytes[i] === 0x89 && bytes[i + 1] === 0x50 && bytes[i + 2] === 0x4e) {
          const imgSlice = bytes.subarray(i);
          result.coverArtUrl = uint8ArrayToDataUrl(imgSlice, 'image/png');
          break;
        }
      }
    }
  } catch {
    // ignore
  }
}

// Convert byte array to base64 Data URL (safe for IndexedDB and <img> tags)
function uint8ArrayToDataUrl(bytes: Uint8Array, mimeType: string): string {
  let binary = '';
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const sub = bytes.subarray(i, Math.min(i + chunkSize, len));
    for (let j = 0; j < sub.length; j++) {
      binary += String.fromCharCode(sub[j]);
    }
  }
  const base64 = btoa(binary);
  return `data:${mimeType};base64,${base64}`;
}

// Decode text frames
function decodeTextFrame(view: DataView, offset: number, length: number): string {
  if (length <= 1) return '';
  const encoding = view.getUint8(offset);
  const bytes = new Uint8Array(view.buffer, offset + 1, length - 1);

  try {
    if (encoding === 0) {
      return new TextDecoder('iso-8859-1').decode(bytes).replace(/\0/g, '').trim();
    } else if (encoding === 1) {
      return new TextDecoder('utf-16').decode(bytes).replace(/\0/g, '').trim();
    } else if (encoding === 2) {
      return new TextDecoder('utf-16be').decode(bytes).replace(/\0/g, '').trim();
    } else if (encoding === 3) {
      return new TextDecoder('utf-8').decode(bytes).replace(/\0/g, '').trim();
    }
  } catch {
    // fallback
  }

  return String.fromCharCode(...bytes).replace(/\0/g, '').trim();
}

function decodeIsoString(buffer: ArrayBuffer, offset: number, length: number): string {
  const bytes = new Uint8Array(buffer, offset, length);
  return new TextDecoder('iso-8859-1').decode(bytes).replace(/\0/g, '');
}

// Smart filename cleaner & artist/title extractor
export function parseArtistTitleFromFilename(filename: string): { title: string; artist: string } {
  // Strip extension
  let clean = filename.replace(/\.[^/.]+$/, '').trim();

  // Remove common website watermarks and bitrates in brackets or parenthesis
  clean = clean
    .replace(/\[\s*(pagalworld|mp3clan|songs\.pk|djpunjab|naasongs|320\s*kbps|128\s*kbps|flac|lossless|cd-rip).*?\]/gi, '')
    .replace(/\(\s*(pagalworld|mp3clan|songs\.pk|djpunjab|naasongs|320\s*kbps|128\s*kbps|official\s*(video|audio|music\s*video)|lyric\s*video|audio|remastered).*?\)/gi, '')
    .replace(/^(\d+[\s._-]+)/, '') // Strip leading track number like "01 - " or "01. "
    .trim();

  let artist = 'Unknown Artist';
  let title = clean;

  // Pattern 1: "Artist - Title" or "Title - Artist"
  if (clean.includes(' - ')) {
    const parts = clean.split(' - ');
    if (parts.length >= 2) {
      artist = parts[0].trim();
      title = parts.slice(1).join(' - ').trim();
    }
  } 
  // Pattern 2: "Artist_-_Title"
  else if (clean.includes('_-_')) {
    const parts = clean.split('_-_');
    if (parts.length >= 2) {
      artist = parts[0].trim().replace(/_/g, ' ');
      title = parts.slice(1).join(' - ').trim().replace(/_/g, ' ');
    }
  }
  // Pattern 3: "Title (feat. Artist)" or "Title (ft. Artist)"
  else if (/\((feat\.|ft\.|with)\s*([^)]+)\)/i.test(clean)) {
    const match = clean.match(/^(.*?)\s*\((?:feat\.|ft\.|with)\s*([^)]+)\)/i);
    if (match) {
      title = match[1].trim();
      artist = match[2].trim();
    }
  }
  // Pattern 4: "Title by Artist"
  else if (/\s+by\s+/i.test(clean)) {
    const parts = clean.split(/\s+by\s+/i);
    if (parts.length === 2) {
      title = parts[0].trim();
      artist = parts[1].trim();
    }
  }
  // Pattern 5: "Title (Singer Name)"
  else if (/^([^(]+)\s*\(([^)]+)\)$/.test(clean)) {
    const match = clean.match(/^([^(]+)\s*\(([^)]+)\)$/);
    if (match) {
      title = match[1].trim();
      artist = match[2].trim();
    }
  }

  // Clean remaining underscores and multiple spaces
  title = title.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  artist = artist.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();

  if (!title) title = filename.replace(/\.[^/.]+$/, '');
  if (!artist || artist.toLowerCase() === 'audio') artist = 'Unknown Artist';

  return { title, artist };
}
