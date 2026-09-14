import User from "../../models/auth/user.modal.js";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";

async function loginController(req, res) {
    try {
        const { email, password } = req.body;

        // Validate fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        // Normalize email
        const normalizedEmail = email.trim().toLowerCase();

        // Find user and explicitly include password
        const user = await User.findOne({
            email: normalizedEmail,
        }).select("+password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Compare password
        const isPasswordValid = await bcryptjs.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Create JWT
        const token = jwt.sign(
            {
                id: user._id,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "10d",
            }
        );

        // Set authentication cookie
        res.cookie("token", token, {
            httpOnly: true,

            // Local development: false
            // Production with HTTPS: true
            secure: process.env.NODE_ENV === "production",

            sameSite: "lax",

            maxAge: 10 * 24 * 60 * 60 * 1000,
        });

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Response
        return res.status(200).json({
            success: true,
            message: "User logged in successfully",

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Login Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}

export default loginController;
