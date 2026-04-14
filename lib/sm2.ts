export function sm2(quality: number, repetitions: number, easeFactor: number, interval: number) {
  if (quality >= 3) {
    if (repetitions === 0) interval = 1
    else if (repetitions === 1) interval = 6
    else interval = Math.round(interval * easeFactor)
    repetitions += 1
  } else {
    repetitions = 0
    interval = 1
  }

  easeFactor = easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  if (easeFactor < 1.3) easeFactor = 1.3

  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + interval)

  return { repetitions, easeFactor, interval, nextReview }
}