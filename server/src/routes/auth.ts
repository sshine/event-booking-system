import express from 'express';
import { body, validationResult } from 'express-validator';
import { database } from '../models/database';
import { CreateUserRequest, LoginRequest, User } from '../types';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

const validateRegister = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').isLength({ min: 1 }).trim().escape(),
];

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 1 }),
];

const validateEmailCheck = [
  body('email').isEmail().normalizeEmail(),
];

router.post('/register', validateRegister, async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name }: CreateUserRequest = req.body;
    const db = database.getDb();

    db.get('SELECT id FROM users WHERE email = ?', [email], async (err: any, existingUser: any) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      try {
        const hashedPassword = await hashPassword(password);

        const insertQuery = `
          INSERT INTO users (email, password, name, role)
          VALUES (?, ?, ?, 'user')
        `;

        db.run(insertQuery, [email, hashedPassword, name], function(err: any) {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to create user' });
          }

          const newUser = {
            id: this.lastID,
            email,
            name,
            role: 'user' as const,
            created_at: new Date().toISOString()
          };

          const token = generateToken(newUser);

          res.status(201).json({
            message: 'User registered successfully',
            user: newUser,
            token
          });
        });
      } catch (hashError) {
        console.error('Password hashing error:', hashError);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', validateLogin, async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password }: LoginRequest = req.body;
    const db = database.getDb();

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err: any, user: User) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      try {
        const isValidPassword = await comparePassword(password, user.password);

        if (!isValidPassword) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const userWithoutPassword = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          created_at: user.created_at
        };

        const token = generateToken(userWithoutPassword);

        res.json({
          message: 'Login successful',
          user: userWithoutPassword,
          token
        });
      } catch (compareError) {
        console.error('Password comparison error:', compareError);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const db = database.getDb();

    db.get('SELECT id, email, name, role, created_at FROM users WHERE id = ?', [req.user!.id], (err: any, user: any) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user });
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', authenticateToken, async (req: AuthenticatedRequest, res: express.Response) => {
  res.json({ message: 'Logged out successfully' });
});

router.post('/check-email', validateEmailCheck, async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const db = database.getDb();

    db.get('SELECT id, name FROM users WHERE email = ?', [email], (err: any, user: any) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        exists: !!user,
        name: user?.name || null
      });
    });
  } catch (error) {
    console.error('Email check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;