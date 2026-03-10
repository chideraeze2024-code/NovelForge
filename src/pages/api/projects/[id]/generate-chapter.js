import connectDB from '../../../../lib/db'
import { Project } from '../../../../lib/models'
import { requireAuth } from '../../../../lib/auth'
import { generateChapter, summarizeChapter } from '../../../../lib/ai'

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  await connectDB()
  const { id } = req.query
  const { chapterNumber, prevSummary } = req.body
  const project = await Project.findOne({ _id: id, userId: req.user.id })
  if (!project) return res.status(404).json({ error: 'Project not found' })
  if (!project.paid) return res.status(403).json({ error: 'Payment required' })
  if (!project.outline) return res.status(400).json({ error: 'Generate outline first' })
  if (chapterNumber > project.maxChapters) return res.status(400).json({ error: 'Exceeds package limit' })
  try {
    const text = await generateChapter(project.outline, chapterNumber, prevSummary)
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length
    const outlineChap = project.outline.chapterOutlines?.find(c => c.chapter === chapterNumber)
    const title = outlineChap?.title || `Chapter ${chapterNumber}`
    const chapter = { number: chapterNumber, title, text, wordCount, generatedAt: new Date() }
    const summary = await summarizeChapter(text)
    const existing = project.chapters.findIndex(c => c.number === chapterNumber)
    if (existing >= 0) project.chapters[existing] = chapter
    else project.chapters.push(chapter)
    const totalWords = project.chapters.reduce((s, c) => s + (c.wordCount || 0), 0)
    const isComplete = project.chapters.length >= project.maxChapters
    await Project.findByIdAndUpdate(id, { chapters: project.chapters, totalWords, status: isComplete ? 'complete' : 'generating', updatedAt: new Date() })
    res.json({ chapter, summary, isComplete })
  } catch (err) {
    res.status(500).json({ error: 'Chapter generation failed: ' + err.message })
  }
}

export default requireAuth(handler)
