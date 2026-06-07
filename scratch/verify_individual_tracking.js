async function runTests() {
  console.log('=== STARTING INDIVIDUAL STUDENT TASK TRACKING TESTS ===');

  let adminToken = null;

  // Step 0: Login as Admin to get a token
  console.log('\nStep 0: Logging in as Admin...');
  try {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@engagehub.edu',
        password: 'adminpassword'
      })
    });
    const data = await res.json();
    if (res.status === 200 && data.token) {
      adminToken = data.token;
      console.log('✅ Passed: Logged in successfully!');
    } else {
      console.log('❌ Failed: Could not login as Admin. Response:', res.status, data);
      return;
    }
  } catch (err) {
    console.log('❌ Failed: Connection error during login:', err.message);
    return;
  }

  // Test 1: Fetch Task Tracking Data (GET /api/admin/tracking)
  console.log('\nTest 1: Fetching General Task Tracking Data...');
  let sampleStudentId = null;
  try {
    const res = await fetch('http://localhost:3000/api/admin/tracking', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    if (res.status === 200 && Array.isArray(data)) {
      console.log(`✅ Passed: Tracking data fetched successfully! (${data.length} records)`);
      if (data.length > 0) {
        const record = data[0];
        console.log('Sample record keys match expected:');
        console.log(' - student_id:', record.student_id);
        console.log(' - student_name:', record.student_name);
        console.log(' - task_id:', record.task_id);
        console.log(' - task_title:', record.task_title);
        console.log(' - platform:', record.platform);
        console.log(' - status:', record.status);
        console.log(' - opened_at:', record.opened_at);
        console.log(' - completed_at:', record.completed_at);
        console.log(' - points_earned:', record.points_earned);
        
        sampleStudentId = record.student_id;
        
        // Assertions
        if (
          record.student_id !== undefined &&
          record.student_name !== undefined &&
          record.task_id !== undefined &&
          record.task_title !== undefined &&
          record.platform !== undefined &&
          record.status !== undefined &&
          record.points_earned !== undefined
        ) {
          console.log('✅ Passed: Schema validation passed!');
        } else {
          console.log('❌ Failed: One or more expected keys are missing from tracking record.');
        }
      } else {
        console.log('⚠️ Warning: No tracking records found (maybe no students or tasks exist yet).');
      }
    } else {
      console.log('❌ Failed: Expected 200 with tracking records list, got:', res.status, data);
    }
  } catch (err) {
    console.log('❌ Failed: Connection error:', err.message);
  }

  // Test 2: Fetch Student's Individual Task Progress (GET /api/admin/students/:id/tasks)
  if (sampleStudentId) {
    console.log(`\nTest 2: Fetching individual progress for Student ID ${sampleStudentId}...`);
    try {
      const res = await fetch(`http://localhost:3000/api/admin/students/${sampleStudentId}/tasks`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.status === 200 && data.studentName && Array.isArray(data.tasks)) {
        console.log('✅ Passed: Successfully fetched student tasks list!');
        console.log('Student Name:', data.studentName);
        console.log(`Assigned tasks count: ${data.tasks.length}`);
        if (data.tasks.length > 0) {
          const taskRecord = data.tasks[0];
          console.log('Sample task record details:');
          console.log(' - task_id:', taskRecord.task_id);
          console.log(' - task_title:', taskRecord.task_title);
          console.log(' - platform:', taskRecord.platform);
          console.log(' - status:', taskRecord.status);
          console.log(' - opened_at:', taskRecord.opened_at);
          console.log(' - completed_at:', taskRecord.completed_at);
        }
      } else {
        console.log('❌ Failed: Expected 200 with student tasks payload, got:', res.status, data);
      }
    } catch (err) {
      console.log('❌ Failed: Connection error:', err.message);
    }
  } else {
    console.log('\n⚠️ Skipped Test 2: No sample student ID available.');
  }

  console.log('\n=== INDIVIDUAL STUDENT TASK TRACKING TESTS COMPLETED ===');
}

runTests();
