import { PricingCalculator } from './src/utils/pricingCalculator.js';

const calculator = new PricingCalculator();
const costs = calculator.calculateTotalCostPerMinute({
  model: 'gpt-4o',
  voiceProvider: 'openai',
  transcriber: 'deepgram',
  systemPrompt: 'You are a helpful assistant'
});

console.log('Cost breakdown for 1 minute:');
console.log('VAPI Platform: $' + costs.vapi.toFixed(4));
console.log('AI Model (GPT-4o): $' + costs.model.toFixed(4));
console.log('Voice Synthesis: $' + costs.voice.toFixed(4));
console.log('Speech Recognition: $' + costs.transcription.toFixed(4));
console.log('Total: $' + costs.total.toFixed(4));
console.log('Expected: ~$0.1100 (actual billing)');
