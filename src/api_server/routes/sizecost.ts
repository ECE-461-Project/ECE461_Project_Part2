import express = require('express');
export const router = express.Router();

import {get_size_cost} from '../controllers/sizecost_controller';

router.post('/', get_size_cost);
