const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function verifyYouTubeFeature() {
  console.log('=== STARTING YOUTUBE COMMENT VERIFICATION TESTS ===');
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  // Helper fetch function
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
    // 0. Clean database for testing (run db:init or similar)
    // Actually, let's register a temporary test student so we have a fresh slate
    const testEmail = `yt_tester_${Date.now()}@test.edu`;
    const regRes = await apiCall('/api/auth/register', 'POST', {
      name: 'YouTube Tester',
      email: testEmail,
      password: 'password123',
      youtube_handle: '' // Starts with no handle
    });
    
    if (regRes.status !== 201) {
      console.error('❌ Failed to register test student:', regRes.data);
      await pool.end();
      return;
    }
    const studentId = regRes.data.user.id;
    console.log(`✅ Test student registered with ID ${studentId} and email ${testEmail}`);

    // Login student
    const loginRes = await apiCall('/api/auth/login', 'POST', {
      email: testEmail,
      password: 'password123'
    });
    const token = loginRes.data.token;
    console.log('✅ Logged in test student.');

    // Find a YouTube task (e.g. Placement Preparation Video, which is expired but we can open it if we mock or create a new active YouTube task)
    // Let's create an active YouTube task via Admin!
    // Login Admin to get token
    const adminLogin = await apiCall('/api/auth/login', 'POST', {
      email: 'admin@engagehub.edu',
      password: 'adminpassword'
    });
    const adminToken = adminLogin.data.token;
    
    // Create new YouTube task
    const taskRes = await apiCall('/api/admin/tasks', 'POST', {
      title: 'YouTube Test Task',
      platform: 'YouTube',
      socialLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      durationDays: 5
    }, adminToken);
    
    if (taskRes.status !== 201) {
      console.error('❌ Failed to create YouTube task:', taskRes.data);
      await pool.end();
      return;
    }
    const taskId = taskRes.data.task.id;
    console.log(`✅ YouTube task created with ID ${taskId}`);

    // --- TEST 1: Open and Complete Task ---
    console.log('\n--- Test 1: Complete Task ---');
    await apiCall(`/api/student/tasks/${taskId}/open`, 'POST', null, token);
    
    // Bypass 20s validation in database directly to proceed quickly
    await pool.query(
      "UPDATE task_activity SET opened_at = NOW() - INTERVAL '30 seconds' WHERE user_id = $1 AND task_id = $2",
      [studentId, taskId]
    );
    
    const completeRes = await apiCall(`/api/student/tasks/${taskId}/complete`, 'POST', null, token);
    console.log('Task completion response:', completeRes.status, completeRes.data.message);
    
    // Verify comment status is 'Not Checked'
    const statusQuery = await pool.query('SELECT comment_status FROM task_activity WHERE user_id = $1 AND task_id = $2', [studentId, taskId]);
    console.log('Initial comment status (Expected: Not Checked):', statusQuery.rows[0].comment_status);
    if (statusQuery.rows[0].comment_status === 'Not Checked') {
      console.log('✅ Passed: Initial comment status is correct.');
    } else {
      console.error('❌ Failed: Initial status is not Not Checked.');
    }

    // --- TEST 2: Verify comment without YouTube Handle ---
    console.log('\n--- Test 2: Verify without YouTube Handle ---');
    const verifyNoHandle = await apiCall(`/api/student/tasks/${taskId}/verify-comment`, 'POST', null, token);
    console.log('Response status:', verifyNoHandle.status);
    console.log('Response body:', verifyNoHandle.data);
    if (verifyNoHandle.data.comment_status === 'YouTube Account Not Available' && verifyNoHandle.data.message.includes('Profile Settings')) {
      console.log('✅ Passed: Correctly blocked due to missing handle.');
    } else {
      console.error('❌ Failed: Incorrect behavior for missing handle.');
    }

    // --- TEST 3: Update handle to a non-commenting handle (Comment Not Found) ---
    console.log('\n--- Test 3: Verify with non-commenting handle (Comment Not Found) ---');
    await apiCall('/api/student/profile/social', 'PUT', {
      youtube_handle: '@nonexistent_handle'
    }, token);
    
    const verifyNotFound = await apiCall(`/api/student/tasks/${taskId}/verify-comment`, 'POST', null, token);
    console.log('Response status:', verifyNotFound.status);
    console.log('Response body:', verifyNotFound.data);
    if (verifyNotFound.data.comment_status === 'Comment Not Found' && verifyNotFound.data.message.includes('No matching comment')) {
      console.log('✅ Passed: Correctly returned Comment Not Found.');
    } else {
      console.error('❌ Failed: Incorrect behavior for Comment Not Found.');
    }

    // --- TEST 4: Update handle to a commenting handle (Comment Verified) ---
    console.log('\n--- Test 4: Verify with commenting handle (Comment Verified) ---');
    await apiCall('/api/student/profile/social', 'PUT', {
      youtube_handle: '@ramsharma' // in mock comments for video dQw4w9WgXcQ
    }, token);

    const verifySuccess = await apiCall(`/api/student/tasks/${taskId}/verify-comment`, 'POST', null, token);
    console.log('Response status:', verifySuccess.status);
    console.log('Response body:', verifySuccess.data);
    if (verifySuccess.data.comment_status === 'Comment Verified' && verifySuccess.data.message.includes('+5 Points')) {
      console.log('✅ Passed: Successfully verified comment and awarded points.');
    } else {
      console.error('❌ Failed: Incorrect behavior for successful verification.');
    }

    // Check points
    const pointsQuery = await pool.query('SELECT points FROM users WHERE id = $1', [studentId]);
    console.log('Current student points (Expected: 15):', pointsQuery.rows[0].points);
    if (pointsQuery.rows[0].points === 15) {
      console.log('✅ Passed: Points awarded correctly (10 for task + 5 for comment).');
    } else {
      console.error('❌ Failed: Points not updated correctly.');
    }

    // --- TEST 5: Double verification attempt (Anti-abuse check) ---
    console.log('\n--- Test 5: Verify twice (Anti-abuse check) ---');
    const verifyTwice = await apiCall(`/api/student/tasks/${taskId}/verify-comment`, 'POST', null, token);
    console.log('Response status (Expected: 400):', verifyTwice.status);
    console.log('Response body:', verifyTwice.data);
    if (verifyTwice.status === 400 && verifyTwice.data.error.includes('already awarded')) {
      console.log('✅ Passed: Correctly blocked double points award.');
    } else {
      console.error('❌ Failed: Incorrect double points prevention behavior.');
    }

    // Clean up test student
    await pool.query('DELETE FROM users WHERE id = $1', [studentId]);
    await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);
    console.log('\n✅ Clean up completed.');
    
    await pool.end();
  } catch (err) {
    console.error('❌ Failed: Connection error:', err.message);
    await pool.end();
  }
}

verifyYouTubeFeature();
