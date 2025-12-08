import { IUser } from "./user.model";

export const toUserProfileResponse = (user: IUser) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  bio: user.bio,
  avatarUrl: user.avatarUrl,
  location: user.location,
  isVerified: user.isVerified,
  isPhoneVerified: user.isPhoneVerified,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});
