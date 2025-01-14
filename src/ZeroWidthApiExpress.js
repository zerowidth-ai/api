// ZeroWidthApiMiddleware.js
import express from 'express';
import ZeroWidthApi from './ZeroWidthApi.js'; 
import compression from 'compression';

const processRouteHandler = async ({ req, res, next, secretKey, baseUrl, returnsResponse, variables, functions, on, useCompression }) => {
  const { project_id, agent_id } = req.params;

  const zerowidthApi = new ZeroWidthApi({
    secretKey: secretKey,
    projectId: project_id,
    agentId: agent_id,
    baseUrl: baseUrl
  });


  const processApiResponse = async (requestData) => {

    let eventsSentCounter = 0;
    let closeTimeout;

    if(variables){
      if(typeof variables === 'function'){
        let serverVariables = await variables(req);
        requestData.data.variables = {
          ...requestData.data.variables,
          ...serverVariables
        }
      } else if(typeof variables === 'object'){
        requestData.data.variables = {
          ...requestData.data.variables,
          ...variables
        }
      }
    }

    try {
      const result = await zerowidthApi.process({
        ...requestData,
        functions: functions,
        on: {
          ...on,
          all: (eventType, data) => {

            // Was the original requestData in stream mode?
            if (requestData.stream) {
              clearTimeout(closeTimeout);

              if(eventsSentCounter === 0) {
                // open the SSE
                res.writeHead(200, {
                  'Content-Type': 'text/event-stream',
                  'Cache-Control': 'no-cache',
                  'Connection': 'keep-alive',
                  'X-Accel-Buffering': 'no'
                });
              }

              eventsSentCounter++;

              // if the event is complete, close the connection after 1 second
              if(eventType === 'close') {
                closeTimeout = setTimeout(() => {
                  res.end();
                }, 5000);
                return;
              }

              // if the event is open, clear the timeout in case this is a reconnection
              if(eventType === 'open') {
                clearTimeout(closeTimeout);
                if(eventsSentCounter > 1) {
                  return;
                } 
              }

              
              res.write(`event: ${eventType}\n`);
              res.write(`data: ${JSON.stringify(data)}\n\n`);

              if(useCompression) res.flush();
            }
          }
        }
      });

      if(on && on.complete && result) {
        on.complete(result);
      }

      return result;
    } catch (error) {
      console.error('API call failed:', error);

      if(on && on.error && error.response) {
        on.error(error.response.data);
      }

      throw error;
    }
  };

  try {
    const finalResult = await processApiResponse(req.body);

    if(req.body.stream){
      // do nothing, on handlers will handle the response
    } else {
      if (returnsResponse) {
        res.json(finalResult.output_data);
      } else {
        req.zerowidthResult = finalResult;
        next();
      }
    }
  } catch (error) {
    next(error);
  }
};


const historyRouteHandler = async ({req, res, next, secretKey, baseUrl, on, returnsResponse}) => {
  const { project_id, agent_id, user_id, session_id } = req.params;
  const { startAfter } = req.query;
  
  
  const zerowidthApi = new ZeroWidthApi({
    secretKey: secretKey,
    projectId: project_id,
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

export default function ZeroWidthApiExpress({ secretKey, baseUrl, on, variables, returnsResponse = true, functions, useCompression = true}) {
  const router = express.Router();

  if(useCompression){
    router.use(compression());
  }

  // POST route to process data
  router.post('/process/:project_id/:agent_id', (req, res, next) => {
    processRouteHandler({req, res, next, secretKey, baseUrl, on, variables, returnsResponse, functions, useCompression});
  });

  // GET route to retrieve history
  router.get('/history/:project_id/:agent_id/:user_id/:session_id', (req, res, next) => {
    historyRouteHandler({req, res, next, secretKey, baseUrl, on, returnsResponse});
  });

  return router;
}
