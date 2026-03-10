import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const GENRES = {
  billionaire: 'Billionaire Romance',
  werewolf: 'Werewolf Romance',
  mafia: 'Mafia Romance',
  dark: 'Dark Romance',
  fantasy: 'Fantasy Romance',
  ceo: 'CEO Romance',
  campus: 'Campus Romance',
}

export async function generateOutline(genre, title, idea) {
  const genreName = GENRES[genre] || genre
  const prompt = `You are a bestselling webnovel author for GoodNovel. Create a novel outline${title ? ` titled "${title}"` : ''}${idea ? ` based on: ${idea}` : ''}. Genre: ${genreName}. Return ONLY valid JSON no markdown: {"title":"","genre":"","logline":"","mainCharacters":[{"name":"","role":"","description":""}],"background":"","chapterOutlines":[{"chapter":1,"title":"","summary":""}],"themes":[]}`

  const msg = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = msg.content.map(b => b.text || '').join('')
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Failed to parse outline')
  return JSON.parse(match[0])
}

export async function generateChapter(outline, chapterNum, prevSummary = '') {
  const genreName = GENRES[outline.genre] || outline.genre
  const chOutline = outline.chapterOutlines?.find(c => c.chapter === chapterNum) || { title: `Chapter ${chapterNum}`, summary: 'Continue with rising tension.' }
  const chars = outline.mainCharacters?.map(c => `${c.name} (${c.role}): ${c.description}`).join('\n') || ''

  const prompt = `You are a bestselling webnovel author writing for GoodNovel. Write Chapter ${chapterNum} of "${outline.title}" (${genreName}). Setting: ${outline.background}. Characters:\n${chars}\nChapter plan: "${chOutline.title}" - ${chOutline.summary}${prevSummary ? `\nPrevious chapter: ${prevSummary}` : ''}. Write EXACTLY 2000 words. Start with a gripping opening. Include intense romantic tension. End with a HEART-STOPPING cliffhanger. Begin:\n\n**Chapter ${chapterNum}: ${chOutline.title}**`

  const msg = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }],
  })

  return msg.content.map(b => b.text || '').join('')
}

export async function summarizeChapter(text) {
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{ role: 'user', content: `Summarize this novel chapter in 2-3 sentences for continuity: ${text.substring(0, 1500)}` }],
  })
  return msg.content.map(b => b.text || '').join('')
}
