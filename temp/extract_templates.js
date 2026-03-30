const fs = require('fs');

const rawNodes = JSON.parse(fs.readFileSync('temp/flowise_api_nodes.json', 'utf8'));

const extractNode = (nodeName) => {
    const classDef = rawNodes.find(n => n.name === nodeName);
    if (!classDef) return null;
    
    // Convert classDef to instance template
    return {
        type: "customNode",
        data: {
            ...classDef,
            // We strip inputs and id, which we will populate dynamically
            id: "", // placeholder
            inputs: {},
            selected: false
        },
        width: 300,
        height: 600,
        selected: false,
        dragging: false,
        positionAbsolute: { x: 0, y: 0 }
    };
};

const templates = {
    chatOpenAI: extractNode('chatOpenAI'),
    chatGoogleGenerativeAI: extractNode('chatGoogleGenerativeAI'),
    openAIEmbeddings: extractNode('openAIEmbeddings'),
    googleGenerativeAiEmbeddings: extractNode('googleGenerativeAiEmbeddings')
};

fs.writeFileSync('temp/node_templates.json', JSON.stringify(templates, null, 2));
console.log("Templates extracted successfully.");
