import { Router, type Request, type Response } from 'express';
import upload from '../middleware/multerConfig.js';
import File from '../models/File.js';
import auth from '../middleware/auth.js';
import path from "path";
import fs from 'fs';

const router = Router();

router.post('/upload', auth, upload.array('files'), async (req: Request, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.files || !Array.isArray(req.files)) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedFiles = req.files as Express.Multer.File[];

    const files = uploadedFiles.map((file: Express.Multer.File) => {
      return new File({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        owner: req?.user?.id,
      });
    });

    await File.insertMany(files);

    return res.json({
      files: files.map((f) => ({
        id: f._id,
        ...f.toObject(),
      })),
    });
  } catch (error) {
    console.log(error)
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    } else {
      return res.status(400).json({ error: 'Unknown error' });
    }
  }
});

router.delete('/:id/delete', auth, async (req: Request, res: Response): Promise<any> => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const file = await File.findById(req.params.id);

  if (
    !file ||
    (file.owner.toString() !== req.user.id &&
      !file.sharedWith.some(
        (id) => id.toString() === req?.user?.id
      ))
  ) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (!file.path || !file.originalName) {
    return res.status(500).json({ error: 'File data corrupted' });
  }

  try {
    const filePath = path.resolve(file.path);
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Error deleting file from disk:', err);
      } else {
        console.log('File deleted from disk:', filePath);
      }
    });

    await File.findByIdAndDelete(req.params.id);
    return res.json({ message: 'File deleted' });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      error: "Internal server error"
    });
  }
})

router.get('/dashboard', auth, async (req: Request, res: Response): Promise<any> => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const files = await File.find({ owner: req.user.id }).select('filename originalName mimetype size uploadDate').sort({ uploadDate: -1 });

  return res.json(files);
});

router.get('/:id', auth, async (req: Request, res: Response): Promise<any> => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const file = await File.findById(req.params.id);

  if (
    !file ||
    (file.owner.toString() !== req.user.id &&
      !file.sharedWith.some(
        (id) => id.toString() === req?.user?.id
      ))
  ) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (!file.path || !file.originalName) {
    return res.status(500).json({ error: 'File data corrupted' });
  }

  // @ts-ignore
  res.setHeader('Content-Type', file?.mimetype.toString());
  const absolutePath = path.resolve(file.path!);
  return res.sendFile(absolutePath);
});

export default router;
