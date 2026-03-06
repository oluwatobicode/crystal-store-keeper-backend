import mongoose from "mongoose";

export interface IBlacklist {
  token: string;
  expiresAt: Date;
}

const blacklistSchema = new mongoose.Schema<IBlacklist>({
  token: {
    type: String,
    required: true,
    index: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

// TTL index — MongoDB auto-deletes documents once expiresAt passes
blacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Blacklist = mongoose.model<IBlacklist>("Blacklist", blacklistSchema);

export default Blacklist;
