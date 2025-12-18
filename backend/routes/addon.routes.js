const express = require('express');
const router = express.Router();
const addonController = require('../controllers/addon.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.get('/', addonController.getAllAddons);
router.get('/:id', addonController.getAddonById);

router.post('/', authenticate, authorize('admin'), upload.single('addonImage'), addonController.createAddon);
router.put('/:id', authenticate, authorize('admin'), upload.single('addonImage'), addonController.updateAddon);
router.delete('/:id', authenticate, authorize('admin'), addonController.deleteAddon);

module.exports = router;
