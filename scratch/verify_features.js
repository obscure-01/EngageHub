const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testAll() {
  console.log('=== STARTING ENGAGEHUB FEATURE ENHANCEMENT TESTS ===');
  
  let adminToken = null;
  let studentToken = null;

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

  // 1. Login Admin
  console.log('\n[TEST 1] Login Admin');
  const adminLogin = await apiCall('/api/auth/login', 'POST', {
    email: 'admin@engagehub.edu',
    password: 'adminpassword'
  });
  if (adminLogin.status === 200 && adminLogin.data.token) {
    adminToken = adminLogin.data.token;
    console.log('✅ Admin logged in successfully!');
  } else {
    console.error('❌ Admin login failed:', adminLogin);
    process.exit(1);
  }

  // 2. Login Student (alex@engagehub.edu)
  console.log('\n[TEST 2] Login Student');
  const studentLogin = await apiCall('/api/auth/login', 'POST', {
    email: 'alex@engagehub.edu',
    password: 'studentpassword' // wait, let's try 'studentpassword' or see what password it is
  });
  if (studentLogin.status === 200 && studentLogin.data.token) {
    studentToken = studentLogin.data.token;
    console.log('✅ Student logged in successfully!');
  } else {
    // If 'studentpassword' fails, let's try 'password' or see if they share 'studentpassword'
    console.log('Trying fallback password...');
    const studentLoginFallback = await apiCall('/api/auth/login', 'POST', {
      email: 'alex@engagehub.edu',
      password: 'adminpassword' // maybe adminpassword?
    });
    if (studentLoginFallback.status === 200 && studentLoginFallback.data.token) {
      studentToken = studentLoginFallback.data.token;
      console.log('✅ Student logged in successfully with adminpassword!');
    } else {
      // Let's try 'password123'
      const studentLoginFallback2 = await apiCall('/api/auth/login', 'POST', {
        email: 'alex@engagehub.edu',
        password: 'password123'
      });
      if (studentLoginFallback2.status === 200 && studentLoginFallback2.data.token) {
        studentToken = studentLoginFallback2.data.token;
        console.log('✅ Student logged in successfully with password123!');
      } else {
         console.error('❌ Student login failed:', studentLogin);
         process.exit(1);
      }
    }
  }

  // 3. Create tasks for LinkedIn and Facebook
  console.log('\n[TEST 3] Admin Create Tasks for LinkedIn and Facebook');
  
  // LinkedIn task (7 days duration)
  const lnCreate = await apiCall('/api/admin/tasks', 'POST', {
    title: 'LinkedIn Network Expansion Post',
    platform: 'LinkedIn',
    socialLink: 'https://www.linkedin.com/posts/expansion',
    durationDays: 7
  }, adminToken);
  console.log('LinkedIn creation status:', lnCreate.status, lnCreate.data.message);
  if (lnCreate.status === 201) {
    console.log('✅ LinkedIn task created. Expiry:', lnCreate.data.task.expiry_date);
  } else {
    console.error('❌ Failed LinkedIn creation:', lnCreate.data);
  }

  // Facebook task (3 days duration)
  const fbCreate = await apiCall('/api/admin/tasks', 'POST', {
    title: 'Facebook Alumni Meet Group',
    platform: 'Facebook',
    socialLink: 'https://www.facebook.com/groups/alumni',
    durationDays: 3
  }, adminToken);
  console.log('Facebook creation status:', fbCreate.status, fbCreate.data.message);
  if (fbCreate.status === 201) {
    console.log('✅ Facebook task created. Expiry:', fbCreate.data.task.expiry_date);
  } else {
    console.error('❌ Failed Facebook creation:', fbCreate.data);
  }

  // 4. Student View Pending Tasks
  console.log('\n[TEST 4] Student View Pending Tasks (Should show active tasks including new LinkedIn and Facebook, but NOT expired tasks)');
  const studentTasks = await apiCall('/api/student/tasks', 'GET', null, studentToken);
  if (studentTasks.status === 200) {
    console.log('Pending Tasks count:', studentTasks.data.length);
    const expiredTasks = studentTasks.data.filter(t => new Date(t.expiry_date) < new Date());
    if (expiredTasks.length === 0) {
      console.log('✅ Success: Zero expired tasks returned to the student!');
    } else {
      console.error('❌ Failure: Expired tasks were returned to student:', expiredTasks);
    }
    
    // Check if new platforms are visible
    const platformsSeen = studentTasks.data.map(t => t.platform);
    console.log('Platforms in pending list:', [...new Set(platformsSeen)]);
    if (platformsSeen.includes('LinkedIn') && platformsSeen.includes('Facebook')) {
      console.log('✅ Success: New platforms LinkedIn and Facebook successfully visible to student!');
    } else {
      console.error('❌ Failure: LinkedIn/Facebook tasks not in student pending list.');
    }
  } else {
    console.error('❌ Failed to fetch student tasks:', studentTasks.data);
  }

  // 5. Admin Manage Tasks list
  console.log('\n[TEST 5] Admin View Tasks list (Should return all tasks with assigned_count and completed_count)');
  const adminTasks = await apiCall('/api/admin/tasks', 'GET', null, adminToken);
  if (adminTasks.status === 200) {
    console.log('Total tasks in system:', adminTasks.data.length);
    const sampleTask = adminTasks.data[0];
    console.log('Sample Task assigned_count:', sampleTask.assigned_count, 'completed_count:', sampleTask.completed_count);
    if (sampleTask.assigned_count !== undefined && sampleTask.completed_count !== undefined) {
      console.log('✅ Success: assigned_count and completed_count returned successfully!');
    } else {
      console.error('❌ Failure: missing counts in task list response.');
    }
  } else {
    console.error('❌ Failed to fetch admin tasks:', adminTasks.data);
  }

  // 6. Admin Analytics
  console.log('\n[TEST 6] Admin View Analytics');
  const analytics = await apiCall('/api/admin/analytics', 'GET', null, adminToken);
  if (analytics.status === 200) {
    console.log('Overview stats:', analytics.data.overview);
    console.log('✅ Success: Analytics retrieved successfully!');
  } else {
    console.error('❌ Failed to retrieve analytics:', analytics.data);
  }

  // 7. Student Try to Complete Expired Task
  console.log('\n[TEST 7] Student Try to Open/Complete Expired Task (Should fail)');
  // Let's find an expired task from seed data (e.g. 'Placement Preparation Video' or 'Tech Fest Highlights Reel')
  const dbPool = new Pool({ connectionString: process.env.DATABASE_URL });
  const expiredTaskRes = await dbPool.query("SELECT id FROM tasks WHERE title = 'Placement Preparation Video'");
  await dbPool.end();

  if (expiredTaskRes.rows.length > 0) {
    const expiredTaskId = expiredTaskRes.rows[0].id;
    console.log('Found expired task ID:', expiredTaskId);
    const openRes = await apiCall(`/api/student/tasks/${expiredTaskId}/open`, 'POST', null, studentToken);
    console.log('Open expired task response status:', openRes.status, 'Body:', openRes.data);
    if (openRes.status === 400 && openRes.data.error.includes('expired')) {
      console.log('✅ Success: Open rejected due to task expiry!');
    } else {
      console.error('❌ Failure: Expected task open to be rejected with 400.');
    }
  } else {
    console.log('⚠️ Warning: Expired task "Placement Preparation Video" not found in DB.');
  }

  console.log('\n=== ALL TESTS COMPLETED ===');
}

testAll();
