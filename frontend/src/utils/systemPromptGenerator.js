// System prompt template utility for generating VAPI-optimized prompts

export const PROMPT_TEMPLATES = {
  // Industry-specific templates
  industries: {
    'HVAC': {
      identity: 'professional HVAC service assistant',
      expertise: ['heating systems', 'cooling systems', 'air quality', 'maintenance scheduling'],
      commonTasks: ['emergency repairs', 'maintenance appointments', 'service quotes', 'system diagnostics']
    },
    'Healthcare': {
      identity: 'healthcare appointment assistant',
      expertise: ['appointment scheduling', 'patient intake', 'insurance verification', 'medical records'],
      commonTasks: ['booking appointments', 'prescription refills', 'test results', 'referrals']
    },
    'Real Estate': {
      identity: 'real estate assistant',
      expertise: ['property listings', 'market analysis', 'client qualification', 'showing coordination'],
      commonTasks: ['property inquiries', 'showing appointments', 'lead qualification', 'market updates']
    },
    'Legal Services': {
      identity: 'legal practice assistant',
      expertise: ['case management', 'client intake', 'document preparation', 'court scheduling'],
      commonTasks: ['consultation scheduling', 'case status updates', 'document requests', 'billing inquiries']
    },
    'Customer Support': {
      identity: 'customer support specialist',
      expertise: ['issue resolution', 'product knowledge', 'account management', 'technical support'],
      commonTasks: ['troubleshooting', 'order status', 'returns and refunds', 'account updates']
    },
    'Sales': {
      identity: 'sales assistant',
      expertise: ['lead qualification', 'product demos', 'pricing information', 'follow-up scheduling'],
      commonTasks: ['lead qualification', 'demo scheduling', 'quote generation', 'pipeline management']
    }
  },

  // Communication styles
  styles: {
    professional: {
      tone: 'professional and courteous',
      characteristics: ['clear communication', 'respectful language', 'efficient interactions']
    },
    friendly: {
      tone: 'warm and approachable',
      characteristics: ['conversational style', 'empathetic responses', 'positive energy']
    },
    consultative: {
      tone: 'consultative and helpful',
      characteristics: ['asking clarifying questions', 'providing guidance', 'solution-focused']
    },
    authoritative: {
      tone: 'knowledgeable and confident',
      characteristics: ['expertise demonstration', 'clear directives', 'trustworthy guidance']
    }
  },

  // Common conversation patterns
  patterns: {
    appointment_booking: {
      flow: ['greeting', 'service_inquiry', 'availability_check', 'confirmation', 'follow_up'],
      variables: ['{{service_type}}', '{{preferred_date}}', '{{contact_info}}', '{{appointment_time}}']
    },
    lead_qualification: {
      flow: ['introduction', 'needs_assessment', 'qualification', 'next_steps', 'scheduling'],
      variables: ['{{company_name}}', '{{contact_person}}', '{{budget_range}}', '{{timeline}}']
    },
    customer_support: {
      flow: ['issue_identification', 'account_verification', 'troubleshooting', 'resolution', 'follow_up'],
      variables: ['{{issue_type}}', '{{account_number}}', '{{resolution_steps}}', '{{case_number}}']
    }
  }
};

export class SystemPromptGenerator {
  constructor() {
    this.templates = PROMPT_TEMPLATES;
  }

  // Generate a complete system prompt
  generateSystemPrompt(config) {
    const {
      agentName = 'AI Assistant',
      industry = 'General',
      role = 'Assistant',
      businessName = 'the company',
      communicationStyle = 'professional',
      primaryTasks = [],
      firstMessage = '',
      customInstructions = '',
      includeVariables = true,
      includeErrorHandling = true
    } = config;

    const industryTemplate = this.templates.industries[industry] || this.templates.industries['Customer Support'];
    const styleTemplate = this.templates.styles[communicationStyle] || this.templates.styles.professional;

    let prompt = this.buildPromptSections({
      agentName,
      industry,
      role,
      businessName,
      industryTemplate,
      styleTemplate,
      primaryTasks,
      firstMessage,
      customInstructions,
      includeVariables,
      includeErrorHandling
    });

    return prompt;
  }

  // Build individual sections of the prompt
  buildPromptSections(config) {
    const sections = [];

    // Identity & Role section
    sections.push(this.buildIdentitySection(config));

    // Communication Style section
    sections.push(this.buildCommunicationSection(config));

    // Response Guidelines section
    sections.push(this.buildResponseGuidelines(config));

    // Task-specific instructions
    if (config.primaryTasks.length > 0) {
      sections.push(this.buildTaskSection(config));
    }

    // Variable capture (if enabled)
    if (config.includeVariables) {
      sections.push(this.buildVariableSection(config));
    }

    // First message
    if (config.firstMessage) {
      sections.push(this.buildFirstMessageSection(config));
    }

    // Error handling (if enabled)
    if (config.includeErrorHandling) {
      sections.push(this.buildErrorHandlingSection(config));
    }

    // Custom instructions
    if (config.customInstructions) {
      sections.push(`## [Custom Instructions]\n\n${config.customInstructions}`);
    }

    return sections.join('\n\n');
  }

  buildIdentitySection(config) {
    const { agentName, businessName, industryTemplate, role } = config;
    
    return `## [Identity & Role]

You are ${agentName}, a ${industryTemplate.identity} for ${businessName}. Your role is to serve as a ${role.toLowerCase()} that handles customer interactions with expertise in ${industryTemplate.expertise.join(', ')}.

You are knowledgeable, helpful, and focused on providing excellent service while efficiently gathering necessary information and guiding customers toward appropriate solutions.`;
  }

  buildCommunicationSection(config) {
    const { styleTemplate, agentName } = config;
    
    return `## [Communication Style]

- **Tone**: ${styleTemplate.tone}
- **Approach**: ${styleTemplate.characteristics.join(', ')}
- **Voice Optimization**: Keep responses concise and natural for voice conversation
- **Clarity**: Present dates, times, and numbers clearly for speech (e.g., "July twenty-eighth", "three thirty PM")
- **Engagement**: Use natural acknowledgments and show genuine interest in helping
- **Professional Boundaries**: Stay focused on your role and expertise area`;
  }

  buildResponseGuidelines(config) {
    return `## [Response Guidelines]

- Keep responses concise yet complete for voice conversations (under 150 words typically)
- Use natural speech patterns and avoid overly technical jargon
- Ask clarifying questions when needed to better assist the customer
- Provide clear next steps and actionable information
- Express appreciation for the customer's time and patience
- If you need to use tools or functions, do so seamlessly without mentioning technical details
- Always aim to resolve issues or guide toward resolution in the most efficient way`;
  }

  buildTaskSection(config) {
    const { primaryTasks, industryTemplate } = config;
    
    return `## [Primary Responsibilities]

Your main tasks include:

${primaryTasks.map(task => `- **${task}**: ${this.getTaskDescription(task, industryTemplate)}`).join('\n')}

${industryTemplate.commonTasks ? `\nCommon scenarios you handle:\n${industryTemplate.commonTasks.map(task => `- ${task}`).join('\n')}` : ''}`;
  }

  buildVariableSection(config) {
    const { industry } = config;
    const pattern = this.getIndustryPattern(industry);
    
    return `## [Information Capture]

During conversations, capture these key variables when relevant:

${pattern.variables ? pattern.variables.map(variable => `- \`${variable}\``).join('\n') : `- \`{{customer_name}}\`
- \`{{contact_method}}\`
- \`{{service_type}}\`
- \`{{preferred_date}}\`
- \`{{preferred_time}}\`
- \`{{additional_notes}}\``}

Store information naturally during the conversation flow without making it feel like a form-filling exercise.`;
  }

  buildFirstMessageSection(config) {
    const { firstMessage, agentName, businessName } = config;
    
    return `## [First Message]

"${firstMessage || `Hello! I'm ${agentName} from ${businessName}. How can I help you today?`}"`;
  }

  buildErrorHandlingSection(config) {
    return `## [Error Handling & Edge Cases]

- **Unclear requests**: "I want to make sure I understand correctly. Could you tell me more about [specific aspect]?"
- **Outside expertise**: "That's a great question, but it's outside my area. Let me connect you with someone who can help."
- **Technical issues**: "I'm experiencing a brief delay. Thank you for your patience while I get that information for you."
- **Multiple requests**: Prioritize and address one item at a time: "Let me help you with [first item] first, then we'll handle [second item]."
- **Escalation needed**: "I'd like to connect you with a specialist who can provide more detailed assistance with this."`;
  }

  // Helper methods
  getTaskDescription(task, industryTemplate) {
    const descriptions = {
      'appointment_booking': 'Schedule and manage appointments efficiently',
      'lead_qualification': 'Assess customer needs and determine next steps',
      'customer_support': 'Resolve issues and provide helpful guidance',
      'information_gathering': 'Collect necessary details for proper service',
      'follow_up': 'Maintain contact and ensure customer satisfaction'
    };
    
    return descriptions[task] || 'Handle customer inquiries effectively';
  }

  getIndustryPattern(industry) {
    const patterns = {
      'HVAC': this.templates.patterns.appointment_booking,
      'Healthcare': this.templates.patterns.appointment_booking,
      'Real Estate': this.templates.patterns.lead_qualification,
      'Legal Services': this.templates.patterns.appointment_booking,
      'Sales': this.templates.patterns.lead_qualification,
      'Customer Support': this.templates.patterns.customer_support
    };
    
    return patterns[industry] || this.templates.patterns.appointment_booking;
  }

  // Generate simple prompt for quick setup
  generateSimplePrompt(name, industry, businessName, primaryFunction) {
    return this.generateSystemPrompt({
      agentName: name,
      industry,
      businessName,
      role: 'Assistant',
      communicationStyle: 'professional',
      primaryTasks: [primaryFunction],
      includeVariables: true,
      includeErrorHandling: true
    });
  }

  // Generate first message suggestions
  generateFirstMessageSuggestions(industry, businessName, agentName) {
    const suggestions = {
      'HVAC': [
        `Hi! I'm ${agentName} from ${businessName}. Are you experiencing an HVAC issue, or would you like to schedule maintenance?`,
        `Hello! This is ${agentName} with ${businessName}. How can I help with your heating and cooling needs today?`,
        `Hi there! I'm ${agentName} from ${businessName}. Are you calling about service, maintenance, or do you have questions about a new system?`
      ],
      'Healthcare': [
        `Hello! I'm ${agentName} from ${businessName}. Are you calling to schedule an appointment or do you have questions about your care?`,
        `Hi! This is ${agentName} with ${businessName}. How can I assist you with your healthcare needs today?`,
        `Hello! I'm ${agentName} from ${businessName}. Are you a current patient calling about an appointment, or are you new to our practice?`
      ],
      'Real Estate': [
        `Hi! I'm ${agentName} with ${businessName}. Are you interested in buying, selling, or learning about the market?`,
        `Hello! This is ${agentName} from ${businessName}. How can I help with your real estate needs today?`,
        `Hi there! I'm ${agentName} with ${businessName}. Are you looking for information about a specific property or general market guidance?`
      ],
      'General': [
        `Hello! I'm ${agentName} from ${businessName}. How can I help you today?`,
        `Hi! This is ${agentName} with ${businessName}. What can I assist you with?`,
        `Hello! I'm ${agentName} from ${businessName}. What brings you to us today?`
      ]
    };

    return suggestions[industry] || suggestions['General'];
  }
}

export default SystemPromptGenerator;
