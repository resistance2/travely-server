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
