import express = require('express');
export const router = express.Router();

import {reset} from '../controllers/reset_controller';

router.delete('/', reset);
