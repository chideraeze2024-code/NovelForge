// src/pages/api/projects/[id].js
import connectDB from '../../../lib/db'
import { Project } from '../../../lib/models'
import { requireAuth } from '../../../lib/auth'

async function handler(req, res) {
  await connectDB()
  const { id } = req.query

  const project = await Project.findOne({ _id: id, userId: req.user.id })
  if (!project) return res.status(404).json({ error: 'Project not found' })

  if (req.method === 'GET') {
    return res.json({ project })
  }

  if (req.method === 'PATCH') {
    const allowed = ['title', 'genre', 'idea', 'outline', 'chapters', 'status', 'totalWords']
    const updates = {}
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key]
    }
    updates.updatedAt = new Date()

    const updated = await Project.findByIdAndUpdate(id, updates, { new: true })
    return res.json({ project: updated })
  }

  if (req.method === 'DELETE') {
    await Project.findByIdAndDelete(id)
    return res.json({ success: true })
  }

  res.status(405).end()
}

export default requireAuth(handler)
