import { User } from "../../db/schema";

export class UserService {
  static async login(socialName: string, userEmail: string, userProfileImage: string | null = null) {
    const user = await User.findOne({
      $or: [{ userEmail }, { socialName }],
    }).lean();

    if (user) {
      return { ...user, isCreated: false };
    }

    const newUser = await User.create({
      socialName,
      userEmail,
      userProfileImage: userProfileImage || null,
    });

    return { ...newUser.toJSON(), isCreated: true };
  }

  static async updateMbti(userId: string, mbti: string) {
    const user = await User.findByIdAndUpdate(
      userId,
      { mbti },
      { new: true }
    );

    if (!user) {
      throw new Error("User not found");
    }

    return { userId: user._id };
  }

  static async updatePhoneNumber(userId: string, phoneNumber: string) {
    const user = await User.findByIdAndUpdate(
      userId,
      { phoneNumber },
      { new: true }
    );

    if (!user) {
      throw new Error("User not found");
    }

    return { userId: user._id };
  }
}
