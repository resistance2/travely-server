import { NextFunction, Request, Response } from 'express';
import { ResponseDTO } from './ResponseDTO';

export const checkRequiredFieldsBody = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const field of fields) {
      if (!(field in req.body)) {
        res.status(400).json(ResponseDTO.fail(`${field} is required`));
        return;
      }
    }
    next();
  };
};

export const checkRequiredFieldsQuery = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const field of fields) {
      if (!(field in req.query)) {
        res.status(400).json(ResponseDTO.fail(`${field} is required`));
        return;
      }
    }
    next();
  };
};

export const checkRequiredFieldsParams = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const field of fields) {
      if (!(field in req.params)) {
        res.status(400).json(ResponseDTO.fail(`${field} is required`));
        return;
      }
    }
    next();
  };
};
