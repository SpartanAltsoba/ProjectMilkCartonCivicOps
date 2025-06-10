"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closePool = exports.query = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Database Connection Pool
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});
// Log errors for failed queries
const logError = (error) => {
    console.error("Database query error:", error);
};
// Execute a parameterized SQL query
const query = async (text, params = []) => {
    try {
        const result = await pool.query(text, params);
        return {
            rowCount: result.rowCount,
            rows: result.rows,
        };
    }
    catch (error) {
        logError(error);
        throw new Error("Database operation failed");
    }
};
exports.query = query;
// Close the database pool connection
const closePool = async () => {
    try {
        await pool.end();
        console.log("Database connection pool closed");
    }
    catch (error) {
        logError(error);
    }
};
exports.closePool = closePool;
exports.default = {
    query: exports.query,
    closePool: exports.closePool,
};
//# sourceMappingURL=db.js.map