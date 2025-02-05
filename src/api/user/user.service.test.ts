import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import mongoose from 'mongoose';
import { User, UserRating } from '../../db/schema';
import { UserService } from './user.service';

import { MongoMemoryServer } from 'mongodb-memory-server';

describe('UserService', () => {
  // Setup MongoDB connection before tests
  let mongoServer: MongoMemoryServer;
  beforeAll(async () => {
    // Replace with your actual MongoDB connection string
    mongoServer = await MongoMemoryServer.create();
    const mongoURI = mongoServer.getUri();
    await mongoose.connect(mongoURI);
  });

  // Clean up database before each test
  beforeEach(async () => {
    await User.deleteMany({});
    await UserRating.deleteMany({});
  });

  // Close MongoDB connection after tests
  afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe('getUserReviewAverage', () => {
    it.only('should calculate user review average correctly', async () => {
      const user = await User.create({
        socialName: 'testUser',
        userEmail: 'test@example.com',
      });

      const user2 = await User.create({
        socialName: 'testUser2',
        userEmail: 'test@example.com',
      });

      await UserRating.create([
        { toUserId: user._id, userScore: 4, fromUserId: user2._id },
        { toUserId: user._id, userScore: 5, fromUserId: user2._id },
        { toUserId: user._id, userScore: 3, fromUserId: user2._id },
      ]);

      const averageScore = await UserService.getUserReviewAverage(user._id);
      expect(averageScore).toBe(4);
    });

    it.only('should return 0 when no ratings exist', async () => {
      const user = await User.create({
        socialName: 'testUser',
        userEmail: 'test@example.com',
      });

      const averageScore = await UserService.getUserReviewAverage(user._id);
      expect(averageScore).toBe(0);
    });
  });

  //   describe('login', () => {
  //     it('should create a new user when user does not exist', async () => {
  //       const socialName = 'testUser';
  //       const userEmail = 'test@example.com';
  //       const userProfileImage = 'https://example.com/profile.jpg';

  //       const result = await UserService.login(socialName, userEmail, userProfileImage);

  //       expect(result).toHaveProperty('socialName', socialName);
  //       expect(result).toHaveProperty('userEmail', userEmail);
  //       expect(result).toHaveProperty('userProfileImage', userProfileImage);
  //       expect(result).toHaveProperty('userScore', 0);
  //     });

  //     it('should return existing user with updated profile image', async () => {
  //       const existingUser = await User.create({
  //         socialName: 'existingUser',
  //         userEmail: 'existing@example.com',
  //       });

  //       const newProfileImage = 'https://example.com/new-profile.jpg';
  //       const result = await UserService.login(
  //         existingUser.socialName,
  //         existingUser.userEmail,
  //         newProfileImage,
  //       );

  //       expect(result).toHaveProperty('socialName', existingUser.socialName);
  //       expect(result).toHaveProperty('userEmail', existingUser.userEmail);
  //       expect(result.userProfileImage).toBe(newProfileImage);
  //     });
  //   });

  //   describe('updateMbti', () => {
  //     it('should update user MBTI', async () => {
  //       const user = await User.create({
  //         socialName: 'testUser',
  //         userEmail: 'test@example.com',
  //       });

  //       const mbti = 'INTJ';
  //       const result = await UserService.updateMbti(user._id.toString(), mbti);

  //       expect(result).toHaveProperty('userId', user._id);

  //       const updatedUser = await User.findById(user._id);
  //       expect(updatedUser?.mbti).toBe(mbti);
  //     });

  //     it('should throw error when user not found', async () => {
  //       const fakeId = new mongoose.Types.ObjectId().toString();
  //       await expect(UserService.updateMbti(fakeId, 'INTJ')).rejects.toThrow('User not found');
  //     });
  //   });

  //   describe('updatePhoneNumber', () => {
  //     it('should update user phone number', async () => {
  //       const user = await User.create({
  //         socialName: 'testUser',
  //         userEmail: 'test@example.com',
  //       });

  //       const phoneNumber = '+1234567890';
  //       const result = await UserService.updatePhoneNumber(user._id.toString(), phoneNumber);

  //       expect(result).toHaveProperty('userId', user._id);

  //       const updatedUser = await User.findById(user._id);
  //       expect(updatedUser?.phoneNumber).toBe(phoneNumber);
  //     });

  //     it('should throw error when user not found', async () => {
  //       const fakeId = new mongoose.Types.ObjectId().toString();
  //       await expect(UserService.updatePhoneNumber(fakeId, '+1234567890')).rejects.toThrow(
  //         'User not found',
  //       );
  //     });
  //   });
});
