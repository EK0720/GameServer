const Database = require('../../Config/Database');
const { sign } = require("jsonwebtoken");

const db = new Database();

// Lấy dữ liệu mẫu từ cơ sở dữ liệu
const getSampleData = (req, res) => {
  db.GetSampleData(results => {
    res.json(results);
  });
};

// Lấy dữ liệu mẫu theo tên người dùng
const getSampleDataByUsername = (req, res) => {
  const { username } = req.params;
  db.GetSampleDataByUsername(username, results => {
    res.json(results);
  });
};

// Tạo tài khoản mới
const createAccount = (req, res) => {
  const { username, password, email } = req.body;
  db.CreateAccount(username, password, email, result => {
    res.json(result);
  });
};

// Đăng nhập
// const signIn = (req, res) => {
//   const { username, password } = req.body;
//   db.SignIn(username, password, result => {
//     if (result.reason == "Success.") {
//       const jsontoken = sign({ username }, "NguyenHuuTuan", {
//         expiresIn: "1h"
//       });
//       res.json({
//         reason: "Success.",
//         message: "Login successfully",
//         token: jsontoken
//       });
//     } else res.json(result);
//   });
// };
const signIn = (req, res) => {
  const { username, password } = req.body;
  if (username !== 'Adminstrator') {
    res.json({
      reason: "Failed.",
      message: "Only the Adminstrator account can log in."
    });
    return;
  }
  db.SignIn(username, password, result => {
    if (result.reason == "Success.") {
      const jsontoken = sign({ username }, "NguyenHuuTuan", {
        expiresIn: "1h"
      });
      res.json({
        reason: "Success.",
        message: "Login successfully",
        token: jsontoken
      });
    } else res.json(result);
  });
};


// Xóa người dùng
const deleteUser = (req, res) => {
  const { id } = req.params;
  db.DeleteUsers(id, result => {
    res.json(result);
  });
};

const getLeaderboard = (req, res) => {
  const { top, game_name } = req.params;
  const topInt = parseInt(top, 10); // Chuyển đổi top thành số nguyên
  
  if (isNaN(topInt) || topInt <= 0) {
    // Xử lý khi top không hợp lệ
    res.status(400).json({ error: "Invalid top value" });
  } else if (!game_name) {
    // Xử lý khi game_name không được xác định
    res.status(400).json({ error: "game_name is required" });
  } else {
    db.ShowLeaderboard(topInt, game_name, (result) => {
      res.json(result);
    });
  }
};
const checkFriend = (req, res) => {
  const { username } = req.params;
  db.FriendList(username, (result) => {
    res.json(result);
  });
};
const unFriend = (req, res) => {
  const { username, friendname } = req.params;

  if (!username || !friendname) {
    return res.status(400).json({ error: "Invalid username or friendname" });
  }

  db.unFriend(username, friendname, (result) => {
    res.json(result);
  });
};
const updateUserDataById = (req, res) => {
  const { id } = req.params;
  const { email, userName, password, displayName } = req.body;

  db.UpdateById(id, email, userName, password, displayName, (result) => {
    res.json(result);
  });
};

const getUserPurchases = (req, res) => {
  const { username } = req.params;
  db.getUserPurchasesByUsername(username, result => {
    res.json(result);
  });
};
const addUserPurchases = (req, res) => {
  const { username } = req.params;
  const { item_name } = req.body;
  db.addPurchase(username, item_name, result => {
    res.json(result);
  });
};
const getMessage = (req, res) => {
  const {senderName, receiverName} = req.body;
  db.getMessagesByUsername(senderName, receiverName, result => {
    res.json(result);
  });
};
const deleteMessage = (req, res) => {
  const { id } = req.params;
  db.deleteMessageById(id, result => {
    res.json(result);
  });
};
module.exports = {
  getSampleData,
  getSampleDataByUsername,
  createAccount,
  signIn,
  deleteUser,
  getLeaderboard,
  checkFriend,
  unFriend,
  updateUserDataById,
  getUserPurchases,
  addUserPurchases,
  getMessage,
  deleteMessage
};