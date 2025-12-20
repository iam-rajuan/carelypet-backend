import { IUser } from "./user.model";

export const toUserProfileResponse = (user: IUser) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  bio: user.bio,
  avatarUrl: user.avatarUrl,
  address: user.address,
  username: user.username,
  location: user.location,
  isVerified: user.isVerified,
  isPhoneVerified: user.isPhoneVerified,
  favorites: user.favorites || [],
  profileCompleted: user.profileCompleted ?? true,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});
