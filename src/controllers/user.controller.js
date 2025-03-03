import { asyncHandler } from "../utils/asyncHandler.js"; // Adjust import based on actual export

const registerUser = asyncHandler(async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "User registered successfully"
  });
});

export {registerUser};
