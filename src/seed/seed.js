/**
 * Idempotent reference-data seed (subjects/topics/questions/exam configs/
 * missions/achievements/store items/feature flags/role permissions).
 * Safe to re-run — uses upserts throughout. Run with `npm run seed`.
 */
import connectDB from "../config/db.js";
import mongoose from "mongoose";

import Subject from "../models/Subject.js";
import Topic from "../models/Topic.js";
import Question from "../models/Question.js";
import ExamConfig from "../models/ExamConfig.js";
import Mission from "../models/Mission.js";
import Achievement from "../models/Achievement.js";
import StoreItem from "../models/StoreItem.js";
import FeatureFlag from "../models/FeatureFlag.js";
import RolePermission from "../models/RolePermission.js";
import School from "../models/School.js";
import { ROLE_PERMISSIONS } from "../constants/roles.js";

const run = async () => {
  await connectDB();

  const subjectsData = [
    { name: "Mathematics", icon: "calculator", color: "#6366F1" },
    { name: "English Language", icon: "book", color: "#22C55E" },
    { name: "Physics", icon: "atom", color: "#0EA5E9" },
    { name: "Chemistry", icon: "flask", color: "#F59E0B" },
    { name: "Biology", icon: "leaf", color: "#10B981" },
  ];
  const subjects = {};
  for (const s of subjectsData) {
    subjects[s.name] = await Subject.findOneAndUpdate({ name: s.name }, s, { upsert: true, new: true });
  }

  const topicsData = [
    ["Mathematics", "Quadratic Equations"],
    ["Mathematics", "Trigonometry"],
    ["Physics", "Newton's Laws of Motion"],
    ["Chemistry", "Periodic Table"],
    ["Biology", "Cell Structure"],
    ["English Language", "Comprehension"],
  ];
  const topics = {};
  for (const [subjectName, topicName] of topicsData) {
    topics[topicName] = await Topic.findOneAndUpdate(
      { subjectId: subjects[subjectName]._id, name: topicName },
      { subjectId: subjects[subjectName]._id, name: topicName },
      { upsert: true, new: true },
    );
  }

  const existingQuestions = await Question.countDocuments();
  if (existingQuestions === 0) {
    await Question.insertMany([
      {
        topicId: topics["Quadratic Equations"]._id,
        subjectId: subjects["Mathematics"]._id,
        stem: "What are the roots of x^2 - 5x + 6 = 0?",
        difficulty: 2,
        options: [
          { label: "A", text: "x = 2, x = 3", isCorrect: true },
          { label: "B", text: "x = 1, x = 6", isCorrect: false },
          { label: "C", text: "x = -2, x = -3", isCorrect: false },
          { label: "D", text: "x = 5, x = 6", isCorrect: false },
        ],
        explanation: "Factor as (x-2)(x-3)=0, so x=2 or x=3.",
      },
      {
        topicId: topics["Newton's Laws of Motion"]._id,
        subjectId: subjects["Physics"]._id,
        stem: "Newton's second law states that force equals:",
        difficulty: 1,
        options: [
          { label: "A", text: "mass × acceleration", isCorrect: true },
          { label: "B", text: "mass × velocity", isCorrect: false },
          { label: "C", text: "mass / acceleration", isCorrect: false },
          { label: "D", text: "acceleration / mass", isCorrect: false },
        ],
        explanation: "F = ma is Newton's second law.",
      },
      {
        topicId: topics["Periodic Table"]._id,
        subjectId: subjects["Chemistry"]._id,
        stem: "Which element has the atomic number 8?",
        difficulty: 1,
        options: [
          { label: "A", text: "Oxygen", isCorrect: true },
          { label: "B", text: "Nitrogen", isCorrect: false },
          { label: "C", text: "Carbon", isCorrect: false },
          { label: "D", text: "Fluorine", isCorrect: false },
        ],
        explanation: "Oxygen has 8 protons.",
      },
    ]);
  }

  const examConfig = await ExamConfig.findOneAndUpdate(
    { title: "WAEC Mathematics Mock 2026" },
    {
      title: "WAEC Mathematics Mock 2026",
      subject: "Mathematics",
      board: "WAEC",
      kind: "mock_exam",
      durationMinutes: 60,
      questionCount: 1,
      hasCalculator: true,
      coinsReward: 50,
    },
    { upsert: true, new: true },
  );
  // Link one question to the mock exam so /cbt/:examId/questions returns something.
  await Question.updateOne(
    { stem: /x\^2 - 5x \+ 6/ },
    { $set: { examConfigId: examConfig._id } },
  );

  const missionsData = [
    { key: "daily_5_practice", label: "Answer 5 practice questions", reward: 10, goal: 5, metric: "attempts", icon: "target" },
    { key: "daily_1_cbt", label: "Submit 1 CBT/mock exam", reward: 25, goal: 1, metric: "cbt_submissions", icon: "clipboard" },
    { key: "daily_10_flashcards", label: "Review 10 flashcards", reward: 15, goal: 10, metric: "flashcards_reviewed", icon: "layers" },
  ];
  for (const m of missionsData) {
    await Mission.findOneAndUpdate({ key: m.key }, m, { upsert: true });
  }

  const achievementsData = [
    { key: "first_100_attempts", title: "Century Club", description: "Answer 100 practice questions", goal: 100, metric: "attempts", icon: "trophy" },
    { key: "streak_7", title: "Week Warrior", description: "Maintain a 7-day streak", goal: 7, metric: "streak_days", icon: "flame" },
    { key: "cbt_10", title: "Exam Ready", description: "Submit 10 CBT/mock exams", goal: 10, metric: "cbt_submissions", icon: "clipboard-check" },
    { key: "referrals_5", title: "Community Builder", description: "Refer 5 friends", goal: 5, metric: "referrals", icon: "users" },
  ];
  for (const a of achievementsData) {
    await Achievement.findOneAndUpdate({ key: a.key }, a, { upsert: true });
  }

  const storeItemsData = [
    { title: "3 Days Premium", description: "Unlock Premium features for 3 days", cost: 300, kind: "premium_time", icon: "star" },
    { title: "7 Days Premium", description: "Unlock Premium features for 7 days", cost: 600, kind: "premium_time", icon: "star" },
    { title: "Bonus Past Questions Pack", description: "Unlock an extra past-questions pack", cost: 200, kind: "bonus_content", icon: "book-open" },
  ];
  for (const item of storeItemsData) {
    await StoreItem.findOneAndUpdate({ title: item.title }, item, { upsert: true });
  }

  const flagsData = [
    { key: "offline_sync", label: "Offline Sync", description: "Enable offline study + sync", enabled: false, rolloutPercent: 0 },
    { key: "ai_vision", label: "AI Vision", description: "Enable image/document AI understanding", enabled: false, rolloutPercent: 0 },
  ];
  for (const flag of flagsData) {
    await FeatureFlag.findOneAndUpdate({ key: flag.key }, flag, { upsert: true });
  }

  for (const [role, permissions] of Object.entries(ROLE_PERMISSIONS)) {
    await RolePermission.findOneAndUpdate({ role }, { role, permissions }, { upsert: true });
  }

  // Sample school so `POST /auth/signup { schoolCode: "DEMOSCH1" }` is
  // testable end-to-end without going through the admin school-creation flow.
  await School.findOneAndUpdate(
    { code: "DEMOSCH1" },
    { name: "Demo Academy", code: "DEMOSCH1", contactEmail: "admin@demoacademy.edu", plan: "school_basic" },
    { upsert: true },
  );

  console.log("Seed complete.");
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
