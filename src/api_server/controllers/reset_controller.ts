// You should use models for return
import {Request, Response} from 'express';

export function reset(req: Request, res: Response) {
  res.status(200).send('This is wrong response btw');
}