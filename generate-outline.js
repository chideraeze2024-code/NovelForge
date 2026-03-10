// src/pages/api/projects/[id]/generate-outline.js
import connectDB from '../../../../lib/db'
import { Project } from '../../../../lib/models'
import { requireAuth } from '../../../../lib/auth'
import { generateOutline } from '../../../../lib/ai'

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  await connectDB()
  const { id } = req.query

  const project = await Project.findOne({ _id: id, userId: req.user.id })
  if (!project) return res.status(404).json({ error: 'Project not found' })
  if (!project.paid) return res.status(403).json({ error: 'Payment required to generate' })

  try {
    const outline = await generateOutline(project.genre, project.title, project.idea)
    const updated = await Project.findByIdAndUpdate(
      id,
      { outline, title: outline.title || project.title, status: 'generating', updatedAt: new Date() },
      { new: true }
    )
    res.json({ outline, project: updated })
  } catch (err) {
    res.status(500).json({ error: 'AI generation failed: ' + err.message })
  }
}

export default requireAuth(handler)
