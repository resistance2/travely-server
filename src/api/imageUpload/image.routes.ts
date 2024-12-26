import { Request, Response, Router } from "express";
import multer, { memoryStorage } from "multer";
import { uploadImages } from "./imageUpload";
import { CLIENT_RENEG_LIMIT } from "tls";

const imageRouter = Router();
const upload = multer({ storage: memoryStorage() });

imageRouter.post(
  "/upload",
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "meetingSpace", maxCount: 5 },
    { name: "introSrcs", maxCount: 5 },
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.files) {
        res.status(400).json({ message: "이미지 파일이 없습니다." });
        return;
      }

      const files = req.files;

      const result: { [key: string]: string[] } = {
        thumbnail: [],
        meetingSpace: [],
        introSrcs: [],
      };

      // 각 카테고리별 이미지 업로드 처리
      for (const [category, categoryFiles] of Object.entries(files)) {
        if (categoryFiles && categoryFiles.length > 0) {
          const urls = await uploadImages(categoryFiles);
          result[category as keyof typeof result] = urls;
        }
      }

      res.status(200).json(result);
    } catch (error) {
      console.error("이미지 업로드 오류:", error);
      res.status(500).json({ message: "이미지 업로드 실패" });
    }
  }
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
