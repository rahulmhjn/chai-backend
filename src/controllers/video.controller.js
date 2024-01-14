import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    const sortTypeValue = sortType === 'desc' ? -1 : 1;

    const match = {};

    if(userId) {
        match.owner = userId;
    }

    const videos = await Video.find(match)
        .sort({ [sortBy]: sortTypeValue })
        .limit(parseInt(limit))
        .skip((page - 1) * limit);

    res.status(200).json(
        new ApiResponse(200, videos)
    )
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    // check if all the required fields are available
    // check if video file and thumbnail are uploaded
    // Upload them on cloudinary
    // create video obj
    // POST video

    if(!title ||!description) {
        throw new ApiError("Title and description is required");
    }

    const tempVideoFilePath = req.files?.videoFile[0]?.path;
    if(!tempVideoFilePath) {
        throw new ApiError(400, "Video File is required");
    }

    const tempThumbnailPath = req.files?.thumbnail[0]?.path;
    if(!tempThumbnailPath) {
        throw new ApiError(400, "Video Thumbnail is required");
    }

    const videoFile = await uploadOnCloudinary(tempVideoFilePath);
    const videoThumbnail = await uploadOnCloudinary(tempThumbnailPath);

    if(!videoFile) {
        throw new ApiError(400, "Video File not uploaded successfully")
    }

    if(!videoThumbnail) {
        throw new ApiError(400, "Video Thumbnail not uploaded successfully")
    }

    const videoObj = {
        title,
        description,
        videoFile: videoFile.url,
        thumbnail: videoThumbnail.url,
        duration: Math.round(videoFile.duration*100)/100,
        owner: req.user._id
    }

    const video = await Video.create(videoObj);

    return res.status(201).json(
        new ApiResponse(201, video, 'Your video is published successfully')
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    const video = await Video.findById(videoId).populate('owner', '_id email username');

    if (!video) {
        throw new ApiError(404, 'Video not found');
    }

    return res.status(200).json(
        new ApiResponse(200, video)
    )

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    // check if video is present
    const video = await Video.findById(videoId);

    if(!video) {
        throw new ApiError(404, 'Video not found');
    }

    // only owner can update his video
    if(video.owner !== req.user._id) {
        throw new ApiError(401, 'Access denied. You cant update other users video')
    }

    // check for thumbnail
    if(req.file.path) {
        const thumbnail = await uploadOnCloudinary(req.file.path);

        if(!thumbnail.url) {
            throw new ApiError(500, "Something went wrong while uploading new thumbnail")
        }

        req.body = { ...req.body, thumbnail: thumbnail.url }
    }

    const updatedvideo = await Video.findByIdAndUpdate(videoId, {
        $set: req.body
    }, {
        new: true
    });

    res.status(201).json(
        new ApiResponse(201, updatedvideo, 'Video updated successfully')
    )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    // check if video is available
    const video = await Video.findById(videoId);

    if(!video) {
        throw new ApiError(404, 'Video not found');
    }

    // only owner can delete his video
    if(video.owner !== req.user._id) {
        throw new ApiError(401, 'Access denied. You cant delete other users video')
    }
    
    await Video.findByIdAndDelete(videoId);

    res.status(200).json(
        new ApiResponse(200, 'Video deleted successfully')
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
