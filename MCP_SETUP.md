# MCP Servers Setup for Reflecta

## Installed MCP Servers

I've successfully installed 4 MCP servers for your Reflecta project. Here's what each one does:

### 1. **Fetch MCP Server** ✅
**Package**: `mcp-server-fetch` (Python-based, using uvx)

**What it does**:
- Fetch web content and convert it to LLM-friendly formats
- Test your API endpoints directly
- Make HTTP requests to your backend or external APIs

**Use cases for Reflecta**:
- Test backend API endpoints: `POST /api/convert-to-diary`, `GET /api/journal`, etc.
- Verify your Google Cloud Run deployment
- Test OpenAI API integration
- Debug CORS issues

### 2. **Memory MCP Server** ✅
**Package**: `@modelcontextprotocol/server-memory`

**What it does**:
- Maintains a knowledge graph across Claude Code sessions
- Remembers project context, decisions, and patterns
- Stores information persistently

**Use cases for Reflecta**:
- Remember architecture decisions (e.g., "Why did we choose Mandalart framework?")
- Track project-specific patterns and conventions
- Maintain context about your MongoDB schema structure

### 3. **GitHub MCP Server** ✅
**Package**: `@modelcontextprotocol/server-github`

**What it does**:
- Enhanced Git operations
- Create and manage GitHub issues
- Better PR workflows
- Search repository content

**Use cases for Reflecta**:
- Create issues for bugs or features
- Review PR history
- Search commit history more effectively

### 4. **MongoDB MCP Server** 🔥 (Most valuable for Reflecta)
**Package**: `@mongodb-js/mongodb-mcp-server`

**What it does**:
- Direct MongoDB database queries
- Inspect and modify database records
- Analyze data structure and relationships

**Use cases for Reflecta**:
- Query journal entries: "Show me all journals with mood='anxious'"
- Inspect Mandalart goal structures: "Show the full goal hierarchy for user X"
- Verify privacy settings: "Which users have risk monitoring enabled?"
- Check risk alerts: "Show me unresolved risk alerts"
- Analyze goal-journal mappings
- Debug data integrity issues

## Configuration Required

### MongoDB Server Setup (REQUIRED)

1. **Copy the environment template**:
   ```bash
   cp .env.mcp.example .env.mcp
   ```

2. **Add your MongoDB connection string** to `.env.mcp`:
   ```bash
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/reflecta
   ```

   You can find this in:
   - MongoDB Atlas Dashboard → Connect → Connect your application
   - Or use your existing `reflecta-backend/.env` file (copy the `MONGODB_URI` value)

### GitHub Server Setup (OPTIONAL)

If you want to use GitHub features, add a personal access token to `.env.mcp`:

1. Create a token at: https://github.com/settings/tokens
2. Select scopes: `repo`, `read:org`
3. Add to `.env.mcp`:
   ```bash
   GITHUB_TOKEN=ghp_yourtoken123456789
   ```

## Next Steps

### 1. Restart Claude Code
The MCP servers need Claude Code to restart to load properly:
- Close this Claude Code window
- Reopen the project
- Verify servers are loaded with `/mcp` command

### 2. Verify Installation
After restart, run:
```bash
claude mcp list
```

Or use the `/mcp` command in Claude Code chat.

### 3. Test MongoDB Connection
Once configured with your `MONGODB_URI`, you can query your database:
- "Show me the User collection schema"
- "Find all journal entries from the last 7 days"
- "Show me the Mandalart goal structure for my test user"

## Files Created

- `.mcp.json` - MCP server configuration (✅ committed to git)
- `.env.mcp.example` - Template for environment variables (✅ committed to git)
- `.env.mcp` - Your actual credentials (🔒 in .gitignore, do NOT commit)

## Security Notes

- ✅ `.env.mcp` is added to `.gitignore` - your MongoDB credentials are safe
- ✅ Never commit `.env.mcp` to version control
- ✅ Environment variables use `${VAR}` syntax in `.mcp.json`

## Troubleshooting

### MCP servers not showing up
- Make sure you restarted Claude Code
- Check that `.mcp.json` exists in project root
- Run `claude mcp list` to verify

### MongoDB connection errors
- Verify your `MONGODB_URI` in `.env.mcp` is correct
- Test the connection string in MongoDB Compass first
- Check that your IP is whitelisted in MongoDB Atlas

### Python/uvx not found (for Fetch server)
- Install uvx: `pip install uvx` or `brew install uvx` (macOS)
- The Fetch server requires Python

## What You Can Do Now

With these MCP servers, you can:

1. **Debug production data**: "Show me all RiskAlert records where severity='high'"
2. **Understand data relationships**: "How many journal entries are mapped to sub-goal X?"
3. **Test API changes**: Make HTTP requests to test new endpoints
4. **Maintain context**: Store project decisions that persist across sessions
5. **Better git workflows**: Create issues and PRs directly from Claude Code

The **MongoDB MCP server** will be particularly powerful for debugging your complex nested Mandalart structure and understanding the privacy settings flow!
