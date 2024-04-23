// ZeroWidthApiMiddleware.js
import express from 'express';
import ZeroWidthApi from './ZeroWidthApi.js'; 

const processRouteHandler = async ({ req, res, next, secretKey, baseUrl, onProcess, onError, returnsResponse, tools }) => {
  const { endpoint_id, agent_id } = req.params;

  const zerowidthApi = new ZeroWidthApi({
    secretKey: secretKey,
    endpointId: endpoint_id,
    agentId: agent_id,
    baseUrl: baseUrl
  });
  

  const processApiResponse = async (requestData) => {
    try {
      const result = await zerowidthApi.process(requestData);
      if (onProcess) {
        onProcess(result);
      }

      return result;
    } catch (error) {
      console.error('API call failed:', error);
      if (onError && error.response) {
        onError(error.response.data);
      }
      throw error;
    }
  };

  try {
    const finalResult = await processApiResponse(req.body);

    if (returnsResponse) {
      res.json(finalResult.output_data);
    } else {
      req.zerowidthResult = finalResult;
      next();
    }
  } catch (error) {
    next(error);
  }
};


const historyRouteHandler = async ({req, res, next, secretKey, baseUrl, onProcess, onError, returnsResponse}) => {
  const { endpoint_id, agent_id, user_id, session_id } = req.params;
  const { startAfter } = req.query;
  
  
  const zerowidthApi = new ZeroWidthApi({
    secretKey: secretKey,
    endpointId: endpoint_id,
    agentId: agent_id,
    baseUrl: baseUrl
  });

  try {
    const history = await zerowidthApi.getHistory({
      userId: user_id,
      sessionId: session_id,
      startAfter: startAfter,
    });

    if (onProcess) {
      onProcess(history);
    } 
    
    if (returnsResponse) {
      res.json(history);
    } else {
      req.zerowidthHistory = history;
      next();
    }
  } catch (error) {
    console.error('History retrieval failed:', error);

    if(onError && error.response) {
      onError(error.response.data);
    }

    res.status(500).send('Internal Server Error');
  }
};

export default function ZeroWidthApiExpress({ secretKey, baseUrl, onProcess, onError, returnsResponse = true, tools }) {
  const router = express.Router();

  // POST route to process data
  router.post('/process/:endpoint_id/:agent_id', (req, res, next) => {
    processRouteHandler({req, res, next, secretKey, baseUrl, onProcess, onError, returnsResponse, tools});
  });

  // GET route to retrieve history
  router.get('/history/:endpoint_id/:agent_id/:user_id/:session_id', (req, res, next) => {
    historyRouteHandler({req, res, next, secretKey, baseUrl, onProcess, onError, returnsResponse});
  });

  return router;
}
