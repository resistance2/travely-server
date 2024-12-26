import mongoose from "mongoose";

export const validObjectId = (id: string): boolean => {
  // Check if the id is a valid ObjectId
  // 16진수 문자열로 변환된 24바이트의 ObjectId를 검증합니다.
  return mongoose.Types.ObjectId.isValid(id);
};
