import express = require('express');
export const router = express.Router();

import * as pack from '../controllers/package_controller';

router.post('/', pack.package_post);

router.get('/byName/:name', pack.package_byName_name_get);
router.delete('/byName/:name', pack.package_byName_name_delete);

router.post('/byRegEx/:regex', pack.package_byRegEx_regex_post);

router.get('/:id', pack.package_id_get);
router.put('/:id', pack.package_id_put);
router.delete('/:id', pack.package_id_delete);
router.get('/:id/rate', pack.package_id_rate_get);
