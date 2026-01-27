import { IServiceBooking } from "../../services/serviceBooking.model";

const uniqueList = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

const joinOrEmpty = (values: string[]) => uniqueList(values).join(", ");

const firstOrNull = <T>(values: (T | null | undefined)[]): T | null => {
  for (const value of values) {
    if (value !== null && value !== undefined) {
      return value;
    }
  }
  return null;
};

const formatAge = (age: number | null | undefined) => {
  if (age === null || age === undefined) {
    return "";
  }
  return `${age} ${age === 1 ? "year" : "years"}`;
};

const formatAgeList = (ages: (number | null | undefined)[]) =>
  joinOrEmpty(ages.map(formatAge));

const buildTotal = (price: number, taxPercent: number) => {
  const tax = (price * taxPercent) / 100;
  return Number((price + tax).toFixed(2));
};

export const toServiceSummary = (request: IServiceBooking) => {
  const items = request.items || [];
  const serviceTypes = items.map((item) => item.serviceType);
  const petTypes = items.map((item) => item.petType);
  const petBreeds = items.map((item) => item.petBreed || "");
  const petAges = items.map((item) => item.petAge);

  const customerName =
    typeof request.customer === "object" && request.customer
      ? (request.customer as { name?: string }).name || ""
      : "";

  return {
    id: request._id,
    customerName,
    serviceType: joinOrEmpty(serviceTypes),
    petType: joinOrEmpty(petTypes),
    petBreed: joinOrEmpty(petBreeds),
    petAge: firstOrNull(petAges),
    petAgeLabel: formatAgeList(petAges),
    status: request.status,
    createdAt: request.createdAt,
  };
};

export const toServiceDetails = (request: IServiceBooking) => {
  const customer =
    typeof request.customer === "object" && request.customer
      ? (request.customer as { name?: string; phone?: string })
      : {};
  const provider =
    typeof request.provider === "object" && request.provider
      ? (request.provider as { name?: string })
      : {};
  const items = request.items || [];

  return {
    id: request._id,
    customer: {
      name: customer.name || "",
      phone: customer.phone || "",
    },
    service: {
      serviceName: joinOrEmpty(items.map((item) => item.serviceName)),
      dateTime: request.scheduledAt,
      providerName: provider.name || "",
      status: request.status,
    },
    pet: {
      name: joinOrEmpty(items.map((item) => item.petName)),
      type: joinOrEmpty(items.map((item) => item.petType)),
      breed: joinOrEmpty(items.map((item) => item.petBreed || "")),
      age: firstOrNull(items.map((item) => item.petAge)),
      ageLabel: formatAgeList(items.map((item) => item.petAge)),
    },
    orderSummary: {
      serviceName: joinOrEmpty(items.map((item) => item.serviceName)),
      petName: joinOrEmpty(items.map((item) => item.petName)),
      servicePrice: request.subtotal,
      items: items.map((item) => ({
        serviceName: item.serviceName,
        petName: item.petName,
        price: item.unitPrice,
      })),
    },
    payment: {
      subtotal: request.subtotal,
      taxPercent: request.taxPercent,
      total: buildTotal(request.subtotal, request.taxPercent),
      status: request.paymentStatus,
    },
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
};
