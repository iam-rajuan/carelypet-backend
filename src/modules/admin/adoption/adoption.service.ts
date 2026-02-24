import mongoose from "mongoose";
import AdoptionListing, { IAdoptionListing } from "../../user/adoption/adoption.model";
import AdoptionRequest, {
  IAdoptionRequest,
} from "../../user/adoption/adoptionRequest.model";
import AdoptionOrder from "../../user/adoption/adoptionOrder.model";
import * as notificationService from "../../notifications/notification.service";

export const listAdoptionListings = async (
  status?: string
): Promise<IAdoptionListing[]> => {
  const filter: Record<string, unknown> = {};
  if (status) {
    filter.status = status;
  }
  return AdoptionListing.find(filter).sort({ createdAt: -1 });
};

export const getAdoptionListing = async (id: string): Promise<IAdoptionListing> => {
  const listing = await AdoptionListing.findById(id);
  if (!listing) {
    throw new Error("Adoption listing not found");
  }
  return listing;
};

export const createAdoptionListing = async (
  payload: Partial<IAdoptionListing>
): Promise<IAdoptionListing> => {
  return AdoptionListing.create(payload);
};

export const updateAdoptionListing = async (
  id: string,
  payload: Partial<IAdoptionListing>
): Promise<IAdoptionListing> => {
  const listing = await AdoptionListing.findById(id);
  if (!listing) {
    throw new Error("Adoption listing not found");
  }
  Object.assign(listing, payload);
  await listing.save();
  return listing;
};

export const deleteAdoptionListing = async (id: string): Promise<void> => {
  const listing = await AdoptionListing.findById(id);
  if (!listing) {
    throw new Error("Adoption listing not found");
  }
  await listing.deleteOne();
};

export const listAdoptionRequests = async (
  status?: string
): Promise<IAdoptionRequest[]> => {
  const filter: Record<string, unknown> = {};
  if (status && status !== "all") {
    filter.status = status;
  }
  let requests = await AdoptionRequest.find(filter)
    .sort({ createdAt: -1 })
    .populate("customer", "name")
    .populate("listing", "species breed age status");
  if (requests.length > 0) {
    return requests;
  }

  // Backfill missing requests from pending adoption orders (created at checkout).
  const orderFilter: Record<string, unknown> = {};
  if (status && status !== "all") {
    orderFilter.status = status;
  }
  const orders = await AdoptionOrder.find(orderFilter).select("customer items status");
  for (const order of orders) {
    const customerId = order.customer;
    for (const item of order.items || []) {
      const listingId = (item as { listing?: any }).listing;
      if (!listingId) continue;
      const existing = await AdoptionRequest.findOne({
        listing: listingId,
        customer: customerId,
      });
      if (!existing) {
        await AdoptionRequest.create({
          listing: listingId,
          customer: customerId,
          status: order.status === "paid" ? "delivered" : "pending",
        });
      }
    }
  }

  requests = await AdoptionRequest.find(filter)
    .sort({ createdAt: -1 })
    .populate("customer", "name")
    .populate("listing", "species breed age status");
  return requests;
};

export const getAdoptionRequest = async (id: string): Promise<IAdoptionRequest> => {
  const request = await AdoptionRequest.findById(id)
    .populate("customer", "name phone address")
    .populate("listing", "petName species breed age gender avatarUrl photos status");
  if (!request) {
    throw new Error("Adoption request not found");
  }
  return request;
};

export const updateAdoptionRequestStatus = async (
  id: string,
  status: "pending" | "delivered"
): Promise<IAdoptionRequest> => {
  const request = await AdoptionRequest.findById(id);
  if (!request) {
    throw new Error("Adoption request not found");
  }
  const resolveId = (value: unknown): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (value instanceof mongoose.Types.ObjectId) return value.toString();
    if (typeof value === "object" && "_id" in value) {
      return resolveId((value as { _id?: unknown })._id);
    }
    return "";
  };

  request.status = status;
  await request.save();

  const customerId = resolveId(request.customer);
  const listingId = resolveId(request.listing);

  try {
    const listing = listingId
      ? await AdoptionListing.findById(listingId).select("petName").lean()
      : null;
    const petName = listing?.petName || "your pet adoption";

    if (customerId) {
      await notificationService.createForUser({
        recipientId: customerId,
        type: "adoption_request_status_updated",
        title: "Adoption request updated",
        body:
          status === "delivered"
            ? `Great news. Your adoption request for ${petName} was approved.`
            : `Your adoption request for ${petName} is now pending review.`,
        priority: status === "delivered" ? "high" : "normal",
        entityType: "adoption_request",
        entityId: String(request._id),
        dedupeKey: `adoption-request-status:${String(request._id)}:${status}`,
        metadata: { status, listingId },
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[notifications] Failed to create adoption status notification:", message);
  }

  if (status === "delivered") {
    if (listingId) {
      await AdoptionListing.updateOne({ _id: listingId }, { status: "adopted" });
    }

    if (customerId && listingId) {
      const order = await AdoptionOrder.findOne({
        customer: customerId,
        "items.listing": listingId,
      }).sort({ createdAt: -1 });

      console.log(
        `[adoption-complete] request=${request._id.toString()} customer=${customerId} listing=${listingId} order=${order?._id?.toString() || "none"} status=${order?.status || "n/a"} paymentStatus=${order?.paymentStatus || "n/a"} paidAt=${order?.paidAt?.toISOString?.() || "n/a"}`
      );

      if (order) {
        if (order.paymentStatus !== "paid") order.paymentStatus = "paid";
        if (order.status !== "paid") order.status = "paid";
        if (!order.paidAt) order.paidAt = new Date();
        await order.save();
      }
    }
  }
  return request;
};

export const deleteAdoptionRequest = async (id: string): Promise<void> => {
  const request = await AdoptionRequest.findById(id);
  if (!request) {
    throw new Error("Adoption request not found");
  }
  await request.deleteOne();
};

export const addHealthRecord = async (
  listingId: string,
  record: NonNullable<IAdoptionListing["healthRecords"]>[number]
): Promise<IAdoptionListing> => {
  const listing = await AdoptionListing.findById(listingId);
  if (!listing) {
    throw new Error("Adoption listing not found");
  }
  listing.healthRecords = listing.healthRecords || [];
  listing.healthRecords.push(record);
  await listing.save();
  return listing;
};

export const listHealthRecords = async (
  listingId: string,
  type?: string
): Promise<NonNullable<IAdoptionListing["healthRecords"]>> => {
  const listing = await AdoptionListing.findById(listingId).select("healthRecords");
  if (!listing) {
    throw new Error("Adoption listing not found");
  }
  const records = listing.healthRecords || [];
  if (!type) return records;
  return records.filter((record) => record.type === type);
};

export const deleteHealthRecord = async (
  listingId: string,
  recordId: string
): Promise<void> => {
  const listing = await AdoptionListing.findById(listingId);
  if (!listing) {
    throw new Error("Adoption listing not found");
  }
  const before = listing.healthRecords?.length || 0;
  listing.healthRecords = (listing.healthRecords || []).filter(
    (record: any) => record._id?.toString() !== recordId
  );
  if ((listing.healthRecords?.length || 0) === before) {
    throw new Error("Health record not found");
  }
  await listing.save();
};
