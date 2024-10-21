import config from './config.json' assert { type: 'json' };

import { ZeroWidthApi } from '../dist/esm/main.js';

async function main() {
  const api = new ZeroWidthApi({
    secretKey: config.SECRET_KEY,
    projectId: config.PROJECT_ID,
    agentId: config.AGENT_ID,
  });

  let response = await api.process({
    stream: true,
    data: {
      messages: [
        {
          role: "user",
          content: "Call the test function"
        }
      ]
    },
    functions: {
      testOne: args => {
        console.log('testOne', args);
        return '200';
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
      functionCall: (data) => {
        console.log('Function:', data);
      }
    }
  })

}

main();
