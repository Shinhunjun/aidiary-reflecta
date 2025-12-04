# Reflecta - AI-Powered Personal Reflection Journal

Reflecta is an intelligent journaling application that helps users with self-reflection, goal setting, and personal growth through AI-powered conversations and insights.

## Live Demo

**Frontend (Vercel)**: [https://aidiary-reflecta.vercel.app](https://aidiary-reflecta.vercel.app/demo)

**Backend API (Google Cloud Run)**: https://reflecta-backend-762303020827.us-central1.run.app

## Overview

Reflecta combines the power of AI with structured journaling to help users:
- Engage in meaningful self-reflection through AI-powered conversations
- Set and track goals using the Mandalart goal-setting framework
- Convert conversations into structured journal entries
- Track progress toward personal growth objectives
- Visualize their reflection journey through interactive timelines

## Features

### 1. AI Reflection Assistant
- Real-time chat interface powered by OpenAI GPT
- Contextual responses based on user's goals and past reflections
- Smart conversation-to-diary conversion
- Automatic goal mapping and progress tracking

### 2. Goal Setting (Mandalart Framework)
- Interactive 9x9 Mandalart grid for structured goal planning
- Core goal and 8 sub-goal categories
- Each sub-goal broken down into 8 actionable tasks
- Visual progress tracking for all goals

### 3. Journal Management
- Create, edit, and organize journal entries
- Tag entries with moods and categories
- AI-generated entries from chat conversations
- Search and filter capabilities

### 4. Progress Tracking
- Visual timeline of journal entries
- Goal completion metrics
- Mood patterns and insights
- Weekly, monthly, and yearly summaries

## Technology Stack

### Frontend
- **Framework**: React.js
- **Styling**: CSS3 with responsive design
- **State Management**: React Context API
- **Routing**: React Router v6
- **Deployment**: Vercel

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB Atlas
- **Authentication**: JWT (JSON Web Tokens)
- **AI Integration**: OpenAI GPT API
- **Deployment**: Google Cloud Run (MLOps course application)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Vercel)                         │
│                  React.js Application                        │
│  https://aidiary-reflecta.vercel.app                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS/REST API
                         │
┌────────────────────────▼────────────────────────────────────┐
│              Backend (Google Cloud Run)                      │
│                  Express.js Server                           │
│  https://reflecta-backend-762303020827.us-central1.run.app  │
└────────────┬───────────────────────┬────────────────────────┘
             │                       │
             │ MongoDB Driver        │ OpenAI API
             │                       │
┌────────────▼────────────┐  ┌──────▼─────────────────────────┐
│   MongoDB Atlas          │  │   OpenAI GPT-4                 │
│   User Data & Journals   │  │   AI Conversation Engine       │
└──────────────────────────┘  └────────────────────────────────┘
```

## Project Structure

```
reflecta/
├── reflecta-frontend/          # React frontend application
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── contexts/           # Context providers (Auth, Journal)
│   │   ├── services/           # API service layer
│   │   └── App.js              # Main application component
│   ├── public/                 # Static assets
│   └── package.json
│
├── reflecta-backend/           # Node.js backend API
│   ├── models/                 # MongoDB schemas
│   │   ├── User.js
│   │   ├── Goal.js
│   │   ├── JournalEntry.js
│   │   ├── ChatSession.js
│   │   └── GoalProgress.js
│   ├── server.js               # Express server & API routes
│   ├── Dockerfile              # Container configuration
│   └── package.json
│
└── README.md                   # This file
```

## Deployment

### Frontend Deployment (Vercel)

The frontend is deployed on Vercel with the following configuration:
- **Root Directory**: `reflecta-frontend`
- **Framework**: Create React App
- **Build Command**: `npm run build`
- **Output Directory**: `build`

Environment variables configured in Vercel:
```
REACT_APP_API_URL=https://reflecta-backend-762303020827.us-central1.run.app/api
REACT_APP_APP_NAME=Reflecta
REACT_APP_APP_VERSION=1.0.0
REACT_APP_MOCK_API=false
```

### Backend Deployment (Google Cloud Run)

The backend is deployed on Google Cloud Run, applying concepts learned from the MLOps course:

**Key MLOps Practices Applied:**
- **Containerization**: Using Docker for consistent deployment environments
- **Cloud-Native Deployment**: Serverless architecture with automatic scaling
- **Environment Management**: Secure handling of secrets and configurations
- **CI/CD Ready**: Source-based deployment with Cloud Build
- **Monitoring**: Built-in logging and health check endpoints

**Deployment Command:**
```bash
gcloud run deploy reflecta-backend \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --env-vars-file .env.yaml \
  --port 5000
```

**Environment Variables:**
- `MONGODB_URI`: MongoDB Atlas connection string
- `JWT_SECRET`: Secret key for authentication
- `CORS_ORIGIN`: Allowed frontend origins
- `OPENAI_API_KEY`: OpenAI API key
- `OPENAI_API_URL`: OpenAI API endpoint

## Local Development

### Prerequisites
- Node.js 18 or higher
- MongoDB (local or Atlas)
- OpenAI API key

### Frontend Setup

```bash
cd reflecta-frontend
npm install
cp .env.example .env
# Edit .env with your configuration
npm start
```

The frontend will run on `http://localhost:3000`

### Backend Setup

```bash
cd reflecta-backend
npm install
cp env.example .env
# Edit .env with your configuration
npm start
```

The backend will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Goals
- `GET /api/goals` - Get user's goals
- `POST /api/goals` - Save/update goals
- `POST /api/goals/ai-suggestions` - Get AI-powered goal suggestions

### Journal
- `GET /api/journal` - Get all journal entries
- `GET /api/journal/:id` - Get specific entry
- `POST /api/journal` - Create new entry

### Chat
- `GET /api/chat` - Get chat session
- `POST /api/chat` - Save chat session
- `POST /api/chat/enhanced` - Send message with AI response

### Conversion & Analysis
- `POST /api/convert-to-diary` - Convert conversation to journal entry
- `POST /api/analyze-goal-mapping` - Analyze diary for goal connections

### Goal Progress
- `GET /api/goals/:id/progress` - Get goal progress
- `POST /api/goals/:id/progress` - Update goal progress
- `GET /api/goals/:id/progress/summary` - Get progress summary

### Health Check
- `GET /api/health` - Backend health status

## Key Features Implementation

### 1. AI Conversation to Diary
Users can select messages from their chat with the AI assistant and convert them into structured journal entries. The AI analyzes the conversation and:
- Generates a coherent diary entry
- Identifies related goals
- Suggests relevant tags and mood

### 2. Mandalart Goal Framework
The application implements the Mandalart (9x9) goal-setting method:
- 1 central goal
- 8 sub-goals around the center
- Each sub-goal expands into 8 actionable tasks (total 64 tasks)
- Visual progress tracking for all levels

### 3. Smart Goal Mapping
AI automatically analyzes journal entries to:
- Identify connections to existing goals
- Track progress on specific tasks
- Provide insights on goal completion patterns

## Security

- JWT-based authentication
- Secure password hashing with bcrypt
- CORS configuration for frontend-backend communication
- Environment-based secret management
- MongoDB Atlas network security

## Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Data export functionality (PDF, JSON)
- [ ] Social features (share reflections with trusted users)
- [ ] Advanced analytics dashboard
- [ ] Voice-to-text journal entries
- [ ] Habit tracking integration
- [ ] Reminder and notification system

## Credits

**Developed by**: Hunjun Shin

**Course**: MLOps - Applied cloud deployment practices using Google Cloud Run

**Technologies**: React, Node.js, MongoDB, OpenAI GPT, Vercel, Google Cloud Run

## License

This project is developed for educational purposes.

---

**Start your reflection journey today**: [https://aidiary-reflecta.vercel.app](https://aidiary-reflecta.vercel.app)
