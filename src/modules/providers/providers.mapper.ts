import { IServiceProvider } from "./providers.model";
import { IProviderReview } from "./reviews.model";

export const toProviderResponse = (
  provider: IServiceProvider & { distanceMeters?: number }
) => ({
  id: provider._id,
  owner: provider.owner,
  name: provider.name,
  category: provider.category,
  bio: provider.bio,
  phone: provider.phone,
  email: provider.email,
  address: provider.address,
  location: provider.location,
  verificationStatus: provider.verificationStatus,
  verifiedAt: provider.verifiedAt,
  verifiedBy: provider.verifiedBy,
  availability: provider.availability,
  averageRating: provider.averageRating,
  ratingCount: provider.ratingCount,
  distanceMeters: provider.distanceMeters,
  createdAt: provider.createdAt,
  updatedAt: provider.updatedAt,
});



export const toReviewResponse = (review: IProviderReview) => ({
  id: review._id,
  provider: review.provider,
  user: review.user,
  rating: review.rating,
  comment: review.comment,
  createdAt: review.createdAt,
  updatedAt: review.updatedAt,
});
