import { Team, Travel } from '../../db/schema';
import { ResponseDTO } from '../../ResponseDTO';
import { checkRequiredFields } from '../../checkRequiredFields';
import { Router } from 'express';

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
    try {
      const travelId = crypto.randomUUID();
      const teamId = crypto.randomUUID();
      await Team.collection.insertOne({
        ...req.body.team,
        _id: teamId,
        id: teamId,
      });
      const travel = await Travel.collection.insertOne({
        ...req.body,
        _id: travelId,
        id: travelId,
        teamId: teamId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const newTravel = await Travel.find({ id: travel.insertedId.toString() });
      res.json(
        ResponseDTO.success({
          newTravel,
        }),
      );
    } catch (error) {
      console.error(error);
      res.status(500).json(ResponseDTO.fail((error as Error).message));
    }
  },
);

/**
 * 여행 목록 조회
 * GET /api/v1/travels
 curl -X GET http://localhost:3000/api/v1/travels
 */
travelRouter.get('/', async (_req, res) => {
  const travels = await Travel.find();
  res.json(ResponseDTO.success(travels));
});

/**
 * 홈 (함께 떠나요 NEW), 홈 화면에 여행 목록 조회
 * GET /api/v1/travels/:userId
curl -X POST http://localhost:3000/api/v1/travels/home-travel-list -H "Content-Type: application/json" -d '{
  "userId": "user123"
}'
 */
travelRouter.post('/home-travel-list', checkRequiredFields(['userId']), async (req, res) => {
  const { userId } = req.body;
  try {
    const travels = await Travel.find().sort({ createAt: -1 }).limit(20);
    const userBookmarkTravels = travels.map((travel) => {
      return {
        ...travel.toObject(),
        bookmark: travel.bookmark?.includes(userId) || false,
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
 * POST /api/v1/travels/bookmark-list
 */
travelRouter.post('/bookmark-list', checkRequiredFields(['userId']), async (req, res) => {
  const { userId } = req.body;
  try {
    const travels = await Travel.find({ bookmark: { $in: [userId] } });
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
 * 내여행-참여한 여행 목록 조회
 * /api/v1/travels/my-travel-list
 */
travelRouter.post('/my-travel-list', checkRequiredFields(['userId']), async (req, res) => {
  const { userId } = req.body;
  try {
    const travels = await Travel.find({ team: { $elemMatch: { userId: userId } } });
    res.json(
      ResponseDTO.success({
        travels: travels,
      }),
    );
  } catch (error) {
    console.error(error);
    res.status(500).json(ResponseDTO.fail((error as Error).message));
  }
});

/**
 * 여행 북마크 추가
 * POST/api/v1/travels/bookmark-check
 */

// 북마크 추가 /travels/bookmark-add
// 북마크 삭제 /travels/bookmark-delete
travelRouter.post(
  '/bookmark-check',
  checkRequiredFields(['userId', 'travelId']),
  async (req, res) => {
    const { userId, travelId } = req.body;
    try {
      const travel = await Travel.findOne({ id: travelId });
      if (!travel) {
        res.status(404).json(ResponseDTO.fail('Travel not found'));
        return;
      }
      if (!Array.isArray(travel.bookmark)) {
        travel.bookmark = [];
      }
      if (travel?.bookmark?.includes(userId)) {
        res.status(400).json(ResponseDTO.fail('Already bookmarked'));
        return;
      }
      travel?.bookmark?.push(userId);
      await travel.save();
      res.json(ResponseDTO.success(travel));
    } catch (error) {
      console.error(error);
      res.status(500).json(ResponseDTO.fail((error as Error).message));
    }
  },
);

export { travelRouter };
