import PendingAction from "../models/PendingAction.js";
import Subject from "../models/Subject.js";
import Topic from "../models/Topic.js";
import Resource from "../models/Resource.js";
import Mission from "../models/Mission.js";
import Achievement from "../models/Achievement.js";
import StoreItem from "../models/StoreItem.js";
import FeatureFlag from "../models/FeatureFlag.js";
import ExamConfig from "../models/ExamConfig.js";
import Wallet from "../models/Wallet.js";
import Streak from "../models/Streak.js";
import UserSettings from "../models/UserSettings.js";
import UserSubjectProgress from "../models/UserSubjectProgress.js";
import Notification from "../models/Notification.js";
import StudyPlan from "../models/StudyPlan.js";
import { ApiError } from "../utils/ApiError.js";

import * as practiceService from "./practice.service.js";
import * as cbtService from "./cbt.service.js";
import * as flashcardService from "./flashcard.service.js";
import * as walletService from "./wallet.service.js";
import * as settingsService from "./settings.service.js";

/**
 * ACTION_HANDLERS: each offline action type maps to the SAME service call
 * the live (online) endpoint uses — so an offline practice attempt goes
 * through the exact same mastery-scoring/coin-awarding/streak-bumping logic
 * as an online one, no parallel code path to drift out of sync.
 */
const ACTION_HANDLERS = {
  practice_attempt: (userId, payload) => practiceService.recordAttempt(userId, payload),
  cbt_submit: (userId, payload) => cbtService.submitExam(userId, payload.examId, payload),
  flashcard_review: (userId, payload) =>
    flashcardService.reviewCard(userId, payload.deckId, payload.cardId, payload.rating),
  mission_claim: (userId, payload) => walletService.claimMission(userId, payload.missionId),
};

/**
 * "Last write wins, but only if the offline edit is actually newer" — for
 * mutable per-user documents (settings, study plan) rather than the
 * append-only actions above. If the server document was updated more
 * recently than the client's offline edit happened (occurredAt), the
 * offline edit is stale and is reported back as a conflict instead of
 * silently overwriting a newer server-side change.
 */
const CONFLICT_AWARE_HANDLERS = {
  settings_update: {
    getCurrent: (userId) => UserSettings.findOne({ userId }),
    apply: (userId, payload) => settingsService.updateSettings(userId, payload),
  },
  study_plan_update: {
    getCurrent: (userId) => StudyPlan.findOne({ userId }),
    apply: async (userId, payload) => {
      const plan = await StudyPlan.findOneAndUpdate(
        { userId },
        { $set: payload },
        { new: true, upsert: true, runValidators: true },
      );
      return plan;
    },
  },
};

const applyOneAction = async (userId, deviceId, action) => {
  const { clientActionId, type, payload, occurredAt } = action;

  const existing = await PendingAction.findOne({ userId, clientActionId });
  if (existing) {
    return { clientActionId, status: "duplicate", result: existing.result };
  }

  const occurredAtDate = new Date(occurredAt);

  try {
    if (CONFLICT_AWARE_HANDLERS[type]) {
      const { getCurrent, apply } = CONFLICT_AWARE_HANDLERS[type];
      const current = await getCurrent(userId);

      if (current?.updatedAt && current.updatedAt > occurredAtDate) {
        const record = await PendingAction.create({
          userId,
          deviceId,
          clientActionId,
          type,
          payload,
          occurredAt: occurredAtDate,
          status: "conflict",
          result: { serverUpdatedAt: current.updatedAt },
        });
        return { clientActionId, status: "conflict", result: record.result };
      }

      const result = await apply(userId, payload);
      await PendingAction.create({
        userId,
        deviceId,
        clientActionId,
        type,
        payload,
        occurredAt: occurredAtDate,
        status: "applied",
        result,
      });
      return { clientActionId, status: "applied", result };
    }

    const handler = ACTION_HANDLERS[type];
    if (!handler) throw ApiError.badRequest(`Unknown offline action type "${type}"`);

    const result = await handler(userId, payload);
    await PendingAction.create({
      userId,
      deviceId,
      clientActionId,
      type,
      payload,
      occurredAt: occurredAtDate,
      status: "applied",
      result,
    });
    return { clientActionId, status: "applied", result };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Failed to apply action";
    await PendingAction.create({
      userId,
      deviceId,
      clientActionId,
      type,
      payload,
      occurredAt: occurredAtDate,
      status: "failed",
      error: message,
    }).catch(() => {}); // best-effort logging; don't let a duplicate-key race hide the real error below
    return { clientActionId, status: "failed", error: message };
  }
};

/**
 * Actions are applied SEQUENTIALLY (not Promise.all) and in the order the
 * client recorded them, since several action types are order-sensitive
 * (e.g. two flashcard reviews of the same card change its SM-2 schedule
 * cumulatively — applying them out of order would compute a different
 * result than what actually happened offline).
 */
export const applyActions = async (userId, { deviceId, actions }) => {
  const results = [];
  for (const action of actions) {
    results.push(await applyOneAction(userId, deviceId, action));
  }
  return { results };
};

const deltaSince = async (Model, filter, since) => {
  const query = since ? { ...filter, updatedAt: { $gt: since } } : filter;
  return Model.find(query).limit(500);
};

/**
 * Returns everything changed since `since` (an ISO timestamp from a
 * previous call's `serverTime`, or omitted for a full initial sync).
 * Splits into "catalog" (shared reference data, same for every user) and
 * "user" (this user's own progress/state) so the client can cache the
 * former much more aggressively than the latter.
 */
export const getSyncState = async (userId, since) => {
  const sinceDate = since ? new Date(since) : null;
  const serverTime = new Date();

  const [subjects, topics, resources, missions, achievements, storeItems, featureFlags, examConfigs] =
    await Promise.all([
      deltaSince(Subject, {}, sinceDate),
      deltaSince(Topic, {}, sinceDate),
      deltaSince(Resource, {}, sinceDate),
      deltaSince(Mission, { active: true }, sinceDate),
      deltaSince(Achievement, {}, sinceDate),
      deltaSince(StoreItem, {}, sinceDate),
      deltaSince(FeatureFlag, { enabled: true }, sinceDate),
      deltaSince(ExamConfig, {}, sinceDate),
    ]);

  const [wallet, streak, settings, subjectProgress, notifications, studyPlan] = await Promise.all([
    deltaSince(Wallet, { userId }, sinceDate),
    deltaSince(Streak, { userId }, sinceDate),
    deltaSince(UserSettings, { userId }, sinceDate),
    deltaSince(UserSubjectProgress, { userId }, sinceDate),
    deltaSince(Notification, { userId }, sinceDate),
    deltaSince(StudyPlan, { userId }, sinceDate),
  ]);

  return {
    syncToken: serverTime.toISOString(),
    catalog: { subjects, topics, resources, missions, achievements, storeItems, featureFlags, examConfigs },
    user: { wallet, streak, settings, subjectProgress, notifications, studyPlan },
  };
};
