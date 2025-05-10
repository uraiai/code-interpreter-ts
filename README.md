# Thiri Client

A TypeScript client for interacting with the Thiri Code Interpreter API.

## Installation

```bash
npm install @uraiai/code-interpreter
```

## Usage

```typescript
import { ThiriClient } from '@uraiai/code-interpreter';

async function example() {
  // Initialize with your API key
  const apiKey = process.env.THIRI_API_KEY || 'your-api-key';
  const client = new ThiriClient(apiKey);
  
  // Create a sandbox environment
  const sandbox = await client.createSandbox();
  
  // Run Python code in the sandbox
  const execution = await sandbox.runCode('print("Hello from Python!")');
  
  // Wait for execution to complete
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Access stdout logs
  console.log(execution.logs.stdout.join(''));
}

example().catch(console.error);
```

### Example: Generate a matplotlib chart

```typescript
import { ThiriClient } from '@uraiai/code-interpreter';
import * as fs from 'fs';

async function generateChart() {
  // Initialize client with API key
  const apiKey = process.env.THIRI_API_KEY || 'your-api-key';
  const client = new ThiriClient(apiKey);
  
  // Create a sandbox
  const sandbox = await client.createSandbox();
  
  // Python code to generate a matplotlib chart
  const pythonCode = `
import matplotlib.pyplot as plt
import numpy as np

# Generate data
x = np.linspace(0, 10, 100)
y = np.sin(x)

# Create plot
plt.figure(figsize=(8, 6))
plt.plot(x, y, 'b-', linewidth=2)
plt.title('Sine Wave')
plt.xlabel('X axis')
plt.ylabel('Y axis')
plt.grid(True)

# Save the figure
plt.savefig('output.png')
print('Chart generated and saved as output.png')
`;
  
  // Run the code
  const execution = await sandbox.runCode(pythonCode);
  
  // Wait for execution to complete
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Download the generated image (returns base64 string)
  const imageBase64 = await execution.downloadFile('output.png');
  
  // Save the image locally
  fs.writeFileSync('sine-wave.png', Buffer.from(imageBase64, 'base64'));
  console.log('Image saved to sine-wave.png');
}

generateChart().catch(console.error);
```

## API

### ThiriClient

- `constructor(apiKey: string)`: Create a new client with the given API key
- `createSandbox()`: Create a new sandbox environment for running Python code

### Sandbox

- `runCode(code: string)`: Run Python code in the sandbox and return an Execution object

### Execution

- `logs`: Object containing `stdout` and `stderr` arrays with execution output
- `downloadFile(path: string)`: Download a file from the execution as a base64 string

## Environment Variables

- `THIRI_API_BASE`: Optional. Override the default API base URL (default: https://admin.thiri.dev/api)
- `THIRI_API_KEY`: Optional. Set your API key instead of passing it to the constructor
