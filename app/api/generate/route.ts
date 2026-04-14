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
      messages: [
        {
          role: 'user',
          content: `You are an expert teacher. Read this text and create 15-20 high quality flashcards.

Rules:
- Cover key concepts, definitions, relationships, and examples
- Questions should test understanding not just memory
- Answers should be clear and concise
- Return ONLY a JSON array, no other text, no markdown

Format:
[{"question": "...", "answer": "..."}]

Text:
${cleanText}`
        }
      ]
    })

    const response = completion.choices[0].message.content || ''
    const cleaned = response.replace(/```json|```/g, '').trim()
    const cards = JSON.parse(cleaned)

    const { data: deck } = await supabase
      .from('decks')
      .insert({ name: deckName, card_count: cards.length })
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