import { Router } from 'express';
import multer, { memoryStorage } from 'multer';
import { ResponseDTO } from '../../ResponseDTO';
import { checkRequiredFieldsBody } from '../../checkRequiredFields';
import { Team, User } from '../../db/schema';
import { isEmail } from '../../isEmail';
import { checkIsValidMBTI, checkIsValidPhoneNumber } from '../../validChecker';
import { uploadImage } from '../imageUpload/imageUpload';
import { UserService } from './user.service';

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
userRouter.post(
  '/login',
  checkRequiredFieldsBody(['socialName', 'userEmail']),
  async (req, res) => {
    const { socialName, userEmail, userProfileImage = null } = req.body;

    if (!isEmail(userEmail)) {
      res.status(400).json(ResponseDTO.fail('이메일 형식이 아닙니다'));
      return;
    }

    try {
      const result = await UserService.login(socialName, userEmail, userProfileImage);
      // console.log(result);
      res.status(200).json(ResponseDTO.success(result));
    } catch (error) {
      console.error(error);
      res.status(500).json(ResponseDTO.fail((error as Error).message));
    }
  },
);

// 내 여행 관리 페이지
// 해당 유저 대기중인 상태에서 approved, rejected로 변경
userRouter.patch(
  '/update-user-status',
  checkRequiredFieldsBody(['teamId', 'userId', 'status']),
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

/**
 * Update user's MBTI
 */
userRouter.patch('/mbti', checkRequiredFieldsBody(['userId', 'mbti']), async (req, res) => {
  const { userId, mbti } = req.body;

  try {
    const result = await UserService.updateMbti(userId, mbti);
    res.json(ResponseDTO.success(result));
  } catch (error) {
    if ((error as Error).message === 'User not found') {
      res.status(404).json(ResponseDTO.fail('User not found'));
      return;
    }
    console.error(error);
    res.status(500).json(ResponseDTO.fail((error as Error).message));
  }
});

/**
 * Update user's phone number
 */
userRouter.patch('/phone', checkRequiredFieldsBody(['userId', 'phoneNumber']), async (req, res) => {
  const { userId, phoneNumber } = req.body;
  try {
    const result = await UserService.updatePhoneNumber(userId, phoneNumber);
    res.json(ResponseDTO.success(result));
  } catch (error) {
    if ((error as Error).message === 'User not found') {
      res.status(404).json(ResponseDTO.fail('User not found'));
      return;
    }
    console.error(error);
    res.status(500).json(ResponseDTO.fail((error as Error).message));
  }
});

// userRouter.patch('profile', async (req, res) => {
//   // body가 아니라 form데이터를 가져옴.
// });

//FIXME 메모리가 아니라 storage에 임시저장하고 그다음에 S3에 업로드하는 방식으로 수정 필요
// 프로필 이미지 업로드는 선택적
const upload = multer({ storage: memoryStorage() });

userRouter.patch(
  '/profile',
  upload.single('profileImage'),
  checkRequiredFieldsBody(['userId']),
  async (req, res) => {
    const { userId, phoneNumber, mbti } = req.body;
    const profileImage = req.file;
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json(ResponseDTO.fail('User not found'));
      return;
    }

    try {
      const updateData: any = {};

      if (profileImage) {
        const imageUrl = await uploadImage(profileImage);
        updateData.userProfileImage = imageUrl;
      }

      if (phoneNumber) {
        // if (!checkIsValidPhoneNumber(phoneNumber)) {
        //   res.status(400).json(ResponseDTO.fail('Invalid phone number'));
        //   return;
        // }
        updateData.phoneNumber = phoneNumber;
      }
      if (mbti) {
        if (!checkIsValidMBTI(mbti)) {
          res.status(400).json(ResponseDTO.fail('Invalid MBTI'));
          return;
        }
        updateData.mbti = mbti;
      }

      //유저 프로필 업데이트
      const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).lean();
      if (!updatedUser) {
        res.status(500).json(ResponseDTO.fail('Failed to update user'));
        return;
      }

      res.status(200).json(
        ResponseDTO.success({
          user: {
            userId: updatedUser._id,
            userProfileImage: updatedUser.userProfileImage,
            socialName: updatedUser.socialName,
            userEmail: updatedUser.userEmail,
            phoneNumber: updatedUser.phoneNumber,
            mbti: updatedUser.mbti,
            userScore: await UserService.getUserReviewAverage(updatedUser._id),
          },
        }),
      );
    } catch (error) {
      console.error(error);
      res.status(500).json(ResponseDTO.fail((error as Error).message));
      return;
    }
  },
);

/**
 * Update user's bank account information
 */
userRouter.patch(
  '/bank-account',
  checkRequiredFieldsBody(['userId', 'accountNumber', 'bankCode']),
  async (req, res) => {
    const { userId, accountNumber, bankCode } = req.body;

    try {
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json(ResponseDTO.fail('User not found'));
        return;
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            'backAccount.bankCode': bankCode,
            'backAccount.accountNumber': accountNumber,
          },
        },
        { new: true },
      ).lean();

      if (!updatedUser) {
        res.status(500).json(ResponseDTO.fail('Failed to update bank account information'));
        return;
      }

      res.status(200).json(
        ResponseDTO.success({
          bankAccount: {
            bankCode: updatedUser.backAccount?.bankCode,
            accountNumber: updatedUser.backAccount?.accountNumber,
          },
        }),
      );
    } catch (error) {
      console.error(error);
      res.status(500).json(ResponseDTO.fail((error as Error).message));
    }
  },
);

export { userRouter };
