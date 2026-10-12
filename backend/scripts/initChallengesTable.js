const db = require('../config/db');
const crypto = require('crypto');
const uuidv4 = () => crypto.randomUUID();

async function initChallenges() {
    try {
        console.log('Creating challenges table if not exists...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS challenges (
                id VARCHAR(36) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                title_ar VARCHAR(255) NULL,
                description TEXT NULL,
                description_ar TEXT NULL,
                image_url VARCHAR(500) NULL,
                target_sales INT DEFAULT 0,
                target_revenue DECIMAL(12,2) DEFAULT 0.00,
                reward_type VARCHAR(50) DEFAULT 'CASH',
                reward_amount DECIMAL(12,2) DEFAULT 0.00,
                reward_title VARCHAR(255) NULL,
                reward_title_ar VARCHAR(255) NULL,
                leg_limit_percent INT DEFAULT 40,
                required_directs INT DEFAULT 0,
                directs_type VARCHAR(50) DEFAULT 'ANY',
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // Check if challenges table has any records
        const [rows] = await db.query('SELECT COUNT(*) as count FROM challenges');
        if (rows[0].count === 0) {
            console.log('Seeding initial challenges...');
            const now = new Date();
            const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
            const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

            const seedChallenges = [
                {
                    id: uuidv4(),
                    title: 'Fast Start Challenge',
                    title_ar: 'تحدي الانطلاقة السريعة (Fast Start)',
                    description: 'Achieve your first 3 direct sales within your first 14 days on the platform to unlock exclusive instant cash reward.',
                    description_ar: 'حقق أول 3 مبيعات مباشرة خلال أول 14 يوماً من تسجيلك في المنصة لتحصل على مكافأة نقدية فورية وشارة المسوق الواعد.',
                    image_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop&q=60',
                    target_sales: 3,
                    target_revenue: 0,
                    reward_type: 'CASH',
                    reward_amount: 50,
                    reward_title: '$50 instant cash bonus + Rising Marketer badge',
                    reward_title_ar: '$50 بونص كاش فوري + شارة المسوق الواعد',
                    leg_limit_percent: 100,
                    required_directs: 3,
                    directs_type: 'ANY',
                    start_date: now.toISOString().split('T')[0],
                    end_date: in14Days.toISOString().split('T')[0],
                    status: 'active'
                },
                {
                    id: uuidv4(),
                    title: 'Team Builder Challenge',
                    title_ar: 'تحدي بناء الفريق الخماسي',
                    description: 'Help 5 members in your 1st generation make their first sale to earn leadership bonus and priority withdrawals.',
                    description_ar: 'ساعد 5 أعضاء في جيلك الأول على تحقيق مبيعاتهم لتفعيل مكافأة القيادة وترقية أولوية السحب.',
                    image_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=60',
                    target_sales: 5,
                    target_revenue: 750,
                    reward_type: 'CASH',
                    reward_amount: 150,
                    reward_title: '$150 USD leadership bonus + Priority payout',
                    reward_title_ar: '$150 USD بونص قيادة + ترقية أولوية السحب',
                    leg_limit_percent: 40,
                    required_directs: 5,
                    directs_type: 'FLOW',
                    start_date: now.toISOString().split('T')[0],
                    end_date: in30Days.toISOString().split('T')[0],
                    status: 'active'
                },
                {
                    id: uuidv4(),
                    title: 'Global Travel & VIP Leadership Gala',
                    title_ar: 'تحدي رحلة النخبة إلى دبي ومؤتمر القادة VIP',
                    description: 'Reach $5,000 USD in team sales and qualify for an all-expenses paid luxury trip to Dubai and VIP Mastermind.',
                    description_ar: 'حقق حجم مبيعات فريق يتجاوز $5,000 USD وتأهل لرحلة فاخرة مدفوعة التكاليف بالكامل إلى دبي مع إقامة 5 نجوم وحضور مؤتمر القادة.',
                    image_url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&auto=format&fit=crop&q=60',
                    target_sales: 10,
                    target_revenue: 5000,
                    reward_type: 'TRAVEL',
                    reward_amount: 1200,
                    reward_title: 'All-inclusive 5-star trip to Dubai + VIP Coaching Gala',
                    reward_title_ar: 'رحلة مدفوعة التكاليف بالكامل 5 نجوم إلى دبي + مؤتمر القادة VIP',
                    leg_limit_percent: 40,
                    required_directs: 5,
                    directs_type: 'ANY',
                    start_date: now.toISOString().split('T')[0],
                    end_date: in60Days.toISOString().split('T')[0],
                    status: 'active'
                }
            ];

            for (const c of seedChallenges) {
                await db.query(`
                    INSERT INTO challenges (
                        id, title, title_ar, description, description_ar, image_url,
                        target_sales, target_revenue, reward_type, reward_amount,
                        reward_title, reward_title_ar, leg_limit_percent, required_directs,
                        directs_type, start_date, end_date, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    c.id, c.title, c.title_ar, c.description, c.description_ar, c.image_url,
                    c.target_sales, c.target_revenue, c.reward_type, c.reward_amount,
                    c.reward_title, c.reward_title_ar, c.leg_limit_percent, c.required_directs,
                    c.directs_type, c.start_date, c.end_date, c.status
                ]);
            }
            console.log('Seeded 3 initial challenges successfully!');
        }

        console.log('Challenges table is ready!');
        process.exit(0);
    } catch (err) {
        console.error('Failed to init challenges table:', err);
        process.exit(1);
    }
}

initChallenges();
