// Fixed central warehouse coordinates / pincode reference
const WAREHOUSE_PINCODE = 560001; // E.g., Central Warehouse (Bengaluru)

/**
 * Calculates estimated delivery date based on distance between 
 * warehouse pincode and user pincode.
 */
export const calculateArrivalDate = (orderDateStr: string, userPincodeStr: string): string => {
  const orderDate = new Date(orderDateStr);
  const userPincode = parseInt(userPincodeStr, 10) || WAREHOUSE_PINCODE;

  // Approximate distance band derived from pincode variance
  const pinDiff = Math.abs(userPincode - WAREHOUSE_PINCODE);

  let transitDays = 2; // Default local/same-zone delivery

  if (pinDiff > 50000) {
    transitDays = 6; // Far national delivery
  } else if (pinDiff > 20000) {
    transitDays = 4; // Regional delivery
  } else if (pinDiff > 5000) {
    transitDays = 3; // Neighboring state delivery
  }

  const arrivalDate = new Date(orderDate);
  arrivalDate.setDate(orderDate.getDate() + transitDays);

  return arrivalDate.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};