import { Router } from 'express';
import { User } from './user.schema';

const userRouter = Router();

// export interface IUser extends Document {
//     username: string;
//     email: string;
//     profileImageUrl: string;
//     createdAt: Date;
//   }

// curl -X GET http://localhost:3000/api/v1/users
userRouter.get('/', async (_req, res) => {
  const users = await User.find();
  res.json(users);
});

// curl -X GET http://localhost:3000/api/v1/users/60d7b0e0c4c0c20015f0a4b7
userRouter.get('/:id', async (req, res) => {
  const { id } = req.params;
  const foundUser = await User.findById(id);
  res.json(foundUser);
});

// curl -X POST -H "Content-Type: application/json" -d '{"username": "test", "email": "badaclock@gmail.com", "profileImageUrl": "https://avatars.githubusercontent.com/u/77449510?v=4"}' http://localhost:3000/api/v1/users
userRouter.post('/', async (req, res) => {
  const newUser = await User.create(req.body);
  res.json(newUser);
});

// curl -X DELETE http://localhost:3000/api/v1/users/60d7b0e0c4c0c20015f0a4b7
userRouter.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updatedUser = await User.findByIdAndUpdate(id, req.body);
  res.json(updatedUser);
});

export { userRouter };
