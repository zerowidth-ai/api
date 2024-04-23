import axios from 'axios';


class ZeroWidthApi {
  constructor({ secretKey, endpointId, agentId, baseUrl }) {
    
    // Validate input parameters
    if (!secretKey) {
      throw new Error('Missing required constructor parameters: secretKey, and endpointId must be provided');
    }

    this.secretKey = secretKey.trim();
    this.endpointId = endpointId;
    this.agentId = agentId;
    this.baseUrl = baseUrl || 'https://api.zerowidth.ai/beta';
  }


  async executeToolFunction (toolFunction, args) {
    try {
      // Check if the function returns a promise
      const result = toolFunction(args);
      if (result instanceof Promise) {
        // Handle as async function
        return await result;
      } else {
        // Handle as a synchronous function or a function that uses a callback
        return result;
      }
    } catch (error) {
      // Handle errors
      throw error;
    }
  };

  async makeApiCall(endpoint, options = {}) {
    const url = `${this.baseUrl}/${endpoint}`;

    const headers = {
      'Authorization': `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await axios({
        method: options.method || 'get',
        url,
        headers,
        data: options.body,
        params: options.params,
      });
      
      return response.data;
    } catch (error) {
      const { errorMessage, statusCode } = this.formatError(error);
      
      console.error(errorMessage);
      
      let err = new Error(errorMessage);
      err.statusCode = statusCode;
      
      throw err;
    }
  }

  // Process data through installed agent
  async process({ endpointId, agentId, data, userId, sessionId, stateful, verbose, tools } = {}) {
    let url = `process/${endpointId || this.endpointId}/${agentId || this.agentId}`;
    if (verbose) url += "?verbose=true";

    console.log('url', url);

    if (stateful && (!userId || !sessionId)) {
      throw new Error("Stateful processing requires a userId and sessionId");
    }

    // Recursive internal function to handle tool calls
    const processWithTools = async (requestData) => {
      const result = await this.makeApiCall(url, {
        method: 'post',
        body: {
          user_id: userId,
          session_id: sessionId,
          stateful,
          data: requestData
        },
      });

      if (tools && result.output_data && result.output_data.tool_calls) {

        let messageAutoAdded = false;
        

        for (let tool_call of result.output_data.tool_calls) {
          if (tool_call.type === 'function') {
            if (tools.functions && tool_call.function && tools.functions[tool_call.function.name]) {

              if(!messageAutoAdded){
                // Add the API result to the messages array
                requestData.messages.push(result.output_data);
                messageAutoAdded = true;
              }
              
              const tool_result = await this.executeToolFunction(tools.functions[tool_call.function.name], JSON.parse(tool_call.function.arguments));
              

              // Add the function response to the messages array
              requestData.messages.push({
                role: 'tool',
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
  async getHistory({ endpointId, agentId, userId, sessionId, startAfter } = {}) {

    const endpoint = `history/${endpointId || this.endpointId}/${agentId || this.agentId}/${userId}/${sessionId}`;
    const params = startAfter ? { startAfter } : {};

    return this.makeApiCall(endpoint, {
      method: 'GET',
      params: params, // Pass startAfter as a query parameter if it exists
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
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = "Network Error: No response received from the server.";
    } else {
      // Something else, like an error in setting up the request
      errorMessage = `Request Error: ${error.message}`;
    }
  
    return { errorMessage, statusCode };
  }

}


export default ZeroWidthApi;