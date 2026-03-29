const { Client } = require('pg');

async function test() {
  const client = new Client({
    user: 'postgres',
    host: 'postgres_core',
    database: 'agent_platform',
    password: 'GVDjDuvYV@#c4Hp1JH',
    port: 5432,
  });
  await client.connect();
  await client.query('SET search_path TO desarrollo;');

  // Clean providers/models
  await client.query('DELETE FROM models');
  await client.query('DELETE FROM providers');

  // Insert model with prov A
  const pA = await client.query("INSERT INTO providers (name, api_key_encrypted) VALUES ('Prov_A', 'key-a') RETURNING id");
  const pA_id = pA.rows[0].id;
  const mA = await client.query(`INSERT INTO models (provider_id, name, model_identifier, type) VALUES ('${pA_id}', 'M1', 'id-1', 'llm') RETURNING id`);
  const m_id = mA.rows[0].id;

  console.log("Before update:");
  console.log("Providers:", (await client.query("SELECT name FROM providers")).rows);
  
  // Now simulate the PUT endpoint changing to Prov_B
  const newProvName = 'Prov_B';
  let newProvId;
  const pB = await client.query("INSERT INTO providers (name, api_key_encrypted) VALUES ($1, 'key-b') RETURNING id", [newProvName]);
  newProvId = pB.rows[0].id;

  await client.query("UPDATE models SET provider_id = $1 WHERE id = $2", [newProvId, m_id]);

  // Cleanup logic
  const count = await client.query("SELECT COUNT(*) FROM models WHERE provider_id = $1", [pA_id]);
  if (parseInt(count.rows[0].count) === 0) {
    await client.query("DELETE FROM providers WHERE id = $1", [pA_id]);
  }

  console.log("After update & cleanup:");
  console.log("Providers:", (await client.query("SELECT name FROM providers")).rows);
  
  await client.end();
}
test().catch(console.error);
