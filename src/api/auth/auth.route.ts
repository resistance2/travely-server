import { Router } from 'express';
import { IUser, User } from '../../db/schema';
import { checkRequiredFields } from '../../checkRequiredFields';
import { ResponseDTO } from '../../ResponseDTO';

const loginRouter = Router();

/**
 * 로그인
 * POST /api/v1/users/login
 */
loginRouter.post(
  '/login',
  checkRequiredFields(['userName', 'email', 'phoneNumber']),
  async (req, res) => {
    const { userName, email, phoneNumber, profileImageUrl = null } = req.body;

    const user = await User.findOne({
      $or: [{ userEmail: email }, { phoneNumber }],
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
