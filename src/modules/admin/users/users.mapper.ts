import { IUser } from "../../user/users/user.model";
import { IPet } from "../../user/pets/pets.model";
import { AdoptionStatus } from "../../user/adoption/adoption.model";
import { IServiceBooking } from "../../services/serviceBooking.model";
import { toServiceDetails } from "../services/serviceRequests.mapper";

const DAY_MS = 24 * 60 * 60 * 1000;
const DELETION_WINDOW_DAYS = 30;

type DeletionInfo = {
  status: "active" | "deletion_request";
  deletionRequestedAt: Date | null | undefined;
  daysLeft: number | null;
};

const buildDeletionInfo = (user: IUser): DeletionInfo => {
  if (!user.deletionRequestedAt) {
    return {
      status: "active",
      deletionRequestedAt: null,
      daysLeft: null,
    };
  }

  const deadline = new Date(
    user.deletionRequestedAt.getTime() + DELETION_WINDOW_DAYS * DAY_MS
  );
  const msLeft = deadline.getTime() - Date.now();
  const daysLeft = Math.max(0, Math.ceil(msLeft / DAY_MS));

  return {
    status: "deletion_request",
    deletionRequestedAt: user.deletionRequestedAt,
    daysLeft,
  };
};

export const toAdminUserSummary = (user: IUser) => {
  const deletionInfo = buildDeletionInfo(user);
  return {
    id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    status: deletionInfo.status,
    deletionRequestedAt: deletionInfo.deletionRequestedAt,
    daysLeft: deletionInfo.daysLeft,
    createdAt: user.createdAt,
  };
};

export const toAdminUserDetails = (user: IUser) => {
  const deletionInfo = buildDeletionInfo(user);
  return {
    id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    phone: user.phone,
    status: deletionInfo.status,
    deletionRequestedAt: deletionInfo.deletionRequestedAt,
    daysLeft: deletionInfo.daysLeft,
    isVerified: user.isVerified,
    isPhoneVerified: user.isPhoneVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

const defaultHealthCounts = () => ({
  vaccination: 0,
  checkup: 0,
  medication: 0,
  tick_flea: 0,
  surgery: 0,
  dental: 0,
  other: 0,
});

const buildHealthRecordCounts = (pet: IPet) => {
  const counts = defaultHealthCounts();
  for (const record of pet.healthRecords || []) {
    if (record?.type && counts[record.type] !== undefined) {
      counts[record.type] += 1;
    }
  }
  return counts;
};

const getLatestVitalSigns = (pet: IPet) => {
  const records = pet.healthRecords || [];
  for (let i = records.length - 1; i >= 0; i -= 1) {
    const vital = records[i]?.vitalSigns;
    if (
      vital &&
      (vital.heartRate || vital.respiratory || vital.temperature || vital.weight)
    ) {
      return {
        heartRate: vital.heartRate || "",
        respiratory: vital.respiratory || "",
        temperature: vital.temperature || "",
        weight: vital.weight || "",
      };
    }
  }
  return {
    heartRate: "",
    respiratory: "",
    temperature: "",
    weight: "",
  };
};

export const toAdminUserProfile = (payload: {
  user: IUser;
  pets: IPet[];
  adoptionStatusMap: Record<string, AdoptionStatus>;
  reportCount: number;
  reportOnPostCount: number;
  services: IServiceBooking[];
}) => {
  const deletionInfo = buildDeletionInfo(payload.user);
  return {
    profile: {
      id: payload.user._id,
      name: payload.user.name,
      username: payload.user.username,
      avatarUrl: payload.user.avatarUrl,
      coverUrl: payload.user.coverUrl,
      status: deletionInfo.status,
      reportCount: payload.reportCount,
      reportOnPostCount: payload.reportOnPostCount,
      email: payload.user.email,
      phone: payload.user.phone,
      address: payload.user.address,
      city: payload.user.location?.city || "",
      country: payload.user.location?.country || "",
      joiningDate: payload.user.createdAt,
      deletionRequestedAt: deletionInfo.deletionRequestedAt,
      deletionDaysLeft: deletionInfo.daysLeft,
    },
    pets: payload.pets.map((pet) => ({
      id: pet._id,
      status: payload.adoptionStatusMap[pet._id.toString()] || "owned",
      name: pet.name,
      age: pet.age ?? null,
      memoryStart: pet.createdAt,
      type: pet.species,
      gender: pet.gender || "",
      breed: pet.breed || "",
      trained: pet.trained ?? false,
      neutered: pet.neutered ?? false,
      vaccinated: pet.vaccinated ?? false,
      avatarUrl: pet.avatarUrl,
      photos: pet.photos || [],
      vitalSigns: getLatestVitalSigns(pet),
      personality: pet.personality || [],
      aboutPet: pet.bio || "",
      healthRecordCounts: buildHealthRecordCounts(pet),
    })),
    services: payload.services.map((service) => toServiceDetails(service)),
  };
};
