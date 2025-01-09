type User = {
  userProfileImage: string;
  socialName: string;
  userEmail: string;
  isVerifiedUser: boolean;
  userId: string;
};

interface Review {
  id: number;
  title: string;
  content: string;
  imgSrc?: string;
  createdAt?: Date;
  rating: number;
  user?: User;
}

interface ApplicationUserData {
  status: Status;
  userName: string;
  userEmail: string;
  userProfileImage: string;
  mbti: string;
  phoneNumber: string;
  userId: string;
  appliedAt: string;
}

interface TravelTeamData {
  teamId: string;
  travelStartDate: string;
  travelEndDate: string;
  personLimit: number;
  appliedUsers?: ApplicationUserData[];
  approvedUsers?: ApplicationUserData[];
}

type Status = 'waiting' | 'approved' | 'rejected';

export interface TravelDetailData {
  guide: {
    userProfileImage: string;
    socialName: string;
    userEmail: string;
    guideTotalRating: number; // 가이드가 업로드한 여행자구해요 글들의 평균 별점
  };
  title: string;
  content: string;
  price: number;
  thumbnail: string;
  tag: string[];
  travelCourse: string[];
  includedItems: string[] | null;
  excludedItems: string[] | null;
  meetingTime: string[] | null;
  meetingPlace: string | null;
  FAQ: { question: string; answer: string }[] | null;
  reviews: Review[];
  teams: Pick<
    TravelTeamData,
    'travelStartDate' | 'travelEndDate' | 'personLimit' | 'approvedUsers'
  >[];
  totalRating: number;
  bookmark: number;
}

export interface FindGuideData {
  author: {
    // 글쓴이 정보 필수
    userId: string;
    userProfileImage: string;
    socialName: string;
    userEmail: string;
    userScore: number;
  };
  title: string; // 제목 필수
  content: string; // 글 필수
  thumbnail: string | null; // 썸네일 선택
  team: Pick<TravelTeamData, 'travelStartDate' | 'travelEndDate' | 'personLimit'>[];
  // team: [{‘teamId’ | 'travelStartDate' | 'travelEndDate' | 'personLimit' }] 필수 ,
  // 가이드 구해요 페이지는 “일정 추가” 하나만 추가 가능하기때문에 한개만 있을 거임
  commentList: [
    // 댓글 목록, 댓글이 있을수도 있고 없을수도 있음 Comment[] | null
    {
      userId: string;
      updatedAt: string;
      socialName: string;
      userProfileImage: string;
      comment: string;
    }, // 댓글 작성한 유저데이터와 댓글 정보, 모두 필수
  ];
}
