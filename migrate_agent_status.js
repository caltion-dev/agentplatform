import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || process.env.DB_PASS,
    database: process.env.DB_DATABASE || process.env.DB_NAME,
});

async function migrate() {
    try {
        await pool.query('ALTER TABLE desarrollo.agents ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;');
        console.log("Migration successful: Added is_active column");
    } catch(e) {
        console.error("Migration failed:", e);
    } finally {
        pool.end();
    }
}
migrate();
