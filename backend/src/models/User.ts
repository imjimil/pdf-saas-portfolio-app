import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  email: string;
  password?: string;
  googleId?: string;
  name?: string;
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      // minlength validation is handled in the route handler
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    name: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving (only if password exists and is not already hashed)
userSchema.pre('save', async function (next) {
  // Skip if password is not modified or doesn't exist
  if (!this.isModified('password')) return next();
  if (!this.password) return next();
  
  // Skip if password is already hashed (starts with $2a$, $2b$, or $2y$)
  if (this.password.startsWith('$2')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', userSchema);

