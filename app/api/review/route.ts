import { supabase } from '@/lib/supabase'
import { sm2 } from '@/lib/sm2'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { cardId, quality } = await request.json()

    const { data: card } = await supabase
      .from('cards')
      .select('*')
      .eq('id', cardId)
      .single()

    const { repetitions, easeFactor, interval, nextReview } = sm2(
      quality,
      card.repetitions,
      card.ease_factor,
      card.interval
    )

    await supabase
      .from('cards')
      .update({ repetitions, ease_factor: easeFactor, interval, next_review: nextReview })
      .eq('id', cardId)

    return Response.json({ success: true })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}