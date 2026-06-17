import { PackGroup } from "../services/order.service";
export function formatOrderResponse(order: any, requestedByUserId?: string) {
  if (!order) return order;

  const isCustomer =
    requestedByUserId && order.customerId === requestedByUserId;
  const isVendor = requestedByUserId && order.vendorId === requestedByUserId;
  const isRider = requestedByUserId && order.riderId === requestedByUserId;

  const formatted: Record<string, any> = {
    id: order.id,
    currency: order.currency,
    status: order.status,
    notes: order.notes || "",
    deliveryLocation: order.deliveryLocation || {},
    pickupLocation: order.pickupLocation || {},
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    estDeliveryTime: order.estDeliveryTime || "",
    riderSecretKey: isRider ? order.riderSecretKey : "",
    customerSecretKey: isCustomer ? order.customerSecretKey : "",
    vendorNet: order.vendorNet,
    settlementStatus: order.settlementStatus || "PENDING",
    payoutStatus: order.payoutStatus || "PENDING",
    pickupAt: order.pickupAt || null,
    deliveredAt: order.deliveredAt || null,
    productPrice: !isRider ? order.productPrice : undefined,
    packsList: (order.items as unknown as PackGroup[]) || [],
  };

  if (order.vendor) {
    formatted.vendor = {
      vendorId: order.vendor.id,
      businessName: order.vendor.businessName || "",
      phone: !isCustomer ? order.vendor.phoneNumber || "" : undefined,
      brandLogoUrl: order.vendor.brandLogoUrl || "",
      coverPhotoUrl: order.vendor.coverPhotoUrl || "",
      vendorMaintenanceFee: isVendor ? order.vendorMaintenanceFee : undefined,
      totalAmountToReceive: isVendor ? order.vendorNet : undefined,
    };
  }

  if (order.customer) {
    formatted.customer = {
      customerId: order.customer.id,
      firstName: order.customer.firstName || "",
      lastName: order.customer.lastName || "",
      phone: !isVendor ? order.customer.phoneNumber || "" : undefined,
      profilePhotoUrl: order.customer.profilePhotoUrl || "",
      deliveryFee: isCustomer ? order.deliveryFee : undefined,
      protectionFee: isCustomer ? order.protectionFee : undefined,
      totalAmountToPay: isCustomer ? order.totalAmount : undefined,
    };
  }

  if (order.rider) {
    formatted.rider = {
      riderId: order.rider.id,
      firstName: order.rider.firstName || "",
      lastName: order.rider.lastName || "",
      phone: order.rider.phoneNumber || "",
      profilePhotoUrl: order.rider.profilePhotoUrl || "",
      riderMaintenanceFee: isRider ? order.riderMaintenanceFee : undefined,
      totalAmountToReceive: isRider ? order.riderNet : undefined,
      riderLocation: order.riderLocation || null,
    };
  }

  return formatted;
}
