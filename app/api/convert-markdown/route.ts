import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from "@google/genai"

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY    
})

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      )
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Convert ONLY the provided text to markdown format. Do not add any extra content, explanations, or text that wasn't in the original. Just format the existing text using markdown syntax like:

- Headers (##, ###) for titles and sections
- Bullet points (-) for lists
- Bold (**text**) for emphasis
- Code blocks (\`\`\`) for technical content
- Task lists (- [ ]) for checkboxes

Text to convert:
${text}`,
    })

    const markdownText = response.text

    if (!markdownText) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      )
    }

    return NextResponse.json({ markdown: markdownText })
  } catch (error) {
    console.error('Error converting to markdown:', error)
    return NextResponse.json(
      { error: 'Failed to convert text to markdown' },
      { status: 500 }
    )
  }
} 