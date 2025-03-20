import e from 'cors';
import { Request, Response, Router } from 'express';
import { Express } from 'express';
import rateLimit from 'express-rate-limit';
import multer, { memoryStorage, MulterError } from 'multer';
import { ResponseDTO } from '../../ResponseDTO';
import { generatePresignedUrl, uploadImage, uploadImages } from './imageUpload';

const imageRouter = Router();

const upload = multer({
  storage: memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 11, // Maximum 11 files (1 thumbnail + 5 meetingSpace + 5 introSrcs)
  },
});

const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  message: { message: '이미지 업로드 요청이 너무 많습니다.' },
});

imageRouter.post(
  '/upload',
  apiRateLimit,
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
  apiRateLimit,
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

imageRouter.post(
  '/presigned-url',
  apiRateLimit,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { fileName, fileType, category } = req.body;

      if (!fileName || !fileType) {
        res.status(400).json(ResponseDTO.fail('fileName, fileType은 필수 파라미터입니다.'));
        return;
      }
      if (typeof fileName !== 'string' || typeof fileType !== 'string') {
        res.status(400).json(ResponseDTO.fail('fileName, fileType은 문자열이어야 합니다.'));
        return;
      }
      const uploadCategory = category || 'general';

      if (!fileType.startsWith('image/')) {
        res.status(400).json(ResponseDTO.fail('이미지 파일만 업로드 가능합니다.'));
        return;
      }

      const { uploadUrl, fileUrl } = await generatePresignedUrl(fileType, fileName, uploadCategory);

      res.json(
        ResponseDTO.success({
          uploadUrl,
          fileUrl,
          expiresIn: 3600, // URL expires in 1 hour (seconds)
        }),
      );
    } catch (error) {
      console.error('Pre-signed URL 생성 오류:', error);
      res.status(500).json(ResponseDTO.fail('Pre-signed URL 생성 실패'));
    }
  },
);

imageRouter.post(
  '/presigned-urls/batch',
  apiRateLimit,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const files = req.body.files as Array<{
        fileName: string;
        fileType: string;
        category: string;
      }>;

      if (!Array.isArray(files)) {
        res.status(400).json(ResponseDTO.fail('files must be an array'));
        return;
      }

      const results = await Promise.all(
        files.map(async ({ fileName, fileType, category }) => {
          if (!fileType.startsWith('image/')) {
            throw new Error('Only image files are allowed');
          }
          const { uploadUrl, fileUrl } = await generatePresignedUrl(fileType, fileName, category);
          return { fileName, uploadUrl, fileUrl };
        }),
      );

      res.json(
        ResponseDTO.success({
          files: results,
          expiresIn: 3600,
        }),
      );
    } catch (error) {
      console.error('Batch pre-signed URL 생성 오류:', error);
      res.status(500).json(ResponseDTO.fail('Batch pre-signed URL 생성 실패'));
    }
  },
);

export { imageRouter };
