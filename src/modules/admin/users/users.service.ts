import User, { IUser } from "../../user/users/user.model";
import Pet, { IPet } from "../../user/pets/pets.model";
import AdoptionListing, { AdoptionStatus } from "../../user/adoption/adoption.model";
import { CommunityReport } from "../../user/community/community.model";
import ServiceBooking, { IServiceBooking } from "../../services/serviceBooking.model";
import RefreshToken from "../../user/auth/refreshToken.model";

export const listPetOwners = async (): Promise<IUser[]> => {
  return User.find({ role: "user" }).sort({ createdAt: -1 });
};

export const getPetOwnerById = async (userId: string): Promise<IUser> => {
  const user = await User.findOne({ _id: userId, role: "user" });
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

export const deletePetOwner = async (userId: string): Promise<void> => {
  const user = await User.findOne({ _id: userId, role: "user" });
  if (!user) {
    throw new Error("User not found");
  }
  await RefreshToken.deleteMany({ user: user._id });
  await user.deleteOne();
};

export const getPetOwnerProfile = async (
  userId: string
): Promise<{
  user: IUser;
  pets: IPet[];
  adoptionStatusMap: Record<string, AdoptionStatus>;
  reportCount: number;
  reportOnPostCount: number;
  services: IServiceBooking[];
}> => {
  const user = await User.findOne({ _id: userId, role: "user" });
  if (!user) {
    throw new Error("User not found");
  }

  const pets = await Pet.find({ owner: user._id }).sort({ createdAt: -1 });
  const petIds = pets.map((pet) => pet._id);
  const adoptionStatusMap: Record<string, AdoptionStatus> = {};
  if (petIds.length > 0) {
    const listings = await AdoptionListing.find({ pet: { $in: petIds } }).select(
      "pet status"
    );
    for (const listing of listings) {
      if (listing.pet) {
        adoptionStatusMap[listing.pet.toString()] = listing.status;
      }
    }
  }

  const reportSummary = await CommunityReport.aggregate([
    { $match: { reportedUser: user._id } },
    {
      $group: {
        _id: null,
        reportOnPostCount: { $sum: 1 },
        reportCount: { $sum: "$count" },
      },
    },
  ]);
  const reportCount = reportSummary[0]?.reportCount ?? 0;
  const reportOnPostCount = reportSummary[0]?.reportOnPostCount ?? 0;

  const services = await ServiceBooking.find({ customer: user._id })
    .sort({ createdAt: -1 })
    .populate({ path: "customer", select: "name phone" })
    .populate({ path: "provider", select: "name" });

  return {
    user,
    pets,
    adoptionStatusMap,
    reportCount,
    reportOnPostCount,
    services,
  };
};

export const getPetOwnerPets = async (
  userId: string
): Promise<{ pets: IPet[]; adoptionStatusMap: Record<string, AdoptionStatus> }> => {
  const user = await User.findOne({ _id: userId, role: "user" });
  if (!user) {
    throw new Error("User not found");
  }

  const pets = await Pet.find({ owner: user._id }).sort({ createdAt: -1 });
  const petIds = pets.map((pet) => pet._id);
  const adoptionStatusMap: Record<string, AdoptionStatus> = {};
  if (petIds.length > 0) {
    const listings = await AdoptionListing.find({ pet: { $in: petIds } }).select(
      "pet status"
    );
    for (const listing of listings) {
      if (listing.pet) {
        adoptionStatusMap[listing.pet.toString()] = listing.status;
      }
    }
  }

  return { pets, adoptionStatusMap };
};

export const getPetOwnerServices = async (userId: string): Promise<IServiceBooking[]> => {
  const user = await User.findOne({ _id: userId, role: "user" });
  if (!user) {
    throw new Error("User not found");
  }

  const services = await ServiceBooking.find({ customer: user._id })
    .sort({ createdAt: -1 })
    .populate({ path: "customer", select: "name phone" })
    .populate({ path: "provider", select: "name" });

  return services;
};
