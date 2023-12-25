let MySql = require('mysql')
let DatabaseSettings = require('../Files/DatabaseSettings.json')
let DatabaseSettingsLocal = require('../Files/DatabaseSettingsLocal.json')
let PasswordHash = require('password-hash')
let otpGenerator = require("otp-generator");
let emailUtils = require("./emailUtils");
let uuid = require("uuid");
module.exports = class Database {
    constructor(isLocal = false) {
        this.currentSettings = (isLocal) ? DatabaseSettingsLocal : DatabaseSettings;
        this.pool = MySql.createPool({
            host: this.currentSettings.Host,
            user: this.currentSettings.User,
            password: this.currentSettings.Password,
            database: this.currentSettings.Database
        });
    }

    Connect(callback) {
        let pool = this.pool;
        pool.getConnection((error, connection) => {
            if (error) throw error;
            callback(connection);
        });
    }

    GetSampleData(callback) {
        this.Connect(connection => {
            let query = "SELECT * FROM users";

            connection.query(query, (error, results) => {
                connection.release();
                if (error) throw error;
                callback(results);
            });
        });
    }
    DeleteUsers(userId, callback) {
      this.Connect((connection) => {
        let query = "DELETE FROM users WHERE id = ?";
    
        connection.query(query, [userId], (error, results) => {
          connection.release();
          if (error) {
            throw error;
          }
    
          if (results.affectedRows > 0) {
            callback({
              valid: true,
              reason: "User deleted successfully.",
            });
          } else {
            callback({
              valid: false,
              reason: "User not found.",
            });
          }
        });
      });
    }
    UpdateById(id, email, username, password, displayName, callback) {
      this.Connect((connection) => {
        let query = "UPDATE users SET ";
    
        const values = [];
    
        if (email) {
          query += "email = ?, ";
          values.push(email);
        }
    
        if (username) {
          query += "username = ?, ";
          values.push(username);
        }
    
        if (password) {
          query += "password = ?, ";
          values.push(PasswordHash.generate(password));
        }
    
        if (displayName) {
          query += "displayName = ?, ";
          values.push(displayName);
        }
    
        // Remove the trailing comma and space
        query = query.slice(0, -2);
    
        query += " WHERE id = ?";
    
        values.push(id);
    
        connection.query(query, values, (error, results) => {
          connection.release();
          if (error) throw error;
          callback(results);
        });
      });
    }
    GetSampleDataByUsername(username, callback) {
        this.Connect(connection => {
            let query = "SELECT * FROM users WHERE username = ?";

            connection.query(query, [username], (error, results) => {
                connection.release();
                if (error) throw error;
                callback(results);
            });
        });
    }

    //ACCOUNT QUERIES
    CreateAccount(username, password, email, callback) {
      this.Connect(connection => {
        let checkQuery = "SELECT COUNT(*) AS count FROM users WHERE username = ? OR email = ?";
        connection.query(checkQuery, [username, email], (error, results) => {
          if (error) {
            throw error;
          }
    
          const count = results[0].count;
          if (count > 0) {
            let response = {
              valid: false,
              reason: "Username or email already exists."
            };
            callback(response);
          } else {
            var hashedPassword = PasswordHash.generate(password);
            var id = uuid.v4();
            var createTime = new Date().toISOString();
    
            let insertQuery = "INSERT INTO users (id, username, password, email, displayName, createTime) VALUES (?, ?, ?, ?, NULL, ?)";
            connection.query(insertQuery, [id, username, hashedPassword, email, createTime], (error, results) => {
              connection.release();
              if (error) {
                throw error;
              }
    
              if (results.affectedRows > 0) {
                let response = {
                  valid: true,
                  reason: "Account created successfully."
                };
                callback(response);
              } else {
                let response = {
                  valid: false,
                  reason: "Failed to create account."
                };
                callback(response);
              }
            });
          }
        });
      });
    }
    
    SignIn(username, password, callback) {
        this.Connect(connection => {
            let query = "SELECT password FROM users WHERE username = ?";

            connection.query(query, [username], (error, results) => {
                connection.release();
                if (error) {
                    throw error;
                }

                if (results[0] != undefined) {
                    if (PasswordHash.verify(password, results[0].password)) {
                        callback({
                            valid: true,
                            reason: "Success."
                        });
                    } else {
                        //In reality you should never return this or youll get botted hahahah
                        callback({
                            valid: false,
                            reason: "Password does not match."
                        });
                    }
                } else {
                    callback({
                        valid: false,
                        reason: "User does not exists."
                    });
                }
            });
        });
    }
    ChangePassword(username, currentPassword, newPassword, callback) {
      this.Connect(connection => {
        let query = "SELECT password FROM users WHERE username = ?";
    
        connection.query(query, [username], (error, results) => {
          connection.release();
          if (error) {
            throw error;
          }
    
          if (results[0] != undefined) {
            const hashedPassword = results[0].password;
    
            if (PasswordHash.verify(currentPassword, hashedPassword)) {
              let updateQuery = "UPDATE users SET password = ? WHERE username = ?";
              connection.query(updateQuery, [PasswordHash.generate(newPassword), username], (error, results) => {
                if (error) {
                  throw error;
                }
    
                callback({
                  valid: true,
                  reason: "Password changed successfully."
                });
              });
            } else {
              callback({
                valid: false,
                reason: "Current password is incorrect."
              });
            }
          } else {
            callback({
              valid: false,
              reason: "User does not exist."
            });
          }
        });
      });
    }
    ForgotPassword(email, callback) {
      this.Connect(connection => {
        let query = "SELECT username, password FROM users WHERE email = ?";
    
        connection.query(query, [email], (error, results) => {
          connection.release();
          if (error) {
            throw error;
          }
    
          if (results[0] != undefined) {
            const username = results[0].username;
            const newpassword = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });
    
            // Cập nhật mật khẩu mới vào cơ sở dữ liệu
            let updateQuery = "UPDATE users SET password = ? WHERE email = ?";
            connection.query(updateQuery, [PasswordHash.generate(newpassword), email], (error, results) => {
              if (error) {
                throw error;
              }
    
              emailUtils.sendPasswordByEmail(email, username, newpassword);
    
              callback({
                valid: true,
                reason: "OTP sent to email."
              });
            });
          } else {
            callback({
              valid: false,
              reason: "User does not exist."
            });
          }
        });
      });
    }
    GetUserId(username, callback) {
      this.Connect(connection => {
        let query = "SELECT id FROM users WHERE username = ?";
      
        connection.query(query, [username], (error, results) => {
          connection.release();
          if (error) {
            throw error;
          }
      
          if (results[0] != undefined) {
            callback(results[0].id);
          } else {
            callback(null);
          }
        });
      });
    }
    GetUsername(username, callback) {
        this.Connect(connection => {
          let query = "SELECT displayName FROM users WHERE username = ?";
        
          connection.query(query, [username], (error, results) => {
            connection.release();
            if (error) {
              throw error;
            }
        
            if (results[0] != undefined) {
              callback(results[0].displayName);
            } else {
              callback(null);
            }
          });
        });
      }
      GetUserProfile(username, callback) {
        this.Connect(connection => {
          let query = `
            SELECT u.id, u.userName, u.displayName, u.online, u.email, l.game_name, l.score
            FROM users u
            LEFT JOIN leaderboard l ON u.id = l.user_id
            WHERE u.userName = ?
          `;
        
          connection.query(query, [username], (error, results) => {
            connection.release();
            if (error) {
              throw error;
            }
        
            if (results.length > 0) {
              const userData = {
                username: results[0].userName,
                displayName: results[0].displayName,
                online: results[0].online,
                email: results[0].email,
                games: []
              };
      
              results.forEach(row => {
                const gameData = {
                  game_name: row.game_name,
                  score: row.score
                };
                userData.games.push(gameData);
              });
              
              callback(userData);
            } else {
              callback(null);
            }
          });
        });
      }
      UpdateDisplayName(username, displayName, callback) {
        this.Connect(connection => {
          let query = "UPDATE users SET displayName = ? WHERE username = ?";
        
          connection.query(query, [displayName, username], (error, results) => {
            connection.release();
        
            if (error) {
                throw error;
            } else {
              callback("Success");
            }
          });
        });
      }
      SwitchUserOnlineStatus(username, onlineStatus, callback) {
        this.Connect(connection => {
            let query = "UPDATE users SET online = ? WHERE username = ?";
    
            connection.query(query, [onlineStatus, username], (error, results) => {
                connection.release();
                if (error) {
                    throw error;
                }
    
                if (results.affectedRows > 0) {
                    callback({
                        valid: true,
                        reason: "User online status updated successfully."
                    });
                } else {
                    callback({
                        valid: false,
                        reason: "Failed to update user online status."
                    });
                }
            });
        });
    }
    sendFriendRequest(senderUsername, friendUsername, callback) {
      this.Connect((connection) => {
        const friendshipId = uuid.v4();
        let query = "INSERT INTO friendships (friendship_id, user_id, friend_id) SELECT ?, u1.id, u2.id FROM users u1, users u2 WHERE u1.username = ? AND u2.username = ?";
        
        connection.query(query, [friendshipId, senderUsername, friendUsername], (error, results) => {
          connection.release();
          if (error) {
            throw error;
          }
          
          if (results.affectedRows > 0) {
            callback({
              valid: true,
              reason: "Friend request sent successfully.",
            });
          } else {
            callback({
              valid: false,
              reason: "Failed to send friend request.",
            });
          }
        });
      });
    }
    acceptFriendRequest(username, friendUsername, callback) {
      this.Connect((connection) => {
        const query = "UPDATE friendships SET status = 1, latestUpdate = CURRENT_TIMESTAMP WHERE (user_id = (SELECT id FROM users WHERE username = ?) AND friend_id = (SELECT id FROM users WHERE username = ?)) OR (user_id = (SELECT id FROM users WHERE username = ?) AND friend_id = (SELECT id FROM users WHERE username = ?))";
    
        connection.query(query, [username, friendUsername, friendUsername, username], (error, results) => {
          connection.release();
          if (error) {
            throw error;
          }
    
          if (results.affectedRows > 0) {
            callback({
              valid: true,
              reason: "Friend request accepted successfully.",
            });
          } else {
            callback({
              valid: false,
              reason: "Failed to accept friend request. Invalid username or friendUsername provided.",
            });
          }
        });
      });
    }
    unFriend(username, friendUsername, callback) {
      this.Connect((connection) => {
        let query = "DELETE FROM friendships WHERE (user_id = (SELECT id FROM users WHERE username = ?) AND friend_id = (SELECT id FROM users WHERE username = ?)) OR (user_id = (SELECT id FROM users WHERE username = ?) AND friend_id = (SELECT id FROM users WHERE username = ?))";
    
        connection.query(query, [username, friendUsername, friendUsername, username], (error, results) => {
          connection.release();
          if (error) {
            throw error;
          }
    
          if (results.affectedRows > 0) {
            callback({
              valid: true,
              reason: "Friend removed successfully.",
            });
          } else {
            callback({
              valid: false,
              reason: "Failed to remove friend.",
            });
          }
        });
      });
    }
    checkFriendRequest(username, callback) {
      this.Connect((connection) => {
        let query = "SELECT f.*, u1.username AS user_username, u2.username AS friend_username, u2.online AS friend_online FROM friendships f INNER JOIN users u1 ON f.user_id = u1.id INNER JOIN users u2 ON f.friend_id = u2.id WHERE u1.username = ? OR u2.username = ?";
        
        connection.query(query, [username, username], (error, results) => {
          connection.release();
          if (error) {
            throw error;
          }
          
          const friendNames = results.map((friendship) => {
            if (friendship.user_username === username) {
              if (friendship.status === 0) {
                return `${friendship.friend_username}: Friend request sent- ${friendship.friend_online}`;
              } else if (friendship.status === 1) {
                return `${friendship.friend_username}: Accepted- ${friendship.friend_online}`;
              } else {
                return `${friendship.friend_username}: Pending- ${friendship.friend_online}`;
              }
            } else {
              if (friendship.status === 0) {
                return `${friendship.user_username}: Friend request received- ${friendship.friend_online}`;
              } else if (friendship.status === 1) {
                return `${friendship.user_username}: Accepted- ${friendship.friend_online}`;
              } else {
                return `${friendship.user_username}: Pending- ${friendship.friend_online}`;
              }
            }
          });
          
          callback({
            friendNames: friendNames,
          });
        });
      });
    }
    FriendList(userId, callback) {
      this.Connect((connection) => {
        let query = "SELECT f.*, u1.id AS user_id, u1.username AS user_username, u2.username AS friend_username FROM friendships f INNER JOIN users u1 ON f.user_id = u1.id INNER JOIN users u2 ON f.friend_id = u2.id WHERE u1.id = ? OR u2.id = ?";
        
        connection.query(query, [userId, userId], (error, results) => {
          connection.release();
          if (error) {
            throw error;
          }
          
          const friendData = results.map((friendship) => {
            const friendId = friendship.user_id === friendship.friend_id ? friendship.user_id : friendship.user_id === userId ? friendship.friend_id : friendship.user_id;
            const friendUsername = friendship.user_id === userId ? friendship.friend_username : friendship.user_username;
            
            let status = "";
            if (friendship.user_id === userId) {
              if (friendship.status === 0) {
                status = "Friend request sent";
              } else if (friendship.status === 1) {
                status = "Accepted";
              } else {
                status = "Pending";
              }
            } else {
              if (friendship.status === 0) {
                status = "Friend request received";
              } else if (friendship.status === 1) {
                status = "Accepted";
              } else {
                status = "Pending";
              }
            }
            
            return {
              userId: friendId,
              username: friendUsername,
              status,
              latestUpdate: friendship.latestUpdate,
            };
          });
          
          callback({
            friendData: friendData,
          });
        });
      });
    }
    UpdateUserLeaderboard(username, game_name, score, callback) {
      this.Connect(connection => {
        let user_query = "SELECT id FROM users WHERE username = ?";
        let select_leaderboard_query = "SELECT id, score FROM leaderboard WHERE user_id = ? AND game_name = ?";
        let insert_leaderboard_query = "INSERT INTO leaderboard (id, user_id, username, game_name, score) VALUES (?, ?, ?, ?, ?)";
        let update_leaderboard_query = "UPDATE leaderboard SET score = ? WHERE id = ?";
    
        let id = uuid.v4();
    
        connection.query(user_query, [username], (user_error, user_results) => {
          if (user_error) {
            throw user_error;
          }
    
          if (user_results.length > 0) {
            let user_id = user_results[0].id;
    
            connection.query(select_leaderboard_query, [user_id, game_name], (select_error, select_results) => {
              if (select_error) {
                throw select_error;
              }
    
              if (select_results.length > 0) {
                let leaderboard_id = select_results[0].id;
                let current_score = select_results[0].score;
                let updated_score = current_score + score;
    
                connection.query(update_leaderboard_query, [updated_score, leaderboard_id], (update_error, update_results) => {
                  connection.release();
                  if (update_error) {
                    throw update_error;
                  }
    
                  callback({
                    valid: true,
                    reason: "Leaderboard updated successfully."
                  });
                });
              } else {
                connection.query(insert_leaderboard_query, [id, user_id, username, game_name, score], (insert_error, insert_results) => {
                  connection.release();
                  if (insert_error) {
                    throw insert_error;
                  }
    
                  callback({
                    valid: true,
                    reason: "Leaderboard updated successfully."
                  });
                });
              }
            });
          } else {
            callback({
              valid: false,
              reason: "User does not exist."
            });
          }
        });
      });
    }
  ShowLeaderboard(top, game_name, callback) {
    this.Connect((connection) => {
      let leaderboard_query =
        "SELECT user_id, username, score, latestUpdate FROM leaderboard WHERE game_name = ? ORDER BY score DESC LIMIT ?";

      connection.query(leaderboard_query, [game_name, top], (error, results) => {
        connection.release();
        if (error) {
          throw error;
        }

        let leaderboard = results.map((result) => {
          return {
            user_id: result.user_id,
            username: result.username,
            score: result.score,
            lastUpdated: result.latestUpdate,
          };
        });

        callback({
          success: true,
          leaderboard: leaderboard,
        });
      });
    });
  }
  getUserPurchasesByUsername(username, callback) {
    this.Connect(connection => {
      let query = "SELECT id FROM users WHERE username = ?";
  
      connection.query(query, [username], (error, results) => {
        if (error) {
          connection.release();
          throw error;
        }
  
        if (results[0] != undefined) {
          let user_id = results[0].id;
  
          query = "SELECT id, item_name, createTime, latestUpdate FROM user_purchases WHERE user_id = ?";
  
          connection.query(query, [user_id], (error, results) => {
            connection.release();
            if (error) {
              throw error;
            }
  
            if (results.length > 0) {
              const purchases = results.map(result => ({
                id: result.id,
                userId: user_id,
                item_name: result.item_name,
                createTime: result.createTime,
                latestUpdate: result.latestUpdate
              }));
              callback({
                valid: true,
                purchases: purchases
              });
            } else {
              callback({
                valid: false,
                reason: "User purchases not found."
              });
            }
          });
        } else {
          connection.release();
          callback({
            valid: false,
            reason: "User not found."
          });
        }
      });
    });
  }
  addPurchase(username, item_name, callback) {
    this.Connect(connection => {
      let query = "SELECT id FROM users WHERE username = ?";
  
      connection.query(query, [username], (error, results) => {
        if (error) {
          connection.release();
          throw error;
        }
  
        if (results[0] != undefined) {
          let user_id = results[0].id;
          let id = uuid.v4();
  
          query = "INSERT INTO user_purchases (id, user_id, item_name) VALUES (?, ?, ?)";
  
          connection.query(query, [id, user_id, item_name], (error, results) => {
            if (error) {
              connection.release();
              throw error;
            }
  
            callback({
              valid: true,
              message: "Purchase added successfully."
            });
  
            connection.release();
          });
        } else {
          connection.release();
          callback({
            valid: false,
            reason: "User not found."
          });
        }
      });
    });
  }
  addMessage(senderName, receiverName, message, callback) {
    this.Connect(connection => {
      let query = "SELECT id FROM users WHERE username = ?";
  
      connection.query(query, [senderName], (error, senderResults) => {
        if (error) {
          connection.release();
          throw error;
        }
  
        if (senderResults[0] != undefined) {
          let sender_id = senderResults[0].id;
  
          query = "SELECT id FROM users WHERE username = ?";
  
          connection.query(query, [receiverName], (error, receiverResults) => {
            if (error) {
              connection.release();
              throw error;
            }
  
            if (receiverResults[0] != undefined) {
              let receiver_id = receiverResults[0].id;
              let id = uuid.v4();
      
  
              query = "INSERT INTO messages (id, sender_id, receiver_id, message) VALUES (?, ?, ?, ?)";
  
              connection.query(query, [id, sender_id, receiver_id, message], (error, results) => {
                if (error) {
                  connection.release();
                  throw error;
                }
  
                callback({
                  valid: true,
                  reason: "Message added successfully."
                });
  
                connection.release();
              });
            } else {
              connection.release();
              callback({
                valid: false,
                reason: "Receiver not found."
              });
            }
          });
        } else {
          connection.release();
          callback({
            valid: false,
            reason: "Sender not found."
          });
        }
      });
    });
  }
  getMessagesByUsername(senderName, receiverName, callback) {
    this.Connect(connection => {
      let query = "SELECT m.*, s.username AS sender_name, r.username AS receiver_name FROM messages m INNER JOIN users s ON m.sender_id = s.id INNER JOIN users r ON m.receiver_id = r.id WHERE (s.username = ? AND r.username = ?) OR (s.username = ? AND r.username = ?)";
  
      connection.query(query, [senderName, receiverName, receiverName, senderName], (error, results) => {
        if (error) {
          connection.release();
          throw error;
        }
  
        if (results.length > 0) {
          const messages = results.map(result => ({
            id: result.id,
            sender_id: result.sender_id,
            receiver_id: result.receiver_id,
            sender_name: result.sender_name,
            receiver_name: result.receiver_name,
            message: result.message,
            createTime: result.createTime,
            latestUpdate: result.latestUpdate
          }));
          callback({
            valid: true,
            messages: messages
          });
        } else {
          callback({
            valid: false,
            reason: "No messages found."
          });
        }
  
        connection.release();
      });
    });
  }
  deleteMessageById(messageId, callback) {
    this.Connect(connection => {
        let query = "DELETE FROM messages WHERE id = ?";

        connection.query(query, [messageId], (error, results) => {
            if (error) {
                connection.release();
                throw error;
            }

            if (results.affectedRows > 0) {
                callback({
                    valid: true,
                    reason: "Message deleted successfully."
                });
            } else {
                callback({
                    valid: false,
                    reason: "Message not found."
                });
            }

            connection.release();
        });
    });
}
}