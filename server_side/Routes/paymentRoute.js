const express = require('express');
const { paymentReceipt, getAllReceiptsForUser} = require('../controller/paymentReceipt');
const router = express.Router();

router.get('/api/v1/payment/singleReceipt/:userId/:paymentId', paymentReceipt);
router.get('/api/v1/payment/student/:userId', getAllReceiptsForUser);


module.exports = router;
