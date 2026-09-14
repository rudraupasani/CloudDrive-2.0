import fileModal from "../../models/file/file.modal.js";
import User from "../../models/auth/user.modal.js";
import { redis } from "../../config/redis.js";

// Upload a new file (save metadata and update user storage)
export const UploadFile = async (req, res) => {
    try {
        const { file_name, file_type, file_size, file_url } = req.body;
        const userId = req.user?._id || req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please log in.",
            });
        }

        if (!file_name || !file_type || file_size === undefined || !file_url) {
            return res.status(400).json({
                success: false,
                message: "All fields are required (file_name, file_type, file_size, file_url)",
            });
        }

        // Get user to check storage limit
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const size = Number(file_size);
        const currentUsed = user.storage?.used || 0;
        const limit = user.storage?.limit || 1073741824; // Default to 1GB if limit is falsy

        if (currentUsed + size > limit) {
            return res.status(400).json({
                success: false,
                message: "Storage limit exceeded. Please delete some files or upgrade your plan.",
            });
        }

        // Create the file document
        const saveFile = await fileModal.create({
            file_name,
            file_type,
            file_size: size,
            file_url,
            user_id: userId.toString(),
        });

        // Update user storage usage
        user.storage.used = currentUsed + size;
        await user.save();

        // Invalidate user Redis cache so profile storage is updated
        await redis.del(`user:${userId.toString()}`);

        return res.status(200).json({
            success: true,
            message: "File uploaded successfully",
            data: saveFile
        });
    }
    catch (err) {
        console.error("UploadFile Controller Error:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error during upload metadata save",
            error: err.message
        });
    }
};

// Retrieve all files uploaded by the logged-in user
export const GetFiles = async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please log in.",
            });
        }

        const files = await fileModal.find({ user_id: userId.toString() }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Files retrieved successfully",
            files
        });
    }
    catch (err) {
        console.error("GetFiles Controller Error:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error during files fetch",
            error: err.message
        });
    }
};

// Delete a file metadata and update user storage
export const DeleteFile = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?._id || req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please log in.",
            });
        }

        const file = await fileModal.findById(id);

        if (!file) {
            return res.status(404).json({
                success: false,
                message: "File not found",
            });
        }

        // Verify that the file belongs to the logged-in user
        if (file.user_id !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You cannot delete this file.",
            });
        }

        // Subtract the file size from user storage usage
        const user = await User.findById(userId);
        if (user) {
            const size = file.file_size || 0;
            const newUsed = Math.max(0, (user.storage?.used || 0) - size);
            user.storage.used = newUsed;
            await user.save();
        }

        await fileModal.findByIdAndDelete(id);

        // Invalidate user Redis cache
        await redis.del(`user:${userId.toString()}`);

        return res.status(200).json({
            success: true,
            message: "File deleted successfully",
        });
    }
    catch (err) {
        console.error("DeleteFile Controller Error:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error during file deletion",
            error: err.message
        });
    }
};