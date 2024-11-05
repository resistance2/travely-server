import { Router } from 'express';
import { Team, User } from '../../db/schema';
import { checkRequiredFields } from '../../checkRequiredFields';
import { ResponseDTO } from '../../ResponseDTO';
import { isEmail } from '../../isEmail';

const userRouter = Router();

/**
 * 사용자 로그인 및 회원가입
curl -X POST http://localhost:3000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "socialName": "nakyeonko3",
    "userEmail": "badaclock@gmail.com"
  }'
*/
userRouter.post('/login', checkRequiredFields(['socialName', 'userEmail']), async (req, res) => {
  const { socialName, userEmail, userProfileImage = null } = req.body;

  if (!isEmail(userEmail)) {
    res.status(400).json(ResponseDTO.fail('이메일 형식이 아닙니다'));
    return;
  }

  const user = await User.findOne({
    $or: [{ userEmail }, { socialName }],
  }).lean();

  if (user) {
    res.status(200).json(ResponseDTO.success({ ...user, isCreated: false }));
    return;
  }

  try {
    const newUser = await User.create({
      socialName,
      userEmail: userEmail,
      userProfileImage: userProfileImage || null,
    });
    res.json(ResponseDTO.success({ ...newUser.toJSON(), isCreated: true }));
  } catch (error) {
    console.error(error);
    res.status(500).json(ResponseDTO.fail((error as Error).message));
  }
});

// 내 여행 관리 페이지
// 해당 유저 대기중인 상태에서 approverd, rejected로 변경
userRouter.patch(
  '/update-user-status',
  checkRequiredFields(['teamId', 'userId', 'status']),
  async (req, res) => {
    const { userId, status, teamId } = req.body;
    try {
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json(ResponseDTO.fail('User not found'));
        return;
      }
      const team = await Team.findById(teamId);
      if (!team) {
        res.status(404).json(ResponseDTO.fail('Team not found'));
        return;
      }

      if (status !== 'approved' && status !== 'rejected') {
        res.status(400).json(ResponseDTO.fail('status is invalid'));
        return;
      }

      const updatedTeam = await Team.findByIdAndUpdate(
        teamId,
        {
          $set: {
            'appliedUsers.$[elem].status': status,
          },
        },
        {
          arrayFilters: [{ 'elem.userId': userId }],
          new: true,
        },
      );

      console.log(updatedTeam);

      res.json(
        ResponseDTO.success({
          teamId: updatedTeam?.id,
          userId: updatedTeam?.appliedUsers,
        }),
      );
    } catch (error) {
      console.error(error);
      res.status(500).json(ResponseDTO.fail((error as Error).message));
    }
  },
);

// curl -X GET http://localhost:3000/api/v1/users
userRouter.get('/', async (_req, res) => {
  const users = await User.find();
  res.json(users);
});

// curl -X GET http://localhost:3000/api/v1/users/60d7b0e0c4c0c20015f0a4b7
userRouter.get('/:id', async (req, res) => {
  const { id } = req.params;
  const foundUser = await User.findById(id);
  res.json(foundUser);
});

// curl -X POST -H "Content-Type: application/json" -d '{"username": "test", "email": "badaclock@gmail.com", "profileImageUrl": "https://avatars.githubusercontent.com/u/77449510?v=4"}' http://localhost:3000/api/v1/users
userRouter.post('/', async (req, res) => {
  const newUser = await User.create(req.body);
  res.json(newUser);
});

// curl -X DELETE http://localhost:3000/api/v1/users/60d7b0e0c4c0c20015f0a4b7
userRouter.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updatedUser = await User.findByIdAndUpdate(id, req.body);
  res.json(updatedUser);
});

export { userRouter };
