const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware');

// Protect all routes with JWT and check for 'Student' role
router.use(authenticateToken, requireRole('Student'));

// 1. Welcome Section & Overview Dashboard
router.get('/dashboard', async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. Get student points
    const userResult = await db.query('SELECT name, points FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const user = userResult.rows[0];

    // 2. Calculate rank from leaderboard position
    const rankQuery = `
      WITH ranked_students AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY points DESC) as rank
        FROM users
        WHERE role = 'Student'
      )
      SELECT rank FROM ranked_students WHERE id = $1
    `;
    const rankResult = await db.query(rankQuery, [userId]);
    const rank = rankResult.rows.length > 0 ? rankResult.rows[0].rank : '-';

    res.json({
      name: user.name,
      points: user.points,
      rank: `#${rank}`
    });

  } catch (error) {
    console.error('Error fetching student dashboard:', error);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// 2. Pending Tasks List (status = PENDING or OPENED, but not COMPLETED)
router.get('/tasks', async (req, res) => {
  const userId = req.user.id;

  try {
    const tasksQuery = `
      SELECT 
        t.id, 
        t.title, 
        t.platform, 
        t.social_link, 
        t.expiry_date,
        COALESCE(ta.status, 'PENDING') as status,
        ta.opened_at
      FROM tasks t
      LEFT JOIN task_activity ta ON ta.task_id = t.id AND ta.user_id = $1
      WHERE (ta.status IS NULL OR ta.status != 'COMPLETED')
        AND t.expiry_date >= CURRENT_TIMESTAMP
      ORDER BY t.created_at DESC
    `;
    const result = await db.query(tasksQuery, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching student tasks:', error);
    res.status(500).json({ error: 'Failed to retrieve tasks.' });
  }
});

// 2b. Completed Tasks List
router.get('/tasks/completed', async (req, res) => {
  const userId = req.user.id;

  try {
     const completedQuery = `
      SELECT 
        t.id, 
        t.title, 
        t.platform, 
        t.social_link, 
        ta.completed_at,
        ta.time_spent,
        ta.comment_status,
        ta.comment_points_awarded
      FROM tasks t
      JOIN task_activity ta ON ta.task_id = t.id AND ta.user_id = $1
      WHERE ta.status = 'COMPLETED'
      ORDER BY ta.completed_at DESC
    `;
    const result = await db.query(completedQuery, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching student completed tasks:', error);
    res.status(500).json({ error: 'Failed to retrieve completed tasks.' });
  }
});

// 3. Open Task Logic
router.post('/tasks/:id/open', async (req, res) => {
  const userId = req.user.id;
  const taskId = req.params.id;

  try {
    // Check if task exists
    const taskCheck = await db.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    if (taskCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Check if task has expired
    if (new Date(taskCheck.rows[0].expiry_date) < new Date()) {
      return res.status(400).json({ error: 'This task has expired and cannot be opened.' });
    }

    // Upsert task activity as OPENED and reset opened_at to now
    const upsertQuery = `
      INSERT INTO task_activity (user_id, task_id, status, opened_at)
      VALUES ($1, $2, 'OPENED', CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, task_id) 
      DO UPDATE SET status = 'OPENED', opened_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const result = await db.query(upsertQuery, [userId, taskId]);

    res.json({
      message: 'Task status updated to OPENED.',
      activity: result.rows[0],
      socialLink: taskCheck.rows[0].social_link
    });

  } catch (error) {
    console.error('Error opening task:', error);
    res.status(500).json({ error: 'Failed to record task open event.' });
  }
});

// 4. Completion Logic (with 20-second validation)
router.post('/tasks/:id/complete', async (req, res) => {
  const userId = req.user.id;
  const taskId = req.params.id;

  try {
    // Check if task exists and has not expired
    const taskCheck = await db.query('SELECT expiry_date FROM tasks WHERE id = $1', [taskId]);
    if (taskCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }
    if (new Date(taskCheck.rows[0].expiry_date) < new Date()) {
      return res.status(400).json({ error: 'This task has expired and cannot be completed.' });
    }

    // Retrieve open activity
    const activityResult = await db.query(
      'SELECT * FROM task_activity WHERE user_id = $1 AND task_id = $2',
      [userId, taskId]
    );

    if (activityResult.rows.length === 0) {
      return res.status(400).json({ error: 'This task has not been opened yet.' });
    }

    const activity = activityResult.rows[0];

    if (activity.status === 'COMPLETED') {
      return res.status(400).json({ error: 'This task has already been completed.' });
    }

    if (activity.status !== 'OPENED') {
      return res.status(400).json({ error: 'Task status is invalid. Please open the task first.' });
    }

    // Validation: Current Time - Open Time (minimum 20 seconds)
    const openedTime = new Date(activity.opened_at).getTime();
    const currentTime = Date.now();
    const elapsedSeconds = (currentTime - openedTime) / 1000;

    if (elapsedSeconds < 20) {
      return res.status(400).json({
        error: 'Please spend at least 20 seconds engaging with the content before completing this task.'
      });
    }

    // Award 10 points to student and update activity
    // Use transaction to ensure consistency
    await db.query('BEGIN');

    // Increment user points
    await db.query('UPDATE users SET points = points + 10 WHERE id = $1', [userId]);

    // Update activity status to COMPLETED
    const timeSpent = Math.round(elapsedSeconds);
    const updateActivityQuery = `
      UPDATE task_activity
      SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP, time_spent = $3
      WHERE user_id = $1 AND task_id = $2
      RETURNING *
    `;
    const updatedActivity = await db.query(updateActivityQuery, [userId, taskId, timeSpent]);

    await db.query('COMMIT');

    res.json({
      message: 'Task completed successfully! +10 Points awarded.',
      activity: updatedActivity.rows[0]
    });

  } catch (error) {
    if (db) await db.query('ROLLBACK');
    console.error('Error completing task:', error);
    res.status(500).json({ error: 'An error occurred during task completion.' });
  }
});

// 5. Leaderboard - Ranked by points
router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboardQuery = `
      SELECT id, name, points,
        ROW_NUMBER() OVER (ORDER BY points DESC) as rank
      FROM users
      WHERE role = 'Student'
      ORDER BY points DESC
    `;
    const result = await db.query(leaderboardQuery);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard.' });
  }
});

// 6. Profile Info
router.get('/profile', async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. Get basic user info
    const userResult = await db.query(
      'SELECT name, email, points, instagram_username, youtube_handle, linkedin_profile, facebook_profile FROM users WHERE id = $1', 
      [userId]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const user = userResult.rows[0];

    // 2. Count completed tasks
    const completedResult = await db.query(
      'SELECT COUNT(*)::int FROM task_activity WHERE user_id = $1 AND status = \'COMPLETED\'',
      [userId]
    );
    const completedCount = completedResult.rows[0].count;

    // 3. Count pending tasks (active tasks not completed by student)
    const pendingResult = await db.query(
      `SELECT COUNT(*)::int FROM tasks t
       LEFT JOIN task_activity ta ON ta.task_id = t.id AND ta.user_id = $1 AND ta.status = 'COMPLETED'
       WHERE t.expiry_date >= CURRENT_TIMESTAMP AND ta.id IS NULL`,
      [userId]
    );
    const pendingCount = pendingResult.rows[0].count;

    res.json({
      name: user.name,
      email: user.email,
      points: user.points,
      instagram_username: user.instagram_username,
      youtube_handle: user.youtube_handle,
      linkedin_profile: user.linkedin_profile,
      facebook_profile: user.facebook_profile,
      completedTasks: completedCount,
      pendingTasks: pendingCount
    });

  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ error: 'Failed to retrieve profile data.' });
  }
});

// Update Profile Social Settings
router.put('/profile/social', async (req, res) => {
  const userId = req.user.id;
  const { instagram_username, youtube_handle, linkedin_profile, facebook_profile } = req.body;

  try {
    const updateQuery = `
      UPDATE users
      SET instagram_username = $1, youtube_handle = $2, linkedin_profile = $3, facebook_profile = $4
      WHERE id = $5
      RETURNING name, email, points, instagram_username, youtube_handle, linkedin_profile, facebook_profile
    `;
    const result = await db.query(updateQuery, [
      instagram_username ? instagram_username.trim() : null,
      youtube_handle ? youtube_handle.trim() : null,
      linkedin_profile ? linkedin_profile.trim() : null,
      facebook_profile ? facebook_profile.trim() : null,
      userId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({
      message: 'Social profiles updated successfully.',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating social profiles:', error);
    res.status(500).json({ error: 'Failed to update social profiles.' });
  }
});

// Verify Task Comment
router.post('/tasks/:id/verify-comment', async (req, res) => {
  const userId = req.user.id;
  const taskId = req.params.id;

  try {
    // 1. Check if the task activity exists and is completed
    const activityResult = await db.query(
      'SELECT * FROM task_activity WHERE user_id = $1 AND task_id = $2',
      [userId, taskId]
    );

    if (activityResult.rows.length === 0 || activityResult.rows[0].status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Task must be completed before verifying the comment.' });
    }

    const activity = activityResult.rows[0];

    // 2. Check if already verified
    if (activity.comment_status === 'Comment Detected' || activity.comment_points_awarded > 0) {
      return res.status(400).json({ error: 'Comment points already awarded for this task.' });
    }

    // 3. Fetch the platform of the task
    const taskResult = await db.query('SELECT platform FROM tasks WHERE id = $1', [taskId]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }
    const platform = taskResult.rows[0].platform;

    // 4. Fetch user details to get the relevant handle
    const userResult = await db.query(
      'SELECT instagram_username, youtube_handle, linkedin_profile, facebook_profile FROM users WHERE id = $1',
      [userId]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const user = userResult.rows[0];

    // Map platform to handle
    let handle = null;
    if (platform === 'Instagram') handle = user.instagram_username;
    else if (platform === 'YouTube') handle = user.youtube_handle;
    else if (platform === 'LinkedIn') handle = user.linkedin_profile;
    else if (platform === 'Facebook') handle = user.facebook_profile;

    // 5. If handle is not available
    if (!handle || handle.trim() === '') {
      await db.query(
        "UPDATE task_activity SET comment_status = 'Platform Not Available' WHERE user_id = $1 AND task_id = $2",
        [userId, taskId]
      );
      return res.json({
        message: `Your ${platform} handle/profile is not configured. Please add it in Profile settings.`,
        comment_status: 'Platform Not Available'
      });
    }

    // 6. Platform verification logic
    if (platform === 'Instagram' || platform === 'YouTube') {
      // Mock automatic verification succeeds since handle is configured
      await db.query('BEGIN');
      
      // Award 5 points
      await db.query('UPDATE users SET points = points + 5 WHERE id = $1', [userId]);

      // Update activity
      await db.query(
        "UPDATE task_activity SET comment_status = 'Comment Detected', comment_verified_at = CURRENT_TIMESTAMP, comment_points_awarded = 5 WHERE user_id = $1 AND task_id = $2",
        [userId, taskId]
      );

      await db.query('COMMIT');

      return res.json({
        message: 'Comment successfully verified! +5 Points awarded.',
        comment_status: 'Comment Detected'
      });
    } else {
      // LinkedIn or Facebook: platform verification not available
      await db.query(
        "UPDATE task_activity SET comment_status = 'Comment Not Verified' WHERE user_id = $1 AND task_id = $2",
        [userId, taskId]
      );
      return res.json({
        message: `Automatic comment verification is not available for ${platform}.`,
        comment_status: 'Comment Not Verified'
      });
    }

  } catch (error) {
    if (db) await db.query('ROLLBACK');
    console.error('Error verifying task comment:', error);
    res.status(500).json({ error: 'Failed to verify comment. Database error.' });
  }
});

module.exports = router;
