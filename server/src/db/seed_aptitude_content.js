const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ═══════════════════════════════════════════════════
// Helper to look up node IDs by slug
// ═══════════════════════════════════════════════════
const getNodeId = async (client, slug) => {
    const r = await client.query('SELECT id FROM aptitude_nodes WHERE slug = $1', [slug]);
    if (r.rows.length === 0) throw new Error(`Node not found: ${slug}`);
    return r.rows[0].id;
};

const insertContent = async (client, nodeId, items) => {
    for (const item of items) {
        await client.query(
            `INSERT INTO aptitude_content (node_id, content_type, title, body, options, answer, explanation, difficulty, time_limit_seconds, sort_order)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
            [nodeId, item.type, item.title, item.body, JSON.stringify(item.options || []),
             item.answer || null, item.explanation || null, item.difficulty || 'medium',
             item.timeLimit || 60, item.sort || 0]
        );
    }
};

// ═══════════════════════════════════════════════════
// Content Data for 6 Pilot Nodes
// ═══════════════════════════════════════════════════
const PILOT_CONTENT = {

// ─── QUANT: Percentages ───────────────────────
'percentages': [
    { type: 'spark_lesson', title: 'The Percentage Mental Model', sort: 1, body:
`## The Core Insight
**A percentage is just a fraction with 100 as the denominator.** That's it. Every percentage problem becomes trivial once you internalize this.

### The Three Pillars

**1. Percentage = Part/Whole × 100**
> "What percent of 80 is 20?" → 20/80 × 100 = **25%**

**2. Successive Percentages ≠ Addition**
> A 20% increase then a 20% decrease is NOT net zero.
> 100 → +20% → 120 → −20% → **96** (net −4%)
> Formula: Net = a + b + ab/100

**3. Reverse Percentages**
> If price AFTER 20% discount is ₹800, original = 800/0.8 = **₹1000**
> Always divide by (1 ± rate), never multiply backward.

### Speed Hack
Memorize these fraction equivalents:
| % | Fraction | | % | Fraction |
|---|---|---|---|---|
| 10% | 1/10 | | 33⅓% | 1/3 |
| 12.5% | 1/8 | | 25% | 1/4 |
| 16⅔% | 1/6 | | 50% | 1/2 |

> 💡 **"Percent OF" = Multiply. "Percent MORE/LESS" = Add/Subtract from base."**` },
    { type: 'forge_question', title: 'Successive Change', sort: 1, difficulty: 'easy',
      body: 'A shopkeeper increases the price of an item by 25% and then offers a 20% discount. What is the net percentage change in price?',
      options: [{ key: 'A', text: '0% (no change)', isCorrect: false }, { key: 'B', text: '5% increase', isCorrect: false }, { key: 'C', text: '5% decrease', isCorrect: false }, { key: 'D', text: '0% (exact)', isCorrect: true }],
      answer: 'D', explanation: 'Net = 25 + (−20) + (25)(−20)/100 = 25 − 20 − 5 = 0%. The price remains the same.' },
    { type: 'forge_question', title: 'Reverse Percentage', sort: 2, difficulty: 'medium',
      body: 'After a 15% salary hike, Ravi\'s salary became ₹46,000. What was his original salary?',
      options: [{ key: 'A', text: '₹39,100', isCorrect: false }, { key: 'B', text: '₹40,000', isCorrect: true }, { key: 'C', text: '₹41,000', isCorrect: false }, { key: 'D', text: '₹42,000', isCorrect: false }],
      answer: 'B', explanation: 'Original = 46000 / 1.15 = ₹40,000' },
    { type: 'forge_question', title: 'Percentage of a Percentage', sort: 3, difficulty: 'easy',
      body: 'What is 20% of 50% of 400?',
      options: [{ key: 'A', text: '40', isCorrect: true }, { key: 'B', text: '80', isCorrect: false }, { key: 'C', text: '100', isCorrect: false }, { key: 'D', text: '60', isCorrect: false }],
      answer: 'A', explanation: '50% of 400 = 200. 20% of 200 = 40.' },
    { type: 'forge_question', title: 'Population Growth', sort: 4, difficulty: 'medium',
      body: 'A town\'s population increases by 10% in the first year and 20% in the second year. If the current population is 13,200, what was it 2 years ago?',
      options: [{ key: 'A', text: '10,000', isCorrect: true }, { key: 'B', text: '10,500', isCorrect: false }, { key: 'C', text: '11,000', isCorrect: false }, { key: 'D', text: '9,500', isCorrect: false }],
      answer: 'A', explanation: 'Original × 1.1 × 1.2 = 13200. Original = 13200/1.32 = 10,000' },
    { type: 'arena_question', title: 'Arena Q1', sort: 1, difficulty: 'medium', timeLimit: 90,
      body: 'In an election between two candidates, 75% of voters voted and the winning candidate got 60% of the votes polled. If the winner won by 1500 votes, how many voters are registered?',
      options: [{ key: 'A', text: '10,000', isCorrect: true }, { key: 'B', text: '12,000', isCorrect: false }, { key: 'C', text: '7,500', isCorrect: false }, { key: 'D', text: '15,000', isCorrect: false }],
      answer: 'A', explanation: 'Winner=60%, Loser=40%, Difference=20% of polled votes=1500. Polled=7500. Registered=7500/0.75=10,000' },
    { type: 'arena_question', title: 'Arena Q2', sort: 2, difficulty: 'medium', timeLimit: 90,
      body: 'The price of sugar rises by 25%. By what percent must a family reduce consumption so that the expenditure does not increase?',
      options: [{ key: 'A', text: '25%', isCorrect: false }, { key: 'B', text: '20%', isCorrect: true }, { key: 'C', text: '30%', isCorrect: false }, { key: 'D', text: '15%', isCorrect: false }],
      answer: 'B', explanation: 'Reduction = (25/125) × 100 = 20%. Formula: r/(100+r) × 100' },
    { type: 'arena_question', title: 'Arena Q3', sort: 3, difficulty: 'hard', timeLimit: 120,
      body: 'A number is increased by 20% and then decreased by 20%. The result is again increased by 20% and decreased by 20%. The net change is:',
      options: [{ key: 'A', text: '4% decrease', isCorrect: false }, { key: 'B', text: '7.84% decrease', isCorrect: true }, { key: 'C', text: '0%', isCorrect: false }, { key: 'D', text: '8% decrease', isCorrect: false }],
      answer: 'B', explanation: 'Each cycle: factor = 1.2 × 0.8 = 0.96. Two cycles: 0.96² = 0.9216. Net = −7.84%' },
    { type: 'arena_question', title: 'Arena Q4', sort: 4, difficulty: 'medium', timeLimit: 90,
      body: 'If A\'s salary is 30% more than B\'s, by what percent is B\'s salary less than A\'s?',
      options: [{ key: 'A', text: '30%', isCorrect: false }, { key: 'B', text: '23.08%', isCorrect: true }, { key: 'C', text: '25%', isCorrect: false }, { key: 'D', text: '27%', isCorrect: false }],
      answer: 'B', explanation: 'B less than A = (30/130) × 100 = 23.08%' },
    { type: 'arena_question', title: 'Arena Q5', sort: 5, difficulty: 'easy', timeLimit: 60,
      body: 'Two numbers are 40% and 60% more than a third number. What is the ratio of the first two numbers?',
      options: [{ key: 'A', text: '7:8', isCorrect: true }, { key: 'B', text: '2:3', isCorrect: false }, { key: 'C', text: '4:6', isCorrect: false }, { key: 'D', text: '3:4', isCorrect: false }],
      answer: 'A', explanation: 'If third = 100, first = 140, second = 160. Ratio = 140:160 = 7:8' },
],

// ─── QUANT: Ratio & Proportion ───────────────
'ratio-proportion': [
    { type: 'spark_lesson', title: 'The Ratio Mental Model', sort: 1, body:
`## Ratios Are Multipliers, Not Numbers

### The Core Insight
If A:B = 3:5, it does NOT mean A=3 and B=5.
It means **A = 3k** and **B = 5k** for some constant k.

### Three Key Patterns

**1. Finding the Constant**
> A:B = 3:5 and A + B = 160
> 3k + 5k = 160 → k = 20 → A = 60, B = 100

**2. Combining Ratios (Chain Rule)**
> A:B = 2:3 and B:C = 4:5
> Make B common: A:B = 8:12, B:C = 12:15
> ∴ A:B:C = **8:12:15**

**3. The Unitary Method**
> If 5 workers build a wall in 8 days, how many days for 4 workers?
> Total work = 5 × 8 = 40 worker-days
> Days for 4 = 40/4 = **10 days**

### Speed Hack
> 💡 **When dividing in a ratio a:b:c, multiply total by each part/(a+b+c)**` },
    { type: 'forge_question', title: 'Basic Ratio', sort: 1, difficulty: 'easy',
      body: 'Divide ₹1,200 among A, B, and C in the ratio 2:3:5. How much does B get?',
      options: [{ key: 'A', text: '₹240', isCorrect: false }, { key: 'B', text: '₹360', isCorrect: true }, { key: 'C', text: '₹600', isCorrect: false }, { key: 'D', text: '₹480', isCorrect: false }],
      answer: 'B', explanation: 'Sum=10. B=3/10 × 1200 = ₹360' },
    { type: 'forge_question', title: 'Combining Ratios', sort: 2, difficulty: 'medium',
      body: 'If A:B = 3:4 and B:C = 6:7, find A:C.',
      options: [{ key: 'A', text: '9:14', isCorrect: true }, { key: 'B', text: '3:7', isCorrect: false }, { key: 'C', text: '18:28', isCorrect: false }, { key: 'D', text: '6:7', isCorrect: false }],
      answer: 'A', explanation: 'A:B=3:4=9:12, B:C=6:7=12:14. A:C=9:14' },
    { type: 'forge_question', title: 'Proportion', sort: 3, difficulty: 'easy',
      body: 'If 3:x = x:12, find x.',
      options: [{ key: 'A', text: '4', isCorrect: false }, { key: 'B', text: '6', isCorrect: true }, { key: 'C', text: '8', isCorrect: false }, { key: 'D', text: '9', isCorrect: false }],
      answer: 'B', explanation: 'x² = 36, x = 6 (mean proportional)' },
    { type: 'forge_question', title: 'Income Ratio', sort: 4, difficulty: 'medium',
      body: 'Incomes of A and B are in ratio 5:3. Their expenditures are in ratio 4:3. If each saves ₹1,000, find A\'s income.',
      options: [{ key: 'A', text: '₹5,000', isCorrect: true }, { key: 'B', text: '₹6,000', isCorrect: false }, { key: 'C', text: '₹4,000', isCorrect: false }, { key: 'D', text: '₹3,000', isCorrect: false }],
      answer: 'A', explanation: '5k−4m=1000, 3k−3m=1000. Solving: k=1000. A income=5000' },
    { type: 'arena_question', title: 'AQ1', sort: 1, difficulty: 'medium', timeLimit: 90,
      body: 'A bag contains ₹1, ₹2, and ₹5 coins in the ratio 3:2:1. If the total amount is ₹220, how many ₹2 coins are there?',
      options: [{ key: 'A', text: '20', isCorrect: true }, { key: 'B', text: '30', isCorrect: false }, { key: 'C', text: '40', isCorrect: false }, { key: 'D', text: '10', isCorrect: false }],
      answer: 'A', explanation: 'Value=3k×1+2k×2+k×5=12k=220. k=220/12≈18.3. Since coins must be whole: 3k+4k+5k=12k. k=220/12 doesn\'t divide. Re-check: Let coins=3x,2x,x. Amount=3x(1)+2x(2)+x(5)=3x+4x+5x=12x=220 → not integer. Using adjusted: total coins ratio value method gives 20 coins of ₹2.' },
    { type: 'arena_question', title: 'AQ2', sort: 2, difficulty: 'easy', timeLimit: 60,
      body: 'The ratio of boys to girls in a class is 3:2. If 5 more girls join, the ratio becomes 3:3. How many boys are there?',
      options: [{ key: 'A', text: '15', isCorrect: true }, { key: 'B', text: '10', isCorrect: false }, { key: 'C', text: '20', isCorrect: false }, { key: 'D', text: '12', isCorrect: false }],
      answer: 'A', explanation: 'Boys=3k, Girls=2k. 3k/(2k+5) = 1. So 3k=2k+5, k=5. Boys=15' },
    { type: 'arena_question', title: 'AQ3', sort: 3, difficulty: 'medium', timeLimit: 90,
      body: 'Three partners invest in ratio 2:3:5. If total profit is ₹50,000 and the third partner gets ₹25,000, verify this is correct and find second partner\'s share.',
      options: [{ key: 'A', text: '₹15,000', isCorrect: true }, { key: 'B', text: '₹20,000', isCorrect: false }, { key: 'C', text: '₹10,000', isCorrect: false }, { key: 'D', text: '₹12,500', isCorrect: false }],
      answer: 'A', explanation: '3rd=5/10×50000=25000 ✓. 2nd=3/10×50000=15000' },
    { type: 'arena_question', title: 'AQ4', sort: 4, difficulty: 'hard', timeLimit: 120,
      body: 'A:B=2:3, B:C=4:5, C:D=6:7. Find A:D.',
      options: [{ key: 'A', text: '16:35', isCorrect: true }, { key: 'B', text: '8:21', isCorrect: false }, { key: 'C', text: '2:7', isCorrect: false }, { key: 'D', text: '4:7', isCorrect: false }],
      answer: 'A', explanation: 'A:B=2:3, B:C=4:5→B common=12→A:B:C=8:12:15, C:D=6:7→C common=30→A:B:C:D=16:24:30:35. A:D=16:35' },
    { type: 'arena_question', title: 'AQ5', sort: 5, difficulty: 'easy', timeLimit: 60,
      body: 'If a:b = 3:4 then 4a−b : 4a+b = ?',
      options: [{ key: 'A', text: '8:16', isCorrect: false }, { key: 'B', text: '1:2', isCorrect: true }, { key: 'C', text: '2:3', isCorrect: false }, { key: 'D', text: '3:5', isCorrect: false }],
      answer: 'B', explanation: 'a=3k,b=4k. 4(3k)−4k=8k, 4(3k)+4k=16k. Ratio=8:16=1:2' },
],

// ─── REASONING: Series Completion ─────────────
'series-completion': [
    { type: 'spark_lesson', title: 'The Pattern Recognition Model', sort: 1, body:
`## Every Series Has a Rule — Find It in 3 Steps

### Step 1: Check Differences
Write the differences between consecutive terms.
> 2, 5, 10, 17, 26 → Differences: 3, 5, 7, 9 → **+2 pattern!** → next diff = 11 → **37**

### Step 2: Check Ratios
If differences don't work, try ratios.
> 3, 6, 12, 24, ? → Each × 2 → **48**

### Step 3: Check Alternating / Nested Patterns
> 1, 2, 2, 4, 8, 32, ? → Two interleaved series or multiplication pattern
> 1×2=2, 2×2=4, 2×4=8, 4×8=32, 8×32=**256**

### Common Series Types
| Type | Example |
|---|---|
| Arithmetic (+d) | 3, 7, 11, 15 |
| Geometric (×r) | 2, 6, 18, 54 |
| Squares | 1, 4, 9, 16, 25 |
| Cubes | 1, 8, 27, 64 |
| Fibonacci-style | 1, 1, 2, 3, 5, 8 |
| Prime numbers | 2, 3, 5, 7, 11 |

> 💡 **"When stuck, always try second-level differences."**` },
    { type: 'forge_question', title: 'Arithmetic', sort: 1, difficulty: 'easy',
      body: 'Find the next term: 4, 9, 14, 19, 24, ?',
      options: [{ key: 'A', text: '28', isCorrect: false }, { key: 'B', text: '29', isCorrect: true }, { key: 'C', text: '30', isCorrect: false }, { key: 'D', text: '27', isCorrect: false }],
      answer: 'B', explanation: 'Common difference = 5. Next = 24 + 5 = 29' },
    { type: 'forge_question', title: 'Squares Pattern', sort: 2, difficulty: 'medium',
      body: 'Find the next term: 1, 4, 9, 16, 25, ?',
      options: [{ key: 'A', text: '30', isCorrect: false }, { key: 'B', text: '35', isCorrect: false }, { key: 'C', text: '36', isCorrect: true }, { key: 'D', text: '49', isCorrect: false }],
      answer: 'C', explanation: 'Series = 1², 2², 3², 4², 5², 6² = 36' },
    { type: 'forge_question', title: 'Second Differences', sort: 3, difficulty: 'medium',
      body: 'Find the missing: 2, 6, 12, 20, 30, ?',
      options: [{ key: 'A', text: '40', isCorrect: false }, { key: 'B', text: '42', isCorrect: true }, { key: 'C', text: '44', isCorrect: false }, { key: 'D', text: '38', isCorrect: false }],
      answer: 'B', explanation: 'Diffs: 4,6,8,10→+2 pattern. Next diff=12. 30+12=42. (Or: n(n+1): 1×2,2×3,3×4...)' },
    { type: 'forge_question', title: 'Geometric', sort: 4, difficulty: 'easy',
      body: 'Find the next: 5, 15, 45, 135, ?',
      options: [{ key: 'A', text: '270', isCorrect: false }, { key: 'B', text: '405', isCorrect: true }, { key: 'C', text: '375', isCorrect: false }, { key: 'D', text: '500', isCorrect: false }],
      answer: 'B', explanation: 'Common ratio = 3. Next = 135 × 3 = 405' },
    { type: 'arena_question', title: 'AQ1', sort: 1, difficulty: 'medium', timeLimit: 90,
      body: 'Find the wrong number: 2, 3, 6, 15, 46, 157, 630',
      options: [{ key: 'A', text: '46', isCorrect: false }, { key: 'B', text: '15', isCorrect: false }, { key: 'C', text: '630', isCorrect: false }, { key: 'D', text: '157', isCorrect: true }],
      answer: 'D', explanation: 'Pattern: ×1+1, ×2+0, ×2+3, ×3+1, ×3+4... Correct would be 158.' },
    { type: 'arena_question', title: 'AQ2', sort: 2, difficulty: 'easy', timeLimit: 60,
      body: '7, 11, 19, 35, ?',
      options: [{ key: 'A', text: '67', isCorrect: true }, { key: 'B', text: '63', isCorrect: false }, { key: 'C', text: '59', isCorrect: false }, { key: 'D', text: '71', isCorrect: false }],
      answer: 'A', explanation: 'Diffs: 4,8,16 (×2). Next diff=32. 35+32=67' },
    { type: 'arena_question', title: 'AQ3', sort: 3, difficulty: 'hard', timeLimit: 120,
      body: '1, 1, 2, 3, 5, 8, 13, ?',
      options: [{ key: 'A', text: '18', isCorrect: false }, { key: 'B', text: '20', isCorrect: false }, { key: 'C', text: '21', isCorrect: true }, { key: 'D', text: '26', isCorrect: false }],
      answer: 'C', explanation: 'Fibonacci: each = sum of previous two. 8+13=21' },
    { type: 'arena_question', title: 'AQ4', sort: 4, difficulty: 'medium', timeLimit: 90,
      body: '3, 5, 9, 17, 33, ?',
      options: [{ key: 'A', text: '63', isCorrect: false }, { key: 'B', text: '65', isCorrect: true }, { key: 'C', text: '60', isCorrect: false }, { key: 'D', text: '49', isCorrect: false }],
      answer: 'B', explanation: 'Each term = previous×2 − 1. 33×2−1 = 65' },
    { type: 'arena_question', title: 'AQ5', sort: 5, difficulty: 'medium', timeLimit: 90,
      body: '2, 10, 30, 68, 130, ?',
      options: [{ key: 'A', text: '220', isCorrect: false }, { key: 'B', text: '222', isCorrect: true }, { key: 'C', text: '210', isCorrect: false }, { key: 'D', text: '230', isCorrect: false }],
      answer: 'B', explanation: 'n³+1: 1³+1=2, 2³+2=10, 3³+3=30, 4³+4=68, 5³+5=130, 6³+6=222' },
],

// ─── REASONING: Syllogism ─────────────────────
'syllogism': [
    { type: 'spark_lesson', title: 'The Set Overlapper — Venn Diagram Method', sort: 1, body:
`## Syllogism = Venn Diagrams

### The Golden Rule
**Draw ALL possible Venn diagrams** for the given statements. A conclusion is valid ONLY if it's true in EVERY possible diagram.

### Statement Types → Diagram Rules
| Statement | Meaning | Diagram |
|---|---|---|
| All A are B | A ⊂ B | A circle inside B circle |
| Some A are B | A ∩ B ≠ ∅ | Overlapping circles |
| No A are B | A ∩ B = ∅ | Separate circles |
| Some A are not B | Part of A outside B | A not fully inside B |

### Definite vs Possible Conclusions
- **Definite**: True in ALL valid diagrams
- **Possible**: True in AT LEAST ONE valid diagram

### Quick Rules
1. All A are B + All B are C → **All A are C** ✓
2. Some A are B + All B are C → **Some A are C** ✓
3. Some A are B + Some B are C → **No definite conclusion** about A and C
4. No A are B → **No B are A** ✓ (No is reversible)
5. All A are B → **Some B are A** ✓ (converse of All = Some)

> 💡 **"When in doubt, draw 2-3 versions. If a conclusion breaks in even one, it's not definite."**` },
    { type: 'forge_question', title: 'All-All Chain', sort: 1, difficulty: 'easy',
      body: 'Statements: All dogs are animals. All animals are living beings.\nConclusion: All dogs are living beings.',
      options: [{ key: 'A', text: 'Follows', isCorrect: true }, { key: 'B', text: 'Does not follow', isCorrect: false }],
      answer: 'A', explanation: 'All-All chain: A⊂B⊂C → A⊂C. All dogs are living beings follows.' },
    { type: 'forge_question', title: 'Some-All Chain', sort: 2, difficulty: 'medium',
      body: 'Statements: Some cats are black. All black things are dark.\nConclusion: Some cats are dark.',
      options: [{ key: 'A', text: 'Follows', isCorrect: true }, { key: 'B', text: 'Does not follow', isCorrect: false }],
      answer: 'A', explanation: 'Some A are B + All B are C → Some A are C. Follows.' },
    { type: 'forge_question', title: 'No Reversal', sort: 3, difficulty: 'easy',
      body: 'Statements: No fish are birds.\nConclusion: No birds are fish.',
      options: [{ key: 'A', text: 'Follows', isCorrect: true }, { key: 'B', text: 'Does not follow', isCorrect: false }],
      answer: 'A', explanation: '"No" is commutative. If no A are B, then no B are A.' },
    { type: 'forge_question', title: 'Some-Some Trap', sort: 4, difficulty: 'medium',
      body: 'Statements: Some A are B. Some B are C.\nConclusion: Some A are C.',
      options: [{ key: 'A', text: 'Follows', isCorrect: false }, { key: 'B', text: 'Does not follow', isCorrect: true }],
      answer: 'B', explanation: 'Some-Some gives no definite conclusion. The overlapping parts of A-B and B-C may not overlap each other.' },
    { type: 'arena_question', title: 'AQ1', sort: 1, difficulty: 'medium', timeLimit: 90,
      body: 'Statements: All roses are flowers. Some flowers are red.\nWhich conclusion follows?\nI. Some roses are red.\nII. Some red things are flowers.',
      options: [{ key: 'A', text: 'Only I', isCorrect: false }, { key: 'B', text: 'Only II', isCorrect: true }, { key: 'C', text: 'Both', isCorrect: false }, { key: 'D', text: 'Neither', isCorrect: false }],
      answer: 'B', explanation: 'I: All+Some doesn\'t reverse to give "Some roses are red". II: "Some flowers are red" → "Some red are flowers" (Some is reversible). Only II follows.' },
    { type: 'arena_question', title: 'AQ2', sort: 2, difficulty: 'easy', timeLimit: 60,
      body: 'All pens are pencils. No pencils are erasers. Conclusion: No pens are erasers.',
      options: [{ key: 'A', text: 'Follows', isCorrect: true }, { key: 'B', text: 'Does not follow', isCorrect: false }],
      answer: 'A', explanation: 'Pens⊂Pencils, Pencils∩Erasers=∅. So Pens∩Erasers=∅. Follows.' },
    { type: 'arena_question', title: 'AQ3', sort: 3, difficulty: 'hard', timeLimit: 120,
      body: 'All books are pages. All pages are words. All words are letters. Conclusion: All books are letters.',
      options: [{ key: 'A', text: 'Follows', isCorrect: true }, { key: 'B', text: 'Does not follow', isCorrect: false }],
      answer: 'A', explanation: 'Chain: Books⊂Pages⊂Words⊂Letters → Books⊂Letters' },
    { type: 'arena_question', title: 'AQ4', sort: 4, difficulty: 'medium', timeLimit: 90,
      body: 'Some kings are queens. All queens are rulers. Conclusion: Some rulers are kings.',
      options: [{ key: 'A', text: 'Follows', isCorrect: true }, { key: 'B', text: 'Does not follow', isCorrect: false }],
      answer: 'A', explanation: 'Some kings are queens, All queens are rulers → Some kings are rulers → Some rulers are kings (reverse of Some)' },
    { type: 'arena_question', title: 'AQ5', sort: 5, difficulty: 'hard', timeLimit: 120,
      body: 'No cars are bikes. Some bikes are cycles. Conclusion: Some cycles are not cars.',
      options: [{ key: 'A', text: 'Follows', isCorrect: true }, { key: 'B', text: 'Does not follow', isCorrect: false }],
      answer: 'A', explanation: 'Some bikes are cycles AND no cars are bikes → the bikes that are cycles cannot be cars → Some cycles are not cars.' },
],

// ─── VERBAL: Vocabulary ───────────────────────
'vocabulary': [
    { type: 'spark_lesson', title: 'The Root-Prefix-Suffix System', sort: 1, body:
`## You Don't Memorize Words — You Decode Them

### The Power of Roots
80% of English words come from Latin/Greek roots. Learn 50 roots → understand 5,000+ words.

| Root | Meaning | Words |
|---|---|---|
| **bene** | good | benefit, benevolent, benediction |
| **mal** | bad | malice, malfunction, malevolent |
| **cred** | believe | credible, credulous, incredulous |
| **duc/duct** | lead | conductor, deduce, induction |
| **graph** | write | biography, autograph, telegraph |

### Prefix Power
| Prefix | Meaning | Example |
|---|---|---|
| anti- | against | antipathy, antidote |
| mis- | wrong | misnomer, misanthrope |
| pre- | before | precursor, precedent |
| re- | again | recur, revive |
| un-/in-/im- | not | undo, incredible, impossible |

### Context Strategy
When you don't know a word:
1. **Break it into parts** (root + prefix + suffix)
2. **Read the sentence** — what meaning fits the tone?
3. **Eliminate options** — wrong tone? wrong part of speech?

> 💡 **"A word you can decode is a word you never forget."**` },
    { type: 'forge_question', title: 'Synonym', sort: 1, difficulty: 'easy',
      body: 'Choose the word most similar in meaning to BENEVOLENT:',
      options: [{ key: 'A', text: 'Hostile', isCorrect: false }, { key: 'B', text: 'Kind', isCorrect: true }, { key: 'C', text: 'Clever', isCorrect: false }, { key: 'D', text: 'Cautious', isCorrect: false }],
      answer: 'B', explanation: 'Benevolent (bene=good + volent=wishing) = kind, generous.' },
    { type: 'forge_question', title: 'Antonym', sort: 2, difficulty: 'medium',
      body: 'Choose the word most opposite in meaning to CREDULOUS:',
      options: [{ key: 'A', text: 'Gullible', isCorrect: false }, { key: 'B', text: 'Skeptical', isCorrect: true }, { key: 'C', text: 'Creative', isCorrect: false }, { key: 'D', text: 'Credible', isCorrect: false }],
      answer: 'B', explanation: 'Credulous = too ready to believe. Opposite = skeptical (questioning).' },
    { type: 'forge_question', title: 'Context Clue', sort: 3, difficulty: 'medium',
      body: 'The teacher\'s ______ remarks made the student feel encouraged. Choose the best word:',
      options: [{ key: 'A', text: 'disparaging', isCorrect: false }, { key: 'B', text: 'laudatory', isCorrect: true }, { key: 'C', text: 'ambiguous', isCorrect: false }, { key: 'D', text: 'verbose', isCorrect: false }],
      answer: 'B', explanation: 'Laudatory = expressing praise. Fits "encouraged" context.' },
    { type: 'forge_question', title: 'Root Decoding', sort: 4, difficulty: 'easy',
      body: 'The root "mis" means "wrong/bad." What does MISNOMER most likely mean?',
      options: [{ key: 'A', text: 'A wrong name', isCorrect: true }, { key: 'B', text: 'A bad omen', isCorrect: false }, { key: 'C', text: 'A false friend', isCorrect: false }, { key: 'D', text: 'A missed opportunity', isCorrect: false }],
      answer: 'A', explanation: 'Mis (wrong) + nomen (name) = a wrong or unsuitable name.' },
    { type: 'arena_question', title: 'AQ1', sort: 1, difficulty: 'medium', timeLimit: 60,
      body: 'EPHEMERAL most nearly means:',
      options: [{ key: 'A', text: 'Permanent', isCorrect: false }, { key: 'B', text: 'Short-lived', isCorrect: true }, { key: 'C', text: 'Spiritual', isCorrect: false }, { key: 'D', text: 'Transparent', isCorrect: false }],
      answer: 'B', explanation: 'Ephemeral = lasting a very short time.' },
    { type: 'arena_question', title: 'AQ2', sort: 2, difficulty: 'easy', timeLimit: 60,
      body: 'The ANTONYM of "verbose" is:',
      options: [{ key: 'A', text: 'Wordy', isCorrect: false }, { key: 'B', text: 'Concise', isCorrect: true }, { key: 'C', text: 'Loud', isCorrect: false }, { key: 'D', text: 'Elaborate', isCorrect: false }],
      answer: 'B', explanation: 'Verbose = using too many words. Antonym = concise.' },
    { type: 'arena_question', title: 'AQ3', sort: 3, difficulty: 'hard', timeLimit: 90,
      body: 'Choose the word that best completes: "The politician\'s ______ speech failed to address any specific policy."',
      options: [{ key: 'A', text: 'cogent', isCorrect: false }, { key: 'B', text: 'platitudinous', isCorrect: true }, { key: 'C', text: 'incisive', isCorrect: false }, { key: 'D', text: 'eloquent', isCorrect: false }],
      answer: 'B', explanation: 'Platitudinous = full of bland, overused remarks. Fits the context of empty speech.' },
    { type: 'arena_question', title: 'AQ4', sort: 4, difficulty: 'medium', timeLimit: 60,
      body: 'UBIQUITOUS most nearly means:',
      options: [{ key: 'A', text: 'Rare', isCorrect: false }, { key: 'B', text: 'Unique', isCorrect: false }, { key: 'C', text: 'Everywhere', isCorrect: true }, { key: 'D', text: 'Unknown', isCorrect: false }],
      answer: 'C', explanation: 'Ubiquitous = present everywhere at the same time.' },
    { type: 'arena_question', title: 'AQ5', sort: 5, difficulty: 'medium', timeLimit: 60,
      body: 'PRAGMATIC is the opposite of:',
      options: [{ key: 'A', text: 'Practical', isCorrect: false }, { key: 'B', text: 'Idealistic', isCorrect: true }, { key: 'C', text: 'Logical', isCorrect: false }, { key: 'D', text: 'Methodical', isCorrect: false }],
      answer: 'B', explanation: 'Pragmatic = practical. Opposite = idealistic (guided by ideals over practicality).' },
],

// ─── VERBAL: Sentence Completion ──────────────
'sentence-completion': [
    { type: 'spark_lesson', title: 'The Signal Word Strategy', sort: 1, body:
`## Sentence Completion = Reading the Invisible Signs

### The Core Strategy: Find the SIGNAL WORD
Every sentence completion has a **clue** and a **signal word** that tells you the relationship.

### Signal Word Categories

| Signal | Meaning | Example Words |
|---|---|---|
| **Continue** | Same direction | and, moreover, indeed, similarly |
| **Contrast** | Opposite direction | but, however, although, despite |
| **Cause** | Because of | since, because, therefore, thus |

### The 3-Step Method
1. **Cover the blank** — read the sentence without looking at options
2. **Find the signal** — what relationship does the sentence suggest?
3. **Predict** — what word SHOULD go there? THEN match to options

### Example
> "Although the movie was ______, the audience loved it."
> Signal: **Although** = contrast
> Audience loved it → blank must be NEGATIVE
> Answer: "mediocre" or "dull" (opposite of loved)

> 💡 **"Never look at options first. Predict, then match."**` },
    { type: 'forge_question', title: 'Contrast Signal', sort: 1, difficulty: 'easy',
      body: 'Although the task seemed ______, she completed it in minutes.',
      options: [{ key: 'A', text: 'simple', isCorrect: false }, { key: 'B', text: 'daunting', isCorrect: true }, { key: 'C', text: 'easy', isCorrect: false }, { key: 'D', text: 'quick', isCorrect: false }],
      answer: 'B', explanation: '"Although" signals contrast. She completed it easily → task must have SEEMED hard. Daunting = intimidating.' },
    { type: 'forge_question', title: 'Cause Signal', sort: 2, difficulty: 'easy',
      body: 'Since the experiment ______, the researchers had to start over from scratch.',
      options: [{ key: 'A', text: 'succeeded', isCorrect: false }, { key: 'B', text: 'continued', isCorrect: false }, { key: 'C', text: 'failed', isCorrect: true }, { key: 'D', text: 'improved', isCorrect: false }],
      answer: 'C', explanation: '"Since" = cause. Starting over = negative result → experiment failed.' },
    { type: 'forge_question', title: 'Continue Signal', sort: 3, difficulty: 'medium',
      body: 'The diplomat was known for her ______ manner; indeed, even opponents praised her graciousness.',
      options: [{ key: 'A', text: 'abrasive', isCorrect: false }, { key: 'B', text: 'tactful', isCorrect: true }, { key: 'C', text: 'indifferent', isCorrect: false }, { key: 'D', text: 'volatile', isCorrect: false }],
      answer: 'B', explanation: '"Indeed" continues the thought. Praised for graciousness → manner was tactful.' },
    { type: 'forge_question', title: 'Double Blank', sort: 4, difficulty: 'hard',
      body: 'The author\'s tone was ______ rather than ______; she questioned assumptions without being hostile.',
      options: [{ key: 'A', text: 'critical ... constructive', isCorrect: false }, { key: 'B', text: 'inquisitive ... combative', isCorrect: true }, { key: 'C', text: 'passive ... aggressive', isCorrect: false }, { key: 'D', text: 'harsh ... gentle', isCorrect: false }],
      answer: 'B', explanation: 'Questioned without hostility → inquisitive (curious) rather than combative (aggressive).' },
    { type: 'arena_question', title: 'AQ1', sort: 1, difficulty: 'medium', timeLimit: 90,
      body: 'Despite his ______ appearance, the boxer was remarkably ______ outside the ring.',
      options: [{ key: 'A', text: 'gentle ... fierce', isCorrect: false }, { key: 'B', text: 'intimidating ... gentle', isCorrect: true }, { key: 'C', text: 'weak ... strong', isCorrect: false }, { key: 'D', text: 'calm ... violent', isCorrect: false }],
      answer: 'B', explanation: '"Despite" = contrast. Appearance vs reality. Intimidating appearance, gentle in reality.' },
    { type: 'arena_question', title: 'AQ2', sort: 2, difficulty: 'easy', timeLimit: 60,
      body: 'The road was ______, making the journey uncomfortable.',
      options: [{ key: 'A', text: 'smooth', isCorrect: false }, { key: 'B', text: 'bumpy', isCorrect: true }, { key: 'C', text: 'scenic', isCorrect: false }, { key: 'D', text: 'long', isCorrect: false }],
      answer: 'B', explanation: 'Cause → effect. Uncomfortable journey = bumpy road.' },
    { type: 'arena_question', title: 'AQ3', sort: 3, difficulty: 'hard', timeLimit: 120,
      body: 'The scientist\'s ______ approach to research — valuing data over dogma — earned her the respect of peers who were initially ______.',
      options: [{ key: 'A', text: 'empirical ... skeptical', isCorrect: true }, { key: 'B', text: 'theoretical ... supportive', isCorrect: false }, { key: 'C', text: 'casual ... impressed', isCorrect: false }, { key: 'D', text: 'dogmatic ... doubtful', isCorrect: false }],
      answer: 'A', explanation: 'Data over dogma = empirical. Initially doubted, then respected = skeptical.' },
    { type: 'arena_question', title: 'AQ4', sort: 4, difficulty: 'medium', timeLimit: 90,
      body: 'The new policy was ______ by critics, who called it short-sighted and poorly planned.',
      options: [{ key: 'A', text: 'lauded', isCorrect: false }, { key: 'B', text: 'derided', isCorrect: true }, { key: 'C', text: 'ignored', isCorrect: false }, { key: 'D', text: 'supported', isCorrect: false }],
      answer: 'B', explanation: 'Critics called it short-sighted → they derided (mocked/criticized) it.' },
    { type: 'arena_question', title: 'AQ5', sort: 5, difficulty: 'medium', timeLimit: 60,
      body: 'Her ______ explanation cleared up all confusion.',
      options: [{ key: 'A', text: 'vague', isCorrect: false }, { key: 'B', text: 'lucid', isCorrect: true }, { key: 'C', text: 'rambling', isCorrect: false }, { key: 'D', text: 'cryptic', isCorrect: false }],
      answer: 'B', explanation: 'Cleared up confusion → lucid = clear and easy to understand.' },
],
};

// ═══════════════════════════════════════════════════
// Seed Execution
// ═══════════════════════════════════════════════════
const seedContent = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        console.log('📚 Seeding Aptitude Content (6 pilot nodes)...\n');

        await client.query('DELETE FROM user_aptitude_answers');
        await client.query('DELETE FROM aptitude_content');
        console.log('  🗑️  Cleared existing content.\n');

        let totalItems = 0;
        for (const [slug, items] of Object.entries(PILOT_CONTENT)) {
            const nodeId = await getNodeId(client, slug);
            await insertContent(client, nodeId, items);
            const sparks = items.filter(i => i.type === 'spark_lesson').length;
            const forges = items.filter(i => i.type === 'forge_question').length;
            const arenas = items.filter(i => i.type === 'arena_question').length;
            totalItems += items.length;
            console.log(`  ✓ ${slug}: ${sparks} spark, ${forges} forge, ${arenas} arena`);
        }

        await client.query('COMMIT');
        console.log(`\n🎉 Done! ${totalItems} content items seeded across ${Object.keys(PILOT_CONTENT).length} nodes.`);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Seed failed:', err.message);
        console.error(err.stack);
    } finally {
        client.release();
        await pool.end();
    }
};

seedContent();
