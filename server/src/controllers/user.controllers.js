import mongoose from "mongoose";
import jwt from 'jsonwebtoken';
import fs from 'fs';
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/uploadOnCloudinary.js";

const registerUser = async(req , res)=>{

    const {username , password} = req.body;


    if(
        [username , password].some((field)=> field.trim() === "")
    ){
    
        throw new ApiError(400 , "All fields are required");
    }

    const existedUser = await User.findOne({username});

    if(existedUser){
        
        throw new ApiError(409 , "User with this username already exists");
    }


    const user = await User.create({
        username,
        password,
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken" 
    )

    if(!createdUser){
        throw new ApiError(500 , "Unable to create user");
    }

    return res.status(200).json(
        new ApiResponse(500 , "User registered successfully")
    )

}



export {registerUser}