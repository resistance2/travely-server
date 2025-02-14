import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
});

export const generateFileName = (originalname: string) => {
  return `${uuidv4()}.${originalname.split('.').slice(-1)[0]}`;
};

export const uploadImage = async (file: Express.Multer.File): Promise<string> => {
  const fileName = generateFileName(file.originalname);

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME as string,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    return `${process.env.CLOUDFRONT_URL}/${fileName}`;
  } catch (error) {
    console.error('S3 업로드 오류:', error);
    throw new Error('이미지 업로드 실패');
  }
};

export const uploadImages = async (files: Express.Multer.File[]): Promise<string[]> => {
  const uploadPromises = files.map(async (file) => {
    const fileName = generateFileName(file.originalname);

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME as string,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    try {
      await s3Client.send(new PutObjectCommand(params));
      return `${process.env.CLOUDFRONT_URL}/${fileName}`;
    } catch (error) {
      console.error('S3 업로드 오류:', error);
      throw new Error('이미지 업로드 실패');
    }
  });

  return Promise.all(uploadPromises);
};
// curl -X POST -H "Content-Type: multipart/form-data" -F "image=@server/src/1.jpeg" http://3.37.101.147:3000/api/images/upload
// curl -X POST -H "Content-Type: multipart/form-data" -F "image=@src/1.jpeg" http://3.37.101.147:3000/api/images/upload
