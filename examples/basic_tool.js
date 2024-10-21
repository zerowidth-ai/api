import config from './config.json' assert { type: 'json' };

import { ZeroWidthApi } from '../dist/esm/main.js';

async function main() {
  const api = new ZeroWidthApi({
    secretKey: config.SECRET_KEY,
    projectId: config.PROJECT_ID,
    agentId: config.AGENT_ID,
  });

  let result = await api.process({
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
        console.log('The test function was called', args);
        return '200';
      }
    }
  })

  console.log(JSON.stringify(result, null, 2));
}

main();
