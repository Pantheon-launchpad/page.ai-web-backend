import User from "../models/User.js";
import bcrypt from "bcrypt";
import generateToken from "../utils/generateToken.js";

const toSaveUser = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
});

// Register

export const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "fullName, email and password are required",
      });
    }

    // check if email already exist
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create user
    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
    });

    // generate login token
    const token = generateToken(newUser._id);

    res.status(201).json({
      success: true,
      message: "user created successfully",
      token,
      user: toSaveUser(newUser),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something wemt wrong while creating user",
    });
  }
};

// login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // password is select:false in the schema, so it must be requested explicitly
    const user = await User.findOne({ email }).select("+password");

    // check if user exist
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "invalid credentials",
      });
    }

    // OAuth users (e.g. Google) have no password to compare against
    if (user.authProvider !== "local") {
      return res.status(400).json({
        success: false,
        message: `This account uses ${user.authProvider} sign-in. Please log in that way instead.`,
      });
    }

    // compare password with hashedpassword in database
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    // stop login if password is wrong
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "invalid credentials",
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      message: "login successfully",
      token,
      user: toSaveUser(user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong while logging in",
    });
  }
};

// Google OAuth callback
export const googleCallback = (req, res) => {
  try {
    const user = req.user;

    const token = generateToken(user._id);

    // redirect back to frontend with the token attached
    res.redirect(`${process.env.FRONTEND_URL}/oauth-success?token=${token}`);
  } catch (error) {
    res.redirect(`${process.env.FRONTEND_URL}/login-failed`);
  }
};
