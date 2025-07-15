# Environment Setup Guide

To use all features of this application, you need to set up the following environment variables.

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

### Google Gemini AI (for markdown conversion and chatbot)
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

**How to get your Gemini API key:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key and paste it in your `.env.local` file

### Pinata IPFS (for file uploads)
```bash
PINATA_API_KEY=your_pinata_api_key_here
PINATA_SECRET_API_KEY=your_pinata_secret_api_key_here
```

**How to get your Pinata API keys:**
1. Go to [Pinata](https://app.pinata.cloud/)
2. Sign up or log in
3. Go to API Keys section
4. Create a new API key
5. Copy both the API Key and Secret API Key

## Features Without API Keys

The application will still work without these API keys, but with limited functionality:

- **Without GEMINI_API_KEY**: Markdown conversion will use basic formatting instead of AI-powered conversion
- **Without Pinata keys**: File uploads to IPFS will not work

## Example .env.local file

```bash
# Google Gemini AI API Key for markdown conversion and chatbot
GEMINI_API_KEY=AIzaSyC...

# Pinata API Keys for IPFS uploads
PINATA_API_KEY=12345678-1234-1234-1234-123456789012
PINATA_SECRET_API_KEY=1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

## Restart Required

After adding or modifying environment variables, restart your development server:

```bash
npm run dev
``` 