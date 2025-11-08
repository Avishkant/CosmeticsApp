import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    resource: { type: String },
    meta: { type: Object },
    ip: String,
    userAgent: String,
  },
  { timestamps: true }
); 
 
export default mongoose.models.AuditLog ||
  mongoose.model("AuditLog", AuditLogSchema);
