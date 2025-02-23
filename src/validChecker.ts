import mongoose from 'mongoose';

export const validObjectId = (id: string): boolean => {
  // Check if the id is a valid ObjectId
  // 16진수 문자열로 변환된 24바이트의 ObjectId를 검증합니다.
  return mongoose.Types.ObjectId.isValid(id);
};

export const checkIsValidImage = async (imageURL: string) => {
  try {
    if (!imageURL.startsWith('http://') && !imageURL.startsWith('https://')) {
      return false;
    } else if (
      !imageURL.endsWith('.jpg') &&
      !imageURL.endsWith('.jpeg') &&
      !imageURL.endsWith('.png')
    ) {
      return false;
    }
    const response = await fetch(imageURL, { method: 'HEAD' });
    console.log(response);
    if (!response.ok || response.headers.get('Content-Type')?.indexOf('image/') === -1) {
      throw new Error('Invalid image URL');
    }
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

// 점수 유효성 검증
// 1~5점
export const checkIsValidScore = (score: number): boolean => {
  if (typeof score !== 'number') {
    return false;
  }
  if (score < 1 || score > 5) {
    return false;
  }
  return true;
};

//010-1234-5678
export const checkIsValidPhoneNumber = (phoneNumber: string): boolean => {
  const regex = /^\d{3}-\d{4}-\d{4}$/;
  return regex.test(phoneNumber);
};

// MBTI 유효성 검증
const MBTI_TYPES = [
  'ISTJ',
  'ISFJ',
  'INFJ',
  'INTJ',
  'ISTP',
  'ISFP',
  'INFP',
  'INTP',
  'ESTP',
  'ESFP',
  'ENFP',
  'ENTP',
  'ESTJ',
  'ESFJ',
  'ENFJ',
  'ENTJ',
] as const;

export const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

export const checkIsValidMBTI = (mbti: (typeof MBTI_TYPES)[number]): boolean => {
  return MBTI_TYPES.includes(mbti);
};

export const isValidNumber = (value: Number): boolean => {
  if (typeof value !== 'number') return false;
  if (!isFinite(value)) return false;
  return true;
};

export const checkPageAndSize = (page: number, size: number): boolean => {
  const isValidPage = isValidNumber(page);
  const isValidSize = isValidNumber(size);
  if (!isValidPage || !isValidSize) return false;
  return true;
};
