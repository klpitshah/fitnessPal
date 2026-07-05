import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import { db } from './db.js'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'
const JWT_EXPIRES = '30d'

export interface AuthUser {
  id: string
  username: string
}

export interface JwtPayload {
  sub: string
  username: string
}

export function registerUser(username: string, password: string): AuthUser {
  const trimmed = username.trim()
  if (trimmed.length < 3) throw new Error('Username must be at least 3 characters')
  if (password.length < 6) throw new Error('Password must be at least 6 characters')

  const existing = db.prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE').get(trimmed)
  if (existing) throw new Error('Username already taken')

  const id = randomUUID()
  const passwordHash = bcrypt.hashSync(password, 10)
  const now = Date.now()

  db.prepare('INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)').run(
    id,
    trimmed,
    passwordHash,
    now,
  )

  db.prepare(
    'INSERT INTO goals (user_id, calories, protein, carbs, fat, sugar) VALUES (?, 2000, 150, 200, 65, 50)',
  ).run(id)

  return { id, username: trimmed }
}

export function loginUser(username: string, password: string): AuthUser {
  const row = db
    .prepare('SELECT id, username, password_hash FROM users WHERE username = ? COLLATE NOCASE')
    .get(username.trim()) as { id: string; username: string; password_hash: string } | undefined

  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    throw new Error('Invalid username or password')
  }

  return { id: row.id, username: row.username }
}

export function signToken(user: AuthUser): string {
  return jwt.sign({ sub: user.id, username: user.username } satisfies JwtPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES,
  })
}

export function verifyToken(token: string): AuthUser {
  const payload = jwt.verify(token, JWT_SECRET) as JwtPayload
  return { id: payload.sub, username: payload.username }
}

export function getUserById(id: string): AuthUser | null {
  const row = db.prepare('SELECT id, username FROM users WHERE id = ?').get(id) as
    | AuthUser
    | undefined
  return row ?? null
}
