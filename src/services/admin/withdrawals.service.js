import WalletTransaction from "../../models/WalletTransaction.js";
import Wallet from "../../models/Wallet.js";
import { ApiError } from "../../utils/ApiError.js";

/**
 * "Withdrawals" surfaces store-credit redemptions (wallet_transactions where
 * category="store", type="spent") for admin oversight — see
 * services/wallet.service.js for why redemption itself is instant/in-app-only
 * and not a cash payout. Approve is a no-op audit acknowledgement; reject
 * refunds the spent credit back to the user (e.g. for a mis-redeemed or
 * fraudulent request).
 */
export const listWithdrawals = async ({ status, page = 1, pageSize = 20 } = {}) => {
  const filter = { category: "store", type: "spent" };
  if (status) filter.status = status;
  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    WalletTransaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).populate("userId", "name email"),
    WalletTransaction.countDocuments(filter),
  ]);
  return {
    items: items.map((t) => ({
      id: t._id,
      user: t.userId,
      label: t.label,
      coins: t.coins,
      status: t.status || "approved",
      createdAt: t.createdAt,
    })),
    page: Number(page),
    pageSize: Number(pageSize),
    total,
  };
};

export const approveWithdrawal = async (id) => {
  const txn = await WalletTransaction.findByIdAndUpdate(id, { status: "approved" }, { new: true });
  if (!txn) throw ApiError.notFound("Withdrawal not found");
  return txn;
};

export const rejectWithdrawal = async (id) => {
  const txn = await WalletTransaction.findById(id);
  if (!txn) throw ApiError.notFound("Withdrawal not found");
  if (txn.status === "rejected") throw ApiError.conflict("Already rejected");

  txn.status = "rejected";
  await txn.save();

  await Wallet.updateOne({ userId: txn.userId }, { $inc: { storeCredit: txn.coins } });
  return txn;
};
