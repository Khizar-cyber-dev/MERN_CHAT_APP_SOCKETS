import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.provider; // only require password for non-OAuth users
      },
      minlength: 6,
    },
    profilePic: {
      type: String,
      default: "",
    },
    provider: {
      type: String,
      default: "",
    },
    providerId: {
      type: String,
      default: "",
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
