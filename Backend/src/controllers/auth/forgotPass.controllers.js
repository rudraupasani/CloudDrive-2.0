import express from 'express'
import User from '../../models/auth/user.modal.js'


const routes = express.Router();

async function forgotPassControllers(req, res) {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();


        return res.status(200).json({
            success: true,
            message: "Reset link sent to your email",
            token,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
}

module.exports = forgotPassControllers
