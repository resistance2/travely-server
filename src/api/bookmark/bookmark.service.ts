import mongoose, { Types } from 'mongoose';
import { tagPathToTagType } from '../../convert';
import { Bookmark, ITravel, IUser } from '../../db/schema';
import { IBookmark } from '../../db/schema';
import { getReviewAverage, getReviewCount } from '../travel/travel.route';

export class BookmarkService {
  async createBookmark(userId: Types.ObjectId, travelId: Types.ObjectId) {
    const isBookmarked = await Bookmark.findOne({ userId, travelId });
    if (isBookmarked) {
      return null;
    }
    const bookmark = new Bookmark({
      userId,
      travelId,
      bookmarkAt: new Date(),
    });
    return await bookmark.save();
  }

  async getUserBookmarks(userId: Types.ObjectId) {
    const bookmarks = await Bookmark.find({ userId: userId })
      .populate<{ travelId: ITravel & { userId: IUser; _id: mongoose.Types.ObjectId } }>({
        path: 'travelId',
        populate: { path: 'userId' },
      })
      .sort({ bookmarkAt: -1 })
      .lean();
    if (!bookmarks) {
      return [];
    }
    const userBookmarks = await Promise.all(
      bookmarks
        .filter((bookmark) => bookmark.travelId)
        .map(async (bookmark) => {
          return {
            id: bookmark._id,
            thumbnail: bookmark.travelId.thumbnail,
            travelTitle: bookmark.travelId.travelTitle,
            tag: bookmark.travelId.tag.map(
              (tag) => tagPathToTagType[tag as keyof typeof tagPathToTagType],
            ),
            bookmark: true,
            createdBy: {
              userId: bookmark.travelId.userId._id,
              userName: bookmark.travelId.userId.userName || bookmark.travelId.userId.socialName,
            },
            price: bookmark.travelId.travelPrice,
            review: {
              travelScore: await getReviewAverage(bookmark.travelId._id),
              reviewCnt: await getReviewCount(bookmark.travelId._id),
            },
            createdAt: bookmark.travelId.createdAt,
            bookmarkAt: bookmark.bookmarkAt,
          };
        }),
    );
    return userBookmarks;
  }

  async removeBookmark(userId: Types.ObjectId, travelId: Types.ObjectId) {
    const isBookmarked = await this.isBookmarked(userId, travelId);
    if (!isBookmarked) {
      return null;
    }
    return await Bookmark.findOneAndDelete({ userId, travelId });
  }

  async isBookmarked(userId: Types.ObjectId, travelId: Types.ObjectId): Promise<boolean> {
    if (!userId || !travelId) return false;
    const bookmark = await Bookmark.findOne({ userId, travelId });
    return !!bookmark;
  }

  async getBookmarkCount(travelId: Types.ObjectId): Promise<number> {
    if (!travelId) return 0;
    const bookmarks = await Bookmark.countDocuments({ travelId });
    return bookmarks;
  }
}

export default new BookmarkService();
