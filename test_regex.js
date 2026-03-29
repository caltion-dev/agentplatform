const agent = { llm_id: 'gpt-4o', llm_cred: 'cred-123' };
let flowDataStr = '...\\"{{inMemoryCache_0.data.instance}}\\",\\"modelName\\":\\"old-model\\",\\"abc\\":\\"def\\",\\"BaseLanguageModel\\",\\"Runnable\\"],\\"credential\\":\\"old-cred\\"...';

console.log('Original:', flowDataStr);

const llmPattern = /(\{\{inMemoryCache_0\.data\.instance\}\}\\",\\"modelName\\":\\")[^"]+(\\")/g;
flowDataStr = flowDataStr.replace(llmPattern, \`\$1\${agent.llm_id}\$2\`);

const credPattern = /(\\"BaseLanguageModel\\",\\"Runnable\\"\\],\\"credential\\":\\")[^"]+(\\")/g;
flowDataStr = flowDataStr.replace(credPattern, \`\$1\${agent.llm_cred}\$2\`);

console.log('Result:', flowDataStr);
