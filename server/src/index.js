import 'dotenv/config'; 
import app from "./app.js";
import mongoose from 'mongoose';


;(async ()=>{
    try{

        await mongoose.connect(`${process.env.MONGODB_URI}book-management`);
        app.on("error", (error)=>{
            console.log("error");
            throw error;
        })

        app.listen(process.env.PORT || 8000 , ()=>{
            console.log(`app is listening on port ${process.env.PORT}`);
        })
    }catch(error){
        console.error("ERROR : " , error);
    }
})()
