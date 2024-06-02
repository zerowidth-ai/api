var e=require("express"),t=require("compression");function r(e,t,r,s){Object.defineProperty(e,t,{get:r,set:s,enumerable:!0,configurable:!0})}function s(e){return e&&e.__esModule?e.default:e}r(module.exports,"ZeroWidthApi",()=>o),r(module.exports,"ZeroWidthApiExpress",()=>i);var o=// index.js
/**
 * ZeroWidthApi is the main class for interacting with the ZeroWidth API.
 */class{/**
   * Constructor for initializing the ZeroWidthApi class.
   * @param {Object} config - The configuration object.
   * @param {string} config.secretKey - The secret key for authentication.
   * @param {string} config.endpointId - The endpoint ID.
   * @param {string} config.agentId - The agent ID.
   * @param {string} [config.baseUrl] - The base URL for the API.
   * @throws {Error} If required parameters are missing.
   */constructor({secretKey:e,endpointId:t,agentId:r,baseUrl:s}){if(!e)throw Error("Missing required constructor parameters: secretKey, endpointId, and agentId must be provided");this.secretKey=e.trim(),this.endpointId=t,this.agentId=r,this.baseUrl=s||"https://api.zerowidth.ai/beta"}/**
   * Executes a tool function, handling both synchronous and asynchronous functions.
   * @param {Function} toolFunction - The tool function to execute.
   * @param {Object} args - The arguments to pass to the tool function.
   * @returns {Promise<*>} The result of the tool function.
   * @throws {Error} If the tool function throws an error.
   */async executeToolFunction(e,t){try{let r=e(t);if(r instanceof Promise)return await r;return r}catch(e){throw e}}/**
   * Makes an API call to the specified endpoint.
   * @param {string} endpoint - The API endpoint to call.
   * @param {Object} [options={}] - Options for the API call.
   * @param {string} [options.method='POST'] - The HTTP method to use.
   * @param {Object} [options.headers] - Additional headers to include in the request.
   * @param {Object} [options.body] - The body of the request.
   * @returns {Promise<Object>} The response data from the API call.
   * @throws {Error} If the API call fails.
   */async makeApiCall(e,t={},r){let s=`${this.baseUrl}/${e}`,o={Authorization:`Bearer ${this.secretKey}`,"Content-Type":"application/json",...t.headers},a=await fetch(s,{method:t.method||"POST",headers:o,body:t.body?JSON.stringify(t.body):void 0});if(!a.ok)throw Error(`HTTP error! status: ${a.status}`);if(t.body&&t.body.stream)return this.handleStreamedResponse({readableStream:a.body,originalRequest:r});{let e=await a.text();// Ensure we read the text response
return JSON.parse(e);// Parse the JSON manually
}}/**
   * Creates a new FetchEventSource instance for handling streaming responses.
   * @param {ReadableStream} stream - The stream to process.
   * @returns {FetchEventSource} The created FetchEventSource instance.
   */async createFetchEventSource(e){let t=new this.FetchEventSource(e,this);return t}/**
   * Processes data using the specified endpoint and agent IDs.
   * @param {Object} params - The parameters for processing.
   * @param {string} [params.endpointId] - The endpoint ID.
   * @param {string} [params.agentId] - The agent ID.
   * @param {Object} params.data - The data to process.
   * @param {string} [params.userId] - The user ID for stateful processing.
   * @param {string} [params.sessionId] - The session ID for stateful processing.
   * @param {boolean} [params.stateful] - Whether the processing is stateful.
   * @param {boolean} [params.verbose] - Whether to enable verbose output.
   * @param {Object} [params.tools] - The tools to use for processing.
   * @param {boolean} [params.stream] - Whether to enable streaming responses.
   * @returns {Promise<Object>} The result of the processing.
   * @throws {Error} If required parameters are missing or if the processing fails.
   */async process({endpointId:e,agentId:t,data:r,userId:s,sessionId:o,stateful:a,verbose:n,tools:i,stream:l,on:d}={}){let u=`process/${e||this.endpointId}/${t||this.agentId}`;if(n&&(u+="?verbose=true"),a&&(!s||!o))throw Error("Stateful processing requires a userId and sessionId");let c=await this.makeApiCall(u,{method:"POST",body:{user_id:s,session_id:o,stateful:a,data:r,stream:l}},{stream:l,data:r,endpointId:e,agentId:t,userId:s,sessionId:o,stateful:a,verbose:n,tools:i,on:d});if(!l){if(i&&c.output_data&&c.output_data.tool_calls){let u=!1,p=0;for(let e of c.output_data.tool_calls)if("function"===e.type&&i.functions&&e.function&&i.functions[e.function.name]){u||(r.messages.push(c.output_data),u=!0);let t=await this.executeToolFunction(i.functions[e.function.name],JSON.parse(e.function.arguments));r.messages.push({role:"tool",tool_call_id:e.id,content:t,timestamp:new Date().toISOString()}),p++}if(p===c.output_data.tool_calls.length)return await this.process({endpointId:e,agentId:t,data:r,userId:s,sessionId:o,stateful:a,verbose:n,tools:i,stream:l,on:d})}return c}}/**
   * Initializes the event source by reading from the stream and emitting events.
   */handleStreamedResponse=({readableStream:e,originalRequest:t})=>{let r="",s=null,o=[],a=new TextDecoder("utf-8",{ignoreBOM:!0,fatal:!0}),n="",i=(e,r)=>{t.on&&t.on[e]&&t.on[e](r),t.on&&t.on.all&&t.on.all(e,r)},l=async()=>{if(s&&o.length){let e=o.join("\n").trim();try{let r=JSON.parse(e);if("outputProgress"===s&&((null===r.partial_content||void 0===r.partial_content)&&(r.partial_content=""),n+=r.partial_content,r.content_so_far=n),"complete"===s){let e=0;if(t.tools&&r.output_data&&r.output_data.tool_calls&&r.output_data.tool_calls.length>0){let s=!1;for(let o of r.output_data.tool_calls)if("function"===o.type){if(t.tools.functions&&o.function&&t.tools.functions[o.function.name]){s||(t.data.messages.push(r.output_data),s=!0),i("tool",{role:"tool",tool_call:o});let a=await this.executeToolFunction(t.tools.functions[o.function.name],JSON.parse(o.function.arguments));t.data.messages.push({role:"tool",tool_call_id:o.id,content:a,timestamp:new Date().toISOString()}),e++}else i("tool",{role:"tool",tool_call:o})}if(e===r.output_data.tool_calls.length)return await this.process({endpointId:t.endpointId,agentId:t.agentId,data:t.data,userId:t.userId,sessionId:t.sessionId,stateful:t.stateful,verbose:t.verbose,tools:t.tools,stream:t.stream,on:t.on})}}i(s,r)}catch(e){i("error",e)}}s=null,o=[]},d=async()=>{let t=e.getReader();try{for(;;){let{done:e,value:n}=await t.read();if(e){if(""!==r.trim()){if(r+="\n\n",s)await l();else try{let e=JSON.parse(r.trim());i("errorEvent",e)}catch(e){i("error",{message:"Failed to parse JSON",buffer:r})}}i("close");break}r+=a.decode(n,{stream:!0});let d=r.split("\n");r=d.pop(),d.forEach(async e=>{e.startsWith("event: ")?(null!==s&&await l(),s=e.substring(7).trim()):e.startsWith("data: ")?o.push(e.substring(6)):""===e.trim()&&await l()})}}catch(e){i("error",{message:"Stream read error",error:e})}};d()};/**
   * Retrieves the history for a specific session.
   * @param {Object} params - The parameters for retrieving the history.
   * @param {string} [params.endpointId] - The endpoint ID.
   * @param {string} [params.agentId] - The agent ID.
   * @param {string} params.userId - The user ID.
   * @param {string} params.sessionId - The session ID.
   * @param {string} [params.startAfter] - The starting point for history retrieval.
   * @returns {Promise<Object>} The history data.
   * @throws {Error} If the API call fails.
   */async getHistory({endpointId:e,agentId:t,userId:r,sessionId:s,startAfter:o}={}){let a=`history/${e||this.endpointId}/${t||this.agentId}/${r}/${s}`;return this.makeApiCall(a,{method:"GET",params:o?{startAfter:o}:{}})}/**
   * Formats an error object for better readability.
   * @param {Error} error - The error object to format.
   * @returns {Object} An object containing the formatted error message and status code.
   */formatError(e){let t="An error occurred",r=null;return e.response?(t=`API Error: ${e.response.statusText||e.message}`,r=e.response.status):t=e.request?"Network Error: No response received from the server.":`Request Error: ${e.message}`,{errorMessage:t,statusCode:r}}};// ZeroWidthApiMiddleware.js
const a=async({req:e,res:t,next:r,secretKey:s,baseUrl:a,returnsResponse:n,variables:i,tools:l,on:d})=>{let{endpoint_id:u,agent_id:c}=e.params,p=new o({secretKey:s,endpointId:u,agentId:c,baseUrl:a}),f=async r=>{let s,o=0;if(i){if("function"==typeof i){let t=await i(e);r.data.variables={...r.data.variables,...t}}else"object"==typeof i&&(r.data.variables={...r.data.variables,...i})}try{let e=await p.process({...r,tools:l,on:{...d,all:(e,a)=>{// Was the original requestData in stream mode?
if(r.stream){// if the event is complete, close the connection after 1 second
if(clearTimeout(s),0===o&&(// open the SSE
t.setHeader("Content-Type","text/event-stream"),t.setHeader("Cache-Control","no-cache"),t.setHeader("Connection","keep-alive"),t.flushHeaders()),o++,"close"===e){s=setTimeout(()=>{t.end()},5e3);return}// if the event is open, clear the timeout in case this is a reconnection
"open"===e&&(clearTimeout(s),o>1)||(t.write(`event: ${e}
`),t.write(`data: ${JSON.stringify(a)}

`),t.flush())}}}});return d&&d.complete&&e&&d.complete(e),e}catch(e){throw console.error("API call failed:",e),d&&d.error&&e.response&&d.error(e.response.data),e}};try{let s=await f(e.body);e.body.stream||(n?t.json(s.output_data):(e.zerowidthResult=s,r()))}catch(e){r(e)}},n=async({req:e,res:t,next:r,secretKey:s,baseUrl:a,on:n,returnsResponse:i})=>{let{endpoint_id:l,agent_id:d,user_id:u,session_id:c}=e.params,{startAfter:p}=e.query,f=new o({secretKey:s,endpointId:l,agentId:d,baseUrl:a});try{let s=await f.getHistory({userId:u,sessionId:c,startAfter:p});onProcess&&onProcess(s),i?t.json(s):(e.zerowidthHistory=s,r())}catch(e){console.error("History retrieval failed:",e),onError&&e.response&&onError(e.response.data),t.status(500).send("Internal Server Error")}};function i({secretKey:r,baseUrl:o,on:i,variables:l,returnsResponse:d=!0,tools:u}){let c=s(e).Router();return c.use(s(t)()),// POST route to process data
c.post("/process/:endpoint_id/:agent_id",(e,t,s)=>{a({req:e,res:t,next:s,secretKey:r,baseUrl:o,on:i,variables:l,returnsResponse:d,tools:u})}),// GET route to retrieve history
c.get("/history/:endpoint_id/:agent_id/:user_id/:session_id",(e,t,s)=>{n({req:e,res:t,next:s,secretKey:r,baseUrl:o,on:i,returnsResponse:d})}),c}//# sourceMappingURL=main.cjs.map

//# sourceMappingURL=main.cjs.map
