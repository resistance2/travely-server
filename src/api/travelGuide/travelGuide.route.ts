import { Router } from 'express';
import mongoose from 'mongoose';
import { ResponseDTO } from '../../ResponseDTO';
import { checkRequiredFieldsBody, checkRequiredFieldsParams } from '../../checkRequiredFields';
import { Team, TravelGuide, TravelGuideComment, User } from '../../db/schema';
import { checkIsValidImage, checkPageAndSize, validObjectId } from '../../validChecker';

const travelGuideRouter = Router();

travelGuideRouter.get('/travel', async (_req, res) => {
  const data = await TravelGuide.find().sort({ createAt: -1 }).lean();
  res.status(200).json(ResponseDTO.success(data));
});

/**
 * 새로운 여행 계획하기
 * 가이드 모집 글쓰기
 * POST /api/v1/travels-guide/add-travel
 */
travelGuideRouter.post(
  '/add-travel',
  checkRequiredFieldsBody(['team', 'travelTitle', 'travelContent']),
  async (req, res) => {
    const session = await mongoose.startSession();

    // thumbnail의 유효성 검사, thumbnail이 있을 때만 유효성 검사
    if (req.body.thumbnail) {
      const isValid = await checkIsValidImage(req.body.thumbnail);
      if (!isValid) {
        res.status(400).json(ResponseDTO.fail('Invalid thumbnail URL'));
        return;
      }
    }

    try {
      session.startTransaction();
      const userId = await User.findById(req.body.userId).lean();
      if (!userId) {
        res.status(404).json(ResponseDTO.fail('User not found'));
        return;
      }
      const travel = await TravelGuide.create(
        [
          {
            ...req.body,
            userId: userId?._id,
            travelThumbnail: req.body.travelThumbnail || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        { session },
      );

      const travelId = travel[0]._id;

      const team = await Team.create(
        [
          {
            ...req.body.team[0],
            travelEndDate: req.body.team[0].travelEndDate,
            travelStartDate: req.body.team[0].travelStartDate,
            personLimit: req.body.team[0].personLimit,
            travelId: travelId,
          },
        ],
        { session },
      );
      await TravelGuide.findByIdAndUpdate(
        travelId,
        { $push: { teamId: team[0]._id } },
        { session },
      );
      await session.commitTransaction();
      const newTravel = await TravelGuide.findById(travelId).populate('teamId').lean();
      res.json(ResponseDTO.success(newTravel));
    } catch (error) {
      console.error(error);
      await session.abortTransaction();
      res.status(500).json(ResponseDTO.fail((error as Error).message));
    } finally {
      session.endSession();
    }
  },
);

/**
 * 여행 목록 조회, 가이드 구해요
 */

travelGuideRouter.get('/travel-list', async (req, res) => {
  const { page = 1, size = 10 } = req.query;
  if (!checkPageAndSize(parseInt(page as string), parseInt(size as string))) {
    res.status(400).json(ResponseDTO.fail('Invalid page or size'));
    return;
  }
  const page_ = parseInt(page as string, 10);
  const size_ = parseInt(size as string, 10);
  const skip = (page_ - 1) * size_;

  try {
    const travelsGuides = await TravelGuide.find().sort({ createdAt: -1 }).skip(skip).limit(size_);
    const userBookmarkTravels = await Promise.all(
      travelsGuides.map(async (travel) => {
        const createdByUser = await User.findById(travel.userId).lean();
        const teams = await Team.findOne({ travelId: travel._id, _id: travel.teamId[0] })
          .populate({
            path: 'appliedUsers.userId',
            select: 'mbti',
          })
          .lean();

        const appliedUsers =
          teams?.appliedUsers.map((user) => ({
            ...user,
          })) || null;

        const commentCnt = await TravelGuideComment.countDocuments({
          travelId: travel._id,
          isDeleted: false,
        });
        return {
          id: travel._id,
          travelTitle: travel.travelTitle,
          thumbnail: travel.thumbnail,
          userId: travel.userId,
          createdBy: {
            userId: createdByUser?._id,
            userName: createdByUser?.userName || createdByUser?.socialName,
          },
          team: {
            personLimit: teams?.personLimit ?? null,
            mbti: appliedUsers,
          },
          createdAt: travel.createdAt,
          commentCnt: commentCnt,
        };
      }),
    );

    const totalElements = await TravelGuide.countDocuments({ isDeleted: false });
    const totalPages = Math.ceil(totalElements / size_);
    const currentPage = page_;
    const pageSize = size_;
    const hasNext = totalPages - currentPage > 0;

    res.json(
      ResponseDTO.success({
        travels: userBookmarkTravels,
        pageInfo: {
          totalElements,
          totalPages,
          currentPage,
          pageSize,
          hasNext,
        },
      }),
    );
  } catch (error) {
    console.error(error);
    res.status(500).json(ResponseDTO.fail((error as Error).message));
  }
});

/**
 * 여행 상세 조회(가이드 글)
 */
travelGuideRouter.get(
  '/travel-detail/:travelId',
  checkRequiredFieldsParams(['travelId']),
  async (req, res) => {
    const { travelId } = req.params;

    try {
      if (!validObjectId(travelId)) {
        res.status(400).json(ResponseDTO.fail('Invalid travelId'));
        return;
      }
      const travel = await TravelGuide.findById(travelId)
        .populate('teamId')
        .populate('userId')
        .lean();

      if (!travel) {
        res.status(404).json(ResponseDTO.fail('Travel not found'));
        return;
      }

      // const comment = await TravelGuideComment.find({ travelId: travel._id })
      //   .populate('userId')
      //   .lean();

      //TODO: commentList 삭제 필요
      // const commentList = comment.map((comment) => ({
      //   userId: comment.userId._id,
      //   commentId: comment._id,
      //   socialName: (comment.userId as any).socialName,
      //   userProfileImage: (comment.userId as any).userProfileImage,
      //   updatedAt: comment.updatedAt,
      //   comment: comment.comment,
      // }));

      const travelDetail = {
        author: {
          userId: travel.userId._id,
          userName: (travel.userId as any).userName,
          socialName: (travel.userId as any).socialName,
          userEmail: (travel.userId as any).userEmail || null,
          userProfileImage: (travel.userId as any).userProfileImage,
          userScore: (travel.userId as any).userScore,
        },
        title: travel.travelTitle,
        content: travel.travelContent,
        thumbnail: travel.thumbnail || null,
        team: travel.teamId.map((team) => ({
          teamId: (team as any)._id,
          personLimit: (team as any).personLimit,
          travelStartDate: (team as any).travelStartDate,
          travelEndDate: (team as any).travelEndDate,
        })),
        createdAt: travel.createdAt,
        updatedAt: travel.updatedAt,
        // commentList: commentList || null,
      };
      res.json(ResponseDTO.success(travelDetail));
    } catch (error) {
      console.error(error);
      res.status(500).json(ResponseDTO.fail((error as Error).message));
    }
  },
);

export { travelGuideRouter };
