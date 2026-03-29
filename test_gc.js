const fetch = require('node-fetch');

async function run() {
  console.log("Creating new model...");
  const res1 = await fetch('http://localhost:3001/api/models', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Temp Model', provider_name: 'test_prov_1', model_identifier: 'gpt-3', type: 'llm', api_key: 'key-1'
    })
  });
  const model = await res1.json();
  console.log("Created:", model);

  console.log("\nUpdating to new provider...");
  const res2 = await fetch(`http://localhost:3001/api/models/${model.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Temp Model', provider_name: 'test_prov_2', model_identifier: 'gpt-3', type: 'llm', api_key: 'key-2'
    })
  });
  console.log("Updated:", await res2.json());
}
run();
