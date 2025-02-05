import path from 'path';
import { Express } from 'express';
import { readFile } from 'fs/promises';
import { uploadImages } from './imageUpload'; // 여러분의 uploadImages 파일 경로에 맞게 수정하세요
// Multer.File 인터페이스를 흉내내는 타입
interface MockFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

async function createMockFile(filePath: string): Promise<MockFile> {
  const buffer = await readFile(filePath);
  return {
    fieldname: 'file',
    originalname: path.basename(filePath),
    encoding: '7bit',
    mimetype: 'image/jpeg', // 실제 파일 형식에 맞게 수정하세요
    buffer: buffer,
    size: buffer.length,
  };
}

async function testImageUpload() {
  try {
    //현재 경로를 리턴
    const currentDir = process.cwd();
    console.log('현재 경로:', currentDir);
    // 테스트할 이미지 파일들의 경로
    const imagePaths = [
      `${currentDir}\\src\\api\\imageUpload\\test-images\\image1.jpg`,
      `${currentDir}\\src\\api\\imageUpload\\test-images\\image2.jpg`,
    ];

    // 각 이미지 파일을 MockFile 객체로 변환
    const mockFiles = await Promise.all(imagePaths.map((path) => createMockFile(path)));

    // uploadImages 함수 실행
    const urls = await uploadImages(mockFiles as Express.Multer.File[]);

    console.log('업로드 성공! 생성된 URL들:');
    urls.forEach((url, index) => {
      console.log(`이미지 ${index + 1}: ${url}`);
    });
  } catch (error) {
    console.error('테스트 실패:', error);
  }
}

// 환경변수 확인
const requiredEnvVars = [
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_BUCKET_NAME',
  'CLOUDFRONT_URL',
];

const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

// 테스트 실행
testImageUpload();
