import mongoose from "mongoose";

const businessSchema = new mongoose.Schema({
  businessName: {
    type: String,
    required: true,
  },
  businessEmail: {
    type: String,
    required: true,
  },
  businessPhone: {
    type: String,
    required: true,
  },
  businessAddress: {
    type: String,
    required: true,
  },
  businessLogo: {
    type: String,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const Business = mongoose.model("Business", businessSchema);
export default Business;
