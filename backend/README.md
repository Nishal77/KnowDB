# Backend API Server

AI-powered database query backend for AskYourDatabase.

## Features

- 🤖 **AI Query Generation**: Converts natural language to MongoDB queries using OpenAI
- 📊 **Database Schema Parsing**: Automatically discovers and caches database structure
- 🔍 **Query Execution**: Safely executes MongoDB queries with validation
- 📝 **Query History**: Tracks and stores all queries with conversation support
- 🔒 **Security**: Validates queries to prevent dangerous operations

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Create `.env` file**:
   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables**:
   - `MONGO_URI`: MongoDB connection string
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `PORT`: Server port (default: 3001)
   - `FRONTEND_URL`: Frontend URL for CORS

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

## API Endpoints

### POST `/api/query`
Process a natural language query and return results.

**Request:**
```json
{
  "query": "How many members have ordered this month?",
  "conversationId": "optional-conversation-id"
}
```

**Response:**
```json
{
  "message": {
    "id": "conversation-id",
    "role": "assistant",
    "content": "Query executed successfully",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "queryResult": {
      "query": "db.orders.find({ createdAt: { $gte: ... } })",
      "result": [...],
      "executionTime": 123,
      "error": null
    }
  },
  "result": {
    "query": "...",
    "result": [...],
    "executionTime": 123
  }
}
```

### GET `/api/schema`
Get database schema.

**Query Parameters:**
- `refresh=true`: Force refresh schema cache

### POST `/api/schema/refresh`
Manually refresh database schema.

### GET `/api/conversations/:conversationId`
Get conversation history.

### DELETE `/api/conversations/:conversationId`
Delete conversation history.

## Project Structure

```
backend/
├── src/
│   ├── index.ts              # Entry point
│   ├── app.ts                # Express app setup
│   ├── config/               # Configuration
│   ├── routes/               # API routes
│   ├── controllers/          # Request handlers
│   ├── services/             # Business logic
│   ├── models/               # MongoDB models
│   ├── middleware/           # Express middleware
│   ├── utils/                # Helper functions
│   └── interfaces/           # TypeScript types
```

## Environment Variables

See `.env.example` for all required variables.

## Security Notes

- Query validation prevents dangerous operations (drop, delete, etc.)
- Results are limited to prevent memory issues
- CORS is configured for frontend origin only



