import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

async function fetchOpportunities() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/opportunities`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });
    
    if (!response.ok) {
      console.error('Failed to fetch opportunities:', response.status);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return null;
  }
}

function formatOpportunitiesData(opportunities: any) {
  if (!opportunities) return '';
  
  let formattedData = '\n\n🎯 **CURRENT OPPORTUNITIES** 🎯\n';
  
  // Format jobs
  if (opportunities.jobs && opportunities.jobs.length > 0) {
    formattedData += `\n📋 **JOBS** (${opportunities.jobs.length} available)\n`;
    formattedData += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    opportunities.jobs.slice(0, 5).forEach((job: any, index: number) => {
      formattedData += `\n**${index + 1}. ${job.title}**\n`;
      formattedData += `🏢 **Company:** ${job.company}\n`;
      formattedData += `📍 **Location:** ${job.location}\n`;
      formattedData += `🏷️ **Skills:** ${job.tags?.slice(0, 3).join(', ') || 'N/A'}\n`;
      formattedData += `🔗 **Apply:** ${job.apply_url}\n`;
    });
  }
  
  // Format bounties
  if (opportunities.bounties && opportunities.bounties.length > 0) {
    formattedData += `\n\n🏆 **ACTIVE BOUNTIES** (${opportunities.bounties.length} available)\n`;
    formattedData += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    opportunities.bounties.slice(0, 5).forEach((bounty: any, index: number) => {
      const deadline = new Date(bounty.deadline * 1000).toLocaleDateString();
      const reward = (bounty.totalReward / 1000000).toFixed(2); // Convert from wei to USDT
      formattedData += `\n**${index + 1}. ${bounty.name}**\n`;
      formattedData += `💰 **Reward:** $${reward} USDT\n`;
      formattedData += `⏰ **Deadline:** ${deadline}\n`;
      formattedData += `📊 **Submissions:** ${bounty.submissionCount}\n`;
      formattedData += `📂 **Category:** ${getBountyCategory(bounty.category)}\n`;
    });
  }
  
  // Format freelance gigs
  if (opportunities.freelanceGigs && opportunities.freelanceGigs.length > 0) {
    formattedData += `\n\n💼 **FREELANCE GIGS** (${opportunities.freelanceGigs.length} available)\n`;
    formattedData += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    opportunities.freelanceGigs.slice(0, 5).forEach((gig: any, index: number) => {
      const deadline = new Date(gig.deadline * 1000).toLocaleDateString();
      const budget = (gig.budget / 1000000).toFixed(2); // Convert from wei to USDT
      formattedData += `\n**${index + 1}. ${gig.title}**\n`;
      formattedData += `💰 **Budget:** $${budget} USDT\n`;
      formattedData += `⏰ **Deadline:** ${deadline}\n`;
      formattedData += `🛠️ **Skills:** ${gig.skills?.slice(0, 3).join(', ') || 'N/A'}\n`;
    });
  }
  
  return formattedData;
}

function getBountyCategory(category: number): string {
  const categories = ['Content', 'Development', 'Design', 'Research', 'Marketing', 'Other'];
  return categories[category] || 'Other';
}

function prettifyResponse(response: string): string {
  // Add emojis and formatting to common patterns
  let prettified = response;
  
  // Add section headers with emojis
  prettified = prettified.replace(/Jobs:/gi, '📋 **Jobs:**');
  prettified = prettified.replace(/Bounties:/gi, '🏆 **Bounties:**');
  prettified = prettified.replace(/Freelance:/gi, '💼 **Freelance:**');
  prettified = prettified.replace(/Opportunities:/gi, '🎯 **Opportunities:**');
  
  // Add bullet points with emojis
  prettified = prettified.replace(/•/g, '✨');
  prettified = prettified.replace(/\*/g, '✨');
  
  // Add emphasis to important terms
  prettified = prettified.replace(/(\d+)\s*(jobs?|bounties?|gigs?)/gi, '**$1 $2**');
  prettified = prettified.replace(/\$(\d+)/g, '💰 **$$1**');
  
  // Add separators for better readability
  if (prettified.includes('📋') || prettified.includes('🏆') || prettified.includes('💼')) {
    prettified = prettified.replace(/(📋|🏆|💼)/g, '\n\n$1');
  }
  
  return prettified;
}

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Fetch current opportunities
    const opportunities = await fetchOpportunities();
    const opportunitiesData = formatOpportunitiesData(opportunities);

    // Enhanced system prompt with current opportunities and formatting instructions
    const enhancedSystemPrompt = `You are a helpful Web3 career assistant specializing in helping users find job opportunities, current bounties, freelance gigs, and career advice. 

Your expertise includes:
✨ Job search strategies and tips
✨ Freelance platform recommendations (Upwork, Fiverr, Freelancer, etc.)
✨ Bounty hunting platforms (Gitcoin, Bounties Network, etc.)
✨ Resume optimization and interview preparation
✨ Career development advice
✨ Remote work opportunities
✨ Tech industry insights
✨ Web3 and blockchain career guidance

**IMPORTANT FORMATTING INSTRUCTIONS:**
- Use emojis to make responses more engaging and visually appealing
- Use **bold text** for important information like numbers, amounts, and key terms
- Use bullet points (✨) for lists
- Add separators (━━━) between different sections
- Keep responses concise but informative
- When mentioning opportunities, be specific about what's currently available
- Use markdown formatting for better structure

**CURRENT OPPORTUNITIES DATA:**
${opportunitiesData}

Always provide practical, actionable advice. Be encouraging and supportive. When mentioning opportunities, be specific about what's currently available. Make your responses visually appealing with proper formatting and emojis.`;

    // Build conversation context
    let conversationContext = enhancedSystemPrompt + '\n\n';
    
    if (history && history.length > 0) {
      // Add recent conversation history (last 10 messages to stay within context limits)
      const recentHistory = history.slice(-10);
      conversationContext += 'Previous conversation:\n';
      recentHistory.forEach((msg: any) => {
        conversationContext += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      });
      conversationContext += '\n';
    }

    conversationContext += `User: ${message}\nAssistant:`;

    const model = ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: conversationContext,
      //@ts-ignore
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1200,
      },
    });

    const response = await model;
    let responseText = response.text;

    // Apply additional prettification
    //@ts-ignore
    responseText = prettifyResponse(responseText);

    return NextResponse.json({
      response: responseText,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chatbot API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process message',
        response: "😔 I'm sorry, I'm having trouble processing your request right now. Please try again in a moment."
      },
      { status: 500 }
    );
  }
} 