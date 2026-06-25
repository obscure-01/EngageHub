// Admin Dashboard Javascript - EngageHub

document.addEventListener('DOMContentLoaded', () => {
    // 1. Authenticate and enforce Admin role
    const adminUser = checkAuth('Admin');
    if (!adminUser) return; // checkAuth will handle redirect

    // DOM Elements - Sidebar Navigation (Desktop & Mobile)
    const views = {
        dashboard: {
            nav: document.getElementById('nav-dashboard'),
            mobNav: document.getElementById('mobile-nav-dashboard'),
            section: document.getElementById('view-dashboard-section'),
            title: 'Dashboard Overview',
            subtitle: 'Monitor task engagement and student performance.'
        },
        createTask: {
            nav: document.getElementById('nav-create-task'),
            mobNav: document.getElementById('mobile-nav-create-task'),
            section: document.getElementById('view-create-task-section'),
            title: 'Create Task',
            subtitle: 'Assign an Instagram reel or YouTube video task to all registered students.'
        },
        manageTasks: {
            nav: document.getElementById('nav-manage-tasks'),
            mobNav: document.getElementById('mobile-nav-manage-tasks'),
            section: document.getElementById('view-manage-tasks-section'),
            title: 'Manage Tasks',
            subtitle: 'Review all active tasks and delete them when necessary.'
        },
        analytics: {
            nav: document.getElementById('nav-analytics'),
            mobNav: document.getElementById('mobile-nav-analytics'),
            section: document.getElementById('view-analytics-section'),
            title: 'Analytics Insights',
            subtitle: 'Detailed institutional participation metrics.'
        },
        students: {
            nav: document.getElementById('nav-students'),
            mobNav: document.getElementById('mobile-nav-students'),
            section: document.getElementById('view-students-section'),
            title: 'Student Management',
            subtitle: 'View, track, and manage student accounts.'
        },
        tracking: {
            nav: document.getElementById('nav-tracking'),
            mobNav: document.getElementById('mobile-nav-tracking'),
            section: document.getElementById('view-tracking-section'),
            title: 'Student Task Tracking',
            subtitle: 'Track task status and points earned by individual students.'
        },
        leaderboard: {
            nav: document.getElementById('nav-leaderboard'),
            mobNav: document.getElementById('mobile-nav-leaderboard'),
            section: document.getElementById('view-leaderboard-section'),
            title: 'Leaderboard Rankings',
            subtitle: 'Rankings of students sorted by total points accumulated.'
        },
        verificationLogs: {
            nav: document.getElementById('nav-verification-logs'),
            mobNav: document.getElementById('mobile-nav-verification-logs'),
            section: document.getElementById('view-verification-logs-section'),
            title: 'Verification Audit Logs',
            subtitle: 'Permanent audit records of comment verification attempts.'
        },
        settings: {
            nav: document.getElementById('nav-settings'),
            mobNav: document.getElementById('mobile-nav-settings'),
            section: document.getElementById('view-settings-section'),
            title: 'System Settings',
            subtitle: 'Configure external integrations and administrative preferences.'
        }
    };

    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');
    const headerActions = document.getElementById('header-actions');
    const btnCreateTaskHeader = document.getElementById('btn-create-task-header');

    // Navigation state controller
    function switchView(viewKey) {
        // Toggle view sections
        Object.keys(views).forEach(key => {
            const v = views[key];
            if (key === viewKey) {
                v.section.classList.remove('hidden');
                if (v.nav) {
                    v.nav.classList.add('text-primary-fixed-dim', 'font-bold', 'bg-on-secondary-container');
                    v.nav.classList.remove('text-secondary-fixed-dim', 'font-normal');
                }
                if (v.mobNav) {
                    v.mobNav.classList.add('text-primary-fixed-dim', 'font-bold', 'bg-on-secondary-container');
                    v.mobNav.classList.remove('text-secondary-fixed-dim', 'font-normal');
                }
                pageTitle.textContent = v.title;
                pageSubtitle.textContent = v.subtitle;
            } else {
                v.section.classList.add('hidden');
                if (v.nav) {
                    v.nav.classList.remove('text-primary-fixed-dim', 'font-bold', 'bg-on-secondary-container');
                    v.nav.classList.add('text-secondary-fixed-dim', 'font-normal');
                }
                if (v.mobNav) {
                    v.mobNav.classList.remove('text-primary-fixed-dim', 'font-bold', 'bg-on-secondary-container');
                    v.mobNav.classList.add('text-secondary-fixed-dim', 'font-normal');
                }
            }
        });

        // Hide header action create button if already on Create page
        if (viewKey === 'createTask') {
            headerActions.classList.add('hidden');
        } else {
            headerActions.classList.remove('hidden');
        }

        // Fetch data relevant to the active view
        if (viewKey === 'dashboard') {
            fetchDashboardOverview();
            fetchRecentTasks();
        } else if (viewKey === 'manageTasks') {
            fetchManageTasksList();
        } else if (viewKey === 'analytics') {
            fetchAnalytics();
        } else if (viewKey === 'students') {
            fetchStudentsList();
        } else if (viewKey === 'tracking') {
            fetchTrackingData();
        } else if (viewKey === 'leaderboard') {
            fetchLeaderboard();
        } else if (viewKey === 'verificationLogs') {
            fetchVerificationLogs();
        } else if (viewKey === 'settings') {
            fetchSettings();
        }
        
        // Close mobile sidebar if open
        document.getElementById('mobile-sidebar').classList.add('hidden');
    }

    // Attach click events to nav items
    Object.keys(views).forEach(key => {
        const v = views[key];
        if (v.nav) v.nav.addEventListener('click', () => switchView(key));
        if (v.mobNav) v.mobNav.addEventListener('click', () => switchView(key));
    });

    // Mobile sidebar toggle
    const mobileSidebar = document.getElementById('mobile-sidebar');
    document.getElementById('mobile-menu-toggle').addEventListener('click', () => {
        mobileSidebar.classList.remove('hidden');
    });
    document.getElementById('mobile-menu-close').addEventListener('click', () => {
        mobileSidebar.classList.add('hidden');
    });
    mobileSidebar.addEventListener('click', (e) => {
        if (e.target === mobileSidebar) mobileSidebar.classList.add('hidden');
    });

    // Link top right dashboard header button to switch view
    btnCreateTaskHeader.addEventListener('click', () => switchView('createTask'));
    document.getElementById('btn-view-all-tasks').addEventListener('click', () => switchView('manageTasks'));
    document.getElementById('btn-cancel-create').addEventListener('click', () => switchView('dashboard'));

    // Logout triggers
    document.getElementById('btn-logout').addEventListener('click', logout);
    document.getElementById('btn-mobile-logout').addEventListener('click', logout);

    // Toast notifications
    const toast = document.getElementById('admin-toast');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');

    function showToast(message, isError = false) {
        toastMessage.textContent = message;
        if (isError) {
            toastIcon.textContent = 'error';
            toastIcon.className = 'material-symbols-outlined text-error';
            toast.className = 'bg-surface border-l-4 border-error p-4 flex items-center justify-between shadow-lg max-w-xl transition-all duration-200 mb-6';
        } else {
            toastIcon.textContent = 'check_circle';
            toastIcon.className = 'material-symbols-outlined text-tertiary';
            toast.className = 'bg-surface border-l-4 border-tertiary p-4 flex items-center justify-between shadow-lg max-w-xl transition-all duration-200 mb-6';
        }
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 5000);
    }

    // API Helper utility
    async function apiRequest(url, options = {}) {
        const token = getToken();
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
        const config = { ...options, headers: { ...headers, ...options.headers } };
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    clearAuth();
                    window.location.href = '/';
                }
                throw new Error(data.error || 'Server error');
            }
            return data;
        } catch (error) {
            console.error(`API Error for ${url}:`, error);
            throw error;
        }
    }

    // ──────────────────────────────────────────────────────────
    // DATA FETCHERS & RENDERING
    // ──────────────────────────────────────────────────────────

    // 1. Dashboard KPI Cards Overview
    async function fetchDashboardOverview() {
        try {
            const data = await apiRequest('/api/admin/overview');
            document.getElementById('kpi-total-students').textContent = data.totalStudents.toLocaleString();
            document.getElementById('kpi-total-tasks').textContent = data.totalTasks.toLocaleString();
            document.getElementById('kpi-engagement-rate').textContent = data.engagementRate;
            document.getElementById('kpi-pending-students').textContent = data.pendingStudents.toLocaleString();
        } catch (error) {
            showToast('Failed to load overview statistics', true);
        }
    }

    // Platform helper
    function getPlatformBadge(platform) {
        const plat = platform.toLowerCase();
        if (plat === 'instagram') {
            return {
                icon: 'photo_camera',
                class: 'bg-error-container text-on-error-container border-[#fbdfe1]'
            };
        } else if (plat === 'youtube') {
            return {
                icon: 'play_circle',
                class: 'bg-primary-container text-on-primary-container border-[#d0e2ff]'
            };
        } else if (plat === 'linkedin') {
            return {
                icon: 'work',
                class: 'bg-tertiary-container text-on-tertiary-container border-[#a7f0ba]'
            };
        } else if (plat === 'facebook') {
            return {
                icon: 'thumb_up',
                class: 'bg-primary-container text-on-primary-container border-primary/20'
            };
        }
        return {
            icon: 'link',
            class: 'bg-secondary-container text-on-secondary-container border-[#e0e0e0]'
        };
    }

    // Tab switching state for Manage Tasks
    let currentTasksTab = 'active';

    const btnActiveTab = document.getElementById('btn-active-tasks-tab');
    const btnPreviousTab = document.getElementById('btn-previous-tasks-tab');
    if (btnActiveTab && btnPreviousTab) {
        btnActiveTab.addEventListener('click', () => {
            currentTasksTab = 'active';
            updateTasksTabUI();
        });
        btnPreviousTab.addEventListener('click', () => {
            currentTasksTab = 'previous';
            updateTasksTabUI();
        });
    }

    function updateTasksTabUI() {
        const activeTabBtn = document.getElementById('btn-active-tasks-tab');
        const previousTabBtn = document.getElementById('btn-previous-tasks-tab');
        const activeContainer = document.getElementById('active-tasks-container');
        const previousContainer = document.getElementById('previous-tasks-container');

        if (!activeTabBtn || !previousTabBtn) return;

        if (currentTasksTab === 'active') {
            activeTabBtn.className = 'px-6 py-3 border-b-2 border-primary text-primary font-semibold text-sm focus:outline-none transition-colors';
            previousTabBtn.className = 'px-6 py-3 text-secondary hover:text-on-surface font-semibold text-sm focus:outline-none transition-colors';
            activeContainer.classList.remove('hidden');
            previousContainer.classList.add('hidden');
        } else {
            previousTabBtn.className = 'px-6 py-3 border-b-2 border-primary text-primary font-semibold text-sm focus:outline-none transition-colors';
            activeTabBtn.className = 'px-6 py-3 text-secondary hover:text-on-surface font-semibold text-sm focus:outline-none transition-colors';
            previousContainer.classList.remove('hidden');
            activeContainer.classList.add('hidden');
        }
    }

    // 2. Dashboard Recent Tasks Table (Active Only)
    async function fetchRecentTasks() {
        const listContainer = document.getElementById('recent-tasks-list');
        listContainer.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-sm text-on-surface-variant">Loading tasks...</td></tr>';
        
        try {
            const tasks = await apiRequest('/api/admin/tasks');
            // Filter to only active ones for the dashboard recent view
            const activeOnly = tasks.filter(task => new Date(task.expiry_date) >= new Date());
            
            if (activeOnly.length === 0) {
                listContainer.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-sm text-on-surface-variant">No active tasks created yet. Click "Create Task" to add one.</td></tr>';
                return;
            }

            // Limit to 5 tasks for dashboard view
            const recent = activeOnly.slice(0, 5);
            listContainer.innerHTML = recent.map((task) => {
                const badge = getPlatformBadge(task.platform);

                return `
                    <tr class="hover:bg-surface-container-low/50 transition-colors">
                        <td class="px-6 py-4">
                            <div class="font-medium text-on-surface">${escapeHTML(task.title)}</div>
                            <div class="text-xs text-secondary mt-0.5">Created: ${new Date(task.created_at).toLocaleDateString()}</div>
                        </td>
                        <td class="px-6 py-4">
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${badge.class}">
                                <span class="material-symbols-outlined text-[14px]">${badge.icon}</span>
                                ${task.platform}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-right font-medium">10</td>
                        <td class="px-6 py-4 text-right">
                            <a href="${task.social_link}" target="_blank" class="text-primary hover:bg-primary-fixed p-1.5 rounded-DEFAULT transition-colors inline-block align-middle" title="Open Link">
                                <span class="material-symbols-outlined text-[18px]">open_in_new</span>
                            </a>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            listContainer.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-sm text-error">Failed to load recent tasks.</td></tr>';
        }
    }

    // 3. Manage Tasks view with Deletion Action
    async function fetchManageTasksList() {
        const activeListContainer = document.getElementById('active-tasks-list');
        const previousListContainer = document.getElementById('previous-tasks-list');
        activeListContainer.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-sm text-on-surface-variant">Loading tasks database...</td></tr>';
        previousListContainer.innerHTML = '<tr><td colspan="8" class="px-6 py-4 text-center text-sm text-on-surface-variant">Loading tasks database...</td></tr>';

        try {
            const tasks = await apiRequest('/api/admin/tasks');
            const now = new Date();
            const activeTasks = tasks.filter(task => new Date(task.expiry_date) >= now);
            const previousTasks = tasks.filter(task => new Date(task.expiry_date) < now);

            // Reset view tab to active and update tabs
            currentTasksTab = 'active';
            updateTasksTabUI();

            // Render Active Tasks
            if (activeTasks.length === 0) {
                activeListContainer.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-sm text-on-surface-variant">No active tasks found. Create tasks to view them here.</td></tr>';
            } else {
                activeListContainer.innerHTML = activeTasks.map((task) => {
                    const badge = getPlatformBadge(task.platform);
                    const expiryStr = new Date(task.expiry_date).toLocaleDateString() + ' ' + new Date(task.expiry_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

                    return `
                        <tr class="hover:bg-surface-container-low/50 transition-colors">
                            <td class="px-6 py-4 text-xs font-mono text-secondary">#TSK-${task.id}</td>
                            <td class="px-6 py-4 font-semibold text-on-surface">${escapeHTML(task.title)}</td>
                            <td class="px-6 py-4">
                                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${badge.class}">
                                    <span class="material-symbols-outlined text-[14px]">${badge.icon}</span>
                                    ${task.platform}
                                </span>
                            </td>
                            <td class="px-6 py-4 max-w-xs truncate text-xs text-secondary">
                                <a href="${task.social_link}" target="_blank" class="hover:underline hover:text-primary transition-colors">${escapeHTML(task.social_link)}</a>
                            </td>
                            <td class="px-6 py-4 text-xs text-secondary">${expiryStr}</td>
                            <td class="px-6 py-4 text-right font-medium">10</td>
                            <td class="px-6 py-4 text-right">
                                <button onclick="deleteTask(${task.id})" class="text-error hover:bg-error-container p-1.5 rounded-DEFAULT transition-colors" title="Delete Task">
                                    <span class="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('');
            }

            // Render Previous Tasks
            if (previousTasks.length === 0) {
                previousListContainer.innerHTML = '<tr><td colspan="8" class="px-6 py-4 text-center text-sm text-on-surface-variant">No previous tasks found.</td></tr>';
            } else {
                previousListContainer.innerHTML = previousTasks.map((task) => {
                    const badge = getPlatformBadge(task.platform);
                    const createdStr = new Date(task.created_at).toLocaleDateString();
                    const expiryStr = new Date(task.expiry_date).toLocaleDateString();
                    
                    const assigned = task.assigned_count || 0;
                    const completed = task.completed_count || 0;
                    const rate = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;

                    return `
                        <tr class="hover:bg-surface-container-low/50 transition-colors">
                            <td class="px-6 py-4 font-semibold text-on-surface">${escapeHTML(task.title)}</td>
                            <td class="px-6 py-4">
                                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${badge.class}">
                                    <span class="material-symbols-outlined text-[14px]">${badge.icon}</span>
                                    ${task.platform}
                                </span>
                            </td>
                            <td class="px-6 py-4 text-xs text-secondary">${createdStr}</td>
                            <td class="px-6 py-4 text-xs text-secondary">${expiryStr}</td>
                            <td class="px-6 py-4 text-center text-on-surface-variant font-medium">${assigned}</td>
                            <td class="px-6 py-4 text-center text-tertiary font-bold">${completed}</td>
                            <td class="px-6 py-4 text-center text-primary font-black">${rate}%</td>
                            <td class="px-6 py-4 text-right">
                                <button onclick="deleteTask(${task.id})" class="text-error hover:bg-error-container p-1.5 rounded-DEFAULT transition-colors" title="Delete Task">
                                    <span class="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        } catch (error) {
            activeListContainer.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-sm text-error">Failed to load tasks database.</td></tr>';
            previousListContainer.innerHTML = '<tr><td colspan="8" class="px-6 py-4 text-center text-sm text-error">Failed to load tasks database.</td></tr>';
        }
    }

    // Expose deleteTask globally so onclick handlers work
    window.deleteTask = async function(taskId) {
        if (!confirm('Are you sure you want to delete this task? This will permanently delete all student completions associated with this task.')) {
            return;
        }

        try {
            const data = await apiRequest(`/api/admin/tasks/${taskId}`, { method: 'DELETE' });
            showToast(data.message);
            fetchManageTasksList(); // Refresh view
        } catch (error) {
            showToast('Failed to delete task', true);
        }
    };

    // 4. Analytics Report Page
    async function fetchAnalytics() {
        const tasksTable = document.getElementById('analytics-tasks-list');
        const studentsTable = document.getElementById('analytics-students-list');
        const topPerformersTable = document.getElementById('analytics-top-performers-list');
        const topCommentersTable = document.getElementById('analytics-top-commenters-list');

        tasksTable.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-sm text-on-surface-variant">Loading report...</td></tr>';
        studentsTable.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-center text-sm text-on-surface-variant">Loading report...</td></tr>';
        topPerformersTable.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-center text-sm text-on-surface-variant">Loading report...</td></tr>';
        if (topCommentersTable) {
            topCommentersTable.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-center text-sm text-on-surface-variant">Loading report...</td></tr>';
        }

        try {
            const data = await apiRequest('/api/admin/analytics');
            
            // Fill Analytics KPI Summary Cards
            document.getElementById('analytics-kpi-students').textContent = data.overview.totalStudents.toLocaleString();
            document.getElementById('analytics-kpi-tasks').textContent = data.overview.totalTasks.toLocaleString();
            document.getElementById('analytics-kpi-completed').textContent = data.overview.completedTasks.toLocaleString();
            document.getElementById('analytics-kpi-pending').textContent = data.overview.pendingTasks.toLocaleString();
            document.getElementById('analytics-kpi-rate').textContent = data.overview.engagementRate;

            // Fill Comment Analytics KPI Cards
            if (document.getElementById('analytics-kpi-comments-total')) {
                document.getElementById('analytics-kpi-comments-total').textContent = data.overview.totalVerifiedComments.toLocaleString();
                document.getElementById('analytics-kpi-comments-instagram').textContent = data.commentsPerPlatform.Instagram.toLocaleString();
                document.getElementById('analytics-kpi-comments-youtube').textContent = data.commentsPerPlatform.YouTube.toLocaleString();
                document.getElementById('analytics-kpi-comments-linkedin').textContent = data.commentsPerPlatform.LinkedIn.toLocaleString();
                document.getElementById('analytics-kpi-comments-facebook').textContent = data.commentsPerPlatform.Facebook.toLocaleString();
                
                // New YouTube comment verification fields
                if (document.getElementById('analytics-kpi-comments-verified-youtube')) {
                    document.getElementById('analytics-kpi-comments-verified-youtube').textContent = data.overview.verifiedYouTubeComments.toLocaleString();
                    document.getElementById('analytics-kpi-comment-points-awarded').textContent = data.overview.totalCommentPointsAwarded.toLocaleString();
                    document.getElementById('analytics-kpi-students-verified-comments').textContent = data.overview.studentsWithVerifiedComments.toLocaleString();
                }
            }

            // Fill Task Breakdown Table
            if (data.tasks.length === 0) {
                tasksTable.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-sm text-on-surface-variant">No tasks data.</td></tr>';
            } else {
                tasksTable.innerHTML = data.tasks.map(task => `
                    <tr class="hover:bg-surface-container-low/50 transition-colors">
                        <td class="px-6 py-4 font-medium text-on-surface">${escapeHTML(task.title)}</td>
                        <td class="px-6 py-4 text-xs font-semibold text-secondary">${task.platform}</td>
                        <td class="px-6 py-4 text-center font-semibold text-on-surface-variant">${task.opened_count}</td>
                        <td class="px-6 py-4 text-center font-bold text-tertiary">${task.completed_count}</td>
                        <td class="px-6 py-4 text-center font-semibold text-secondary">${task.pending_count}</td>
                    </tr>
                `).join('');
            }

            // Fill Student Breakdown Table
            if (data.students.length === 0) {
                studentsTable.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-center text-sm text-on-surface-variant">No student data.</td></tr>';
            } else {
                studentsTable.innerHTML = data.students.map(student => `
                    <tr class="hover:bg-surface-container-low/50 transition-colors">
                        <td class="px-6 py-4 font-medium text-on-surface">
                            <div>${escapeHTML(student.name)}</div>
                            <div class="text-xs text-secondary truncate max-w-[150px]">${escapeHTML(student.email)}</div>
                        </td>
                        <td class="px-6 py-4 text-center font-bold text-tertiary">${student.completed_count}</td>
                        <td class="px-6 py-4 text-right font-black text-primary">${student.points}</td>
                    </tr>
                `).join('');
            }

            // Fill Top Performers Table
            const topFive = data.students.slice(0, 5);
            if (topFive.length === 0) {
                topPerformersTable.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-center text-sm text-on-surface-variant">No student data.</td></tr>';
            } else {
                topPerformersTable.innerHTML = topFive.map((student, index) => {
                    let medalClass = 'text-secondary';
                    if (index === 0) medalClass = 'text-amber-500 font-extrabold';
                    else if (index === 1) medalClass = 'text-slate-400 font-bold';
                    else if (index === 2) medalClass = 'text-amber-700';

                    return `
                        <tr class="hover:bg-surface-container-low/50 transition-colors">
                            <td class="px-6 py-4 text-center font-bold ${medalClass}">${index + 1}</td>
                            <td class="px-6 py-4 font-semibold text-on-surface">${escapeHTML(student.name)}</td>
                            <td class="px-6 py-4 text-right px-12 font-bold text-primary">${student.points} pts</td>
                        </tr>
                    `;
                }).join('');
            }

            // Fill Top Commenters Table
            if (topCommentersTable) {
                if (data.topCommenters.length === 0) {
                    topCommentersTable.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-center text-sm text-on-surface-variant">No commenter data.</td></tr>';
                } else {
                    topCommentersTable.innerHTML = data.topCommenters.map((student, index) => {
                        let medalClass = 'text-secondary';
                        if (index === 0) medalClass = 'text-amber-500 font-extrabold';
                        else if (index === 1) medalClass = 'text-slate-400 font-bold';
                        else if (index === 2) medalClass = 'text-amber-700';

                        return `
                            <tr class="hover:bg-surface-container-low/50 transition-colors">
                                <td class="px-6 py-4 text-center font-bold ${medalClass}">${index + 1}</td>
                                <td class="px-6 py-4 font-semibold text-on-surface">${escapeHTML(student.name)}</td>
                                <td class="px-6 py-4 text-right px-12 font-bold text-primary">${student.verified_comments_count} comments</td>
                            </tr>
                        `;
                    }).join('');
                }
            }

        } catch (error) {
            tasksTable.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-sm text-error">Failed to load analytics report.</td></tr>';
            studentsTable.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-center text-sm text-error">Failed to load analytics report.</td></tr>';
            topPerformersTable.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-center text-sm text-error">Failed to load top performers.</td></tr>';
            if (topCommentersTable) {
                topCommentersTable.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-center text-sm text-error">Failed to load top commenters.</td></tr>';
            }
        }
    }

    // 5. Leaderboard Standings Page
    async function fetchLeaderboard() {
        const boardContainer = document.getElementById('leaderboard-list');
        boardContainer.innerHTML = '<tr><td colspan="3" class="px-6 py-6 text-center text-sm text-on-surface-variant">Loading rankings...</td></tr>';

        try {
            const rankings = await apiRequest('/api/admin/leaderboard');
            if (rankings.length === 0) {
                boardContainer.innerHTML = '<tr><td colspan="3" class="px-6 py-6 text-center text-sm text-on-surface-variant">No students registered yet.</td></tr>';
                return;
            }

            boardContainer.innerHTML = rankings.map((student) => {
                let medalClass = 'text-secondary';
                if (student.rank == 1) medalClass = 'text-amber-500 font-extrabold scale-110';
                else if (student.rank == 2) medalClass = 'text-slate-400 font-bold';
                else if (student.rank == 3) medalClass = 'text-amber-700';

                return `
                    <tr class="hover:bg-surface-container-low/50 transition-colors">
                        <td class="px-6 py-4 text-center font-black ${medalClass}">${student.rank}</td>
                        <td class="px-6 py-4 font-semibold text-on-surface">${escapeHTML(student.name)}</td>
                        <td class="px-6 py-4 text-right px-12 font-black text-primary">${student.points} pts</td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            boardContainer.innerHTML = '<tr><td colspan="3" class="px-6 py-6 text-center text-sm text-error">Failed to fetch leaderboard standings.</td></tr>';
        }
    }

    // 6. Registered Students list
    async function fetchStudentsList() {
        const listContainer = document.getElementById('students-management-list');
        listContainer.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-sm text-on-surface-variant">Loading registered students...</td></tr>';

        try {
            const students = await apiRequest('/api/admin/students');
            if (students.length === 0) {
                listContainer.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-sm text-on-surface-variant">No students registered yet.</td></tr>';
                return;
            }

            listContainer.innerHTML = students.map((student) => {
                const dateStr = new Date(student.created_at).toLocaleDateString();
                return `
                    <tr class="hover:bg-surface-container-low/50 transition-colors">
                        <td class="px-6 py-4 font-semibold text-on-surface">${escapeHTML(student.name)}</td>
                        <td class="px-6 py-4 text-on-surface-variant">${escapeHTML(student.email)}</td>
                        <td class="px-6 py-4 text-right font-bold text-primary">${student.points}</td>
                        <td class="px-6 py-4 text-center font-semibold text-tertiary">${student.completed_count}</td>
                        <td class="px-6 py-4 text-center font-semibold text-on-surface-variant">${student.pending_count}</td>
                        <td class="px-6 py-4 text-secondary">${dateStr}</td>
                        <td class="px-6 py-4 text-right flex items-center justify-end gap-2">
                            <button onclick="viewStudentProgress(${student.id})" class="text-primary hover:bg-primary-container p-1.5 rounded-DEFAULT transition-colors" title="View Progress">
                                <span class="material-symbols-outlined text-[18px]">visibility</span>
                            </button>
                            <button onclick="deleteStudent(${student.id})" class="text-error hover:bg-error-container p-1.5 rounded-DEFAULT transition-colors" title="Delete Student">
                                <span class="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            listContainer.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-sm text-error">Failed to load registered students.</td></tr>';
        }
    }

    // Expose deleteStudent globally so onclick handlers work
    window.deleteStudent = async function(studentId) {
        if (!confirm('Are you sure you want to remove this student?')) {
            return;
        }

        try {
            const data = await apiRequest(`/api/admin/students/${studentId}`, { method: 'DELETE' });
            showToast(data.message);
            fetchStudentsList(); // Refresh view
        } catch (error) {
            showToast(error.message || 'Failed to delete student', true);
        }
    };

    // Progress Modal Elements
    const progressModal = document.getElementById('progress-modal');
    const closeProgressModalBtn = document.getElementById('btn-close-progress-modal');

    // Close Progress modal
    closeProgressModalBtn.addEventListener('click', () => {
        progressModal.classList.add('hidden');
    });

    // Close Progress modal by clicking backdrop
    progressModal.addEventListener('click', (e) => {
        if (e.target === progressModal) {
            progressModal.classList.add('hidden');
        }
    });

    // Expose viewStudentProgress globally so onclick works
    window.viewStudentProgress = async function(studentId) {
        const nameHeader = document.getElementById('progress-modal-student-name');
        const listContainer = document.getElementById('progress-modal-tasks-list');

        nameHeader.textContent = 'Loading student profile...';
        listContainer.innerHTML = '<tr><td colspan="3" class="px-4 py-3 text-center text-sm text-on-surface-variant">Loading tasks...</td></tr>';
        progressModal.classList.remove('hidden');

        try {
            const data = await apiRequest(`/api/admin/students/${studentId}/tasks`);
            nameHeader.textContent = `Student: ${data.studentName}`;
            
            if (data.tasks.length === 0) {
                listContainer.innerHTML = '<tr><td colspan="3" class="px-4 py-3 text-center text-sm text-on-surface-variant">No tasks assigned yet.</td></tr>';
                return;
            }

            listContainer.innerHTML = data.tasks.map(task => {
                let badgeClass = 'bg-surface-container-high text-on-surface-variant';
                if (task.status === 'COMPLETED') {
                    badgeClass = 'bg-tertiary-container text-on-tertiary-container border border-tertiary-fixed';
                } else if (task.status === 'OPENED') {
                    badgeClass = 'bg-amber-100 text-amber-800 border border-amber-200';
                }

                return `
                    <tr class="hover:bg-surface-container-low/50 transition-colors">
                        <td class="px-4 py-3 font-medium text-on-surface">${escapeHTML(task.task_title)}</td>
                        <td class="px-4 py-3 text-xs text-on-surface-variant">${task.platform}</td>
                        <td class="px-4 py-3">
                            <span class="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${badgeClass}">
                                ${task.status}
                            </span>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            nameHeader.textContent = 'Error loading student details.';
            listContainer.innerHTML = '<tr><td colspan="3" class="px-4 py-3 text-center text-sm text-error">Failed to load student progress.</td></tr>';
        }
    };

    // 8. Individual Student Task Tracking
    let allTrackingRecords = [];

    async function fetchTrackingData() {
        const listContainer = document.getElementById('tracking-records-list');
        listContainer.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-sm text-on-surface-variant">Loading tracking logs...</td></tr>';

        try {
            const data = await apiRequest('/api/admin/tracking');
            allTrackingRecords = data;
            
            // Populating filter dropdowns dynamically
            populateFilterOptions();
            
            // Render table
            renderTrackingTable();
            
            // Render YouTube verifications
            renderYouTubeVerificationsTable();
        } catch (error) {
            listContainer.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-sm text-error">Failed to load tracking data.</td></tr>';
        }
    }

    function populateFilterOptions() {
        const studentSelect = document.getElementById('filter-student');
        const taskSelect = document.getElementById('filter-task');

        // Get unique students
        const students = [...new Set(allTrackingRecords.map(r => r.student_name))].sort();
        // Get unique tasks
        const tasks = [...new Set(allTrackingRecords.map(r => r.task_title))].sort();

        // Clear and add "All" options
        studentSelect.innerHTML = '<option value="ALL">All Students</option>';
        taskSelect.innerHTML = '<option value="ALL">All Tasks</option>';

        students.forEach(s => {
            studentSelect.innerHTML += `<option value="${escapeHTML(s)}">${escapeHTML(s)}</option>`;
        });

        tasks.forEach(t => {
            taskSelect.innerHTML += `<option value="${escapeHTML(t)}">${escapeHTML(t)}</option>`;
        });
    }

    function renderTrackingTable() {
        const listContainer = document.getElementById('tracking-records-list');
        
        const selectedStudent = document.getElementById('filter-student').value;
        const selectedTask = document.getElementById('filter-task').value;
        const selectedStatus = document.getElementById('filter-status').value;

        const filtered = allTrackingRecords.filter(record => {
            const matchStudent = selectedStudent === 'ALL' || record.student_name === selectedStudent;
            const matchTask = selectedTask === 'ALL' || record.task_title === selectedTask;
            const matchStatus = selectedStatus === 'ALL' || record.status === selectedStatus;
            return matchStudent && matchTask && matchStatus;
        });

        if (filtered.length === 0) {
            listContainer.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-sm text-on-surface-variant">No tracking records match the selected filters.</td></tr>';
            return;
        }

        listContainer.innerHTML = filtered.map(record => {
            let badgeClass = 'bg-surface-container-high text-on-surface-variant';
            if (record.status === 'COMPLETED') {
                badgeClass = 'bg-tertiary-container text-on-tertiary-container border border-tertiary-fixed';
            } else if (record.status === 'OPENED') {
                badgeClass = 'bg-amber-100 text-amber-800 border border-amber-200';
            }

            let commentBadgeClass = 'bg-surface-container-high text-secondary';
            const commentStatus = record.comment_status || 'Not Attempted';
            if (commentStatus === 'Comment Detected' || commentStatus === 'Comment Verified' || commentStatus === 'Verification Successful') {
                commentBadgeClass = 'bg-tertiary-container text-on-tertiary-container border border-tertiary-fixed';
            } else if (commentStatus === 'Comment Not Verified' || commentStatus === 'Comment Not Found' || commentStatus === 'Invalid URL' || commentStatus === 'Video ID Extraction Failed' || commentStatus === 'Video Not Found' || commentStatus === 'Handle Mismatch' || commentStatus === 'Verification Error') {
                commentBadgeClass = 'bg-error-container text-on-error-container border border-[#fbdfe1]';
            } else if (commentStatus === 'Platform Not Available' || commentStatus === 'YouTube Account Not Available') {
                commentBadgeClass = 'bg-secondary-container text-on-secondary-container border border-outline-variant';
            }

            return `
                <tr class="hover:bg-surface-container-low/50 transition-colors">
                    <td class="px-6 py-4 font-semibold text-on-surface">${escapeHTML(record.student_name)}</td>
                    <td class="px-6 py-4 text-on-surface-variant">${escapeHTML(record.task_title)}</td>
                    <td class="px-6 py-4 text-xs font-semibold text-secondary">${record.platform}</td>
                    <td class="px-6 py-4">
                        <span class="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${badgeClass}">
                            ${record.status}
                        </span>
                    </td>
                    <td class="px-6 py-4">
                        <span class="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${commentBadgeClass}">
                            ${commentStatus}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-right font-bold text-primary">${record.points_earned}</td>
                </tr>
            `;
        }).join('');
    }

    function renderYouTubeVerificationsTable() {
        const ytListContainer = document.getElementById('youtube-verifications-list');
        if (!ytListContainer) return;
        
        // Filter for YouTube tasks that are completed (or have checked comment status)
        const youtubeCompleted = allTrackingRecords.filter(record => 
            record.platform === 'YouTube' && 
            (record.status === 'COMPLETED' || (record.comment_status && record.comment_status !== 'Not Checked' && record.comment_status !== 'Not Attempted'))
        );

        if (youtubeCompleted.length === 0) {
            ytListContainer.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-sm text-on-surface-variant">No completed YouTube tasks found.</td></tr>';
            return;
        }

        ytListContainer.innerHTML = youtubeCompleted.map(record => {
            let commentBadgeClass = 'bg-surface-container-high text-secondary';
            const commentStatus = record.comment_status || 'Not Checked';
            
            if (commentStatus === 'Comment Verified' || commentStatus === 'Verification Successful') {
                commentBadgeClass = 'bg-tertiary-container text-on-tertiary-container border border-tertiary-fixed';
            } else if (commentStatus === 'Comment Not Found' || commentStatus === 'Invalid URL' || commentStatus === 'Video ID Extraction Failed' || commentStatus === 'Video Not Found' || commentStatus === 'Handle Mismatch') {
                commentBadgeClass = 'bg-error-container text-on-error-container border border-[#fbdfe1]';
            } else if (commentStatus === 'YouTube Account Not Available') {
                commentBadgeClass = 'bg-secondary-container text-on-secondary-container border border-outline-variant';
            } else if (commentStatus === 'Verification Error') {
                commentBadgeClass = 'bg-error-container text-on-error-container border border-error/20';
            } else if (commentStatus === 'Not Checked') {
                commentBadgeClass = 'bg-surface-container-high text-secondary';
            }

            const verifiedDate = record.comment_verified_at 
                ? new Date(record.comment_verified_at).toLocaleString() 
                : 'N/A';

            return `
                <tr class="hover:bg-surface-container-low/50 transition-colors">
                    <td class="px-6 py-4 font-semibold text-on-surface">${escapeHTML(record.student_name)}</td>
                    <td class="px-6 py-4 text-on-surface-variant">${escapeHTML(record.task_title)}</td>
                    <td class="px-6 py-4">
                        <span class="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${commentBadgeClass}">
                            ${commentStatus}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-secondary text-xs">${verifiedDate}</td>
                    <td class="px-6 py-4 text-right font-bold text-primary">${record.comment_points_awarded || 0} pts</td>
                </tr>
            `;
        }).join('');
    }

    // Attach filter listeners
    document.getElementById('filter-student').addEventListener('change', renderTrackingTable);
    document.getElementById('filter-task').addEventListener('change', renderTrackingTable);
    document.getElementById('filter-status').addEventListener('change', renderTrackingTable);

    // 9. Debug Logs Page
    async function fetchVerificationLogs() {
        const listContainer = document.getElementById('verification-logs-list');
        listContainer.innerHTML = '<tr><td colspan="9" class="px-6 py-4 text-center text-sm text-on-surface-variant">Loading verification logs...</td></tr>';
        try {
            const logs = await apiRequest('/api/admin/verification-logs');
            if (!logs || logs.length === 0) {
                listContainer.innerHTML = '<tr><td colspan="9" class="px-6 py-4 text-center text-sm text-on-surface-variant">No verification attempts logged yet.</td></tr>';
                return;
            }
            listContainer.innerHTML = logs.map(log => {
                const date = new Date(log.timestamp).toLocaleString();
                let statusBadge = 'bg-surface-container-high text-secondary';
                if (log.status === 'Comment Verified') {
                    statusBadge = 'bg-tertiary-container text-on-tertiary-container border border-tertiary-fixed';
                } else if (log.status !== 'Pending') {
                    statusBadge = 'bg-error-container text-on-error-container border border-[#fbdfe1]';
                }
                
                const matchIcon = log.matchResult ? '<span class="material-symbols-outlined text-tertiary text-[18px]">check_circle</span>' : '<span class="material-symbols-outlined text-error text-[18px]">cancel</span>';
                const foundText = log.numComments !== undefined ? log.numComments : '-';

                const sourceBadge = log.verificationSource === 'REAL_YOUTUBE_API' 
                    ? '<span class="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary-container text-on-primary-container">REAL_YOUTUBE_API</span>' 
                    : '<span class="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-error-container text-on-error-container">' + (log.verificationSource || 'UNKNOWN') + '</span>';

                return `
                    <tr class="hover:bg-surface-container-low/50 transition-colors">
                        <td class="px-4 py-3 text-xs text-secondary whitespace-nowrap">${date}</td>
                        <td class="px-4 py-3">${sourceBadge}</td>
                        <td class="px-4 py-3 text-xs text-on-surface-variant max-w-[150px] truncate" title="${escapeHTML(log.taskUrl)}">#${log.taskId}</td>
                        <td class="px-4 py-3 text-sm">
                            <div class="font-semibold text-on-surface">${escapeHTML(log.studentName)}</div>
                            <div class="text-xs text-secondary">${escapeHTML(log.storedHandle || 'None')}</div>
                        </td>
                        <td class="px-4 py-3 text-xs font-mono text-secondary">${escapeHTML(log.videoId || '-')}</td>
                        <td class="px-4 py-3 text-center text-sm font-semibold">${foundText}</td>
                        <td class="px-4 py-3 text-center">${matchIcon}</td>
                        <td class="px-4 py-3">
                            <span class="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${statusBadge}">${log.status}</span>
                        </td>
                        <td class="px-4 py-3 text-xs text-on-surface-variant max-w-xs truncate" title="${escapeHTML(log.reason)}">${escapeHTML(log.reason)}</td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            listContainer.innerHTML = '<tr><td colspan="9" class="px-6 py-4 text-center text-sm text-error">Failed to fetch verification logs.</td></tr>';
        }
    }

    const btnRefreshLogs = document.getElementById('btn-refresh-logs');
    if (btnRefreshLogs) {
        btnRefreshLogs.addEventListener('click', fetchVerificationLogs);
    }

    // 10. Settings View
    async function fetchSettings() {
        const elStatus = document.getElementById('setting-youtube-status');
        const elIcon = document.getElementById('setting-youtube-status-icon');
        const elQuotaUsage = document.getElementById('setting-youtube-quota-usage');
        const elQuotaPercentage = document.getElementById('setting-youtube-quota-percentage');
        const elQuotaRemaining = document.getElementById('setting-youtube-quota-remaining');
        const elLastStatus = document.getElementById('setting-youtube-last-req-status');
        const elLastCode = document.getElementById('setting-youtube-last-req-code');
        const elLastTime = document.getElementById('setting-youtube-last-req-time');

        const fbElStatus = document.getElementById('setting-facebook-status');
        const fbElIcon = document.getElementById('setting-facebook-status-icon');
        const fbElRequests = document.getElementById('setting-facebook-requests-today');
        const fbElMode = document.getElementById('setting-facebook-mode');
        const fbElLastStatus = document.getElementById('setting-facebook-last-req-status');
        const fbElLastCode = document.getElementById('setting-facebook-last-req-code');
        const fbElLastTime = document.getElementById('setting-facebook-last-req-time');

        elStatus.textContent = 'Loading...';
        if (fbElStatus) fbElStatus.textContent = 'Loading...';
        
        try {
            const settings = await apiRequest('/api/system/youtube-status');
            
            if (settings.envKeyPresent && settings.startupDetectedKey) {
                elStatus.textContent = 'Configured';
                elIcon.textContent = 'check_circle';
                elIcon.className = 'material-symbols-outlined text-xl text-tertiary';
                elStatus.className = 'text-base font-bold text-tertiary';
            } else {
                elStatus.textContent = 'Not Configured';
                elIcon.textContent = 'error';
                elIcon.className = 'material-symbols-outlined text-xl text-error';
                elStatus.className = 'text-base font-bold text-error';
            }

            // Quota Elements
            if (settings.quota) {
                elQuotaUsage.textContent = `${settings.quota.usedToday} / 10000`;
                elQuotaPercentage.textContent = `${settings.quota.percentage}%`;
                elQuotaRemaining.textContent = `${settings.quota.remaining} Remaining`;
            } else {
                elQuotaUsage.textContent = '-- / 10000';
                elQuotaPercentage.textContent = '--%';
                elQuotaRemaining.textContent = '-- Remaining';
            }

            // Last Request Elements
            if (settings.lastRequest) {
                elLastStatus.textContent = settings.lastRequest.status;
                elLastCode.textContent = settings.lastRequest.responseCode || '--';
                elLastTime.textContent = new Date(settings.lastRequest.timestamp).toLocaleString();
                
                if (settings.lastRequest.status !== 'success') {
                    elLastStatus.classList.add('text-error');
                    elLastCode.classList.add('text-error');
                } else {
                    elLastStatus.classList.remove('text-error');
                    elLastCode.classList.remove('text-error');
                    elLastStatus.classList.add('text-tertiary');
                }
            } else {
                elLastStatus.textContent = 'None';
                elLastCode.textContent = '--';
                elLastTime.textContent = '--';
            }

        } catch (error) {
            elStatus.textContent = 'Error loading settings';
            elIcon.textContent = 'error';
            elIcon.className = 'material-symbols-outlined text-xl text-error';
        }

        try {
            if (fbElStatus) {
                const fbSettings = await apiRequest('/api/admin/facebook-status');
                
                if (fbSettings.envKeyPresent && fbSettings.startupDetectedKey) {
                    fbElStatus.textContent = 'Configured';
                    fbElIcon.textContent = 'check_circle';
                    fbElIcon.className = 'material-symbols-outlined text-xl text-tertiary';
                    fbElStatus.className = 'text-base font-bold text-tertiary';
                } else {
                    fbElStatus.textContent = 'Not Configured';
                    fbElIcon.textContent = 'error';
                    fbElIcon.className = 'material-symbols-outlined text-xl text-error';
                    fbElStatus.className = 'text-base font-bold text-error';
                }

                if (fbSettings.usage) {
                    fbElRequests.textContent = fbSettings.usage.requestsToday;
                }

                fbElMode.textContent = fbSettings.verificationMode || 'MOCK';

                if (fbSettings.lastRequest) {
                    fbElLastStatus.textContent = fbSettings.lastRequest.status;
                    fbElLastCode.textContent = fbSettings.lastRequest.responseCode || '--';
                    fbElLastTime.textContent = new Date(fbSettings.lastRequest.timestamp).toLocaleString();
                    
                    if (fbSettings.lastRequest.status !== 'success') {
                        fbElLastStatus.classList.add('text-error');
                        fbElLastCode.classList.add('text-error');
                    } else {
                        fbElLastStatus.classList.remove('text-error');
                        fbElLastCode.classList.remove('text-error');
                        fbElLastStatus.classList.add('text-tertiary');
                    }
                } else {
                    fbElLastStatus.textContent = 'None';
                    fbElLastCode.textContent = '--';
                    fbElLastTime.textContent = '--';
                }
            }
        } catch (error) {
            if (fbElStatus) {
                fbElStatus.textContent = 'Error loading settings';
                fbElIcon.textContent = 'error';
                fbElIcon.className = 'material-symbols-outlined text-xl text-error';
            }
        }
    }

    // ──────────────────────────────────────────────────────────
    // FORM SUBMISSIONS
    // ──────────────────────────────────────────────────────────

    async function handlePublishTask(title, platform, socialLink, durationDays) {
        try {
            const data = await apiRequest('/api/admin/tasks', {
                method: 'POST',
                body: JSON.stringify({ title, platform, socialLink, durationDays })
            });

            showToast(data.message);
            switchView('dashboard'); // Redirect to dashboard
            return true;
        } catch (error) {
            showToast(error.message, true);
            return false;
        }
    }

    // Toggle custom duration inputs
    document.getElementById('quickTaskDuration').addEventListener('change', (e) => {
        const container = document.getElementById('quickCustomDurationContainer');
        const customInput = document.getElementById('quickCustomDuration');
        if (e.target.value === 'custom') {
            container.classList.remove('hidden');
            customInput.required = true;
        } else {
            container.classList.add('hidden');
            customInput.required = false;
        }
    });

    document.getElementById('taskDuration').addEventListener('change', (e) => {
        const container = document.getElementById('customDurationContainer');
        const customInput = document.getElementById('customDuration');
        if (e.target.value === 'custom') {
            container.classList.remove('hidden');
            customInput.required = true;
        } else {
            container.classList.add('hidden');
            customInput.required = false;
        }
    });

    // 1. Quick Create Form
    document.getElementById('quick-create-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('quickTaskTitle').value;
        const platform = document.getElementById('quickPlatform').value;
        const socialLink = document.getElementById('quickTaskLink').value;
        const durationSelect = document.getElementById('quickTaskDuration').value;
        const durationDays = durationSelect === 'custom' 
            ? document.getElementById('quickCustomDuration').value 
            : durationSelect;

        const success = await handlePublishTask(title, platform, socialLink, durationDays);
        if (success) {
            document.getElementById('quick-create-form').reset();
            document.getElementById('quickCustomDurationContainer').classList.add('hidden');
            document.getElementById('quickCustomDuration').required = false;
        }
    });

    // 2. Standalone Create Form
    document.getElementById('standalone-create-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('taskTitle').value;
        const platform = document.getElementById('platform').value;
        const socialLink = document.getElementById('taskLink').value;
        const durationSelect = document.getElementById('taskDuration').value;
        const durationDays = durationSelect === 'custom' 
            ? document.getElementById('customDuration').value 
            : durationSelect;

        const success = await handlePublishTask(title, platform, socialLink, durationDays);
        if (success) {
            document.getElementById('standalone-create-form').reset();
            document.getElementById('customDurationContainer').classList.add('hidden');
            document.getElementById('customDuration').required = false;
        }
    });

    // Utility: Prevent HTML injection XSS
    function escapeHTML(str) {
        if (str === null || str === undefined || str === '') return '-';
        return String(str).replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    // Initialize: Start on Dashboard View
    switchView('dashboard');
});
