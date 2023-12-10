const express = require('express');
const router = express.Router();
const { checkToken } = require("../Auth/AuthenticateToken");
const userController = require('./user.controller');

// Định nghĩa các tuyến đường cho nguồn dữ liệu mẫu
router.get('/user', userController.getSampleData);
router.get('/:username', checkToken, userController.getSampleDataByUsername);
router.post('/create', userController.createAccount);
router.post('/signin', userController.signIn);
router.delete('/user/:id', userController.deleteUser);

router.get('/leaderboard/:top/:game_name', userController.getLeaderboard);

router.get('/checkfriend/:username', userController.checkFriend);
router.delete('/unfriend/:username/:friendname', userController.unFriend);
router.put('/user/update/:id', userController.updateUserDataById);
router.get('/user/purchases/:username', userController.getUserPurchases);
router.post('/user/addpurchases/:username', userController.addUserPurchases);
router.post('/user/message', userController.getMessage);
router.delete('/user/message/:id', userController.deleteMessage);

module.exports = router;

