import bcrypt from "bcryptjs";
import { Document, Model, Schema, model } from "mongoose";

export enum IUserRole {
  OWNER = "owner"
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: IUserRole;
  refreshTokenHash?: string;
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

interface IUserModel extends Model<IUser> {}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false
    },
    role: {
      type: String,
      enum: Object.values(IUserRole),
      default: IUserRole.OWNER
    },
    refreshTokenHash: {
      type: String,
      select: false
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) {
    next();
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(
  this: IUser,
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = model<IUser, IUserModel>("User", userSchema);