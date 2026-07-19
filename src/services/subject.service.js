import Subject from "../models/Subject.js";
import UserSubjectProgress from "../models/UserSubjectProgress.js";
import Topic from "../models/Topic.js";
import { ApiError } from "../utils/ApiError.js";

export const listSubjects = async (userId) => {
  const [subjects, progress] = await Promise.all([
    Subject.find().sort({ name: 1 }),
    UserSubjectProgress.find({ userId }),
  ]);
  const progressBySubject = new Map(progress.map((p) => [p.subjectId.toString(), p]));

  return subjects.map((s) => {
    const p = progressBySubject.get(s._id.toString());
    return {
      id: s._id,
      name: s.name,
      icon: s.icon,
      color: s.color,
      description: s.description,
      masteryScore: p?.masteryScore || 0,
      questionsAttempted: p?.questionsAttempted || 0,
    };
  });
};

export const getSubject = async (userId, subjectId) => {
  const subject = await Subject.findById(subjectId);
  if (!subject) throw ApiError.notFound("Subject not found");

  const [progress, topics] = await Promise.all([
    UserSubjectProgress.findOne({ userId, subjectId }),
    Topic.find({ subjectId }),
  ]);

  return {
    id: subject._id,
    name: subject.name,
    icon: subject.icon,
    color: subject.color,
    description: subject.description,
    masteryScore: progress?.masteryScore || 0,
    questionsAttempted: progress?.questionsAttempted || 0,
    questionsCorrect: progress?.questionsCorrect || 0,
    topics: topics.map((t) => ({ id: t._id, name: t.name })),
  };
};
