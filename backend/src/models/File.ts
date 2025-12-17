import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  mimetype: String,
  size: Number,
  path: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploadDate: { type: Date, default: Date.now },
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  shareTokens: [{ token: String, expiresAt: Date }]
});

const File = mongoose.model('File', fileSchema);
export default File;