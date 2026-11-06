import urllib.request
import urllib.error
import json
import time
import os
import re

TOKEN = '8717270921:AAFxvHPnWWawsJOf8ZONGJXdu-qatjD4X6g'
CHANNEL_ID = '-1003542494794'
CACHE_FILE = '/app/applet/src/data/telegram_recovered_tracks.json'
ALT_CACHE_FILE = '/app/applet/.cache/dynamic_tracks.json'

os.makedirs('/app/applet/src/data', exist_ok=True)
os.makedirs('/app/applet/.cache', exist_ok=True)

# First get highest message_id
url = f'https://api.telegram.org/bot{TOKEN}/sendMessage'
data = json.dumps({'chat_id': CHANNEL_ID, 'text': 'sync_init', 'disable_notification': True}).encode()
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode())
        max_id = res['result']['message_id']
        # Clean up
        del_data = json.dumps({'chat_id': CHANNEL_ID, 'message_id': max_id}).encode()
        del_req = urllib.request.Request(f'https://api.telegram.org/bot{TOKEN}/deleteMessage', data=del_data, headers={'Content-Type': 'application/json'})
        urllib.request.urlopen(del_req)
except Exception as e:
    print('Failed to get max_id, using default 210:', e)
    max_id = 210

print(f'Starting scan for channel message_ids from {max_id} down to 1...')

scanned_tracks = []
seen_ids = set()

def clean_title(title, filename):
    t = title or filename or 'NOVA Track'
    t = re.sub(r'\(PenduJatt\.Com\.Se\)|\(PenduJatt\.Com\)|\[.*?\]', '', t, flags=re.I).strip()
    t = re.sub(r'\.(mp3|m4a|wav|flac|aac|ogg)$', '', t, flags=re.I).strip()
    return t

for mid in range(max_id, 0, -1):
    forward_url = f'https://api.telegram.org/bot{TOKEN}/forwardMessage'
    fwd_data = json.dumps({
        'chat_id': CHANNEL_ID,
        'from_chat_id': CHANNEL_ID,
        'message_id': mid,
        'disable_notification': True
    }).encode()
    fwd_req = urllib.request.Request(forward_url, data=fwd_data, headers={'Content-Type': 'application/json'})
    
    try:
        with urllib.request.urlopen(fwd_req) as resp:
            res = json.loads(resp.read().decode())
            new_msg_id = res['result']['message_id']
            msg = res['result']
            
            # Immediately delete forwarded duplicate
            del_data = json.dumps({'chat_id': CHANNEL_ID, 'message_id': new_msg_id}).encode()
            del_req = urllib.request.Request(f'https://api.telegram.org/bot{TOKEN}/deleteMessage', data=del_data, headers={'Content-Type': 'application/json'})
            urllib.request.urlopen(del_req)
            
            audio = msg.get('audio') or msg.get('document') or msg.get('voice')
            if audio:
                mime = audio.get('mime_type', '')
                fname = audio.get('file_name', '')
                is_audio = mime.startswith('audio/') or mime == 'application/ogg' or fname.lower().endswith(('.mp3', '.m4a', '.wav', '.flac', '.aac', '.ogg'))
                
                if is_audio:
                    file_id = audio.get('file_id')
                    unique_id = audio.get('file_unique_id') or str(mid)
                    if file_id in seen_ids:
                        continue
                    seen_ids.add(file_id)
                    
                    raw_title = audio.get('title') or fname or f'Track {mid}'
                    artist = audio.get('performer') or 'Zubeen Garg'
                    title = clean_title(raw_title, fname)
                    duration = audio.get('duration') or 240
                    fmt = 'm4a' if fname.lower().endswith('.m4a') or mime == 'audio/mp4' else 'mp3'
                    
                    thumb = audio.get('thumbnail') or audio.get('thumb')
                    thumb_file_id = thumb.get('file_id') if thumb else None
                    cover_art = f'/api/telegram/image?file_id={thumb_file_id}' if thumb_file_id else '/covers/the-local-train-artist.jpg'
                    
                    track_item = {
                        'id': f'tg-vault-{unique_id}',
                        'fileId': file_id,
                        'title': title,
                        'artist': artist,
                        'album': 'NOVA Private Vault',
                        'duration': duration,
                        'format': fmt,
                        'coverArt': cover_art,
                        'audioUrl': f'/api/telegram/audio?file_id={file_id}',
                        'genre': 'Assamese / Regional Master',
                        'folder': f'NOVA Private Library / {artist}',
                        'year': 2024,
                        'bitRate': '320 kbps (Telegram Studio Master)',
                        'playCount': 0,
                        'isFavorite': False,
                        'dateAdded': (msg.get('date') or int(time.time())) * 1000,
                        'lyrics': [
                            {'time': 0, 'text': f'♪ {title} - {artist} ♪'}
                        ]
                    }
                    scanned_tracks.append(track_item)
                    print(f'[{len(scanned_tracks)}] Mid {mid}: "{title}" by "{artist}" ({duration}s)')
                    
    except urllib.error.HTTPError as e:
        if e.code == 429:
            print('Telegram rate limit, sleeping 3s...')
            time.sleep(3)
    except Exception as e:
        pass
    
    # Tiny pause to stay well within Telegram limits (30 reqs/sec)
    time.sleep(0.04)

print(f'\nScan complete! Total songs recovered: {len(scanned_tracks)}')

# Save to disk cache JSON and typescript export
with open(CACHE_FILE, 'w', encoding='utf-8') as f:
    json.dump(scanned_tracks, f, indent=2, ensure_ascii=False)

with open(ALT_CACHE_FILE, 'w', encoding='utf-8') as f:
    json.dump(scanned_tracks, f, indent=2, ensure_ascii=False)

ts_file = '/app/applet/src/data/telegramRecoveredTracks.ts'
with open(ts_file, 'w', encoding='utf-8') as f:
    f.write('import { Track } from "../types";\n\n')
    f.write('export const TELEGRAM_VAULT_TRACKS: Track[] = ')
    json.dump(scanned_tracks, f, indent=2, ensure_ascii=False)
    f.write(' as Track[];\n')

print(f'Saved {len(scanned_tracks)} tracks to {CACHE_FILE} and {ts_file}')
