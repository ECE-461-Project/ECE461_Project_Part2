import {NextFunction, Request, Response} from 'express';
import * as jwt from 'jsonwebtoken';
import {auth_secret} from '../config/auth';
import {DecodedJWT} from '../controllers/authenticate_controller';

export function verifyToken(req: Request, res: Response, next: NextFunction) {
  const token = req.get('X-Authorization');
  if (typeof token === 'string') {
    try {
      const auth_token: string = token.split(' ')[1];
      jwt.verify(auth_token, auth_secret, {}, (err, decoded: any) => {
        if (err) {
          globalThis.logger?.info(err);
          res.status(400).send();
        } else {
          const payload: DecodedJWT = decoded;
          res.locals.Username = payload.Username; // Save the username to the response
          res.locals.UserID = payload.UserID; // Save the UserID for the foreign key
          next();
        }
      });
    } catch (err) {
      globalThis.logger?.info(err);
      res.status(400).send();
    }
  } else {
    globalThis.logger?.info('No token defined');
    res.status(400).send();
  }
}
