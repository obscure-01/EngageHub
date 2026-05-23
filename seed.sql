-- EngageHub Seed Data

-- Insert Admin Account
INSERT INTO users (name, email, password_hash, role, points) VALUES
('Admin User', 'admin@engagehub.edu', '$2a$10$prPT1DjE5qfyTKPnD83dheZMgUQR1NzCEmetrIvIADUyN0Q9pTQDW', 'Admin', 0)
ON CONFLICT (email) DO NOTHING;

-- Insert Student Accounts with Social Profiles
INSERT INTO users (name, email, password_hash, role, points, instagram_username, youtube_handle, linkedin_profile, facebook_profile) VALUES
('Alex Mercer', 'alex@engagehub.edu', '$2a$10$1qKdLuqDaIuyJ4titE3tYOoJtQEK/QrMnJ9miFBL3cOzksjk5p47W', 'Student', 120, 'alex_mercer', '@alexmercer', NULL, NULL),
('Aman Sharma', 'aman@engagehub.edu', '$2a$10$1qKdLuqDaIuyJ4titE3tYOoJtQEK/QrMnJ9miFBL3cOzksjk5p47W', 'Student', 210, 'aman_sharma', NULL, NULL, NULL),
('Priya Verma', 'priya@engagehub.edu', '$2a$10$1qKdLuqDaIuyJ4titE3tYOoJtQEK/QrMnJ9miFBL3cOzksjk5p47W', 'Student', 180, NULL, '@priyaverma', NULL, NULL),
('Rahul Singh', 'rahul@engagehub.edu', '$2a$10$1qKdLuqDaIuyJ4titE3tYOoJtQEK/QrMnJ9miFBL3cOzksjk5p47W', 'Student', 170, NULL, NULL, NULL, NULL),
('Sneha Reddy', 'sneha@engagehub.edu', '$2a$10$1qKdLuqDaIuyJ4titE3tYOoJtQEK/QrMnJ9miFBL3cOzksjk5p47W', 'Student', 150, NULL, NULL, NULL, NULL),
('Ram Sharma', 'ram@engagehub.edu', '$2a$10$1qKdLuqDaIuyJ4titE3tYOoJtQEK/QrMnJ9miFBL3cOzksjk5p47W', 'Student', 15, 'ram_sharma', NULL, NULL, NULL)
ON CONFLICT (email) DO NOTHING;

-- Insert Sample Tasks
INSERT INTO tasks (title, platform, social_link, duration_days, created_at, expiry_date) VALUES
('AI Workshop Reel', 'Instagram', 'https://www.instagram.com/reel/C7zX9JpS1A2/', 2, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '1 day'),
('Tech Fest Highlights Reel', 'Instagram', 'https://www.instagram.com/reel/C8aY0KqT2B3/', 7, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '3 days'),
('Placement Preparation Video', 'YouTube', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 5, CURRENT_TIMESTAMP - INTERVAL '6 days', CURRENT_TIMESTAMP - INTERVAL '1 day'),
('Innovation Showcase Video', 'YouTube', 'https://www.youtube.com/watch?v=3JZ_D3Kz0OA', 14, CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP + INTERVAL '12 days'),
('Career Fair Announcement', 'LinkedIn', 'https://www.linkedin.com/posts/example-career-fair', 14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '14 days'),
('College Hackathon Promo', 'Facebook', 'https://www.facebook.com/example-college-hackathon', 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days')
ON CONFLICT DO NOTHING;

-- Insert Sample Task Completions/Activity
INSERT INTO task_activity (user_id, task_id, status, opened_at, completed_at, time_spent, comment_status, comment_points_awarded) VALUES
((SELECT id FROM users WHERE email = 'alex@engagehub.edu'), (SELECT id FROM tasks WHERE title = 'Tech Fest Highlights Reel'), 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '9 days', CURRENT_TIMESTAMP - INTERVAL '9 days' + INTERVAL '45 seconds', 45, 'Not Attempted', 0),
((SELECT id FROM users WHERE email = 'aman@engagehub.edu'), (SELECT id FROM tasks WHERE title = 'Tech Fest Highlights Reel'), 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '8 days', CURRENT_TIMESTAMP - INTERVAL '8 days' + INTERVAL '32 seconds', 32, 'Not Attempted', 0),
((SELECT id FROM users WHERE email = 'priya@engagehub.edu'), (SELECT id FROM tasks WHERE title = 'Tech Fest Highlights Reel'), 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP - INTERVAL '7 days' + INTERVAL '60 seconds', 60, 'Not Attempted', 0),
((SELECT id FROM users WHERE email = 'aman@engagehub.edu'), (SELECT id FROM tasks WHERE title = 'Placement Preparation Video'), 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '5 days' + INTERVAL '120 seconds', 120, 'Not Attempted', 0),
((SELECT id FROM users WHERE email = 'rahul@engagehub.edu'), (SELECT id FROM tasks WHERE title = 'Placement Preparation Video'), 'OPENED', CURRENT_TIMESTAMP - INTERVAL '4 days', NULL, 0, 'Not Attempted', 0),
-- Ram Sharma Instagram Completed, Comment Detected
((SELECT id FROM users WHERE email = 'ram@engagehub.edu'), (SELECT id FROM tasks WHERE title = 'AI Workshop Reel'), 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '45 seconds', 45, 'Comment Detected', 5),
-- Priya Verma YouTube Completed, Not Attempted
((SELECT id FROM users WHERE email = 'priya@engagehub.edu'), (SELECT id FROM tasks WHERE title = 'Placement Preparation Video'), 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '5 days' + INTERVAL '30 seconds', 30, 'Not Attempted', 0),
-- Rahul Singh Facebook Completed, Platform Not Available
((SELECT id FROM users WHERE email = 'rahul@engagehub.edu'), (SELECT id FROM tasks WHERE title = 'College Hackathon Promo'), 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '25 seconds', 25, 'Platform Not Available', 0)
ON CONFLICT DO NOTHING;

