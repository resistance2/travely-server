import { Request, Response, Router } from 'express';
import multer, { memoryStorage } from 'multer';
import { uploadImages } from './imageUpload';

const imageRouter = Router();
const upload = multer({ storage: memoryStorage() });

imageRouter.post(
  '/upload',
  upload.array('images', 10),
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

// curl -X POST -H "Content-Type: multipart/form-data" -F "images=@1.jpeg" -F "images=@1.jpeg" -F "images=@1.jpeg" http://localhost:3000/api/images/upload
// 이렇게 여러개 이미지를 넣으면 이렇게 반환됩니다.
// {"imageUrls":["https://d25zqr3uop6qu8.cloudfront.net/fb5f5d18-61c2-4ede-b90c-4d454526b717.jpeg","https://d25zqr3uop6qu8.cloudfront.net/2dc24822-1e96-424f-b5b5-c93ea98889d3.jpeg","https://d25zqr3uop6qu8.cloudfront.net/b4282321-eb7b-4dcc-82f9-28a26da6f113.jpeg"]}%
