#!/usr/bin/env node

/**
 * One-time migration script to fix tasks that were assigned before auto-progression was implemented
 * This will move all assigned tasks from "To Do" status to "In Progress" status
 */

const { Task, TaskStatus, TaskAssignee, ActivityLog, sequelize } = require('../src/database/models');

async function fixAssignedTasksInDefaultStatus() {
    const transaction = await sequelize.transaction();

    try {
        console.log('🔍 Finding assigned tasks stuck in default status...');

        // Find all tasks that:
        // 1. Have assignees
        // 2. Are in a default status (To Do)
        // 3. Are not archived
        const tasksToFix = await Task.findAll({
            include: [
                {
                    model: TaskAssignee,
                    as: 'assignees',
                    required: true // Only tasks WITH assignees
                },
                {
                    model: TaskStatus,
                    as: 'status',
                    where: {
                        is_default: true,
                        is_completed: false
                    },
                    include: [{
                        model: require('../src/database/models').Project,
                        as: 'project',
                        attributes: ['id', 'workspace_id']
                    }]
                }
            ],
            where: {
                archived_at: null
            },
            transaction
        });

        console.log(`📊 Found ${tasksToFix.length} tasks to fix`);

        if (tasksToFix.length === 0) {
            console.log('✅ No tasks need fixing!');
            await transaction.commit();
            return;
        }

        let fixed = 0;
        let skipped = 0;

        for (const task of tasksToFix) {
            // Find the first "In Progress" status for this project
            const inProgressStatus = await TaskStatus.findOne({
                where: {
                    project_id: task.project_id,
                    is_default: false,
                    is_completed: false
                },
                order: [['position', 'ASC']],
                transaction
            });

            if (!inProgressStatus) {
                console.log(`⚠️  Skipping task "${task.title}" - no In Progress status found in project`);
                skipped++;
                continue;
            }

            const oldStatusName = task.status.name;

            // Update the task status
            await task.update({
                status_id: inProgressStatus.id,
                completed_at: null
            }, { transaction });

            // Log the activity
            await ActivityLog.create({
                workspace_id: task.status.project.workspace_id || null,
                project_id: task.project_id,
                actor_id: null, // System action
                action: 'task_status_changed',
                description: `System Migration: Auto-moved "${task.title}" from ${oldStatusName} to ${inProgressStatus.name} (task was assigned but stuck in default status)`,
                meta: {
                    task_id: task.id,
                    from_status: oldStatusName,
                    to_status: inProgressStatus.name,
                    migration: true
                }
            }, { transaction });

            console.log(`✅ Fixed: "${task.title}" (${oldStatusName} → ${inProgressStatus.name})`);
            fixed++;
        }

        await transaction.commit();

        console.log('\n📈 Migration Summary:');
        console.log(`   Fixed: ${fixed} tasks`);
        console.log(`   Skipped: ${skipped} tasks`);
        console.log('✅ Migration completed successfully!');

    } catch (error) {
        await transaction.rollback();
        console.error('❌ Migration failed:', error.message);
        throw error;
    }
}

// Run the migration
fixAssignedTasksInDefaultStatus()
    .then(() => {
        console.log('\n🎉 All done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Fatal error:', error);
        process.exit(1);
    });
