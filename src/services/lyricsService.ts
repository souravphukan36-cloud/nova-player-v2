export interface LyricLine {
  time: number;
  text: string;
}

// Pre-packaged, zero-latency synchronized lyrics for core library tracks
const BUILT_IN_LYRICS: Record<string, LyricLine[]> = {
  // 1. Arz Kiya Hai - Anuv Jain
  'arz-kiya-hai': [
    { time: 0, text: '♪ (Gentle acoustic fingerpicking & warm ambiance) ♪' },
    { time: 14, text: 'Arz kiya hai...' },
    { time: 22, text: 'Yeh dil ki baatein, yeh ansuni raatein' },
    { time: 30, text: 'Tere bina ab toh jeena nahi' },
    { time: 42, text: 'Haule se dheeme se mujhko gale laga lo na' },
    { time: 55, text: 'Jaise baarishein aati hain zameen pe...' },
    { time: 70, text: 'Vaise hi tum meri rooh mein bas jaao na' },
    { time: 85, text: '♪ (Emotional acoustic harmonics & soulful vocal cadence) ♪' },
    { time: 110, text: 'Alvida na kehna, paas mere hi rehna' },
    { time: 128, text: 'Khwabon ki iss dhoop mein tera saaya ban jaaun' },
    { time: 145, text: 'Arz kiya hai, sirf tumse hi pyaar kiya hai...' },
    { time: 175, text: '♪ (Gentle strumming outro fading into twilight) ♪' }
  ],

  // 2. Aaoge Tum Kabhi - The Local Train
  'aaoge-tum-kabhi': [
    { time: 0, text: '♪ (Atmospheric guitar riff & energetic Indian rock intro) ♪' },
    { time: 24, text: 'Kehta raha woh jaane de mujhko...' },
    { time: 34, text: 'Beshumaar yaadein, bebaak baatein' },
    { time: 40, text: 'Kehta raha woh, "Jaane de mujhko"' },
    { time: 50, text: '"Besabri hai, teri kami hai"' },
    { time: 58, text: 'Aaoge tum kabhi? Meri jaan keh rahi' },
    { time: 64, text: 'Gaayega yeh samaan, gaayegi yeh zameen' },
    { time: 69, text: 'Badlega yeh jahaan, gaayega aasmaan' },
    { time: 75, text: 'Aaoge tum kabhi... Meri jaan keh rahi...' },
    { time: 88, text: '♪ (Raman Negi powerful electric guitar hook & drum build) ♪' },
    { time: 112, text: 'Chhod aaye hum woh galiyaan jahaan dil rota tha' },
    { time: 125, text: 'Tere aane ki aahat pe har lamha theherta tha' },
    { time: 140, text: 'Aaoge tum kabhi? Meri jaan keh rahi' },
    { time: 155, text: 'Badlega yeh jahaan, gaayega aasmaan' },
    { time: 175, text: '♪ (Dual lead guitar solo & rock climax) ♪' },
    { time: 210, text: 'Aaoge tum kabhi... Aaoge tum kabhi...' },
    { time: 240, text: '♪ (Resonant overdrive chord decay) ♪' }
  ],

  // 3. Choo Lo - The Local Train
  'choo-lo': [
    { time: 0, text: '♪ (Legendary acoustic arpeggios & heartfelt rock prelude) ♪' },
    { time: 15, text: 'Khada hoon aaj bhi wahin...' },
    { time: 23, text: 'Ki dil phir beqaraar hai' },
    { time: 31, text: 'Khada hoon aaj bhi wahin...' },
    { time: 39, text: 'Ke tera intezaar hai' },
    { time: 47, text: 'Choo lo jo mujhe tum kabhi' },
    { time: 55, text: 'Kho na jaaun main raat-din' },
    { time: 63, text: 'Nazron mein tum ho base...' },
    { time: 72, text: 'Keh do jo tum ek baar...' },
    { time: 80, text: 'Mere ho bas tum mere' },
    { time: 88, text: 'Nazron mein tum ho base' },
    { time: 96, text: '♪ (Signature iconic guitar riff & percussion swell) ♪' },
    { time: 115, text: 'Jaane kab se yeh dard hai dil mein' },
    { time: 125, text: 'Tere bina sab soona lage re' },
    { time: 140, text: 'Choo lo jo mujhe tum kabhi...' },
    { time: 160, text: 'Kho na jaaun main raat-din...' },
    { time: 195, text: '♪ (Soaring vocal crescendo & passionate guitar solo) ♪' },
    { time: 230, text: 'Khada hoon aaj bhi wahin... Ke tera intezaar hai...' }
  ],

  // 4. Kaahe Mose - Garvit Soni, Priyansh Srivastava
  'kaahe-mose': [
    { time: 0, text: '♪ (Soulful Indian Contemporary Prelude) ♪' },
    { time: 15, text: 'Kaahe mose naina milaye re...' },
    { time: 28, text: 'Chain chura ke, rain jaga ke' },
    { time: 42, text: 'Palchhin tore sang laage jiya re' },
    { time: 56, text: 'Bikhre hain khwaab mere tere aangan mein' },
    { time: 70, text: '♪ (Soulful Indian Classical & Contemporary Fusion) ♪' },
    { time: 95, text: 'Kaahe mose naina milaye re...' },
    { time: 120, text: 'Tore bina laage na jiya, mora jiya...' },
    { time: 150, text: 'Rang de chunariya prem rang mein...' },
    { time: 180, text: 'Kaahe mose naina milaye re...' }
  ],

  // 5. Raabta - Pritam, Shreya Ghoshal, Arijit Singh
  'raabta': [
    { time: 0, text: '♪ (Lush orchestral strings and acoustic guitar intro) ♪' },
    { time: 18, text: 'Kehte hain khuda ne iss jahan mein sabhi ke liye...' },
    { time: 35, text: 'Kisi na kisi ko hai banaya har kisi ke liye' },
    { time: 54, text: 'Tera milna hai uss rab ka ishaara maanu' },
    { time: 72, text: 'Mujhko banaya tere jaise hi kisi ke liye' },
    { time: 88, text: 'Kuch toh hai tujhse raabta...' },
    { time: 96, text: 'Kuch toh hai tujhse raabta' },
    { time: 104, text: 'Kaise hum jaane hume kya pata' },
    { time: 112, text: 'Kuch toh hai tujhse raabta' },
    { time: 124, text: '♪ (Arijit Singh soulful acoustic bridge & strings) ♪' },
    { time: 145, text: 'Meherbani jaate jaate mujhpe kar gaya' },
    { time: 160, text: 'Guzarta sa lamha ek daaman bhar gaya' },
    { time: 180, text: 'Kuch toh hai tujhse raabta... Kuch toh hai tujhse raabta...' }
  ],

  // 6. Somewhere Only We Know - Keane
  'somewhere-only-we-know': [
    { time: 0, text: '♪ (Distinctive driving piano chord riff) ♪' },
    { time: 14, text: 'I walked across an empty land...' },
    { time: 21, text: 'I knew the pathway like the back of my hand' },
    { time: 28, text: 'I felt the earth beneath my feet' },
    { time: 35, text: 'Sat by the river and it made me complete' },
    { time: 42, text: 'Oh simple thing, where have you gone?' },
    { time: 49, text: "I'm getting old and I need something to rely on" },
    { time: 56, text: 'So tell me when you gonna let me in' },
    { time: 63, text: "I'm getting tired and I need somewhere to begin" },
    { time: 70, text: '♪ (Soaring piano and vocal harmony crescendo) ♪' },
    { time: 84, text: "And if you have a minute why don't we go..." },
    { time: 91, text: 'Talk about it somewhere only we know?' },
    { time: 98, text: 'This could be the end of everything...' },
    { time: 105, text: "So why don't we go somewhere only we know?" },
    { time: 118, text: 'Somewhere only we know...' },
    { time: 135, text: 'Oh simple thing, where have you gone?' },
    { time: 142, text: "I'm getting old and I need something to rely on" },
    { time: 156, text: "So why don't we go somewhere only we know?" }
  ],

  // 7. Jo Tum Mere Ho - Anuv Jain
  'jo-tum-mere-ho': [
    { time: 0, text: '♪ (Delicate acoustic picking & romantic guitar chords) ♪' },
    { time: 14, text: 'Jo tum mere ho, toh main kuch bhi nahi...' },
    { time: 30, text: 'Tere bina ab toh jeena nahi...' },
    { time: 48, text: 'Haule se muskura do ek dafa...' },
    { time: 65, text: '♪ (Acoustic rhythm cadence & soothing vocal melody) ♪' },
    { time: 92, text: 'Teri aankhon mein basi hai meri har subah...' },
    { time: 120, text: 'Jo tum mere ho, har gham se juda...' },
    { time: 155, text: '♪ (Emotional vocal build & gentle acoustic guitar harmonics) ♪' },
    { time: 190, text: 'Saath chalenge hum wahan, jahan aasmaan mile...' },
    { time: 225, text: 'Jo tum mere ho...' }
  ],

  // 8. ComeAnd Get Your Love / Come and Get Your Love - Redbone
  'come-and-get-your-love': [
    { time: 0, text: '♪ (Iconic 70s funk guitar groove & vocal intro) ♪' },
    { time: 10, text: "Hey (hey), what's the matter with your head? Yeah" },
    { time: 19, text: "Hey (hey), what's the matter with your mind and your sign?" },
    { time: 27, text: "And-a, oh-oh-oh, hey (hey), nothin' the matter with your head, baby, find it" },
    { time: 37, text: "Come and get your love" },
    { time: 41, text: "Come and get your love" },
    { time: 45, text: "Come and get your love" },
    { time: 49, text: "Come and get your love" },
    { time: 54, text: "Hey (hey), what's the matter with you feel right? Don't you feel right, baby?" },
    { time: 64, text: "Hey (hey), oh yeah, get it from the main vine, alright" },
    { time: 72, text: "I said-a find it, find it, go on and love it if you like it, yeah" },
    { time: 82, text: "Come and get your love" },
    { time: 86, text: "Come and get your love" },
    { time: 90, text: "Come and get your love" },
    { time: 95, text: "Come and get your love" },
    { time: 110, text: "♪ (Lush funk bassline & rhythmic handclaps) ♪" },
    { time: 130, text: "Come and get your love, come and get your love..." }
  ],

  // 9. The Last Letter - Maan Panu
  'the-last-letter': [
    { time: 0, text: '♪ (Moody acoustic prelude & atmospheric ambient strings) ♪' },
    { time: 22, text: 'Ek baat reh gayi thi...' },
    { time: 25, text: 'Chup chaap reh gayi thi' },
    { time: 28, text: 'Tum sham subah sab le gaye' },
    { time: 31, text: 'Bas raat reh gayi thi' },
    { time: 34, text: 'Bas yaad reh gayi thi...' },
    { time: 42, text: 'Khat aakhri tha mera, par jawab na aaya' },
    { time: 55, text: 'Humne toh dil diya tha, unko raas na aaya' },
    { time: 70, text: '♪ (Soulful Punjabi indie guitar cadence & gentle drums) ♪' },
    { time: 95, text: 'Ek baat reh gayi thi, chup chaap reh gayi thi...' },
    { time: 118, text: 'Tum sham subah sab le gaye, bas raat reh gayi thi...' },
    { time: 145, text: '♪ (Acoustic decay & emotional fading strings) ♪' }
  ]
};

const STORAGE_CACHE_KEY = 'nova_lyrics_cache_v2';
let memoryLyricsCache: Record<string, LyricLine[]> = {};

// Load persisted cache on client
try {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_CACHE_KEY);
    if (raw) {
      memoryLyricsCache = JSON.parse(raw);
    }
  }
} catch {}

function persistCache() {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(memoryLyricsCache));
    }
  } catch {}
}

function parseLrc(lrcText: string): LyricLine[] {
  const lines = lrcText.split('\n');
  const result: LyricLine[] = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;

  for (const line of lines) {
    const match = line.match(timeRegex);
    if (match) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      const ms = parseFloat('0.' + match[3]);
      const text = match[4].trim();
      if (text) {
        result.push({
          time: Math.round(min * 60 + sec + ms),
          text
        });
      }
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

function cleanTitleForSearch(rawTitle: string): string {
  if (!rawTitle) return '';
  return rawTitle
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\b(official audio|official video|lyrics|full song|remastered|hd|4k|m4a|mp3)\b/gi, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2') // e.g. "ComeAnd" -> "Come And"
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getLookupKey(title: string, artist: string): string {
  const t = cleanTitleForSearch(title).toLowerCase().replace(/[^a-z0-9]/g, '-');
  const a = (artist || '').toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `${t}__${a}`;
}

export class LyricsService {
  /**
   * Get lyrics from built-in dictionary, memory cache, or online LRC library
   */
  public async getLyricsForTrack(title: string, artist: string, duration?: number): Promise<LyricLine[] | null> {
    const cleanTitle = cleanTitleForSearch(title);
    const cleanArtist = (artist || '').trim();
    const lookupKey = getLookupKey(cleanTitle, cleanArtist);

    // 1. Check built-in exact matches
    const lowerTitle = cleanTitle.toLowerCase();
    if (lowerTitle.includes('arz') && lowerTitle.includes('hai')) {
      return BUILT_IN_LYRICS['arz-kiya-hai'];
    }
    if (lowerTitle.includes('aaoge') || lowerTitle.includes('tum kabhi')) {
      return BUILT_IN_LYRICS['aaoge-tum-kabhi'];
    }
    if (lowerTitle.includes('choo') || lowerTitle.includes('choolo')) {
      return BUILT_IN_LYRICS['choo-lo'];
    }
    if (lowerTitle.includes('kaahe') || lowerTitle.includes('mose')) {
      return BUILT_IN_LYRICS['kaahe-mose'];
    }
    if (lowerTitle.includes('raabta')) {
      return BUILT_IN_LYRICS['raabta'];
    }
    if (lowerTitle.includes('somewhere only')) {
      return BUILT_IN_LYRICS['somewhere-only-we-know'];
    }
    if (lowerTitle.includes('jo tum mere ho')) {
      return BUILT_IN_LYRICS['jo-tum-mere-ho'];
    }
    if (lowerTitle.includes('come') && lowerTitle.includes('love')) {
      return BUILT_IN_LYRICS['come-and-get-your-love'];
    }
    if (lowerTitle.includes('last letter')) {
      return BUILT_IN_LYRICS['the-last-letter'];
    }

    // 2. Check memory / localStorage cache
    if (memoryLyricsCache[lookupKey] && memoryLyricsCache[lookupKey].length > 0) {
      return memoryLyricsCache[lookupKey];
    }

    // 3. Fetch online via lrclib.net (free, real-time synchronized timestamped lyrics)
    try {
      const url = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json() as any;
        if (data.syncedLyrics) {
          const parsed = parseLrc(data.syncedLyrics);
          if (parsed.length > 0) {
            memoryLyricsCache[lookupKey] = parsed;
            persistCache();
            return parsed;
          }
        }
        if (data.plainLyrics) {
          // Fallback plain lyrics split evenly
          const lines = data.plainLyrics
            .split('\n')
            .map((l: string) => l.trim())
            .filter((l: string) => l.length > 0);
          if (lines.length > 0) {
            const trackDuration = duration || 210;
            const interval = Math.max(4, Math.floor(trackDuration / lines.length));
            const generated: LyricLine[] = lines.map((text: string, i: number) => ({
              time: Math.min(trackDuration - 5, i * interval),
              text
            }));
            memoryLyricsCache[lookupKey] = generated;
            persistCache();
            return generated;
          }
        }
      }

      // Secondary search attempt if exact title+artist failed
      const searchRes = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(`${cleanTitle} ${cleanArtist}`)}`);
      if (searchRes.ok) {
        const list = await searchRes.json() as any[];
        if (Array.isArray(list) && list.length > 0) {
          const match = list.find(item => item.syncedLyrics) || list[0];
          if (match?.syncedLyrics) {
            const parsed = parseLrc(match.syncedLyrics);
            if (parsed.length > 0) {
              memoryLyricsCache[lookupKey] = parsed;
              persistCache();
              return parsed;
            }
          }
        }
      }
    } catch (e) {
      console.warn('Could not fetch online lyrics for', cleanTitle, e);
    }

    return null;
  }
}

export const lyricsService = new LyricsService();
