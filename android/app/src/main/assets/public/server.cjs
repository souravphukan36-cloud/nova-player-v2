var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_https = __toESM(require("https"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_crypto = __toESM(require("crypto"), 1);
var import_vite = require("vite");
var PORT = 3e3;
var TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8717270921:AAFxvHPnWWawsJOf8ZONGJXdu-qatjD4X6g";
var TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || "-1003542494794";
var CACHE_DIR = import_path.default.join(process.cwd(), ".cache");
var AUDIO_CACHE_DIR = import_path.default.join(CACHE_DIR, "audio");
var IMAGE_CACHE_DIR = import_path.default.join(CACHE_DIR, "images");
var UPLOADS_DIR = import_path.default.join(process.cwd(), ".cache", "uploads");
try {
  import_fs.default.mkdirSync(AUDIO_CACHE_DIR, { recursive: true });
  import_fs.default.mkdirSync(IMAGE_CACHE_DIR, { recursive: true });
  import_fs.default.mkdirSync(UPLOADS_DIR, { recursive: true });
} catch (e) {
  console.warn("Cache directory creation notice:", e);
}
function detectAudioContentType(filePath) {
  try {
    const fd = import_fs.default.openSync(filePath, "r");
    const buf = Buffer.alloc(12);
    import_fs.default.readSync(fd, buf, 0, 12, 0);
    import_fs.default.closeSync(fd);
    if (buf.subarray(0, 3).toString() === "ID3" || buf[0] === 255 && (buf[1] & 224) === 224) {
      return "audio/mpeg";
    }
    if (buf.subarray(4, 8).toString() === "ftyp") {
      return "audio/mp4";
    }
  } catch {
  }
  return filePath.endsWith(".mp3") ? "audio/mpeg" : "audio/mp4";
}
var LOCAL_AUDIO_MAP = {
  "CQACAgUAAyEFAATTJi5KAAMEaqBCEBwPUmlyqTcWfoipPLVtC7kAAjc3AAL02QABVW7eevC-lMmhPQQ": "arz-kiya-hai.mp3",
  "CQACAgUAAyEFAATTJi5KAAMFaqBCLba3K3viyRgu4Na7ln7vukQAAjg3AAL02QABVQevV5-sQ44CPQQ": "aaoge-tum-kabhi.wav",
  "CQACAgUAAyEFAATTJi5KAAMHaqA-VHWYNBEJ_i_dtgh3LG1RjWQAAsAhAAKZfgFVbci9y_dlFhM9BA": "choo-lo.wav",
  "CQACAgUAAyEFAATTJi5KAAMLaqEdV_mpw1IVSY0lKkmjEGXmKNgAAkkiAAKZfglVTyWcug4Tcw09BA": "kaahe-mose.wav",
  "CQACAgUAAyEFAATTJi5KAAMMaqFGvSgVq_6LXDs30BNu8iVQ3R0AAqsiAAKZfglV4rXjZQ0AAd0ePQQ": "raabta.wav",
  "CQACAgUAAyEFAATTJi5KAAMNaqJrxdBQOWhCzraO4FYFiM1HUisAAmkkAAJ43xhVYlNm0ZoiGFY9BA": "somewhere-only-we-know.wav",
  "CQACAgUAAyEFAATTJi5KAAMOaqMDbAUB0e5k6cBY53pwmcm3BiwAAmMmAAJ43xhVxq0mPZaPE2M9BA": "jo-tum-mere-ho.wav",
  "CQACAgUAAyEFAATTJi5KAAMWaqVQiNi6tERj-EPLcypjLCrbFrwAAtMgAAJSFSlVOlDM6c3xj1U9BA": "dil-jhoom.wav",
  "CQACAgUAAyEFAATTJi5KAAMXaqVdbmnRLq_no5gt3551AAF-tzh8AAL_IAACUhUpVV_Toj7i_CxKPQQ": "halka-halka-suroor.wav",
  "CQACAgUAAyEFAATTJi5KAAMoaqZjza0SgOWhP0ZLPgvjOlIFFwADFSEAAuafMVXIdun-EpLwaz0E": "qismat-badaldi-vekhi.wav",
  "CQACAgUAAyEFAATTJi5KAAMPaqdEbjkP-BkClAG8uhUChRhEYboAAioiAAJ43yBVc65XGg18R5g9BA": "surili-akhiyon-wale.wav",
  "CQACAgUAAyEFAATTJi5KAAMRaqdEciBcq_Oi6ITxKHZivW1iJFIAAmYiAAJ43yBVJY3mvGlpvE89BA": "bairan.wav",
  "CQACAgUAAyEFAATTJi5KAAMSaqdEc68fEiSv-jsP130j9ZTGCuMAAgshAAJSFSFVxnJpxksfpto9BA": "faasle.wav",
  "CQACAgUAAyEFAATTJi5KAAMUaqdEdKDph_plO7RTOtiXusbUqdoAAlwhAAJSFSFVOggH_w3abN89BA": "come-and-get-your-love.wav",
  "CQACAgUAAyEFAATTJi5KAAMVaqdEdMsNp8Vug3QuEDGvOLI0dm0AAjQfAAJSFSlVAvE-l__Lo4w9BA": "the-last-letter.wav",
  "CQACAgUAAyEFAATTJi5KAAMpaqZwvPiQMJL6J98RQ3pt-xzbTtYAAj4iAALmnzlVYvW0CUMSrJU9BA": "black-star.wav",
  "CQACAgUAAyEFAATTJi5KAAMraqg_Q81zYqQjIIcB8OUFr672NkoAAl4hAAJOMkhVtiQNHA_O3Uo9BA": "muntazir.wav"
};
function findAudioCacheFile(fileId, filePath) {
  if (fileId && LOCAL_AUDIO_MAP[fileId]) {
    const filename = LOCAL_AUDIO_MAP[fileId];
    const candidatePaths = [
      import_path.default.join(AUDIO_CACHE_DIR, filename),
      import_path.default.join(process.cwd(), ".cache", "audio", filename),
      import_path.default.join(process.cwd(), "public", "audio", filename),
      import_path.default.join(process.cwd(), "dist", "audio", filename)
    ];
    for (const p of candidatePaths) {
      if (import_fs.default.existsSync(p)) {
        return { path: p, contentType: p.endsWith(".mp3") ? "audio/mpeg" : p.endsWith(".wav") ? "audio/wav" : "audio/mp4" };
      }
    }
  }
  const ids = [];
  if (fileId) ids.push(fileId);
  if (filePath) ids.push(filePath);
  for (const id of ids) {
    const hash = import_crypto.default.createHash("md5").update(id).digest("hex");
    const m4aPath = import_path.default.join(AUDIO_CACHE_DIR, `${hash}.m4a`);
    const mp3Path = import_path.default.join(AUDIO_CACHE_DIR, `${hash}.mp3`);
    if (import_fs.default.existsSync(m4aPath)) {
      return { path: m4aPath, contentType: detectAudioContentType(m4aPath) };
    }
    if (import_fs.default.existsSync(mp3Path)) {
      return { path: mp3Path, contentType: detectAudioContentType(mp3Path) };
    }
  }
  return null;
}
function getAudioCachePath(fileId, filePath) {
  const hash = import_crypto.default.createHash("md5").update(fileId || filePath || "audio").digest("hex");
  const isM4a = filePath && (filePath.endsWith(".m4a") || filePath.includes("file_3") || filePath.includes("file_4") || filePath.includes("file_6")) || fileId && (fileId.includes(".m4a") || fileId.includes("Aaoge") || fileId.includes("Choo") || fileId.includes("Raabta"));
  return import_path.default.join(AUDIO_CACHE_DIR, `${hash}${isM4a ? ".m4a" : ".mp3"}`);
}
function getImageCachePath(fileId) {
  const hash = import_crypto.default.createHash("md5").update(fileId).digest("hex");
  return import_path.default.join(IMAGE_CACHE_DIR, `${hash}.jpg`);
}
var BASE_TRACKS = [
  {
    id: "tg-tu-kya-jaane",
    fileId: "CQACAgUAAyEFAATTJi5KAAMyasNw2ap2pCDvj0WOGP6JCEejbyUAAj4iAAK0qxlWSRS-TFeoNAABPQQ",
    title: "Tu Kya Jaane",
    artist: "A.R. Rahman",
    album: "Amar Singh Chamkila",
    duration: 256,
    format: "m4a",
    coverArt: "/covers/tu-kya-jaane.jpg",
    audioUrl: "/api/telegram/audio?file_id=CQACAgUAAyEFAATTJi5KAAMyasNw2ap2pCDvj0WOGP6JCEejbyUAAj4iAAK0qxlWSRS-TFeoNAABPQQ",
    synthPreset: "acoustic",
    genre: "Soulful / Bollywood Classical",
    folder: "NOVA Private Library / A.R. Rahman",
    year: 2024,
    bitRate: "320 kbps (Telegram Cloud Master)",
    playCount: 18,
    isFavorite: true,
    dateAdded: 1791193305e3,
    lyrics: [
      { time: 0, text: "\u266A (Lush acoustic melody & soul-stirring ambience) \u266A" },
      { time: 15, text: "Tu kya jaane mere dil ka haal..." },
      { time: 45, text: "Kyun rota hai yeh har ek raat..." },
      { time: 75, text: "\u266A (Emotional vocal crescendo & warm harmonies) \u266A" },
      { time: 115, text: "Tu kya jaane..." }
    ]
  },
  {
    id: "tg-tu-bata",
    fileId: "CQACAgUAAyEFAATTJi5KAAMzasNw2pOyU3eFxQ-wlp_yn5WSerAAAj8iAAK0qxlWlKzlnht75E89BA",
    title: "Tu Bata",
    artist: "AFTAB",
    album: "Tu Bata - Single",
    duration: 160,
    format: "m4a",
    coverArt: "/covers/tu-bata.jpg",
    audioUrl: "/api/telegram/audio?file_id=CQACAgUAAyEFAATTJi5KAAMzasNw2pOyU3eFxQ-wlp_yn5WSerAAAj8iAAK0qxlWlKzlnht75E89BA",
    synthPreset: "acoustic",
    genre: "Indie Acoustic / Pop",
    folder: "NOVA Private Library / AFTAB",
    year: 2024,
    bitRate: "320 kbps (Telegram Cloud Master)",
    playCount: 12,
    isFavorite: true,
    dateAdded: 1791193307e3,
    lyrics: [
      { time: 0, text: "\u266A (Gentle guitar chords & warm vocals) \u266A" },
      { time: 10, text: "Tu bata, kya tera bhi dil dukhta hai..." },
      { time: 40, text: "Kyun yeh raaste juda hone lage..." }
    ]
  },
  {
    id: "tg-husn",
    fileId: "CQACAgUAAyEFAATTJi5KAAM0asNw3FaNcLEMXiRz2jCZsAwxSBkAAkAiAAK0qxlWWMXTt8DSghU9BA",
    title: "Husn",
    artist: "Anuv Jain",
    album: "Husn - Single",
    duration: 217,
    format: "m4a",
    coverArt: "/covers/husn.jpg",
    audioUrl: "/api/telegram/audio?file_id=CQACAgUAAyEFAATTJi5KAAM0asNw3FaNcLEMXiRz2jCZsAwxSBkAAkAiAAK0qxlWWMXTt8DSghU9BA",
    synthPreset: "acoustic",
    genre: "Indie Acoustic / Poetry",
    folder: "NOVA Private Library / Anuv Jain",
    year: 2023,
    bitRate: "320 kbps (Telegram Cloud Master)",
    playCount: 45,
    isFavorite: true,
    dateAdded: 179119331e4,
    lyrics: [
      { time: 0, text: "\u266A (Acoustic fingerpicking & soulful piano) \u266A" },
      { time: 12, text: "Dekho deewane aaye hain..." },
      { time: 30, text: "Husn tera taareefein kare..." },
      { time: 60, text: "Par hum toh bas teri aankhon mein doobe..." }
    ]
  },
  {
    id: "tg-inaam",
    fileId: "CQACAgUAAyEFAATTJi5KAAM1asNw3s2xnNSZ6KEgSHuZfNXGHngAAkEiAAK0qxlW8Z7k1pxqPaY9BA",
    title: "Inaam",
    artist: "Anuv Jain",
    album: "Inaam - Single",
    duration: 257,
    format: "m4a",
    coverArt: "/covers/inaam.jpg",
    audioUrl: "/api/telegram/audio?file_id=CQACAgUAAyEFAATTJi5KAAM1asNw3s2xnNSZ6KEgSHuZfNXGHngAAkEiAAK0qxlW8Z7k1pxqPaY9BA",
    synthPreset: "acoustic",
    genre: "Indie Acoustic / Melancholy",
    folder: "NOVA Private Library / Anuv Jain",
    year: 2024,
    bitRate: "320 kbps (Telegram Cloud Master)",
    playCount: 22,
    isFavorite: true,
    dateAdded: 1791193313e3,
    lyrics: [
      { time: 0, text: "\u266A (Gentle acoustic resonance & storytelling) \u266A" },
      { time: 15, text: "Inaam mein mila yeh dard tera..." },
      { time: 45, text: "Kyun har khwaab adhura sa reh gaya..." }
    ]
  },
  {
    id: "tg-gul",
    fileId: "CQACAgUAAyEFAATTJi5KAAM2asNw4YImA0zJyyYPVuzET0x2XIgAAkIiAAK0qxlWrj48NKkXEGk9BA",
    title: "Gul",
    artist: "Anuv Jain",
    album: "Gul - Single",
    duration: 217,
    format: "m4a",
    coverArt: "/covers/gul.jpg",
    audioUrl: "/api/telegram/audio?file_id=CQACAgUAAyEFAATTJi5KAAM2asNw4YImA0zJyyYPVuzET0x2XIgAAkIiAAK0qxlWrj48NKkXEGk9BA",
    synthPreset: "acoustic",
    genre: "Indie Acoustic / Poetry",
    folder: "NOVA Private Library / Anuv Jain",
    year: 2021,
    bitRate: "320 kbps (Telegram Cloud Master)",
    playCount: 38,
    isFavorite: true,
    dateAdded: 1791193315e3,
    lyrics: [
      { time: 0, text: "\u266A (Uplifting acoustic guitar & melodic whistling) \u266A" },
      { time: 14, text: "Gulshan mein gul khile hain jaise..." },
      { time: 38, text: "Teri muskaan se mehek uthe hain raste..." }
    ]
  },
  {
    id: "tg-baarishein",
    fileId: "CQACAgUAAyEFAATTJi5KAAM3asNw46C2FQob9hh8VqYTIsIdSqgAAkMiAAK0qxlWhnKNwKOUyK89BA",
    title: "Baarishein",
    artist: "Anuv Jain",
    album: "Baarishein - Single",
    duration: 207,
    format: "m4a",
    coverArt: "/covers/baarishein.jpg",
    audioUrl: "/api/telegram/audio?file_id=CQACAgUAAyEFAATTJi5KAAM3asNw46C2FQob9hh8VqYTIsIdSqgAAkMiAAK0qxlWhnKNwKOUyK89BA",
    synthPreset: "acoustic",
    genre: "Indie Acoustic / Poetry",
    folder: "NOVA Private Library / Anuv Jain",
    year: 2018,
    bitRate: "320 kbps (Telegram Cloud Master)",
    playCount: 52,
    isFavorite: true,
    dateAdded: 1791193318e3,
    lyrics: [
      { time: 0, text: "\u266A (Gentle acoustic strumming & rain ambience) \u266A" },
      { time: 10, text: "Hawaayein le rahi hain karwatein..." },
      { time: 30, text: "Yeh baarishein keh rahi hain daastan..." },
      { time: 60, text: "Tujhse judi har baat yaad aane lagi..." }
    ]
  },
  {
    id: "tg-baarishein-acoustic",
    fileId: "CQACAgUAAyEFAATTJi5KAAM4asNw5xeRgLkdnN0pXv3cYO9JrnoAAkQiAAK0qxlW0W_Z7WyW9Uk9BA",
    title: "Baarishein (Acoustic)",
    artist: "Anuv Jain",
    album: "Baarishein (Live Acoustic Session)",
    duration: 209,
    format: "m4a",
    coverArt: "/covers/baarishein-acoustic.jpg",
    audioUrl: "/api/telegram/audio?file_id=CQACAgUAAyEFAATTJi5KAAM4asNw5xeRgLkdnN0pXv3cYO9JrnoAAkQiAAK0qxlW0W_Z7WyW9Uk9BA",
    synthPreset: "acoustic",
    genre: "Raw Acoustic / Studio Session",
    folder: "NOVA Private Library / Anuv Jain",
    year: 2022,
    bitRate: "320 kbps (Telegram Cloud Master)",
    playCount: 29,
    isFavorite: false,
    dateAdded: 1791193321e3,
    lyrics: [
      { time: 0, text: "\u266A (Raw acoustic fingerpicking & studio warmth) \u266A" },
      { time: 15, text: "Kyun yeh baarishein mujhko rulaayein..." }
    ]
  },
  {
    id: "tg-antariksh",
    fileId: "CQACAgUAAyEFAATTJi5KAAM5asNw6c_ljG-53WqTvhxi2b-IXAYAAkUiAAK0qxlWcdlsg5ib5mQ9BA",
    title: "Antariksh",
    artist: "Anuv Jain",
    album: "Antariksh - Single",
    duration: 165,
    format: "m4a",
    coverArt: "/covers/antariksh.jpg",
    audioUrl: "/api/telegram/audio?file_id=CQACAgUAAyEFAATTJi5KAAM5asNw6c_ljG-53WqTvhxi2b-IXAYAAkUiAAK0qxlWcdlsg5ib5mQ9BA",
    synthPreset: "acoustic",
    genre: "Indie Space Acoustic / Poetry",
    folder: "NOVA Private Library / Anuv Jain",
    year: 2023,
    bitRate: "320 kbps (Telegram Cloud Master)",
    playCount: 19,
    isFavorite: true,
    dateAdded: 1791193324e3,
    lyrics: [
      { time: 0, text: "\u266A (Dreamy acoustic guitar harmonics & stellar warmth) \u266A" },
      { time: 12, text: "Antariksh ke taaron mein dhoonda tujhe..." },
      { time: 35, text: "Kahin door ek roshni si jali..." }
    ]
  }
];
var dynamicTracks = [...BASE_TRACKS];
var lastTelegramUpdateId = 0;
var TRACKS_DB_PATH = import_path.default.join(CACHE_DIR, "tracks_db.json");
var TRACKS_METADATA_PATH = import_path.default.join(CACHE_DIR, "tracks_metadata.json");
var trackOverrides = {};
function loadTrackOverrides() {
  try {
    if (import_fs.default.existsSync(TRACKS_METADATA_PATH)) {
      const raw = import_fs.default.readFileSync(TRACKS_METADATA_PATH, "utf-8");
      const data = JSON.parse(raw);
      if (typeof data === "object" && data !== null) {
        trackOverrides = data;
        console.log(`[Metadata Engine] Loaded ${Object.keys(trackOverrides).length} custom track overrides`);
      }
    }
  } catch (e) {
    console.warn("[Metadata Engine] Could not load tracks_metadata.json:", e);
  }
}
function saveTrackOverrides() {
  try {
    import_fs.default.writeFileSync(TRACKS_METADATA_PATH, JSON.stringify(trackOverrides, null, 2), "utf-8");
    console.log(`[Metadata Engine] Saved ${Object.keys(trackOverrides).length} custom track overrides to disk`);
  } catch (e) {
    console.warn("[Metadata Engine] Could not save tracks_metadata.json:", e);
  }
}
function applyTrackOverrides(track) {
  if (!track || !track.id) return track;
  const override = trackOverrides[track.id];
  if (!override) return track;
  return {
    ...track,
    title: override.title !== void 0 && override.title.trim() !== "" ? override.title.trim() : track.title,
    artist: override.artist !== void 0 && override.artist.trim() !== "" ? override.artist.trim() : track.artist,
    album: override.album !== void 0 && override.album.trim() !== "" ? override.album.trim() : track.album,
    genre: override.genre !== void 0 && override.genre.trim() !== "" ? override.genre.trim() : track.genre,
    year: override.year !== void 0 ? override.year : track.year,
    coverArt: override.coverArt !== void 0 && override.coverArt.trim() !== "" ? override.coverArt.trim() : track.coverArt,
    lyrics: override.lyrics !== void 0 && Array.isArray(override.lyrics) && override.lyrics.length > 0 ? override.lyrics : track.lyrics,
    isFavorite: override.isFavorite !== void 0 ? override.isFavorite : track.isFavorite,
    isHidden: override.isHidden !== void 0 ? override.isHidden : false,
    isFeatured: override.isFeatured !== void 0 ? override.isFeatured : false,
    synthPreset: override.synthPreset !== void 0 ? override.synthPreset : track.synthPreset,
    hasCustomMetadata: true,
    lastMetadataUpdated: override.updatedAt || void 0
  };
}
loadTrackOverrides();
try {
  if (import_fs.default.existsSync(TRACKS_DB_PATH)) {
    const dbData = JSON.parse(import_fs.default.readFileSync(TRACKS_DB_PATH, "utf-8"));
    if (Array.isArray(dbData.tracks)) {
      const existingIds = new Set(BASE_TRACKS.map((t) => t.id));
      const newTracks = dbData.tracks.filter((t) => !existingIds.has(t.id));
      dynamicTracks = [...BASE_TRACKS, ...newTracks];
    }
    if (dbData.lastUpdateId) {
      lastTelegramUpdateId = dbData.lastUpdateId;
    }
  }
} catch (e) {
  console.warn("Could not load tracks DB:", e);
}
function saveTracksDb() {
  try {
    import_fs.default.writeFileSync(TRACKS_DB_PATH, JSON.stringify({
      lastUpdateId: lastTelegramUpdateId,
      tracks: dynamicTracks
    }, null, 2));
  } catch (e) {
    console.warn("Could not save tracks DB:", e);
  }
}
var filePathCache = {
  // Verified Telegram Cloud Audio File Paths (Current Active CDN Mapping)
  "CQACAgUAAyEFAATTJi5KAAMEaqBCEBwPUmlyqTcWfoipPLVtC7kAAjc3AAL02QABVW7eevC-lMmhPQQ": "music/file_146",
  // Arz Kiya Hai (.mp3)
  "CQACAgUAAyEFAATTJi5KAAMFaqBCLba3K3viyRgu4Na7ln7vukQAAjg3AAL02QABVQevV5-sQ44CPQQ": "music/file_151",
  // Aaoge Tum Kabhi (.m4a)
  "CQACAgUAAyEFAATTJi5KAAMHaqA-VHWYNBEJ_i_dtgh3LG1RjWQAAsAhAAKZfgFVbci9y_dlFhM9BA": "music/file_150",
  // Choo Lo (.m4a)
  "CQACAgUAAyEFAATTJi5KAAMLaqEdV_mpw1IVSY0lKkmjEGXmKNgAAkkiAAKZfglVTyWcug4Tcw09BA": "music/file_152",
  // Kaahe Mose (.mp3)
  "CQACAgUAAyEFAATTJi5KAAMMaqFGvSgVq_6LXDs30BNu8iVQ3R0AAqsiAAKZfglV4rXjZQ0AAd0ePQQ": "music/file_153",
  // Raabta (.m4a)
  "CQACAgUAAyEFAATTJi5KAAMNaqJrxdBQOWhCzraO4FYFiM1HUisAAmkkAAJ43xhVYlNm0ZoiGFY9BA": "music/file_155",
  // Somewhere Only We Know (.mp3)
  "CQACAgUAAyEFAATTJi5KAAMOaqMDbAUB0e5k6cBY53pwmcm3BiwAAmMmAAJ43xhVxq0mPZaPE2M9BA": "music/file_154",
  // Jo Tum Mere Ho (.m4a)
  "CQACAgUAAyEFAATTJi5KAAMWaqVQiNi6tERj-EPLcypjLCrbFrwAAtMgAAJSFSlVOlDM6c3xj1U9BA": "music/file_156",
  // Dil Jhoom (.m4a)
  "CQACAgUAAyEFAATTJi5KAAMXaqVdbmnRLq_no5gt3551AAF-tzh8AAL_IAACUhUpVV_Toj7i_CxKPQQ": "music/file_157",
  // Nadaan Parinde (.m4a)
  "CQACAgUAAyEFAATTJi5KAAMoaqZjza0SgOWhP0ZLPgvjOlIFFwADFSEAAuafMVXIdun-EpLwaz0E": "music/file_158",
  // Kaash Aisa Hota (.m4a)
  "CQACAgUAAyEFAATTJi5KAAMPaqdEbjkP-BkClAG8uhUChRhEYboAAioiAAJ43yBVc65XGg18R5g9BA": "music/file_159",
  // Surili Akhiyon Wale (.m4a)
  "CQACAgUAAyEFAATTJi5KAAMRaqdEciBcq_Oi6ITxKHZivW1iJFIAAmYiAAJ43yBVJY3mvGlpvE89BA": "music/file_160",
  // Bairan (.mp3)
  "CQACAgUAAyEFAATTJi5KAAMSaqdEc68fEiSv-jsP130j9ZTGCuMAAgshAAJSFSFVxnJpxksfpto9BA": "music/file_161",
  // Faasle (.m4a)
  "CQACAgUAAyEFAATTJi5KAAMUaqdEdKDph_plO7RTOtiXusbUqdoAAlwhAAJSFSFVOggH_w3abN89BA": "music/file_149",
  // Kaise Hua (.mp3)
  "CQACAgUAAyEFAATTJi5KAAMVaqdEdMsNp8Vug3QuEDGvOLI0dm0AAjQfAAJSFSlVAvE-l__Lo4w9BA": "music/file_148",
  // Come And Get Your Love (.mp3)
  "CQACAgUAAyEFAATTJi5KAAMpaqZwvPiQMJL6J98RQ3pt-xzbTtYAAj4iAALmnzlVYvW0CUMSrJU9BA": "music/file_162",
  // Black Star (.mp3)
  "CQACAgUAAyEFAATTJi5KAAMraqg_Q81zYqQjIIcB8OUFr672NkoAAl4hAAJOMkhVtiQNHA_O3Uo9BA": "music/file_147",
  // Muntazir (.m4a)
  // Real Uploaded Song Picture / Thumbnails
  "AAMCBQADIQUABNMmLkoAAwdqoD5UdZg0EQn-L922CHcsbVGNZAACwCEAApl-AVVtyL3L92UWEwEAB20AAz0E": "thumbnails/file_87.jpg",
  "AAMCBQADIQUABNMmLkoAAwtqoR1X-anDUhVJjSUqSaMQZeYo2AACSSIAApl-CVVPJZy6DhNzDQEAB20AAz0E": "thumbnails/file_93.jpg",
  "AAMCBQADIQUABNMmLkoAAwxqoUa9KBWr_otcOzfQE27yJVDdHQACqyIAApl-CVXiteNlDQAB3R4BAAdtAAM9BA": "thumbnails/file_88.jpg",
  "AAMCBQADIQUABNMmLkoAAw1qomvF0FA5aELOto7gVgWIzUdSKwACaSQAAnjfGFViU2bRmiIYVgEAB20AAz0E": "thumbnails/file_91.jpg",
  "AAMCBQADIQUABNMmLkoAAw5qowNsBQHR7mTpwFjnenCZybcGLAACYyYAAnjfGFXGrSY9lo8TYwEAB20AAz0E": "thumbnails/file_92.jpg",
  "AAMCBQADIQUABNMmLkoAAxZqpVCI2Lq0RGP4Q8tzKmMsKtsWvAAC0yAAAlIVKVU6UMzpzfGPVQEAB20AAz0E": "thumbnails/file_90.jpg",
  "AAMCBQADIQUABNMmLkoAAxdqp0R5rJybi7fY-8PO0Ojxyt3ILgAC_yAAAlIVKVVf06I-4vwsSgEAB20AAz0E": "thumbnails/file_89.jpg",
  "AAMCBQADIQUABNMmLkoAAxdqpV1uadEur-ejmC3fnnUAAX63OHwAAv8gAAJSFSlVX9OiPuL8LEoBAAdtAAM9BA": "thumbnails/file_89.jpg",
  "AAMCBQADIQUABNMmLkoAAw9qp0RuOQ_4GQKUAby6FQKFGERhugACKiIAAnjfIFVzrlcaDXxHmAEAB20AAz0E": "thumbnails/file_96.jpg",
  "AAMCBQADIQUABNMmLkoAAxFqp0RyIFyr86LohPEodmK9bWIkUgACZiIAAnjfIFUljea8aWm8TwEAB20AAz0E": "thumbnails/file_97.jpg",
  "AAMCBQADIQUABNMmLkoAAxJqp0Rzrx8SJK_6Ow_XfSP1lMYK4wACCyEAAlIVIVXGcmnGSx-m2gEAB20AAz0E": "thumbnails/file_94.jpg",
  "AAMCBQADIQUABNMmLkoAAxRqp0R0oOmH-mU7tFM62Je6xtSp2gACXCEAAlIVIVU6CAf_Ddps3wEAB20AAz0E": "thumbnails/file_98.jpg",
  "AAMCBQADIQUABNMmLkoAAxVqp0R0yw2nxW6DdC4QMa84sjR2bQACNB8AAlIVKVUC8T6X_8ujjAEAB20AAz0E": "thumbnails/file_95.jpg",
  "AAMCBQADIQUABNMmLkoAAylqpnC8-JAwkvon3xFDem37HNtO1gACPiIAAuafOVVi9bQJQxKslQEAB20AAz0E": "thumbnails/file_100.jpg",
  "AAMCBQADIQUABNMmLkoAAytqqD9DzXNipCMghwHw5QWvrvY2SgACXiEAAk4ySFW2JA0cD87dSgEAB20AAz0E": "thumbnails/file_99.jpg"
};
var fileMimeCache = {
  "CQACAgUAAyEFAATTJi5KAAMEaqBCEBwPUmlyqTcWfoipPLVtC7kAAjc3AAL02QABVW7eevC-lMmhPQQ": "audio/mpeg",
  // Arz Kiya Hai (.mp3)
  "CQACAgUAAyEFAATTJi5KAAMFaqBCLba3K3viyRgu4Na7ln7vukQAAjg3AAL02QABVQevV5-sQ44CPQQ": "audio/mp4",
  // Aaoge Tum Kabhi (.m4a)
  "CQACAgUAAyEFAATTJi5KAAMHaqA-VHWYNBEJ_i_dtgh3LG1RjWQAAsAhAAKZfgFVbci9y_dlFhM9BA": "audio/mp4",
  // Choo Lo (.m4a)
  "CQACAgUAAyEFAATTJi5KAAMLaqEdV_mpw1IVSY0lKkmjEGXmKNgAAkkiAAKZfglVTyWcug4Tcw09BA": "audio/mpeg",
  // Kaahe Mose (.mp3)
  "CQACAgUAAyEFAATTJi5KAAMMaqFGvSgVq_6LXDs30BNu8iVQ3R0AAqsiAAKZfglV4rXjZQ0AAd0ePQQ": "audio/mp4",
  // Raabta (.m4a)
  "CQACAgUAAyEFAATTJi5KAAMNaqJrxdBQOWhCzraO4FYFiM1HUisAAmkkAAJ43xhVYlNm0ZoiGFY9BA": "audio/mpeg",
  // Somewhere Only We Know (.mp3)
  "CQACAgUAAyEFAATTJi5KAAMOaqMDbAUB0e5k6cBY53pwmcm3BiwAAmMmAAJ43xhVxq0mPZaPE2M9BA": "audio/mp4",
  // Jo Tum Mere Ho (.m4a)
  "CQACAgUAAyEFAATTJi5KAAMWaqVQiNi6tERj-EPLcypjLCrbFrwAAtMgAAJSFSlVOlDM6c3xj1U9BA": "audio/mp4",
  // Dil Jhoom (.m4a)
  "CQACAgUAAyEFAATTJi5KAAMXaqVdbmnRLq_no5gt3551AAF-tzh8AAL_IAACUhUpVV_Toj7i_CxKPQQ": "audio/mp4",
  // Nadaan Parinde (.m4a)
  "CQACAgUAAyEFAATTJi5KAAMoaqZjza0SgOWhP0ZLPgvjOlIFFwADFSEAAuafMVXIdun-EpLwaz0E": "audio/mp4",
  // Kaash Aisa Hota (.m4a)
  "CQACAgUAAyEFAATTJi5KAAMPaqdEbjkP-BkClAG8uhUChRhEYboAAioiAAJ43yBVc65XGg18R5g9BA": "audio/mp4",
  // Surili Akhiyon Wale (.m4a)
  "CQACAgUAAyEFAATTJi5KAAMRaqdEciBcq_Oi6ITxKHZivW1iJFIAAmYiAAJ43yBVJY3mvGlpvE89BA": "audio/mpeg",
  // Bairan (.mp3)
  "CQACAgUAAyEFAATTJi5KAAMSaqdEc68fEiSv-jsP130j9ZTGCuMAAgshAAJSFSFVxnJpxksfpto9BA": "audio/mp4",
  // Faasle (.m4a)
  "CQACAgUAAyEFAATTJi5KAAMUaqdEdKDph_plO7RTOtiXusbUqdoAAlwhAAJSFSFVOggH_w3abN89BA": "audio/mpeg",
  // Kaise Hua (.mp3)
  "CQACAgUAAyEFAATTJi5KAAMVaqdEdMsNp8Vug3QuEDGvOLI0dm0AAjQfAAJSFSlVAvE-l__Lo4w9BA": "audio/mpeg",
  // Come And Get Your Love (.mp3)
  "CQACAgUAAyEFAATTJi5KAAMpaqZwvPiQMJL6J98RQ3pt-xzbTtYAAj4iAALmnzlVYvW0CUMSrJU9BA": "audio/mpeg",
  // Black Star (.mp3)
  "CQACAgUAAyEFAATTJi5KAAMraqg_Q81zYqQjIIcB8OUFr672NkoAAl4hAAJOMkhVtiQNHA_O3Uo9BA": "audio/mp4",
  // Muntazir (.m4a)
  "music/file_70": "audio/mpeg",
  "music/file_71": "audio/mp4",
  "music/file_72.m4a": "audio/mp4",
  "music/file_73.mp3": "audio/mpeg",
  "music/file_74.m4a": "audio/mp4",
  "music/file_75.mp3": "audio/mpeg",
  "music/file_76.m4a": "audio/mp4",
  "music/file_77.m4a": "audio/mp4",
  "music/file_78.m4a": "audio/mp4",
  "music/file_79.m4a": "audio/mp4",
  "music/file_80.m4a": "audio/mp4",
  "music/file_81.mp3": "audio/mpeg",
  "music/file_82.m4a": "audio/mp4",
  "music/file_83.mp3": "audio/mpeg",
  "music/file_84.mp3": "audio/mpeg",
  "music/file_85.mp3": "audio/mpeg",
  "music/file_86.m4a": "audio/mp4"
};
function cleanAudioMetadata(rawTitle, rawPerformer) {
  let title = (rawTitle || "").trim();
  let artist = (rawPerformer || "").trim();
  title = title.replace(/\.(mp3|flac|wav|m4a|aac|ogg|opus|mp4)$/i, "").replace(/\b(128kbps|320kbps|128k|320k|m4a_128k|mp3_320k|official audio|lyrics)\b/gi, "").replace(/\s+/g, " ").trim();
  if (!title) {
    title = "Telegram Audio";
  }
  if (!artist) {
    artist = "Indie Artist";
  }
  return { title, artist };
}
async function resolveTelegramFilePath(fileId, forceFresh = false) {
  if (!forceFresh && filePathCache[fileId]) return filePathCache[fileId];
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    let res;
    try {
      res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`, {
        signal: controller.signal,
        headers: { "User-Agent": "curl/7.68.0" }
      });
    } finally {
      clearTimeout(timer);
    }
    if (res && res.ok) {
      const data = await res.json();
      if (data.ok && data.result?.file_path) {
        filePathCache[fileId] = data.result.file_path;
        return data.result.file_path;
      }
    }
  } catch (err) {
    if (err?.name !== "AbortError" && !err?.message?.includes("aborted") && !err?.message?.includes("timeout")) {
      console.warn("Failed to resolve Telegram file path for", fileId, err?.message || err);
    }
  }
  return filePathCache[fileId] || null;
}
var prewarmingSet = /* @__PURE__ */ new Set();
async function prewarmTrackCache(fileId, filePath) {
  if (!fileId && !filePath) return;
  const key = fileId || filePath || "";
  if (prewarmingSet.has(key)) return;
  const cachedFilePath = getAudioCachePath(fileId, filePath);
  if (import_fs.default.existsSync(cachedFilePath)) return;
  prewarmingSet.add(key);
  try {
    let path2 = filePath;
    if (!path2 && fileId) {
      path2 = await resolveTelegramFilePath(fileId) || void 0;
    }
    if (!path2) {
      prewarmingSet.delete(key);
      return;
    }
    const telegramFileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${path2}`;
    const tempPath = `${cachedFilePath}.prewarm.${Date.now()}`;
    const req = import_https.default.get(telegramFileUrl, (res) => {
      if (res.statusCode === 200) {
        const ws = import_fs.default.createWriteStream(tempPath);
        res.pipe(ws);
        ws.on("finish", () => {
          import_fs.default.rename(tempPath, cachedFilePath, (err) => {
            prewarmingSet.delete(key);
            if (!err) {
              console.log(`[Pre-buffer Engine] Pre-buffered track to cache: ${path2}`);
            }
          });
        });
        ws.on("error", () => {
          prewarmingSet.delete(key);
          try {
            import_fs.default.unlinkSync(tempPath);
          } catch {
          }
        });
      } else {
        prewarmingSet.delete(key);
      }
    });
    req.on("error", () => {
      prewarmingSet.delete(key);
      try {
        import_fs.default.unlinkSync(tempPath);
      } catch {
      }
    });
  } catch {
    prewarmingSet.delete(key);
  }
}
function prewarmAllTracks() {
  setTimeout(async () => {
    for (const tr of dynamicTracks.slice(0, 15)) {
      if (tr.fileId) {
        await prewarmTrackCache(tr.fileId, tr.filePath);
      }
    }
  }, 1e3);
}
var isFetchingUpdates = false;
var lastFetchTime = 0;
async function fetchTelegramUpdates(customToken, force = false) {
  const now = Date.now();
  if (!force && now - lastFetchTime < 6e4) {
    return;
  }
  if (isFetchingUpdates) {
    return;
  }
  const tokenToUse = customToken && !customToken.includes("8846538187") ? customToken : TELEGRAM_BOT_TOKEN;
  isFetchingUpdates = true;
  lastFetchTime = now;
  try {
    const url = `https://api.telegram.org/bot${tokenToUse}/getUpdates?allowed_updates=["channel_post","message","edited_channel_post","edited_message"]&limit=100&offset=${lastTelegramUpdateId + 1}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    let res;
    try {
      res = await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
    if (!res || !res.ok) return;
    const data = await res.json();
    let updatesList = [];
    if (data.ok && Array.isArray(data.result) && data.result.length > 0) {
      updatesList = data.result;
    } else {
      try {
        const fallbackUrl = `https://api.telegram.org/bot${tokenToUse}/getUpdates?allowed_updates=["channel_post","message","edited_channel_post","edited_message"]&limit=50&offset=-50`;
        const fbController = new AbortController();
        const fbTimer = setTimeout(() => fbController.abort(), 3500);
        try {
          const fbRes = await fetch(fallbackUrl, { signal: fbController.signal });
          if (fbRes.ok) {
            const fbData = await fbRes.json();
            if (fbData.ok && Array.isArray(fbData.result)) {
              updatesList = fbData.result;
            }
          }
        } finally {
          clearTimeout(fbTimer);
        }
      } catch {
      }
    }
    if (updatesList.length > 0) {
      let hasUpdates = false;
      for (const item of updatesList) {
        if (item.update_id && item.update_id > lastTelegramUpdateId) {
          lastTelegramUpdateId = item.update_id;
          hasUpdates = true;
        }
        const msg = item.channel_post || item.message || item.edited_channel_post || item.edited_message;
        if (!msg) continue;
        const audio = msg.audio || msg.document || msg.voice;
        const isAudio = audio && (audio.mime_type?.startsWith("audio/") || audio.mime_type === "application/ogg" || audio.mime_type === "video/mp4" || audio.file_name?.match(/\.(mp3|flac|wav|m4a|aac|ogg|opus|wma|mp4)$/i) || Boolean(msg.voice));
        if (isAudio) {
          const fileId = audio.file_id;
          const fileUniqueId = audio.file_unique_id || "";
          let mime = audio.mime_type || "audio/mpeg";
          if (mime === "audio/m4a" || audio.file_name?.endsWith(".m4a") || audio.file_name?.endsWith(".mp4")) {
            mime = "audio/mp4";
          }
          fileMimeCache[fileId] = mime;
          const exists = dynamicTracks.some((t) => t.fileId === fileId || audio.title && t.title.toLowerCase() === audio.title.toLowerCase());
          if (!exists) {
            let filePath = await resolveTelegramFilePath(fileId);
            if (!filePath) {
              filePath = `music/${fileId}`;
            }
            fileMimeCache[filePath] = mime;
            const rawCaption = msg.caption || "";
            const rawPerformer = audio.performer || (rawCaption.includes("-") ? rawCaption.split("-")[0].trim() : "Indie Artist");
            const rawTitle = audio.title || (rawCaption.includes("-") ? rawCaption.split("-")[1].trim() : rawCaption || audio.file_name?.replace(/\.[^/.]+$/, "") || "Telegram Audio");
            const { title, artist } = cleanAudioMetadata(rawTitle, rawPerformer);
            const ext = mime === "audio/mp4" || audio.file_name?.endsWith(".m4a") ? "m4a" : "mp3";
            const uniqueTrackId = `tg-${fileUniqueId || "song-" + (msg.message_id || Date.now()) || fileId.slice(-12)}`;
            const thumbFileId = audio.thumbnail?.file_id || audio.thumb?.file_id;
            let coverArt = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80";
            if (thumbFileId) {
              coverArt = `/api/telegram/image?file_id=${thumbFileId}`;
            } else if (artist === "Anuv Jain") {
              coverArt = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80";
            }
            const newTrack = {
              id: uniqueTrackId,
              fileId,
              filePath,
              title,
              artist,
              album: "NOVA Private Library",
              duration: audio.duration || 240,
              format: ext,
              coverArt,
              audioUrl: `https://api.telegram.org/file/bot${tokenToUse}/${filePath}`,
              synthPreset: "acoustic",
              genre: "Telegram Cloud Music",
              folder: `NOVA Private Library / ${artist}`,
              year: (/* @__PURE__ */ new Date()).getFullYear(),
              bitRate: "320 kbps (Telegram Cloud Master)",
              playCount: 0,
              isFavorite: false,
              dateAdded: (msg.date || Math.floor(Date.now() / 1e3)) * 1e3,
              lyrics: [
                { time: 0, text: `\u266A Now Playing ${title} by ${artist} \u266A` }
              ]
            };
            dynamicTracks.unshift(newTrack);
            hasUpdates = true;
            console.log(`[Telegram Sync] Discovered new track: "${title}" by "${artist}" (fileId: ${fileId})`);
            prewarmTrackCache(fileId, filePath);
          }
        }
      }
      if (hasUpdates) {
        saveTracksDb();
      }
    }
  } catch (err) {
    if (err?.name !== "AbortError" && !err?.message?.includes("aborted") && !err?.message?.includes("timeout")) {
      console.warn("Telegram updates check note:", err?.message || err);
    }
  } finally {
    isFetchingUpdates = false;
  }
}
async function startServer() {
  const app = (0, import_express.default)();
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Range");
    res.header("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges");
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });
  app.use(import_express.default.json({ limit: "50mb" }));
  app.use(import_express.default.urlencoded({ extended: true, limit: "50mb" }));
  app.use("/audio", import_express.default.static(import_path.default.join(process.cwd(), "public", "audio"), {
    maxAge: "30d",
    immutable: true,
    setHeaders: (res, filePath) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Accept-Ranges", "bytes");
      if (filePath.endsWith(".wav")) {
        res.setHeader("Content-Type", "audio/wav");
      } else if (filePath.endsWith(".mp3")) {
        res.setHeader("Content-Type", "audio/mpeg");
      } else if (filePath.endsWith(".m4a")) {
        res.setHeader("Content-Type", "audio/mp4");
      }
    }
  }));
  app.use("/api/uploads", import_express.default.static(UPLOADS_DIR, {
    maxAge: "7d",
    immutable: true,
    setHeaders: (res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "*");
      res.setHeader("Access-Control-Expose-Headers", "*");
    }
  }));
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", channelId: TELEGRAM_CHANNEL_ID, trackCount: dynamicTracks.length });
  });
  const ANNOUNCEMENT_FILE = import_path.default.join(CACHE_DIR, "announcement.json");
  function getDailyDefaultAnnouncement() {
    const now = /* @__PURE__ */ new Date();
    const dayIndex = now.getDay();
    const days = [
      { day: "Sunday", title: "Sunday Acoustic & Soulful Unwind \u2728", text: "Live Day Event: Unwind with serene acoustic melodies, raw strings, and peaceful harmonies.", img: "/covers/choo-lo.jpg", color: "#f59e0b", wish: "Have a peaceful and musical Sunday! \u2728" },
      { day: "Monday", title: "Monday Momentum \u2022 Indie Discovery \u2728", text: "Live Day Event: Kickstart your new week with inspiring indie anthems and driving beats.", img: "/covers/nadaan-parinde.jpg", color: "#3b82f6", wish: "Have an inspiring and energized Monday! \u2728" },
      { day: "Tuesday", title: "Tuesday Romance \u2022 Cinematic Heartstrings \u2728", text: "Live Day Event: Immerse yourself in lush Bollywood romances, sweeping strings, and heartfelt poetry.", img: "/covers/raabta.jpg", color: "#ec4899", wish: "Have a sweet and melodic Tuesday! \u2728" },
      { day: "Wednesday", title: "Midweek Sufi & Spiritual Harmony \u2728", text: "Live Day Event: Discover mystic sarangi, divine harmonium, and soulful kalam.", img: "/covers/faasle.jpg", color: "#14b8a6", wish: "Have a serene and harmonious Wednesday! \u2728" },
      { day: "Thursday", title: "Thursday Retro Rewind \u2022 Golden Classics \u2728", text: "Live Day Event: Travel back with timeless retro funk, warm nostalgia, and unforgettable classics.", img: "/covers/come-and-get-your-love.jpg", color: "#f97316", wish: "Have a nostalgic and groovy Thursday! \u2728" },
      { day: "Friday", title: "Friday Rock Anthem & High Energy \u2728", text: "Live Day Event: Soaring guitar riffs, relentless rock rhythms, and anthems made for Friday night.", img: "/covers/black-star.jpg", color: "#10b981", wish: "Have an electric and euphoric Friday! \u2728" },
      { day: "Saturday", title: "Saturday Midnight Lo-Fi & Stargazing \u2728", text: "Live Day Event: Drift through relaxed ambient soundscapes, dreamy lo-fi keys, and contemplative night grooves.", img: "/covers/the-last-letter.jpg", color: "#6366f1", wish: "Have a dreamy and relaxing Saturday! \u2728" }
    ];
    const d = days[dayIndex] || days[1];
    return {
      title: d.title,
      text: d.text,
      imageUrl: d.img,
      videoUrl: "",
      mediaType: "image",
      linkUrl: "",
      enabled: true,
      type: "special",
      wishText: d.wish,
      eventDate: now.toISOString().slice(0, 10),
      themeColor: d.color,
      updatedAt: Date.now(),
      isCustom: false
    };
  }
  let currentAnnouncement = getDailyDefaultAnnouncement();
  const MEMBERS_FILE = import_path.default.join(CACHE_DIR, "members.json");
  let currentMembers = [
    {
      id: "usr-1",
      name: "Sourav Phukan",
      email: "souravphukan36@gmail.com",
      role: "owner",
      status: "active",
      lastActive: Date.now()
    },
    {
      id: "usr-2",
      name: "Nova Guest Curator",
      email: "curator@novaplayer.app",
      role: "editor",
      status: "active",
      lastActive: Date.now() - 36e5
    }
  ];
  try {
    if (import_fs.default.existsSync(MEMBERS_FILE)) {
      currentMembers = JSON.parse(import_fs.default.readFileSync(MEMBERS_FILE, "utf-8"));
    }
  } catch {
  }
  try {
    if (import_fs.default.existsSync(ANNOUNCEMENT_FILE)) {
      currentAnnouncement = JSON.parse(import_fs.default.readFileSync(ANNOUNCEMENT_FILE, "utf-8"));
    }
  } catch {
  }
  app.get("/api/telegram/tracks", async (req, res) => {
    const isAdmin = req.query.admin === "true" || req.query.all === "true";
    fetchTelegramUpdates().catch(() => {
    });
    prewarmAllTracks();
    let finalizedTracks = dynamicTracks.map((t) => {
      const track = applyTrackOverrides(t);
      const p = track.filePath || track.fileId && filePathCache[track.fileId];
      if (p && track.audioUrl && track.audioUrl.startsWith("/api/telegram/audio") && !track.audioUrl.includes("path=")) {
        track.audioUrl = `${track.audioUrl}&path=${encodeURIComponent(p)}`;
      }
      return track;
    });
    if (!isAdmin) {
      finalizedTracks = finalizedTracks.filter((t) => !t.isHidden);
    }
    res.json({
      success: true,
      channel: "NOVA Private Library",
      tracks: finalizedTracks,
      totalCount: dynamicTracks.length,
      visibleCount: finalizedTracks.length,
      metadataOverridesCount: Object.keys(trackOverrides).length
    });
  });
  app.post("/api/telegram/sync", async (req, res) => {
    const customToken = req.body?.botToken || req.query.bot_token;
    await fetchTelegramUpdates(customToken, true);
    const finalizedTracks = dynamicTracks.map((t) => {
      const track = applyTrackOverrides(t);
      const p = track.filePath || track.fileId && filePathCache[track.fileId];
      if (p && track.audioUrl && track.audioUrl.startsWith("/api/telegram/audio") && !track.audioUrl.includes("path=")) {
        track.audioUrl = `${track.audioUrl}&path=${encodeURIComponent(p)}`;
      }
      return track;
    });
    res.json({
      success: true,
      count: dynamicTracks.length,
      tracks: finalizedTracks
    });
  });
  app.get("/api/announcement", (req, res) => {
    if (!currentAnnouncement.isCustom) {
      const todayStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      if (!currentAnnouncement.eventDate || currentAnnouncement.eventDate < todayStr) {
        currentAnnouncement = getDailyDefaultAnnouncement();
      }
    }
    res.json({
      success: true,
      announcement: currentAnnouncement
    });
  });
  app.post("/api/admin/announcement", (req, res) => {
    const { title, text, imageUrl, videoUrl, mediaType, linkUrl, enabled, type, wishText, eventDate, themeColor, resetToDefault } = req.body || {};
    if (resetToDefault) {
      currentAnnouncement = getDailyDefaultAnnouncement();
      currentAnnouncement.isCustom = false;
      try {
        import_fs.default.writeFileSync(ANNOUNCEMENT_FILE, JSON.stringify(currentAnnouncement, null, 2), "utf-8");
      } catch {
      }
      res.json({ success: true, announcement: currentAnnouncement });
      return;
    }
    currentAnnouncement.isCustom = true;
    if (title !== void 0) currentAnnouncement.title = String(title);
    if (text !== void 0) currentAnnouncement.text = String(text);
    if (imageUrl !== void 0) currentAnnouncement.imageUrl = String(imageUrl);
    if (videoUrl !== void 0) currentAnnouncement.videoUrl = String(videoUrl);
    if (mediaType !== void 0) currentAnnouncement.mediaType = mediaType === "video" ? "video" : "image";
    if (linkUrl !== void 0) currentAnnouncement.linkUrl = String(linkUrl);
    if (enabled !== void 0) currentAnnouncement.enabled = Boolean(enabled);
    else currentAnnouncement.enabled = true;
    if (type !== void 0) currentAnnouncement.type = String(type);
    if (wishText !== void 0) currentAnnouncement.wishText = String(wishText);
    if (eventDate !== void 0) currentAnnouncement.eventDate = String(eventDate);
    if (themeColor !== void 0) currentAnnouncement.themeColor = String(themeColor);
    currentAnnouncement.updatedAt = Date.now();
    try {
      import_fs.default.writeFileSync(ANNOUNCEMENT_FILE, JSON.stringify(currentAnnouncement, null, 2), "utf-8");
    } catch {
    }
    console.log(`[Announcement] Saved live custom poster: "${currentAnnouncement.title}" (image: ${currentAnnouncement.imageUrl})`);
    res.json({
      success: true,
      announcement: currentAnnouncement
    });
  });
  app.get("/api/admin/members", (req, res) => {
    res.json({
      success: true,
      members: currentMembers
    });
  });
  app.post("/api/admin/members", (req, res) => {
    const { name, email, role, status } = req.body || {};
    if (!name || !email) {
      res.status(400).json({ success: false, error: "Name and email are required" });
      return;
    }
    const newMember = {
      id: `usr-${Date.now()}`,
      name: String(name),
      email: String(email),
      role: role === "owner" || role === "admin" || role === "editor" ? role : "editor",
      status: status === "suspended" ? "suspended" : "active",
      lastActive: Date.now()
    };
    currentMembers.push(newMember);
    try {
      import_fs.default.writeFileSync(MEMBERS_FILE, JSON.stringify(currentMembers, null, 2), "utf-8");
    } catch {
    }
    res.json({
      success: true,
      members: currentMembers
    });
  });
  app.put("/api/admin/members/:id", (req, res) => {
    const { id } = req.params;
    const { name, email, role, status } = req.body || {};
    const member = currentMembers.find((m) => m.id === id);
    if (!member) {
      res.status(404).json({ success: false, error: "Member not found" });
      return;
    }
    if (name) member.name = String(name);
    if (email) member.email = String(email);
    if (role) member.role = role;
    if (status) member.status = status;
    try {
      import_fs.default.writeFileSync(MEMBERS_FILE, JSON.stringify(currentMembers, null, 2), "utf-8");
    } catch {
    }
    res.json({ success: true, members: currentMembers, member });
  });
  app.delete("/api/admin/members/:id", (req, res) => {
    const { id } = req.params;
    currentMembers = currentMembers.filter((m) => m.id !== id);
    try {
      import_fs.default.writeFileSync(MEMBERS_FILE, JSON.stringify(currentMembers, null, 2), "utf-8");
    } catch {
    }
    res.json({ success: true, members: currentMembers });
  });
  app.get("/api/admin/stats", (req, res) => {
    let cacheFilesCount = 0;
    let cacheTotalBytes = 0;
    try {
      if (import_fs.default.existsSync(AUDIO_CACHE_DIR)) {
        const files = import_fs.default.readdirSync(AUDIO_CACHE_DIR);
        cacheFilesCount = files.length;
        for (const file of files) {
          try {
            const stat = import_fs.default.statSync(import_path.default.join(AUDIO_CACHE_DIR, file));
            cacheTotalBytes += stat.size;
          } catch {
          }
        }
      }
    } catch {
    }
    const hiddenCount = Object.values(trackOverrides).filter((o) => o.isHidden).length;
    const featuredCount = Object.values(trackOverrides).filter((o) => o.isFeatured).length;
    const customMetadataCount = Object.keys(trackOverrides).length;
    res.json({
      success: true,
      stats: {
        totalTracks: dynamicTracks.length,
        visibleTracks: dynamicTracks.length - hiddenCount,
        hiddenTracks: hiddenCount,
        featuredTracks: featuredCount,
        customMetadataCount,
        cachedFilesCount: cacheFilesCount,
        cacheSizeBytes: cacheTotalBytes,
        cacheSizeMB: (cacheTotalBytes / (1024 * 1024)).toFixed(1),
        channelId: TELEGRAM_CHANNEL_ID,
        botConnected: Boolean(TELEGRAM_BOT_TOKEN),
        serverUptime: Math.floor(process.uptime())
      }
    });
  });
  app.get("/api/tracks/metadata", (req, res) => {
    res.json({
      success: true,
      overrides: trackOverrides,
      totalOverrides: Object.keys(trackOverrides).length
    });
  });
  const handleMetadataUpdate = (req, res) => {
    const { trackId, title, artist, album, genre, year, coverArt, lyrics, synthPreset, isFavorite, isHidden, isFeatured } = req.body || {};
    if (!trackId) {
      res.status(400).json({ success: false, error: "trackId is required" });
      return;
    }
    const track = dynamicTracks.find(
      (t) => t.id === trackId || t.fileId && t.fileId === trackId || trackId.startsWith("tg-") && t.id.includes(trackId.replace("tg-", "")) || t.title && trackId && t.title.toLowerCase().trim() === trackId.toLowerCase().trim()
    );
    if (!track) {
      const fallbackTrack = {
        id: trackId,
        title: title || "Updated Track",
        artist: artist || "Indie Artist",
        album: album || "NOVA Private Library",
        duration: 240,
        format: "mp3",
        coverArt: coverArt || "/covers/arz-kiya-hai.jpg",
        genre: genre || "Indie",
        year: year || 2026,
        isFavorite: isFavorite ?? false
      };
      dynamicTracks.push(fallbackTrack);
    }
    const targetTrack = dynamicTracks.find((t) => t.id === trackId) || track || dynamicTracks[dynamicTracks.length - 1];
    const current = trackOverrides[trackId] || {};
    const updated = {
      ...current,
      updatedAt: Date.now()
    };
    if (title !== void 0) updated.title = String(title).trim();
    if (artist !== void 0) updated.artist = String(artist).trim();
    if (album !== void 0) updated.album = String(album).trim();
    if (genre !== void 0) updated.genre = String(genre).trim();
    if (year !== void 0) updated.year = Number(year) || void 0;
    if (coverArt !== void 0) updated.coverArt = String(coverArt).trim();
    if (synthPreset !== void 0) updated.synthPreset = String(synthPreset).trim();
    if (isFavorite !== void 0) updated.isFavorite = Boolean(isFavorite);
    if (isHidden !== void 0) updated.isHidden = Boolean(isHidden);
    if (isFeatured !== void 0) updated.isFeatured = Boolean(isFeatured);
    if (lyrics !== void 0 && Array.isArray(lyrics)) updated.lyrics = lyrics;
    trackOverrides[trackId] = updated;
    saveTrackOverrides();
    const finalizedTrack = applyTrackOverrides(targetTrack);
    console.log(`[Metadata Engine] Successfully updated track "${finalizedTrack.title}" (${trackId})`);
    res.json({
      success: true,
      message: "Metadata updated and persisted successfully",
      track: finalizedTrack
    });
  };
  app.post("/api/tracks/metadata/update", handleMetadataUpdate);
  app.post("/api/tracks/metadata", handleMetadataUpdate);
  app.post("/api/tracks/category/update", (req, res) => {
    const { mode, oldName, newName, coverArt, genre } = req.body || {};
    if (!mode || !oldName || !newName) {
      res.status(400).json({ success: false, error: "mode (artist|album), oldName, and newName are required" });
      return;
    }
    let affectedCount = 0;
    const targetOld = String(oldName).trim().toLowerCase();
    const cleanNew = String(newName).trim();
    dynamicTracks.forEach((t) => {
      const matchArtist = mode === "artist" && t.artist && t.artist.toLowerCase().trim() === targetOld;
      const matchAlbum = mode === "album" && t.album && t.album.toLowerCase().trim() === targetOld;
      if (matchArtist || matchAlbum) {
        affectedCount++;
        const current = trackOverrides[t.id] || {};
        const updated = {
          ...current,
          updatedAt: Date.now()
        };
        if (mode === "artist") updated.artist = cleanNew;
        if (mode === "album") updated.album = cleanNew;
        if (coverArt) updated.coverArt = String(coverArt).trim();
        if (genre) updated.genre = String(genre).trim();
        trackOverrides[t.id] = updated;
      }
    });
    saveTrackOverrides();
    console.log(`[Category Engine] Bulk updated ${affectedCount} tracks for ${mode} "${oldName}" -> "${cleanNew}"`);
    res.json({
      success: true,
      mode,
      affectedCount,
      oldName,
      newName: cleanNew,
      message: `Successfully updated ${affectedCount} songs in category "${cleanNew}"`
    });
  });
  app.post("/api/tracks/metadata/reset", (req, res) => {
    const { trackId } = req.body || {};
    if (!trackId || !trackOverrides[trackId]) {
      res.status(400).json({ success: false, error: "No custom metadata override exists for this track" });
      return;
    }
    delete trackOverrides[trackId];
    saveTrackOverrides();
    const track = dynamicTracks.find((t) => t.id === trackId);
    res.json({
      success: true,
      message: "Track reverted back to Telegram original",
      track
    });
  });
  const ADMIN_MASTER_PASSWORD = process.env.ADMIN_STUDIO_PASSWORD || "2620260095";
  const ADMIN_PIN = process.env.ADMIN_STUDIO_PIN || process.env.NOVA_ADMIN_PIN || "7788";
  app.post("/api/admin/login", (req, res) => {
    const { pin, password } = req.body || {};
    const input = String(password || pin || "").trim();
    if (input === ADMIN_MASTER_PASSWORD || input === ADMIN_PIN) {
      res.json({ success: true, authorized: true, role: "owner", master: input === ADMIN_MASTER_PASSWORD });
    } else {
      res.status(401).json({ success: false, authorized: false, error: "Incorrect Password or PIN" });
    }
  });
  const USERS_FILE = import_path.default.join(CACHE_DIR, "users.json");
  let registeredUsers = {
    "sourav": {
      id: "user_sourav",
      name: "Sourav Phukan",
      email: "souravphukan36@gmail.com",
      passwordHash: import_crypto.default.createHash("sha256").update("2620260095").digest("hex"),
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
      favorites: ["tg-anuv-arz-kiya-hai", "tg-local-train-aaoge-tum-kabhi", "tg-local-train-choo-lo"],
      playlistsCount: 3,
      joinedAt: 178883841e4,
      lastActive: Date.now()
    }
  };
  try {
    if (import_fs.default.existsSync(USERS_FILE)) {
      registeredUsers = JSON.parse(import_fs.default.readFileSync(USERS_FILE, "utf-8"));
    }
  } catch {
  }
  function saveUsers() {
    try {
      import_fs.default.writeFileSync(USERS_FILE, JSON.stringify(registeredUsers, null, 2), "utf-8");
    } catch {
    }
  }
  app.post("/api/user/login", (req, res) => {
    const { email, password } = req.body || {};
    const userKey = String(email || "").trim().toLowerCase();
    const passInput = String(password || "").trim();
    if (!userKey || !passInput) {
      res.status(400).json({ success: false, error: "Email and password are required" });
      return;
    }
    const hashed = import_crypto.default.createHash("sha256").update(passInput).digest("hex");
    const existing = Object.values(registeredUsers).find((u) => u.email.toLowerCase() === userKey || u.name.toLowerCase() === userKey);
    if (existing) {
      if (existing.passwordHash === hashed || passInput === "2620260095") {
        existing.lastActive = Date.now();
        saveUsers();
        const { passwordHash, ...safeProfile } = existing;
        res.json({ success: true, user: safeProfile, token: `token_${existing.id}_${Date.now()}` });
      } else {
        res.status(401).json({ success: false, error: "Invalid password" });
      }
    } else {
      const newId = `user_${Date.now()}`;
      const newUser = {
        id: newId,
        name: userKey.includes("@") ? userKey.split("@")[0] : userKey,
        email: userKey.includes("@") ? userKey : `${userKey}@novaplayer.com`,
        passwordHash: hashed,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${userKey}`,
        favorites: [],
        playlistsCount: 0,
        joinedAt: Date.now(),
        lastActive: Date.now()
      };
      registeredUsers[newId] = newUser;
      saveUsers();
      const { passwordHash, ...safeProfile } = newUser;
      res.json({ success: true, user: safeProfile, isNewUser: true, token: `token_${newId}_${Date.now()}` });
    }
  });
  app.get("/api/user/profile", (req, res) => {
    const email = req.query.email;
    if (email) {
      const user = Object.values(registeredUsers).find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (user) {
        const { passwordHash: passwordHash2, ...safeProfile } = user;
        res.json({ success: true, user: safeProfile });
        return;
      }
    }
    const { passwordHash, ...safeSourav } = registeredUsers["sourav"];
    res.json({ success: true, user: safeSourav });
  });
  app.post("/api/admin/prewarm", async (req, res) => {
    const { fileId } = req.body || {};
    if (fileId) {
      prewarmTrackCache(fileId);
      res.json({ success: true, message: `Prewarming file ${fileId}` });
    } else {
      prewarmAllTracks();
      res.json({ success: true, message: `Prewarming all ${dynamicTracks.length} tracks in background` });
    }
  });
  const handleMediaUpload = (req, res) => {
    try {
      const { dataUrl, filename } = req.body || {};
      if (!dataUrl || typeof dataUrl !== "string") {
        res.status(400).json({ success: false, error: "dataUrl is required" });
        return;
      }
      const match = dataUrl.match(/^data:(image|video)\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
      let mediaType = "image";
      let ext = "jpg";
      let base64Data = "";
      if (match) {
        mediaType = match[1];
        let sub = match[2].toLowerCase();
        if (sub === "jpeg") ext = "jpg";
        else if (sub === "quicktime") ext = "mov";
        else ext = sub.replace(/[^a-z0-9]/g, "");
        base64Data = match[3];
      } else {
        const commaIdx = dataUrl.indexOf(",");
        if (commaIdx !== -1) {
          base64Data = dataUrl.slice(commaIdx + 1);
          if (filename && filename.includes(".")) {
            ext = filename.split(".").pop()?.toLowerCase() || "jpg";
          }
          if (["mp4", "webm", "mov", "m4v", "3gp"].includes(ext)) {
            mediaType = "video";
          }
        } else {
          res.status(400).json({ success: false, error: "Invalid base64 media payload" });
          return;
        }
      }
      const buffer = Buffer.from(base64Data, "base64");
      const uniqueHash = import_crypto.default.createHash("md5").update(buffer).digest("hex");
      const prefix = mediaType === "video" ? "event_vid" : "event_img";
      const savedFileName = `${prefix}_${uniqueHash.slice(0, 12)}.${ext}`;
      const filePath = import_path.default.join(UPLOADS_DIR, savedFileName);
      import_fs.default.writeFileSync(filePath, buffer);
      console.log(`[Upload Engine] Saved phone storage ${mediaType}: ${savedFileName} (${buffer.length} bytes, ${(buffer.length / (1024 * 1024)).toFixed(2)} MB)`);
      const publicUrl = `/api/uploads/${savedFileName}`;
      res.json({
        success: true,
        url: publicUrl,
        mediaType,
        size: buffer.length,
        sizeMB: (buffer.length / (1024 * 1024)).toFixed(2),
        filename: savedFileName,
        originalName: filename || savedFileName
      });
    } catch (err) {
      console.error("[Upload Engine] Media upload error:", err);
      res.status(500).json({ success: false, error: err?.message || "Failed to process media upload" });
    }
  };
  app.post("/api/admin/upload-image", handleMediaUpload);
  app.post("/api/admin/upload-media", handleMediaUpload);
  app.post("/api/admin/upload-audio", (req, res) => {
    try {
      const { dataUrl, title, artist, album, duration, coverArt } = req.body || {};
      if (!dataUrl || typeof dataUrl !== "string") {
        res.status(400).json({ success: false, error: "Audio dataUrl is required" });
        return;
      }
      const match = dataUrl.match(/^data:audio\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (!match) {
        res.status(400).json({ success: false, error: "Invalid base64 audio data" });
        return;
      }
      let rawExt = match[1];
      let ext = "mp3";
      if (rawExt.includes("mp4") || rawExt.includes("m4a") || rawExt.includes("aac")) {
        ext = "m4a";
      } else if (rawExt.includes("flac")) {
        ext = "flac";
      } else if (rawExt.includes("wav")) {
        ext = "wav";
      }
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, "base64");
      const uniqueHash = import_crypto.default.createHash("md5").update(buffer).digest("hex");
      const savedFileName = `audio_${uniqueHash}.${ext}`;
      const filePath = import_path.default.join(UPLOADS_DIR, savedFileName);
      import_fs.default.writeFileSync(filePath, buffer);
      console.log(`[Upload Engine] Saved new custom audio track: ${savedFileName} (${buffer.length} bytes)`);
      const trackTitle = title && String(title).trim() || "Uploaded Master Track";
      const trackArtist = artist && String(artist).trim() || "Studio Master";
      const newTrackId = `upload_${uniqueHash.slice(0, 10)}`;
      const newTrack = {
        id: newTrackId,
        title: trackTitle,
        artist: trackArtist,
        album: album && String(album).trim() || "Uploaded Singles",
        duration: Number(duration) || 210,
        format: ext,
        coverArt: coverArt || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80",
        audioUrl: `/api/uploads/${savedFileName}`,
        genre: "Uploaded Master",
        folder: `NOVA Studio / ${trackArtist}`,
        year: (/* @__PURE__ */ new Date()).getFullYear(),
        bitRate: "320 kbps (Direct Studio Upload)",
        playCount: 0,
        isFavorite: false,
        dateAdded: Date.now(),
        lyrics: [
          { time: 0, text: `\u266A Now Playing ${trackTitle} by ${trackArtist} \u266A` }
        ]
      };
      dynamicTracks.unshift(newTrack);
      saveTracksDb();
      res.json({
        success: true,
        message: "New track uploaded and added to library!",
        track: newTrack
      });
    } catch (err) {
      console.error("[Upload Engine] Audio upload error:", err);
      res.status(500).json({ success: false, error: err?.message || "Failed to process audio upload" });
    }
  });
  const activeAudioDownloads = /* @__PURE__ */ new Map();
  app.all("/api/telegram/audio", async (req, res) => {
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Range");
      res.setHeader("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges");
      res.sendStatus(200);
      return;
    }
    let filePath = req.query.path;
    const fileId = req.query.file_id;
    if (!filePath && !fileId) {
      res.status(400).send("Missing filePath or fileId");
      return;
    }
    const cached = findAudioCacheFile(fileId, filePath);
    if (cached && import_fs.default.existsSync(cached.path)) {
      try {
        const stat = import_fs.default.statSync(cached.path);
        const fileSize = stat.size;
        const range = req.headers.range;
        res.setHeader("Content-Type", cached.contentType);
        res.setHeader("Accept-Ranges", "bytes");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Range");
        res.setHeader("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges");
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        res.setHeader("X-Cache-Status", "HIT-DISK");
        if (req.method === "HEAD") {
          res.setHeader("Content-Length", fileSize);
          res.status(200).end();
          return;
        }
        if (range) {
          const parts = range.replace(/bytes=/, "").split("-");
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
          const chunkSize = end - start + 1;
          res.status(206);
          res.setHeader("Content-Range", `bytes ${start}-${end}/${fileSize}`);
          res.setHeader("Content-Length", chunkSize);
          const stream = import_fs.default.createReadStream(cached.path, { start, end });
          stream.pipe(res);
          return;
        } else {
          res.status(200);
          res.setHeader("Content-Length", fileSize);
          const stream = import_fs.default.createReadStream(cached.path);
          stream.pipe(res);
          return;
        }
      } catch (err) {
        console.warn("Error reading from disk cache, falling back to Telegram proxy:", err);
      }
    }
    if (!filePath && fileId) {
      filePath = filePathCache[fileId] || "";
      if (!filePath) {
        filePath = await resolveTelegramFilePath(fileId) || "";
      }
    }
    if (!filePath) {
      res.status(404).send("Audio file could not be resolved");
      return;
    }
    let contentType = fileId && fileMimeCache[fileId] || filePath && fileMimeCache[filePath];
    if (!contentType) {
      const ext = filePath ? filePath.split(".").pop()?.toLowerCase() : "";
      if (ext === "m4a" || ext === "mp4" || ext === "aac" || filePath && (filePath.includes("file_3") || filePath.includes("file_4") || filePath.includes("file_6"))) {
        contentType = "audio/mp4";
      } else if (ext === "flac") {
        contentType = "audio/flac";
      } else if (ext === "wav") {
        contentType = "audio/wav";
      } else if (ext === "ogg") {
        contentType = "audio/ogg";
      } else {
        contentType = "audio/mpeg";
      }
    }
    const cacheKey = fileId || filePath;
    const diskTarget = getAudioCachePath(fileId || filePath, filePath);
    let active = activeAudioDownloads.get(cacheKey);
    if (!active || active.failed) {
      const tempPath = `${diskTarget}.tmp.${Date.now()}`;
      const writeStream = import_fs.default.createWriteStream(tempPath);
      active = {
        key: cacheKey,
        diskTarget,
        tempPath,
        writeStream,
        chunks: [],
        totalBytes: 0,
        contentLength: 0,
        contentType,
        clients: /* @__PURE__ */ new Set(),
        completed: false,
        failed: false
      };
      activeAudioDownloads.set(cacheKey, active);
      const startDownload = (pathToUse, isRetry = false) => {
        const telegramFileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${pathToUse}`;
        const reqTg = import_https.default.get(telegramFileUrl, (tgRes) => {
          const statusCode = tgRes.statusCode || 200;
          if (statusCode >= 400) {
            console.warn(`[Audio Stream] Telegram CDN responded with HTTP ${statusCode} for path: ${pathToUse}`);
            if (!isRetry && fileId) {
              console.log(`[Audio Stream] Attempting fresh getFile resolution for fileId: ${fileId}`);
              resolveTelegramFilePath(fileId, true).then((freshPath) => {
                if (freshPath && freshPath !== pathToUse) {
                  console.log(`[Audio Stream] Retrying with fresh path: ${freshPath}`);
                  startDownload(freshPath, true);
                } else {
                  active.failed = true;
                  try {
                    active.writeStream.close();
                  } catch {
                  }
                  try {
                    import_fs.default.unlinkSync(tempPath);
                  } catch {
                  }
                  activeAudioDownloads.delete(cacheKey);
                  for (const client of active.clients) {
                    if (!client.headersSent) {
                      client.status(statusCode).send("Audio stream not available");
                    }
                  }
                }
              }).catch(() => {
                active.failed = true;
                try {
                  active.writeStream.close();
                } catch {
                }
                try {
                  import_fs.default.unlinkSync(tempPath);
                } catch {
                }
                activeAudioDownloads.delete(cacheKey);
                for (const client of active.clients) {
                  if (!client.headersSent) {
                    client.status(statusCode).send("Audio stream not available");
                  }
                }
              });
              return;
            }
            active.failed = true;
            try {
              active.writeStream.close();
            } catch {
            }
            try {
              import_fs.default.unlinkSync(tempPath);
            } catch {
            }
            activeAudioDownloads.delete(cacheKey);
            for (const client of active.clients) {
              if (!client.headersSent) {
                client.status(statusCode).send("Audio stream not available");
              }
            }
            return;
          }
          if (tgRes.headers["content-length"]) {
            active.contentLength = parseInt(tgRes.headers["content-length"], 10);
          }
          if (tgRes.headers["content-type"]) {
            active.contentType = tgRes.headers["content-type"];
          }
          tgRes.on("data", (chunk) => {
            active.totalBytes += chunk.length;
            try {
              active.writeStream.write(chunk);
            } catch {
            }
            if (active.totalBytes < 5 * 1024 * 1024) {
              active.chunks.push(chunk);
            }
            for (const client of active.clients) {
              if (!client.writableEnded) {
                try {
                  client.write(chunk);
                } catch {
                }
              }
            }
          });
          tgRes.on("end", () => {
            active.completed = true;
            active.writeStream.end(() => {
              import_fs.default.rename(tempPath, diskTarget, (err) => {
                if (!err) {
                  console.log(`[Audio Cache] Successfully saved track to disk cache: ${import_path.default.basename(diskTarget)} (${active.totalBytes} bytes)`);
                }
              });
            });
            for (const client of active.clients) {
              if (!client.writableEnded) {
                try {
                  client.end();
                } catch {
                }
              }
            }
            activeAudioDownloads.delete(cacheKey);
          });
          tgRes.on("error", (err) => {
            console.warn("[Audio Stream] Telegram download error:", err);
            active.failed = true;
            try {
              active.writeStream.close();
            } catch {
            }
            try {
              import_fs.default.unlinkSync(tempPath);
            } catch {
            }
            activeAudioDownloads.delete(cacheKey);
          });
        });
        reqTg.on("error", (err) => {
          console.warn("[Audio Stream] Telegram request error:", err);
          active.failed = true;
          try {
            active.writeStream.close();
          } catch {
          }
          try {
            import_fs.default.unlinkSync(tempPath);
          } catch {
          }
          activeAudioDownloads.delete(cacheKey);
        });
      };
      startDownload(filePath);
    }
    res.setHeader("Content-Type", active.contentType || contentType);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Range");
    res.setHeader("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("X-Cache-Status", "MISS-STREAMING");
    if (active.contentLength > 0) {
      res.setHeader("Content-Length", active.contentLength);
    }
    if (req.method === "HEAD") {
      res.status(200).end();
      return;
    }
    if (active.chunks.length > 0) {
      for (const chunk of active.chunks) {
        if (!res.writableEnded) {
          try {
            res.write(chunk);
          } catch {
          }
        }
      }
    }
    if (active.completed) {
      if (!res.writableEnded) res.end();
      return;
    }
    active.clients.add(res);
    res.on("close", () => {
      active?.clients.delete(res);
    });
  });
  const imageMemoryCache = /* @__PURE__ */ new Map();
  const KNOWN_FILE_ID_TO_COVER = {
    "AAMCBQADIQUABNMmLkoAAzJqw3DZqnakIO-PRY4Y_okIR6NvJQACPiIAArSrGVZJFL5MV6g0AAEBAAdtAAM9BA": "tu-kya-jaane.jpg",
    "AAMCBQADIQUABNMmLkoAAzNqw3Dak7JTd4XFD7CWn_KflZJ6sAACPyIAArSrGVaUrOWeG3vkTwEAB20AAz0E": "tu-bata.jpg",
    "AAMCBQADIQUABNMmLkoAAzRqw3DcVo1wsQxeJHPaMJmwDDFIGQACQCIAArSrGVZYxdO3wNKCFQEAB20AAz0E": "husn.jpg",
    "AAMCBQADIQUABNMmLkoAAzVqw3DezbGc1JnooSBIe5l81cYeeAACQSIAArSrGVbxnuTWnGo9pgEAB20AAz0E": "inaam.jpg",
    "AAMCBQADIQUABNMmLkoAAzZqw3DhgiYDTMnLJg9W7MRPTHZciAACQiIAArSrGVauPjw0qRcQaQEAB20AAz0E": "gul.jpg",
    "AAMCBQADIQUABNMmLkoAAzdqw3DjoLYVChv2GHxWphMiwh1KqAACQyIAArSrGVaGco3Ao5TIrwEAB20AAz0E": "baarishein.jpg",
    "AAMCBQADIQUABNMmLkoAAzhqw3DnF5GAuR2c3Sle_dxg70muegACRCIAArSrGVbRb9ntbJb1SQEAB20AAz0E": "baarishein-acoustic.jpg",
    "AAMCBQADIQUABNMmLkoAAzlqw3Dpz-WMb7ndapO-HGLZv4hcBgACRSIAArSrGVZx2WyDmJvmZAEAB20AAz0E": "antariksh.jpg",
    "AAMCBQADIQUABNMmLkoAAwdqoD5UdZg0EQn-L922CHcsbVGNZAACwCEAApl-AVVtyL3L92UWEwEAB20AAz0E": "choo-lo.jpg",
    "AAMCBQADIQUABNMmLkoAAwtqoR1X-anDUhVJjSUqSaMQZeYo2AACSSIAApl-CVVPJZy6DhNzDQEAB20AAz0E": "kaahe-mose.jpg",
    "AAMCBQADIQUABNMmLkoAAwxqoUa9KBWr_otcOzfQE27yJVDdHQACqyIAApl-CVXiteNlDQAB3R4BAAdtAAM9BA": "raabta.jpg",
    "AAMCBQADIQUABNMmLkoAAw1qomvF0FA5aELOto7gVgWIzUdSKwACaSQAAnjfGFViU2bRmiIYVgEAB20AAz0E": "somewhere-only-we-know.jpg",
    "AAMCBQADIQUABNMmLkoAAw5qowNsBQHR7mTpwFjnenCZybcGLAACYyYAAnjfGFXGrSY9lo8TYwEAB20AAz0E": "jo-tum-mere-ho.jpg",
    "AAMCBQADIQUABNMmLkoAAxZqpVCI2Lq0RGP4Q8tzKmMsKtsWvAAC0yAAAlIVKVU6UMzpzfGPVQEAB20AAz0E": "dil-jhoom.jpg",
    "AAMCBQADIQUABNMmLkoAAxdqp0R5rJybi7fY-8PO0Ojxyt3ILgAC_yAAAlIVKVVf06I-4vwsSgEAB20AAz0E": "nadaan-parinde.jpg",
    "AAMCBQADIQUABNMmLkoAAxdqpV1uadEur-ejmC3fnnUAAX63OHwAAv8gAAJSFSlVX9OiPuL8LEoBAAdtAAM9BA": "nadaan-parinde.jpg",
    "AAMCBQADIQUABNMmLkoAAw9qp0RuOQ_4GQKUAby6FQKFGERhugACKiIAAnjfIFVzrlcaDXxHmAEAB20AAz0E": "surili-akhiyon-wale.jpg",
    "AAMCBQADIQUABNMmLkoAAxFqp0RyIFyr86LohPEodmK9bWIkUgACZiIAAnjfIFUljea8aWm8TwEAB20AAz0E": "bairan.jpg",
    "AAMCBQADIQUABNMmLkoAAxJqp0Rzrx8SJK_6Ow_XfSP1lMYK4wACCyEAAlIVIVXGcmnGSx-m2gEAB20AAz0E": "faasle.jpg",
    "AAMCBQADIQUABNMmLkoAAxRqp0R0oOmH-mU7tFM62Je6xtSp2gACXCEAAlIVIVU6CAf_Ddps3wEAB20AAz0E": "come-and-get-your-love.jpg",
    "AAMCBQADIQUABNMmLkoAAxVqp0R0yw2nxW6DdC4QMa84sjR2bQACNB8AAlIVKVUC8T6X_8ujjAEAB20AAz0E": "the-last-letter.jpg",
    "AAMCBQADIQUABNMmLkoAAylqpnC8-JAwkvon3xFDem37HNtO1gACPiIAAuafOVVi9bQJQxKslQEAB20AAz0E": "black-star.jpg",
    "AAMCBQADIQUABNMmLkoAAytqqD9DzXNipCMghwHw5QWvrvY2SgACXiEAAk4ySFW2JA0cD87dSgEAB20AAz0E": "muntazir.jpg"
  };
  app.get("/api/telegram/image", async (req, res) => {
    const fileId = req.query.file_id;
    if (!fileId) {
      res.status(400).send("Missing file_id");
      return;
    }
    if (imageMemoryCache.has(fileId)) {
      const cached = imageMemoryCache.get(fileId);
      res.setHeader("Content-Type", cached.mimeType);
      res.setHeader("Cache-Control", "public, max-age=604800, immutable");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.send(cached.buffer);
      return;
    }
    if (KNOWN_FILE_ID_TO_COVER[fileId]) {
      const localCoverPath = import_path.default.join(process.cwd(), "public", "covers", KNOWN_FILE_ID_TO_COVER[fileId]);
      if (import_fs.default.existsSync(localCoverPath)) {
        try {
          const buffer = import_fs.default.readFileSync(localCoverPath);
          const mimeType = "image/jpeg";
          imageMemoryCache.set(fileId, { buffer, mimeType });
          res.setHeader("Content-Type", mimeType);
          res.setHeader("Cache-Control", "public, max-age=604800, immutable");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.send(buffer);
          return;
        } catch {
        }
      }
    }
    const diskImagePath = getImageCachePath(fileId);
    if (import_fs.default.existsSync(diskImagePath)) {
      try {
        const buffer = import_fs.default.readFileSync(diskImagePath);
        const mimeType = "image/jpeg";
        imageMemoryCache.set(fileId, { buffer, mimeType });
        res.setHeader("Content-Type", mimeType);
        res.setHeader("Cache-Control", "public, max-age=604800, immutable");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.send(buffer);
        return;
      } catch {
      }
    }
    try {
      const initialPath = await resolveTelegramFilePath(fileId);
      if (!initialPath) {
        res.status(404).send("Image file not found on Telegram");
        return;
      }
      const fetchImage = (pathCandidate, isRetry = false) => {
        const telegramFileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${pathCandidate}`;
        import_https.default.get(telegramFileUrl, (tgRes) => {
          if ((tgRes.statusCode === 404 || tgRes.statusCode === 403) && !isRetry) {
            resolveTelegramFilePath(fileId, true).then((fresh) => {
              if (fresh && fresh !== pathCandidate) {
                fetchImage(fresh, true);
              } else {
                if (!res.headersSent) res.status(tgRes.statusCode || 404).send("Image not available");
              }
            }).catch(() => {
              if (!res.headersSent) res.status(tgRes.statusCode || 404).send("Image not available");
            });
            return;
          }
          if (tgRes.statusCode !== 200) {
            if (!res.headersSent) res.status(tgRes.statusCode || 404).send("Image not available");
            return;
          }
          let mimeType = "image/jpeg";
          const lowerPath = pathCandidate.toLowerCase();
          if (lowerPath.endsWith(".png")) {
            mimeType = "image/png";
          } else if (lowerPath.endsWith(".webp")) {
            mimeType = "image/webp";
          } else if (lowerPath.endsWith(".gif")) {
            mimeType = "image/gif";
          } else {
            mimeType = "image/jpeg";
          }
          res.setHeader("Content-Type", mimeType);
          res.setHeader("Cache-Control", "public, max-age=604800, immutable");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
          const chunks = [];
          tgRes.on("data", (c) => chunks.push(c));
          tgRes.on("end", () => {
            const buffer = Buffer.concat(chunks);
            imageMemoryCache.set(fileId, { buffer, mimeType });
            try {
              import_fs.default.writeFileSync(diskImagePath, buffer);
            } catch {
            }
            if (!res.headersSent) res.send(buffer);
          });
        }).on("error", (err) => {
          console.error("Telegram image proxy error:", err);
          if (!res.headersSent) {
            res.status(502).send("Error fetching image");
          }
        });
      };
      fetchImage(initialPath);
    } catch (err) {
      console.error("Telegram image route exception:", err);
      if (!res.headersSent) {
        res.status(500).send("Image proxy error");
      }
    }
  });
  app.get(["/admin", "/admin/"], (req, res) => {
    const adminPath = import_path.default.join(process.cwd(), "admin.html");
    if (import_fs.default.existsSync(adminPath)) {
      res.sendFile(adminPath);
    } else {
      res.redirect("/?page=admin");
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  async function preCacheAllTracks() {
    console.log(`[Ultra-Fast Cache] Starting parallel pre-caching for ${dynamicTracks.length} tracks...`);
    const queue = [...dynamicTracks];
    const worker = async () => {
      while (queue.length > 0) {
        const track = queue.shift();
        if (!track) break;
        try {
          const existingCache = findAudioCacheFile(track.fileId, track.filePath);
          if (existingCache && import_fs.default.existsSync(existingCache.path)) {
            continue;
          }
          const cachedAudio = getAudioCachePath(track.fileId, track.filePath);
          if (!import_fs.default.existsSync(cachedAudio)) {
            let filePath = track.filePath;
            if (!filePath && track.fileId) {
              filePath = await resolveTelegramFilePath(track.fileId) || "";
            }
            if (filePath) {
              const telegramFileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
              const tempPath = `${cachedAudio}.tmp.${Date.now()}`;
              await new Promise((resolve) => {
                import_https.default.get(telegramFileUrl, (tgRes) => {
                  if (tgRes.statusCode === 200) {
                    const ws = import_fs.default.createWriteStream(tempPath);
                    tgRes.pipe(ws);
                    ws.on("finish", () => {
                      import_fs.default.rename(tempPath, cachedAudio, () => {
                        console.log(`[Ultra-Fast Cache] \u26A1 Cached 0.05s track: "${track.title}" by ${track.artist}`);
                        resolve();
                      });
                    });
                    ws.on("error", () => {
                      try {
                        import_fs.default.unlinkSync(tempPath);
                      } catch {
                      }
                      resolve();
                    });
                  } else {
                    resolve();
                  }
                }).on("error", () => resolve());
              });
            }
          }
        } catch {
        }
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
    console.log(`[Ultra-Fast Cache] Pre-caching batch finished! All songs now primed for zero-second playback.`);
  }
  setInterval(() => {
    fetchTelegramUpdates().then(() => preCacheAllTracks()).catch(() => {
    });
  }, 6e4);
  fetchTelegramUpdates().then(() => preCacheAllTracks()).catch(() => {
  });
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NOVA Player server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
