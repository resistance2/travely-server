import { Router } from 'express';
import { IUser, User } from '../../db/schema';
import { checkRequiredFields } from '../../checkRequiredFields';
import { ResponseDTO } from '../../ResponseDTO';

const userRouter = Router();

// export interface IUser extends Document {
//     username: string;
//     email: string;
//     profileImageUrl: string;
//     createdAt: Date;
//   }
const isEmail = (email: string) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

//!TODO: socialName, email 필수
//!TODO: socialName: 구글 닉네임, 카카오 닉네임
userRouter.post('/login', checkRequiredFields(['socialName', 'userEmail']), async (req, res) => {
  const { socialName, userEmail, userProfileImage = null } = req.body;

  if (!isEmail(userEmail)) {
    res.status(400).json(ResponseDTO.fail('이메일 형식이 아닙니다'));
    return;
  }

  const user = await User.findOne({
    $or: [{ userEmail }, { socialName }],
  });

  if (user) {
    res.status(200).json(ResponseDTO.success(user));
    return;
  }

  try {
    const id = crypto.randomUUID();
    const newUser = await User.create({
      id: id,
      _id: id,
      socialName,
      userEmail: userEmail,
      userProfileImage: userProfileImage || null,
    } as IUser);
    res.json(ResponseDTO.success(newUser));
  } catch (error) {
    console.error(error);
    res.status(500).json(ResponseDTO.fail((error as Error).message));
  }
});

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
