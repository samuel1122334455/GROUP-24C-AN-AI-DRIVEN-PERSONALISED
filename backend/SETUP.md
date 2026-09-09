# Backend Setup Guide

## Prerequisites

- Node.js 18+ installed
- MongoDB installed and running (or MongoDB Atlas account)
- OpenAI API key OR Google Gemini API key

## Installation Steps

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database - Use local MongoDB or MongoDB Atlas connection string
MONGODB_URI=mongodb://localhost:27017/ai-diet-consultant

# JWT Secrets - IMPORTANT: Change these to random strings in production!
JWT_ACCESS_SECRET=your-random-secret-at-least-32-characters-long-access
JWT_REFRESH_SECRET=your-random-secret-at-least-32-characters-long-refresh
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# AI Provider Selection - Choose 'openai' or 'gemini'
AI_PROVIDER=openai

# OpenAI Configuration (if using OpenAI)
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
OPENAI_MODEL=gpt-4-turbo-preview

# Google Gemini Configuration (if using Gemini)
GEMINI_API_KEY=your-actual-gemini-api-key-here
GEMINI_MODEL=gemini-2.5-flash

# CORS Origins (adjust for your frontend URL)
CORS_ORIGINS=http://localhost:19000,http://localhost:19001,http://localhost:19002
```

### 4. Start MongoDB

**Local MongoDB:**

```bash
mongod
```

**MongoDB Atlas:**

- Use the connection string provided in Atlas
- Update `MONGODB_URI` in `.env`

### 5. Run the Backend

**Development mode (with hot reload):**

```bash
npm run dev
```

**Production mode:**

```bash
npm run build
npm start
```

### 6. Verify Backend is Running

Visit: `http://localhost:5000/health`

You should see:

```json
{
  "status": "ok",
  "timestamp": "2024-01-05T...",
  "environment": "development",
  "aiProvider": "openai"
}
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run type-check` - Check TypeScript types

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout (invalidate refresh token)

### User

- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/daily-summary` - Get daily calorie/macro summary
- `DELETE /api/user/account` - Delete user account

### Chat

- `POST /api/chat/message` - Send message to AI
- `GET /api/chat/conversation` - Get conversation history
- `DELETE /api/chat/conversation` - Clear conversation

### Meals

- `GET /api/meals` - Get all meals
- `GET /api/meals/:id` - Get meal by ID
- `GET /api/meals/suggestions` - Get AI meal suggestions
- `GET /api/meals/logs` - Get meal logs (optional ?date=YYYY-MM-DD)
- `POST /api/meals/logs` - Log a meal
- `DELETE /api/meals/logs/:logId` - Delete meal log

## Switching AI Providers

To switch between OpenAI and Gemini:

1. Edit `.env`
2. Change `AI_PROVIDER` to `openai` or `gemini`
3. Ensure the corresponding API key is set
4. Restart the backend

**No code changes required!**

## Troubleshooting

### MongoDB Connection Failed

- Ensure MongoDB is running: `mongod`
- Check `MONGODB_URI` is correct
- For Atlas, ensure IP is whitelisted

### AI Responses Not Working

- Verify `AI_PROVIDER` is set correctly
- Check API key is valid
- Review backend logs for errors

### CORS Errors

- Add your frontend URL to `CORS_ORIGINS` in `.env`
- Restart backend after changes

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong, random JWT secrets (minimum 32 characters)
3. Use MongoDB Atlas or managed MongoDB
4. Enable SSL/HTTPS
5. Set appropriate rate limits
6. Monitor logs and errors
7. Keep API keys secure (use environment variables)

## Need Help?

Check the main README.md for more information or open an issue on GitHub.
