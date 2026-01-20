# Gemini Live WebSocket - Quick Test Guide

## Step 1: Get Gemini API Key

Visit: <https://aistudio.google.com/>

1. Sign in with Google account
2. Click "Get API key"
3. Create API key
4. Copy the key

## Step 2: Configure Backend

```bash
cd reflecta-backend
cp env.example .env
```

Edit `.env` and add:

```
GEMINI_API_KEY=your_key_here
```

## Step 3: Start Backend

```bash
npm run dev
```

Expected output:

```
MongoDB connected successfully
HTTP Server running on port 5001
WebSocket Server available at ws://localhost:5001/ws/gemini-live
```

## Step 4: Get JWT Token

If you don't have an account:

1. Start frontend: `cd reflecta-frontend && npm start`
2. Register/Login at <http://localhost:3000>
3. Open DevTools Console
4. Run: `localStorage.getItem('token')`
5. Copy the token

## Step 5: Test WebSocket

1. Open `reflecta-backend/test-websocket.html` in browser
2. Paste JWT token
3. Click "Connect"
4. Should see: "Status: Connected"

## Step 6: Test Function Calling

In the message box, type:

```
I want to write a journal entry about my productive day learning React
```

Expected response:

- AI will ask clarifying questions OR
- AI will call `create_journal_entry` function
- You'll see the function call and result
- Journal entry will be created in database

## Troubleshooting

**"Gemini API key not configured"**

- Check .env file has GEMINI_API_KEY
- Restart backend server

**WebSocket connection fails**

- Check backend is running on port 5001
- Verify JWT token is valid (not expired)

**No AI response**

- Check server console for errors
- Verify Gemini API key is valid
- Check rate limits (1,500 requests/day free tier)
