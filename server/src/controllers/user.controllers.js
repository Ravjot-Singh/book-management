import mongoose from "mongoose";
import jwt from 'jsonwebtoken';
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";



const generateAccessAndRefreshTokens = async (userId) => {

    try {

        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {

        throw new ApiError(500, "Something went erong while generating the access and refresh tokens");
    }

}


const registerUser = async (req, res) => {

    const { username, password } = req.body;


    if (
        [username, password].some((field) => field.trim() === "")
    ) {

        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({ username });

    if (existedUser) {

        throw new ApiError(409, "User with this username already exists");
    }


    const user = await User.create({
        username,
        password,
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Unable to create user");
    }

    return res.status(200).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )

}

const loginUser = async (req, res) => {

    const { username, password } = req.body;

    if (!username || !password) {
        throw new ApiError(400, "username and password are required!");
    }

    const user = await User.findOne({ username });

    if (!user) {
        throw new ApiError(404, "User does not exist!");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged-in successfully!"
            )
        )

}


const logoutUser = async (req, res) => {

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: 'None'
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "Logged out successfully"))

}


const changeCurrentPassword = async (req, res) => {

    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password");
    }

    user.password = newPassword;

    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"))

};


const refreshAccessToken = async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const options = {
            httpOnly: true,
            secure: true,
           
        };

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
        const userData = await User.findById(user._id).select("-password -refreshToken");

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken,
                        user: userData
                    },
                    "Access token refreshed successfully"
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
};

const getCurrentUser = async (req, res) => {
    if (!req.user) {
        return res.status(401).json(new ApiResponse(401, null, "Not authenticated"));
    }

    res.status(200).json(new ApiResponse(200, req.user, "Current user"));
}


export {
    registerUser,
    loginUser, logoutUser,
    changeCurrentPassword,
    refreshAccessToken,
    getCurrentUser
}