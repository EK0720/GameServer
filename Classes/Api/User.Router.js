const express = require('express');
const router = express.Router();
const { checkToken } = require("../Auth/AuthenticateToken");
const userController = require('./user.controller');

// Định nghĩa các tuyến đường cho nguồn dữ liệu mẫu
router.get('/user', checkToken, userController.getSampleData);
router.get('/:username', checkToken, userController.getSampleDataByUsername);
router.post('/create',checkToken,  userController.createAccount);
router.post('/signin', userController.signIn);
router.delete('/user/:id',checkToken , userController.deleteUser);

router.get('/leaderboard/:top/:game_name',checkToken, userController.getLeaderboard);

router.get('/checkfriend/:username',checkToken, userController.checkFriend);
router.delete('/unfriend/:username/:friendname',checkToken, userController.unFriend);
router.put('/user/update/:id',checkToken, userController.updateUserDataById);
router.get('/user/purchases/:username',checkToken, userController.getUserPurchases);
router.post('/user/addpurchases/:username',checkToken, userController.addUserPurchases);
router.post('/user/message',checkToken, userController.getMessage);
router.delete('/user/message/:id',checkToken, userController.deleteMessage);

module.exports = router;

