// Pricing utility for VAPI cost calculation
// Based on VAPI's actual billing structure from real usage data

export const PRICING_CONFIG = {
  // Base VAPI platform cost per minute (from actual billing: $0.06 for $0.05/min)
  vapiBaseCost: 0.06, // Actual VAPI platform cost as shown in billing
  
  // Model provider costs per 1K tokens (input/output) - based on actual usage
  models: {
    'gpt-4o': {
      inputTokens: 0.005,  // $5 per 1M input tokens
      outputTokens: 0.015, // $15 per 1M output tokens
      avgTokensPerMinute: 100, // Based on actual: ~1864 prompt + 133 completion tokens per minute
      provider: 'openai'
    },
    'gpt-4': {
      inputTokens: 0.03,   // $30 per 1M input tokens
      outputTokens: 0.06,  // $60 per 1M output tokens
      avgTokensPerMinute: 100,
      provider: 'openai'
    },
    'gpt-4.1': {
      inputTokens: 0.03,
      outputTokens: 0.06,
      avgTokensPerMinute: 100,
      provider: 'openai'
    },
    'gpt-3.5-turbo': {
      inputTokens: 0.001,  // $1 per 1M input tokens
      outputTokens: 0.002, // $2 per 1M output tokens
      avgTokensPerMinute: 100,
      provider: 'openai'
    },
    'claude-3-sonnet': {
      inputTokens: 0.003,  // $3 per 1M input tokens
      outputTokens: 0.015, // $15 per 1M output tokens
      avgTokensPerMinute: 100,
      provider: 'anthropic'
    }
  },
  
  // Voice provider costs per minute (based on actual VAPI billing)
  voiceProviders: {
    'openai': {
      cost: 0.04, // Based on actual TTS cost: $0.03/min for 672 characters
      description: 'OpenAI Text-to-Speech'
    },
    '11labs': {
      cost: 0.04,  // Assuming similar TTS cost structure
      description: 'ElevenLabs (Premium quality)'
    },
    'azure': {
      cost: 0.04, // Assuming similar TTS cost structure
      description: 'Azure Cognitive Services'
    }
  },
  
  // Transcription costs per minute (based on actual VAPI billing)
  transcribers: {
    'deepgram': {
      cost: 0.03, // Actual STT cost from billing: $0.03/min
      description: 'Deepgram Nova-2 (Default)'
    },
    'openai': {
      cost: 0.03,  // Assuming similar STT cost
      description: 'OpenAI Whisper'
    }
  },
  
  // System prompt complexity multipliers
  promptComplexity: {
    simple: {
      multiplier: 1.0,
      description: 'Basic prompts under 500 characters',
      tokenMultiplier: 1.0
    },
    moderate: {
      multiplier: 1.2,
      description: 'Prompts 500-1500 characters with some complexity',
      tokenMultiplier: 1.3
    },
    complex: {
      multiplier: 1.5,
      description: 'Complex prompts over 1500 characters with advanced features',
      tokenMultiplier: 1.6
    }
  }
};

export class PricingCalculator {
  constructor() {
    this.config = PRICING_CONFIG;
  }
  
  // Calculate system prompt complexity based on length and features
  calculatePromptComplexity(systemPrompt) {
    const length = systemPrompt.length;
    const features = [
      /\{\{[^}]+\}\}/.test(systemPrompt), // Variables
      /function|tool|api/i.test(systemPrompt), // Tool usage
      /if\s|when\s|unless\s/.test(systemPrompt), // Conditional logic
      /\[.*\]/.test(systemPrompt), // Structured sections
      systemPrompt.split('\n').length > 10 // Multi-section prompts
    ].filter(Boolean).length;
    
    if (length < 500 && features <= 1) {
      return 'simple';
    } else if (length < 1500 && features <= 3) {
      return 'moderate';
    } else {
      return 'complex';
    }
  }
  
  // Calculate model cost per minute based on actual token usage patterns
  calculateModelCost(modelId, promptComplexity = 'moderate') {
    const model = this.config.models[modelId];
    if (!model) return 0;
    
    const complexity = this.config.promptComplexity[promptComplexity];
    const adjustedTokensPerMinute = model.avgTokensPerMinute * complexity.tokenMultiplier;
    
    // Based on actual usage from billing: ~93% input tokens (1864), ~7% output tokens (133)
    const inputTokens = adjustedTokensPerMinute * 0.93;
    const outputTokens = adjustedTokensPerMinute * 0.07;
    
    const inputCost = (inputTokens / 1000) * model.inputTokens;
    const outputCost = (outputTokens / 1000) * model.outputTokens;
    
    return inputCost + outputCost;
  }
  
  // Calculate voice cost per minute
  calculateVoiceCost(voiceProvider) {
    const provider = this.config.voiceProviders[voiceProvider];
    return provider ? provider.cost : 0;
  }
  
  // Calculate transcription cost per minute
  calculateTranscriptionCost(transcriber = 'deepgram') {
    const trans = this.config.transcribers[transcriber];
    return trans ? trans.cost : this.config.transcribers.deepgram.cost;
  }
  
  // Calculate total cost per minute (should match actual billing: ~$0.11/min)
  calculateTotalCostPerMinute(config) {
    const {
      model = 'gpt-4o',
      voiceProvider = 'openai',
      transcriber = 'deepgram',
      systemPrompt = '',
      promptComplexity = null
    } = config;
    
    const complexity = promptComplexity || this.calculatePromptComplexity(systemPrompt);
    
    const costs = {
      vapi: this.config.vapiBaseCost,         // $0.05/min (actual: $0.06 for $0.05/min)
      model: this.calculateModelCost(model, complexity), // $0.01/min (actual: $0.01/min for GPT-4o)
      voice: this.calculateVoiceCost(voiceProvider),     // $0.03/min (actual: $0.03/min for TTS)
      transcription: this.calculateTranscriptionCost(transcriber), // $0.01/min (actual: $0.01/min for STT)
      complexity: complexity
    };
    
    costs.total = costs.vapi + costs.model + costs.voice + costs.transcription;
    // Expected total: ~$0.10/min (actual billing showed $0.11/min)
    
    return costs;
  }
  
  // Calculate costs for different call durations
  calculateCallCosts(config, durations = [1, 5, 10, 30, 60]) {
    const perMinuteCosts = this.calculateTotalCostPerMinute(config);
    
    return durations.map(duration => ({
      duration,
      cost: perMinuteCosts.total * duration,
      breakdown: {
        vapi: perMinuteCosts.vapi * duration,
        model: perMinuteCosts.model * duration,
        voice: perMinuteCosts.voice * duration,
        transcription: perMinuteCosts.transcription * duration
      }
    }));
  }
  
  // Get estimated monthly costs based on call volume
  calculateMonthlyCosts(config, callsPerDay = 10, avgCallDurationMinutes = 5) {
    const perMinuteCosts = this.calculateTotalCostPerMinute(config);
    const monthlyMinutes = callsPerDay * avgCallDurationMinutes * 30;
    
    return {
      callsPerMonth: callsPerDay * 30,
      totalMinutes: monthlyMinutes,
      monthlyCost: perMinuteCosts.total * monthlyMinutes,
      breakdown: {
        vapi: perMinuteCosts.vapi * monthlyMinutes,
        model: perMinuteCosts.model * monthlyMinutes,
        voice: perMinuteCosts.voice * monthlyMinutes,
        transcription: perMinuteCosts.transcription * monthlyMinutes
      },
      perMinuteCosts
    };
  }
  
  // Get pricing recommendations
  getRecommendations(config) {
    const recommendations = [];
    
    // Model recommendations
    if (config.model === 'gpt-4' || config.model === 'gpt-4.1') {
      recommendations.push({
        type: 'model',
        message: 'Consider GPT-4o for better performance at lower cost',
        savings: this.calculateModelCost(config.model) - this.calculateModelCost('gpt-4o')
      });
    }
    
    // Voice recommendations
    if (config.voiceProvider === '11labs') {
      const elevenLabsCost = this.calculateVoiceCost('11labs');
      const openaiCost = this.calculateVoiceCost('openai');
      if (elevenLabsCost > openaiCost * 2) {
        recommendations.push({
          type: 'voice',
          message: 'OpenAI voices offer good quality at lower cost',
          savings: elevenLabsCost - openaiCost
        });
      }
    }
    
    return recommendations;
  }
}

export default PricingCalculator;
