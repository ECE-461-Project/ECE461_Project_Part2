import express = require('express');
export const router = express.Router();

import {packages_list} from '../controllers/packages_controller';

// This will handle the packages route
// Note that the route HERE is defined with / but will be used in index
//  with the /packages route
//  / here maps to /packages

router.post('/', packages_list);
