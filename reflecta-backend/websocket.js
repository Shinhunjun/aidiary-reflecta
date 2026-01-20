const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const { initializeGemini, functionDeclarations, executeFunctionCall, getUserContext } = require("./services/geminiLiveService");

/**
 * WebSocket Server for Gemini Live API
 * Handles real-time audio streaming and function calling for voice journaling
 */

let wss = null;

/**
 * Initialize WebSocket server
 */
const initializeWebSocketServer = (server) => {
    const WS_PORT = process.env.WS_PORT || 5001;

    wss = new WebSocket.Server({
        server, // Attach to existing HTTP server
        path: "/ws/gemini-live"
    });

    console.log(`WebSocket server initialized on path /ws/gemini-live`);

    wss.on("connection", async (ws, req) => {
        console.log("New WebSocket connection attempt");

        // Extract and verify JWT token from query params or headers
        const token = extractToken(req);

        if (!token) {
            ws.close(4001, "Authentication required");
            console.log("WebSocket connection rejected: No token");
            return;
        }

        let userId;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
            userId = decoded.userId;
            console.log(`WebSocket authenticated for user: ${userId}`);
        } catch (error) {
            ws.close(4002, "Invalid token");
            console.log("WebSocket connection rejected: Invalid token");
            return;
        }

        //Initialize session state
        const session = {
            userId,
            chat: null,
            geminiClient: null
        };

        // Get user context (recent journals, goals)
        const userContext = await getUserContext(userId);

        // Send welcome message
        ws.send(JSON.stringify({
            type: "connected",
            message: "Voice journaling session started",
            context: userContext
        }));

        // Handle incoming messages
        ws.on("message", async (data) => {
            try {
                const message = JSON.parse(data);
                await handleMessage(ws, session, message);
            } catch (error) {
                console.error("WebSocket message error:", error);
                ws.send(JSON.stringify({
                    type: "error",
                    error: error.message
                }));
            }
        });

        // Handle disconnection
        ws.on("close", () => {
            console.log(`WebSocket disconnected for user: ${userId}`);
        });

        ws.on("error", (error) => {
            console.error("WebSocket error:", error);
        });
    });

    return wss;
};

/**
 * Extract JWT token from request
 */
const extractToken = (req) => {
    // Try query parameter first
    const url = new URL(req.url, `http://${req.headers.host}`);
    const queryToken = url.searchParams.get("token");
    if (queryToken) return queryToken;

    // Try Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        return authHeader.substring(7);
    }

    return null;
};

/**
 * Handle different message types from client
 */
const handleMessage = async (ws, session, message) => {
    const { type, data } = message;

    switch (type) {
        case "audio_chunk":
            // Handle audio data streaming
            // In production, this would be sent to Gemini Live API
            // For now, we'll simulate with a text-based approach
            console.log("Received audio chunk");
            ws.send(JSON.stringify({
                type: "audio_received",
                message: "Audio processing..."
            }));
            break;

        case "text_message":
            // Handle text input (for testing without audio)
            await handleTextMessage(ws, session, data.text);
            break;

        case "end_session":
            // Clean up and close session
            ws.send(JSON.stringify({
                type: "session_ended",
                message: "Voice journaling session ended"
            }));
            ws.close();
            break;

        default:
            ws.send(JSON.stringify({
                type: "error",
                error: `Unknown message type: ${type}`
            }));
    }
};

/**
 * Handle text message (for testing and fallback)
 * In production, this logic would be triggered by Gemini Live audio processing
 */
const handleTextMessage = async (ws, session, text) => {
    try {
        // Initialize Gemini if not already done
        if (!session.geminiClient) {
            const genAI = initializeGemini();
            if (!genAI) {
                throw new Error("Gemini API not configured");
            }

            // Use Gemini model with function calling
            session.geminiClient = genAI.getGenerativeModel({
                model: "gemini-2.0-flash-exp",
                tools: [{ functionDeclarations }],
                systemInstruction: `You are a helpful AI journaling assistant. Help users reflect on their day, set goals, and track their progress. 

When the user provides enough details about their day (mood, what they did, how they feel), call create_journal_entry to save their reflection.
Ask clarifying questions if needed to get title, content, mood, and relevant tags.
Be conversational, empathetic, and encouraging.`
            });
        }

        // Start or continue chat (SDK manages history internally)
        if (!session.chat) {
            session.chat = session.geminiClient.startChat({});
        }

        const result = await session.chat.sendMessage(text);
        const response = result.response;

        // Check if Gemini wants to call a function
        const functionCall = response.functionCalls()?.[0];

        if (functionCall) {
            // Execute the function
            console.log("Function call detected:", functionCall.name);

            ws.send(JSON.stringify({
                type: "function_call",
                function: functionCall.name,
                args: functionCall.args
            }));

            const functionResult = await executeFunctionCall(functionCall, session.userId);

            // Send result back to user
            ws.send(JSON.stringify({
                type: "function_result",
                function: functionCall.name,
                result: functionResult
            }));

            // Get AI's final response incorporating the function result
            const followUpResult = await session.chat.sendMessage([{
                functionResponse: {
                    name: functionCall.name,
                    response: functionResult
                }
            }]);

            const finalResponse = followUpResult.response.text();

            ws.send(JSON.stringify({
                type: "ai_response",
                text: finalResponse
            }));

        } else {
            // Regular text response
            const aiResponse = response.text();

            ws.send(JSON.stringify({
                type: "ai_response",
                text: aiResponse
            }));
        }

    } catch (error) {
        console.error("Error handling text message:", error);
        ws.send(JSON.stringify({
            type: "error",
            error: error.message
        }));
    }
};

module.exports = {
    initializeWebSocketServer
};
