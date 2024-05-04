import $6XpKT$axios from "axios";
import $6XpKT$express from "express";

// index.js

class $cea14915a7038b01$var$ZeroWidthApi {
    constructor({ secretKey: secretKey, endpointId: endpointId, agentId: agentId, baseUrl: baseUrl }){
        // Validate input parameters
        if (!secretKey) throw new Error("Missing required constructor parameters: secretKey, and endpointId must be provided");
        this.secretKey = secretKey.trim();
        this.endpointId = endpointId;
        this.agentId = agentId;
        this.baseUrl = baseUrl || "https://api.zerowidth.ai/beta";
    }
    async executeToolFunction(toolFunction, args) {
        try {
            // Check if the function returns a promise
            const result = toolFunction(args);
            if (result instanceof Promise) // Handle as async function
            return await result;
            else // Handle as a synchronous function or a function that uses a callback
            return result;
        } catch (error) {
            // Handle errors
            throw error;
        }
    }
    async makeApiCall(endpoint, options = {}) {
        const url = `${this.baseUrl}/${endpoint}`;
        const headers = {
            "Authorization": `Bearer ${this.secretKey}`,
            "Content-Type": "application/json",
            ...options.headers
        };
        try {
            const response = await (0, $6XpKT$axios)({
                method: options.method || "get",
                url: url,
                headers: headers,
                data: options.body,
                params: options.params
            });
            return response.data;
        } catch (error) {
            const { errorMessage: errorMessage, statusCode: statusCode } = this.formatError(error);
            console.error(errorMessage);
            let err = new Error(errorMessage);
            err.statusCode = statusCode;
            throw err;
        }
    }
    // Process data through installed agent
    async process({ endpointId: endpointId, agentId: agentId, data: data, userId: userId, sessionId: sessionId, stateful: stateful, verbose: verbose, tools: tools } = {}) {
        let url = `process/${endpointId || this.endpointId}/${agentId || this.agentId}`;
        if (verbose) url += "?verbose=true";
        console.log("url", url);
        if (stateful && (!userId || !sessionId)) throw new Error("Stateful processing requires a userId and sessionId");
        // Recursive internal function to handle tool calls
        const processWithTools = async (requestData)=>{
            const result = await this.makeApiCall(url, {
                method: "post",
                body: {
                    user_id: userId,
                    session_id: sessionId,
                    stateful: stateful,
                    data: requestData
                }
            });
            if (tools && result.output_data && result.output_data.tool_calls) {
                let messageAutoAdded = false;
                for (let tool_call of result.output_data.tool_calls){
                    if (tool_call.type === "function") {
                        if (tools.functions && tool_call.function && tools.functions[tool_call.function.name]) {
                            if (!messageAutoAdded) {
                                // Add the API result to the messages array
                                requestData.messages.push(result.output_data);
                                messageAutoAdded = true;
                            }
                            const tool_result = await this.executeToolFunction(tools.functions[tool_call.function.name], JSON.parse(tool_call.function.arguments));
                            // Add the function response to the messages array
                            requestData.messages.push({
                                role: "tool",
                                tool_call_id: tool_call.id,
                                content: tool_result,
                                timestamp: new Date().toISOString()
                            });
                        }
                    }
                }
                // Recursively process the updated request data
                return await processWithTools(requestData);
            }
            return result;
        };
        return await processWithTools(data);
    }
    // Method to get history with pagination support
    async getHistory({ endpointId: endpointId, agentId: agentId, userId: userId, sessionId: sessionId, startAfter: startAfter } = {}) {
        const endpoint = `history/${endpointId || this.endpointId}/${agentId || this.agentId}/${userId}/${sessionId}`;
        const params = startAfter ? {
            startAfter: startAfter
        } : {};
        return this.makeApiCall(endpoint, {
            method: "GET",
            params: params
        });
    }
    formatError(error) {
        let errorMessage = "An error occurred";
        let statusCode = null;
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            errorMessage = `API Error: ${JSON.stringify(error.response.data, null, 2)}`;
            statusCode = error.response.status;
        } else if (error.request) // The request was made but no response was received
        errorMessage = "Network Error: No response received from the server.";
        else // Something else, like an error in setting up the request
        errorMessage = `Request Error: ${error.message}`;
        return {
            errorMessage: errorMessage,
            statusCode: statusCode
        };
    }
}
var $cea14915a7038b01$export$2e2bcd8739ae039 = $cea14915a7038b01$var$ZeroWidthApi;


// ZeroWidthApiMiddleware.js


const $a777ca2277e3a949$var$processRouteHandler = async ({ req: req, res: res, next: next, secretKey: secretKey, baseUrl: baseUrl, onProcess: onProcess, onError: onError, returnsResponse: returnsResponse, tools: tools })=>{
    const { endpoint_id: endpoint_id, agent_id: agent_id } = req.params;
    const zerowidthApi = new (0, $cea14915a7038b01$export$2e2bcd8739ae039)({
        secretKey: secretKey,
        endpointId: endpoint_id,
        agentId: agent_id,
        baseUrl: baseUrl
    });
    const processApiResponse = async (requestData)=>{
        try {
            const result = await zerowidthApi.process({
                ...requestData,
                tools: tools
            });
            if (onProcess) onProcess(result);
            return result;
        } catch (error) {
            console.error("API call failed:", error);
            if (onError && error.response) onError(error.response.data);
            throw error;
        }
    };
    try {
        const finalResult = await processApiResponse(req.body);
        if (returnsResponse) res.json(finalResult.output_data);
        else {
            req.zerowidthResult = finalResult;
            next();
        }
    } catch (error) {
        next(error);
    }
};
const $a777ca2277e3a949$var$historyRouteHandler = async ({ req: req, res: res, next: next, secretKey: secretKey, baseUrl: baseUrl, onProcess: onProcess, onError: onError, returnsResponse: returnsResponse })=>{
    const { endpoint_id: endpoint_id, agent_id: agent_id, user_id: user_id, session_id: session_id } = req.params;
    const { startAfter: startAfter } = req.query;
    const zerowidthApi = new (0, $cea14915a7038b01$export$2e2bcd8739ae039)({
        secretKey: secretKey,
        endpointId: endpoint_id,
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
function $a777ca2277e3a949$export$2e2bcd8739ae039({ secretKey: secretKey, baseUrl: baseUrl, onProcess: onProcess, onError: onError, returnsResponse: returnsResponse = true, tools: tools }) {
    const router = (0, $6XpKT$express).Router();
    // POST route to process data
    router.post("/process/:endpoint_id/:agent_id", (req, res, next)=>{
        $a777ca2277e3a949$var$processRouteHandler({
            req: req,
            res: res,
            next: next,
            secretKey: secretKey,
            baseUrl: baseUrl,
            onProcess: onProcess,
            onError: onError,
            returnsResponse: returnsResponse,
            tools: tools
        });
    });
    // GET route to retrieve history
    router.get("/history/:endpoint_id/:agent_id/:user_id/:session_id", (req, res, next)=>{
        $a777ca2277e3a949$var$historyRouteHandler({
            req: req,
            res: res,
            next: next,
            secretKey: secretKey,
            baseUrl: baseUrl,
            onProcess: onProcess,
            onError: onError,
            returnsResponse: returnsResponse
        });
    });
    return router;
}




export {$cea14915a7038b01$export$2e2bcd8739ae039 as ZeroWidthApi, $a777ca2277e3a949$export$2e2bcd8739ae039 as ZeroWidthApiExpress};
//# sourceMappingURL=main.js.map
