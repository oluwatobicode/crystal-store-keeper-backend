import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }, // messages don't need their own _id
);

const botConversationSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    chatId: {
      type: Number,
      required: true,
    },
    platform: {
      type: String,
      enum: ["telegram", "whatsapp"],
      default: "telegram",
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// one conversation per business per chat — unique combination
botConversationSchema.index({ businessId: 1, chatId: 1 }, { unique: true });

// TTL index — auto-delete conversations older than 24 hours to keep history fresh
botConversationSchema.index(
  { lastMessageAt: 1 },
  { expireAfterSeconds: 86400 },
);

const BotConversation = mongoose.model(
  "BotConversation",
  botConversationSchema,
);
export default BotConversation;
