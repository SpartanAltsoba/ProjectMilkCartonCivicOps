"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const react_1 = require("next-auth/react");
const analysis_1 = require("../../../lib/analysis");
const db_1 = require("../../../lib/db");
/**
 * Handles the API request to start and manage analysis processes.
 *
 * @param req Next.js API request object
 * @param res Next.js API response object
 */
async function handler(req, res) {
    // Check the request method
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed. Please use POST." });
    }
    try {
        // Verify user authentication
        const session = await (0, react_1.getSession)({ req });
        if (!session) {
            return res.status(401).json({ error: "Unauthorized access. Please log in." });
        }
        // Parse the request body
        const { location, keywords } = req.body;
        if (!location || !keywords) {
            return res.status(400).json({ error: "Missing required fields: location and/or keywords." });
        }
        // Log the request for data provenance
        await (0, db_1.logDataProvenance)({
            userId: session.user.id,
            action: "start_analysis",
            details: { location, keywords },
        });
        // Start the analysis job
        const analysisResult = await (0, analysis_1.startAnalysisJob)(location, keywords);
        // Return the analysis result
        return res.status(200).json(analysisResult);
    }
    catch (error) {
        console.error("Error in analysis API handler:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
}
//# sourceMappingURL=analysis.js.map