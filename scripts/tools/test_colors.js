import fs from 'fs';
const dir = 'public/covers';
const hashes = [
  '0b743c3be42499a62d64bb3477d1f142.jpg',
  '460476754aebba1fe8a8e0e1821136ed.jpg',
  '5c6dd982dd738291ed06c15d149c3bee.jpg',
  '624ac69d9160cf21b5b5356a6be1aea9.jpg',
  'b976dc136423b782a45b90ea7c1decc9.jpg',
  'c43fcb4c90f6b58ad97e23dc7aaa0c15.jpg',
  'c98abbdec13569a08c5fb9bb2c791b54.jpg',
  'd412e9f80fc0f2fcc63a96e9b51e1c3c.jpg',
  'd9d1aeb0eec937be829607f01a2c1640.jpg',
  'dffeecd4e16726091ae04acecd9289a4.jpg',
  'ef65b3a0f3b86998ade458e6d0d8e4d7.jpg'
];
console.log('Testing 11 images:');
hashes.forEach((h, idx) => {
  console.log(idx, h);
});
