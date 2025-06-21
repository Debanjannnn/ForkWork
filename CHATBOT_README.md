# Chatbot Component

A modern, animated chatbot component that appears in the bottom-right corner of the screen and expands on click. It uses Google's Gemini AI to provide job-related assistance.

## Features

- **Floating Design**: Appears as a floating button in the bottom-right corner
- **Smooth Animations**: Uses motion/react for smooth expand/collapse animations
- **Minimize/Maximize**: Can be minimized to just the header or fully expanded
- **Real-time Chat**: Connects to Gemini AI for intelligent responses
- **Job-focused**: Specialized in helping with:
  - Job opportunities
  - Current bounties and freelance gigs
  - Career advice and tips
  - Resume optimization
  - Web3 industry insights

## Setup

### Environment Variables

Make sure you have the following environment variable set in your `.env.local` file:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### Installation

The component is already integrated into the main layout and will appear on all pages. No additional installation steps are required.

## Usage

The chatbot automatically appears on all pages. Users can:

1. **Open**: Click the floating chat button in the bottom-right corner
2. **Minimize**: Click the chevron down button in the header
3. **Close**: Click the X button in the header
4. **Chat**: Type messages and press Enter or click the send button

## API Endpoint

The chatbot uses the `/api/chatbot` endpoint which:

- Accepts POST requests with `message` and `history` fields
- Uses Gemini 2.5 Flash model for responses
- Maintains conversation context (last 10 messages)
- Returns structured responses with timestamps

## Styling

The component uses:
- Tailwind CSS for styling
- Motion/react for animations
- Lucide React for icons
- Custom gradient colors matching the app theme
- Backdrop blur effects for modern glass-morphism design

## Customization

You can customize the chatbot by modifying:

- Colors in the gradient classes
- Size and positioning in the main container
- System prompt in `/api/chatbot/route.ts`
- Animation parameters in the motion components

## Dependencies

- `@google/genai` - For Gemini AI integration
- `motion` - For animations
- `lucide-react` - For icons
- `@radix-ui/react-*` - For UI components 