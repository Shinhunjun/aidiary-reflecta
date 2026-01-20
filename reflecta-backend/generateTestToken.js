// Quick script to generate a test JWT token for WebSocket testing
const jwt = require("jsonwebtoken");

const testUser = {
    userId: "675e1a2b8c9d1e2f3a4b5c6d", // Fake user ID for testing
    email: "test@reflecta.com",
    role: "student"
};

const JWT_SECRET = process.env.JWT_SECRET || "a8f5f167f44f4964e6c998dee827110c";

const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: "7d" });

console.log("\n=== TEST JWT TOKEN ===");
console.log(token);
console.log("\nCopy this token and paste it into the test-websocket.html page");
console.log("=====================\n");
