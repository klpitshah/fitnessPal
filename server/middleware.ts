import type { NextFunction, Request, Response } from 'express'
import { getUserById, verifyToken, type AuthUser } from './auth.js'

export interface AuthedRequest extends Request {
  user?: AuthUser
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  try {
    const user = verifyToken(header.slice(7))
    const existing = getUserById(user.id)
    if (!existing) {
      res.status(401).json({ error: 'Invalid session' })
      return
    }
    req.user = existing
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' })
  }
}
