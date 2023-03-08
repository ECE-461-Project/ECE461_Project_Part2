// You should use models
// Models not defined
import {Request, Response} from 'express';

export function packages_list(req: Request, res: Response) {
  res.status(200).send('This is wrong response btw');
}
