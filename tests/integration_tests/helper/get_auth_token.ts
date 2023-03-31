import * as jwt from 'jsonwebtoken';
import {auth_secret} from '../../../src/api_server/config/auth';

export function get_auth_token() {
  const payload = {
    Username: 'ece30861defaultadminuser',
  };
  const token = jwt.sign(payload, auth_secret, {expiresIn: '10h'});
  return token;
}
