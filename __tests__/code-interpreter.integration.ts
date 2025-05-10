import { ThiriClient } from '../src';
import * as fs from 'fs';
import * as path from 'path';

describe('Code Interpreter Integration Tests', () => {
  let client: ThiriClient;
  
  beforeAll(() => {
    // Get API key from environment variable
    const apiKey = process.env.THIRI_API_KEY;
    if (!apiKey) {
      throw new Error('THIRI_API_KEY environment variable is required for integration tests');
    }
    client = new ThiriClient(apiKey);
  });
  
  test('should run Python code and generate a matplotlib chart', async () => {
    // Create a sandbox
    console.log('Creating sandbox with API key:', process.env.THIRI_API_KEY ? 'API key is set' : 'API key is NOT set');
    const sandbox = await client.createSandbox();
    console.log('Sandbox created:', sandbox);
    expect(sandbox).toBeDefined();
    expect(sandbox.id).toBeDefined();
    
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
    expect(execution).toBeDefined();
    expect(execution.id).toBeDefined();
    
    // Wait for execution to complete (simple approach)
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Download the generated image
    const imageBase64 = await execution.downloadFile('output.png');
    expect(imageBase64).toBeDefined();
    
    // Optional: Save the image locally for verification
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const imagePath = path.join(outputDir, 'test-output.png');
    fs.writeFileSync(imagePath, Buffer.from(imageBase64, 'base64'));
    
    console.log(`Image saved to ${imagePath}`);
    
    // Verify the image was saved
    expect(fs.existsSync(imagePath)).toBe(true);
  }, 30000); // 30 second timeout for this test
});
