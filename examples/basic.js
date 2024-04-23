import config from './config.json' assert { type: 'json' };

import { ZeroWidthApi } from '../dist/esm/main.js';

async function main() {
  const api = new ZeroWidthApi({
    secretKey: config.SECRET_KEY,
    endpointId: config.ENDPOINT_ID,
    agentId: config.AGENT_ID,
  });

  let result = await api.process({
    verbose: true,
    data: {
      messages: [
        {
          role: "user",
          content: "hi"
        }
      ]
    }
  })

  console.log(JSON.stringify(result, null, 2));
  
}

main();
