import mongoose from "mongoose";

export const validObjectId = (id: string): boolean => {
  // Check if the id is a valid ObjectId
  // 16진수 문자열로 변환된 24바이트의 ObjectId를 검증합니다.
  return mongoose.Types.ObjectId.isValid(id);
};


export const checkIsValidThumbnail = async (thumbnail: string) => {
  if(!thumbnail.startsWith("http://") && !thumbnail.startsWith("https://")) {
    return false;
  } else if(!thumbnail.endsWith(".jpg") && !thumbnail.endsWith(".jpeg") && !thumbnail.endsWith(".png")) {
    return false;
  } 
  try {
    const response = await fetch(thumbnail);
    if (!response.ok) {
      throw new Error("Invalid thumbnail URL");
    }
  } catch (error) {
    console.error(error);
    return false;
  }
  return true;
}