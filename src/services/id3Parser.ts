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

    // TIT2 / TIT1 = Title
    if ((frameId === 'TIT2' || frameId === 'TIT1') && !result.title) {
      result.title = decodeTextFrame(view, frameBodyOffset, frameSize);
    }
    // TPE1 / TPE2 = Singer / Artist
    else if ((frameId === 'TPE1' || frameId === 'TPE2') && !result.artist) {
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

// Parse APIC frame (ID3v2.3/v2.4) with robust image header search
function parseApicFrame(view: DataView, offset: number, length: number): string | null {
  try {
    const max = offset + length;
    const encoding = view.getUint8(offset);
    let mimeType = 'image/jpeg';

    // Fast & foolproof: Directly search for JPEG/PNG/WebP image start signature within the frame
    let imgStart = -1;
    for (let i = offset + 1; i < max - 4; i++) {
      // JPEG SOI: 0xFF, 0xD8, 0xFF
      if (view.getUint8(i) === 0xff && view.getUint8(i + 1) === 0xd8 && view.getUint8(i + 2) === 0xff) {
        imgStart = i;
        mimeType = 'image/jpeg';
        break;
      }
      // PNG: 0x89, 0x50, 0x4E, 0x47
      if (view.getUint8(i) === 0x89 && view.getUint8(i + 1) === 0x50 && view.getUint8(i + 2) === 0x4e && view.getUint8(i + 3) === 0x47) {
        imgStart = i;
        mimeType = 'image/png';
        break;
      }
      // WebP: 0x52, 0x49, 0x46, 0x46 (RIFF)
      if (view.getUint8(i) === 0x52 && view.getUint8(i + 1) === 0x49 && view.getUint8(i + 2) === 0x46 && view.getUint8(i + 3) === 0x46) {
        imgStart = i;
        mimeType = 'image/webp';
        break;
      }
    }

    if (imgStart === -1) {
      // Fallback: standard description skipping
      let cursor = offset + 1;
      while (cursor < max && view.getUint8(cursor) !== 0) cursor++;
      cursor++; // skip null
      cursor++; // skip picture type
      if (encoding === 1 || encoding === 2) {
        while (cursor + 1 < max) {
          if (view.getUint8(cursor) === 0 && view.getUint8(cursor + 1) === 0) {
            cursor += 2;
            break;
          }
          cursor += 2;
        }
      } else {
        while (cursor < max && view.getUint8(cursor) !== 0) cursor++;
        cursor++;
      }
      imgStart = cursor;
    }

    if (imgStart < 0 || imgStart >= max) return null;

    let imgEnd = max;
    // If JPEG, find EOI marker (0xFF, 0xD9) to ensure clean boundary
    if (mimeType === 'image/jpeg') {
      for (let j = max - 2; j >= imgStart + 16; j--) {
        if (view.getUint8(j) === 0xff && view.getUint8(j + 1) === 0xd9) {
          imgEnd = j + 2;
          break;
        }
      }
    }

    const imgLen = imgEnd - imgStart;
    if (imgLen < 32) return null;

    const imgBytes = new Uint8Array(view.buffer, view.byteOffset + imgStart, imgLen);
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
    let mimeType = 'image/jpeg';
    let imgStart = -1;

    for (let i = offset + 1; i < max - 4; i++) {
      if (view.getUint8(i) === 0xff && view.getUint8(i + 1) === 0xd8) {
        imgStart = i;
        mimeType = 'image/jpeg';
        break;
      }
      if (view.getUint8(i) === 0x89 && view.getUint8(i + 1) === 0x50 && view.getUint8(i + 2) === 0x4e) {
        imgStart = i;
        mimeType = 'image/png';
        break;
      }
    }

    if (imgStart === -1) return null;
    const imgBytes = new Uint8Array(view.buffer, view.byteOffset + imgStart, max - imgStart);
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

// Parse complete M4A / AAC / MP4 metadata (title, artist, album, year, genre & embedded cover art)
async function parseM4aMetadata(file: File, result: ExtractedMetadata): Promise<void> {
  try {
    const sliceBuffer = await file.slice(0, Math.min(file.size, 4 * 1024 * 1024)).arrayBuffer();
    const bytes = new Uint8Array(sliceBuffer);
    const view = new DataView(sliceBuffer);
    const max = sliceBuffer.byteLength;

    // Helper: extract UTF-8 string inside a data sub-box
    const extractM4aText = (atomStart: number, atomLen: number): string | null => {
      try {
        const subBox = atomStart + 8;
        if (subBox + 16 < atomStart + atomLen && subBox + 16 < max) {
          const type = String.fromCharCode(bytes[subBox + 4], bytes[subBox + 5], bytes[subBox + 6], bytes[subBox + 7]);
          if (type === 'data') {
            const dataLen = view.getUint32(subBox);
            const strStart = subBox + 16;
            const strLen = dataLen - 16;
            if (strStart + strLen <= max && strLen > 0) {
              const strBytes = bytes.subarray(strStart, strStart + strLen);
              return new TextDecoder('utf-8').decode(strBytes).trim();
            }
          }
        }
      } catch {}
      return null;
    };

    // Scan for iTunes metadata atoms
    for (let i = 0; i < max - 8; i++) {
      const a0 = bytes[i];
      const a1 = bytes[i + 1];
      const a2 = bytes[i + 2];
      const a3 = bytes[i + 3];

      // 1. ©nam (0xA9, 'n', 'a', 'm') = Title
      if (a0 === 0xa9 && a1 === 0x6e && a2 === 0x61 && a3 === 0x6d && !result.title && i >= 4) {
        const atomLen = view.getUint32(i - 4);
        const title = extractM4aText(i - 4, atomLen);
        if (title) result.title = title;
      }
      // 2. ©ART (0xA9, 'A', 'R', 'T') = Artist
      else if (a0 === 0xa9 && a1 === 0x41 && a2 === 0x52 && a3 === 0x54 && !result.artist && i >= 4) {
        const atomLen = view.getUint32(i - 4);
        const artist = extractM4aText(i - 4, atomLen);
        if (artist) result.artist = artist;
      }
      // 3. ©alb (0xA9, 'a', 'l', 'b') = Album
      else if (a0 === 0xa9 && a1 === 0x61 && a2 === 0x6c && a3 === 0x62 && !result.album && i >= 4) {
        const atomLen = view.getUint32(i - 4);
        const album = extractM4aText(i - 4, atomLen);
        if (album) result.album = album;
      }
      // 4. ©day (0xA9, 'd', 'a', 'y') = Year
      else if (a0 === 0xa9 && a1 === 0x64 && a2 === 0x61 && a3 === 0x79 && !result.year && i >= 4) {
        const atomLen = view.getUint32(i - 4);
        const yearStr = extractM4aText(i - 4, atomLen);
        if (yearStr) {
          const y = parseInt(yearStr.slice(0, 4), 10);
          if (!isNaN(y)) result.year = y;
        }
      }
      // 5. ©gen (0xA9, 'g', 'e', 'n') = Genre
      else if (a0 === 0xa9 && a1 === 0x67 && a2 === 0x65 && a3 === 0x6e && !result.genre && i >= 4) {
        const atomLen = view.getUint32(i - 4);
        const genre = extractM4aText(i - 4, atomLen);
        if (genre) result.genre = genre;
      }
      // 6. 'covr' = Cover art
      else if (a0 === 0x63 && a1 === 0x6f && a2 === 0x76 && a3 === 0x72 && !result.coverArtUrl && i >= 4) {
        try {
          const covrAtomLen = view.getUint32(i - 4);
          const covrEnd = Math.min(max, i - 4 + covrAtomLen);
          let mime = 'image/jpeg';
          let imgStart = -1;

          for (let j = i + 4; j < covrEnd - 4; j++) {
            // Check for JPEG SOI
            if (bytes[j] === 0xff && bytes[j + 1] === 0xd8 && bytes[j + 2] === 0xff) {
              imgStart = j;
              mime = 'image/jpeg';
              break;
            }
            // Check for PNG
            if (bytes[j] === 0x89 && bytes[j + 1] === 0x50 && bytes[j + 2] === 0x4e) {
              imgStart = j;
              mime = 'image/png';
              break;
            }
          }

          if (imgStart !== -1) {
            let imgEnd = covrEnd;
            if (mime === 'image/jpeg') {
              for (let k = covrEnd - 2; k >= imgStart + 16; k--) {
                if (bytes[k] === 0xff && bytes[k + 1] === 0xd9) {
                  imgEnd = k + 2;
                  break;
                }
              }
            }
            const imgBytes = bytes.subarray(imgStart, imgEnd);
            if (imgBytes.length >= 32) {
              result.coverArtUrl = uint8ArrayToDataUrl(imgBytes, mime);
            }
          }
        } catch {}
      }
    }
  } catch (err) {
    console.warn('M4A metadata parsing notice:', err);
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

// Decode text frames with accurate byte offset and BOM/null handling
function decodeTextFrame(view: DataView, offset: number, length: number): string {
  if (length <= 1) return '';
  const encoding = view.getUint8(offset);
  const bytes = new Uint8Array(view.buffer, view.byteOffset + offset + 1, length - 1);

  const cleanString = (str: string) => str.replace(/^\uFEFF/, '').replace(/\0.*$/, '').replace(/\0/g, '').trim();

  try {
    if (encoding === 0) {
      return cleanString(new TextDecoder('iso-8859-1').decode(bytes));
    } else if (encoding === 1) {
      return cleanString(new TextDecoder('utf-16').decode(bytes));
    } else if (encoding === 2) {
      return cleanString(new TextDecoder('utf-16be').decode(bytes));
    } else if (encoding === 3) {
      return cleanString(new TextDecoder('utf-8').decode(bytes));
    }
  } catch {
    // fallback
  }

  return cleanString(String.fromCharCode(...bytes));
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
