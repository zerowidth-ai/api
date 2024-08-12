import config from './config.json' assert { type: 'json' };

import { ZeroWidthApi } from '../dist/esm/main.js';

async function main() {
  const api = new ZeroWidthApi({
    secretKey: config.SECRET_KEY,
    projectId: config.PROJECT_ID,
    agentId: config.AGENT_ID,
  });

  let response = await api.process({
    verbose: true,
    stream: true,
    data: {
      messages: [
        {
          role: "user",
          content: "Call both test functions"
        }
      ]
    },
    tools: {
      functions: {
        serverTestFunction1: args => {
          // console.log('serverTestFunction1', args);
          return '200';
        },
        serverTestFunction2: args => {
          // console.log('serverTestFunction2', args);
          return '200';
        }
      }
    },
    on: {
      open: () => {
        console.log('Connection opened');
      },
      close: () => {
        console.log('Connection closed');
      },
      progress: (data) => {
        console.log('Progress:', data);
      },
      complete: (data) => {
        console.log('Complete:', data);
      },
      error: (error) => {
        console.error('Error:', error);
      },
      outputProgress: (data) => {
        console.log('Output', data);
      },
      tool: (data) => {
        console.log('Tool:', data);
      }
    }
  })

}

main();
