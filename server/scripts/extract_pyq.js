const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error('❌ ERROR: GEMINI_API_KEY is not set in .env');
    console.error('Please get an API key from Google AI Studio and add it to your .env file.');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

// Helper to convert local file to the Google SDK's required format for inline injection
function fileToGenerativePart(filePath, mimeType) {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
            mimeType
        },
    };
}

async function extractQuestionsFromPDF(pdfPath) {
    console.log(`\n📄 Analyzing PDF: ${pdfPath}`);
    console.log('🤖 Sending to Gemini 1.5 Pro (this may take 30-60 seconds)...');

    try {
        // Must use gemini-1.5-pro for best vision/document parsing capability
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        // Load PDF as inline data
        const pdfPart = fileToGenerativePart(pdfPath, "application/pdf");

        // Load our JSON template structure to guide the model
        const templatePath = path.join(__dirname, '../src/db/templates/question_template.json');
        const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
        const systemPrompt = template.prompt_for_ai;

        const prompt = `
${systemPrompt}

Here is the exact JSON structure you MUST follow. Return ONLY valid JSON, wrapped in a markdown block.
Do not include any conversational text.

TEMPLATE JSON:
${JSON.stringify(template, null, 2)}
`;

        const result = await model.generateContent([prompt, pdfPart]);
        const response = await result.response;
        let text = response.text();

        // Clean up markdown wrapping if present
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        // Verify it parses correctly
        try {
            const parsed = JSON.parse(text);
            const outPath = pdfPath.replace('.pdf', '_extracted.json');
            fs.writeFileSync(outPath, JSON.stringify(parsed, null, 2));

            console.log(`\n✅ Success! Extracted ${parsed.questions?.length} questions.`);
            console.log(`📁 Saved to: ${outPath}`);

            // Check if any questions need manual images
            const needsImage = parsed.questions.filter(q => q.image_url === 'NEEDS_IMAGE');
            if (needsImage.length > 0) {
                console.log(`\n⚠️  WARNING: ${needsImage.length} questions contain diagrams that the AI could not natively export.`);
                console.log('You must manually crop these images, upload them (e.g. to Cloudflare R2), and replace "NEEDS_IMAGE" in the JSON with the actual URL before seeding.');
                needsImage.forEach(q => {
                    console.log(`   - Question ${q.question_number}`);
                });
            }

            console.log('\nNext step: Review the JSON file, then run:');
            console.log(`node server/src/db/seed_pyq.js ${outPath} --publish`);

        } catch (e) {
            console.error('\n❌ Error parsing AI response to JSON. The model may have output malformed JSON.');
            console.error('Raw AI Output:\n', text);
            console.error(e);
        }

    } catch (err) {
        console.error('\n❌ Extraction failed:', err.message);
    }
}

// Simple CLI usage
const args = process.argv.slice(2);
const pdfFile = args[0];

if (!pdfFile || !pdfFile.endsWith('.pdf')) {
    console.log('Usage: node scripts/extract_pyq.js <path-to-exam.pdf>');
    console.log('Example: node scripts/extract_pyq.js ./gate_ee_2024.pdf');
    process.exit(1);
}

if (!fs.existsSync(pdfFile)) {
    console.error(`❌ File not found: ${pdfFile}`);
    process.exit(1);
}

extractQuestionsFromPDF(pdfFile);
