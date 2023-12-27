const nodemailer = require("nodemailer");

function sendPasswordByEmail(email, username, newpassword) {
  let transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL,           // GG NODEMAILER email password 
      pass: process.env.PASS,             // Thay thẳng bằng giá trị cần cũng được
    },
  });
  let otp = newpassword;
  let mailOptions = {
    from: process.env.EMAIL,
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
  };

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