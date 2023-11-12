import axios from 'axios';

class ZeroWidthApi {
  constructor({ secretKey, appId, intelligenceId }) {
    
    // Validate input parameters
    if (!secretKey) {
      throw new Error('Missing required constructor parameters: secretKey, and appId must be provided');
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
      // console.error('Error making API call:', error);
      throw error;
    }
  }

  // Process data through an installed intellgience
  async process({appId, intelligenceId, data, userId, sessionId, stateful, verbose} = {}) {
    
    let url = `process/${appId || this.appId}/${intelligenceId || this.intelligenceId}`;
    if(verbose) url += "?verbose=true";

    if(stateful && (!userId || !sessionId)) throw new Error("Stateful processing requires a userId and sessionId");


    return this.makeApiCall(url, {
      method: 'POST',
      body: {
        user_id: userId,
        session_id: sessionId,
        stateful,
        data
      },
    });
  }

  // Method to get history with pagination support
  async getHistory({ appId, intelligenceId, userId, sessionId, startAfter } = {}) {

    const endpoint = `history/${appId || this.appId}/${intelligenceId || this.intelligenceId}/${userId}/${sessionId}`;
    const params = startAfter ? { startAfter } : {};

    return this.makeApiCall(endpoint, {
      method: 'GET',
      params: params, // Pass startAfter as a query parameter if it exists
    });
  }

}

export default ZeroWidthApi;