This package is currently in beta.

# @zerowidth/api

This package provides a simple and efficient way to interact with the ZeroWidth API. It allows you to easily make API calls to process data through app-installed intelligence on the ZeroWidth Workbench, where users can configure large language models (LLMs) and an ecosystem of technologies to adapt LLMs for specific applications or use cases.

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

First, you need to create an instance of `ZeroWidthAPI` with your secret key, app ID, and intelligence ID.

```javascript
const ZeroWidthAPI = require('@zerowidth/api');

const api = new ZeroWidthAPI({
  secretKey: 'your-secret-key',
  appId: 'your-app-id',
  intelligenceId: 'your-intelligence-id',
});

const response = await api.process({
  messages: [
    {
      role: 'user',
      content: 'Hello, world.'
    }
  ],
  // ...other options
});
console.log(response);
```

## API Reference

### `new ZeroWidthAPI(config)`

Creates a new `ZeroWidthAPI` instance.

- `config`: An object containing the following properties:
  - `secretKey`: Your API secret key.
  - `appId`: Your application ID on the ZeroWidth platform.
  - `intelligenceId`: The ID of the installed intelligence you want to use.

### `api.process(options)`

Processes data through the specified intelligence.

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
