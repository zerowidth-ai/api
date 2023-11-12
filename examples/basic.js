import config from './config.json' assert { type: 'json' };

import ZeroWidthApi from '../dist/main.js';

async function main() {
  const api = new ZeroWidthApi({
    secretKey: config.SECRET_KEY,
    appId: config.APP_ID,
    intelligenceId: config.INTELLIGENCE_ID,
  });

  let result = await api.process({
    variables: {
      A: "red",
      B: "blue"
    }
  })

  console.log(result);
}

main();
