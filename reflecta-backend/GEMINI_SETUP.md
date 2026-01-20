# Gemini Live API Setup Guide

## Prerequisites

To use the Gemini Live voice journaling feature, you need:

1. Google Cloud Platform (GCP) account
2. Gemini API key

## Getting a Gemini API Key

### Option 1: Google AI Studio (Easiest - Free Tier Available)

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click **"Get API key"** in the left sidebar
4. Click **"Create API key"**
5. Choose **"Create API key in new project"** or select an existing project
6. Copy the generated API key

**Note**: AI Studio API keys work with Gemini models and are free for testing (with rate limits).

### Option 2: Google Cloud Console (For Production)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Generative Language API**:
   - Go to **APIs & Services** > **Library**
   - Search for "Generative Language API"
   - Click **Enable**
4. Create an API key:
   - Go to **APIs & Services** > **Credentials**
   - Click **Create Credentials** > **API key**
   - Copy the generated API key
   - (Recommended) Restrict the API key to only Generative Language API

## Configuration

1. Copy the example environment file:

   ```bash
   cd reflecta-backend
   cp env.example .env
   ```

2. Edit `.env` and add your Gemini API key:

   ```bash
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. The complete `.env` should look like:

   ```bash
   MONGODB_URI=mongodb://localhost:27017/reflecta
   JWT_SECRET=your_jwt_secret_here
   PORT=5000
   CORS_ORIGIN=http://localhost:3000
   OPENAI_API_KEY=your_openai_api_key_here
   GEMINI_API_KEY=AIza...your_key_here
   WS_PORT=5001
   ```

## Testing the WebSocket Connection

1. Start the backend server:

   ```bash
   cd reflecta-backend
   npm run dev
   ```

2. Open `test-websocket.html` in your browser

3. Get a JWT token:
   - Login to Reflecta application
   - Open browser DevTools > Console
   - Run: `localStorage.getItem('token')`
   - Copy the token

4. Paste the token in the test page and click **Connect**

5. Try sending a message like: "I want to write a journal entry about my productive day"

## Available Models

The service uses `gemini-2.0-flash-exp` which supports:

- Function calling
- Multimodal input (text, audio, video)
- Low latency for real-time conversations

Alternative models you can configure in `websocket.js`:

- `gemini-1.5-pro` - More powerful, higher quality
- `gemini-1.5-flash` - Faster, more cost-effective

## Rate Limits (AI Studio Free Tier)

- **Gemini 2.0 Flash**: 1,500 requests per day, 10 requests per minute
- **Gemini 1.5 Pro**: 50 requests per day, 2 requests per minute

For production use, consider Google Cloud billing.

## Troubleshooting

### "Gemini API key not configured"

- Check that `GEMINI_API_KEY` is set in your `.env` file
- Restart the backend server after adding the key

### WebSocket connection fails

- Verify backend is running on correct port
- Check JWT token is valid
- Look at browser console for errors

### Function calling not working

- Ensure you're using a Gemini 2.0 model (supports function calling)
- Check server logs for function execution errors
