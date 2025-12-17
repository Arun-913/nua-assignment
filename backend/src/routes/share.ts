import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import File from '../models/File.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import z, { ZodError } from 'zod';
import mongoose from 'mongoose';
import { PORT } from '../config.js';

const router = Router();

const ShareUserSchema = z.object({
  userIds: z.array(
    z.string().refine(
      (id) => mongoose.isValidObjectId(id),
      {
        message: "Invalid User Id"
      }
    )
  )
})

const ShareLinkSchema = z.object({
  expiresInHours: z.number().min(1),
})

router.post('/:id/share-users', auth, async (req: Request, res: Response): Promise<any> => {
  try {
    const validated = ShareUserSchema.parse(req.body);
    const { userIds } = validated;
    const file = await File.findOne({ _id: req.params.id, owner: req.user.id });
    if (!file) return res.status(404).json({ error: 'File not found or not owner' });
    
    const newObjectIds: mongoose.Types.ObjectId[] = [
      ...file.sharedWith,
      ...userIds.map(id => new mongoose.Types.ObjectId(id))
    ];

    const uniqueObjectIds: mongoose.Types.ObjectId[] = Array.from(
      new Set(newObjectIds.map(oid => oid.toString()))
    ).map(id => new mongoose.Types.ObjectId(id));

    file.sharedWith = uniqueObjectIds;
    await file.save();
    return res.json({ message: 'Users added to share list' });
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

router.get('/:id/users', auth, async (req: Request, res: Response): Promise<any> => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user.id });
    if (!file) return res.status(404).json({ error: 'File not found or not owner' });
    const users = await User.find({ _id: { $in: file.sharedWith } });
    return res.json(users);
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      error: "Internal server error"
    });
  }
})

router.post('/:id/share-link', auth, async (req: Request, res: Response): Promise<any> => {
  try {
    const validated = ShareLinkSchema.parse(req.body);
    const { expiresInHours = 24 } = validated;
    const file = await File.findOne({ _id: req.params.id, owner: req.user.id });
    if (!file) return res.status(404).json({ error: 'File not found or not owner' });
    
    const token = crypto.randomBytes(32).toString('hex');
    file.shareTokens.push({ token, expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000) });
    await file.save();
    
    const shareUrl = req.headers.origin ? `${req.headers.origin}/share/${token}` :  `http://localhost:${PORT}/api/share/${token}`;

    res.json({ shareUrl, token });
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

router.get('/:token', auth, async (req: Request, res: Response): Promise<any> => {
  try {
    const file = await File.findOne({
      $or:[
        {
          sharedWith: {
            $elemMatch: {
              $eq: req.user.id,
            },
          },
        },
        {
          owner: req.user.id
        }
      ],
      shareTokens: {
        $elemMatch: {
          token: req.params.token,
          expiresAt: { $gt: new Date() },
        },
      },
    });
  
    if (!file) {
      return res.status(403).json({ error: 'Invalid or expired link' });
    }
  
    if (!file.path || !file.originalName) {
      return res.status(500).json({ error: 'File metadata is corrupted' });
    }
    res.setHeader('Content-Type', file.mimetype || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    return res.download(file.path, file.originalName);
  } catch (error) {
    return res.status(400).json({
      error: "Internal server error"
    });
  }
});


export default router;
