import { Router } from 'express'
import { loginUser, registerUser, signToken } from '../auth.js'
import { requireAuth, type AuthedRequest } from '../middleware.js'

const router = Router()

router.post('/register', (req, res) => {
  try {
    const { username, password } = req.body ?? {}
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' })
      return
    }
    const user = registerUser(String(username), String(password))
    const token = signToken(user)
    res.json({ user, token })
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Registration failed' })
  }
})

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body ?? {}
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' })
      return
    }
    const user = loginUser(String(username), String(password))
    const token = signToken(user)
    res.json({ user, token })
  } catch (err) {
    res.status(401).json({ error: err instanceof Error ? err.message : 'Login failed' })
  }
})

router.get('/me', requireAuth, (req: AuthedRequest, res) => {
  res.json({ user: req.user })
})

export default router
