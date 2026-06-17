/**
 * DIAGNOSTIC SCRIPT — Read-only. No source files modified.
 * Tests the YouTube Data API v3 key directly from .env.
 * Run: node scratch/test_youtube_api.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const apiKey = process.env.YOUTUBE_API_KEY;

console.log('\n=== YouTube API Key Live Test ===\n');

if (!apiKey || apiKey.trim() === '') {
  console.log('YOUTUBE_API_KEY Present : FALSE');
  console.log('HTTP Status             : N/A — no key to test');
  console.log('Response Body           : N/A');
  console.log('Google Error Message    : N/A');
  console.log('Key Valid               : FALSE (key is absent from .env)');
  console.log('\n=================================\n');
  process.exit(0);
}

// Known public video: "Rick Astley - Never Gonna Give You Up"
const VIDEO_ID = 'dQw4w9WgXcQ';
const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${VIDEO_ID}&key=${apiKey.trim()}`;

console.log(`YOUTUBE_API_KEY Present : TRUE`);
console.log(`Test Video ID           : ${VIDEO_ID}`);
console.log(`Endpoint                : https://www.googleapis.com/youtube/v3/videos`);
console.log(`\nMaking request...\n`);

fetch(url)
  .then(async (response) => {
    const status = response.status;
    const body = await response.json();

    console.log(`HTTP Status             : ${status}`);

    if (!response.ok) {
      const errBlock = body?.error;
      console.log(`Google Error Code       : ${errBlock?.code ?? 'N/A'}`);
      console.log(`Google Error Message    : ${errBlock?.message ?? JSON.stringify(body)}`);
      console.log(`Google Error Reason     : ${errBlock?.errors?.[0]?.reason ?? 'N/A'}`);
      console.log(`Key Valid               : FALSE`);
    } else {
      const itemCount = body?.items?.length ?? 0;
      console.log(`Items returned          : ${itemCount}`);
      if (itemCount > 0) {
        console.log(`Video Title             : ${body.items[0].snippet?.title ?? 'N/A'}`);
      }
      console.log(`Google Error Message    : None`);
      console.log(`Key Valid               : TRUE`);
    }

    console.log('\n=================================\n');
  })
  .catch((err) => {
    console.log(`HTTP Status             : N/A — network error`);
    console.log(`Google Error Message    : ${err.message}`);
    console.log(`Key Valid               : UNKNOWN (network failure)`);
    console.log('\n=================================\n');
  });
