# @zerowidth/api

This package provides a simple and efficient way to interact with the ZeroWidth API. It allows you to easily make API calls to process data through agents on the ZeroWidth Workbench, where users can configure large language models (LLMs) and an ecosystem of technologies to adapt LLMs for specific applications or use cases.

## Features

- Easy to use API client for the ZeroWidth AI platform.
- Integrates with ZeroWidth's workbench for configuring and using LLMs and other models.
- Allows for stateful and stateless processing of data.

## Updates
- As of version 1.0.0 of this package, the base URL and function handling methodology now aligns with v1 of the ZeroWidth API.

## Installation

Install the package using `npm` or `yarn`:

```bash
npm install @zerowidth/api
# or
yarn add @zerowidth/api
```

## Usage

### Importing the Library

You can import the library components as follows:

```javascript
import { ZeroWidthApi } from '@zerowidth/api';
```

### Simple Examples

#### ZeroWidthApi Class

The `ZeroWidthApi` class provides methods to interact with the ZeroWidth API.

##### Basic Conversational-Input Example

```javascript
const zeroWidthApi = new ZeroWidthApi({
    secretKey: 'your-secret-key',
    projectId: 'your-project-id',
    agentId: 'your-agent-flow-id'
});

const result = await zeroWidthApi.process({
  data: { 
    messages: [
        { role: 'user', content: 'Hello' }
    ],
    variables: {
      // Optionally, add values any variables you've configured here
    }
  }
});
```

For Agent Flows with a Single-prompt input, you can pass in the prompt as a string:
```javascript
const result = await zeroWidthApi.process({
  data: { 
    prompt: "generate a report about zebras",
    variables: {
      // Optionally, add values any variables you've configured here
    }
  }
});
```

For Agent Flows with a Single-prompt input, you can pass in the prompt as a string:
```javascript
const result = await zeroWidthApi.process({
  data: { 
    prompt: "generate a report about zebras",
    variables: {
      // Optionally, add values any variables you've configured here
    }
  }
});
```

For Agent Flows that only need context variables, you can pass omit `messages` and `prompt` completely:
 ```javascript
const result = await zeroWidthApi.process({
  data: { 
    variables: {
      VALUE_A: "foo",
      OTHER_VALUE: "bar"
    }
  }
});
```


### Detailed Examples and Configuration

#### ZeroWidthApi Class

##### Constructor

The constructor initializes the ZeroWidthApi class.

```javascript
const zeroWidthApi = new ZeroWidthApi({
    secretKey: 'your-secret-key',
    projectId: 'your-project-id',
    agentId: 'your-agent-flow-id'
});
```

**Parameters:**

| Parameter   | Type   | Default                           | Description                          |
|-------------|--------|-----------------------------------|--------------------------------------|
| secretKey   | string | Required                          | The secret key for authentication.   |
| projectId  | string | Required                          | The endpoint ID.                     |
| agentId     | string | Required                          | The agent ID.                        |

##### `process`

Processes data using the specified endpoint and agent IDs.

Streaming example:
```javascript
const data = { 
    messages: [
        { role: 'user', content: 'Hello' }
    ] 
};

await zeroWidthApi.process({
    data,
    stream: true,
    on: {
        all: (eventType, data) => {
            console.log(`Event: ${eventType}`, data);
        },
        error: (error) => {
            console.error('Error event:', error);
        },
        complete: (result) => {
            console.log('Processing complete:', result);
        }
    }
});
```

**Parameters:**

| Parameter   | Type      | Default   | Description                             |
|-------------|-----------|-----------|-----------------------------------------|
| projectId  | string    | Value passed in the constructor. | The endpoint ID (optional).             |
| agentId     | string    | Value passed in the constructor. | The agent ID (optional).                |
| data        | object    | Required  | The data to process.                    |
| userId      | string    |           | The user ID for stateful processing.    |
| sessionId   | string    |           | The session ID for stateful processing. |
| stateful    | boolean   | false     | Whether the processing is stateful.     |
| verbose     | boolean   | false     | Whether to enable verbose output.       |
| tools       | object    |           | Tools for processing.                   |
| stream      | boolean   | false     | Whether to enable streaming responses.  |
| on          | object    |           | Event handlers for streaming.           |

##### `getHistory`

Retrieves the history for a specific session.

```javascript
const history = await zeroWidthApi.getHistory({
    userId: 'user-id',
    sessionId: 'session-id'
});
```

**Parameters:**

| Parameter   | Type      | Default   | Description                             |
|-------------|-----------|-----------|-----------------------------------------|
| projectId  | string    | Value passed in the constructor. | The endpoint ID (optional).             |
| agentId     | string    | Value passed in the constructor. | The agent ID (optional).                |
| userId      | string    | Required  | The user ID.                            |
| sessionId   | string    | Required  | The session ID.                         |
| startAfter  | string    |           | Start history retrieval after this point (optional). |


##### `report`

Submits a report for a specific session.

```javascript
const result = await zeroWidthApi.report({
    type: 'positive',
    category: 'accuracy',
    userId: 'user-id',
    sessionId: 'session-id',
    details: 'Detailed feedback or report text here',
    data: { /* Optional JSON data */ }
});
```

**Parameters:**

| Parameter   | Type      | Default   | Description                             |
|-------------|-----------|-----------|-----------------------------------------|
| endpointId  | string    | Value passed in the constructor. | The endpoint ID (optional).             |
| agentId     | string    | Value passed in the constructor. | The agent ID (optional).                |
| type        | string    | Required  | The type of the report (e.g., 'positive', 'negative', 'neutral'). |
| category    | string    | Required  | The category of the report (e.g., 'accuracy', 'hallucination').   |
| userId      | string    |           | The user ID (optional).                            |
| sessionId   | string    |           | The session ID (optional).                         |
| details     | string    |           | Additional details provided by the user (optional, max 500 characters). |
| data        | object    |           | Optional JSON object containing the detailed API response.               |


### Automatic Function Calling

For agents that have been configured in the workbench with one or more functions, an additional `functions` object can be passed to the `process` method, enabling this package to automatically call enabled functions when an API response requests to. This package will then automatically pass the results of the function call back into the ZeroWidth API for processing. 

This makes it extremely easy to connect your own databases or other integrations without having to manually handle the process -> function -> process loop on your own.

Functions are automatically checked for a returned promise - determining if they should be called with async/await or synchronously. Any function called that does not have an associated declaration on this object will result in a standard tool message response, for you to manually handle the reprocessing loop.

```javascript
import { ZeroWidthApi } from '@zerowidth/api';

// Example function that may live somewhere else in your code
const myFunction = ({a, b}) => { return a + b; };

const zeroWidthApi = new ZeroWidthApi({
  secretKey: 'your-secret-key',
  projectId: 'your-project-id',
  agentId: 'your-agent-flow-id',
});

const response = await zeroWidthApi.process({
  data: {
    messages: [
      {
        role: 'user',
        content: 'How are sales this month?'
      }
    ],
  },
  functions: {
    myFunction: myFunction, // Giving the agent the ability to call this function
    querySalesDB: async (args) => { 
      // asynchronous functions are supported

      setTimeout(() => {
        return '$999';
      }, 1000);
    },
  }
  // ...other options
});

console.log(response);
```

### ZeroWidthApiExpress Middleware

The `ZeroWidthApiExpress` middleware integrates ZeroWidth API with Express.js for creating simple server-side proxies to enable the front end of your application to determine the request logic, while keeping the Secret Key safely stored on your server.

#### Initialization

```javascript
import express from 'express';
import ZeroWidthApiExpress from '@zerowidth/api';

const app = express();

const zeroWidthApiExpress = ZeroWidthApiExpress({
  secretKey: 'your-secret-key',
  on: {
    complete: (result) => {
      console.log('Request complete:', result);
    },
    error: (error) => {
      console.error('Request error:', error);
    }
  },
  variables: async (req) => {
    // Optional function for adding server-side variables to the request
    
    return {
      // Additional variables to include in every request
    };
  },
  functions: {
    // Optional dictionary of functions that have been configured for this agent to enable automatic server-side calling & response
  }
});

app.use('/api/0w-proxy', zeroWidthApiExpress);

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
```

**Parameters:**

| Parameter       | Type     | Default                          | Description                             |
|-----------------|----------|----------------------------------|-----------------------------------------|
| secretKey       | string   | Required                         | The secret key for authentication.      |
| on              | object   |                                  | Event handlers for processing & streaming.          |
| variables       | function |                                  | Variables to include in every request.  |
| returnsResponse | boolean  | true                             | Whether the middleware returns responses directly. If set to false, the output from the ZeroWidth API will be set on `req.zerowidthResult` and the `next()` element in your configured express route will be called for custom handling. |
| functions           | object   |                                  |  For automatic function calling. |

#### Routes

The middleware provides two main routes, which are automatically linked and leveraged by @zerowidth/react-api-provider if developing a React-based front-end.

- `POST /process/:endpoint_id/:agent_id`: Processes data and optionally handles streaming responses.
- `GET /history/:endpoint_id/:agent_id/:user_id/:session_id`: Retrieves session history.

---

## Handling Streaming Responses with SSEs

The ZeroWidth API supports streaming responses using Server-Sent Events (SSEs). This allows you to receive real-time updates from the API as events occur. To handle streaming responses, enable the `stream` option in the `process` method or request body, and provide event handlers in the `on` option.

#### Example with Streaming

```javascript
const zeroWidthApi = new ZeroWidthApi({
  secretKey: 'your-secret-key',
  projectId: 'your-project-id',
  agentId: 'your-agent-flow-id'
});

const data = {
  messages: [
    { role: 'user', content: 'Hello' }
  ]
};

await zeroWidthApi.process({
  data: data,
  stream: true,
  on: {
    all: (eventType, data) => {
      console.log(`Event: ${eventType}`, data);
    },
    error: (error) => {
      console.error('Error event:', error);
    },
    complete: (result) => {
      console.log('Processing complete:', result);
    }
  }
});
```

In this example, the `stream` option is set to `true`, and various event handlers are provided in the `on` option to handle different events:

- `all`: Handles all events and logs them.
- `error`: Handles error events.
- `complete`: Handles the completion of the streaming process.

#### Event Types

The event handlers can handle different types of events emitted during the streaming process. Here are some common event types:

- `open`: Emitted when the stream is opened.
- `message`: Emitted when a message is received.
- `error`: Emitted when an error occurs.
- `complete`: Emitted when the streaming process is complete.
- `close`: Emitted when the stream is closed.

#### Using Streaming in Express.js

You can also handle streaming responses in an Express.js application using the `ZeroWidthApiExpress` middleware. Here, the event handlers offer additional debugging options, while the actual SSEs are automatically forwarded to the client.

```javascript
import express from 'express';
import ZeroWidthApiExpress from '@zerowidth/api';

const app = express();

const zeroWidthApiExpress = ZeroWidthApiExpress({
  secretKey: 'your-secret-key',
  on: {
    all: (eventType, data) => {
      console.log(`Event: ${eventType}`, data);
    },
    error: (error) => {
      console.error('Error event:', error);
    },
    complete: (result) => {
      console.log('Processing complete:', result);
    }
  }
});

app.use('/api/0w-proxy', zeroWidthApiExpress);

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
```

In this setup, the middleware is configured to handle streaming responses, and the same event handlers are used to log events and handle errors and completion.

---

## License

This project is licensed under the MIT License.

## Contributing

Contributions to the `@zerowidth/api` package are welcome. Please follow the steps below to contribute:

1. Fork the repository and create your feature branch: `git checkout -b my-new-feature`.
2. Commit your changes: `git commit -am 'Add some feature'`.
3. Push to the branch: `git push origin my-new-feature`.
4. Submit a pull request.

## Support

If you have any questions or need help integrating the `@zerowidth/api` package, please open an issue in the GitHub repository or reach out to us directly via our website: [zerowidth.ai](https://zerowidth.ai)