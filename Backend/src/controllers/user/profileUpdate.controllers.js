import User from "../../models/auth/user.modal.js";
import { redis } from "../../config/redis.js";

const UpdateProfile = async (req, res) => {
    try {
        // user_id comes from the JWT via authMiddleware (req.user)
        const userId = req.user?._id || req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const { name, email, avatar } = req.body;

        // At least one field must be provided
        if (!name && !email && !avatar) {
            return res.status(400).json({
                success: false,
                message: "Provide at least one field to update (name, email, or avatar).",
            });
        }

        // Build update object with only provided fields
        const updateFields = {};
        if (name)   updateFields.name   = name.trim();
        if (email)  updateFields.email  = email.trim().toLowerCase();
        if (avatar) updateFields.avatar = avatar;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateFields,
            { new: true, runValidators: true }
        ).select("-password");

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Invalidate Redis cache so the next GET /profile fetches fresh data
        await redis.del(`user:${userId.toString()}`);

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            userData: updatedUser,
        });
    } catch (err) {
        console.error("UpdateProfile Error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to update profile",
            error: err.message,
        });
    }
};

export default UpdateProfile;