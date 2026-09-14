import User from "../../models/auth/user.modal.js";
import { redis } from "../../config/redis.js";

async function getUserProfile(req, res) {
    try {
        // 1. Get user from MongoDB
        const user = await User.findById(req.user.id)
            .select("-password")
            .lean();

        // 2. Check if user exists
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const userId = user._id.toString();

        // 3. Store user data in Redis Hash
        await redis.hset(`user:${userId}`, {
            id: userId,
            name: user.name || "",
            email: user.email || "",
            avatar: user.avatar || "",
            storageUsed: user.storage?.used || 0,
            storageLimit: user.storage?.limit || 0,
            createdAt: user.createdAt
                ? user.createdAt.toISOString()
                : "",
            updatedAt: user.updatedAt
                ? user.updatedAt.toISOString()
                : "",
        });

        // 4. Get user data from Redis
        const Data = await redis.hgetall(`user:${userId}`);

        // 5. Convert Redis data into response format
        const userData = {
            id: Data.id,
            name: Data.name,
            email: Data.email,
            avatar: Data.avatar || "",

            storage: {
                used: Number(Data.storageUsed || 0),
                limit: Number(Data.storageLimit || 0),
            },

            createdAt: Data.createdAt,
            updatedAt: Data.updatedAt,
        };

        console.log("User Data:", userData);

        // 6. Send response
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
