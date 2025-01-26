import { Request, Response, Router } from 'express';
import { Express } from 'express';
import multer, { memoryStorage, MulterError } from 'multer';
import { ResponseDTO } from '../../ResponseDTO';
import { uploadImage, uploadImages } from './imageUpload';

const imageRouter = Router();
const upload = multer({
  storage: memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 11, // Maximum 11 files (1 thumbnail + 5 meetingSpace + 5 introSrcs)
  },
});

imageRouter.post(
  '/upload',
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'meetingSpace', maxCount: 5 },
    { name: 'introSrcs', maxCount: 5 },
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const imageFiles = req.files as {
        thumbnail?: Express.Multer.File[];
        meetingSpace?: Express.Multer.File[];
        introSrcs?: Express.Multer.File[];
      };
      if (
        !imageFiles ||
        (!imageFiles?.thumbnail && !imageFiles?.meetingSpace && !imageFiles?.introSrcs)
      ) {
        res.status(400).json({ message: '이미지 파일이 없습니다.' });
        return;
      }

      const result: { [key: string]: string[] } = {
        thumbnail: [],
        meetingSpace: [],
        introSrcs: [],
      };

      // 각 카테고리별 이미지 업로드 처리
      for (const [category, categoryFiles] of Object.entries(imageFiles)) {
        if (categoryFiles && categoryFiles.length > 0) {
          const urls = await uploadImages(categoryFiles);
          result[category as keyof typeof result] = urls;
        }
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      res.status(500).json({ message: '이미지 업로드 실패' });
    }
  },
);

// 단일 이미지 업로드
imageRouter.post(
  '/upload/single',
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const imageUrl = await uploadImage(req.file!);
      res.json(ResponseDTO.success({ imageUrl }));
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      res.status(500).json(ResponseDTO.fail('이미지 업로드 실패'));
    }
  },
);

export { imageRouter };

// curl -X POST \
//   -H "Content-Type: multipart/form-data" \
//   -F "thumbnail=@image1.jpg" \
//   -F "meetingSpace=@image2.jpg" \
//   -F "meetingSpace=@image3.jpg" \
//   -F "introSrcs=@image4.jpg" \
//   -F "introSrcs=@image5.jpg" \
//   http://localhost:3000/api/images/upload

//   {
//     "thumbnail": ["https://cloudfront.url/image1.jpg"],
//     "meetingSpace": [
//       "https://cloudfront.url/image2.jpg",
//       "https://cloudfront.url/image3.jpg"
//     ],
//     "introSrcs": [
//       "https://cloudfront.url/image4.jpg",
//       "https://cloudfront.url/image5.jpg"
//     ]
//   }
