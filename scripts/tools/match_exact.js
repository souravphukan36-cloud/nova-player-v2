import fs from 'fs';

// All 17 tracks
const tracks = [
  { id: 'tg-anuv-arz-kiya-hai', title: 'Arz Kiya Hai', cover: '/covers/arz-kiya-hai.jpg' },
  { id: 'tg-local-train-aaoge-tum-kabhi', title: 'Aaoge Tum Kabhi', cover: '/covers/aaoge-tum-kabhi.jpg' },
  { id: 'tg-local-train-choo-lo', title: 'Choo Lo', cover: '/covers/choo-lo.jpg' },
  { id: 'tg-garvit-kaahe-mose', title: 'Kaahe Mose', cover: '/covers/kaahe-mose.jpg' },
  { id: 'tg-pritam-raabta', title: 'Raabta (Kehte Hain Khuda Ne)', cover: '/covers/raabta.jpg' },
  { id: 'tg-keane-somewhere-only-we-know', title: 'Somewhere Only We Know', cover: '/covers/somewhere-only-we-know.jpg' },
  { id: 'tg-anuv-jo-tum-mere-ho', title: 'Jo Tum Mere Ho', cover: '/covers/jo-tum-mere-ho.jpg' },
  { id: 'tg-arijit-dil-jhoom', title: 'Dil Jhoom', cover: '/covers/dffeecd4e16726091ae04acecd9289a4.jpg' },
  { id: 'tg-nadaan-parinde', title: 'Nadaan Parinde', cover: '/covers/c43fcb4c90f6b58ad97e23dc7aaa0c15.jpg' },
  { id: 'tg-AgADFSEAAuafMVU', title: 'Kaise Hua', cover: '/covers/5c6dd982dd738291ed06c15d149c3bee.jpg' },
  { id: 'tg-sajid-wajid-surili-akhiyon-wale', title: 'Surili Akhiyon Wale', cover: '/covers/460476754aebba1fe8a8e0e1821136ed.jpg' },
  { id: 'tg-banjaare-bairan', title: 'Bairan', cover: '/covers/0b743c3be42499a62d64bb3477d1f142.jpg' },
  { id: 'tg-kaavish-faasle', title: 'Faasle', cover: '/covers/ef65b3a0f3b86998ade458e6d0d8e4d7.jpg' },
  { id: 'tg-redbone-come-and-get-your-love', title: 'Come And Get Your Love', cover: '/covers/624ac69d9160cf21b5b5356a6be1aea9.jpg' },
  { id: 'tg-maan-panu-last-letter', title: 'The Last Letter', cover: '/covers/d412e9f80fc0f2fcc63a96e9b51e1c3c.jpg' },
  { id: 'tg-radiohead-black-star', title: 'Black Star', cover: '/covers/b976dc136423b782a45b90ea7c1decc9.jpg' },
  { id: 'tg-AgADXiEAAk4ySFU', title: 'Muntazir', cover: '/covers/c98abbdec13569a08c5fb9bb2c791b54.jpg' }
];

console.log('Verifying all covers exist in public/covers:');
let ok = true;
tracks.forEach((t, i) => {
  const filePath = 'public' + t.cover;
  const exists = fs.existsSync(filePath);
  if (!exists) ok = false;
  console.log(`${i+1}. ${t.title} -> ${t.cover} [${exists ? 'EXISTS' : 'MISSING'}]`);
});
console.log('All files exist:', ok);
