import { Team, Travel, User } from '../../db/schema';
import { ResponseDTO } from '../../ResponseDTO';
import {
  checkRequiredFields,
  checkRequiredFieldsParams,
  checkRequiredFieldsQuery,
} from '../../checkRequiredFields';
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
  console.log(travels);
  res.status(200).json(ResponseDTO.success(travels));
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

// 여행 활성화 비활성화
travelRouter.patch(
  '/update-active',
  checkRequiredFields(['travelId', 'isActive']),
  async (req, res) => {
    const { travelId, travelActive } = req.body;
    try {
      const travel = await Travel.findByIdAndUpdate(travelId, { travelActive });
      res.json(
        ResponseDTO.success({
          id: travel?.id,
          travelActive: travel?.travelActive,
        }),
      );
    } catch (error) {
      console.error(error);
      res.status(500).json(ResponseDTO.fail((error as Error).message));
    }
  },
);

// 내 여행 관리 페이지
// 여행 삭제, isDeleted: true
// 팀안에 approved 상태인 유저가 없을 경우 삭제 가능
travelRouter.patch('/delete-travel', checkRequiredFields(['travelId']), async (req, res) => {
  const { travelId } = req.body;
  try {
    const travel = await Travel.findById(travelId);
    if (!travel) {
      res.status(404).json(ResponseDTO.fail('Travel not found'));
      return;
    }

    const teams = await Team.find({
      travelId,
      'appliedUsers.status': 'approved',
    });

    if (teams.length > 0) {
      res.status(400).json(ResponseDTO.fail('Approved user exists'));
      return;
    }

    const updatedTravel = await Travel.findByIdAndUpdate(travelId, {
      isDeleted: true,
    });

    res.json(
      ResponseDTO.success({
        travelId: updatedTravel?.id,
      }),
    );
  } catch (error) {
    console.error(error);
    res.status(500).json(ResponseDTO.fail((error as Error).message));
  }
});

// 내 여행
// 내가 만든 여행 목록 조회
travelRouter.get('/my-created-travels', checkRequiredFieldsQuery(['userId']), async (req, res) => {
  const { userId } = req.query;
  try {
    const user = await User.findById(userId).lean();
    if (!user) {
      res.status(404).json(ResponseDTO.fail('User not found'));
      return;
    }

    const travels = await Travel.find({ userId: user._id }).populate('teamId').lean();
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

// 여행 관리 페이지
// /api/v1/travels/manage-my-travel/travelId
// 해당 여행의 팀과 팀에 있는 유저 목록 조회
travelRouter.get(
  '/manage-my-travel/:travelId',
  checkRequiredFieldsParams(['travelId']),
  checkRequiredFieldsQuery(['teamId']),
  async (req, res) => {
    const { travelId } = req.params;
    const { teamId, page = 0, size = 7 } = req.query;
    const page_ = parseInt(page as string, 10);
    const size_ = parseInt(size as string, 10);

    if (isNaN(page_) || isNaN(size_)) {
      console.log(page_, size_);
      res.status(400).json(ResponseDTO.fail('Invalid page or size'));
      return;
    }

    try {
      const travel = await Travel.findById(travelId).populate('teamId').lean();
      if (!travel) {
        res.status(404).json(ResponseDTO.fail('Travel not found'));
        return;
      }

      const teams = teamId
        ? await Team.findOne({ travelId, _id: teamId })
            .populate({
              path: 'appliedUsers.userId',
              select: '_id userProfileImage socialName userName userEmail phoneNumber mbti',
            })
            .lean()
        : await Team.findOne({ travelId })
            .populate({
              path: 'appliedUsers.userId',
              select: '_id userProfileImage socialName userName userEmail phoneNumber mbti',
            })
            .lean();

      const appliedUsers = teams?.appliedUsers || [];

      const paginatedAppliedUsers = appliedUsers
        .slice(page_ * size_, (page_ + 1) * size_)
        .map((user) => {
          return {
            ...user.userId,
            appliedAt: user.appliedAt,
            status: user.status,
          };
        });
      const totalElements = appliedUsers.length;
      const totalPages = Math.ceil(totalElements / size_);

      res.json(
        ResponseDTO.success({
          travelTitle: travel.travelTitle,
          travelStartDate: teams?.travelStartDate,
          travelEndDate: teams?.travelEndDate,
          personLimit: teams?.personLimit,
          travelActive: travel.travelActive,
          appliedUsers: paginatedAppliedUsers,
          pagination: {
            page: Number(page),
            size: Number(size),
            totalElements,
            totalPages,
          },
        }),
      );
    } catch (error) {
      console.error(error);
      res.status(500).json(ResponseDTO.fail((error as Error).message));
    }
  },
);

// 여행 팀 조회
// /api/v1/travels/manage-my-travel-teams/:travelId
// 해당 여행의 팀 목록 조회
// 팀 아이디만 조회
travelRouter.get(
  '/manage-my-travel-teams/:travelId',
  checkRequiredFieldsParams(['travelId']),
  async (req, res) => {
    const { travelId } = req.params;
    try {
      const travel = await Travel.findById(travelId).lean();
      if (!travel) {
        res.status(404).json(ResponseDTO.fail('Travel not found'));
        return;
      }

      const teams = (await Team.find({ travelId }).select('_id')).map((team) => team._id);
      res.json(
        ResponseDTO.success({
          teamIds: teams,
        }),
      );
    } catch (error) {
      console.error(error);
      res.status(500).json(ResponseDTO.fail((error as Error).message));
    }
  },
);

export { travelRouter };
