import { app } from "./app.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const PORT = process.env.PORT || 5000;
connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
})









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