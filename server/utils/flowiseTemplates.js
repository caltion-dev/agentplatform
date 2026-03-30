// Extracting nodes from the Prompt JSONs

const LLM_OPENAI = {
  loadMethods: {},
  label: "ChatOpenAI",
  name: "chatOpenAI",
  version: 8.3,
  type: "ChatOpenAI",
  icon: "/usr/local/lib/node_modules/flowise/node_modules/flowise-components/dist/nodes/chatmodels/ChatOpenAI/openai.svg",
  category: "Chat Models",
  description: "Wrapper around OpenAI large language models that use the Chat endpoint",
  baseClasses: [
    "ChatOpenAI",
    "BaseChatOpenAI",
    "BaseChatModel",
    "BaseLanguageModel",
    "Runnable"
  ],
  inputs: {
    cache: "",
    modelName: "gpt-4o",
    temperature: 0.9,
    streaming: true,
    maxTokens: "",
    topP: "",
    frequencyPenalty: "",
    presencePenalty: "",
    timeout: "",
    strictToolCalling: "",
    stopSequence: "",
    basepath: "",
    proxyUrl: "",
    baseOptions: "",
    allowImageUploads: "",
    imageResolution: "low",
    reasoning: "",
    reasoningEffort: "",
    reasoningSummary: ""
  },
  filePath: "/usr/local/lib/node_modules/flowise/node_modules/flowise-components/dist/nodes/chatmodels/ChatOpenAI/ChatOpenAI.js",
  inputAnchors: [
    {
      label: "Cache",
      name: "cache",
      type: "BaseCache",
      optional: true,
      id: "{{NODE_ID}}-input-cache-BaseCache",
      display: true
    }
  ],
  inputParams: [
    {
      label: "Connect Credential",
      name: "credential",
      type: "credential",
      credentialNames: ["openAIApi"],
      id: "{{NODE_ID}}-input-credential-credential",
      display: true
    },
    {
      label: "Model Name",
      name: "modelName",
      type: "asyncOptions",
      loadMethod: "listModels",
      default: "gpt-4o",
      id: "{{NODE_ID}}-input-modelName-asyncOptions",
      display: true
    },
    {
      label: "Temperature",
      name: "temperature",
      type: "number",
      step: 0.1,
      default: 0.9,
      optional: true,
      id: "{{NODE_ID}}-input-temperature-number",
      display: true
    },
    {
      label: "Streaming",
      name: "streaming",
      type: "boolean",
      default: true,
      optional: true,
      additionalParams: true,
      id: "{{NODE_ID}}-input-streaming-boolean",
      display: true
    },
    {
      label: "Max Tokens",
      name: "maxTokens",
      type: "number",
      step: 1,
      optional: true,
      additionalParams: true,
      id: "{{NODE_ID}}-input-maxTokens-number",
      display: true
    },
    {
      label: "Top Probability",
      name: "topP",
      type: "number",
      step: 0.1,
      optional: true,
      additionalParams: true,
      id: "{{NODE_ID}}-input-topP-number",
      display: true
    },
    {
      label: "Frequency Penalty",
      name: "frequencyPenalty",
      type: "number",
      step: 0.1,
      optional: true,
      additionalParams: true,
      id: "{{NODE_ID}}-input-frequencyPenalty-number",
      display: true
    },
    {
      label: "Presence Penalty",
      name: "presencePenalty",
      type: "number",
      step: 0.1,
      optional: true,
      additionalParams: true,
      id: "{{NODE_ID}}-input-presencePenalty-number",
      display: true
    },
    {
      label: "Timeout",
      name: "timeout",
      type: "number",
      step: 1,
      optional: true,
      additionalParams: true,
      id: "{{NODE_ID}}-input-timeout-number",
      display: true
    },
    {
      label: "Strict Tool Calling",
      name: "strictToolCalling",
      type: "boolean",
      description: "Whether the model supports the `strict` argument when passing in tools. If not specified, the `strict` argument will not be passed to OpenAI.",
      optional: true,
      additionalParams: true,
      id: "{{NODE_ID}}-input-strictToolCalling-boolean",
      display: true
    },
    {
      label: "Stop Sequence",
      name: "stopSequence",
      type: "string",
      rows: 4,
      optional: true,
      description: "List of stop words to use when generating. Use comma to separate multiple stop words.",
      additionalParams: true,
      id: "{{NODE_ID}}-input-stopSequence-string",
      display: true
    },
    {
      label: "BasePath",
      name: "basepath",
      type: "string",
      optional: true,
      additionalParams: true,
      id: "{{NODE_ID}}-input-basepath-string",
      display: true
    },
    {
      label: "Proxy Url",
      name: "proxyUrl",
      type: "string",
      optional: true,
      additionalParams: true,
      id: "{{NODE_ID}}-input-proxyUrl-string",
      display: true
    },
    {
      label: "BaseOptions",
      name: "baseOptions",
      type: "json",
      optional: true,
      additionalParams: true,
      id: "{{NODE_ID}}-input-baseOptions-json",
      display: true
    },
    {
      label: "Allow Image Uploads",
      name: "allowImageUploads",
      type: "boolean",
      description: "Allow image input. Refer to the <a href=\"https://docs.flowiseai.com/using-flowise/uploads#image\" target=\"_blank\">docs</a> for more details.",
      default: false,
      optional: true,
      id: "{{NODE_ID}}-input-allowImageUploads-boolean",
      display: true
    },
    {
      label: "Image Resolution",
      description: "This parameter controls the resolution in which the model views the image.",
      name: "imageResolution",
      type: "options",
      options: [
        { label: "Low", name: "low" },
        { label: "High", name: "high" },
        { label: "Auto", name: "auto" }
      ],
      default: "low",
      optional: false,
      show: { allowImageUploads: true },
      id: "{{NODE_ID}}-input-imageResolution-options",
      display: false
    },
    {
      label: "Reasoning",
      description: "Whether the model supports reasoning. Only applicable for reasoning models.",
      name: "reasoning",
      type: "boolean",
      default: false,
      optional: true,
      additionalParams: true,
      id: "{{NODE_ID}}-input-reasoning-boolean",
      display: true
    },
    {
      label: "Reasoning Effort",
      description: "Constrains effort on reasoning for reasoning models",
      name: "reasoningEffort",
      type: "options",
      options: [
        { label: "Low", name: "low" },
        { label: "Medium", name: "medium" },
        { label: "High", name: "high" }
      ],
      additionalParams: true,
      show: { reasoning: true },
      id: "{{NODE_ID}}-input-reasoningEffort-options",
      display: false
    },
    {
      label: "Reasoning Summary",
      description: "A summary of the reasoning performed by the model. This can be useful for debugging and understanding the model's reasoning process",
      name: "reasoningSummary",
      type: "options",
      options: [
        { label: "Auto", name: "auto" },
        { label: "Concise", name: "concise" },
        { label: "Detailed", name: "detailed" }
      ],
      additionalParams: true,
      show: { reasoning: true },
      id: "{{NODE_ID}}-input-reasoningSummary-options",
      display: false
    }
  ],
  outputs: {},
  outputAnchors: [
    {
      id: "{{NODE_ID}}-output-chatOpenAI-ChatOpenAI|BaseChatOpenAI|BaseChatModel|BaseLanguageModel|Runnable",
      name: "chatOpenAI",
      label: "ChatOpenAI",
      description: "Wrapper around OpenAI large language models that use the Chat endpoint",
      type: "ChatOpenAI | BaseChatOpenAI | BaseChatModel | BaseLanguageModel | Runnable"
    }
  ],
  id: "{{NODE_ID}}"
};

const LLM_GOOGLE = {
  loadMethods: {},
  label: "ChatGoogleGenerativeAI",
  name: "chatGoogleGenerativeAI",
  version: 3.1,
  type: "ChatGoogleGenerativeAI",
  icon: "/usr/local/lib/node_modules/flowise/node_modules/flowise-components/dist/nodes/chatmodels/ChatGoogleGenerativeAI/GoogleGemini.svg",
  category: "Chat Models",
  description: "Wrapper around Google Gemini large language models that use the Chat endpoint",
  baseClasses: [
    "ChatGoogleGenerativeAI",
    "LangchainChatGoogleGenerativeAI",
    "BaseChatModel",
    "BaseLanguageModel",
    "Runnable"
  ],
  inputs: {
    cache: "",
    modelName: "gemini-1.5-flash",
    customModelName: "",
    temperature: 0.9,
    streaming: true,
    maxOutputTokens: "",
    topP: "",
    topK: "",
    safetySettings: "",
    thinkingBudget: "",
    baseUrl: "",
    allowImageUploads: ""
  },
  filePath: "/usr/local/lib/node_modules/flowise/node_modules/flowise-components/dist/nodes/chatmodels/ChatGoogleGenerativeAI/ChatGoogleGenerativeAI.js",
  inputAnchors: [
    {
      label: "Cache",
      name: "cache",
      type: "BaseCache",
      optional: true,
      id: "{{NODE_ID}}-input-cache-BaseCache",
      display: true
    }
  ],
  inputParams: [
    {
      label: "Connect Credential",
      name: "credential",
      type: "credential",
      credentialNames: ["googleGenerativeAI"],
      optional: false,
      description: "Google Generative AI credential.",
      id: "{{NODE_ID}}-input-credential-credential",
      display: true
    },
    {
      label: "Model Name",
      name: "modelName",
      type: "asyncOptions",
      loadMethod: "listModels",
      default: "gemini-1.5-flash-latest",
      id: "{{NODE_ID}}-input-modelName-asyncOptions",
      display: true
    },
    {
      label: "Custom Model Name",
      name: "customModelName",
      type: "string",
      placeholder: "gemini-1.5-pro-exp-0801",
      description: "Custom model name to use. If provided, it will override the model selected",
      additionalParams: true,
      optional: true,
      id: "{{NODE_ID}}-input-customModelName-string",
      display: true
    },
    {
      label: "Temperature",
      name: "temperature",
      type: "number",
      step: 0.1,
      default: 0.9,
      optional: true,
      id: "{{NODE_ID}}-input-temperature-number",
      display: true
    },
    {
      label: "Streaming",
      name: "streaming",
      type: "boolean",
      default: true,
      optional: true,
      additionalParams: true,
      id: "{{NODE_ID}}-input-streaming-boolean",
      display: true
    },
    {
      label: "Max Output Tokens",
      name: "maxOutputTokens",
      type: "number",
      step: 1,
      optional: true,
      additionalParams: true,
      id: "{{NODE_ID}}-input-maxOutputTokens-number",
      display: true
    },
    {
      label: "Top Probability",
      name: "topP",
      type: "number",
      step: 0.1,
      optional: true,
      additionalParams: true,
      id: "{{NODE_ID}}-input-topP-number",
      display: true
    },
    {
      label: "Top Next Highest Probability Tokens",
      name: "topK",
      type: "number",
      description: "Decode using top-k sampling: consider the set of top_k most probable tokens. Must be positive",
      step: 1,
      optional: true,
      additionalParams: true,
      id: "{{NODE_ID}}-input-topK-number",
      display: true
    },
    {
      label: "Safety Settings",
      name: "safetySettings",
      type: "array",
      description: "Safety settings for the model.",
      array: [
        {
          label: "Harm Category",
          name: "harmCategory",
          type: "options",
          options: [
            {"label":"Dangerous","name":"HARM_CATEGORY_DANGEROUS_CONTENT","description":"Promotes, facilitates, or encourages harmful acts."},
            {"label":"Harassment","name":"HARM_CATEGORY_HARASSMENT","description":"Negative or harmful comments targeting identity and/or protected attributes."},
            {"label":"Hate Speech","name":"HARM_CATEGORY_HATE_SPEECH","description":"Content that is rude, disrespectful, or profane."},
            {"label":"Sexually Explicit","name":"HARM_CATEGORY_SEXUALLY_EXPLICIT","description":"Contains references to sexual acts or other lewd content."},
            {"label":"Civic Integrity","name":"HARM_CATEGORY_CIVIC_INTEGRITY","description":"Election-related queries."}
          ]
        },
        {
          label: "Harm Block Threshold",
          name: "harmBlockThreshold",
          type: "options",
          options: [
            {"label":"None","name":"BLOCK_NONE","description":"Always show regardless of probability of unsafe content"},
            {"label":"Only High","name":"BLOCK_ONLY_HIGH","description":"Block when high probability of unsafe content"},
            {"label":"Medium and Above","name":"BLOCK_MEDIUM_AND_ABOVE","description":"Block when medium or high probability of unsafe content"},
            {"label":"Low and Above","name":"BLOCK_LOW_AND_ABOVE","description":"Block when low, medium or high probability of unsafe content"},
            {"label":"Threshold Unspecified (Default Threshold)","name":"HARM_BLOCK_THRESHOLD_UNSPECIFIED","description":"Threshold is unspecified, block using default threshold"}
          ]
        }
      ],
      optional: true,
      additionalParams: true,
      id: "{{NODE_ID}}-input-safetySettings-array",
      display: true
    },
    {
      label: "Thinking Budget",
      name: "thinkingBudget",
      type: "number",
      description: "Guides the number of thinking tokens.",
      step: 1,
      optional: true,
      additionalParams: true,
      show: { modelName: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite"] },
      id: "{{NODE_ID}}-input-thinkingBudget-number",
      display: false
    },
    {
      label: "Base URL",
      name: "baseUrl",
      type: "string",
      description: "Base URL for the API. Leave empty to use the default.",
      optional: true,
      additionalParams: true,
      id: "{{NODE_ID}}-input-baseUrl-string",
      display: true
    },
    {
      label: "Allow Image Uploads",
      name: "allowImageUploads",
      type: "boolean",
      description: "Allow image input.",
      default: false,
      optional: true,
      id: "{{NODE_ID}}-input-allowImageUploads-boolean",
      display: true
    }
  ],
  outputs: {},
  outputAnchors: [
    {
      id: "{{NODE_ID}}-output-chatGoogleGenerativeAI-ChatGoogleGenerativeAI|LangchainChatGoogleGenerativeAI|BaseChatModel|BaseLanguageModel|Runnable",
      name: "chatGoogleGenerativeAI",
      label: "ChatGoogleGenerativeAI",
      description: "Wrapper around Google Gemini large language models that use the Chat endpoint",
      type: "ChatGoogleGenerativeAI | LangchainChatGoogleGenerativeAI | BaseChatModel | BaseLanguageModel | Runnable"
    }
  ],
  id: "{{NODE_ID}}"
};

const EMBEDDING_OPENAI = {
  loadMethods: {},
  label: "OpenAI Embeddings",
  name: "openAIEmbeddings",
  version: 4,
  type: "OpenAIEmbeddings",
  icon: "/usr/local/lib/node_modules/flowise/node_modules/flowise-components/dist/nodes/embeddings/OpenAIEmbedding/openai.svg",
  category: "Embeddings",
  description: "OpenAI API to generate embeddings for a given text",
  baseClasses: [
    "OpenAIEmbeddings",
    "Embeddings"
  ],
  inputs: {
    modelName: "text-embedding-3-small",
    stripNewLines: "",
    batchSize: "",
    timeout: "",
    basepath: "",
    dimensions: ""
  },
  filePath: "/usr/local/lib/node_modules/flowise/node_modules/flowise-components/dist/nodes/embeddings/OpenAIEmbedding/OpenAIEmbedding.js",
  inputAnchors: [],
  inputParams: [
    {
      label: "Connect Credential",
      name: "credential",
      type: "credential",
      credentialNames: ["openAIApi"],
      id: "{{NODE_ID}}-input-credential-credential",
      display: true
    },
    {
      label: "Model Name",
      name: "modelName",
      type: "asyncOptions",
      loadMethod: "listModels",
      default: "text-embedding-ada-002",
      id: "{{NODE_ID}}-input-modelName-asyncOptions",
      display: true
    },
    {
      label: "Strip New Lines",
      name: "stripNewLines",
      type: "boolean",
      optional: true,
      additionalParams: true,
      id: "{{NODE_ID}}-input-stripNewLines-boolean",
      display: true
    },
    {
      label: "Batch Size",
      name: "batchSize",
      type: "number",
      optional: true,
      additionalParams: true,
      id: "{{NODE_ID}}-input-batchSize-number",
      display: true
    },
    {
      label: "Timeout",
      name: "timeout",
      type: "number",
      optional: true,
      additionalParams: true,
      id: "{{NODE_ID}}-input-timeout-number",
      display: true
    },
    {
      label: "BasePath",
      name: "basepath",
      type: "string",
      optional: true,
      additionalParams: true,
      id: "{{NODE_ID}}-input-basepath-string",
      display: true
    },
    {
      label: "Dimensions",
      name: "dimensions",
      type: "number",
      optional: true,
      additionalParams: true,
      id: "{{NODE_ID}}-input-dimensions-number",
      display: true
    }
  ],
  outputs: {},
  outputAnchors: [
    {
      id: "{{NODE_ID}}-output-openAIEmbeddings-OpenAIEmbeddings|Embeddings",
      name: "openAIEmbeddings",
      label: "OpenAIEmbeddings",
      description: "OpenAI API to generate embeddings for a given text",
      type: "OpenAIEmbeddings | Embeddings"
    }
  ],
  id: "{{NODE_ID}}"
};

const EMBEDDING_GOOGLE = {
  loadMethods: {},
  label: "GoogleGenerativeAI Embeddings",
  name: "googleGenerativeAiEmbeddings",
  version: 2,
  type: "GoogleGenerativeAiEmbeddings",
  icon: "/usr/local/lib/node_modules/flowise/node_modules/flowise-components/dist/nodes/embeddings/GoogleGenerativeAIEmbedding/GoogleGemini.svg",
  category: "Embeddings",
  description: "Google Generative API to generate embeddings for a given text",
  baseClasses: [
    "GoogleGenerativeAiEmbeddings",
    "GoogleGenerativeAIEmbeddings",
    "Embeddings"
  ],
  inputs: {
    modelName: "gemini-embedding-001",
    tasktype: "TASK_TYPE_UNSPECIFIED",
    stripNewLines: ""
  },
  filePath: "/usr/local/lib/node_modules/flowise/node_modules/flowise-components/dist/nodes/embeddings/GoogleGenerativeAIEmbedding/GoogleGenerativeAIEmbedding.js",
  inputAnchors: [],
  inputParams: [
    {
      label: "Connect Credential",
      name: "credential",
      type: "credential",
      credentialNames: ["googleGenerativeAI"],
      optional: false,
      description: "Google Generative AI credential.",
      id: "{{NODE_ID}}-input-credential-credential",
      display: true
    },
    {
      label: "Model Name",
      name: "modelName",
      type: "asyncOptions",
      loadMethod: "listModels",
      default: "embedding-001",
      id: "{{NODE_ID}}-input-modelName-asyncOptions",
      display: true
    },
    {
      label: "Task Type",
      name: "tasktype",
      type: "options",
      description: "Type of task for which the embedding will be used",
      options: [
        { label: "TASK_TYPE_UNSPECIFIED", name: "TASK_TYPE_UNSPECIFIED" },
        { label: "RETRIEVAL_QUERY", name: "RETRIEVAL_QUERY" },
        { label: "RETRIEVAL_DOCUMENT", name: "RETRIEVAL_DOCUMENT" },
        { label: "SEMANTIC_SIMILARITY", name: "SEMANTIC_SIMILARITY" },
        { label: "CLASSIFICATION", name: "CLASSIFICATION" },
        { label: "CLUSTERING", name: "CLUSTERING" }
      ],
      default: "TASK_TYPE_UNSPECIFIED",
      id: "{{NODE_ID}}-input-tasktype-options",
      display: true
    },
    {
      label: "Strip New Lines",
      name: "stripNewLines",
      type: "boolean",
      optional: true,
      additionalParams: true,
      description: "Remove new lines from input text before embedding to reduce token count",
      id: "{{NODE_ID}}-input-stripNewLines-boolean",
      display: true
    }
  ],
  outputs: {},
  outputAnchors: [
    {
      id: "{{NODE_ID}}-output-googleGenerativeAiEmbeddings-GoogleGenerativeAiEmbeddings|GoogleGenerativeAIEmbeddings|Embeddings",
      name: "googleGenerativeAiEmbeddings",
      label: "GoogleGenerativeAiEmbeddings",
      description: "Google Generative API to generate embeddings for a given text",
      type: "GoogleGenerativeAiEmbeddings | GoogleGenerativeAIEmbeddings | Embeddings"
    }
  ],
  id: "{{NODE_ID}}"
};

export const FLOWISE_TEMPLATES = {
    llm: {
        openai: LLM_OPENAI,
        google: LLM_GOOGLE
    },
    embedding: {
        openai: EMBEDDING_OPENAI,
        google: EMBEDDING_GOOGLE
    }
};
