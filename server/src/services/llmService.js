const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateJSON = async (prompt) => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('Gemini API key is not configured.');
    }

    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // Parse it to ensure it's valid JSON before returning
        return JSON.parse(responseText);
    } catch (err) {
        console.error('LLM Generation Error:', err);
        throw new Error('Failed to generate content with AI: ' + err.message);
    }
};

module.exports = {
    generateJSON
};
