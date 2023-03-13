import express = require('express');
export const router = express.Router();

import {authenticate} from '../controllers/authenticate_controller';

router.put('/', authenticate);
