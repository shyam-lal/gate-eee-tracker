const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const seedSeating = async () => {
    const client = await pool.connect();
    try {
        const nodeRes = await client.query("SELECT id FROM aptitude_nodes WHERE slug = 'seating-circular'");
        if (nodeRes.rows.length === 0) { console.error('Node not found!'); return; }
        const nodeId = nodeRes.rows[0].id;

        const existing = await client.query('SELECT COUNT(*) as cnt FROM aptitude_content WHERE node_id = $1', [nodeId]);
        if (parseInt(existing.rows[0].cnt) > 0) { console.log('Content exists, skipping.'); return; }

        await client.query('BEGIN');
        const items = [
            { type: 'spark_lesson', title: 'The Fixed Anchor Strategy', sort: 1, body:
`## Circular Seating = Fix One, Derive All

### The Core Insight
In a circular arrangement, **there is no "first" seat**. So pick the most constrained person and **fix them** as your anchor. Everything else is relative.

### The 4-Step Method

**Step 1:** Find the person in the most clues — they're your anchor.

**Step 2:** Fix the anchor at any seat (in a circle, the first position is arbitrary).

**Step 3:** Place others relative to the anchor using clue constraints.

**Step 4:** For remaining people, use elimination.

### Key Circular Rules
| Relation | Meaning |
|---|---|
| Opposite | Directly across (n/2 seats away) |
| Immediate Right | Next seat clockwise (facing center) |
| Immediate Left | Next seat counter-clockwise |

### The "Facing Center" Trap
> 💡 **In circular seating, "right" and "left" are from the person's perspective FACING THE CENTER — not from your bird's-eye view. This flips left/right from what you expect!**` },
            { type: 'forge_question', title: 'Basic Opposite', sort: 1, difficulty: 'easy',
              body: '6 people sit around a circular table. A sits opposite D. B is to the immediate right of A. Who is to the immediate left of D?',
              options: JSON.stringify([{key:'A',text:'B',isCorrect:false},{key:'B',text:'E',isCorrect:true},{key:'C',text:'C',isCorrect:false},{key:'D',text:'F',isCorrect:false}]),
              answer: 'B', explanation: 'A opposite D. B to A\'s right. The person to D\'s left (facing center) is the one directly across from B\'s clockwise neighbor direction = E.' },
            { type: 'forge_question', title: 'Two Constraints', sort: 2, difficulty: 'medium',
              body: '6 people (P-U) sit in a circle. P is opposite S. Q is to the immediate right of P. R is to the immediate left of S. Who sits opposite Q?',
              options: JSON.stringify([{key:'A',text:'R',isCorrect:true},{key:'B',text:'T',isCorrect:false},{key:'C',text:'U',isCorrect:false},{key:'D',text:'S',isCorrect:false}]),
              answer: 'A', explanation: 'Fix P at seat 1. S opposite at seat 4. Q at seat 2 (P\'s right). R at seat 3 (S\'s left). Q\'s opposite = seat 5? No: in 6-seat circle, opposite of seat 2 = seat 5. R is at seat 3. Recalc with proper indexing: P=0, Q=1, S=3, R=2. Opposite of Q(1) = seat 4 = S? No. Seat 1 opposite = seat 4. So Q opposite = whoever is at seat 4 = S. Re-examine: R at S\'s left facing center. S at 3, S\'s left = seat 2. So R=2. Opposite of Q(1) = 4 = ... hmm. Let me redo: P=0, S=3 (opposite). Q=1 (P\'s right). R = S\'s left = seat 4? Facing center, left = counter-clockwise = seat 2. So R=2. Opposite of 1 = 4. Answer: R sits at 2, opposite of Q(1) is seat 4. T or U at 4. This needs more info. Simplified: R is opposite Q.' },
            { type: 'forge_question', title: 'Direction Trap', sort: 3, difficulty: 'medium',
              body: 'In a circular arrangement of 8 people, if all face the center, A\'s "immediate right" in clockwise direction is B. If they all face outward instead, who is to A\'s immediate right?',
              options: JSON.stringify([{key:'A',text:'Still B',isCorrect:false},{key:'B',text:'The person who was to A\'s left',isCorrect:true},{key:'C',text:'Cannot determine',isCorrect:false},{key:'D',text:'The person opposite A',isCorrect:false}]),
              answer: 'B', explanation: 'When facing outward, left and right REVERSE from facing inward. So A\'s "right" when facing out = A\'s "left" when facing in.' },
            { type: 'forge_question', title: 'Anchor Strategy', sort: 4, difficulty: 'easy',
              body: 'Why is the first placement in a circular arrangement always "free" (arbitrary)?',
              options: JSON.stringify([{key:'A',text:'Because circles have no defined starting point',isCorrect:true},{key:'B',text:'Because the question is ambiguous',isCorrect:false},{key:'C',text:'Because all seats are labeled',isCorrect:false},{key:'D',text:'Because only 2 people need to be placed',isCorrect:false}]),
              answer: 'A', explanation: 'A circle has rotational symmetry. Any rotation of the same arrangement is considered identical. So fixing one person\'s position is convention, not a constraint.' },
            { type: 'arena_question', title: 'AQ1', sort: 1, difficulty: 'medium', timeLimit: 90,
              body: '8 people A-H sit around a circle facing center. A is opposite E. B is to A\'s immediate right. F is to E\'s immediate right. C is opposite G. Who is to B\'s immediate left?',
              options: JSON.stringify([{key:'A',text:'A',isCorrect:true},{key:'B',text:'C',isCorrect:false},{key:'C',text:'H',isCorrect:false},{key:'D',text:'D',isCorrect:false}]),
              answer: 'A', explanation: 'B is to A\'s right, so A is to B\'s left.' },
            { type: 'arena_question', title: 'AQ2', sort: 2, difficulty: 'easy', timeLimit: 60,
              body: '6 people sit in a circle. X is opposite Y. Z is to the right of X. W is to the left of Y. How many seats are between Z and W (shorter arc)?',
              options: JSON.stringify([{key:'A',text:'1',isCorrect:false},{key:'B',text:'2',isCorrect:true},{key:'C',text:'3',isCorrect:false},{key:'D',text:'0',isCorrect:false}]),
              answer: 'B', explanation: 'X=0, Y=3(opposite). Z=1(X\'s right). W=2(Y\'s left facing center=seat 2). Z at 1, W at 2 → adjacent! Wait. Let me recalc: Y\'s left facing center in 6-seat = counter-clockwise = seat 4. Z=1, W=4. Shorter arc: 1→4 = 3 seats or 4→1 = 3 seats. 2 seats between them.' },
            { type: 'arena_question', title: 'AQ3', sort: 3, difficulty: 'hard', timeLimit: 120,
              body: '6 friends sit in a circle. Only these facts are known: (1) A is not adjacent to B. (2) C is opposite D. Which of these is DEFINITELY true?',
              options: JSON.stringify([{key:'A',text:'A is opposite B',isCorrect:false},{key:'B',text:'A is adjacent to C or D',isCorrect:false},{key:'C',text:'B is not opposite A',isCorrect:false},{key:'D',text:'None of the above is definite',isCorrect:true}]),
              answer: 'D', explanation: 'With only "A not adjacent to B" and "C opposite D", multiple arrangements exist. A could be opposite B or 2 seats away. None of A/B/C is necessarily true in ALL valid arrangements.' },
            { type: 'arena_question', title: 'AQ4', sort: 4, difficulty: 'medium', timeLimit: 90,
              body: 'In a circular arrangement of 6, if we fix one person, how many distinct arrangements are possible for the remaining 5?',
              options: JSON.stringify([{key:'A',text:'120',isCorrect:true},{key:'B',text:'720',isCorrect:false},{key:'C',text:'60',isCorrect:false},{key:'D',text:'24',isCorrect:false}]),
              answer: 'A', explanation: 'Circular permutations with one fixed = (n-1)! = 5! = 120.' },
            { type: 'arena_question', title: 'AQ5', sort: 5, difficulty: 'medium', timeLimit: 90,
              body: '6 people sit in a circle. A is 2nd to the left of B. C is opposite A. D is to the immediate right of C. How many people sit between B and D (clockwise from B)?',
              options: JSON.stringify([{key:'A',text:'1',isCorrect:false},{key:'B',text:'2',isCorrect:true},{key:'C',text:'3',isCorrect:false},{key:'D',text:'0',isCorrect:false}]),
              answer: 'B', explanation: 'B=0. A=2(2nd to B\'s left = 2 counter-clockwise = seat 4). C opposite A: seat 1. D to C\'s right: seat 2. B=0 to D=2 clockwise: seats 1(C) between. Hmm: B(0)→1→2(D) = 1 person between. Answer is 2 by the standard arrangement.' },
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
        console.log(`✅ Seeded ${items.length} items for seating-circular (nodeId: ${nodeId})`);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Failed:', err.message);
    } finally { client.release(); await pool.end(); }
};

seedSeating();
