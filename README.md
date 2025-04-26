# LinkedIn Automation

This project automates LinkedIn posts creation using the LinkedIn API and Claude AI for content generation.

## Features

- Automated LinkedIn post creation using Claude AI
- Scheduled posts every 4 hours (9 AM, 1 PM, 5 PM, 9 PM)
- No posts during night time (10 PM to 9 AM)
- REST API for manual post creation with AI content generation option
- MongoDB integration for post tracking

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
# LinkedIn API Configuration
LINKEDIN_CLIENT_ID=your_client_id_here
LINKEDIN_CLIENT_SECRET=your_client_secret_here
LINKEDIN_ACCESS_TOKEN=your_access_token_here
LINKEDIN_USER_ID=your_linkedin_user_id_here

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/linkedin_automation

# Claude API Configuration
CLAUDE_API_KEY=your_claude_api_key_here

# Server Configuration
PORT=3000
```

3. To get LinkedIn API credentials:
   - Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
   - Create a new application
   - Get the client ID and client secret
   - Generate an access token with appropriate permissions
   - Get your LinkedIn user ID

4. To get Claude API key:
   - Go to [Anthropic Console](https://console.anthropic.com/)
   - Create an account and get your API key

## Usage

1. Start the server:
```bash
npm run server
```

2. The server will automatically create posts at:
   - 9:00 AM
   - 1:00 PM
   - 5:00 PM
   - 9:00 PM

3. API Endpoints:
   - Create a post manually:
     ```bash
     # With custom content
     curl -X POST "http://localhost:3000/api/posts" \
       -H "Content-Type: application/json" \
       -d '{"content": "Your post content here"}'

     # With AI-generated content
     curl -X POST "http://localhost:3000/api/posts?ai=true" \
       -H "Content-Type: application/json"
     ```
   - Get recent posts:
     ```bash
     curl "http://localhost:3000/api/posts"
     ```

## Post Schedule

- Posts are created every 4 hours
- Active hours: 9:00 AM to 10:00 PM
- No posts during night time
- Content is generated using Claude AI

## Note

Make sure to follow LinkedIn's API usage guidelines and rate limits. This is for educational purposes only. 