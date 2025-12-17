import multer from 'multer';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const originalName = file.originalname ?? 'file';
    cb(null, `${Date.now()}-${originalName}`);
  },
});

// if allow only specific file type
// const fileFilter: multer.Options['fileFilter'] = (
//   req,
//   file,
//   cb
// ) => {
//   const allowedTypes = [
//     'image/',
//     'application/pdf',
//     'text/csv',
//     'text/plain',
//   ];

//   if (allowedTypes.some(type => file.mimetype.startsWith(type))) {
//     cb(null, true);
//   } else {
//     cb(new Error('Invalid file type'));
//   }
// };

const upload = multer({
  storage,
  // fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

export default upload;
