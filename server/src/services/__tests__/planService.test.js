const planService = require('../planService');
const pool = require('../../config/db');
const taskService = require('../taskService');

// Mock dependencies
jest.mock('../../config/db', () => ({
    query: jest.fn(),
}));

jest.mock('../taskService', () => ({
    computeTimeDecay: jest.fn(),
}));

describe('Daily Battle Plan Engine', () => {
    const mockUserId = 'user-123';
    const mockExamId = 'exam-456';

    let mockQueryOverride = null;

    beforeEach(() => {
        jest.clearAllMocks();
        mockQueryOverride = null;
        
        // Default mocks
        taskService.computeTimeDecay.mockImplementation((conf) => conf); // No decay by default
        
        pool.query.mockImplementation((queryStr, values) => {
            if (mockQueryOverride) {
                const res = mockQueryOverride(queryStr, values);
                if (res !== undefined) return res;
            }

            if (queryStr.includes('SELECT ue.*, e.name as exam_name')) {
                return Promise.resolve({
                    rows: [{
                        exam_id: mockExamId,
                        learning_preferences: {},
                        target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        daily_available_hours: 2,
                    }]
                });
            }
            if (queryStr.includes('SELECT * FROM user_daily_plans')) {
                // By default, no existing plan
                return Promise.resolve({ rows: [] });
            }
            if (queryStr.includes('SELECT tasks FROM user_daily_plans WHERE user_id = $1 AND exam_id = $2 AND plan_date = $3')) {
                // fetchYesterdayPerformance
                return Promise.resolve({ rows: [] });
            }
            if (queryStr.includes('SELECT plan_date, COALESCE(SUM(actual_duration), 0)')) {
                // computeFatigueScore
                return Promise.resolve({ rows: [] });
            }
            if (queryStr.includes('SELECT MAX(plan_date) as last_active')) {
                // computeInactivityDays
                return Promise.resolve({ rows: [{ last_active: new Date() }] });
            }
            if (queryStr.includes('SELECT DISTINCT plan_date FROM user_task_logs')) {
                // computeConsecutiveActiveDays
                return Promise.resolve({ rows: [] });
            }
            if (queryStr.includes('WHERE user_id = $1 AND exam_id = $2 AND status = \'COMPLETED\'')) {
                // computeStreak
                return Promise.resolve({ rows: [] });
            }
            if (queryStr.includes('SELECT COUNT(*) as count FROM user_daily_plans')) {
                // checkIsFirstPlan
                return Promise.resolve({ rows: [{ count: 1 }] }); // Not first plan by default
            }
            if (queryStr.includes('SELECT et.id as topic_id')) {
                // Fetch topics
                return Promise.resolve({
                    rows: [
                        {
                            topic_id: 't1', topic_name: 'Topic 1', difficulty_level: 3, topic_weightage: 5,
                            subject_id: 's1', subject_name: 'Subject 1', subject_weightage: 10,
                            confidence: 0, status: 'NOT_STARTED', time_spent: 0, prerequisites: []
                        },
                        {
                            topic_id: 't2', topic_name: 'Topic 2', difficulty_level: 2, topic_weightage: 5,
                            subject_id: 's1', subject_name: 'Subject 1', subject_weightage: 10,
                            confidence: 0, status: 'NOT_STARTED', time_spent: 0, prerequisites: []
                        },
                        {
                            topic_id: 't3', topic_name: 'Topic 3', difficulty_level: 4, topic_weightage: 5,
                            subject_id: 's2', subject_name: 'Subject 2', subject_weightage: 10,
                            confidence: 4, status: 'REVISING', time_spent: 60, prerequisites: []
                        }
                    ]
                });
            }
            if (queryStr.includes('INSERT INTO user_daily_plans')) {
                return Promise.resolve({
                    rows: [{ id: 'plan-789' }]
                });
            }
            
            return Promise.resolve({ rows: [] });
        });
    });

    describe('Setup & Basic Validation', () => {
        it('should throw an error if no active enrollment is found', async () => {
            mockQueryOverride = (queryStr) => {
                if (queryStr.includes('SELECT ue.*, e.name as exam_name')) return Promise.resolve({ rows: [] });
            };
            await expect(planService.generateDailyPlan(mockUserId)).rejects.toThrow('No active enrollment found');
        });

        it('should return cached plan if it already exists for today', async () => {
            const mockCachedPlan = { id: 'existing-plan' };
            mockQueryOverride = (queryStr) => {
                if (queryStr.includes('SELECT * FROM user_daily_plans')) {
                    return Promise.resolve({ rows: [mockCachedPlan] });
                }
            };
            
            const result = await planService.generateDailyPlan(mockUserId);
            expect(result).toEqual(mockCachedPlan);
        });

        it('should throw an error if no topics are found', async () => {
            mockQueryOverride = (queryStr) => {
                if (queryStr.includes('SELECT et.id as topic_id')) return Promise.resolve({ rows: [] }); // No topics
            };

            await expect(planService.generateDailyPlan(mockUserId)).rejects.toThrow('No topics found for this exam');
        });
    });

    describe('Calculation & Mission Marking', () => {
        it('should successfully generate a new daily plan', async () => {
            const plan = await planService.generateDailyPlan(mockUserId);
            
            expect(plan.id).toBe('plan-789');
            expect(plan.tasks.tasks.length).toBeGreaterThan(0);
            
            // First task should be ACTIVE, others PENDING
            expect(plan.tasks.tasks[0].status).toBe('ACTIVE');
            if (plan.tasks.tasks.length > 1) {
                expect(plan.tasks.tasks[1].status).toBe('PENDING');
            }
        });

        it('should guarantee at least one easy task if available', async () => {
            const plan = await planService.generateDailyPlan(mockUserId);
            const hasEasyTask = plan.tasks.tasks.some(t => t.difficulty_level <= 2);
            expect(hasEasyTask).toBe(true);
        });

        it('should apply prerequisites correctly (strict blocking)', async () => {
            mockQueryOverride = (queryStr) => {
                if (queryStr.includes('SELECT et.id as topic_id')) {
                    return Promise.resolve({
                        rows: [
                            {
                                topic_id: 't1', topic_name: 'Topic 1', difficulty_level: 3, topic_weightage: 5,
                                subject_id: 's1', confidence: 0, status: 'NOT_STARTED', time_spent: 0, prerequisites: []
                            },
                            {
                                topic_id: 't2', topic_name: 'Topic 2', difficulty_level: 2, topic_weightage: 5,
                                subject_id: 's1', confidence: 0, status: 'NOT_STARTED', time_spent: 0, prerequisites: ['t1'] // Blocked by t1
                            }
                        ]
                    });
                }
            };

            const plan = await planService.generateDailyPlan(mockUserId);
            const taskTopics = plan.tasks.tasks.map(t => t.topic_id);
            expect(taskTopics).toContain('t1');
            expect(taskTopics).not.toContain('t2'); // Blocked because t1 is NOT_STARTED
        });
    });

    describe('Edge Cases', () => {
        it('should generate a lighter plan for first-time users (max 4 tasks, no hard topics)', async () => {
            mockQueryOverride = (queryStr) => {
                if (queryStr.includes('SELECT COUNT(*) as count FROM user_daily_plans')) return Promise.resolve({ rows: [{ count: 0 }] }); // FIRST PLAN
                if (queryStr.includes('SELECT et.id as topic_id')) {
                    return Promise.resolve({
                        rows: [
                            { topic_id: 't1', topic_name: 'T1', difficulty_level: 5, status: 'NOT_STARTED', prerequisites: [] }, // Hard
                            { topic_id: 't2', topic_name: 'T2', difficulty_level: 2, status: 'NOT_STARTED', prerequisites: [] }, // Easy
                            { topic_id: 't3', topic_name: 'T3', difficulty_level: 1, status: 'NOT_STARTED', prerequisites: [] },
                            { topic_id: 't4', topic_name: 'T4', difficulty_level: 2, status: 'NOT_STARTED', prerequisites: [] },
                            { topic_id: 't5', topic_name: 'T5', difficulty_level: 2, status: 'NOT_STARTED', prerequisites: [] },
                            { topic_id: 't6', topic_name: 'T6', difficulty_level: 2, status: 'NOT_STARTED', prerequisites: [] }
                        ]
                    });
                }
            };

            const plan = await planService.generateDailyPlan(mockUserId);
            expect(plan.tasks.tasks.length).toBeLessThanOrEqual(4); // Capped at FIRST_PLAN_MAX_TASKS (4)
            const hasHardTask = plan.tasks.tasks.some(t => t.difficulty_level >= 4);
            expect(hasHardTask).toBe(false);
        });

        it('should trigger a buffer day (100% revision) every 7th active day', async () => {
            mockQueryOverride = (queryStr) => {
                if (queryStr.includes('SELECT DISTINCT plan_date FROM user_task_logs')) {
                    // Simulate 7 consecutive active days
                    const dates = [];
                    for(let i=1; i<=7; i++) {
                        const d = new Date(); d.setDate(d.getDate() - i);
                        dates.push({ plan_date: d.toISOString().split('T')[0] });
                    }
                    return Promise.resolve({ rows: dates });
                }
                if (queryStr.includes('SELECT et.id as topic_id')) {
                    return Promise.resolve({
                        rows: [
                            { topic_id: 't1', difficulty_level: 3, status: 'NOT_STARTED', prerequisites: [] }, // Learn
                            { topic_id: 't2', difficulty_level: 2, status: 'REVISING', prerequisites: [] } // Revise
                        ]
                    });
                }
            };

            const plan = await planService.generateDailyPlan(mockUserId);
            
            // Should only have REVISE tasks
            const hasLearn = plan.tasks.tasks.some(t => t.type === 'LEARN');
            expect(hasLearn).toBe(false);
            const hasRevise = plan.tasks.tasks.some(t => t.type === 'REVISE');
            expect(hasRevise).toBe(true);
        });
    });

    describe('Roadmap & Settings', () => {
        it('should generate roadmap data correctly', async () => {
            pool.query.mockImplementation((queryStr) => {
                if (queryStr.includes('SELECT ue.*, e.name as exam_name, e.full_name as exam_full_name')) {
                    return Promise.resolve({
                        rows: [{
                            exam_id: mockExamId,
                            exam_name: 'GATE CS',
                            exam_full_name: 'GATE Computer Science',
                            target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                            daily_available_hours: 2,
                        }]
                    });
                }
                if (queryStr.includes('SELECT es.id as subject_id, es.name as subject_name')) {
                    return Promise.resolve({
                        rows: [
                            {
                                subject_id: 's1', subject_name: 'Subject 1', weightage: 10,
                                topic_id: 't1', topic_name: 'Topic 1', difficulty_level: 3, topic_weightage: 5,
                                estimated_hours: 5, confidence: 4, status: 'REVISING', time_spent: 120
                            }
                        ]
                    });
                }
                if (queryStr.includes('SELECT COUNT(*) as total_tasks')) {
                    return Promise.resolve({ rows: [{ total_tasks: 10, completed_tasks: 8, skipped_tasks: 0, total_minutes: 100 }] });
                }
                if (queryStr.includes('SELECT plan_date FROM user_daily_plans')) {
                    return Promise.resolve({ rows: [] }); // Streak
                }
                return Promise.resolve({ rows: [] });
            });

            const roadmap = await planService.getRoadmapData(mockUserId);
            expect(roadmap).toBeDefined();
            expect(roadmap.exam.name).toBe('GATE CS');
            expect(roadmap.readiness.total_topics).toBe(1);
            expect(roadmap.readiness.revising).toBe(1);
            expect(roadmap.subjects.length).toBe(1);
            expect(roadmap.subjects[0].name).toBe('Subject 1');
            expect(roadmap.weekly_summary.this_week.completed_tasks).toBe(8);
        });

        it('should update settings correctly', async () => {
            pool.query.mockImplementation((queryStr) => {
                if (queryStr.includes('UPDATE user_enrollments SET')) {
                    return Promise.resolve({
                        rows: [{
                            daily_available_hours: 4,
                            target_date: '2027-01-01'
                        }]
                    });
                }
                return Promise.resolve({ rows: [] });
            });

            const newSettings = await planService.updateSettings(mockUserId, { daily_available_hours: 4 });
            expect(newSettings.daily_available_hours).toBe(4);
            expect(newSettings.target_date).toBe('2027-01-01');
        });
        
        it('should reject invalid daily_available_hours', async () => {
            await expect(planService.updateSettings(mockUserId, { daily_available_hours: 24 })).rejects.toThrow('daily_available_hours must be between 0.5 and 12');
        });
        
        it('should reject target_date in the past', async () => {
            await expect(planService.updateSettings(mockUserId, { target_date: '2000-01-01' })).rejects.toThrow('target_date must be in the future');
        });
    });
});
