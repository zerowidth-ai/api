This package is currently in beta and versions may contain breaking changes. 

All v.0.3.0-beta versions include a shift from ZeroWidth's alpha API to the new beta API. Major changes include a different naming convention (endpoints and agents) and required account credit for API usage. For alpha testers, the alpha API will remain live for a short while to allow time to migrate.


# @zerowidth/api

This package provides a simple and efficient way to interact with the ZeroWidth API. It allows you to easily make API calls to process data through agents on the ZeroWidth Workbench, where users can configure large language models (LLMs) and an ecosystem of technologies to adapt LLMs for specific applications or use cases.

## Features

- Easy to use API client for the ZeroWidth AI platform.
- Integrates with ZeroWidth's workbench for configuring and using LLMs and other models.
- Allows for stateful and stateless processing of data.

## Installation

Install the package using `npm` or `yarn`:

```bash
npm install @zerowidth/api
# or
yarn add @zerowidth/api
```

## Usage

First, you need to create an instance of `ZeroWidthApi` with your secret key, endpoint collection ID, and agent ID.

```javascript
import { ZeroWidthApi } from '@zerowidth/api';

const api = new ZeroWidthApi({
  secretKey: 'your-secret-key',
  endpointId: 'your-endpoint-id',
  agentId: 'your-agent-id',
});

const response = await api.process({
  data: {
    messages: [
      {
        role: 'user',
        content: 'Hello, world.'
      }
    ],
    variables: {
      NAME: "Jane"
    }
  }
  // ...other options
});
console.log(response);
```

## Automatic Function Calling

For agents that have been configured in the workbench with one or more Callable Functions, an additional `tools.functions` object can be passed to the `process` function, enabling this package to automatically call enabled functions when an API response requests too. This package will then automatically pass the results of the function call back into the ZeroWidth API for processing. 

This makes it extremely easy to connect your own databases or other integrations without having to manually handle the process -> function -> process loop on your own.

Functions are automatically checked for a returned promise - determining if they should be called with async/await or synchronously.


```javascript
import { ZeroWidthApi } from '@zerowidth/api';

const myFunction = ({a, b}) => { return a + b; };

const api = new ZeroWidthApi({
  secretKey: 'your-secret-key',
  endpointId: 'your-endpoint-id',
  agentId: 'your-agent-id',
});

const response = await api.process({
  data: {
    messages: [
      {
        role: 'user',
        content: 'How are sales this month?'
      }
    ],
  },
  tools: {
    functions: {
      myFunction: myFunction,
      querySalesDB: async (args) => { 
        // asynchronous functions are supported

        setTimeout(() => {
          return '$999';
        }, 1000);
        
      },
    }
  }
  // ...other options
});

console.log(response);



```

## As Express Middleware

You can use @zerowidth/api as middleware in your Express application to create a proxy endpoint for the ZeroWidth API using ES module import syntax. This is designed specifically for use hand-in-hand with @zerowidth/react-api-provider to easily develop production applications involving multiple configured LLMs.

```javascript
import express from 'express';
import { ZeroWidthApiExpress } from '@zerowidth/api';

const app = express();
app.use(express.json()); // for parsing application/json

// attach the middleware on the path that matches what you've configured in <ZeroWidthApiProvider>
app.use('/api/zerowidth-proxy', ZeroWidthApiExpress({
  secretKey: process.env.SECRET_KEY, // Your secret key for ZeroWidth API
}));

app.listen(3000, () => console.log('Server running on port 3000'));
```

You can also pass in your own `onProcess` function to monitor the full processing result and/or set `returnsResponse` to false to have the middleware store the results as `req.zerowidthResults` to be handled by your next chosen middleware.
```javascript
import express from 'express';
import { ZeroWidthApiExpress } from '@zerowidth/api';

const app = express();

app.use(express.json()); // for parsing application/json

app.use('/api/zerowidth-proxy', ZeroWidthApiExpress({
  secretKey: process.env.SECRET_KEY, // Your secret key for ZeroWidth API for the endpointId being used by your @zerowidth/react-api-provider
  onProcess: (result) => { // optional function that doesn't interupt middleware flow
    console.log(result);
  }, 
  returnsResponse: false // Set to false if you want to call next() instead of letting the middleware automatically return res.json(result.output_data)
}), (req, res, next) => {
  return res.json(req.zerowidthResult.output_data)
});

app.listen(3000, () => console.log('Server running on port 3000'));
```


## API Reference

### `new ZeroWidthApi(config)`

Creates a new `ZeroWidthApi` instance.

- `config`: An object containing the following properties:
  - `secretKey`: Your API secret key.
  - `endpointId`: Your application ID on the ZeroWidth platform.
  - `agentId`: The ID of the installed agent you want to use.

### `api.process(options)`

Processes data through the specified agent.

- `options`: An object containing the following properties:
  - `messages`: An array of message objects (for stateless processing).
  - `message`: A single message object (for stateful processing).
  - `variables`: Any variables required for processing.
  - `userId`: The user's ID (required for stateful processing).
  - `sessionId`: The session ID (required for stateful processing).
  - `stateful`: A boolean indicating whether the processing is stateful.
  - `verbose`: A boolean to enable verbose mode.

## Contributing

Contributions to the `@zerowidth/api` package are welcome. Please follow the steps below to contribute:

1. Fork the repository and create your feature branch: `git checkout -b my-new-feature`.
2. Commit your changes: `git commit -am 'Add some feature'`.
3. Push to the branch: `git push origin my-new-feature`.
4. Submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you have any questions or need help integrating the `@zerowidth/api` package, please open an issue in the GitHub repository or reach out to us directly via our website: [zerowidth.ai](https://zerowidth.ai)
