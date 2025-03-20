import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME || '';
const CLOUDFRONT_URL = process.env.CLOUDFRONT_URL || '';

export const generateFileName = (originalname: string) => {
  const extension =
    originalname.lastIndexOf('.') > -1
      ? originalname.slice(originalname.lastIndexOf('.') + 1).toLowerCase()
      : '';
  return extension ? `${uuidv4()}.${extension}` : uuidv4();
};

export const uploadImage = async (file: Express.Multer.File): Promise<string> => {
  try {
    const fileName = generateFileName(file.originalname);
    const key = `uploads/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await s3Client.send(command);
    console.log('S3 업로드 성공:', key);
    return `${CLOUDFRONT_URL}/${key}`;
  } catch (error) {
    console.error('S3 업로드 오류:', error);
    throw new Error('이미지 업로드 실패');
  }
};

export const uploadImages = async (files: Express.Multer.File[]): Promise<string[]> => {
  const uploadPromises = files.map(async (file) => uploadImage(file));
  try {
    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    console.error('이미지 업로드 오류:', error);
    throw new Error('이미지 업로드 실패');
  }
};

export async function generatePresignedUrl(
  fileType: string,
  fileName: string,
  category: string,
): Promise<{ uploadUrl: string; fileUrl: string }> {
  const key = `uploads/${category}/${Date.now()}-${uuidv4()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: fileType,
  });

  try {
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL expires in 1 hour

    if (!uploadUrl || uploadUrl.length === 0) {
      throw new Error('유효하지 않은 업로드 URL입니다.');
    }

    const fileUrl = `${CLOUDFRONT_URL}/${key}`;

    return { uploadUrl, fileUrl };
  } catch (error) {
    console.error('Pre-signed URL 생성 오류:', error);
    throw new Error('Pre-signed URL 생성 실패');
  }
}

// class UploadError extends Error {
//   constructor(
//     message: string,
//     public cause?: unknown,
//   ) {
//     super(message);
//     this.name = 'UploadError';
//   }
// }
