const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// 1. Unit testing functions locally
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
    
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2] && match[2].length === 11) {
      return match[2];
    }
  } catch (e) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2] && match[2].length === 11) {
      return match[2];
    }
  }
  return null;
}

function matchYouTubeHandle(authorName, userHandle) {
  if (!authorName || !userHandle) return false;

  const clean = (s) => s.toLowerCase().replace(/@/g, '').replace(/\s+/g, '');
  
  const cleanA = clean(authorName);
  const cleanB = clean(userHandle);

  if (cleanA === cleanB) return true;

  const stripSpecial = (s) => s.replace(/[^a-z0-9]/g, '');
  if (stripSpecial(cleanA) === stripSpecial(cleanB)) return true;

  const hasSuffixMatch = (str, base) => {
    const regex = new RegExp('^' + base + '[-_][a-z0-9]*[0-9][a-z0-9]*$');
    return regex.test(str);
  };

  const hasStrippedSuffixMatch = (str, base) => {
    const strippedStr = stripSpecial(str);
    const strippedBase = stripSpecial(base);
    if (strippedStr.startsWith(strippedBase)) {
      const suffix = strippedStr.substring(strippedBase.length);
      const hasDigit = /[0-9]/.test(suffix);
      const suffixRegex = new RegExp('[-_]' + suffix + '$');
      return hasDigit && suffixRegex.test(str) && suffix.length >= 2 && suffix.length <= 7;
    }
    return false;
  };

  return hasSuffixMatch(cleanA, cleanB) || hasSuffixMatch(cleanB, cleanA) ||
         hasStrippedSuffixMatch(cleanA, cleanB) || hasStrippedSuffixMatch(cleanB, cleanA);
}

function runUnitTests() {
  console.log('=== RUNNING UNIT TESTS ===');

  // Test URL Extraction
  const urlTests = [
    { url: 'https://www.youtube.com/shorts/EQoL38MIuPQ', expected: 'EQoL38MIuPQ' },
    { url: 'https://youtube.com/shorts/EQoL38MIuPQ', expected: 'EQoL38MIuPQ' },
    { url: 'https://www.youtube.com/watch?v=EQoL38MIuPQ', expected: 'EQoL38MIuPQ' },
    { url: 'https://youtube.com/watch?v=EQoL38MIuPQ', expected: 'EQoL38MIuPQ' },
    { url: 'https://m.youtube.com/watch?v=EQoL38MIuPQ', expected: 'EQoL38MIuPQ' },
    { url: 'https://youtu.be/EQoL38MIuPQ', expected: 'EQoL38MIuPQ' },
    { url: 'https://www.youtube.com/embed/EQoL38MIuPQ', expected: 'EQoL38MIuPQ' },
    { url: 'https://invalid-url.com/something', expected: null },
    { url: '', expected: null }
  ];

  for (const t of urlTests) {
    const res = getYouTubeVideoId(t.url);
    if (res === t.expected) {
      console.log(`✅ URL test passed for: ${t.url} -> ${res}`);
    } else {
      console.error(`❌ URL test FAILED for: ${t.url}. Expected: ${t.expected}, Got: ${res}`);
    }
  }

  // Test Handle Normalization
  const handleTests = [
    { stored: '@HarshKumar-dq8hg', returned: 'HarshKumar-dq8hg', expected: true },
    { stored: '@HarshKumar-dq8hg', returned: 'Harsh Kumar', expected: true },
    { stored: '@HarshKumar-dq8hg', returned: '@HarshKumar-dq8hg', expected: true },
    { stored: '@HarshKumar-dq8hg', returned: 'Harsh', expected: false },
    { stored: '@harsh_kumar', returned: 'Harsh Kumar', expected: true },
    { stored: '@alexmercer', returned: 'alexmercer', expected: true }
  ];

  for (const t of handleTests) {
    const res = matchYouTubeHandle(t.returned, t.stored);
    if (res === t.expected) {
      console.log(`✅ Handle test passed for: Stored: ${t.stored} vs Returned: ${t.returned} -> ${res}`);
    } else {
      console.error(`❌ Handle test FAILED for: Stored: ${t.stored} vs Returned: ${t.returned}. Expected: ${t.expected}, Got: ${res}`);
    }
  }
}

// 2. Running HTTP API Tests against the server
async function runHttpTests() {
  console.log('\n=== RUNNING HTTP API TESTS ===');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const apiCall = async (url, method, body, token) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`http://localhost:3000${url}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json();
    return { status: res.status, data };
  };

  try {
    // Register test student
    const testEmail = `edge_tester_${Date.now()}@test.edu`;
    const regRes = await apiCall('/api/auth/register', 'POST', {
      name: 'Edge Tester',
      email: testEmail,
      password: 'password123',
      youtube_handle: '@HarshKumar-dq8hg'
    });
    
    if (regRes.status !== 201) {
      console.error('❌ Failed to register test student:', regRes.data);
      await pool.end();
      return;
    }
    const studentId = regRes.data.user.id;
    console.log(`✅ Registered test student with handle @HarshKumar-dq8hg, ID: ${studentId}`);

    // Login student
    const loginRes = await apiCall('/api/auth/login', 'POST', {
      email: testEmail,
      password: 'password123'
    });
    const token = loginRes.data.token;

    // Login Admin
    const adminLogin = await apiCall('/api/auth/login', 'POST', {
      email: 'admin@engagehub.edu',
      password: 'adminpassword'
    });
    const adminToken = adminLogin.data.token;

    // Helper to setup a YouTube task
    const createYouTubeTask = async (socialLink) => {
      const taskRes = await apiCall('/api/admin/tasks', 'POST', {
        title: `YouTube Test Task - ${Date.now()}`,
        platform: 'YouTube',
        socialLink,
        durationDays: 5
      }, adminToken);
      return taskRes.data.task.id;
    };

    // Helper to open and complete a task for our test student
    const completeTaskForStudent = async (taskId) => {
      await apiCall(`/api/student/tasks/${taskId}/open`, 'POST', null, token);
      await pool.query(
        "UPDATE task_activity SET opened_at = NOW() - INTERVAL '30 seconds' WHERE user_id = $1 AND task_id = $2",
        [studentId, taskId]
      );
      await apiCall(`/api/student/tasks/${taskId}/complete`, 'POST', null, token);
    };

    // --- CASE 1: Video ID Extraction Failed ---
    console.log('\n--- Case 1: Video ID Extraction Failed ---');
    const task1 = await createYouTubeTask('https://invalid-link.com/watch');
    await completeTaskForStudent(task1);
    const verify1 = await apiCall(`/api/student/tasks/${task1}/verify-comment`, 'POST', null, token);
    console.log('Response status:', verify1.status);
    console.log('Response body:', verify1.data);
    if (verify1.data.comment_status === 'Video ID Extraction Failed') {
      console.log('✅ Passed: Extraction failure correctly detected.');
    } else {
      console.error('❌ Failed: Expected Video ID Extraction Failed.');
    }

    // --- CASE 2: Video Not Found (notfound123) ---
    console.log('\n--- Case 2: Video Not Found ---');
    const task2 = await createYouTubeTask('https://www.youtube.com/watch?v=notfound123');
    await completeTaskForStudent(task2);
    const verify2 = await apiCall(`/api/student/tasks/${task2}/verify-comment`, 'POST', null, token);
    console.log('Response status:', verify2.status);
    console.log('Response body:', verify2.data);
    if (verify2.data.comment_status === 'Video Not Found') {
      console.log('✅ Passed: Video Not Found correctly detected.');
    } else {
      console.error('❌ Failed: Expected Video Not Found.');
    }

    // --- CASE 3: Comment Not Found (emptycomm12) ---
    console.log('\n--- Case 3: Comment Not Found ---');
    const task3 = await createYouTubeTask('https://www.youtube.com/watch?v=emptycomm12');
    await completeTaskForStudent(task3);
    const verify3 = await apiCall(`/api/student/tasks/${task3}/verify-comment`, 'POST', null, token);
    console.log('Response status:', verify3.status);
    console.log('Response body:', verify3.data);
    if (verify3.data.comment_status === 'Comment Not Found') {
      console.log('✅ Passed: Comment Not Found correctly detected.');
    } else {
      console.error('❌ Failed: Expected Comment Not Found.');
    }

    // --- CASE 4: Handle Mismatch (exist comments, but none from student) ---
    console.log('\n--- Case 4: Handle Mismatch ---');
    // Using video dQw4w9WgXcQ which has comments, but none from @HarshKumar-dq8hg
    const task4 = await createYouTubeTask('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await completeTaskForStudent(task4);
    const verify4 = await apiCall(`/api/student/tasks/${task4}/verify-comment`, 'POST', null, token);
    console.log('Response status:', verify4.status);
    console.log('Response body:', verify4.data);
    if (verify4.data.comment_status === 'Handle Mismatch') {
      console.log('✅ Passed: Handle Mismatch correctly detected.');
    } else {
      console.error('❌ Failed: Expected Handle Mismatch.');
    }

    // --- CASE 5: Verification Successful (Shorts URL, matching mock comments) ---
    console.log('\n--- Case 5: Verification Successful ---');
    const task5 = await createYouTubeTask('https://www.youtube.com/shorts/EQoL38MIuPQ');
    await completeTaskForStudent(task5);
    const verify5 = await apiCall(`/api/student/tasks/${task5}/verify-comment`, 'POST', null, token);
    console.log('Response status:', verify5.status);
    console.log('Response body:', verify5.data);
    if (verify5.data.comment_status === 'Verification Successful') {
      console.log('✅ Passed: Verification Successful correctly detected.');
    } else {
      console.error('❌ Failed: Expected Verification Successful.');
    }

    // Clean up
    await pool.query('DELETE FROM users WHERE id = $1', [studentId]);
    await pool.query('DELETE FROM tasks WHERE id IN ($1, $2, $3, $4, $5)', [task1, task2, task3, task4, task5]);
    console.log('\n✅ Database cleaned up.');
    await pool.end();
  } catch (err) {
    console.error('❌ HTTP test connection error:', err.message);
    await pool.end();
  }
}

runUnitTests();
runHttpTests();
