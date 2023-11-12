var $a9A1a$axios = require("axios");
var $a9A1a$express = require("express");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

$parcel$export(module.exports, "ZeroWidthApi", () => $389d33f657cf04a1$export$2e2bcd8739ae039);
$parcel$export(module.exports, "ZeroWidthApiExpress", () => $c5b61cd6b2a52af4$export$2e2bcd8739ae039);
// index.js

class $389d33f657cf04a1$var$ZeroWidthApi {
    constructor({ secretKey: secretKey, appId: appId, intelligenceId: intelligenceId }){
        // Validate input parameters
        if (!secretKey) throw new Error("Missing required constructor parameters: secretKey, and appId must be provided");
        this.secretKey = secretKey;
        this.appId = appId;
        this.intelligenceId = intelligenceId;
        this.baseUrl = "https://api.zerowidth.ai";
    }
    async makeApiCall(endpoint, options = {}) {
        const url = `${this.baseUrl}/${endpoint}`;
        const headers = {
            "Authorization": `Bearer ${this.secretKey}`,
            "Content-Type": "application/json",
            ...options.headers
        };
        try {
            const response = await (0, ($parcel$interopDefault($a9A1a$axios)))({
                method: options.method || "get",
                url: url,
                headers: headers,
                data: options.body,
                params: options.params
            });
            return response.data;
        } catch (error) {
            // console.error('Error making API call:', error);
            throw error;
        }
    }
    // Process data through an installed intellgience
    async process({ appId: appId, intelligenceId: intelligenceId, data: data, userId: userId, sessionId: sessionId, stateful: stateful, verbose: verbose } = {}) {
        let url = `process/${appId || this.appId}/${intelligenceId || this.intelligenceId}`;
        if (verbose) url += "?verbose=true";
        if (stateful && (!userId || !sessionId)) throw new Error("Stateful processing requires a userId and sessionId");
        return this.makeApiCall(url, {
            method: "POST",
            body: {
                user_id: userId,
                session_id: sessionId,
                stateful: stateful,
                data: data
            }
        });
    }
    // Method to get history with pagination support
    async getHistory({ appId: appId, intelligenceId: intelligenceId, userId: userId, sessionId: sessionId, startAfter: startAfter } = {}) {
        const endpoint = `history/${appId || this.appId}/${intelligenceId || this.intelligenceId}/${userId}/${sessionId}`;
        const params = startAfter ? {
            startAfter: startAfter
        } : {};
        return this.makeApiCall(endpoint, {
            method: "GET",
            params: params
        });
    }
}
var $389d33f657cf04a1$export$2e2bcd8739ae039 = $389d33f657cf04a1$var$ZeroWidthApi;


// ZeroWidthApiMiddleware.js


const $c5b61cd6b2a52af4$var$processRouteHandler = async (req, res, next, secretKey, onProcess, onError, returnsResponse)=>{
    const { app_id: app_id, intelligence_id: intelligence_id } = req.params;
    const zerowidthApi = new (0, $389d33f657cf04a1$export$2e2bcd8739ae039)({
        secretKey: secretKey,
        appId: app_id,
        intelligenceId: intelligence_id
    });
    try {
        const result = await zerowidthApi.process(req.body);
        if (onProcess) onProcess(result);
        if (returnsResponse) res.json(result.output_data);
        else {
            req.zerowidthResult = result;
            next();
        }
    } catch (error) {
        // console.error('API call failed:', error);
        if (onError && error.response) onError(error.response.data);
        res.status(500).send("Internal Server Error");
    }
};
const $c5b61cd6b2a52af4$var$historyRouteHandler = async (req, res, next, secretKey, onProcess, onError, returnsResponse)=>{
    const { app_id: app_id, intelligence_id: intelligence_id, user_id: user_id, session_id: session_id } = req.params;
    const { startAfter: startAfter } = req.query;
    const zerowidthApi = new (0, $389d33f657cf04a1$export$2e2bcd8739ae039)({
        secretKey: secretKey,
        appId: app_id,
        intelligenceId: intelligence_id
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
        // console.error('History retrieval failed:', error);
        if (onError && error.response) onError(error.response.data);
        res.status(500).send("Internal Server Error");
    }
};
function $c5b61cd6b2a52af4$export$2e2bcd8739ae039({ secretKey: secretKey, onProcess: onProcess, onError: onError, returnsResponse: returnsResponse = true }) {
    const router = (0, ($parcel$interopDefault($a9A1a$express))).Router();
    // POST route to process data
    router.post("/process/:app_id/:intelligence_id", (req, res, next)=>{
        $c5b61cd6b2a52af4$var$processRouteHandler(req, res, next, secretKey, onProcess, onError, returnsResponse);
    });
    // GET route to retrieve history
    router.get("/history/:app_id/:intelligence_id/:user_id/:session_id", (req, res, next)=>{
        $c5b61cd6b2a52af4$var$historyRouteHandler(req, res, next, secretKey, onProcess, onError, returnsResponse);
    });
    return router;
}




//# sourceMappingURL=main.cjs.map
