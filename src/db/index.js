import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
const connectDB=async()=>{
try{
const conncetionInstance=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
console.log(`MongoDB connected: ${conncetionInstance.connection.host}`)
}
catch(error){
    console.log(error)
process.exit(1)
}
}
export default connectDB;