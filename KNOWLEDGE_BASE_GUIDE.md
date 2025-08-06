# Knowledge Base Integration Guide

## Overview

EmployAI now supports uploading knowledge bases during agent creation. This feature allows you to provide your voice agents with specific information about your business, products, or services.

## Features

### Supported File Types

- `.txt` - Plain text files
- `.pdf` - PDF documents
- `.docx` - Microsoft Word documents
- `.doc` - Legacy Word documents

### File Size Limits

- Maximum file size: 10MB
- Recommended: Keep files under 5MB for optimal performance

### Integration Points

- **Agent Creation**: Upload knowledge base during the agent setup process
- **VAPI Knowledge Base**: Automatically creates knowledge bases in VAPI
- **Database Storage**: Tracks knowledge base IDs and names locally

## Usage

### Frontend (Agent Creation)

1. **Navigate to Create Agent**
2. **Fill General Information** (Step 1)
3. **Add Context** (Step 2)
4. **Upload Knowledge Base** (Step 3):
   - Enter a descriptive name for your knowledge base
   - Click "Upload" or drag and drop your file
   - Supported formats: PDF, DOCX, DOC, TXT
5. **Continue with remaining steps**

### API Usage

```javascript
// Create agent with knowledge base
const agentData = {
  name: "Customer Service Agent",
  industry: "Healthcare",
  knowledgeBaseName: "Company FAQ",
  knowledgeBaseFile: "base64EncodedFileContent",
  knowledgeBaseFileName: "company_faq.pdf",
  // ... other agent fields
};

const result = await apiService.createAgent(agentData);
```

### Backend Implementation

```python
# Knowledge base creation
@app.post("/agents")
async def create_agent(agent_data: AgentCreate):
    # Handle knowledge base creation
    knowledge_base_id = None
    if agent_data.knowledgeBaseName and agent_data.knowledgeBaseFile:
        kb_response = await create_knowledge_base(
            name=agent_data.knowledgeBaseName,
            file_content=agent_data.knowledgeBaseFile,
            file_name=agent_data.knowledgeBaseFileName
        )
        knowledge_base_id = kb_response.get("id")

    # Include knowledge base in VAPI agent
    vapi_payload = {
        "model": {
            "knowledgeBaseId": knowledge_base_id,
            # ... other model fields
        }
    }
```

## VAPI Integration

### Knowledge Base Structure

```json
{
  "name": "Company FAQ",
  "provider": "vapi",
  "id": "kb_123456789"
}
```

### Agent Model Configuration

```json
{
  "model": {
    "provider": "openai",
    "model": "gpt-4o",
    "knowledgeBaseId": "kb_123456789",
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful assistant. Use the knowledge base to answer questions accurately."
      }
    ]
  }
}
```

## Database Schema

### Agents Table (Updated)

```sql
CREATE TABLE agents (
    id TEXT PRIMARY KEY,
    vapi_id TEXT UNIQUE,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    industry TEXT NOT NULL,
    -- ... existing fields ...
    knowledge_base_id TEXT,     -- VAPI knowledge base ID
    knowledge_base_name TEXT,   -- Human-readable name
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Error Handling

### Graceful Degradation

- If knowledge base creation fails, agent creation continues
- Users are notified of knowledge base issues via logs
- Knowledge base can be added manually later via VAPI dashboard

### Frontend Error Handling

```javascript
// File upload validation
const handleFileUpload = (event) => {
  const file = event.target.files[0];

  // Size validation
  if (file.size > 10 * 1024 * 1024) {
    toast.error("File size must be less than 10MB");
    return;
  }

  // Type validation
  const allowedTypes = ["text/plain", "application/pdf", ...];
  if (!allowedTypes.includes(file.type)) {
    toast.error("Only .txt, .pdf, .docx, and .doc files are allowed");
    return;
  }
};
```

## Migration

### Database Migration

Run the migration script to add knowledge base fields:

```bash
cd backend
python migrate_knowledge_base.py
```

This adds:

- `knowledge_base_id` column to store VAPI knowledge base ID
- `knowledge_base_name` column to store human-readable name

## Best Practices

### Knowledge Base Content

1. **Clear Structure**: Organize information logically
2. **Concise Language**: Use clear, simple language
3. **Regular Updates**: Keep information current
4. **Relevant Content**: Include only information the agent needs

### File Preparation

1. **Clean Formatting**: Remove unnecessary formatting
2. **Logical Sections**: Use headers and sections
3. **FAQ Format**: Question and answer format works well
4. **Testing**: Test with sample queries after upload

### Agent Configuration

1. **System Prompt**: Instruct agent to use knowledge base
2. **Context Integration**: Reference knowledge base in responses
3. **Fallback Handling**: Define behavior when information isn't found

## Troubleshooting

### Common Issues

#### Knowledge Base Not Working

- Check if knowledge base ID was saved to database
- Verify file upload was successful
- Check VAPI dashboard for knowledge base status

#### File Upload Fails

- Verify file size is under 10MB
- Check file format is supported
- Ensure stable internet connection

#### Agent Not Using Knowledge Base

- Verify `knowledgeBaseId` is included in VAPI agent model
- Check system prompt references knowledge base usage
- Test with specific questions that should be in the knowledge base

### Debug Commands

```bash
# Check agent's knowledge base ID
python -c "
from backend.database import *
from backend.main import get_db
db = next(get_db())
agent = db.query(Agent).filter(Agent.name == 'Your Agent Name').first()
print(f'Knowledge Base ID: {agent.knowledge_base_id}')
"

# List all knowledge bases via API
curl -H "Authorization: Bearer YOUR_VAPI_TOKEN" \
     https://api.vapi.ai/knowledge-base
```

## Future Enhancements

### Planned Features

- Multiple knowledge bases per agent
- Knowledge base versioning
- Direct file editing interface
- Knowledge base templates by industry
- Analytics on knowledge base usage

### API Extensions

- Bulk knowledge base uploads
- Knowledge base sharing between agents
- Real-time knowledge base updates
- Knowledge base search and filtering

---

This knowledge base integration enhances your voice agents by providing them with specific, accurate information about your business, leading to better customer interactions and more helpful responses.
