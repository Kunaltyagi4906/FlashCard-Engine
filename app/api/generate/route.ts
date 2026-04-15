import Groq from 'groq-sdk'
import { supabase } from '@/lib/supabase'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('pdf') as File
    const deckName = formData.get('deckName') as string

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const { extractText } = await import('unpdf')
    const { text } = await extractText(new Uint8Array(buffer), { mergePages: true })
    const cleanText = text.slice(0, 8000)

    if (!cleanText || cleanText.trim().length < 50) {
      return Response.json({ error: 'Could not extract text from PDF. Make sure it is a text-based PDF, not a scanned image.' }, { status: 400 })
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: `You are an expert teacher and educational content creator. Your job is to create high quality flashcards from study material. 

    You MUST follow these strict rules:
    - Every question must be directly answerable from the provided text
    - Never create questions about formatting, metadata, or document structure
    - Focus on: key concepts, definitions, important facts, relationships between ideas, processes, and examples
    - Questions must be specific and clear
    - Answers must be concise but complete (1-3 sentences max)
    - Never ask "what is the title" or "what is the subject" or anything about the document itself
    - Write questions a teacher would ask on an exam`
        },
        {
          role: 'user',
          content: `Create 15 high quality flashcards from this text. Return ONLY a JSON array, no other text, no markdown.

    Format: [{"question": "...", "answer": "..."}]

    Text:
    ${cleanText}`
        }
      ]
    })

    const response = completion.choices[0].message.content || ''
    const cleaned = response.replace(/```json|```/g, '').trim()
    const cards = JSON.parse(cleaned)

    const userId = formData.get('userId') as string
    const { data: deck } = await supabase
      .from('decks')
      .insert({ name: deckName, card_count: cards.length, user_id: userId })
      .select()
      .single()

    const cardRows = cards.map((card: { question: string; answer: string }) => ({
      deck_id: deck.id,
      question: card.question,
      answer: card.answer,
    }))

    await supabase.from('cards').insert(cardRows)

    return Response.json({ success: true, deckId: deck.id, cardCount: cards.length })
  } catch (error: any) {
    console.error(error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}