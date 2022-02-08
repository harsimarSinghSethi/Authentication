const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const asyncHandler = require("../middleware/async");

exports.register = asyncHandler(async (req, res, next) => {
  const { username, email, password, age, address } = req.body;

  const user = await User.create({
    username,
    email,
    password,
    age,
    address,
  });

  sendTokenResponse(user, 200, res);
});

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email) {
    return next(new ErrorResponse("Please provide an email ", 400));
  }
  if (!password) {
    return next(new ErrorResponse("Please provide an password ", 400));
  }

  const user = await User.findOne({ email: email }).select("+password");
  if (!user) {
    return next(new ErrorResponse("Invalid email", 401));
  }
  const isMatch = await user.matchPasswords(password);
  if (!isMatch) {
    return next(new ErrorResponse("Invalid password", 401));
  }
  sendTokenResponse(user, 200, res);
});

exports.forgotpassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return next(new ErrorResponse("Email could not be send", 404));
    }
    const resetToken = user.getResetPasswordToken();
    await user.save();
    const resetUrl = `http://localhost:3000/passwordreset/${resetToken}`;
    const message = `
    <h1>A new password reset as requested</h1>
    <p>Reset your password by going to this link</p>
    <a href=${resetUrl} clicktracking=off>${resetUrl}</a>`;
    try {
      await sendEmail({
        to: user.email,
        subject: "Password Reset Request",
        text: message,
      });
      res.status(200).json({ success: true, data: "Email Sent" });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return next(new ErrorResponse("Email could not be sent", 500));
    }
  } catch (err) {
    next(err);
  }
});

exports.resetpassword = asyncHandler(async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resetToken)
    .digest("hex");
  try {
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) {
      return next(new ErrorResponse("Invalid Reset Token", 400));
    }
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    return res
      .status(201)
      .json({ success: true, data: "Password Reset Succeeded" });
  } catch (err) {
    next(err);
  }
});

const sendTokenResponse = asyncHandler((user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    token,
  });
});
