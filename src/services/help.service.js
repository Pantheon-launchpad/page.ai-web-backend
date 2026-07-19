import SupportTicket from "../models/SupportTicket.js";

const FAQS = [
  { id: "1", question: "How do I earn Page Coins?", answer: "Complete practice questions, CBT exams, daily missions, and flashcard reviews to earn coins." },
  { id: "2", question: "Can I redeem coins for cash?", answer: "No — coins can only be redeemed for in-app value like Premium time or bonus content." },
  { id: "3", question: "How does the AI Tutor work?", answer: "Ask any question in the AI Tutor and get a step-by-step explanation tailored to your level." },
  { id: "4", question: "Is Page.AI available offline?", answer: "Offline support is being rolled out on the desktop and mobile apps — downloaded content works without internet." },
];

export const getFaqs = async () => FAQS;

export const contactSupport = async (userId, { subject, message }) => {
  const ticket = await SupportTicket.create({ userId, subject, message });
  return { id: ticket._id, status: ticket.status };
};
