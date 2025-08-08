import { Request, Response } from 'express';
import { User } from '../../user/user.entity';

export interface GraphQLContext {
  req: Request;
  res: Response;
  user?: User;
  token?: string;
}

