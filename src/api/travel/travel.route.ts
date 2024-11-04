import { Team, Travel, User } from '../../db/schema';
import { ResponseDTO } from '../../ResponseDTO';
import { checkRequiredFields, checkRequiredFieldsQuery } from '../../checkRequiredFields';
import { Router } from 'express';
import mongoose from 'mongoose';
import { validObjectId } from '../../validObjectId';

const travelRouter = Router();

/**
 * 새로운 여행 계획하기
 * POST /api/v1/travels/add-travel
 */
travelRouter.post(
  '/add-travel',
  checkRequiredFields([
    'team',
    'travelTitle',
    'travelContent',
    'tag',
    'travelCourse',
    'travelPrice',
  ]),
  async (req, res) => {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const userId = await User.findById(req.body.userId).lean();
      if (!userId) {
        res.status(404).json(ResponseDTO.fail('User not found'));
        return;
      }
      const travel = await Travel.create(
        [
          {
            ...req.body,
            userId: userId?._id,
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
      await Travel.findByIdAndUpdate(travelId, { $push: { teamId: team[0]._id } }, { session });
      await session.commitTransaction();
      const newTrvael = await Travel.findById(travelId).populate('teamId').lean();
      res.json(ResponseDTO.success(newTrvael));
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
 * 여행 목록 조회
 * GET /api/v1/travels
 curl -X GET http://localhost:3000/api/v1/travels
 */
travelRouter.get('/', async (_req, res) => {
  const travels = await Travel.find().populate('teamId').limit(100).lean();
  res.json(ResponseDTO.success(travels));
});

/**
 * 홈 (함께 떠나요 NEW), 홈 화면에 여행 목록 조회
 * GET /api/v1/travels/:userId
curl -X POST http://localhost:3000/api/v1/travels/home-travel-list -H "Content-Type: application/json" -d '{
  "userId": "user123"
}'
 */
travelRouter.get('/home-travel-list', checkRequiredFieldsQuery(['userId']), async (req, res) => {
  const { userId } = req.query;
  try {
    const travels = await Travel.find().sort({ createAt: -1 }).limit(20);
    if (!validObjectId(userId as string)) {
      res.status(400).json(ResponseDTO.fail('Invalid userId'));
      return;
    }

    const user = await User.findById(userId).lean();

    if (!user) {
      res.status(404).json(ResponseDTO.fail('User not found'));
      return;
    }
    const userBookmarkTravels = travels.map((travel) => {
      return {
        ...travel.toObject(),
        bookmark: travel.bookmark.includes(user._id as mongoose.Types.ObjectId),
      };
    });
    res.json(
      ResponseDTO.success({
        travels: userBookmarkTravels,
      }),
    );
  } catch (error) {
    console.error(error);
    res.status(500).json(ResponseDTO.fail((error as Error).message));
  }
});

/**
 * 북마크 리스트 조회
 * GET /api/v1/travels/bookmark-list
 */
travelRouter.get('/bookmark-list', checkRequiredFieldsQuery(['userId']), async (req, res) => {
  const { userId } = req.query;
  try {
    if (!validObjectId(userId as string)) {
      res.status(400).json(ResponseDTO.fail('Invalid userId'));
      return;
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      res.status(404).json(ResponseDTO.fail('User not found'));
      return;
    }
    const travels = await Travel.find({ bookmark: { $in: [user?._id] } });
    res.json(
      ResponseDTO.success({
        bookmarks: travels,
      }),
    );
  } catch (error) {
    console.error(error);
    res.status(500).json(ResponseDTO.fail((error as Error).message));
  }
});

/**
 * 내여행- 내가 참여한 여행 목록 조회
 * /api/v1/travels/my-travels
 */
travelRouter.get('/my-travels', checkRequiredFieldsQuery(['userId']), async (req, res) => {
  const { userId } = req.query;
  try {
    const user = await User.findById(userId).lean();
    if (!user) {
      res.status(404).json(ResponseDTO.fail('User not found'));
      return;
    }

    // const travels = await Travel.find({ bookmark: { $in: [user?._id] } });

    const teams = await Team.find({
      appliedUsers: {
        $elemMatch: {
          userId: user._id,
        },
      },
    });

    const travelIds = teams.map((team) => team.travelId);

    const travels = await Promise.all(
      travelIds.map(async (travelId) => {
        return await Travel.findById(travelId).populate('userId').lean();
      }),
    );

    res.json(
      ResponseDTO.success({
        travels,
      }),
    );
  } catch (error) {
    console.error(error);
    res.status(500).json(ResponseDTO.fail((error as Error).message));
  }
});
// 북마크 추가 /travels/bookmark-add
travelRouter.patch(
  '/bookmark-add',
  checkRequiredFields(['userId', 'travelId']),
  async (req, res) => {
    const { userId, travelId } = req.body;
    try {
      const travel = await Travel.findById(travelId);
      if (!travel) {
        res.status(404).json(ResponseDTO.fail('Travel not found'));
        return;
      }
      if (travel.bookmark.includes(userId)) {
        res.status(400).json(ResponseDTO.fail('Already bookmarked'));
        return;
      }
      const updatedTravel = await Travel.findByIdAndUpdate(travelId, {
        $push: { bookmark: userId },
      });
      res.json(
        ResponseDTO.success({
          id: updatedTravel?.id,
          userId: updatedTravel?.userId,
        }),
      );
    } catch (error) {
      console.error(error);
      res.status(500).json(ResponseDTO.fail((error as Error).message));
    }
  },
);

// 북마크 삭제 /travels/bookmark-delete
travelRouter.patch(
  '/bookmark-delete',
  checkRequiredFields(['userId', 'travelId']),
  async (req, res) => {
    const { userId, travelId } = req.body;
    try {
      const travel = await Travel.findById(travelId);
      if (!travel) {
        res.status(404).json(ResponseDTO.fail('Travel not found'));
        return;
      }
      if (!travel?.bookmark.includes(userId)) {
        res.status(400).json(ResponseDTO.fail('it is not bookmarked'));
        return;
      }
      const updatedTravel = await Travel.findByIdAndUpdate(travelId, {
        $pull: { bookmark: userId },
      }).lean();
      res.json(
        ResponseDTO.success({
          id: updatedTravel?._id,
          userId: updatedTravel?.userId,
        }),
      );
    } catch (error) {
      console.error(error);
      res.status(500).json(ResponseDTO.fail((error as Error).message));
    }
  },
);

export { travelRouter };
