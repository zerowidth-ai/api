// ZeroWidthApiMiddleware.js
import express from 'express';
import ZeroWidthApi from './ZeroWidthApi.js'; 

const processRouteHandler = async (req, res, next, secretKey, onProcess, onError, returnsResponse) => {

  const { app_id, intelligence_id } = req.params;

  const zerowidthApi = new ZeroWidthApi({
    secretKey: secretKey,
    appId: app_id,
    intelligenceId: intelligence_id
  });


  try {
    const result = await zerowidthApi.process(req.body);
    if (onProcess) {
      onProcess(result);
    }
    
    if (returnsResponse) {
      res.json(result.output_data);
    } else {
      req.zerowidthResult = result;
      next();
    }
  } catch (error) {
    // console.error('API call failed:', error);

    if(onError && error.response) {
      onError(error.response.data);
    }

    res.status(500).send('Internal Server Error');
  }
};

const historyRouteHandler = async (req, res, next, secretKey, onProcess, onError, returnsResponse) => {
  const { app_id, intelligence_id, user_id, session_id } = req.params;
  const { startAfter } = req.query;
  
  
  const zerowidthApi = new ZeroWidthApi({
    secretKey: secretKey,
    appId: app_id,
    intelligenceId: intelligence_id
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
    // console.error('History retrieval failed:', error);

    if(onError && error.response) {
      onError(error.response.data);
    }

    res.status(500).send('Internal Server Error');
  }
};

export default function ZeroWidthApiExpress({ secretKey, onProcess, onError, returnsResponse = true }) {
  const router = express.Router();

  // POST route to process data
  router.post('/process/:app_id/:intelligence_id', (req, res, next) => {
    processRouteHandler(req, res, next, secretKey, onProcess, onError, returnsResponse);
  });

  // GET route to retrieve history
  router.get('/history/:app_id/:intelligence_id/:user_id/:session_id', (req, res, next) => {
    historyRouteHandler(req, res, next, secretKey, onProcess, onError, returnsResponse);
  });

  return router;
}
