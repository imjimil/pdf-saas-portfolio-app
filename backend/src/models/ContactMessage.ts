import mongoose, { Document, Schema } from 'mongoose';

export interface IContactMessage extends Document {
  name: string;
  email: string;
  message: string;
  userId?: string;
  createdAt: Date;
}

const contactMessageSchema = new Schema<IContactMessage>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    userId: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.models.ContactMessage ||
  mongoose.model<IContactMessage>('ContactMessage', contactMessageSchema);
