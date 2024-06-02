/**
 * ZeroWidthApi is the main class for interacting with the ZeroWidth API.
 */
class ZeroWidthApi {
  /**
   * Constructor for initializing the ZeroWidthApi class.
   * @param {Object} config - The configuration object.
   * @param {string} config.secretKey - The secret key for authentication.
   * @param {string} config.endpointId - The endpoint ID.
   * @param {string} config.agentId - The agent ID.
   * @param {string} [config.baseUrl] - The base URL for the API.
   * @throws {Error} If required parameters are missing.
   */
  constructor({ secretKey, endpointId, agentId, baseUrl }) {
    if (!secretKey) {
      throw new Error('Missing required constructor parameters: secretKey, endpointId, and agentId must be provided');
    }

    this.secretKey = secretKey.trim();
    this.endpointId = endpointId;
    this.agentId = agentId;
    this.baseUrl = baseUrl || 'https://api.zerowidth.ai/beta';
  }
  

  /**
   * Executes a tool function, handling both synchronous and asynchronous functions.
   * @param {Function} toolFunction - The tool function to execute.
   * @param {Object} args - The arguments to pass to the tool function.
   * @returns {Promise<*>} The result of the tool function.
   * @throws {Error} If the tool function throws an error.
   */
  async executeToolFunction(toolFunction, args) {
    try {
      const result = toolFunction(args);
      if (result instanceof Promise) {
        return await result;
      } else {
        return result;
      }
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
   */
  async makeApiCall(endpoint, options = {}, originalRequest) {
    const url = `${this.baseUrl}/${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      method: options.method || 'POST',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (options.body && options.body.stream) {
      return this.handleStreamedResponse({
        readableStream: response.body,
        originalRequest: originalRequest
      });
    } else {
      const responseData = await response.text(); // Ensure we read the text response
      return JSON.parse(responseData); // Parse the JSON manually
    }
  }

  /**
   * Creates a new FetchEventSource instance for handling streaming responses.
   * @param {ReadableStream} stream - The stream to process.
   * @returns {FetchEventSource} The created FetchEventSource instance.
   */
  async createFetchEventSource(args) {
    const eventSource = new this.FetchEventSource(args, this);
    return eventSource;
  }

  /**
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
   */
  async process({ endpointId, agentId, data, userId, sessionId, stateful, verbose, tools, stream, on } = {}) {
    
    let url = `process/${endpointId || this.endpointId}/${agentId || this.agentId}`;
    if (verbose) url += "?verbose=true";

    if (stateful && (!userId || !sessionId)) {
      throw new Error("Stateful processing requires a userId and sessionId");
    }

    const result = await this.makeApiCall(url, {
      method: 'POST',
      body: {
        user_id: userId,
        session_id: sessionId,
        stateful,
        data,
        stream
      }
    }, {
      stream,
      data,
      endpointId,
      agentId,
      userId,
      sessionId,
      stateful,
      verbose,
      tools,
      on
    });

    if (stream) {
      return;
    } else {
      if (tools && result.output_data && result.output_data.tool_calls) {
        let messageAutoAdded = false;
        let autoProcessedTools = 0;
        for (let tool_call of result.output_data.tool_calls) {
          if (tool_call.type === 'function') {
            if (tools.functions && tool_call.function && tools.functions[tool_call.function.name]) {
              if (!messageAutoAdded) {
                data.messages.push(result.output_data);
                messageAutoAdded = true;
              }

              const tool_result = await this.executeToolFunction(tools.functions[tool_call.function.name], JSON.parse(tool_call.function.arguments));
              data.messages.push({
                role: 'tool',
                tool_call_id: tool_call.id,
                content: tool_result,
                timestamp: new Date().toISOString()
              });
              autoProcessedTools++;
            }
          }
        }

        if(autoProcessedTools === result.output_data.tool_calls.length){
          return await this.process({
            endpointId,
            agentId,
            data,
            userId,
            sessionId,
            stateful,
            verbose,
            tools,
            stream,
            on
          });
        }
      }

      return result;
    }
  }


  /**
   * Initializes the event source by reading from the stream and emitting events.
   */
  handleStreamedResponse = ({readableStream, originalRequest}) => {
    let buffer = '';
    let eventType = null;
    let eventData = [];
    let decoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
    let cumulative_progress = "";

    let emit = (eventType, dataPacket) => {
      if(originalRequest.on && originalRequest.on[eventType]){
        originalRequest.on[eventType](dataPacket);
      }
      if(originalRequest.on && originalRequest.on['all']){
        originalRequest.on['all'](eventType, dataPacket);
      }
    }

    const processEvent = async () => {
      if (eventType && eventData.length) {
        const dataString = eventData.join('\n').trim();
        try {
          const dataPacket = JSON.parse(dataString);

          if(eventType === 'outputProgress'){
            if(dataPacket.partial_content === null || dataPacket.partial_content === undefined) dataPacket.partial_content = '';
            cumulative_progress += dataPacket.partial_content;

            dataPacket.content_so_far = cumulative_progress;
          }

          if(eventType === 'complete'){
            
            let autoProcessedTools = 0;
            if (originalRequest.tools && dataPacket.output_data && dataPacket.output_data.tool_calls) {
              
              if(dataPacket.output_data.tool_calls.length > 0){
                
                let messageAutoAdded = false;
                for (let tool_call of dataPacket.output_data.tool_calls) {

                  if (tool_call.type === 'function') {

                    if (originalRequest.tools.functions && tool_call.function && originalRequest.tools.functions[tool_call.function.name]) {
                      
                      if (!messageAutoAdded) {
                        originalRequest.data.messages.push(dataPacket.output_data);
                        messageAutoAdded = true;
                      }

                      emit('tool', {
                        role: 'tool',
                        tool_call: tool_call,
                      });


                      const tool_result = await this.executeToolFunction(originalRequest.tools.functions[tool_call.function.name], JSON.parse(tool_call.function.arguments));
                      
                      originalRequest.data.messages.push({
                        role: 'tool',
                        tool_call_id: tool_call.id,
                        content: tool_result,
                        timestamp: new Date().toISOString()
                      });

                      autoProcessedTools++;
                    } else {
                      emit('tool', {
                        role: 'tool',
                        tool_call: tool_call,
                      });
                    
                    }
                  }
                }

                if(autoProcessedTools === dataPacket.output_data.tool_calls.length){

                  return await this.process({
                    endpointId: originalRequest.endpointId,
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
          }

          emit(eventType, dataPacket);
        } catch (error) {
          emit('error', error);
        }
      }
      eventType = null;
      eventData = [];
    };

    const readStream = async () => {
      const reader = readableStream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (buffer.trim() !== '') {
              buffer += '\n\n';
              if (eventType) {
                await processEvent();
              } else {
                try {
                  const dataPacket = JSON.parse(buffer.trim());
                  emit('errorEvent', dataPacket);
                } catch (error) {
                  emit('error', { message: 'Failed to parse JSON', buffer });
                }
              }
            }
            emit('close');
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop(); // Retain incomplete line

          lines.forEach(async (line) =>{
            if (line.startsWith('event: ')) {
              if (eventType !== null) {
                await processEvent();
              }
              eventType = line.substring(7).trim();
            } else if (line.startsWith('data: ')) {
              eventData.push(line.substring(6));
            } else if (line.trim() === '') {
              await processEvent();
            }
          });
        }
      } catch (error) {
        emit('error', { message: 'Stream read error', error });
      }
    };

    readStream();
  }

  /**
   * Retrieves the history for a specific session.
   * @param {Object} params - The parameters for retrieving the history.
   * @param {string} [params.endpointId] - The endpoint ID.
   * @param {string} [params.agentId] - The agent ID.
   * @param {string} params.userId - The user ID.
   * @param {string} params.sessionId - The session ID.
   * @param {string} [params.startAfter] - The starting point for history retrieval.
   * @returns {Promise<Object>} The history data.
   * @throws {Error} If the API call fails.
   */
  async getHistory({ endpointId, agentId, userId, sessionId, startAfter } = {}) {
    const endpoint = `history/${endpointId || this.endpointId}/${agentId || this.agentId}/${userId}/${sessionId}`;
    const params = startAfter ? { startAfter } : {};

    return this.makeApiCall(endpoint, {
      method: 'GET',
      params: params,
    });
  }

  /**
   * Formats an error object for better readability.
   * @param {Error} error - The error object to format.
   * @returns {Object} An object containing the formatted error message and status code.
   */
  formatError(error) {
    let errorMessage = "An error occurred";
    let statusCode = null;

    if (error.response) {
      errorMessage = `API Error: ${error.response.statusText || error.message}`;
      statusCode = error.response.status;
    } else if (error.request) {
      errorMessage = "Network Error: No response received from the server.";
    } else {
      errorMessage = `Request Error: ${error.message}`;
    }

    return { errorMessage, statusCode };
  }
}

export default ZeroWidthApi;