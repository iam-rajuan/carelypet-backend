import mongoose from "mongoose";
import ServiceProvider, { IServiceProvider } from "./providers.model";
import ProviderReview, { IProviderReview } from "./reviews.model";
import Appointment from "../appointments/appointments.model";
import {
  CreateProviderInput,
  UpdateProviderInput,
  ProviderQueryInput,
  VerifyProviderInput,
  CreateReviewInput,
  LocationInput,
} from "./providers.validation";

export interface PaginatedProviders {
  data: (IServiceProvider & { distanceMeters?: number })[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const sanitizePagination = (page?: number, limit?: number) => {
  const safePage = !page || Number.isNaN(page) || page < 1 ? 1 : Math.floor(page);
  const safeLimit =
    !limit || Number.isNaN(limit) || limit < 1 || limit > 100 ? 10 : Math.floor(limit);
  return { page: safePage, limit: safeLimit };
};

const toGeoPoint = (location?: LocationInput) => {
  if (!location) return undefined;
  return {
    type: "Point" as const,
    coordinates: [location.lng, location.lat] as [number, number],
  };
};

const ensureOwnedProvider = async (
  providerId: string,
  ownerId: string
): Promise<IServiceProvider> => {
  const provider = await ServiceProvider.findOne({ _id: providerId, owner: ownerId });
  if (!provider) {
    throw new Error("Provider not found or not authorized");
  }
  return provider;
};

export const createProvider = async (
  ownerId: string,
  payload: CreateProviderInput
): Promise<IServiceProvider> => {
  const provider = await ServiceProvider.create({
    owner: ownerId,
    name: payload.name.trim(),
    category: payload.category,
    bio: payload.bio?.trim(),
    phone: payload.phone?.trim(),
    email: payload.email?.trim(),
    address: payload.address?.trim(),
    location: toGeoPoint(payload.location),
    availability: payload.availability || [],
  });

  return provider;
};

export const updateProvider = async (
  ownerId: string,
  providerId: string,
  payload: UpdateProviderInput
): Promise<IServiceProvider> => {
  const provider = await ensureOwnedProvider(providerId, ownerId);

  if (payload.name !== undefined) provider.name = payload.name.trim();
  if (payload.category !== undefined) provider.category = payload.category;
  if (payload.bio !== undefined) provider.bio = payload.bio?.trim();
  if (payload.phone !== undefined) provider.phone = payload.phone?.trim();
  if (payload.email !== undefined) provider.email = payload.email?.trim();
  if (payload.address !== undefined) provider.address = payload.address?.trim();
  if (payload.location !== undefined) provider.location = toGeoPoint(payload.location);
  if (payload.availability !== undefined) provider.availability = payload.availability;

  await provider.save();
  return provider;
};

export const deleteProvider = async (ownerId: string, providerId: string): Promise<void> => {
  const provider = await ensureOwnedProvider(providerId, ownerId);

  const activeBooking = await Appointment.findOne({
    provider: provider._id,
    status: { $in: ["pending", "confirmed"] },
  });

  if (activeBooking) {
    throw new Error("Cannot delete provider with active appointments");
  }

  await ProviderReview.deleteMany({ provider: provider._id });
  await provider.deleteOne();
};

export const verifyProvider = async (
  adminId: string,
  providerId: string,
  payload: VerifyProviderInput
): Promise<IServiceProvider> => {
  const provider = await ServiceProvider.findById(providerId);
  if (!provider) {
    throw new Error("Provider not found");
  }

  provider.verificationStatus = payload.verificationStatus;
  if (payload.verificationStatus === "verified") {
    provider.verifiedAt = new Date();
    provider.verifiedBy = new mongoose.Types.ObjectId(adminId);
  } else {
    provider.verifiedAt = null;
    provider.verifiedBy = null;
  }

  await provider.save();
  return provider;
};

export const getProviderById = async (
  providerId: string,
  requestingUserId?: string | null,
  isAdmin?: boolean
): Promise<IServiceProvider> => {
  const provider = await ServiceProvider.findById(providerId);
  if (!provider) {
    throw new Error("Provider not found");
  }

  const isOwner = requestingUserId ? provider.owner.toString() === requestingUserId : false;

  if (provider.verificationStatus !== "verified" && !isOwner && !isAdmin) {
    throw new Error("Provider not found");
  }

  return provider;
};

export const listProviders = async (
  filters: ProviderQueryInput = {} as ProviderQueryInput
): Promise<PaginatedProviders> => {
  const { page, limit } = sanitizePagination(filters.page, filters.limit);

  const query: Record<string, any> = {};

  if (filters.category) query.category = filters.category;
  if (filters.status) query.verificationStatus = filters.status;
  else query.verificationStatus = "verified";

  if (filters.search) query.name = new RegExp(filters.search, "i");
  if (typeof filters.minRating === "number") {
    query.averageRating = { $gte: filters.minRating };
  }

  // Geo-filter using $geoNear when coordinates are provided
  if (typeof filters.lat === "number" && typeof filters.lng === "number") {
    const radiusMeters = (filters.radiusKm ?? 10) * 1000;


    // const pipeline = [
    //   {
    //     $geoNear: {
    //       near: { type: "Point", coordinates: [filters.lng, filters.lat] },
    //       distanceField: "distanceMeters",
    //       maxDistance: radiusMeters,
    //       spherical: true,
    //       query,
    //     },
    //   },
    //   { $sort: { distanceMeters: 1 } },
    // ];


    const pipeline: mongoose.PipelineStage[] = [];

    pipeline.push({
        $geoNear: {
            near: {type: "Point", coordinates: [filters.lng, filters.lat]},
            distanceField: "distancemeters",
            maxDistance: radiusMeters,
            spherical: true,
            query,
        }
    })

    pipeline.push({
        $sort: {distanceMeters: 1},
    })

    const totalResult = await ServiceProvider.aggregate([
      ...pipeline,
      { $count: "total" },
    ]) as any;
    const total = totalResult[0]?.total ?? 0;
    const providers = await ServiceProvider.aggregate([
      ...pipeline,
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ]);

    const totalPages = total === 0 ? 1 : Math.ceil(total / limit);
    return { data: providers as any, page, limit, total, totalPages };
  }

  const total = await ServiceProvider.countDocuments(query);
  const providers = await ServiceProvider.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const totalPages = total === 0 ? 1 : Math.ceil(total / limit);

  return { data: providers, page, limit, total, totalPages };
};

const recalcProviderRating = async (providerId: string): Promise<void> => {
  const stats = await ProviderReview.aggregate([
    { $match: { provider: new mongoose.Types.ObjectId(providerId) } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        ratingCount: { $sum: 1 },
      },
    },
  ]);

  const averageRating = stats[0]?.averageRating ?? 0;
  const ratingCount = stats[0]?.ratingCount ?? 0;

  await ServiceProvider.findByIdAndUpdate(providerId, {
    averageRating,
    ratingCount,
  });
};

export const createOrUpdateReview = async (
  userId: string,
  providerId: string,
  payload: CreateReviewInput
): Promise<IProviderReview> => {
  const provider = await ServiceProvider.findById(providerId);
  if (!provider) {
    throw new Error("Provider not found");
  }

  if (provider.verificationStatus !== "verified") {
    throw new Error("Provider is not verified");
  }

  if (provider.owner.toString() === userId) {
    throw new Error("Providers cannot review themselves");
  }

  const review = await ProviderReview.findOneAndUpdate(
    { provider: provider._id, user: userId },
    { $set: { rating: payload.rating, comment: payload.comment?.trim() } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await recalcProviderRating(provider._id.toString());
  return review as IProviderReview;
};
