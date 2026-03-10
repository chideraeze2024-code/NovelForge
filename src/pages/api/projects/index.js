import connectDB from '../../../lib/db'
import { Project } from '../../../lib/models'
import { requireAuth } from '../../../lib/auth'

async function handler(req, res) {
  await connectDB()
  if (req.method === 'GET') {
    const projects = await Project.find({ userId: req.user.id }).sort({ updatedAt: -1 }).select('-chapters.text')
    return res.json({ projects })
  }
  if (req.method === 'POST') {
    const { title, genre, idea } = req.body
    if (!genre) return res.status(400).json({ error: 'Genre is required' })
    const project = await Project.create({ userId: req.user.id, title: title || 'Untitled Novel', genre, idea: idea || '' })
    return res.status(201).json({ project })
  }
  res.status(405).end()
}

export default requireAuth(handler)
