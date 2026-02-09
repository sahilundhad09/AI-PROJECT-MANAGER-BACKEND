const { User, Workspace, WorkspaceMember, Project, ProjectMember, TaskStatus } = require('./src/database/models');
const bcrypt = require('bcryptjs');

async function createTestUser() {
    try {
        // Create user
        const hashedPassword = await bcrypt.hash('Test123!@#', 10);
        const [user, created] = await User.findOrCreate({
            where: { email: 'testuser@example.com' },
            defaults: {
                name: 'Test User',
                password_hash: hashedPassword
            }
        });

        console.log(created ? 'User created' : 'User already exists');

        // Create workspace
        const [workspace] = await Workspace.findOrCreate({
            where: { name: 'Test Workspace' },
            defaults: {
                name: 'Test Workspace',
                // owner_id removed as it doesn't exist
            }
        });

        // Add user to workspace
        await WorkspaceMember.findOrCreate({
            where: { user_id: user.id, workspace_id: workspace.id },
            defaults: { role: 'owner' }
        });

        // Create project
        const [project] = await Project.findOrCreate({
            where: { id: '5fdcf06f-3bfc-4f84-8857-1b2fea503870' },
            defaults: {
                workspace_id: workspace.id,
                name: 'AI Test Project',
                description: 'Project for testing AI features',
                // status removed as it might not be in model or default is fine?
                // owner_id removed
            }
        });

        // Create Default Task Statuses
        await TaskStatus.findOrCreate({
            where: { project_id: project.id, name: 'To Do' },
            defaults: {
                color: '#CBD5E1',
                position: 0,
                is_default: true
            }
        });

        await TaskStatus.findOrCreate({
            where: { project_id: project.id, name: 'In Progress' },
            defaults: {
                color: '#3B82F6',
                position: 1
            }
        });

        await TaskStatus.findOrCreate({
            where: { project_id: project.id, name: 'Done' },
            defaults: {
                color: '#22C55E',
                position: 2
            }
        });

        // Get workspace member
        const workspaceMember = await WorkspaceMember.findOne({
            where: { user_id: user.id, workspace_id: workspace.id }
        });

        // Add user to project
        await ProjectMember.findOrCreate({
            where: {
                project_id: project.id,
                workspace_member_id: workspaceMember.id
            },
            defaults: {
                project_role: 'lead'
            }
        });

        console.log('✅ Test environment ready');
        console.log(`User: ${user.email}`);
        console.log(`Project ID: ${project.id}`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

createTestUser();
