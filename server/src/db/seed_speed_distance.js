const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const seedSpeedDistance = async () => {
    const client = await pool.connect();
    try {
        const nodeRes = await client.query("SELECT id FROM aptitude_nodes WHERE slug = 'time-speed-distance'");
        if (nodeRes.rows.length === 0) { console.error('Node not found!'); return; }
        const nodeId = nodeRes.rows[0].id;

        const existing = await client.query('SELECT COUNT(*) as cnt FROM aptitude_content WHERE node_id = $1', [nodeId]);
        if (parseInt(existing.rows[0].cnt) > 0) { console.log('Content exists, skipping.'); return; }

        await client.query('BEGIN');
        const items = [
            { type: 'spark_lesson', title: 'Relative Speed', sort: 1, body:
`## The Core of Meeting and Catching

### The Core Formula
The fundamental formula for Time, Speed, and Distance is:
**Time = Distance / Speed**

However, when two objects are moving simultaneously, we use **Relative Speed**.

### Scenario 1: Moving Towards Each Other
When two objects approach each other from opposite directions, they cover the intermediate distance together.
* **Relative Speed = Speed A + Speed B**
* If Car A goes at 60 m/s and Car B goes at 40 m/s, they effectively reduce the distance between them by 100 meters every second.

### Scenario 2: Moving in the Same Direction (Chasing)
When one object chases another, the distance between them decreases by the *difference* in their speeds.
* **Relative Speed = |Speed A - Speed B|**
* If Car A chases Car B, and Car A is 20 m/s faster, it closes the initial gap by 20 meters every second.

> 💡 **Pro Tip:** In train crossing problems, the "Distance" to be covered is often the sum of the lengths of both moving objects!` },
            { type: 'forge_question', title: 'Basic Relativity', sort: 1, difficulty: 'easy',
              body: 'Two trains, 100 m and 120 m long, are running in opposite directions on parallel tracks at 50 km/hr and 58 km/hr respectively. In what time will they pass each other?',
              options: JSON.stringify([{key:'A',text:'7.33 seconds',isCorrect:true},{key:'B',text:'10 seconds',isCorrect:false},{key:'C',text:'12 seconds',isCorrect:false},{key:'D',text:'15 seconds',isCorrect:false}]),
              answer: 'A', explanation: 'Total distance = 100 + 120 = 220 m. Relative speed = 50 + 58 = 108 km/hr. Convert to m/s: 108 * (5/18) = 30 m/s. Time = Distance / Speed = 220 / 30 = 7.33 seconds.' },
            { type: 'arena_question', title: 'AQ1', sort: 1, difficulty: 'medium', timeLimit: 90,
              body: 'A thief is noticed by a policeman from a distance of 200 m. The thief starts running and the policeman chases him. The thief and the policeman run at the rate of 10 km and 11 km per hour respectively. What is the distance between them after 6 minutes?',
              options: JSON.stringify([{key:'A',text:'100 m',isCorrect:true},{key:'B',text:'150 m',isCorrect:false},{key:'C',text:'190 m',isCorrect:false},{key:'D',text:'200 m',isCorrect:false}]),
              answer: 'A', explanation: 'Relative speed of policeman = 11 - 10 = 1 km/hr = 1000 m/hr. Distance covered in 6 min = (1000/60) * 6 = 100 meters. Initial distance was 200m. Remaining distance = 200 - 100 = 100m.' }
        ];

        for (const item of items) {
            await client.query(
                `INSERT INTO aptitude_content (node_id, content_type, title, body, options, answer, explanation, difficulty, time_limit_seconds, sort_order)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
                [nodeId, item.type, item.title, item.body, item.options || '[]',
                 item.answer || null, item.explanation || null, item.difficulty || 'medium',
                 item.timeLimit || 60, item.sort || 0]
            );
        }

        await client.query('COMMIT');
        console.log(`✅ Seeded ${items.length} items for time-speed-distance (nodeId: ${nodeId})`);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Failed:', err.message);
    } finally { client.release(); await pool.end(); }
};

seedSpeedDistance();
