import { Router } from 'express';
import { ResponseDTO } from '../../ResponseDTO';
import { checkRequiredFieldsBody, checkRequiredFieldsQuery } from '../../checkRequiredFields';
import { Travel, User } from '../../db';
import { validObjectId } from '../../validChecker';
import bookmarkService from './bookmark.service';

const bookmarkRouter = Router();

bookmarkRouter.get('/', checkRequiredFieldsQuery(['userId']), async (req, res) => {
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
    const bookmarks = await bookmarkService.getUserBookmarks(user._id);
    res.json(
      ResponseDTO.success({
        bookmarks,
      }),
    );
  } catch (error) {
    console.error(error);
    res.status(500).json(ResponseDTO.fail((error as Error).message));
  }
});

bookmarkRouter.post('/', checkRequiredFieldsBody(['userId', 'travelId']), async (req, res) => {
  const { userId, travelId } = req.body;
  try {
    const travel = await Travel.findById(travelId);
    if (!travel) {
      res.status(404).json(ResponseDTO.fail('Travel not found'));
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json(ResponseDTO.fail('User not found'));
      return;
    }

    const bookmark = await bookmarkService.createBookmark(userId, travelId);
    if (!bookmark) {
      res.status(400).json(ResponseDTO.fail('Already Bookmarked'));
      return;
    }

    res.json(
      ResponseDTO.success({
        id: bookmark._id,
        userId: bookmark.userId,
        isBookmark: true,
      }),
    );
  } catch (error) {
    console.error(error);
    res.status(500).json(ResponseDTO.fail((error as Error).message));
    return;
  }
});

bookmarkRouter.delete('/', checkRequiredFieldsQuery(['userId', 'travelId']), async (req, res) => {
  const { userId, travelId } = req.query;
  try {
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json(ResponseDTO.fail('User not found'));
      return;
    }

    const travel = await Travel.findById(travelId);
    if (!travel) {
      console.log('userId, travelId', userId, travelId);
      res.status(404).json(ResponseDTO.fail('Travel not found'));
      return;
    }
    const bookmark = await bookmarkService.removeBookmark(user._id, travel._id);
    if (!bookmark) {
      res.status(400).json(ResponseDTO.fail('Bookmark not found'));
      return;
    }

    res.json(
      ResponseDTO.success({
        id: bookmark._id,
        userId: bookmark.userId,
        isBookmark: false,
      }),
    );
  } catch (error) {
    console.error(error);
    res.status(500).json(ResponseDTO.fail((error as Error).message));
    return;
  }
});

export default bookmarkRouter;
