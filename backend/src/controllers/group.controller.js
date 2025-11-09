import cloudinary from "../lib/cloudinary.js";
import { io } from "../lib/socket.js";
import Group from "../models/Group.js";
import Message from "../models/Message.js";

export const createGroup = async (req, res) => {
  try {
    const { name, members = [], avatar } = req.body;
    const creatorId = req.user._id;

    const uniqueMembers = Array.from(new Set([creatorId.toString(), ...members.map(String)]));

    let avatarUrl = "/group.png"; // default placeholder, frontend also falls back to this
    if (avatar) {
      try {
        const upload = await cloudinary.uploader.upload(avatar);
        avatarUrl = upload.secure_url;
      } catch (e) {
       
      }
    }

    let group = await Group.create({
      name,
      createdBy: creatorId,
      members: uniqueMembers,
      admins: [creatorId],
      avatar: avatarUrl,
    });

    group = await group.populate({ path: "members", select: "fullName profilePic" });

    return res.status(201).json(group);
  } catch (error) {
    console.error("Error in createGroup:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getMyGroups = async (req, res) => {
  try {
    const myId = req.user._id;
    const groups = await Group.find({ members: myId }).populate("members", "fullName profilePic");
    return res.status(200).json(groups);
  } catch (error) {
    console.error("Error in getMyGroups:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const myId = req.user._id;
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (!group.members.some((m) => m.toString() === myId.toString())) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const messages = await Message.find({ groupId }).sort({ createdAt: 1 });
    return res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getGroupMessages:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { groupId } = req.params;
    const senderId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (!group.members.some((m) => m.toString() === senderId.toString())) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!text && !image) {
      return res.status(400).json({ message: "Text or image is required." });
    }

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      groupId,
      text,
      image: imageUrl,
      seenBy: [senderId],
    });

    await newMessage.save();

    io.to(groupId).emit("newGroupMessage", newMessage);

    return res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendGroupMessage:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const markGroupMessagesAsSeen = async (req, res) => {
  try {
    const { groupId } = req.params;
    const myId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (!group.members.some((m) => m.toString() === myId.toString())) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const toUpdate = await Message.find({
      groupId,
      senderId: { $ne: myId },
      seenBy: { $ne: myId },
    }).select("_id");

    if (toUpdate.length === 0) {
      return res.status(200).json({ updatedCount: 0, messageIds: [] });
    }

    const messageIds = toUpdate.map((m) => m._id);

    await Message.updateMany({ _id: { $in: messageIds } }, { $addToSet: { seenBy: myId } });

    io.to(groupId).emit("groupMessagesSeen", {
      userId: myId.toString(),
      messageIds: messageIds.map((id) => id.toString()),
      groupId: groupId.toString(),
    });

    return res.status(200).json({ updatedCount: messageIds.length, messageIds });
  } catch (error) {
    console.error("Error in markGroupMessagesAsSeen:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};
