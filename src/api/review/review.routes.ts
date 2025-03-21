import { Router } from 'express';
import multer, { memoryStorage } from 'multer';
import { ResponseDTO } from '../../ResponseDTO';
import { checkRequiredFieldsBody, checkRequiredFieldsQuery } from '../../checkRequiredFields';
import { Review, Travel, User, UserRating } from '../../db';
import { checkIsValidImage, checkIsValidScore } from '../../validChecker';
import { uploadImage } from '../imageUpload/imageUpload';

const reviewRouter = Router();

interface QueryType {
  userId?: string;
  travelId?: string;
  isDeleted?: boolean;
}

reviewRouter.get('/', checkRequiredFieldsQuery(['page']), async (req, res) => {
  const { userId, travelId, page, pageSize: pageSize = 10 } = req.query;
  const page_ = Number(page);
  const pageSize_ = Number(pageSize);

  if (isNaN(page_) || isNaN(pageSize_)) {
    res.status(400).json(ResponseDTO.fail('Invalid page or pageSize'));
    return;
  }

  const findQuery: QueryType = {
    isDeleted: false,
  };
  if (userId) findQuery.userId = String(userId);
  if (travelId) findQuery.travelId = String(travelId);

  try {
    const skip = (page_ - 1) * pageSize_;
    const totalReviews = await Review.countDocuments(findQuery);
    const totalPages = Math.ceil(totalReviews / pageSize_);

    const reviews = await Review.find(findQuery)
      .sort({ createdDate: -1 })
      .populate('userId', 'socialName userProfileImage userEmail isVerifiedUser')
      .skip(skip)
      .limit(pageSize_)
      .lean();

    const reviewsWithTravelInfo = await Promise.all(
      reviews.map(async (review) => {
        // const travel = await Travel.findOne({ id: review.travelId }).lean();
        // const user = await User.findById(review.userId).lean();
        return {
          reviewId: review._id,
          travelId: review.travelId,
          title: review.title || '',
          content: review.content,
          imgSrc: review.reviewImg,
          rating: review.travelScore,
          createdDate: review.createdDate,
          user: {
            userId: review.userId._id,
            ...review.userId,
          },
        };
      }),
    );

    res.json(
      ResponseDTO.success({
        data: {
          reviews: reviewsWithTravelInfo,
        },
        pageInfo: {
          page: page_,
          pageSize: pageSize_,
          totalPages: totalPages,
          hasNext: totalPages - page_ > 0,
        },
      }),
    );
  } catch (error) {
    console.error(error);
    res.status(500).json(ResponseDTO.fail((error as Error).message));
  }
});

const checkUserInTravel = async (travelId: string, userId: string): Promise<boolean> => {
  const travel = await Travel.findById(travelId).populate({
    path: 'teamId',
    populate: {
      path: 'appliedUsers.userId',
      select: 'userName socialName userEmail phoneNumber mbti',
    },
  });

  if (!travel) return false;

  for (const team of travel.teamId) {
    const userExists = (team as any).appliedUsers.some(
      (user: any) => user.userId._id.equals(userId) && user.status === 'approved',
    );
    if (userExists) return true;
  }
  return false;
};

// 리뷰 만들기
// curl -X POST http://localhost:3000/api/v1/reviews/ -H "Content-Type: application/json" -d '{"userId": "user001", "travelId": "travel001", "reviewImg": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"], "content": "정말 멋진 여행이었어요!", "travelScore": 5, "createdDate": "2024-10-19T14:10:25Z"}'

/**
 * body example
 * {
 *   userId: 'user001',
 *   travelId: 'travel001',
 *   reviewImg: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
 *   content: '정말 멋진 여행이었어요!',
 *   travelScore: 5,
 *   createdDate: '2024-10-19T14:10:25Z',
 * }
 */
const upload = multer({ storage: memoryStorage() });
reviewRouter.post(
  '/',
  upload.array('reviewImg', 4),
  checkRequiredFieldsBody(['userId', 'travelId', 'content', 'travelScore', 'title']),
  async (req, res) => {
    const { userId, travelId, content, travelScore, title, guideScore } = req.body;

    try {
      const user = await User.findById(userId);

      if (!user) {
        res.status(404).json(ResponseDTO.fail('사용자를 찾을 수 없습니다'));
        return;
      }

      const travel = await Travel.findById(travelId);
      if (!travel) {
        res.status(404).json(ResponseDTO.fail('여행을 찾을 수 없습니다'));
        return;
      }

      if (!(await checkUserInTravel(travelId, userId))) {
        res.status(400).json(ResponseDTO.fail('User is not in the travel'));
        return;
      }

      if (!checkIsValidScore(parseFloat(travelScore))) {
        res.status(400).json(ResponseDTO.fail('Invalid travel score'));
        return;
      }

      const review = await Review.findOne({
        userId,
        travelId,
      });

      if (review) {
        console.log('is already reviewed');
        res.status(400).json(ResponseDTO.fail('is already reviewed'));
        return;
      }

      // userReview가 있을때만
      if (guideScore) {
        // const userReview = await UserRating.findOne({
        //   fromUserId: user._id,
        //   toUserId: travel.userId,
        // });

        // if (userReview) {
        //   res.status(400).json(ResponseDTO.fail('is already reviewed'));
        //   return;
        // }
        const guideScore_ = Number(guideScore);
        if (typeof guideScore_ !== 'number') {
          res.status(400).json(ResponseDTO.fail('Invalid userReview'));
          return;
        }

        if (!checkIsValidScore(guideScore_)) {
          res.status(400).json(ResponseDTO.fail('Invalid userScore'));
          return;
        }

        await UserRating.create({
          fromUserId: user._id,
          toUserId: travel.userId,
          userScore: guideScore_,
        });
      }

      // TODO: 리뷰 유효성 검증 로직,ただ이번에는 유저가 실제로 여행을 다녀오고 여행을 다녀오고 리뷰를 작성하는지 체크 필요

      let reviewImg: string[] = [];
      if (req.files) {
        // req.body에 이미지가 있을 때만
        reviewImg = await Promise.all(Object.values(req.files).map((file) => uploadImage(file)));

        if (!reviewImg.every((url) => typeof url === 'string')) {
          res.status(400).json(ResponseDTO.fail('Invalid image file'));
          return;
        }

        //이미지의 유효성 검사
        const IsValidImages = await Promise.all(
          reviewImg.map(async (image) => {
            return await checkIsValidImage(image);
          }),
        );
        if (!IsValidImages.every((isValid) => isValid)) {
          res.status(400).json(ResponseDTO.fail('Invalid image URL'));
          return;
        }
      }

      const newReview = new Review({
        userId: user._id,
        travelId: travel._id,
        reviewImg,
        content,
        travelScore,
        title,
      });

      const savedReview = await newReview.save();

      res.json(
        ResponseDTO.success({
          review: {
            id: savedReview.id,
            reviewId: savedReview.id,
            userId: savedReview.userId,
            travelId: savedReview.travelId,
            reviewImg: savedReview.reviewImg,
            content: savedReview.content,
            travelScore: savedReview.travelScore,
            createdDate: savedReview.createdDate,
            guideScore,
          },
        }),
      );
    } catch (error) {
      console.error(error);
      res.status(500).json(ResponseDTO.fail((error as Error).message));
    }
  },
);

reviewRouter.delete('/:reviewId', async (req, res) => {
  const { reviewId } = req.params;

  try {
    const review = await Review.findOne({ _id: reviewId, isDeleted: false });

    if (!review) {
      res.status(404).json(ResponseDTO.fail('Review not found'));
      return;
    }

    review.isDeleted = true;
    await review.save();

    res.json(ResponseDTO.success({ deletedId: reviewId, message: 'success' }));
  } catch (error) {
    console.error(error);
    res.status(500).json(ResponseDTO.fail((error as Error).message));
  }
});

export { reviewRouter };
