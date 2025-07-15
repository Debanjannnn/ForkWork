import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from "@google/genai"

// Fallback markdown conversion function that works without AI
function basicMarkdownConversion(text: string): string {
  const lines = text.split('\n')
  let markdown = ''
  let inList = false
  let inCodeBlock = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    if (!line) {
      if (inList) {
        markdown += '\n'
        inList = false
      } else if (!inCodeBlock) {
        markdown += '\n'
      }
      continue
    }
    
    // Detect code blocks
    if (line.startsWith('```') || line.includes('function') || line.includes('const') || line.includes('import') || line.includes('export')) {
      if (!inCodeBlock) {
        markdown += '```\n'
        inCodeBlock = true
      }
      markdown += `${line}\n`
      continue
    }
    
    // End code block if we're in one and hit a non-code line
    if (inCodeBlock && !line.includes('function') && !line.includes('const') && !line.includes('import') && !line.includes('export')) {
      markdown += '```\n\n'
      inCodeBlock = false
    }
    
    // Detect and format headers
    if (line.length > 3 && line.endsWith(':') && !line.includes(' ')) {
      markdown += `## ${line.slice(0, -1)}\n\n`
      continue
    }
    
    // Detect main sections
    if (line.toLowerCase().includes('task') || line.toLowerCase().includes('requirement') || line.toLowerCase().includes('deliverable') || line.toLowerCase().includes('overview')) {
      if (!inList) {
        markdown += `## ${line}\n\n`
      } else {
        markdown += `- ${line}\n`
      }
      continue
    }
    
    // Detect subsections
    if (line.toLowerCase().includes('step') || line.toLowerCase().includes('phase') || line.toLowerCase().includes('part')) {
      if (!inList) {
        markdown += `### ${line}\n\n`
      } else {
        markdown += `- ${line}\n`
      }
      continue
    }
    
    // Detect bullet points
    if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
      if (!inList) {
        markdown += '\n'
        inList = true
      }
      markdown += `- ${line.slice(1).trim()}\n`
      continue
    }
    
    // Detect numbered lists
    if (/^\d+\./.test(line)) {
      if (!inList) {
        markdown += '\n'
        inList = true
      }
      markdown += `- ${line.replace(/^\d+\.\s*/, '')}\n`
      continue
    }
    
    // Detect task checkboxes
    if (line.toLowerCase().includes('todo') || line.toLowerCase().includes('task') || line.toLowerCase().includes('check')) {
      if (!inList) {
        markdown += '\n'
        inList = true
      }
      markdown += `- [ ] ${line}\n`
      continue
    }
    
    // Detect emphasis words
    if (line.includes('important') || line.includes('required') || line.includes('must') || line.includes('should')) {
      const emphasizedLine = line.replace(/\b(important|required|must|should)\b/gi, '**$1**')
      if (!inList) {
        markdown += `${emphasizedLine}\n\n`
      } else {
        markdown += `${emphasizedLine}\n`
        inList = false
      }
      continue
    }
    
    // Regular text
    if (!inList) {
      markdown += `${line}\n\n`
    } else {
      markdown += `${line}\n`
      inList = false
    }
  }
  
  // Close any open code block
  if (inCodeBlock) {
    markdown += '```\n\n'
  }
  
  return markdown.trim()
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      )
    }

    // Check if GEMINI_API_KEY is available
    if (!process.env.GEMINI_API_KEY) {
      // Use fallback conversion
      const markdown = basicMarkdownConversion(text)
      return NextResponse.json({ 
        markdown,
        note: 'Using basic conversion (set GEMINI_API_KEY for AI-powered conversion)'
      })
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY    
      })

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are a markdown formatting expert. Convert the following text into clean, well-structured markdown for a bounty description. 

IMPORTANT RULES:
1. ONLY format the existing text - do not add any new content
2. Use proper markdown syntax
3. Structure the content logically with headers
4. Convert plain text lists to markdown lists
5. Add emphasis where appropriate
6. Keep the original meaning and content intact

MARKDOWN FORMATTING GUIDELINES:
- Use ## for main sections (Task Overview, Requirements, Deliverables, etc.)
- Use ### for subsections
- Use - for bullet points
- Use - [ ] for task checkboxes
- Use **text** for emphasis
- Use \`code\` for inline code
- Use \`\`\`language for code blocks
- Use --- for horizontal rules between sections

Original text to convert:
${text}

Convert to markdown:`,
      })

      const markdownText = response.text

      if (!markdownText) {
        throw new Error('No response from AI')
      }

      // Clean up the response to ensure it's just the markdown
      const cleanedMarkdown = markdownText.trim()
        .replace(/^```markdown\s*/i, '') // Remove markdown code block wrapper if present
        .replace(/```\s*$/i, '') // Remove trailing code block wrapper
        .trim()

      return NextResponse.json({ markdown: cleanedMarkdown })
    } catch (aiError) {
      console.error('AI conversion failed, falling back to basic conversion:', aiError)
      // If AI fails, fall back to basic conversion
      const markdown = basicMarkdownConversion(text)
      return NextResponse.json({ 
        markdown,
        note: 'AI conversion failed, using basic conversion'
      })
    }
  } catch (error) {
    console.error('Error converting to markdown:', error)
    
    // If everything fails, try basic conversion as last resort
    try {
      const { text } = await request.json()
      const markdown = basicMarkdownConversion(text)
      return NextResponse.json({ 
        markdown,
        note: 'Using basic conversion due to error'
      })
    } catch (fallbackError) {
      return NextResponse.json(
        { error: 'Failed to convert text to markdown' },
        { status: 500 }
      )
    }
  }
} 