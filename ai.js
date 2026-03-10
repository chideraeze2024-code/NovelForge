// src/lib/ai.js
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
  const prompt = `You are a bestselling webnovel author for GoodNovel, Dreame, and MegaNovel.

Create a gripping novel outline${title ? ` titled "${title}"` : ''}${idea ? ` based on: ${idea}` : ''}.
Genre: ${genreName}

Return ONLY valid JSON, no markdown, no backticks:
{
  "title": "Compelling Title Here",
  "genre": "${genreName}",
  "logline": "One irresistible sentence about the story",
  "mainCharacters": [
    {"name": "Name", "role": "Female Lead", "description": "Vivid description"},
    {"name": "Name", "role": "Male Lead", "description": "Vivid description"},
    {"name": "Name", "role": "Antagonist", "description": "Vivid description"}
  ],
  "background": "Rich 3-sentence world/setting description",
  "chapterOutlines": [
    {"chapter": 1, "title": "Title", "summary": "What happens - 2 sentences"},
    {"chapter": 2, "title": "Title", "summary": "What happens - 2 sentences"},
    ...up to 70 chapters total
  ],
  "themes": ["Forbidden love", "Power dynamics", "Redemption"]
}

Make it dramatic, emotionally intense, with maximum romantic tension and plot twists.`

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
  const chOutline = outline.chapterOutlines?.find(c => c.chapter === chapterNum) ||
    { title: `Chapter ${chapterNum}`, summary: 'Continue with rising tension and emotional stakes.' }
  const chars = outline.mainCharacters?.map(c => `${c.name} (${c.role}): ${c.description}`).join('\n') || ''

  const prompt = `You are a bestselling webnovel author writing for GoodNovel. Write Chapter ${chapterNum} of "${outline.title}" (${genreName}).

STORY INFO:
Setting: ${outline.background}
Characters:
${chars}

CHAPTER PLAN: "${chOutline.title}"
${chOutline.summary}
${prevSummary ? `\nPREVIOUS CHAPTER SUMMARY: ${prevSummary}` : ''}

CRITICAL WRITING RULES:
1. Write EXACTLY 2000 words — count carefully
2. Open with a GRIPPING first sentence that hooks immediately
3. Build intense romantic chemistry between leads
4. Create emotional highs and devastating lows
5. Include vivid, sensory descriptions of settings
6. Write dialogue that reveals character and advances plot
7. Layer in secrets, misunderstandings, and revelations
8. End with a HEART-STOPPING cliffhanger — the reader MUST click next
9. Match ${genreName} genre conventions perfectly
10. Write in third-person limited POV

Begin the chapter now:

**Chapter ${chapterNum}: ${chOutline.title}**`

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
    messages: [{
      role: 'user',
      content: `Summarize this novel chapter in 2-3 sentences for continuity. Focus on plot developments and character changes: ${text.substring(0, 1500)}`,
    }],
  })
  return msg.content.map(b => b.text || '').join('')
}
