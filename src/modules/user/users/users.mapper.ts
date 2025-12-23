import { IUser } from "./user.model";
import { toPetResponse } from "../pets/pets.mapper";

const mapPets = (pets: unknown): unknown[] => {
  if (!Array.isArray(pets)) return [];
  return pets.map((pet: any) => (pet && pet._id ? toPetResponse(pet) : pet));
};

export const toUserProfileResponse = (user: IUser) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  status: user.status,
  bio: user.bio,
  avatarUrl: user.avatarUrl,
  address: user.address,
  username: user.username,
  location: user.location,
  isVerified: user.isVerified,
  isPhoneVerified: user.isPhoneVerified,
  favorites: user.favorites || [],
  pets: mapPets((user as any).pets),
  profileCompleted: user.profileCompleted ?? true,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});
