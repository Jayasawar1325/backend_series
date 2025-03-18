import { asyncHandler } from "../utils/asyncHandler.js";
import { apierror } from "../utils/apierror.js";
import { apiresponse } from "../utils/apiresponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.service.js";
import jwt from 'jsonwebtoken'
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
    throw new apierror(500, "Something went wrong while generating access and refresh tokens");
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

const loginUser=asyncHandler(async (req,res)=>{
//reb body => data
// username or email
//find the user 
//password check 
//access and refresh token generate 
//send cookies
//send response
const {username,email,password} = req.body;
if(!(username || !email)){
  throw new apierror(400,'username or email is required')
}
const user = await User.findOne({email})
if(!user){
  throw new apierror(404, "User not found")
}
const isPasswordValid = await user.verifyPassword(password)
if(!isPasswordValid){
  throw new apierror(401,"Password doesn't match")
}
const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id)
const loggedInUser = await User.findById(user._id).select('-password -refreshToken')
const options = {
  httpOnly:true,
  secure:true
}
res.status(200)
.cookie('accessToken',accessToken)
.cookie('refreshToken',refreshToken)
.json(new apiresponse(200,
  {
    user:loggedInUser,accessToken,refreshToken
  },
  'User logged in successfully'
))

})
const logOutUser = asyncHandler(async(req,res)=>{
  User.findByIdAndUpdate(req.user._id,{
    $set:{
      refreshToken:undefined
    }
  },{new:true},
)
const options={
  httpOnly:true,
  secure:true
}
return res.status(200)
.clearCookie('accessToken',options)
.clearCookie('refreshToken',options)
.json(new apiresponse(200,{},'User logged Out!'))
})
const accessRefreshToken = asyncHandler(async (req,res)=>{
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
  if(!incomingRefreshToken){
    throw new apierror(401,'unauthorized request')
  }
  try{
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REQUEST_TOKEN_SECRET)
    const user = await User.findById(user._id)
    if(!user){
      throw new apierror(401,'Invalid refresh token')
    }
    const options ={
      httpOnly:true,
      secure:true
    }
    const {accessToken, newRefreshToken}=await generateAccessAndRefreshTokens(user._id)
    return res.status(200)
    .cookie('accessToken',accessToken, options)
    .cookie('refreshToken',newRefreshToken, options)
    .json(new apiresponse(200,
      {
        accessToken,
        refreshToken:newRefreshToken,
      },
      "Access token refreshed"
    ))
  }
  catch(error){
throw new apierror(401, error?.message ||   'Invalid refresh token')
  }
})
export { registerUser ,loginUser,logOutUser, accessRefreshToken};
