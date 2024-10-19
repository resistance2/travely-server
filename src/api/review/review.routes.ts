import { Router } from 'express';
import { Review, Travel } from '../../db/schema';
import { ResponseDTO } from '../../ResponseDTO';
import { checkRequiredFields } from '../../checkRequiredFields';
import crypto from 'crypto';

const reviewRouter = Router();

reviewRouter.post('/review-list', checkRequiredFields(['userId', 'page']), async (req, res) => {
  const { userId, page, pageSize = 10 } = req.body;
  try {
    const skip = (page - 1) * pageSize;
    const totalReviews = await Review.countDocuments({ userId });
    const totalPages = Math.ceil(totalReviews / pageSize);

    const reviews = await Review.find({ userId })
      .sort({ createdDate: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    const reviewsWithTravelInfo = await Promise.all(
      reviews.map(async (review) => {
        const travel = await Travel.findOne({ id: review.travelId }).lean();
        return {
          id: review.id,
          travelId: review.travelId,
          reviewImg: review.reviewImg,
          content: review.content,
          travelScore: review.travelScore,
          createdDate: review.createdDate.toISOString(),
          travelTitle: travel?.travelTitle || '',
        };
      }),
    );

    res.json(
      ResponseDTO.success({
        page,
        pageSize,
        totalPages,
        data: {
          reviews: reviewsWithTravelInfo,
        },
        error: '',
      }),
    );
  } catch (error) {
    console.error(error);
    res.status(500).json(ResponseDTO.fail((error as Error).message));
  }
});

export { reviewRouter };

// 테스트용 curl 명령어:
// curl -X POST http://localhost:3000/api/v1/reviews/review-list -H "Content-Type: application/json" -d '{"userId": "user001", "page": 1, "pageSize": 10}'

// 리뷰 만들기

const reviewCreateRouter = Router();

reviewCreateRouter.post(
  '/review-create',
  checkRequiredFields(['userId', 'travelId', 'reviewImg', 'content', 'travelScore', 'createdDate']),
  async (req, res) => {
    const { userId, travelId, reviewImg, content, travelScore, createdDate } = req.body;
    try {
      const newReview = new Review({
        id: crypto.randomUUID(),
        userId: userId,
        travelId: travelId,
        reviewImg,
        content,
        travelScore,
        createdDate: new Date(createdDate),
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
            createdDate: savedReview.createdDate.toISOString(),
          },
        }),
      );
    } catch (error) {
      console.error(error);
      res.status(500).json(ResponseDTO.fail((error as Error).message));
    }
  },
);

export { reviewCreateRouter };

// 테스트용 curl 명령어:
// curl -X POST http://localhost:3000/api/v1/reviews/review-create -H "Content-Type: application/json" -d '{"userId": "user001", "travelId": "travel001", "reviewImg": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"], "content": "정말 멋진 여행이었어요!", "travelScore": 5, "createdDate": "2024-10-19T14:10:25Z"}'
