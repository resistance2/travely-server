import { Router } from 'express';
import { Team, Travel } from '../../db/schema';
import { ResponseDTO } from '../../ResponseDTO';

const travelRouter = Router();

/**
 * 새로운 여행 계획하기
 * POST /api/v1/travels
 curl -X POST http://localhost:3000/api/v1/travels -H "Content-Type: application/json" -d '{
  "userId": "user456",
  "thumbnail": "https://example.com/busan-image.jpg",
  "travelTitle": "부산 여행",
  "travelContent": "부산의 해변과 명소를 둘러보는 여행",
  "travelCourse": ["해운대", "광안리", "감천문화마을"],
  "tag": ["부산", "바다", "문화"],
  "team": [
    {
      "personLimit": 8,
      "travelStartDate": "2024-07-15",
      "travelEndDate": "2024-07-18"
    }
  ],
  "travelPrice": 350000,
  "includedItems": ["숙박", "가이드", "해변 액티비티"],
  "excludedItems": ["식사", "교통비", "개인 경비"],
  "meetingTime": ["10:00", "15:00"],
}'
 */
travelRouter.post('/add-travel', async (req, res) => {
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
      teamId: [teamId],
      createAt: new Date(),
      updateAt: new Date(),
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
});

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
travelRouter.post('/home-travel-list', async (req, res) => {
  const { userId } = req.body;
  try {
    const travels = await Travel.find().sort({ createAt: -1 }).limit(20);
    console.log(userId);
    const userBookmarkTravels = travels.map((travel) => {
      console.log(travel.bookmark);
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

travelRouter.post('/bookmark-list', async (req, res) => {
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

export { travelRouter };
