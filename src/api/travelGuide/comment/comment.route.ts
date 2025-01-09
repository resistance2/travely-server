import { Router } from 'express';
import mongoose from 'mongoose';
import { ResponseDTO } from '../../../ResponseDTO';
import { checkRequiredFieldsBody } from '../../../checkRequiredFields';
import { TravelGuide, TravelGuideComment, User } from '../../../db/schema';

const travelGuideCommentRouter = Router();

travelGuideCommentRouter.post(
  '/',
  checkRequiredFieldsBody(['userId', 'travelId', 'comment']),
  async (req, res) => {
    const { userId, travelId, comment } = req.body;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const user = await User.findById(userId);

      if (!user) {
        res.status(404).json(ResponseDTO.fail('User not found'));
        return;
      }
      let travel = await TravelGuide.findById(travelId);
      if (!travel) {
        res.status(404).json(ResponseDTO.fail('User or Travel not found'));
        return;
      }
      const data = await TravelGuideComment.create({
        userId: user._id,
        travelGuideId: travel._id,
        comment,
      });
      res.status(200).json(ResponseDTO.success(data));
      await session.commitTransaction();
      await session.endSession();
    } catch (error) {
      console.error(error);
      res.status(500).json(ResponseDTO.fail((error as Error).message));
      await session.abortTransaction();
      await session.endSession();
    }
  },
);

travelGuideCommentRouter.patch(
  '/',
  checkRequiredFieldsBody(['commentId', 'userId', 'comment']),
  async (req, res) => {
    const { commentId, userId, comment } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json(ResponseDTO.fail('User not found'));
        return;
      }
      const data = await TravelGuideComment.findOneAndUpdate(
        { _id: commentId, userId: user._id },
        { comment, userId: user._id },
        { new: true, runValidators: true, session },
      );
      res.status(200).json(ResponseDTO.success(data));
      await session.commitTransaction();
      await session.endSession();
    } catch (error) {
      console.error(error);
      res.status(500).json(ResponseDTO.fail((error as Error).message));
      await session.abortTransaction();
      await session.endSession();
    }
  },
);

travelGuideCommentRouter.delete('/', async (req, res) => {
  const { commentId, userId } = req.body;
  const session = await mongoose.startSession();
  try {
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json(ResponseDTO.fail('User not found'));
      return;
    }
    await TravelGuideComment.findOneAndUpdate(
      { _id: commentId, userId: user._id },
      { isDeleted: true },
      { new: true, runValidators: true, session },
    );
    await session.commitTransaction();
    const updatedData = await TravelGuideComment.findById(commentId).lean();
    res.status(200).json(ResponseDTO.success(updatedData));
    await session.endSession();
  } catch (error) {
    console.error(error);
    res.status(500).json(ResponseDTO.fail((error as Error).message));
    await session.abortTransaction();
    await session.endSession();
  }
});

export { travelGuideCommentRouter };
