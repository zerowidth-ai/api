require("console");var e=require("express"),t=require("compression");function r(e,t,r,s){Object.defineProperty(e,t,{get:r,set:s,enumerable:!0,configurable:!0})}function s(e){return e&&e.__esModule?e.default:e}r(module.exports,"ZeroWidthApi",()=>o),r(module.exports,"ZeroWidthApiExpress",()=>i);var o=// index.js
/**
 * ZeroWidthApi is the main class for interacting with the ZeroWidth API.
 */class{/**
   * Constructor for initializing the ZeroWidthApi class.
   * @param {Object} config - The configuration object.
   * @param {string} config.secretKey - The secret key for authentication.
   * @param {string} config.endpointId - The endpoint ID (deprecated).
   * @param {string} config.projectId - The project ID (replacement for endpoint ID).
   * @param {string} config.agentId - The agent ID.
   * @param {string} [config.baseUrl] - The base URL for the API.
   * @throws {Error} If required parameters are missing.
   */constructor({secretKey:e,endpointId:t,projectId:r,agentId:s,baseUrl:o}){if(!e)throw Error("Missing required constructor parameters: secretKey, projectId, and agentId should be provided");this.secretKey=e.trim(),this.projectId=r||t,this.agentId=s,this.baseUrl=o||"https://api.zerowidth.ai/v1"}/**
   * Executes a tool function, handling both synchronous and asynchronous functions.
   * @param {Function} toolFunction - The tool function to execute.
   * @param {Object} args - The arguments to pass to the tool function.
   * @returns {Promise<*>} The result of the tool function.
   * @throws {Error} If the tool function throws an error.
   */async executeToolFunction(e,t){try{"object"!=typeof t&&(t=JSON.parse(t));let r=e(t);if(r instanceof Promise)return await r;return r}catch(e){throw e}}/**
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
   * @param {string} [params.endpointId] - The endpoint ID (deprecated).
   * @param {string} [params.projectId] - The project ID (replacement for endpoint ID).
   * @param {string} [params.agentId] - The agent ID.
   * @param {Object} params.data - The data to process.
   * @param {string} [params.userId] - The user ID for stateful processing.
   * @param {string} [params.sessionId] - The session ID for stateful processing.
   * @param {boolean} [params.stateful] - Whether the processing is stateful.
   * @param {boolean} [params.verbose] - Whether to enable verbose output.
   * @param {Object} [params.tools] - The tools to use for processing (will map to functions)
   * @param {Object} [params.functions] - The tool functions to use for processing.
   * @param {boolean} [params.stream] - Whether to enable streaming responses.
   * @returns {Promise<Object>} The result of the processing.
   * @throws {Error} If required parameters are missing or if the processing fails.
   */async process({endpointId:e,projectId:t,agentId:r,data:s,userId:o,sessionId:a,stateful:n,verbose:i,tools:l,functions:d,stream:u,on:c}={}){let p=t||e||this.projectId,f=`process/${p}/${r||this.agentId}`;if(i&&(f+="?verbose=true"),n&&(!o||!a))throw Error("Stateful processing requires a userId and sessionId");l&&!d&&(l.functions?d=l.functions:Array.isArray(l)&&(d=l));let m=await this.makeApiCall(f,{method:"POST",body:{user_id:o,session_id:a,stateful:n,data:s,stream:u}},{stream:u,data:s,projectId:p,agentId:r,userId:o,sessionId:a,stateful:n,verbose:i,functions:d,on:c});if(!u){if(d&&m.output_data&&Array.isArray(m.output_data.content)){let e=!1,t=0,f=m.output_data.content.filter(e=>"function_call"===e.type);for(let r of f)if(d&&d[r.name]){e||(s.messages.push(m.output_data),s.messages.push({role:"tool",content:[],timestamp:new Date().toISOString()}),e=!0);let o=await this.executeToolFunction(d[r.name],r.arguments);s.messages[s.messages.length-1].content.push({type:"function_response",name:r.name,result:o}),t++}if(t===f.length)return await this.process({projectId:p,agentId:r,data:s,userId:o,sessionId:a,stateful:n,verbose:i,tools:l,stream:u,on:c})}return m}}/**
   * Initializes the event source by reading from the stream and emitting events.
   */handleStreamedResponse=({readableStream:e,originalRequest:t})=>{let r="",s=null,o=[],a=new TextDecoder("utf-8",{ignoreBOM:!0,fatal:!0}),n="",i=(e,r)=>{t.on&&t.on[e]&&t.on[e](r),t.on&&t.on.all&&t.on.all(e,r)},l=async()=>{if(s&&o.length){let e=o.join("\n").trim();try{let r=JSON.parse(e);if("outputProgress"===s&&((null===r.partial_content||void 0===r.partial_content)&&(r.partial_content=""),n+=r.partial_content,r.content_so_far=n),"complete"===s){let e=0;if(r.output_data&&r.output_data.content&&Array.isArray(r.output_data.content)){let s=r.output_data.content.filter(e=>"function_call"===e.type);if(t.functions&&s.length>0){let o=!1;for(let a of s)if(t.functions&&t.functions[a.name]){o||(t.data.messages.push(r.output_data),t.data.messages.push({role:"tool",content:[],timestamp:new Date().toISOString()}),o=!0),i("functionCall",a);let s=await this.executeToolFunction(t.functions[a.name],a.arguments);t.data.messages[t.data.messages.length-1].content.push({type:"function_response",name:a.name,result:s}),e++}if(e===s.length)return await this.process({projectId:t.projectId,agentId:t.agentId,data:t.data,userId:t.userId,sessionId:t.sessionId,stateful:t.stateful,verbose:t.verbose,tools:t.tools,stream:t.stream,on:t.on})}}}i(s,r)}catch(e){i("error",e)}}s=null,o=[]},d=async()=>{let t=e.getReader();try{for(;;){let{done:e,value:n}=await t.read();if(e){if(""!==r.trim()){if(r+="\n\n",s)await l();else try{let e=JSON.parse(r.trim());i("errorEvent",e)}catch(e){i("error",{message:"Failed to parse JSON",buffer:r})}}i("close");break}r+=a.decode(n,{stream:!0});let d=r.split("\n");r=d.pop(),d.forEach(async e=>{e.startsWith("event: ")?(null!==s&&await l(),s=e.substring(7).trim()):e.startsWith("data: ")?o.push(e.substring(6)):""===e.trim()&&await l()})}}catch(e){i("error",{message:"Stream read error",error:e})}};d()};/**
   * Retrieves the history for a specific session.
   * @param {Object} params - The parameters for retrieving the history.
   * @param {string} [params.endpointId] - The endpoint ID (deprecated).
   * @param {string} [params.projectId] - The project ID (replacement for endpoint ID).
   * @param {string} [params.agentId] - The agent ID.
   * @param {string} params.userId - The user ID.
   * @param {string} params.sessionId - The session ID.
   * @param {string} [params.startAfter] - The starting point for history retrieval.
   * @returns {Promise<Object>} The history data.
   * @throws {Error} If the API call fails.
   */async getHistory({endpointId:e,projectId:t,agentId:r,userId:s,sessionId:o,startAfter:a}={}){let n=`history/${t||e||this.projectId}/${r||this.agentId}/${s}/${o}`;return this.makeApiCall(n,{method:"GET",params:a?{startAfter:a}:{}})}/**
   * Submits a report for a specific session.
   * @param {Object} params - The parameters for submitting the report.
   * @param {string} [params.endpointId] - The endpoint ID (deprecated).
   * @param {string} [params.projectId] - The project ID (replacement for endpoint ID).
   * @param {string} [params.agentId] - The agent ID.
   * @param {Object} [params.data] - The optional JSON object containing the detailed API response.
   * @param {string} [params.userId] - The user ID.
   * @param {string} [params.sessionId] - The session ID.
   * @param {string} params.type - The type of the report (e.g., 'positive', 'negative', 'neutral').
   * @param {string} params.category - The category of the report (e.g., 'accuracy', 'hallucination').
   * @param {string} [params.details] - Additional details provided by the user (max 500 characters).
   * @returns {Promise<Object>} The result of the report submission.
   * @throws {Error} If the API call fails.
   */async report({endpointId:e,projectId:t,agentId:r,data:s,userId:o,sessionId:a,type:n,category:i,details:l}={}){// Construct the endpoint URL using provided or default IDs
let d=`report/${t||e||this.projectId}/${r||this.agentId}`;// Make the API call to submit the report
try{let e=await this.makeApiCall(d,{method:"POST",body:{user_id:o||null,session_id:a||null,data:s||null,type:n,category:i||null,details:l||null// Optional: Additional user-provided details (string)
}});return e}catch(e){throw console.error("Error submitting report:",e),Error("Failed to submit report")}}/**
   * Formats an error object for better readability.
   * @param {Error} error - The error object to format.
   * @returns {Object} An object containing the formatted error message and status code.
   */formatError(e){let t="An error occurred",r=null;return e.response?(t=`API Error: ${e.response.statusText||e.message}`,r=e.response.status):t=e.request?"Network Error: No response received from the server.":`Request Error: ${e.message}`,{errorMessage:t,statusCode:r}}};// ZeroWidthApiMiddleware.js
const a=async({req:e,res:t,next:r,secretKey:s,baseUrl:a,returnsResponse:n,variables:i,functions:l,on:d,useCompression:u})=>{let{project_id:c,agent_id:p}=e.params,f=new o({secretKey:s,projectId:c,agentId:p,baseUrl:a}),m=async r=>{let s,o=0;if(i){if("function"==typeof i){let t=await i(e);r.data.variables={...r.data.variables,...t}}else"object"==typeof i&&(r.data.variables={...r.data.variables,...i})}try{let e=await f.process({...r,functions:l,on:{...d,all:(e,a)=>{// Was the original requestData in stream mode?
if(r.stream){// if the event is complete, close the connection after 1 second
if(clearTimeout(s),0===o&&t.writeHead(200,{"Content-Type":"text/event-stream","Cache-Control":"no-cache",Connection:"keep-alive","X-Accel-Buffering":"no"}),o++,"close"===e){s=setTimeout(()=>{t.end()},5e3);return}// if the event is open, clear the timeout in case this is a reconnection
("open"!==e||(clearTimeout(s),!(o>1)))&&(t.write(`event: ${e}
`),t.write(`data: ${JSON.stringify(a)}

`),u&&t.flush())}}}});return d&&d.complete&&e&&d.complete(e),e}catch(e){throw console.error("API call failed:",e),d&&d.error&&e.response&&d.error(e.response.data),e}};try{let s=await m(e.body);e.body.stream||(n?t.json(s.output_data):(e.zerowidthResult=s,r()))}catch(e){r(e)}},n=async({req:e,res:t,next:r,secretKey:s,baseUrl:a,on:n,returnsResponse:i})=>{let{project_id:l,agent_id:d,user_id:u,session_id:c}=e.params,{startAfter:p}=e.query,f=new o({secretKey:s,projectId:l,agentId:d,baseUrl:a});try{let s=await f.getHistory({userId:u,sessionId:c,startAfter:p});onProcess&&onProcess(s),i?t.json(s):(e.zerowidthHistory=s,r())}catch(e){console.error("History retrieval failed:",e),onError&&e.response&&onError(e.response.data),t.status(500).send("Internal Server Error")}};function i({secretKey:r,baseUrl:o,on:i,variables:l,returnsResponse:d=!0,functions:u,useCompression:c=!0}){let p=s(e).Router();return c&&p.use(s(t)()),// POST route to process data
p.post("/process/:project_id/:agent_id",(e,t,s)=>{a({req:e,res:t,next:s,secretKey:r,baseUrl:o,on:i,variables:l,returnsResponse:d,functions:u,useCompression:c})}),// GET route to retrieve history
p.get("/history/:project_id/:agent_id/:user_id/:session_id",(e,t,s)=>{n({req:e,res:t,next:s,secretKey:r,baseUrl:o,on:i,returnsResponse:d})}),p}//# sourceMappingURL=main.cjs.map

//# sourceMappingURL=main.cjs.map
