const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const db = require('../src/database/models');

const FEEDER_CONFIG = {
    daysRange: Number(process.env.FEEDER_DAYS_RANGE || 30),
    useLastMonthWindow: process.env.FEEDER_USE_LAST_MONTH_WINDOW !== 'false',
    workspaceCount: Number(process.env.FEEDER_WORKSPACES || 2),
    projectsPerWorkspaceMin: Number(process.env.FEEDER_PROJECTS_MIN || 2),
    projectsPerWorkspaceMax: Number(process.env.FEEDER_PROJECTS_MAX || 3),
    tasksPerProjectMin: Number(process.env.FEEDER_TASKS_MIN || 12),
    tasksPerProjectMax: Number(process.env.FEEDER_TASKS_MAX || 22),
    minUsers: Number(process.env.FEEDER_MIN_USERS || 12),
    addExtraUsers: process.env.FEEDER_ADD_EXTRA_USERS === 'true',
    primaryUserName: process.env.FEEDER_PRIMARY_NAME || 'Vansh Rathod',
    primaryUserEmail: (process.env.FEEDER_PRIMARY_EMAIL || '').trim().toLowerCase(),
    primaryUserPassword: process.env.FEEDER_PRIMARY_PASSWORD || 'Welcome@123',
    primaryUserPhone: process.env.FEEDER_PRIMARY_PHONE || '+91-9876543210',
    dailyGapWorkspaceKeywords: (process.env.FEEDER_DAILY_GAP_WORKSPACES || 'greencart')
        .split(',')
        .map((v) => v.trim().toLowerCase())
        .filter(Boolean)
};

const WORKSPACE_THEMES = [
    'Fintech Operations',
    'Healthcare Automation',
    'Retail Expansion',
    'Cloud Modernization',
    'Mobility Platform',
    'Supply Chain Control Tower',
    'EdTech Experience',
    'SaaS Growth Engine'
];

const PROJECT_BLUEPRINTS = [
    {
        name: 'Customer Onboarding Redesign',
        description: 'Improve first-week activation and reduce drop-offs across onboarding steps.'
    },
    {
        name: 'Fraud Detection Optimization',
        description: 'Reduce false positives while improving detection speed for risky events.'
    },
    {
        name: 'Cross-Platform Mobile Rollout',
        description: 'Ship key workflows for Android and iOS with stable release automation.'
    },
    {
        name: 'Quarterly Security Hardening',
        description: 'Run vulnerability remediation and enforce high-priority compliance controls.'
    },
    {
        name: 'AI Workflow Assistant',
        description: 'Use AI to generate task plans, summaries, and delivery risk signals.'
    }
];

const TASK_LIBRARY = [
    { title: 'Define architecture scope', description: 'Capture assumptions, boundary constraints, and service contracts.' },
    { title: 'Prepare implementation backlog', description: 'Break roadmap into delivery-ready tickets with acceptance criteria.' },
    { title: 'Implement API integration', description: 'Connect core service with retries, error mapping, and validation.' },
    { title: 'Set up observability dashboards', description: 'Track latency, throughput, and error rates for release readiness.' },
    { title: 'Add role-based access checks', description: 'Protect sensitive operations based on least-privilege principles.' },
    { title: 'Create QA regression suite', description: 'Automate happy-path and edge-case tests for high-risk flows.' },
    { title: 'Run performance benchmark', description: 'Measure bottlenecks and define optimization priorities.' },
    { title: 'Draft rollout playbook', description: 'Define rollback strategy, communication plan, and verification checklist.' },
    { title: 'Validate analytics accuracy', description: 'Compare event payloads with reporting outputs and fix mismatches.' },
    { title: 'Execute production smoke tests', description: 'Confirm critical paths after deployment and collect evidence.' }
];

const COMMENT_LIBRARY = [
    'Sharing the latest update after syncing with QA.',
    'I validated this flow and attached notes for review.',
    'Can we prioritize this before the next release cut?',
    'Risk looks reduced after patching the edge-case handling.',
    'Please confirm if we should keep this behind a feature flag.'
];

const NOTIFICATION_TYPES = [
    'task_assigned',
    'task_due',
    'comment_mention',
    'workspace_invite',
    'project_invite',
    'project_invite_accepted',
    'project_update'
];

const FIRST_NAMES = [
    'Aarav', 'Vivaan', 'Aditya', 'Ishaan', 'Arjun', 'Reyansh', 'Krish', 'Rohan',
    'Rahul', 'Neha', 'Aisha', 'Priya', 'Sneha', 'Kavya', 'Meera', 'Nisha',
    'Siddharth', 'Karan', 'Nikhil', 'Tanvi', 'Ananya', 'Ritika', 'Manav', 'Yash'
];

const LAST_NAMES = [
    'Sharma', 'Patel', 'Mehta', 'Rathod', 'Gupta', 'Iyer', 'Reddy', 'Kapoor',
    'Joshi', 'Nair', 'Singh', 'Desai', 'Kulkarni', 'Mishra', 'Bansal', 'Verma'
];

const EMAIL_DOMAINS = [
    'gmail.com', 'outlook.com', 'yahoo.com', 'proton.me'
];

function getSeedWindow() {
    const now = new Date();

    if (FEEDER_CONFIG.useLastMonthWindow) {
        return {
            startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0),
            endDate: now
        };
    }

    return {
        startDate: new Date(now.getTime() - FEEDER_CONFIG.daysRange * 24 * 60 * 60 * 1000),
        endDate: now
    };
}

function buildRealisticUser(existingEmails, indexHint) {
    const first = randomFrom(FIRST_NAMES);
    const last = randomFrom(LAST_NAMES);
    const baseHandle = `${first}.${last}`.toLowerCase();
    const domain = randomFrom(EMAIL_DOMAINS);

    let candidate = `${baseHandle}@${domain}`;
    let serial = indexHint;

    while (existingEmails.has(candidate)) {
        serial += 1;
        candidate = `${baseHandle}${serial}@${domain}`;
    }

    existingEmails.add(candidate);

    return {
        name: `${first} ${last}`,
        email: candidate,
        phone: `+91-9${randomInt(100000000, 999999999)}`
    };
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom(arr) {
    return arr[randomInt(0, arr.length - 1)];
}

function chance(probability) {
    return Math.random() < probability;
}

function uuidToken() {
    return crypto.randomBytes(20).toString('hex');
}

function randomHexColor() {
    return `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;
}

function randomDateInRange(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomDateInSafeRange(start, end) {
    if (!start || !end || start.getTime() >= end.getTime()) {
        return new Date(start || end || Date.now());
    }
    return randomDateInRange(start, end);
}

function randomRecentDate(start, end) {
    // Squaring the random number biases generated events toward "now".
    const ratio = Math.pow(Math.random(), 2);
    return new Date(start.getTime() + ratio * (end.getTime() - start.getTime()));
}

function formatDateOnly(date) {
    return date.toISOString().split('T')[0];
}

async function createWithProjectIdFallback(model, payload) {
    try {
        return await model.create(payload);
    } catch (error) {
        const message = String(error?.message || '').toLowerCase();
        if (payload.project_id && message.includes('project_id') && message.includes('does not exist')) {
            const fallbackPayload = { ...payload };
            delete fallbackPayload.project_id;
            return model.create(fallbackPayload);
        }
        throw error;
    }
}

async function getExistingTableSet() {
    const tables = await db.sequelize.getQueryInterface().showAllTables();
    const normalized = tables.map((tbl) => {
        if (typeof tbl === 'string') {
            return tbl;
        }
        return tbl.tableName || tbl.name;
    }).filter(Boolean);

    return new Set(normalized);
}

async function applyTimestamps(tableName, id, createdAt, updatedAt = createdAt) {
    const values = { created_at: createdAt };

    if (updatedAt) {
        values.updated_at = updatedAt;
    }

    await db.sequelize.getQueryInterface().bulkUpdate(tableName, values, { id });
}

async function ensureUsers(startDate, endDate) {
    let users = await db.User.findAll({ order: [['created_at', 'ASC']] });
    const existingEmails = new Set(users.map((u) => String(u.email || '').toLowerCase()).filter(Boolean));
    let primaryUser = null;

    if (FEEDER_CONFIG.primaryUserEmail) {
        const primaryPasswordHash = await bcrypt.hash(FEEDER_CONFIG.primaryUserPassword, 10);
        const existingPrimary = await db.User.findOne({
            where: { email: FEEDER_CONFIG.primaryUserEmail }
        });

        if (existingPrimary) {
            await existingPrimary.update({
                name: FEEDER_CONFIG.primaryUserName,
                password_hash: primaryPasswordHash,
                phone: FEEDER_CONFIG.primaryUserPhone,
                is_verified: true,
                status: 'active',
                last_login_at: randomRecentDate(startDate, endDate)
            });
            primaryUser = existingPrimary;
        } else {
            const createdAt = randomDateInRange(startDate, endDate);
            const createdPrimary = await db.User.create({
                name: FEEDER_CONFIG.primaryUserName,
                email: FEEDER_CONFIG.primaryUserEmail,
                password_hash: primaryPasswordHash,
                phone: FEEDER_CONFIG.primaryUserPhone,
                is_verified: true,
                last_login_at: randomRecentDate(createdAt, endDate),
                status: 'active'
            });

            await applyTimestamps('users', createdPrimary.id, createdAt, randomRecentDate(createdAt, endDate));
            primaryUser = createdPrimary;
            users.push(createdPrimary);
            existingEmails.add(FEEDER_CONFIG.primaryUserEmail);
        }
    }

    if (FEEDER_CONFIG.addExtraUsers && users.length < FEEDER_CONFIG.minUsers) {
        const passwordHash = await bcrypt.hash('Welcome@123', 10);
        const additionalCount = FEEDER_CONFIG.minUsers - users.length;

        for (let i = 0; i < additionalCount; i += 1) {
            const profile = buildRealisticUser(existingEmails, Date.now() + i);
            const createdAt = randomDateInRange(startDate, endDate);

            const user = await db.User.create({
                name: profile.name,
                email: profile.email,
                password_hash: passwordHash,
                phone: profile.phone,
                is_verified: true,
                last_login_at: randomRecentDate(createdAt, endDate),
                status: 'active'
            });

            await applyTimestamps('users', user.id, createdAt, randomRecentDate(createdAt, endDate));
            users.push(user);
        }
    }

    return { users, primaryUser };
}

async function seedRefreshTokens(users, startDate, endDate, tableSet, counters) {
    if (!tableSet.has('refresh_tokens')) {
        return;
    }

    for (const user of users) {
        if (!chance(0.45)) {
            continue;
        }

        const createdAt = randomDateInRange(startDate, endDate);
        const expiresAt = new Date(createdAt.getTime() + randomInt(3, 30) * 24 * 60 * 60 * 1000);
        const revokedAt = chance(0.2) ? randomDateInRange(createdAt, endDate) : null;

        const token = await db.RefreshToken.create({
            user_id: user.id,
            token: `seed_${uuidToken()}`,
            expires_at: expiresAt,
            revoked_at: revokedAt
        });

        await db.sequelize.getQueryInterface().bulkUpdate('refresh_tokens', {
            created_at: createdAt
        }, { id: token.id });

        counters.refresh_tokens += 1;
    }
}

async function createWorkspaceInvitations(workspace, inviter, startDate, endDate, tableSet, counters) {
    if (!tableSet.has('workspace_invitations')) {
        return;
    }

    const count = randomInt(1, 3);
    const statuses = ['pending', 'accepted'];
    const roles = ['admin', 'member'];

    for (let i = 0; i < count; i += 1) {
        const createdAt = randomDateInRange(startDate, endDate);
        const status = randomFrom(statuses);
        const acceptedAt = status === 'accepted' ? randomDateInRange(createdAt, endDate) : null;

        const invitation = await db.WorkspaceInvitation.create({
            workspace_id: workspace.id,
            invited_by: inviter.id,
            email: `invite.ws.${Date.now()}${i}@example.com`,
            role: randomFrom(roles),
            token: `ws_inv_${uuidToken()}`,
            status,
            expires_at: new Date(createdAt.getTime() + randomInt(3, 10) * 24 * 60 * 60 * 1000),
            accepted_at: acceptedAt
        });

        await applyTimestamps('workspace_invitations', invitation.id, createdAt, acceptedAt || createdAt);
        counters.workspace_invitations += 1;
    }
}

async function createProjectInvitations(project, workspaceMembers, inviter, startDate, endDate, tableSet, counters) {
    if (!tableSet.has('project_invitations') || workspaceMembers.length === 0) {
        return;
    }

    const inviteCount = randomInt(1, Math.min(3, workspaceMembers.length));
    const shuffled = [...workspaceMembers].sort(() => Math.random() - 0.5).slice(0, inviteCount);
    const statuses = ['pending', 'accepted', 'rejected'];
    const roles = ['lead', 'member', 'viewer'];

    for (const member of shuffled) {
        const createdAt = randomDateInRange(startDate, endDate);
        const status = randomFrom(statuses);
        const acceptedAt = status === 'accepted' ? randomDateInRange(createdAt, endDate) : null;

        const invitation = await db.ProjectInvitation.create({
            project_id: project.id,
            workspace_member_id: member.id,
            invited_by: inviter.id,
            role: randomFrom(roles),
            status,
            accepted_at: acceptedAt
        });

        await applyTimestamps('project_invitations', invitation.id, createdAt, acceptedAt || createdAt);
        counters.project_invitations += 1;
    }
}

async function createAIData(project, workspace, creator, tasks, startDate, endDate, tableSet, counters) {
    if (tableSet.has('ai_task_generations')) {
        const generationCount = randomInt(1, 3);
        for (let i = 0; i < generationCount; i += 1) {
            const createdAt = randomDateInRange(startDate, endDate);
            const generated = [
                { title: `${randomFrom(TASK_LIBRARY).title} - AI Draft`, priority: randomFrom(['low', 'medium', 'high']) },
                { title: `${randomFrom(TASK_LIBRARY).title} - AI Suggestion`, priority: randomFrom(['medium', 'high']) }
            ];

            const acceptedTaskIds = tasks.length > 0
                ? [randomFrom(tasks).id]
                : [];

            const generation = await createWithProjectIdFallback(db.AITaskGeneration, {
                project_id: project.id,
                created_by: creator.id,
                prompt: `Generate actionable delivery plan for ${project.name}`,
                generated_tasks: generated,
                accepted_task_ids: acceptedTaskIds,
                tokens_used: randomInt(600, 2400)
            });

            await db.sequelize.getQueryInterface().bulkUpdate('ai_task_generations', {
                created_at: createdAt
            }, { id: generation.id });

            counters.ai_task_generations += 1;
        }
    }

    if (tableSet.has('ai_project_summaries')) {
        const summaryTypes = ['daily', 'weekly'];
        const summaryCount = randomInt(1, 3);

        for (let i = 0; i < summaryCount; i += 1) {
            const createdAt = randomDateInRange(startDate, endDate);
            const rangeStart = formatDateOnly(randomDateInRange(startDate, createdAt));
            const rangeEnd = formatDateOnly(createdAt);

            const summary = await createWithProjectIdFallback(db.AIProjectSummary, {
                project_id: project.id,
                created_by: creator.id,
                summary_type: randomFrom(summaryTypes),
                content: `Summary for ${project.name}: progress is stable, blockers are being handled, and next milestones are on track.`,
                date_range_start: rangeStart,
                date_range_end: rangeEnd,
                tokens_used: randomInt(400, 1800)
            });

            await db.sequelize.getQueryInterface().bulkUpdate('ai_project_summaries', {
                created_at: createdAt
            }, { id: summary.id });

            counters.ai_project_summaries += 1;
        }
    }

    if (tableSet.has('ai_chat_sessions') && tableSet.has('ai_chat_messages')) {
        const sessionCount = randomInt(1, 3);

        for (let s = 0; s < sessionCount; s += 1) {
            const sessionCreatedAt = randomDateInRange(startDate, endDate);
            const session = await createWithProjectIdFallback(db.AIChatSession, {
                workspace_id: workspace.id,
                project_id: project.id,
                created_by: creator.id,
                title: `${project.name} planning assistant`
            });

            await db.sequelize.getQueryInterface().bulkUpdate('ai_chat_sessions', {
                created_at: sessionCreatedAt
            }, { id: session.id });

            counters.ai_chat_sessions += 1;

            const messageCount = randomInt(4, 10);
            for (let m = 0; m < messageCount; m += 1) {
                const role = m % 2 === 0 ? 'user' : 'assistant';
                const createdAt = randomDateInRange(sessionCreatedAt, endDate);
                const message = await db.AIChatMessage.create({
                    session_id: session.id,
                    role,
                    content: role === 'user'
                        ? `What should we prioritize next for ${project.name}?`
                        : 'Prioritize high-risk tasks, unblock dependencies, and monitor delivery velocity.'
                });

                await db.sequelize.getQueryInterface().bulkUpdate('ai_chat_messages', {
                    created_at: createdAt
                }, { id: message.id });

                counters.ai_chat_messages += 1;
            }

            if (tableSet.has('ai_tool_logs')) {
                const toolLogCreatedAt = randomDateInRange(sessionCreatedAt, endDate);
                const toolLog = await db.AIToolLog.create({
                    session_id: session.id,
                    tool_name: randomFrom(['task_generator', 'risk_analyzer', 'summary_builder']),
                    input: { projectId: project.id, query: 'analyze project health' },
                    output: { risk: randomFrom(['low', 'medium']), recommendation: 'Continue current sprint plan' },
                    success: true
                });

                await db.sequelize.getQueryInterface().bulkUpdate('ai_tool_logs', {
                    created_at: toolLogCreatedAt
                }, { id: toolLog.id });

                counters.ai_tool_logs += 1;
            }
        }
    }
}

async function createNotifications(users, workspace, project, task, actor, startDate, endDate, tableSet, counters) {
    if (!tableSet.has('notifications')) {
        return;
    }

    const recipientCount = randomInt(1, Math.min(3, users.length));
    const recipients = [...users].sort(() => Math.random() - 0.5).slice(0, recipientCount);

    for (const recipient of recipients) {
        if (recipient.id === actor.id && chance(0.8)) {
            continue;
        }

        const createdAt = randomDateInRange(startDate, endDate);
        const type = randomFrom(NOTIFICATION_TYPES);
        const notification = await db.Notification.create({
            user_id: recipient.id,
            type,
            title: `${project.name}: ${type.replace(/_/g, ' ')}`,
            message: `Update on task "${task.title}" in workspace "${workspace.name}".`,
            is_read: chance(0.45),
            meta: {
                workspace_id: workspace.id,
                project_id: project.id,
                task_id: task.id,
                actor_id: actor.id
            }
        });

        await db.sequelize.getQueryInterface().bulkUpdate('notifications', {
            created_at: createdAt
        }, { id: notification.id });

        counters.notifications += 1;
    }
}

async function normalizeWorkspaceActivityToDailyGaps(workspaceId, anchorDate = new Date()) {
    const logs = await db.ActivityLog.findAll({
        where: { workspace_id: workspaceId },
        attributes: ['id'],
        order: [['created_at', 'DESC']]
    });

    if (!logs.length) {
        return 0;
    }

    const anchor = new Date(anchorDate);
    anchor.setHours(12, 0, 0, 0);

    for (let i = 0; i < logs.length; i += 1) {
        const ts = new Date(anchor.getTime() - i * 24 * 60 * 60 * 1000);
        await db.sequelize.getQueryInterface().bulkUpdate('activity_logs', {
            created_at: ts
        }, { id: logs[i].id });
    }

    return logs.length;
}

async function run() {
    const counters = {
        users: 0,
        refresh_tokens: 0,
        workspaces: 0,
        workspace_members: 0,
        workspace_invitations: 0,
        projects: 0,
        project_members: 0,
        project_invitations: 0,
        task_statuses: 0,
        project_labels: 0,
        tasks: 0,
        task_assignees: 0,
        task_tags: 0,
        task_dependencies: 0,
        comments: 0,
        attachments: 0,
        activity_logs: 0,
        notifications: 0,
        ai_chat_sessions: 0,
        ai_chat_messages: 0,
        ai_task_generations: 0,
        ai_project_summaries: 0,
        ai_tool_logs: 0
    };

    const { startDate, endDate: now } = getSeedWindow();
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

    try {
        console.log('========================================================');
        console.log('Real-World Dynamic Data Feeder (Schema-Aware)');
        console.log('========================================================');
        console.log(`Range: ${startDate.toISOString()} -> ${now.toISOString()}`);
        console.log(`Historic activity cutoff (must be older than): ${fifteenDaysAgo.toISOString()}`);
        console.log(`Workspaces to create: ${FEEDER_CONFIG.workspaceCount}`);
        if (FEEDER_CONFIG.primaryUserEmail) {
            console.log(`Primary owner account: ${FEEDER_CONFIG.primaryUserEmail}`);
        }

        const tableSet = await getExistingTableSet();
        const { users, primaryUser } = await ensureUsers(startDate, now);
        counters.users = users.length;

        await seedRefreshTokens(users, startDate, now, tableSet, counters);

        for (let w = 0; w < FEEDER_CONFIG.workspaceCount; w += 1) {
            const workspaceCreatedUpperBound = fifteenDaysAgo > startDate ? fifteenDaysAgo : now;
            const workspaceCreatedAt = randomDateInSafeRange(startDate, workspaceCreatedUpperBound);
            const owner = (w === 0 && primaryUser) ? primaryUser : randomFrom(users);
            const workspace = await db.Workspace.create({
                name: `${randomFrom(WORKSPACE_THEMES)} Workspace ${Date.now().toString().slice(-5)}${w}`,
                description: 'Operational workspace generated for realistic planning, execution, and collaboration data.',
                settings: {
                    timezone: 'Asia/Kolkata',
                    sprint_length_days: randomFrom([7, 14]),
                    working_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
                }
            });

            await applyTimestamps('workspaces', workspace.id, workspaceCreatedAt, randomRecentDate(workspaceCreatedAt, now));
            counters.workspaces += 1;

            const workspaceMembers = [];
            const memberPool = [...users].filter((u) => u.id !== owner.id).sort(() => Math.random() - 0.5);
            const memberCount = randomInt(4, Math.min(8, users.length));
            const selectedUsers = [owner, ...memberPool.slice(0, Math.max(0, memberCount - 1))];

            for (let i = 0; i < selectedUsers.length; i += 1) {
                const user = selectedUsers[i];
                const role = i === 0 ? 'owner' : randomFrom(['admin', 'member']);
                const joinedAt = randomDateInRange(workspaceCreatedAt, now);

                const [wsMember] = await db.WorkspaceMember.findOrCreate({
                    where: { workspace_id: workspace.id, user_id: user.id },
                    defaults: { role, joined_at: joinedAt }
                });

                if (wsMember.role !== role) {
                    await wsMember.update({ role });
                }

                await applyTimestamps('workspace_members', wsMember.id, joinedAt, randomRecentDate(joinedAt, now));
                workspaceMembers.push(wsMember);
                counters.workspace_members += 1;
            }

            await createWorkspaceInvitations(workspace, owner, workspaceCreatedAt, now, tableSet, counters);

            const projectsToCreate = randomInt(FEEDER_CONFIG.projectsPerWorkspaceMin, FEEDER_CONFIG.projectsPerWorkspaceMax);
            for (let p = 0; p < projectsToCreate; p += 1) {
                const projectBase = randomFrom(PROJECT_BLUEPRINTS);
                const projectCreatedUpperBound = fifteenDaysAgo > workspaceCreatedAt ? fifteenDaysAgo : now;
                const projectCreatedAt = randomDateInSafeRange(workspaceCreatedAt, projectCreatedUpperBound);
                const projectStartDate = randomDateInSafeRange(workspaceCreatedAt, projectCreatedAt);
                const project = await db.Project.create({
                    workspace_id: workspace.id,
                    name: `${projectBase.name} ${p + 1}`,
                    description: projectBase.description,
                    color: randomHexColor(),
                    image_url: `https://picsum.photos/seed/${Date.now()}${p}/1200/630`,
                    start_date: projectStartDate,
                    end_date: chance(0.4) ? randomDateInRange(projectStartDate, now) : null,
                    settings: {
                        estimation: randomFrom(['story_points', 'hours']),
                        risk_mode: randomFrom(['conservative', 'balanced', 'aggressive'])
                    }
                });

                await applyTimestamps('projects', project.id, projectCreatedAt, randomRecentDate(projectCreatedAt, now));
                counters.projects += 1;

                const projectMembers = [];
                const projectMemberCandidates = [...workspaceMembers].sort(() => Math.random() - 0.5);
                const projectMemberCount = randomInt(3, Math.min(projectMemberCandidates.length, 6));

                for (let pm = 0; pm < projectMemberCount; pm += 1) {
                    const wsMember = projectMemberCandidates[pm];
                    const addedAt = randomDateInRange(projectCreatedAt, now);
                    const projectMember = await db.ProjectMember.create({
                        project_id: project.id,
                        workspace_member_id: wsMember.id,
                        project_role: pm === 0 ? 'lead' : randomFrom(['member', 'viewer']),
                        added_at: addedAt
                    });

                    await applyTimestamps('project_members', projectMember.id, addedAt, addedAt);
                    projectMembers.push(projectMember);
                    counters.project_members += 1;
                }

                await createProjectInvitations(project, workspaceMembers, owner, projectCreatedAt, now, tableSet, counters);

                const statusesBlueprint = [
                    { name: 'To Do', color: '#94A3B8', is_default: true, is_completed: false },
                    { name: 'In Progress', color: '#3B82F6', is_default: false, is_completed: false },
                    { name: 'Review', color: '#F59E0B', is_default: false, is_completed: false },
                    { name: 'Done', color: '#10B981', is_default: false, is_completed: true }
                ];

                const statuses = [];
                for (let s = 0; s < statusesBlueprint.length; s += 1) {
                    const createdAt = randomDateInRange(projectCreatedAt, now);
                    const statusData = statusesBlueprint[s];
                    const status = await db.TaskStatus.create({
                        project_id: project.id,
                        name: statusData.name,
                        color: statusData.color,
                        position: s,
                        is_default: statusData.is_default,
                        is_completed: statusData.is_completed
                    });

                    await applyTimestamps('task_statuses', status.id, createdAt, createdAt);
                    statuses.push(status);
                    counters.task_statuses += 1;
                }

                const labels = [];
                const labelNames = ['Backend', 'Frontend', 'Urgent', 'Tech Debt', 'Blocked', 'QA', 'Infra'];
                const shuffledLabels = [...labelNames].sort(() => Math.random() - 0.5).slice(0, randomInt(4, 6));

                for (const labelName of shuffledLabels) {
                    const label = await db.ProjectLabel.create({
                        project_id: project.id,
                        name: labelName,
                        color: randomHexColor()
                    });

                    if (tableSet.has('project_labels')) {
                        const labelCreatedAt = randomDateInRange(projectCreatedAt, now);
                        await db.sequelize.getQueryInterface().bulkUpdate('project_labels', {
                            created_at: labelCreatedAt,
                            updated_at: labelCreatedAt
                        }, { id: label.id });
                    }

                    labels.push(label);
                    counters.project_labels += 1;
                }

                const tasks = [];
                const taskCount = randomInt(FEEDER_CONFIG.tasksPerProjectMin, FEEDER_CONFIG.tasksPerProjectMax);
                const doneStatus = statuses.find((s) => s.is_completed) || statuses[statuses.length - 1];

                for (let t = 0; t < taskCount; t += 1) {
                    const creatorProjectMember = randomFrom(projectMembers);
                    const creatorWsMember = workspaceMembers.find((wm) => wm.id === creatorProjectMember.workspace_member_id);
                    const createdAt = randomDateInRange(projectCreatedAt, now);
                    const startAt = chance(0.85) ? randomDateInRange(projectCreatedAt, now) : null;
                    const dueAt = chance(0.75) ? randomDateInRange(createdAt, new Date(now.getTime() + randomInt(1, 5) * 24 * 60 * 60 * 1000)) : null;

                    const chosenStatus = chance(0.45)
                        ? doneStatus
                        : randomFrom(statuses);

                    const completedAt = chosenStatus.is_completed ? randomDateInRange(createdAt, now) : null;

                    const template = randomFrom(TASK_LIBRARY);
                    const task = await db.Task.create({
                        project_id: project.id,
                        status_id: chosenStatus.id,
                        title: `${template.title} #${t + 1}`,
                        description: template.description,
                        priority: randomFrom(['low', 'medium', 'high', 'urgent']),
                        start_date: startAt,
                        due_date: dueAt,
                        estimated_hours: Number((Math.random() * 16 + 2).toFixed(2)),
                        actual_hours: chance(0.5) ? Number((Math.random() * 14 + 1).toFixed(2)) : null,
                        position: t,
                        created_by: creatorWsMember.user_id,
                        parent_task_id: tasks.length > 0 && chance(0.2) ? randomFrom(tasks).id : null,
                        completed_at: completedAt,
                        archived_at: null
                    });

                    await applyTimestamps('tasks', task.id, createdAt, completedAt || randomRecentDate(createdAt, now));
                    tasks.push(task);
                    counters.tasks += 1;

                    const assigneeCount = randomInt(1, Math.min(2, projectMembers.length));
                    const assignees = [...projectMembers].sort(() => Math.random() - 0.5).slice(0, assigneeCount);
                    for (const assignee of assignees) {
                        const assignedAt = randomDateInRange(createdAt, now);
                        const taskAssignee = await db.TaskAssignee.create({
                            task_id: task.id,
                            project_member_id: assignee.id,
                            assigned_at: assignedAt
                        });

                        await applyTimestamps('task_assignees', taskAssignee.id, assignedAt, assignedAt);
                        counters.task_assignees += 1;
                    }

                    if (labels.length > 0 && chance(0.7)) {
                        const tagCount = randomInt(1, Math.min(3, labels.length));
                        const selectedLabels = [...labels].sort(() => Math.random() - 0.5).slice(0, tagCount);
                        for (const label of selectedLabels) {
                            const createdTagAt = randomDateInRange(createdAt, now);
                            const taskTagId = crypto.randomUUID();
                            await db.sequelize.getQueryInterface().bulkInsert('task_tags', [{
                                id: taskTagId,
                                task_id: task.id,
                                label_id: label.id,
                                created_at: createdTagAt,
                                updated_at: createdTagAt
                            }]);

                            counters.task_tags += 1;
                        }
                    }

                    if (tasks.length > 1 && chance(0.35)) {
                        const dependsOn = randomFrom(tasks.slice(0, -1));
                        if (dependsOn && dependsOn.id !== task.id) {
                            const depCreatedAt = randomDateInRange(createdAt, now);
                            const dep = await db.TaskDependency.create({
                                task_id: task.id,
                                depends_on_task_id: dependsOn.id,
                                dependency_type: randomFrom(['blocks', 'blocked_by'])
                            });

                            await applyTimestamps('task_dependencies', dep.id, depCreatedAt, depCreatedAt);
                            counters.task_dependencies += 1;
                        }
                    }

                    const commentCount = randomInt(0, 3);
                    for (let c = 0; c < commentCount; c += 1) {
                        const commenter = randomFrom(workspaceMembers);
                        const commentCreatedAt = randomDateInRange(createdAt, now);
                        const comment = await db.Comment.create({
                            task_id: task.id,
                            user_id: commenter.user_id,
                            message: randomFrom(COMMENT_LIBRARY)
                        });

                        await db.sequelize.getQueryInterface().bulkUpdate('comments', {
                            created_at: commentCreatedAt
                        }, { id: comment.id });
                        counters.comments += 1;

                        if (chance(0.35)) {
                            const replier = randomFrom(workspaceMembers);
                            const replyAt = randomDateInRange(commentCreatedAt, now);
                            const reply = await db.Comment.create({
                                task_id: task.id,
                                user_id: replier.user_id,
                                message: 'Acknowledged, I will follow up with an update.',
                                parent_comment_id: comment.id
                            });

                            await db.sequelize.getQueryInterface().bulkUpdate('comments', {
                                created_at: replyAt
                            }, { id: reply.id });
                            counters.comments += 1;
                        }
                    }

                    if (chance(0.55)) {
                        const uploader = randomFrom(workspaceMembers);
                        const attachmentCreatedAt = randomDateInRange(createdAt, now);
                        const attachment = await db.Attachment.create({
                            task_id: task.id,
                            uploaded_by: uploader.user_id,
                            file_url: `https://files.example.com/${task.id}/${uuidToken().slice(0, 10)}.pdf`,
                            file_name: randomFrom(['spec.pdf', 'release-notes.docx', 'test-report.xlsx', 'timeline.pptx']),
                            file_size: randomInt(45_000, 2_500_000),
                            mime_type: randomFrom([
                                'application/pdf',
                                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                            ])
                        });

                        await db.sequelize.getQueryInterface().bulkUpdate('attachments', {
                            created_at: attachmentCreatedAt
                        }, { id: attachment.id });
                        counters.attachments += 1;
                    }

                    const actor = randomFrom(workspaceMembers);
                    const activityActions = ['task_created', 'task_assigned', 'status_changed', 'comment_added'];
                    const activityCount = randomInt(1, 2);
                    for (let a = 0; a < activityCount; a += 1) {
                        const logAt = randomDateInRange(createdAt, now);
                        const log = await createWithProjectIdFallback(db.ActivityLog, {
                            workspace_id: workspace.id,
                            project_id: project.id,
                            task_id: task.id,
                            actor_id: actor.user_id,
                            action: randomFrom(activityActions),
                            meta: {
                                source: 'data-feeder',
                                task_priority: task.priority,
                                status_id: task.status_id
                            }
                        });

                        await db.sequelize.getQueryInterface().bulkUpdate('activity_logs', {
                            created_at: logAt
                        }, { id: log.id });
                        counters.activity_logs += 1;
                    }

                    await createNotifications(
                        workspaceMembers.map((wm) => ({ id: wm.user_id })),
                        workspace,
                        project,
                        task,
                        { id: actor.user_id },
                        createdAt,
                        now,
                        tableSet,
                        counters
                    );
                }

                // Guarantee at least one visible historical activity older than 15 days for each project.
                if (tasks.length > 0 && workspaceMembers.length > 0 && startDate < fifteenDaysAgo) {
                    const historicTask = randomFrom(tasks);
                    const historicActor = randomFrom(workspaceMembers);
                    const historicAt = randomDateInSafeRange(startDate, fifteenDaysAgo);
                    const historicLog = await createWithProjectIdFallback(db.ActivityLog, {
                        workspace_id: workspace.id,
                        project_id: project.id,
                        task_id: historicTask.id,
                        actor_id: historicActor.user_id,
                        action: 'status_changed',
                        meta: {
                            source: 'data-feeder',
                            task_title: historicTask.title,
                            old_status: 'To Do',
                            new_status: 'In Progress',
                            note: 'Backfilled historical activity to mimic real team timeline.'
                        }
                    });

                    await db.sequelize.getQueryInterface().bulkUpdate('activity_logs', {
                        created_at: historicAt
                    }, { id: historicLog.id });
                    counters.activity_logs += 1;
                }

                await createAIData(project, workspace, owner, tasks, projectCreatedAt, now, tableSet, counters);
            }

            const shouldNormalizeDailyGaps = FEEDER_CONFIG.dailyGapWorkspaceKeywords
                .some((keyword) => workspace.name.toLowerCase().includes(keyword));

            if (shouldNormalizeDailyGaps) {
                const normalizedCount = await normalizeWorkspaceActivityToDailyGaps(workspace.id, now);
                console.log(`Daily-gap normalized activity logs for workspace "${workspace.name}": ${normalizedCount}`);
            }
        }

        const oldestTask = await db.Task.findOne({
            order: [['created_at', 'ASC']],
            attributes: ['id', 'created_at']
        });

        const latestTask = await db.Task.findOne({
            order: [['created_at', 'DESC']],
            attributes: ['id', 'created_at']
        });

        console.log('\n================ FEEDER SUMMARY ================');
        Object.entries(counters).forEach(([table, count]) => {
            console.log(`${table}: ${count}`);
        });
        if (oldestTask) {
            console.log(`Oldest task timestamp in DB: ${oldestTask.created_at.toISOString()} (${oldestTask.id})`);
        }
        if (latestTask) {
            console.log(`Latest task timestamp in DB: ${latestTask.created_at.toISOString()} (${latestTask.id})`);
        }
        console.log('================================================');
        console.log('Data feeding completed successfully.');
    } catch (error) {
        console.error('\n!!! DATA FEEDER FAILED !!!');
        console.error('Error message:', error.message);
        if (error.stack) {
            console.error('Stack:', error.stack);
        }
        if (error.sql) {
            console.error('SQL:', error.sql);
        }
        if (error.parent) {
            console.error('DB details:', error.parent.message || error.parent);
        }
    } finally {
        await db.sequelize.close();
    }
}

run();
