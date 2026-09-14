import User from "../../models/auth/user.modal.js";
import fileModal from "../../models/file/file.modal.js";
import { safeRedis } from "../../config/redis.js";

async function getUserProfile(req, res) {
    try {
        // 1. Get user from MongoDB
        const user = await User.findById(req.user.id)
            .select("-password")
            .lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const userId = user._id.toString();

        // Calculate storage breakdown by category from files
        const userFiles = await fileModal.find({ user_id: userId }).lean();
        const breakdown = {
            images: 0,
            documents: 0,
            media: 0,
            others: 0,
            totalFiles: userFiles.length,
            starredFiles: userFiles.filter(f => f.is_favorite).length
        };

        userFiles.forEach(file => {
            const size = file.file_size || 0;
            const type = (file.file_type || '').toLowerCase();
            if (type.includes('image') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.file_name)) {
                breakdown.images += size;
            } else if (type.includes('pdf') || type.includes('document') || type.includes('word') || type.includes('text') || /\.(pdf|doc|docx|txt|md|xlsx|pptx)$/i.test(file.file_name)) {
                breakdown.documents += size;
            } else if (type.includes('video') || type.includes('audio') || /\.(mp4|mp3|wav|mov|mkv|avi)$/i.test(file.file_name)) {
                breakdown.media += size;
            } else {
                breakdown.others += size;
            }
        });

        // Store user data in Redis if available
        await safeRedis.set(`user:${userId}`, JSON.stringify({
            id: userId,
            name: user.name || "",
            email: user.email || "",
            avatar: user.avatar || "",
            storage: {
                used: user.storage?.used || 0,
                limit: user.storage?.limit || 1073741824,
            },
            breakdown,
            createdAt: user.createdAt ? user.createdAt.toISOString() : "",
            updatedAt: user.updatedAt ? user.updatedAt.toISOString() : "",
        }));

        const userData = {
            id: userId,
            name: user.name,
            email: user.email,
            avatar: user.avatar || "",
            storage: {
                used: Number(user.storage?.used || 0),
                limit: Number(user.storage?.limit || 1073741824),
            },
            breakdown,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };

        return res.status(200).json({
            success: true,
            message: "User profile fetched successfully",
            userData,
        });
    } catch (error) {
        console.error("Get User Profile Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch user profile",
            error: error.message,
        });
    }
}

export { getUserProfile };
