import { Router } from 'express';
import mongoose from 'mongoose';
import { ResponseDTO } from '../../../ResponseDTO';
import { checkRequiredFieldsBody, checkRequiredFieldsParams } from '../../../checkRequiredFields';
import { TravelGuide, TravelGuideComment, User } from '../../../db/schema';

const travelGuideCommentRouter = Router();

//TODO: travelId - > guidePostId
travelGuideCommentRouter.post(
  '/',
  checkRequiredFieldsBody(['userId', 'guidePostId', 'comment']),
  async (req, res) => {
    const { userId, guidePostId: travelId, comment } = req.body;
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
        travelId: travel._id,
        comment,
      });
      res.status(200).json(
        ResponseDTO.success({
          commentId: data._id,
          comment: data.comment,
          userId: data.userId,
          guidePostId: data.travelId,
          updatedAt: data.updatedAt,
          createdAt: data.createdAt,
          isDeleted: data.isDeleted,
        }),
      );
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

      const isComment = await TravelGuideComment.findOne({
        _id: commentId,
        userId: user._id,
      });
      if (!isComment) {
        res.status(400).json(ResponseDTO.fail('Comment not found, Invalid userId or commentId'));
        return;
      }
      const data = await TravelGuideComment.findOneAndUpdate(
        { _id: commentId, userId: user._id },
        { comment, userId: user._id },
        { new: true, runValidators: true, session },
      );
      res.status(200).json(
        ResponseDTO.success({
          commentId: data?._id,
          comment: data?.comment,
          userId: data?.userId,
          guidePostId: data?.travelId,
          updatedAt: data?.updatedAt,
          createdAt: data?.createdAt,
          isDeleted: data?.isDeleted,
        }),
      );
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

travelGuideCommentRouter.delete(
  '/:commentId',
  checkRequiredFieldsParams(['commentId']),
  async (req, res) => {
    const { commentId } = req.params;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const comment = await TravelGuideComment.findOne({ _id: commentId });
      if (!comment) {
        res.status(400).json(ResponseDTO.fail('Comment not found, Invalid userId or commentId'));
        return;
      }
      await TravelGuideComment.findOneAndUpdate(
        { _id: commentId },
        { isDeleted: true },
        { new: true, runValidators: true, session },
      );
      await session.commitTransaction();

      res.status(200).json(ResponseDTO.success({ commentId, isDeleted: true }));
      await session.endSession();
    } catch (error) {
      console.error(error);
      res.status(500).json(ResponseDTO.fail((error as Error).message));
      await session.abortTransaction();
      await session.endSession();
    }
  },
);

export { travelGuideCommentRouter };
