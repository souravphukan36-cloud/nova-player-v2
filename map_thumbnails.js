import fs from 'fs';
import { DEFAULT_TRACKS } from './src/data/defaultTracks.ts';

const files = [
  '04557933087ef9462888e04100c9b5f0.jpg',
  '0b743c3be42499a62d64bb3477d1f142.jpg',
  '0e772a1cc207b7eff848591c13dde11c.jpg',
  '1892b4dece2ea307feba67edc4b8ce41.jpg',
  '3335e41433e97b490ea21118261efcc3.jpg',
  '460476754aebba1fe8a8e0e1821136ed.jpg',
  '5182d03d59464225e0dc50a7c7e61da8.jpg',
  '5bb81c734ba97a38665516be493c8e72.jpg',
  '5c6dd982dd738291ed06c15d149c3bee.jpg',
  '624ac69d9160cf21b5b5356a6be1aea9.jpg',
  '8b232da98ab8aab20beeeb5d74393a22.jpg',
  'ae7a3b9620e25a5f35df754a91c5c8d4.jpg',
  'b933d37fcd0e2f922e9a46e03b28020c.jpg',
  'b976dc136423b782a45b90ea7c1decc9.jpg',
  'c43fcb4c90f6b58ad97e23dc7aaa0c15.jpg',
  'c98abbdec13569a08c5fb9bb2c791b54.jpg',
  'd412e9f80fc0f2fcc63a96e9b51e1c3c.jpg',
  'd9d1aeb0eec937be829607f01a2c1640.jpg',
  'dffeecd4e16726091ae04acecd9289a4.jpg',
  'ef65b3a0f3b86998ade458e6d0d8e4d7.jpg'
];

console.log('Total tracks:', DEFAULT_TRACKS.length);
DEFAULT_TRACKS.forEach((t, i) => {
  console.log(i + 1, t.id, t.title, '| coverArt:', t.coverArt);
});
