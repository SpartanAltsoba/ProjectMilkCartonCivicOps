import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

interface QueryResult<T> {
  rowCount: number;
  rows: T[];
}

// Database Connection Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Log errors for failed queries
const logError = (error: Error): void => {
  console.error('Database query error:', error);
};

// Execute a parameterized SQL query
export const query = async <T extends {}>(text: string, params: any[] = []): Promise<QueryResult<T>> => {
  try {
    const result = await pool.query<T>(text, params);
    return {
      rowCount: result.rowCount,
      rows: result.rows
    };
  } catch (error) {
    logError(error);
    throw new Error('Database operation failed');
  }
};

// Close the database pool connection
export const closePool = async (): Promise<void> => {
  try {
    await pool.end();
    console.log('Database connection pool closed');
  } catch (error) {
    logError(error);
  }
};

export default {
  query,
  closePool
};
