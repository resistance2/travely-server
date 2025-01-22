import mongoose from 'mongoose';
import { User, UserRating } from '../../db/schema';

export class UserService {
  static async login(
    socialName: string,
    userEmail: string,
    userProfileImage: string | null = null,
  ) {
    const user = await User.findOne({
      $or: [{ userEmail }, { socialName }],
    }).lean();

    if (!user) {
      const newUser = await User.create({
        socialName,
        userEmail,
        userProfileImage: userProfileImage || null,
      });
      await newUser.save();

      return {
        userId: newUser._id,
        userScore: 0,
      };
    } else {
      const userScore = await this.getUserReviewAverage(user._id);
      return {
        userId: user._id,
        userScore,
      };
    }
  }

  static async updateMbti(userId: string, mbti: string) {
    const user = await User.findByIdAndUpdate(userId, { mbti }, { new: true });

    if (!user) {
      throw new Error('User not found');
    }

    return { userId: user._id };
  }

  static async updatePhoneNumber(userId: string, phoneNumber: string) {
    const user = await User.findByIdAndUpdate(userId, { phoneNumber }, { new: true });

    if (!user) {
      throw new Error('User not found');
    }

    return { userId: user._id };
  }

  static getUserReviewAverage = async (userId: mongoose.Types.ObjectId) => {
    const userRatings = await UserRating.find({ toUserId: userId }).lean();

    if (!userRatings) return 0;
    if (userRatings.length === 0) return 0;

    const averageScore =
      userRatings.reduce((sum, rating) => sum + rating.userScore, 0) / userRatings.length;
    return Number(averageScore.toFixed(1));
  };
}
