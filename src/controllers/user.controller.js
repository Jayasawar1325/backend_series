import { asyncHandler } from "../utils/asyncHandler.js"; // Adjust import based on actual export
import { apierror } from "../utils/apierror.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {apiresponse} from '../utils/apiresponse.js'
const registerUser = asyncHandler(async (req, res) => {
  //get user details from the frontend
  //validate the user data
  //check if the user already exists
  //check for images: check avatar
  //upload them to cloudinary
  //create user object, create entry in database
  //remove password and refresh token from the response
  const { fullName, username, email, password } = req.body;
  console.log("Email", email);
  if (
    [password, email, username, fullName].some((field) => field?.trim() === "")
  ) {
    throw new apierror(400, "All fields are required");
  }

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  if (!validateEmail(email)) {
    throw new apierror(400, "Invalid email format");
  }
  const existedUser = User.find({
    $or: [{ email }, { username }]
  });
  if (existedUser) {
    throw new apierror(409, "User or email already exists");
  }
  const avatarLocalPath = req.files?.avatar[0].path;
  const coverImageLocalPath = req.files?.coverImage[0].path;
  if (!avatarLocalPath) {
    throw new apierror(400, "Avatar is required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new apierror(500, "Error uploading avatar");
  }
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
  });
 const createdUser= await User.findById(user._id).select('-password -refreshToken')
 if(!createdUser){
  throw new apierror(500,'Error creating user')
 }
 return res.status (201).json(new apiresponse(201,createdUser,'User created successfully'))
  console.log(req.files);
});
export { registerUser };
