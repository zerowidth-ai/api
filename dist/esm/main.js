import $6XpKT$express from "express";
import $6XpKT$compression from "compression";

// index.js
/**
 * ZeroWidthApi is the main class for interacting with the ZeroWidth API.
 */ class $cea14915a7038b01$var$ZeroWidthApi {
    /**
   * Constructor for initializing the ZeroWidthApi class.
   * @param {Object} config - The configuration object.
   * @param {string} config.secretKey - The secret key for authentication.
   * @param {string} config.endpointId - The endpoint ID (deprecated).
   * @param {string} config.projectId - The project ID (replacement for endpoint ID).
   * @param {string} config.agentId - The agent ID.
   * @param {string} [config.baseUrl] - The base URL for the API.
   * @throws {Error} If required parameters are missing.
   */ constructor({ secretKey: secretKey, endpointId: endpointId, projectId: projectId, agentId: agentId, baseUrl: baseUrl }){
        if (!secretKey) throw new Error("Missing required constructor parameters: secretKey, projectId, and agentId should be provided");
        this.secretKey = secretKey.trim();
        this.projectId = projectId || endpointId;
        this.agentId = agentId;
        this.baseUrl = baseUrl || "https://api.zerowidth.ai/beta";
    }
    /**
   * Executes a tool function, handling both synchronous and asynchronous functions.
   * @param {Function} toolFunction - The tool function to execute.
   * @param {Object} args - The arguments to pass to the tool function.
   * @returns {Promise<*>} The result of the tool function.
   * @throws {Error} If the tool function throws an error.
   */ async executeToolFunction(toolFunction, args) {
        try {
            const result = toolFunction(args);
            if (result instanceof Promise) return await result;
            else return result;
        } catch (error) {
            throw error;
        }
    }
    /**
   * Makes an API call to the specified endpoint.
   * @param {string} endpoint - The API endpoint to call.
   * @param {Object} [options={}] - Options for the API call.
   * @param {string} [options.method='POST'] - The HTTP method to use.
   * @param {Object} [options.headers] - Additional headers to include in the request.
   * @param {Object} [options.body] - The body of the request.
   * @returns {Promise<Object>} The response data from the API call.
   * @throws {Error} If the API call fails.
   */ async makeApiCall(endpoint, options = {}, originalRequest) {
        const url = `${this.baseUrl}/${endpoint}`;
        const headers = {
            "Authorization": `Bearer ${this.secretKey}`,
            "Content-Type": "application/json",
            ...options.headers
        };
        const response = await fetch(url, {
            method: options.method || "POST",
            headers: headers,
            body: options.body ? JSON.stringify(options.body) : undefined
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        if (options.body && options.body.stream) return this.handleStreamedResponse({
            readableStream: response.body,
            originalRequest: originalRequest
        });
        else {
            const responseData = await response.text(); // Ensure we read the text response
            return JSON.parse(responseData); // Parse the JSON manually
        }
    }
    /**
   * Creates a new FetchEventSource instance for handling streaming responses.
   * @param {ReadableStream} stream - The stream to process.
   * @returns {FetchEventSource} The created FetchEventSource instance.
   */ async createFetchEventSource(args) {
        const eventSource = new this.FetchEventSource(args, this);
        return eventSource;
    }
    /**
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
   * @param {Object} [params.tools] - The tools to use for processing.
   * @param {boolean} [params.stream] - Whether to enable streaming responses.
   * @returns {Promise<Object>} The result of the processing.
   * @throws {Error} If required parameters are missing or if the processing fails.
   */ async process({ endpointId: endpointId, projectId: projectId, agentId: agentId, data: data, userId: userId, sessionId: sessionId, stateful: stateful, verbose: verbose, tools: tools, stream: stream, on: on } = {}) {
        let pIdTouse = projectId || endpointId || this.projectId;
        let url = `process/${pIdTouse}/${agentId || this.agentId}`;
        if (verbose) url += "?verbose=true";
        if (stateful && (!userId || !sessionId)) throw new Error("Stateful processing requires a userId and sessionId");
        const result = await this.makeApiCall(url, {
            method: "POST",
            body: {
                user_id: userId,
                session_id: sessionId,
                stateful: stateful,
                data: data,
                stream: stream
            }
        }, {
            stream: stream,
            data: data,
            projectId: pIdTouse,
            agentId: agentId,
            userId: userId,
            sessionId: sessionId,
            stateful: stateful,
            verbose: verbose,
            tools: tools,
            on: on
        });
        if (stream) return;
        else {
            if (tools && result.output_data && result.output_data.tool_calls) {
                let messageAutoAdded = false;
                let autoProcessedTools = 0;
                for (let tool_call of result.output_data.tool_calls){
                    if (tool_call.type === "function") {
                        if (tools.functions && tool_call.function && tools.functions[tool_call.function.name]) {
                            if (!messageAutoAdded) {
                                data.messages.push(result.output_data);
                                messageAutoAdded = true;
                            }
                            const tool_result = await this.executeToolFunction(tools.functions[tool_call.function.name], JSON.parse(tool_call.function.arguments));
                            data.messages.push({
                                role: "tool",
                                tool_call_id: tool_call.id,
                                content: tool_result,
                                timestamp: new Date().toISOString()
                            });
                            autoProcessedTools++;
                        }
                    }
                }
                if (autoProcessedTools === result.output_data.tool_calls.length) return await this.process({
                    projectId: pIdTouse,
                    agentId: agentId,
                    data: data,
                    userId: userId,
                    sessionId: sessionId,
                    stateful: stateful,
                    verbose: verbose,
                    tools: tools,
                    stream: stream,
                    on: on
                });
            }
            return result;
        }
    }
    /**
   * Initializes the event source by reading from the stream and emitting events.
   */ handleStreamedResponse = ({ readableStream: readableStream, originalRequest: originalRequest })=>{
        let buffer = "";
        let eventType = null;
        let eventData = [];
        let decoder = new TextDecoder("utf-8", {
            ignoreBOM: true,
            fatal: true
        });
        let cumulative_progress = "";
        let emit = (eventType, dataPacket)=>{
            if (originalRequest.on && originalRequest.on[eventType]) originalRequest.on[eventType](dataPacket);
            if (originalRequest.on && originalRequest.on["all"]) originalRequest.on["all"](eventType, dataPacket);
        };
        const processEvent = async ()=>{
            if (eventType && eventData.length) {
                const dataString = eventData.join("\n").trim();
                try {
                    const dataPacket = JSON.parse(dataString);
                    if (eventType === "outputProgress") {
                        if (dataPacket.partial_content === null || dataPacket.partial_content === undefined) dataPacket.partial_content = "";
                        cumulative_progress += dataPacket.partial_content;
                        dataPacket.content_so_far = cumulative_progress;
                    }
                    if (eventType === "complete") {
                        let autoProcessedTools = 0;
                        if (originalRequest.tools && dataPacket.output_data && dataPacket.output_data.tool_calls) {
                            if (dataPacket.output_data.tool_calls.length > 0) {
                                let messageAutoAdded = false;
                                for (let tool_call of dataPacket.output_data.tool_calls)if (tool_call.type === "function") {
                                    if (originalRequest.tools.functions && tool_call.function && originalRequest.tools.functions[tool_call.function.name]) {
                                        if (!messageAutoAdded) {
                                            originalRequest.data.messages.push(dataPacket.output_data);
                                            messageAutoAdded = true;
                                        }
                                        emit("tool", {
                                            role: "tool",
                                            tool_call: tool_call
                                        });
                                        const tool_result = await this.executeToolFunction(originalRequest.tools.functions[tool_call.function.name], JSON.parse(tool_call.function.arguments));
                                        originalRequest.data.messages.push({
                                            role: "tool",
                                            tool_call_id: tool_call.id,
                                            content: tool_result,
                                            timestamp: new Date().toISOString()
                                        });
                                        autoProcessedTools++;
                                    } else emit("tool", {
                                        role: "tool",
                                        tool_call: tool_call
                                    });
                                }
                                if (autoProcessedTools === dataPacket.output_data.tool_calls.length) return await this.process({
                                    projectId: originalRequest.projectId,
                                    agentId: originalRequest.agentId,
                                    data: originalRequest.data,
                                    userId: originalRequest.userId,
                                    sessionId: originalRequest.sessionId,
                                    stateful: originalRequest.stateful,
                                    verbose: originalRequest.verbose,
                                    tools: originalRequest.tools,
                                    stream: originalRequest.stream,
                                    on: originalRequest.on
                                });
                            }
                        }
                    }
                    emit(eventType, dataPacket);
                } catch (error) {
                    emit("error", error);
                }
            }
            eventType = null;
            eventData = [];
        };
        const readStream = async ()=>{
            const reader = readableStream.getReader();
            try {
                while(true){
                    const { done: done, value: value } = await reader.read();
                    if (done) {
                        if (buffer.trim() !== "") {
                            buffer += "\n\n";
                            if (eventType) await processEvent();
                            else try {
                                const dataPacket = JSON.parse(buffer.trim());
                                emit("errorEvent", dataPacket);
                            } catch (error) {
                                emit("error", {
                                    message: "Failed to parse JSON",
                                    buffer: buffer
                                });
                            }
                        }
                        emit("close");
                        break;
                    }
                    buffer += decoder.decode(value, {
                        stream: true
                    });
                    const lines = buffer.split("\n");
                    buffer = lines.pop(); // Retain incomplete line
                    lines.forEach(async (line)=>{
                        if (line.startsWith("event: ")) {
                            if (eventType !== null) await processEvent();
                            eventType = line.substring(7).trim();
                        } else if (line.startsWith("data: ")) eventData.push(line.substring(6));
                        else if (line.trim() === "") await processEvent();
                    });
                }
            } catch (error) {
                emit("error", {
                    message: "Stream read error",
                    error: error
                });
            }
        };
        readStream();
    };
    /**
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
   */ async getHistory({ endpointId: endpointId, projectId: projectId, agentId: agentId, userId: userId, sessionId: sessionId, startAfter: startAfter } = {}) {
        const endpoint = `history/${projectId || endpointId || this.projectId}/${agentId || this.agentId}/${userId}/${sessionId}`;
        const params = startAfter ? {
            startAfter: startAfter
        } : {};
        return this.makeApiCall(endpoint, {
            method: "GET",
            params: params
        });
    }
    /**
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
   */ async report({ endpointId: endpointId, projectId: projectId, agentId: agentId, data: data, userId: userId, sessionId: sessionId, type: type, category: category, details: details } = {}) {
        // Construct the endpoint URL using provided or default IDs
        const url = `report/${projectId || endpointId || this.projectId}/${agentId || this.agentId}`;
        // Prepare the body of the POST request
        const requestBody = {
            user_id: userId || null,
            session_id: sessionId || null,
            data: data || null,
            type: type,
            category: category || null,
            details: details || null // Optional: Additional user-provided details (string)
        };
        // Make the API call to submit the report
        try {
            const result = await this.makeApiCall(url, {
                method: "POST",
                body: requestBody
            });
            return result;
        } catch (error) {
            console.error("Error submitting report:", error);
            throw new Error("Failed to submit report");
        }
    }
    /**
   * Formats an error object for better readability.
   * @param {Error} error - The error object to format.
   * @returns {Object} An object containing the formatted error message and status code.
   */ formatError(error) {
        let errorMessage = "An error occurred";
        let statusCode = null;
        if (error.response) {
            errorMessage = `API Error: ${error.response.statusText || error.message}`;
            statusCode = error.response.status;
        } else if (error.request) errorMessage = "Network Error: No response received from the server.";
        else errorMessage = `Request Error: ${error.message}`;
        return {
            errorMessage: errorMessage,
            statusCode: statusCode
        };
    }
}
var $cea14915a7038b01$export$2e2bcd8739ae039 = $cea14915a7038b01$var$ZeroWidthApi;


// ZeroWidthApiMiddleware.js



const $a777ca2277e3a949$var$processRouteHandler = async ({ req: req, res: res, next: next, secretKey: secretKey, baseUrl: baseUrl, returnsResponse: returnsResponse, variables: variables, tools: tools, on: on, useCompression: useCompression })=>{
    const { project_id: project_id, agent_id: agent_id } = req.params;
    const zerowidthApi = new (0, $cea14915a7038b01$export$2e2bcd8739ae039)({
        secretKey: secretKey,
        projectId: project_id,
        agentId: agent_id,
        baseUrl: baseUrl
    });
    const processApiResponse = async (requestData)=>{
        let eventsSentCounter = 0;
        let closeTimeout;
        if (variables) {
            if (typeof variables === "function") {
                let serverVariables = await variables(req);
                requestData.data.variables = {
                    ...requestData.data.variables,
                    ...serverVariables
                };
            } else if (typeof variables === "object") requestData.data.variables = {
                ...requestData.data.variables,
                ...variables
            };
        }
        try {
            const result = await zerowidthApi.process({
                ...requestData,
                tools: tools,
                on: {
                    ...on,
                    all: (eventType, data)=>{
                        // Was the original requestData in stream mode?
                        if (requestData.stream) {
                            clearTimeout(closeTimeout);
                            if (eventsSentCounter === 0) // open the SSE
                            res.writeHead(200, {
                                "Content-Type": "text/event-stream",
                                "Cache-Control": "no-cache",
                                "Connection": "keep-alive",
                                "X-Accel-Buffering": "no"
                            });
                            eventsSentCounter++;
                            // if the event is complete, close the connection after 1 second
                            if (eventType === "close") {
                                closeTimeout = setTimeout(()=>{
                                    res.end();
                                }, 5000);
                                return;
                            }
                            // if the event is open, clear the timeout in case this is a reconnection
                            if (eventType === "open") {
                                clearTimeout(closeTimeout);
                                if (eventsSentCounter > 1) return;
                            }
                            res.write(`event: ${eventType}\n`);
                            res.write(`data: ${JSON.stringify(data)}\n\n`);
                            if (useCompression) res.flush();
                        }
                    }
                }
            });
            if (on && on.complete && result) on.complete(result);
            return result;
        } catch (error) {
            console.error("API call failed:", error);
            if (on && on.error && error.response) on.error(error.response.data);
            throw error;
        }
    };
    try {
        const finalResult = await processApiResponse(req.body);
        if (req.body.stream) ;
        else if (returnsResponse) res.json(finalResult.output_data);
        else {
            req.zerowidthResult = finalResult;
            next();
        }
    } catch (error) {
        next(error);
    }
};
const $a777ca2277e3a949$var$historyRouteHandler = async ({ req: req, res: res, next: next, secretKey: secretKey, baseUrl: baseUrl, on: on, returnsResponse: returnsResponse })=>{
    const { project_id: project_id, agent_id: agent_id, user_id: user_id, session_id: session_id } = req.params;
    const { startAfter: startAfter } = req.query;
    const zerowidthApi = new (0, $cea14915a7038b01$export$2e2bcd8739ae039)({
        secretKey: secretKey,
        projectId: project_id,
        agentId: agent_id,
        baseUrl: baseUrl
    });
    try {
        const history = await zerowidthApi.getHistory({
            userId: user_id,
            sessionId: session_id,
            startAfter: startAfter
        });
        if (onProcess) onProcess(history);
        if (returnsResponse) res.json(history);
        else {
            req.zerowidthHistory = history;
            next();
        }
    } catch (error) {
        console.error("History retrieval failed:", error);
        if (onError && error.response) onError(error.response.data);
        res.status(500).send("Internal Server Error");
    }
};
function $a777ca2277e3a949$export$2e2bcd8739ae039({ secretKey: secretKey, baseUrl: baseUrl, on: on, variables: variables, returnsResponse: returnsResponse = true, tools: tools, useCompression: useCompression = true }) {
    const router = (0, $6XpKT$express).Router();
    if (useCompression) router.use((0, $6XpKT$compression)());
    // POST route to process data
    router.post("/process/:project_id/:agent_id", (req, res, next)=>{
        $a777ca2277e3a949$var$processRouteHandler({
            req: req,
            res: res,
            next: next,
            secretKey: secretKey,
            baseUrl: baseUrl,
            on: on,
            variables: variables,
            returnsResponse: returnsResponse,
            tools: tools,
            useCompression: useCompression
        });
    });
    // GET route to retrieve history
    router.get("/history/:project_id/:agent_id/:user_id/:session_id", (req, res, next)=>{
        $a777ca2277e3a949$var$historyRouteHandler({
            req: req,
            res: res,
            next: next,
            secretKey: secretKey,
            baseUrl: baseUrl,
            on: on,
            returnsResponse: returnsResponse
        });
    });
    return router;
}




export {$cea14915a7038b01$export$2e2bcd8739ae039 as ZeroWidthApi, $a777ca2277e3a949$export$2e2bcd8739ae039 as ZeroWidthApiExpress};
//# sourceMappingURL=main.js.map
