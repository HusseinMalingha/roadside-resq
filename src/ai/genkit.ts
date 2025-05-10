import {genkit, type Genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

let genkitInstance: Genkit | null = null;

try {
  genkitInstance = genkit({
    plugins: [googleAI()],
    model: 'googleai/gemini-2.0-flash',
  });
  console.log("Genkit initialized successfully.");
} catch (error) {
  console.error("Error initializing Genkit:", error);
  // genkitInstance remains null, flows attempting to use it will need to handle this.
  // This prevents the server from crashing if Genkit fails to initialize (e.g. missing API key).
}

export const ai = genkitInstance;

