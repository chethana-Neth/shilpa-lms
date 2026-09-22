const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/noticeController');

router.get('/:courseId', noticeController.getNotices);
router.post('/create', noticeController.createNotice);
router.put('/:noticeId', noticeController.updateNotice);
router.delete('/:noticeId', noticeController.deleteNotice);

module.exports = router;