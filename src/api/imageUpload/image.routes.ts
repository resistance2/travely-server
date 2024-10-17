import { Request, Response, Router } from 'express';
import multer, { memoryStorage } from 'multer';
import { uploadImage } from './imageUpload';

const imageRouter = Router();
const upload = multer({ storage: memoryStorage() });

imageRouter.post(
  '/upload',
  upload.single('image'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ message: '이미지 파일이 없습니다.' });
        return;
      }

      const imageUrl = await uploadImage(req.file);
      res.status(200).json({ imageUrl });
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      res.status(500).json({ message: '이미지 업로드 실패' });
    }
  },
);

export { imageRouter };
