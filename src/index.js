import axios from 'axios';

class ZeroWidthAPI {
  constructor({ secretKey, appId, intelligenceId }) {
    
    // Validate input parameters
    if (!secretKey || !appId || !intelligenceId) {
      throw new Error('Missing required constructor parameters: secretKey, appId, and intelligenceId must be provided');
    }

    this.secretKey = secretKey;
    this.appId = appId;
    this.intelligenceId = intelligenceId;
    this.baseUrl = 'https://api.zerowidth.ai';
  }

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
      console.error('Error making API call:', error);
      throw error;
    }
  }

  // Process data through an installed intellgience
  async process({messages, message, variables, userId, sessionId, stateful, verbose}) {
    
    let url = `process/${this.appId}/${this.intelligenceId}`;
    if(verbose) url += "?verbose=true";

    if(stateful && (!userId || !sessionId)) throw new Error("Stateful processing requires a userId and sessionId");
    if(stateful && messages) throw new Error("Stateful processing does not support multiple messages");
    if(stateful && !message) throw new Error("Stateful processing requires a single message object");

    return this.makeApiCall(url, {
      method: 'POST',
      body: {
        user_id: userId,
        session_id: sessionId,
        stateful,
        data: {
          message, 
          messages, 
          variables
        }
      },
    });
  }

}

module.exports = ZeroWidthAPI;
