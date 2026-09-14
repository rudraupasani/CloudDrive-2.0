import mongoose from "mongoose";

const FileModel = new mongoose.Schema({
    file_name: {
        type: String,
        required: [true, "File name is required"],
        trim: true,
    },
    file_type: {
        type: String,
        required: [true, "File type is required"],
        trim: true,
    },
    file_size: {
        type: Number,
        required: [true, "File size is required"],
    },
    user_id: {
        type: String,
        required: [true, "User id is required"],
        trim: true,
    },
    file_url: {
        type: String,
        required: [true, "File URL is required"],
        trim: true,
    },
    is_favorite: {
        type: Boolean,
        default: false,
    },
    is_public: {
        type: Boolean,
        default: false,
    },
    share_token: {
        type: String,
        default: null,
        trim: true,
    },
}, {
    timestamps: true
});

export default mongoose.model("File", FileModel);