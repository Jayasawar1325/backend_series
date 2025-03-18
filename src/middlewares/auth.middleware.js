import { apierror } from "../utils/apierror.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken'
import { User } from "../models/user.model.js";

export const verifyJwt= asyncHandler(async (req,res,next)=>{
    try{
        const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer','')
        if(!token){
            throw new apierror(401,'Unauthorized request')
        }
const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
const user = await User.findById(decodedToken._id)
if(!user){
    throw new apierror(401,'Invalid access token')
}
 req.user = user;
 next()
    }
    catch(error){
        throw new apierror(401,error?.message || 'Invalid access token')
        next(error)
    }
})