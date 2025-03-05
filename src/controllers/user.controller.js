import { asyncHandler } from "../utils/asyncHandler.js";
import { apierror } from "../utils/apierror.js";
import { apiresponse } from "../utils/apiresponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.service.js";
const registerUser = asyncHandler(async (req, res) => {
  // Get user details from the frontend
  const { fullName, username, email, password } = req.body;
  console.log("Email", email);

  // Validate the user data
  if (
    [password, email, username, fullName].some((field) => field?.trim() === "")
  ) {
    throw new apierror(400, "All fields are required");
  }

  // Validate email format
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  if (!validateEmail(email)) {
    throw new apierror(400, "Invalid email format");
  }

  // Check if the user already exists
  const existedUser = await User.findOne({
    $or: [{ email }, { username }]
  });
  if (existedUser) {
    throw new apierror(409, "User or email already exists");
  }

  console.log(req.files);

  // Check if files are present and handle accordingly
  const avatarLocalPath = req.files?.avatar ? req.files.avatar[0].path : null;
  const coverImageLocalPath = req.files?.coverImage
    ? req.files.coverImage[0].path
    : null;

  if (!avatarLocalPath) {
    throw new apierror(400, "Avatar is required");
  }

  // Upload the files to Cloudinary if available
  const avatar = await uploadOnCloudinary(avatarLocalPath).catch((err) => {
    throw new apierror(500, "Error uploading avatar: " + err.message);
  });
  const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : null;

  if (!avatar) {
    throw new apierror(500, "Error uploading avatar");
  }

  // Create the user in the database
  const user = await User.create({
    fullName,
    email,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    password,
    username: username.toLowerCase()
  });

  // Retrieve the user without the password and refresh token
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new apierror(500, "Error creating user");
  }

  // Return the response with the created user details
  return res
    .status(201)
    .json(new apiresponse(201, createdUser, "User created successfully"));
});
export { registerUser };
