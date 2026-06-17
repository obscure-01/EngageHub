const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/../.env' });

async function run() {
    console.log('--- STARTING DIAGNOSTIC ---');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    try {
        const taskRes = await pool.query("SELECT * FROM tasks WHERE platform='YouTube' ORDER BY id DESC LIMIT 1");
        if (taskRes.rows.length === 0) {
            console.log('No YouTube task found.');
            return;
        }
        const task = taskRes.rows[0];
        console.log('1. Task ID:', task.id);
        console.log('2. Video URL stored:', task.social_link);
        
        function getYouTubeVideoId(url) {
            if (!url) return null;
            try {
                const parsed = new URL(url);
                const hostname = parsed.hostname.toLowerCase();
                const pathname = parsed.pathname;

                if (hostname === 'youtu.be') {
                    const id = pathname.substring(1).split(/[?#]/)[0];
                    return id.length === 11 ? id : null;
                }

                if (hostname.includes('youtube.com')) {
                    if (pathname.startsWith('/shorts/') || pathname.startsWith('/embed/')) {
                        const parts = pathname.split('/');
                        const id = parts[2]?.split(/[?#]/)[0];
                        return (id && id.length === 11) ? id : null;
                    }
                    if (pathname === '/watch') {
                        const id = parsed.searchParams.get('v');
                        return (id && id.length === 11) ? id : null;
                    }
                }
            } catch (e) {
                return null;
            }
            return null;
        }
        
        let videoId = getYouTubeVideoId(task.social_link);
        console.log('3. Extracted video ID:', videoId);
        
        const userRes = await pool.query("SELECT * FROM users WHERE youtube_handle IS NOT NULL AND youtube_handle != '' ORDER BY id DESC LIMIT 1");
        let user = userRes.rows[0];
        if (!user) {
             user = { name: 'TestUser', youtube_handle: '@dummyhandle' };
        }
        console.log('\n8. Student record:');
        console.log('   - student username:', user.name);
        console.log('   - stored YouTube handle:', user.youtube_handle);

        const key = process.env.YOUTUBE_API_KEY;
        const apiEndpoint = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=100&key=${key}`;
        console.log('\n4. Exact YouTube API endpoint:', apiEndpoint.replace(key, '[HIDDEN_KEY]'));
        
        const response = await fetch(apiEndpoint);
        console.log('\n5. HTTP status returned by YouTube:', response.status);
        
        if (response.status !== 200) {
            console.log('\n10. Final reason verification failed: API error (status ' + response.status + ')');
            return;
        }
        
        const data = await response.json();
        const comments = data.items || [];
        console.log('\n6. Number of comments returned:', comments.length);
        
        console.log('\n7. First 10 comments:');
        const first10 = comments.slice(0, 10);
        first10.forEach((item, i) => {
            const snip = item.snippet.topLevelComment.snippet;
            console.log(`\n   Comment ${i + 1}:`);
            console.log(`   - authorDisplayName: ${snip.authorDisplayName}`);
            console.log(`   - authorChannelId: ${snip.authorChannelId?.value}`);
            console.log(`   - comment text: ${snip.textDisplay.substring(0, 50)}...`);
        });

        console.log('\n9. Matching logic:');
        console.log('   - Field used for comparison: authorDisplayName (normalized) vs stored youtube_handle (normalized)');
        
        const cleanB = user.youtube_handle.replace(/^@/, '').toLowerCase().replace(/\s+/g, '');
        let matchFound = false;
        
        first10.forEach((item, i) => {
            const authorName = item.snippet.topLevelComment.snippet.authorDisplayName;
            const cleanA = authorName.replace(/^@/, '').toLowerCase().replace(/\s+/g, '');
            const isMatch = (cleanA === cleanB);
            if (isMatch) matchFound = true;
            console.log(`   - Comment ${i + 1} (${authorName}): Failed -> Expected '${cleanB}', got '${cleanA}'`);
        });
        
        console.log('\n10. Final reason verification failed:');
        if (matchFound) {
            console.log('   Verification ACTUALLY SUCCEEDED for this user.');
        } else {
            console.log('   Handle Mismatch: Could not find any comment matching the stored youtube_handle (' + user.youtube_handle + ') among the retrieved comments.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
