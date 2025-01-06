import mongoose from 'mongoose';

export const validObjectId = (id: string): boolean => {
  // Check if the id is a valid ObjectId
  // 16진수 문자열로 변환된 24바이트의 ObjectId를 검증합니다.
  return mongoose.Types.ObjectId.isValid(id);
};

export const checkIsValidImage = async (image: string) => {
  try {
    if (!image.startsWith('http://') && !image.startsWith('https://')) {
      return false;
    } else if (!image.endsWith('.jpg') && !image.endsWith('.jpeg') && !image.endsWith('.png')) {
      return false;
    }
    const response = await fetch(image);
    if (!response.ok) {
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
export const checkIsValidMBTI = (mbti: (typeof MBTI_TYPES)[number]): boolean => {
  return MBTI_TYPES.includes(mbti);
};
