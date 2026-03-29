const http = require("http");
const payload = JSON.stringify({name:"TT", provider_name:"P1", model_identifier:"i1", type:"llm", api_key:"k1"});
const options = { hostname: "localhost", port: 3001, path: "/api/models", method: "POST", headers: {"Content-Type": "application/json", "Content-Length": payload.length} };
const req = http.request(options, res => {
  let data = "";
  res.on("data", chunk => data += chunk);
  res.on("end", () => {
    const id = JSON.parse(data).id;
    console.log("POST ID:", id);
    const payload2 = JSON.stringify({name:"TT", provider_name:"P2", model_identifier:"i1", type:"llm", api_key:"k2"});
    const options2 = { hostname: "localhost", port: 3001, path: "/api/models/"+id, method: "PUT", headers: {"Content-Type": "application/json", "Content-Length": payload2.length} };
    const req2 = http.request(options2, res2 => {
      let data2 = "";
      res2.on("data", chunk => data2 += chunk);
      res2.on("end", () => {
        console.log("PUT RES:", data2);
      });
    });
    req2.write(payload2);
    req2.end();
  });
});
req.write(payload);
req.end();
