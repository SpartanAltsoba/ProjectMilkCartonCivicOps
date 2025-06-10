"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openaiClient = void 0;
exports.summarizeLegalContent = summarizeLegalContent;
exports.analyzeLegalFramework = analyzeLegalFramework;
const openai_1 = __importDefault(require("openai"));
const logger_1 = require("./logger");
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
async function summarizeLegalContent(content, options = {}) {
    var _a, _b, _c;
    try {
        const { maxTokens = 500, temperature = 0.3, model = "gpt-4-1106-preview" } = options;
        const prompt = `
      Analyze and summarize the following legal content related to child welfare:
      
      ${content}
      
      Focus on:
      1. Key legal framework (CHINS/CINA/FINS)
      2. Main decision points
      3. Required stakeholder involvement
      4. Mandatory timelines or deadlines
      
      Provide a concise, structured summary.
    `;
        const response = await openai.chat.completions.create({
            model,
            messages: [
                {
                    role: "system",
                    content: "You are a legal expert specializing in child welfare law. Provide clear, accurate summaries of legal frameworks and procedures.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            max_tokens: maxTokens,
            temperature,
        });
        const summary = (_c = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.trim();
        if (!summary) {
            throw new Error("No summary generated");
        }
        logger_1.logger.info("Legal content summarized successfully", {
            contentLength: content.length,
            summaryLength: summary.length,
        });
        return summary;
    }
    catch (error) {
        logger_1.logger.error("Failed to summarize legal content", {
            error: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
    }
}
async function analyzeLegalFramework(searchResults, options = {}) {
    var _a, _b, _c;
    try {
        const { temperature = 0.3, model = "gpt-4-1106-preview" } = options;
        const content = searchResults
            .map(result => `Title: ${result.title}\nContent: ${result.snippet}`)
            .join("\n\n");
        const prompt = `
      Analyze these child welfare legal search results and determine the primary legal framework:

      ${content}

      Determine if the jurisdiction uses:
      1. CHINS (Child in Need of Services)
      2. CINA (Child in Need of Aid)
      3. FINS (Family in Need of Services)
      4. State-specific framework
      5. Unknown (if cannot be determined)

      Provide:
      1. The primary framework type
      2. A brief explanation of why this framework was chosen
      
      Format your response exactly as follows:
      Framework: [CHINS/CINA/FINS/State-specific/Unknown]
      Explanation: [Your explanation]
    `;
        const response = await openai.chat.completions.create({
            model,
            messages: [
                {
                    role: "system",
                    content: "You are a legal expert specializing in child welfare law. Analyze search results to determine the applicable legal framework.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature,
        });
        const result = (_c = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.trim();
        if (!result) {
            throw new Error("No analysis generated");
        }
        // Parse the response
        const frameworkMatch = result.match(/Framework:\s*(CHINS|CINA|FINS|State-specific|Unknown)/i);
        const explanationMatch = result.match(/Explanation:\s*(.+?)(?:\n|$)/s);
        if (!frameworkMatch || !explanationMatch) {
            throw new Error("Invalid analysis format");
        }
        return {
            framework: frameworkMatch[1],
            explanation: explanationMatch[1].trim(),
        };
    }
    catch (error) {
        logger_1.logger.error("Failed to analyze legal framework", {
            error: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
    }
}
exports.openaiClient = openai;
//# sourceMappingURL=openai.js.map