import config from './config.json' assert { type: 'json' };
import { ZeroWidthApi } from '../dist/esm/main.js';

async function main() {
  const api = new ZeroWidthApi({
    secretKey: config.SECRET_KEY,
    projectId: config.PROJECT_ID,
    agentId: config.AGENT_ID,
  });

  await api.process({
    stream: true,
    verbose: false,
    data: {
      messages: [
        {
          role: "user",
          content: "Don't call any functions, write a poem instead"
        }
      ]
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
      }
    }
  });


}

main();
