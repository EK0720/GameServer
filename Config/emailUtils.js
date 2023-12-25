const nodemailer = require("nodemailer");

function sendPasswordByEmail(email, username, newpassword) {
  // Tạo một transporter để gửi email
  let transporter = nodemailer.createTransport({
    // Cấu hình dịch vụ email của bạn, ví dụ: Gmail
    service: "Gmail",
    auth: {
      user: "bedtimestory9199@gmail.com",
      pass: "dncm djhs lxsf ilam",
    },
  });
  let otp = newpassword;
  let mailOptions = {
    from: "bedtimestory9199@gmail.com",
    to: email,
    subject: "Password Reset",
    html: `
    <style>
    .image-container {
      text-align: center;
    }
    .image-container img {
      max-width: 100%;
      height: auto;
    }
  </style>
    <h1>Password Reset</h1>
    <h4>Hello ${username} </h4>
    <p>Your New Password is: ${otp}</p>
    <div class="image-container">
    <img src="https://i.ibb.co/Ypwx5X1/unnamed.jpg" alt="Beautiful Image">
    </div>
  `
    // text: `Your New Password is: ${otp}`,
  };

  // Gửi email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}

module.exports = {
  sendPasswordByEmail,
};