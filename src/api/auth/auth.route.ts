import { Router } from 'express';
import { IUser, User } from '../../db/schema';
import { checkRequiredFields } from '../../checkRequiredFields';
import { ResponseDTO } from '../../ResponseDTO';

const loginRouter = Router();

const isEmail = (email: string) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * 로그인
 * POST /api/v1/users/login
 */
loginRouter.post(
  '/login',
  checkRequiredFields(['userName', 'email', 'phoneNumber']),
  async (req, res) => {
    const { userName, email, phoneNumber, profileImageUrl = null } = req.body;

    if (!isEmail(email)) {
      res.status(400).json(ResponseDTO.fail('이메일 형식이 아닙니다'));
      return;
    }

    const user = await User.findOne({
      $or: [{ userEmail: email }, { phoneNumber }, { userName }],
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
        userName,
        userEmail: email,
        phoneNumber,
        userProfileImage: profileImageUrl || null,
      } as IUser);
      res.json(ResponseDTO.success(newUser));
    } catch (error) {
      console.error(error);
      res.status(500).json(ResponseDTO.fail((error as Error).message));
    }
  },
);

export { loginRouter };
