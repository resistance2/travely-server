import { Request, Response, Router } from 'express';
import multer, { memoryStorage } from 'multer';
import { uploadImages } from './imageUpload';

const imageRouter = Router();
const upload = multer({ storage: memoryStorage() });

imageRouter.post(
  '/upload',
  upload.array('images', 10), // 최대 10개의 이미지를 허용합니다. 필요에 따라 조정하세요.
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.files || req.files.length === 0) {
        res.status(400).json({ message: '이미지 파일이 없습니다.' });
        return;
      }

      const imageUrls = await uploadImages(req.files as Express.Multer.File[]);
      res.status(200).json({ imageUrls });
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      res.status(500).json({ message: '이미지 업로드 실패' });
    }
  },
);

export { imageRouter };
