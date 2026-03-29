import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
});

pool.on('connect', (client) => {
    client.query(`SET search_path TO ${process.env.DB_SCHEMA || 'desarrollo'}`);
});

export const query = (text, params) => pool.query(text, params);
export default { query };
