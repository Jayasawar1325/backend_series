import connectDB from "./db/index.js";
import dotenv from "dotenv";

dotenv.config({
    path: "./.env"
});

connectDB();









//import mongoose from "mongoose";
// import { DB_NAME } from "./constants";
// import express from 'express'
// const app =express()

// (async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
//         app.on('error',(err)=>{
//             console.log('Error',err)
//             throw err
//         })
//         app.listen(process.env.PORT,()=>{
//             console.log('SERVER IS RUNNING ON PORT',process.env.PORT)
//         })
//     } catch (error) {
//         console.log('Error', error);
//         throw error;
//     }
// })
// ()