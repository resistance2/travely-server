import { describe, expect, test } from 'bun:test';
import path from 'path';
import { fileURLToPath } from 'url';
import { Express } from 'express';
import { readFile } from 'fs/promises';
import { generatePresignedUrl, uploadImages } from './imageUpload';

interface MockFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

const test_image = `${process.cwd()}/src/api/imageUpload/test-images/image1.jpg`;

const test_image2 = {
  fileURLToPath: `${process.cwd()}/src/api/imageUpload/test-images/image2.jpg`,
  fileName: 'image2.jpg',
};

async function createMockFile(filePath: string): Promise<MockFile> {
  const buffer = await readFile(filePath);
  return {
    fieldname: 'file',
    originalname: path.basename(filePath),
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: buffer,
    size: buffer.length,
  };
}

describe('Image Upload Tests', () => {
  test('should upload images successfully', async () => {
    const imagePaths = [test_image, test_image2];

    const requiredEnvVars = [
      'AWS_REGION',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
      'AWS_BUCKET_NAME',
      'CLOUDFRONT_URL',
    ];

    requiredEnvVars.forEach((varName) => {
      expect(process.env[varName]).toBeDefined();
    });

    const mockFiles = await Promise.all(imagePaths.map((path) => createMockFile(path)));
    const urls = await uploadImages(mockFiles as Express.Multer.File[]);

    expect(urls).toBeDefined();
    expect(Array.isArray(urls)).toBe(true);
    expect(urls.length).toBe(2);
    urls.forEach((url) => {
      expect(typeof url).toBe('string');
      expect(url.startsWith('http')).toBe(true);
    });
  });
});

describe('Image Upload by Presigned URL', () => {
  test('should generate presigned URLs successfully', async () => {
    const fileType = 'image/jpeg';
    const fileName = test_image2.fileName;
    const category = 'test-category';

    const { uploadUrl, fileUrl } = await generatePresignedUrl(fileType, fileName, category);
    expect(uploadUrl).toBeDefined();
    expect(fileUrl).toBeDefined();
    expect(uploadUrl.startsWith('https://')).toBe(true);
    expect(fileUrl.startsWith('https://')).toBe(true);
    expect(fileUrl).toContain(fileName);
    expect(fileUrl).toContain(category);
    expect(fileUrl).toContain('uploads');

    try {
      const fileContent = await readFile(test_image2.fileURLToPath);
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': fileType,
        },
        body: fileContent,
      });

      expect(response.status).toBe(200);
      expect(response.ok).toBe(true);
      const fileUrlResponse = await fetch(fileUrl);
      console.log('File URL:', fileUrlResponse.url);

      expect(fileUrlResponse.status).toBe(200);
    } catch (error) {
      console.error('Error during upload:', error);
      throw new Error('Upload failed');
    }
  });
});
