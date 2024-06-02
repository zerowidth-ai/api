import config from './config.json' assert { type: 'json' };
import { ZeroWidthApi } from '../dist/esm/main.js';

async function main() {
  const api = new ZeroWidthApi({
    secretKey: config.SECRET_KEY,
    endpointId: config.ENDPOINT_ID,
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

  // response.on('open', () => {
  //   console.log('Streaming connection opened');
  // });

  // response.on('close', () => {
  //   console.log('Streaming connection closed');
  // });

  // response.on('progress', (data) => {
  //   console.log('Streaming progress:', data);
  // });

  // response.on('complete', (data) => {
  //   console.log('Streaming complete:', JSON.stringify(data.output_data,null,2));
  // });

  // response.on('error', (error) => {
  //   console.error('Streaming error:', error);
  // });

  // response.on('outputProgress', (data) => {
  //   console.log('Streaming output', data);
  // });

}

main();
