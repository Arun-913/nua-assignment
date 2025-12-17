import dotenv from 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { MONGODB_URI, PORT } from './config.js';
import AuthRouter from './routes/auth.js';
import FileRouter from './routes/file.js';
import ShareRouter from './routes/share.js';
import cookieParser from 'cookie-parser';
import { dirname, join } from "path";
import fs from 'fs';
import { fileURLToPath } from 'url';

const allowedOrigins = [
  'http://localhost:5173',
  'http://172.16.6.22:5173',
  'https://nua.arundev.in'
];

const app = express();

app.use(helmet());
app.use(cookieParser());
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.options('/api/files/upload', cors());
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('combined'));

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const uploadDir = join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
await mongoose.connect(MONGODB_URI);

// Routes
app.use('/api/auth', AuthRouter);
app.use('/api/files', FileRouter);
app.use('/api/share', ShareRouter);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
