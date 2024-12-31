import { Team, TravelGuide, User } from '../../db/schema';
import { ResponseDTO } from '../../ResponseDTO';
import { checkRequiredFields, checkRequiredFieldsQuery } from '../../checkRequiredFields';
import { Router } from 'express';
import mongoose from 'mongoose';
import { checkIsValidThumbnail, validObjectId } from '../../validChecker';

const travelGuideRouter = Router();

travelGuideRouter.get('/travel', async (_req, res) => {
  const data = await TravelGuide.find().sort({ createAt: -1 }).lean();
  console.log(data);
  res.status(200).json(ResponseDTO.success(data));
});

/**
 * 새로운 여행 계획하기
 * 가이드 모집 글쓰기
 * POST /api/v1/travels-guide/add-travel
 */
travelGuideRouter.post(
  '/add-travel',
  checkRequiredFields(['team', 'travelTitle', 'travelContent']),
  async (req, res) => {
    const session = await mongoose.startSession();

    if (req.body.thumbnail && !await checkIsValidThumbnail(req.body.thumbnail)) {
      console.log('thumbnail boolean', Boolean(req.body.thumbnail));
      res.status(400).json(ResponseDTO.fail('Invalid thumbnail URL'));
      return;
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
  const page_ = parseInt(page as string, 10) - 1;
  const size_ = parseInt(size as string, 10);

  try {
    const travelsGuides = await TravelGuide.find().sort({ createAt: -1 });
    // if (!validObjectId(userId as string)) {
    //   res.status(400).json(ResponseDTO.fail('Invalid userId'));
    //   return;
    // }


    // const user = await User.findById(userId).lean();

    // if (!user) {
    //   res.status(404).json(ResponseDTO.fail('User not found'));
    //   return;
    // }
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

        return {
          travelTitle: travel.travelTitle,
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
          commentCnt: 20,
        };
      }),
    );

    const paginatedTravels = userBookmarkTravels
      .slice(page_ * size_, (page_ + 1) * size_)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const totalElements = travelsGuides.length;
    const totalPages = Math.ceil(totalElements / size_);
    const currentPage = page_ + 1;
    const pageSize = size_;
    const hasNext = totalPages - currentPage > 0;

    res.json(
      ResponseDTO.success({
        travels: paginatedTravels,
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

export { travelGuideRouter };
