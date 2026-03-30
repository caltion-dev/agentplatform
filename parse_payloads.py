import json
import sys

# Replace this with reading from a local file containing the user's chatflows
with open("user_openai.json") as f:
    openai_json = json.load(f)

with open("user_gemini.json") as f:
    gemini_json = json.load(f)

openai_nodes = json.loads(openai_json["flowData"])["nodes"]
gemini_nodes = json.loads(gemini_json["flowData"])["nodes"]

d = {}
for n in openai_nodes:
    if n["id"].startswith("chatOpenAI_"):
        d["chatOpenAI"] = n["data"]
    elif n["id"].startswith("openAIEmbeddings_"):
        d["openAIEmbeddings"] = n["data"]

for n in gemini_nodes:
    if n["id"].startswith("chatGoogleGenerativeAI_"):
        d["chatGoogleGenerativeAI"] = n["data"]
    elif n["id"].startswith("googleGenerativeAiEmbeddings_"):
        d["googleGenerativeAiEmbeddings"] = n["data"]

with open("server/templates.json", "w") as f:
    json.dump(d, f, indent=2)
print("Done")
