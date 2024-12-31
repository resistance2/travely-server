import { Router } from 'express';
import mongoose from 'mongoose';
import { ResponseDTO } from '../../ResponseDTO';
import {
  checkRequiredFieldsBody,
  checkRequiredFieldsParams,
  checkRequiredFieldsQuery,
} from '../../checkRequiredFields';
import { IAppliedUser, Review, Team, Travel, User, UserRating } from '../../db/schema';
import { checkIsValidThumbnail, validObjectId } from '../../validChecker';

const getReviewAverage = async (travelId: mongoose.Types.ObjectId) => {
  const reviews = await Review.find({ travelId }).lean();
  const totalScore = reviews.reduce((acc, review) => {
    return acc + review.travelScore;
  }, 0);
  return totalScore / reviews.length;
};

const getReviewCount = async (travelId: mongoose.Types.ObjectId) => {
  const reviews = await Review.find({ travelId }).lean();
  return reviews.length;
};

const getReviews = async (travelId: mongoose.Types.ObjectId) => {
  const reviews = await Review.find({ travelId }).lean();
  return reviews.map((review) => {
    return {
      reviewId: review._id,
      userId: review.userId,
      imgSrc: review.reviewImg,
      createdAt: review.createdDate,
      content: review.content,
      rating: review.travelScore,
      title: review.title,
    };
  });
};

const checkIsBookmarked = async (userId: mongoose.Types.ObjectId, travelId: mongoose.Types.ObjectId): Promise<boolean> => {
  const travel = await Travel.findOne({ _id: travelId }).lean();
  return travel ? travel.bookmark.some(
    (bookmarkUserId: mongoose.Types.ObjectId) => bookmarkUserId.equals(userId),
  ) : false;
}

// const ReviewSchema: Schema<IReview> = new Schema(
//   {
//     userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
//     travelId: { type: Schema.Types.ObjectId, required: true, ref: "Travel" },
//     reviewImg: { type: [String], default: [] },
//     createdDate: { type: Date, default: Date.now },
//     content: { type: String, required: true },
//     travelScore: { type: Number, required: true },
//     title: { type: String, required: true },
//   },
//   { timestamps: true }
// );


const isReviewWritten = async (userId: mongoose.Types.ObjectId, travelId: mongoose.Types.ObjectId): Promise<boolean> => {
  const review = await Review.findOne({ userId, travelId }).lean();
  if (review) {
    return true;
  }
  return false;
}

const travelRouter = Router();

travelRouter.get(
  '/travel-detail/:travelId',
  checkRequiredFieldsParams(['travelId']),
  async (req, res) => {
    const { travelId } = req.params;
    const { userId } = req.query;
    const travel = await Travel.findOne({
      _id: travelId,
    })
      .populate('userId')
      .populate({
        path: 'teamId',
        populate: {
          path: 'appliedUsers.userId',
          select: 'userName socialName userEmail phoneNumber mbti userId',
        },
      })
      .lean();

    if (!travel) {
      res.status(404).json(ResponseDTO.fail('Travel not found'));
      return;
    }

    const userId_ = userId ? await User.findById(userId).lean() : null;

    const review = await getReviews(travel._id);
    const reviewWithUser = await Promise.all(
      review.map(async (review) => {
        const user = await User.findById(review.userId).lean();
        return {
          ...review,
          userId: (user as any).userId,
          isVerifiedUser: (user as any).isVerifiedUser,
          socialName: (user as any).socialName || null,
          userEmail: (user as any).userEmail || null,
          userProfileImage: (user as any).userProfileImage,
        };
      }),
    );

    //일단 가이드 별점은 목데이터로 넣자. 나중에 가이드 별점 넣기
    //전체 별점도 일다 목데이터를 넣음.
    // 북마크도 일단은 목데이터로 넣음




    // 승인된 유저만 보내기
    // isBookmark: 북마크 여부
    // bookmark: 북마크수
    const travelDetailData = {
      guide: {
        userId: (travel.userId as any)._id,
        userProfileImage: (travel.userId as any).userProfileImage,
        socialName: (travel.userId as any).socialName,
        userEmail: (travel.userId as any).userEmail,
        guideTotalRating: 4.5,
      },
      title: travel.travelTitle,
      content: travel.travelContent,
      price: travel.travelPrice,
      thumbnail: travel.thumbnail,
      tag: travel.tag,
      travelCourse: travel.travelCourse,
      includedItems: travel.includedItems,
      excludedItems: travel.excludedItems,
      meetingTime: travel.meetingTime,
      meetingPlace: travel.meetingPlace,
      FAQ: travel.travelFAQ,
      team: travel.teamId.map((team) => ({
        teamId: (team as any)._id,
        personLimit: (team as any).personLimit,
        travelStartDate: (team as any).travelStartDate,
        travelEndDate: (team as any).travelEndDate,
        approvedUsers: ((team as any).appliedUsers as any).filter((user: any) => user.status === 'approved').map((user: any) => ({
          userName: user.userId.userName,
          socialName: user.userId.socialName,
          userEmail: user.userId.userEmail,
          phoneNumber: user.userId.phoneNumber,
          mbti: user.userId.mbti,
          status: user.status,
          appliedAt: user.appliedAt,
          userId: (user.userId as any)._id,
        }))
      })),
      reviews: reviewWithUser,
      totalRating: await getReviewAverage(
        travel._id
      ),
      bookmark: travel.bookmark.length,
      isbookmark: userId_ ? await checkIsBookmarked(userId_._id as mongoose.Types.ObjectId, travel._id) : false
    };
    res.json(ResponseDTO.success(travelDetailData));
  },
);

/**
 * 새로운 여행 계획하기
 * 여행자 모집 글
 * POST /api/v1/travels/add-travel
 */
travelRouter.post(
  '/add-travel',
  checkRequiredFieldsBody([
    'team',
    'travelTitle',
    'travelContent',
    'thumbnail',
    'travelCourse',
    'travelPrice',
    'tag',
  ]),
  async (req, res) => {
    const session = await mongoose.startSession();

    if (req.body.thumbnail && !(await checkIsValidThumbnail(req.body.thumbnail))) {
      res.status(400).json(ResponseDTO.fail('Invalid thumbnail URL'));
      return;
    }

    try {
      session.startTransaction();
      const userId = await User.findById(req.body.userId).lean();
      if (!userId) {
        res.status(404).json(ResponseDTO.fail('User not found'));
        return;
      }
      const travel = await Travel.create(
        [
          {
            ...req.body,
            userId: userId?._id,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        { session },
      );

      const travelId = travel[0]._id;

      const team = await Team.create(
        [
          {
            ...req.body.team[0],
            travelEndDate: req.body.team[0].travelEndDate,
            travelStartDate: req.body.team[0].travelStartDate,
            personLimit: req.body.team[0].personLimit,
            travelId: travelId,
          },
        ],
        { session },
      );
      await Travel.findByIdAndUpdate(travelId, { $push: { teamId: team[0]._id } }, { session });
      await session.commitTransaction();
      const newTravel = await Travel.findById(travelId).populate('teamId').lean();
      res.json(ResponseDTO.success(newTravel));
    } catch (error) {
      console.error(error);
      await session.abortTransaction();
      res.status(500).json(ResponseDTO.fail((error as Error).message));
    } finally {
      session.endSession();
    }
  },
);

/**
 * 여행 목록 조회
 * GET /api/v1/travels
 curl -X GET http://localhost:3000/api/v1/travels
 */
travelRouter.get('/', async (_req, res) => {
  const travels = await Travel.find().populate('teamId').limit(100).lean();
  res.status(200).json(ResponseDTO.success(travels));
});

/**
 * 여행 목록 조회, 여행자 구해요.
 */
travelRouter.get('/travel-list', async (req, res) => {
  const { userId, page = 1, size = 10 } = req.query;
  const page_ = parseInt(page as string, 10) - 1;
  const size_ = parseInt(size as string, 10);
  // const teams = await Team.findOne({ travelId, _id: teamId })
  //   .populate({
  //     path: 'appliedUsers.userId',
  //     select: 'userProfileImage socialName userName userEmail phoneNumber mbti',
  //   })
  //   .lean();

  try {
    const travels = await Travel.find().sort({ createAt: -1 });

    const user = userId === 'null' ? null : await User.findById(userId).lean();

    // if (!user) {
    //   res.status(404).json(ResponseDTO.fail("User not found"));
    //   return;
    // }
    const userBookmarkTravels = await Promise.all(
      travels.map(async (travel) => {
        const reviewCnt = await getReviewCount(travel._id);
        const travelScore = await getReviewAverage(travel._id);
        const createdByUser = await User.findById(travel.userId).lean();
        return {
          travelTitle: travel.travelTitle,
          price: travel.travelPrice,
          thumbnail: travel.thumbnail,
          review: {
            travelScore,
            reviewCnt,
          },
          createdBy: {
            userId: createdByUser?._id,
            userName: createdByUser?.userName || createdByUser?.socialName,
          },
          tag: travel.tag,
          createdAt: travel.createdAt,
          bookmark: await checkIsBookmarked(user?._id as mongoose.Types.ObjectId, travel._id),
        };
      }),
    );

    const paginatedTravels = userBookmarkTravels
      .slice(page_ * size_, (page_ + 1) * size_)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const totalElements = travels.length;
    const totalPages = Math.ceil(totalElements / size_);
    const currentPage = page_ + 1;
    const pageSize = size_;
    const hasNext = totalPages - currentPage > 0;

    res.json(
      ResponseDTO.success({
        travels: paginatedTravels,
        pageInfo: {
          totalElements,
          totalPages,
          currentPage,
          pageSize,
          hasNext,
        },
      }),
    );
  } catch (error) {
    console.error(error);
    res.status(500).json(ResponseDTO.fail((error as Error).message));
  }
});

/**
 * 북마크 리스트 조회
 * GET /api/v1/travels/bookmark-list
 */
travelRouter.get('/bookmark-list', checkRequiredFieldsQuery(['userId']), async (req, res) => {
  const { userId } = req.query;
  try {
    if (!validObjectId(userId as string)) {
      res.status(400).json(ResponseDTO.fail('Invalid userId'));
      return;
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      res.status(404).json(ResponseDTO.fail('User not found'));
      return;
    }
    const travels = await Travel.find({ bookmark: { $in: [user?._id] } });
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
 * 내여행- 내가 참여한 여행 목록 조회
 * /api/v1/travels/my-travels
 */
travelRouter.get('/my-travels', checkRequiredFieldsQuery(['userId']), async (req, res) => {
  const { userId } = req.query;
  try {
    const user = await User.findById(userId).lean();
    if (!user) {
      res.status(404).json(ResponseDTO.fail('User not found'));
      return;
    }


    const teams = await Team.find({
      appliedUsers: {
        $elemMatch: {
          userId: user._id,
        },
      },
    })
      .populate({
        path: 'travelId',
        select: 'travelTitle userId',
        populate: {
          path: 'userId',
          select: 'socialName userEmail userProfileImage',
        },
      })
      .populate({
        path: 'appliedUsers.userId',
        select: 'mbti socialName',
      })
      .lean();

    const getUserReviewAverage = async (userId: mongoose.Types.ObjectId) => {
      const userRating = await UserRating.findOne({ toUserId: userId }).lean();
      return userRating?.ratingScore || null;
    };

    const travels = await Promise.all(
      teams.map(async (team) => {
        return {
          travelTitle: (team.travelId as any).travelTitle,
          guideInfo: {
            socialName: (team.travelId as any).userId.socialName,
            userProfileImg: (team.travelId as any).userId.userProfileImage,
            userEmail: (team.travelId as any).userId.userEmail,
            userId: (team.travelId as any).userId._id,
            userRating: await getUserReviewAverage((team.travelId as any).userId._id),
          },
          travelTeam: {
          travelStartDate: team.travelStartDate,
          travelEndDate: team.travelEndDate,
          personLimit: team.personLimit,
          approvedMembersMbti: {
            mbti: team.appliedUsers.map((user) => (user.userId as any).mbti)
          },
        },
        currentUserStatus: {
          status: team.appliedUsers.find((currentUser) => currentUser.userId._id.equals(user._id))?.status,
        },
        reviewWritten: await isReviewWritten(user._id, team.travelId._id),
      };
    }));

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

// 북마크 추가 /travels/bookmark-add

  // ### Request Body Example

  //   {
  //     "userId": "user123",
  //     "travelId": "travel456",
  //     "isBookmark": true
  //   }

travelRouter.patch(
  '/bookmark',
  checkRequiredFieldsBody(['userId', 'travelId','isBookmark']),
  async (req, res) => {
    const { userId, travelId, isBookmark } = req.body;
    try {
      const travel = await Travel.findById(travelId);
      if (!travel) {
        res.status(404).json(ResponseDTO.fail('Travel not found'));
        return;
      }
      
      const user = await User.findById(userId);
      if(!user) {
        res.status(404).json(ResponseDTO.fail('User not found'));
        return;
      }

      const updatedTravel = await Travel.findByIdAndUpdate(travelId, {
        [isBookmark ? '$addToSet' : '$pull']: { bookmark: userId },
      }).lean();

      res.json(
        ResponseDTO.success({
          id: updatedTravel?._id,
          userId: updatedTravel?.userId,
          isBookmark: await checkIsBookmarked(userId, travelId),
        }),
      );
    } catch (error) {
      console.error(error);
      res.status(500).json(ResponseDTO.fail((error as Error).message));
    }
  },
);

// 여행 활성화 비활성화
travelRouter.patch(
  '/update-active',
  checkRequiredFieldsBody(['travelId', 'isActive']),
  async (req, res) => {
    const { travelId, isActive } = req.body;
    try {
      const travel = await Travel.findByIdAndUpdate(
        travelId,
        { travelActive: isActive },
        { new: true }, // 업데이트된 문서를 반환
      );

      if (!travel) {
        res.status(404).json(ResponseDTO.fail('Travel not found'));
        return;
      }

      res.json(
        ResponseDTO.success({
          id: travel?.id,
          travelActive: travel?.travelActive,
        }),
      );
    } catch (error) {
      console.error(error);
      res.status(500).json(ResponseDTO.fail((error as Error).message));
    }
  },
);

// 내 여행 관리 페이지
// 여행 삭제, isDeleted: true
// 팀안에 approved 상태인 유저가 없을 경우 삭제 가능
travelRouter.patch('/delete-travel', checkRequiredFieldsBody(['travelId']), async (req, res) => {
  const { travelId } = req.body;
  try {
    const travel = await Travel.findById(travelId);
    if (!travel) {
      res.status(404).json(ResponseDTO.fail('Travel not found'));
      return;
    }

    const teams = await Team.find({
      travelId,
      'appliedUsers.status': 'approved',
    });

    if (teams.length > 0) {
      res.status(400).json(ResponseDTO.fail('Approved user exists'));
      return;
    }

    const updatedTravel = await Travel.findByIdAndUpdate(travelId, {
      isDeleted: true,
    });

    res.json(
      ResponseDTO.success({
        travelId: updatedTravel?.id,
      }),
    );
  } catch (error) {
    console.error(error);
    res.status(500).json(ResponseDTO.fail((error as Error).message));
  }
});

// 내 여행
// 내가 만든 여행 목록 조회
travelRouter.get('/my-created-travels', checkRequiredFieldsQuery(['userId']), async (req, res) => {
  const { userId } = req.query;
  try {
    const user = await User.findById(userId).lean();
    if (!user) {
      res.status(404).json(ResponseDTO.fail('User not found'));
      return;
    }

    const travels = await Travel.find({ userId: user._id }).populate('teamId').lean();
    // 여기 가격, 제목, 별점, 리뷰수 ,업데이트 날짜, 활성화비활성화 여부,해당 여행에 미승인 상태인수
    const userTravelDetails = await Promise.all(
      travels.map(async (travel) => {
        const populatedTravel = await Travel.findById(travel._id).populate('teamId').lean();

        return {
          travelId: populatedTravel?._id,
          travelTitle: populatedTravel?.travelTitle,
          travelPrice: populatedTravel?.travelPrice,
          travelReviewCount: populatedTravel?._id ? await getReviewCount(populatedTravel._id) : 0,
          travelActive: populatedTravel?.travelActive,
          updatedAt: populatedTravel?.updatedAt,
          reviewAverage: populatedTravel?._id ? await getReviewAverage(populatedTravel._id) : 0,
          approveWaitngCount: (Array.isArray(populatedTravel?.teamId)
            ? (populatedTravel.teamId as unknown as {
                appliedUsers: { status: string }[];
              }[])
            : []
          ).reduce((acc, team) => {
            return (
              acc +
              team.appliedUsers.filter((user: { status: string }) => user.status === 'waiting')
                .length
            );
          }, 0),
        };
      }),
    );
    res.json(
      ResponseDTO.success({
        travels: userTravelDetails,
      }),
    );
  } catch (error) {
    console.error(error);
    res.status(500).json(ResponseDTO.fail((error as Error).message));
  }
});

const statusPriority = {
  waiting: 1,
  approved: 2,
  rejected: 3,
};
const sortUsersByStatus = (users: IAppliedUser[]) => {
  return users.sort((a, b) => {
    const userPriorityA = statusPriority[a.status];
    const userPriorityB = statusPriority[b.status];
    if (userPriorityA !== userPriorityB) {
      return userPriorityA - userPriorityB;
    } else {
      return a.appliedAt.getTime() - b.appliedAt.getTime();
    }
  });
};
// 여행 관리 페이지
// /api/v1/travels/manage-my-travel/travelId
// 해당 여행의 팀과 팀에 있는 유저 목록 조회
travelRouter.get(
  '/manage-my-travel/:travelId',
  checkRequiredFieldsParams(['travelId']),
  checkRequiredFieldsQuery(['teamId']),
  async (req, res) => {
    const { travelId } = req.params;
    const { teamId, page = 1, size = 7 } = req.query;
    const page_ = parseInt(page as string, 10) - 1;
    const size_ = parseInt(size as string, 10);

    if (isNaN(page_) || isNaN(size_)) {
      res.status(400).json(ResponseDTO.fail('Invalid page or size'));
      return;
    }

    try {
      const travel = await Travel.findById(travelId).populate('teamId').lean();
      if (!travel) {
        res.status(404).json(ResponseDTO.fail('Travel not found'));
        return;
      }

      const teams = await Team.findOne({ travelId, _id: teamId })
        .populate({
          path: 'appliedUsers.userId',
          select: 'userProfileImage socialName userName userEmail phoneNumber mbti',
        })
        .lean();

      if (!teams) {
        res.status(404).json(ResponseDTO.fail('Team not found'));
        return;
      }

      const appliedUsers =
        teams.appliedUsers.map((user) => ({
          ...user,
          userId: user.userId,
          _id: undefined,
        })) || [];

      const approvedUsers = appliedUsers
        .filter((user) => user.status === 'approved')
        .map((user) => {
          return {
            ...user.userId,
            userId: user.userId._id,
            appliedAt: user.appliedAt,
            status: user.status,
          };
        });

      const paginatedAppliedUsers = sortUsersByStatus(appliedUsers)
        .slice(page_ * size_, (page_ + 1) * size_)
        .map((user) => {
          return {
            ...user.userId,
            userId: user.userId._id,
            appliedAt: user.appliedAt,
            status: user.status,
          };
        });
      const totalElements = appliedUsers.length;
      const totalPages = Math.ceil(totalElements / size_);

      res.json(
        ResponseDTO.success({
          travelId: travel._id,
          teamId: teams._id,
          travelTitle: travel.travelTitle,
          travelStartDate: teams?.travelStartDate,
          travelEndDate: teams?.travelEndDate,
          personLimit: teams?.personLimit,
          travelActive: travel.travelActive,
          appliedUsers: paginatedAppliedUsers,
          approvedUsers,
          pagination: {
            page: Number(page),
            size: Number(size),
            totalElements,
            totalPages,
          },
        }),
      );
    } catch (error) {
      console.error(error);
      res.status(500).json(ResponseDTO.fail((error as Error).message));
    }
  },
);

// 여행 팀 조회
// /api/v1/travels/manage-my-travel-teams/:travelId
// 해당 여행의 팀 목록 조회
// 팀 아이디, 팀 시작날짜, 팀 종료날짜, 팀 인원제한, 팀에 신청한 유저 수, 팀에 승인된 유저 수 조회
travelRouter.get(
  '/manage-my-travel-teams/:travelId',
  checkRequiredFieldsParams(['travelId']),
  async (req, res) => {
    const { travelId } = req.params;
    try {
      const travel = await Travel.findById(travelId).lean();
      if (!travel) {
        res.status(404).json(ResponseDTO.fail('Travel not found'));
        return;
      }

      const teams = (await Team.find({ travelId }).select('_id')).map((team) => team._id);
      res.json(
        ResponseDTO.success({
          travelId: travel._id,
          travelTitle: travel.travelTitle,
          createdAt: travel.createdAt,
          updateAt: travel.updatedAt,
          travelActive: travel.travelActive,
          teamTeams: teams,
        }),
      );
    } catch (error) {
      console.error(error);
      res.status(500).json(ResponseDTO.fail((error as Error).message));
    }
  },
);


// 여행 팀 참가 신청
travelRouter.post('/:teamId/join', checkRequiredFieldsParams(['teamId']),
checkRequiredFieldsBody(['userId']),
async (req, res) => {
  const { teamId } = req.params;
  const { userId } = req.body;
  try {

    const team = await Team.findById(teamId);
    if (!team) {
      res.status(404).json(ResponseDTO.fail('Team not found'));
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json(ResponseDTO.fail('User not found'));
      return;
    }

    if(team.appliedUsers.some((user) => user.userId.equals(userId))) {
      res.status(400).json(ResponseDTO.fail('Already applied'));
      return;
    }

    team.appliedUsers.push({ 
      userId: user._id,
      appliedAt: new Date(),
      status: 'waiting',
    });

    await team.save();

    const updatedTeam = await Team.findById(teamId).lean();

    res.json(ResponseDTO.success({ 
      travelId: updatedTeam?.travelId,
      teamId: updatedTeam?._id,
      currentMemberCount: updatedTeam?.appliedUsers.length,
      travelStartDate: updatedTeam?.travelStartDate,
      travelEndDate: updatedTeam?.travelEndDate,
      personLimit: updatedTeam?.personLimit,
      user: updatedTeam?.appliedUsers.filter((user) => user.userId.equals(userId)),
    }));
  } catch (error) {
    console.error(error);
    res.status(500).json(ResponseDTO.fail((error as Error).message));
  }
});




export { travelRouter };
