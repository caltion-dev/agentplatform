import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '/workspace/.env' });
const pool = new pg.Pool({ user: process.env.DB_USER, host: process.env.DB_HOST, database: process.env.DB_DATABASE, password: process.env.DB_PASSWORD, port: process.env.DB_PORT });
pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'desarrollo' AND table_name = 'agents';`).then(res => { console.log(res.rows); pool.end(); });
