import express, { type Request, type Response } from  'express';
import jwt from  'jsonwebtoken';
import bcrypt from  'bcryptjs';
import User from  '../models/User.js';
import { Router } from 'express';
import { JWT_SECRET } from '../config.js';
import z, { ZodError } from 'zod';
import auth from '../middleware/auth.js';

const router = Router();

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  name: z.string().min(3, "Name must be at least 3 characters long"),
});

const SigninSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/signup', async (req: Request, res: Response): Promise<any> => {
  try {
    const validated = SignupSchema.parse(req.body);

    const exists = await User.findOne({ email: validated.email });
    if(exists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const { email, password, name } = validated;
    const user = new User({ email, password, name });
    await user.save();
    return res.json({ message: "Signup in successful!, Please login."})
  } catch (error) {
    if(error instanceof ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        errors: error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message
        }))
      })
    }

    console.log(error);
    return res.status(400).json({
      error: "Internal server error"
    });
  }
});

router.post('/signin', async (req: Request, res: Response): Promise<any> => {
  try {
    const validated = SigninSchema.parse(req.body);
    const { email, password } = validated;
    const user = await User.findOne({ email });
    if(!user) {
      return res.status(401).json({ error: 'User not found, Please signup' });
    }
    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    return res.cookie('token', `Bearer ${token}`, {
      sameSite: 'lax',
      path: '/',
      httpOnly: true,
      secure: false,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }).json({ message: 'Signin successful!' });
  } catch (error) {
    if(error instanceof ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        errors: error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message
        }))
      })
    }
    
    console.log(error);
    return res.status(400).json({
      error: "Internal server error"
    });
  }
});

router.get('/check-login', async (req: Request, res: Response): Promise<any> => {
  try {
    const token = req.cookies['token']?.replace('Bearer ', '');
    console.log(req.cookies);
    if(!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if(typeof decoded === "string") {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const user = await User.findById(decoded.userId);
    if(!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(200).json({ userId: user._id, name: user.name, email: user.email });
  } catch(error) {
    console.log(error);
    return res.status(400).json({
      error: "Internal server error"
    });
  }
});

router.get('/logout', async (req: Request, res: Response): Promise<any> => {
  try {
    return res.clearCookie('token').json({ message: 'Logout successfull!' });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      error: "Internal server error"
    });
  }
});

router.get('/users', auth, async (req: Request, res: Response): Promise<any> => {
  try {
    const users = await User.find({_id: { $ne: req.user.id }}).select('name email');
    return res.json(users);
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      error: "Internal server error"
    });
  }
});

export default router;