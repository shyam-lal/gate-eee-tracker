const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const seedBloodRelations = async () => {
    const client = await pool.connect();
    try {
        const nodeRes = await client.query("SELECT id FROM aptitude_nodes WHERE slug = 'blood-relations'");
        if (nodeRes.rows.length === 0) { console.error('Node not found!'); return; }
        const nodeId = nodeRes.rows[0].id;

        const existing = await client.query('SELECT COUNT(*) as cnt FROM aptitude_content WHERE node_id = $1', [nodeId]);
        if (parseInt(existing.rows[0].cnt) > 0) { console.log('Content exists, skipping.'); return; }

        await client.query('BEGIN');
        const items = [
            { type: 'spark_lesson', title: 'The Generational Anchor', sort: 1, body:
`## Blood Relations = Drawing the Family Tree

### The Core Insight
Never try to hold blood relations in your head. Always draw a family tree. 
The key is **separating people into generations**.

### Generational Levels
1. **Gen 1 (Top):** Grandparents
2. **Gen 2 (Middle):** Parents, Aunts, Uncles
3. **Gen 3 (Bottom):** Children, Nieces, Nephews

### Standard Notations for Exams
* **Square (or +):** Male
* **Circle (or -):** Female
* **Vertical Line:** Parent-Child relationship
* **Horizontal Line:** Sibling relationship
* **Double Horizontal Line (=):** Marriage

### Step-by-Step Approach
1. Take one statement at a time.
2. Determine the generation gap (e.g., "Father" = +1 generation).
3. Connect them on paper using the notations above.
4. If a statement introduces people not yet on your tree, hold it until later.` },
            { type: 'forge_question', title: 'Basic Relationship', sort: 1, difficulty: 'easy',
              body: 'Pointing to a photograph, a man said, "I have no brother or sister but that man\'s father is my father\'s son." Whose photograph was it?',
              options: JSON.stringify([{key:'A',text:'His own',isCorrect:false},{key:'B',text:'His son\'s',isCorrect:true},{key:'C',text:'His father\'s',isCorrect:false},{key:'D',text:'His nephew\'s',isCorrect:false}]),
              answer: 'B', explanation: '"My father\'s son" is the man himself (since he has no brother or sister). So the statement becomes "that man\'s father is ME". Therefore, the photograph is of his son.' },
            { type: 'forge_question', title: 'Coded Relations', sort: 2, difficulty: 'medium',
              body: 'If A + B means A is the brother of B; A * B means A is the son of B; and A % B means B is the daughter of A then which of the following means M is the maternal uncle of N?',
              options: JSON.stringify([{key:'A',text:'M + O * N',isCorrect:false},{key:'B',text:'M % O * N + P',isCorrect:false},{key:'C',text:'M + O % N',isCorrect:true},{key:'D',text:'None of these',isCorrect:false}]),
              answer: 'C', explanation: 'We need M to be the brother of N\'s mother. \nIn C: M + O means M is the brother of O. O % N means N is the daughter of O. So O is N\'s mother (since M is maternal uncle, meaning mother\'s brother). Thus, M is N\'s maternal uncle.' },
            { type: 'arena_question', title: 'AQ1', sort: 1, difficulty: 'easy', timeLimit: 60,
              body: 'A is the brother of B. B is the brother of C. C is the husband of D. E is the father of A. D is related to E as:',
              options: JSON.stringify([{key:'A',text:'Daughter',isCorrect:false},{key:'B',text:'Daughter-in-law',isCorrect:true},{key:'C',text:'Sister-in-law',isCorrect:false},{key:'D',text:'Sister',isCorrect:false}]),
              answer: 'B', explanation: 'A, B, C are brothers. E is their father. D is C\'s wife. Therefore, D is the daughter-in-law of E.' },
            { type: 'arena_question', title: 'AQ2', sort: 2, difficulty: 'medium', timeLimit: 90,
              body: 'Introducing a woman, a man said, "Her mother\'s husband\'s sister is my aunt." How is the man related to the woman?',
              options: JSON.stringify([{key:'A',text:'Nephew',isCorrect:false},{key:'B',text:'Brother',isCorrect:true},{key:'C',text:'Son',isCorrect:false},{key:'D',text:'Cousin',isCorrect:false}]),
              answer: 'B', explanation: 'Her mother\'s husband = Her father. Her father\'s sister = Her aunt. If her aunt is the man\'s aunt, they must be siblings (Brother/Sister) or cousins. If we consider direct relation, Brother is the primary answer.' }
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
        console.log(`✅ Seeded ${items.length} items for blood-relations (nodeId: ${nodeId})`);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Failed:', err.message);
    } finally { client.release(); await pool.end(); }
};

seedBloodRelations();
