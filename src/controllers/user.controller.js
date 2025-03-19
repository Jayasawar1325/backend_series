import { asyncHandler } from "../utils/asyncHandler.js";
import { apierror } from "../utils/apierror.js";
import { apiresponse } from "../utils/apiresponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.service.js";
import jwt from "jsonwebtoken";
import { Aggregate } from "mongoose";
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new apierror(404, "User not found"); // Handle case where user does not exist
    }

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Token generation error:", error); // Log the error for debugging
    throw new apierror(
      500,
      "Something went wrong while generating access and refresh tokens"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // Get user details from the frontend
  const { fullName, username, email, password } = req.body;

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

const loginUser = asyncHandler(async (req, res) => {
  //reb body => data
  // username or email
  //find the user
  //password check
  //access and refresh token generate
  //send cookies
  //send response
  const { username, email, password } = req.body;
  if (!(username || !email)) {
    throw new apierror(400, "username or email is required");
  }
  const user = await User.findOne({ email });
  if (!user) {
    throw new apierror(404, "User not found");
  }
  const isPasswordValid = await user.verifyPassword(password);
  if (!isPasswordValid) {
    throw new apierror(401, "Password doesn't match");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: true
  };
  res
    .status(200)
    .cookie("accessToken", accessToken)
    .cookie("refreshToken", refreshToken)
    .json(
      new apiresponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken
        },
        "User logged in successfully"
      )
    );
});
const logOutUser = asyncHandler(async (req, res) => {
  User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined
      }
    },
    { new: true }
  );
  const options = {
    httpOnly: true,
    secure: true
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiresponse(200, {}, "User logged Out!"));
});
const accessRefreshToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new apierror(401, "unauthorized request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REQUEST_TOKEN_SECRET
    );
    const user = await User.findById(user._id);
    if (!user) {
      throw new apierror(401, "Invalid refresh token");
    }
    const options = {
      httpOnly: true,
      secure: true
    };
    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new apiresponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken
          },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new apierror(401, error?.message || "Invalid refresh token");
  }
});
const changeUserPassword = asyncHandler(async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.verifyPassword(oldPassword);
    if (!isPasswordCorrect) {
      throw new apierror(401, "Invalid Password");
    }
    user.password = newPassword;
    await user.save({ validateBeforeSave: true });
    return res
      .status(200)
      .json(new apiresponse(200, "Password changed successfully"));
  } catch (error) {
    throw new apierror(400, "Error", error?.message);
  }
});
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(200, req.user, "current user fetched successfully");
});
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) {
    throw new apierror(400, "All fields are required");
  }
  const user = User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName,
        email
      }
    },
    {
      new: true
    }
  ).select("-password");
  return res
    .status(200)
    .json(new apiresponse(200, user, "Account details updated successfully"));
});
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new apierror(400, "Avatar file is missing");
  }
  const user1 = await User.findById(req.user?._id);
  if (!user) {
    throw new apierror(404, "User not found");
  }

  // Delete the old avatar from Cloudinary
  if (user1.avatar) {
    const publicId = user1.avatar.split('/').pop().split('.')[0]; // Extract public ID from URL
    await uploadOnCloudinary.delete(publicId).catch((err) => {
      console.error("Error deleting old avatar:", err.message);
    });
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new apierror(401, "Error while uploading avatar");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url
      }
    },
    {
      new: true
    }
  );
  return res
    .status(200)
    .json(new apiresponse(200, user, "Avatar Image updated successfully"));
});
const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new apierror(400, "CoverImage file is missing");
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage.url) {
    throw new apierror(401, "Error while uploading coverImage");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url
      }
    },
    {
      new: true
    }
  );
  return res
    .status(200)
    .json(new apiresponse(200, user, "Cover Image updated successfully"));
});

const getUserProfile = asyncHandler(async(req,res)=>{
  const {username} = req.params;
  if(!username){
    throw new apierror(400,'username is missing')
  }
  const channel =await  User.aggregate([{
    $match:{
      username:username?.toLowerCase()
    }
  },{ $lookup:{
      from:'subscriptions',
      localField:'subscriber',
      foreignField:'channel',
      as:'subscribers'
    }
  },
  {
    $lookup:{
      from:'subscriptions',
      localField:'_id',
      foreignField:'subscriber',
      as:'subscribedTo'
    }
  },
    {
      $addFields:{
        subscriberCount:{
          $size:'$subscriber'

        },channelSubscribedToCount:{
          $size:'$subscribedTo'
        },
        
          isSubscribed:{
            $cond:{
              if:{$in:[req.user?._id,'$subscribers.subscriber']},
              then:true,
              else:false
            }
          }
        }

  },
{
  $project:{
    username:1,
    fullName:1,
    subscriberCount:1,
    channelSubscribedToCount:1,
    isSubscribed:1,
    email:1,
    avatar:1,
    coverImage:1
  }
}])
if(!channel?.lentgh){
  throw new apierror(404,'Channel doesnot exist')
}
res.status(201)
.json(new apiresponse(200, channel[0],'User channel fetched successfully'))

})
export {
  registerUser,
  loginUser,
  logOutUser,
  updateUserAvatar,
  updateCoverImage,
  accessRefreshToken,
  getCurrentUser,
  changeUserPassword,
  updateAccountDetails
};
