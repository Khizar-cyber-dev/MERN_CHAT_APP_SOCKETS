import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true, 
      maxlength: 200 
    },
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    members: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      index: true 
    }],
    admins: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    }],
    avatar: { 
      type: String 
    },
  },
  { timestamps: true }
);

const Group = mongoose.model("Group", groupSchema);
export default Group;
