import User, { IUser, UserRole } from "../auth/user.model";

export interface PaginatedUsers {
  data: IUser[];
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

export const listUsers = async (page?: number, limit?: number): Promise<PaginatedUsers> => {
  const { page: currentPage, limit: pageLimit } = sanitizePagination(page, limit);
  const skip = (currentPage - 1) * pageLimit;

  const [data, total] = await Promise.all([
    User.find().sort({ createdAt: -1 }).skip(skip).limit(pageLimit),
    User.countDocuments(),
  ]);

  const totalPages = Math.ceil(total / pageLimit) || 1;

  return {
    data,
    page: currentPage,
    limit: pageLimit,
    total,
    totalPages,
  };
};

export const getUserById = async (id: string): Promise<IUser> => {
  const user = await User.findById(id);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

export const updateUserStatus = async (
  id: string,
  status: "pending" | "active" | "rejected"
): Promise<IUser> => {
  const user = await User.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  );
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

export const updateUserRole = async (id: string, role: UserRole): Promise<IUser> => {
  const user = await User.findByIdAndUpdate(
    id,
    { role },
    { new: true, runValidators: true }
  );
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

export const suspendUser = async (id: string): Promise<IUser> => {
  const user = await User.findByIdAndUpdate(
    id,
    { isSuspended: true },
    { new: true, runValidators: true }
  );
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

export const unsuspendUser = async (id: string): Promise<IUser> => {
  const user = await User.findByIdAndUpdate(
    id,
    { isSuspended: false },
    { new: true, runValidators: true }
  );
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

// Placeholder service stubs (to be implemented later)
export const createProvider = async () => {
  // TODO: implement provider creation logic
};

export const listProviders = async () => {
  // TODO: implement provider listing logic
};

export const approveAdoptionListing = async () => {
  // TODO: implement adoption listing approval logic
};

export const changeAdoptionState = async () => {
  // TODO: implement adoption state change logic
};

export const removePost = async () => {
  // TODO: implement post removal logic
};

export const removeComment = async () => {
  // TODO: implement comment removal logic
};

export const listTransactions = async () => {
  // TODO: implement transaction listing logic
};

export const viewPaymentDetails = async () => {
  // TODO: implement payment detail view logic
};

export const userAnalytics = async () => {
  // TODO: implement user analytics logic
};

export const providerAnalytics = async () => {
  // TODO: implement provider analytics logic
};

export const adoptionAnalytics = async () => {
  // TODO: implement adoption analytics logic
};
