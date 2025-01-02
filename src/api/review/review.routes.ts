import { Router } from 'express';
import { Review, Travel, User } from '../../db/schema';
import { ResponseDTO } from '../../ResponseDTO';
import { checkRequiredFieldsBody, checkRequiredFieldsQuery } from '../../checkRequiredFields';
import { checkIsValidImage, checkIsValidScore } from '../../validChecker';

const reviewRouter = Router();

  interface QueryType {
  userId?: string;  
  travelId?: string;
  }


reviewRouter.get('/', checkRequiredFieldsQuery(['page']), async (req, res) => {
  const { userId, travelId, page, pageSize: pageSize = 10 } = req.query;
  const page_ = Number(page);
  const pageSize_ = Number(pageSize);

  if(isNaN(page_) || isNaN(pageSize_)){
    res.status(400).json(ResponseDTO.fail('Invalid page or pageSize'));
    return;
  }


  const findQuery:QueryType = {};
  if (userId) findQuery.userId = String(userId);
  if(travelId) findQuery.travelId = String(travelId);

  try {
    const skip = (page_ - 1) * pageSize_;
    const totalReviews = await Review.countDocuments(findQuery);
    const totalPages = Math.ceil(totalReviews / pageSize_);

    const reviews = await Review.find(findQuery)
      .sort({ createdDate: -1 })
      .skip(skip)
      .limit(pageSize_)
      .lean();

    const reviewsWithTravelInfo = await Promise.all(
      reviews.map(async (review) => {
        const travel = await Travel.findOne({ id: review.travelId }).lean();
        const user = await User.findById(review.userId).lean();
        return {
          id: review._id,
          travelId: review.travelId,
          reviewImg: review.reviewImg,
          content: review.content,
          travelScore: review.travelScore,
          createdDate: review.createdDate,
          travelTitle: travel?.travelTitle || '',      
          userName: user?.userName,
          socialName: user?.socialName,
          userProfileImage: user?.userProfileImage,
          userEmail: user?.userEmail,
          isVerifiedUser: user?.isVerifiedUser,
          mbti: user?.mbti,
        };
      }),
    );

    res.json(
      ResponseDTO.success({
        data: {
          reviews: reviewsWithTravelInfo,
        },
        pageInfo:{
          page: page_,
          pageSize: pageSize_,
          totalPages: totalPages,
          hasNext: totalPages - page_ > 0,
        }
      }),
    );
  } catch (error) {
    console.error(error);
    res.status(500).json(ResponseDTO.fail((error as Error).message));
  }
});


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
reviewRouter.post(
  '/',
  checkRequiredFieldsBody(['userId', 'travelId', 'reviewImg', 'content', 'travelScore','title']),
  async (req, res) => {
    const { userId, travelId, reviewImg, content, travelScore, title } = req.body;

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


    // req.body에 이미지가 있을 때만
    if (reviewImg) {
      //문자열 배열인지 검사
      if (!Array.isArray(reviewImg)) {
        res.status(400).json(ResponseDTO.fail('reviewImg must be an array'));
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

    if(!checkIsValidScore(travelScore)){
      res.status(400).json(ResponseDTO.fail('Invalid travel score'));
      return;
    }

    // TODO: 리뷰 유효성 검증 로직, 해당 유저가 실제로 여행을 다녀오고 리뷰를 작성하는지 체크 필요

    try {
      const newReview = new Review({
        userId: user._id,
        travelId: travel._id,
        reviewImg,
        content,
        travelScore,
        title
      });

      const savedReview = await newReview.save();

      res.json(
        ResponseDTO.success({
          review: {
            reviewId: savedReview.id,
            userId: savedReview.userId,
            travelId: savedReview.travelId,
            reviewImg: savedReview.reviewImg,
            content: savedReview.content,
            travelScore: savedReview.travelScore,
            createdDate: savedReview.createdDate,
          },
        }),
      );
    } catch (error) {
      console.error(error);
      res.status(500).json(ResponseDTO.fail((error as Error).message));
    }
  },
);

export { reviewRouter };

