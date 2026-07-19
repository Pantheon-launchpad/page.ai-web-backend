import Subscription from "../models/Subscription.js";
import { ApiError } from "../utils/ApiError.js";

const PLANS = [
  {
    key: "free",
    title: "Free",
    price: 0,
    features: ["Practice mode", "50 AI messages/day", "Basic analytics", "Ads supported"],
  },
  {
    key: "premium",
    title: "Premium",
    price: 1500, // NGN/month, illustrative
    features: [
      "Unlimited AI tutor messages",
      "Priority AI response time",
      "Advanced analytics",
      "Offline downloads",
      "Ad-free",
    ],
  },
];

export const getPlans = async (userId) => {
  const subscription = await Subscription.findOne({ userId });
  return { plans: PLANS, currentPlan: subscription?.plan || "free" };
};

export const upgrade = async () => {
  // Payment processor integration is explicitly TBD (API_CONTRACT.md §19) —
  // this deliberately does not silently grant Premium without payment.
  throw ApiError.badRequest(
    "Premium upgrade requires a payment processor integration, which is not configured on this server yet.",
  );
};
