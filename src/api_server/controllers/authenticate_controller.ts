// You should use models for return
import {Request, Response} from 'express';
import {users} from '../db_connector';
import {AuthenticationRequest} from '../models/models';
import * as jwt from 'jsonwebtoken';

import {auth_secret} from '../config/auth';

export interface DecodedJWT {
  Username: string;
  UserID: number;
}

export async function authenticate(req: Request, res: Response) {
  const auth_req: AuthenticationRequest = req.body;
  const user = await users.findOne({where: {Username: auth_req.User.name}});
  if (user) {
    if (user.UserPassword === auth_req.Secret.password) {
      const payload = {
        Username: user.Username,
        UserID: user.UserID,
      };
      jwt.sign(payload, auth_secret, {expiresIn: '10h'}, (err, token) => {
        if (err) {
          // Error 501 is auth not supported -> but we do support authorization
          // Error 500 is internal server error and is not documented
          res.status(400).send();
        }
        res.status(200).json(token);
      });
    } else {
      res.status(401).send();
    }
  } else {
    res.status(401).send();
  }
}
