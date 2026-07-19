// Shapes a Mongoose User doc into the `User` type the frontend expects
// (types/auth.ts) — never leak password/tokens/internal fields.
export const toUserDto = (user) => ({
  id: user._id?.toString?.() ?? user.id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  avatarInitial: user.avatarInitial,
  role: user.role,
  classLevel: user.classLevel,
  targetExams: user.targetExams,
  focusSubjects: user.focusSubjects,
  school: user.school,
  schoolId: user.schoolId,
  status: user.status,
  isVerified: user.isVerified,
  authProvider: user.authProvider,
  createdAt: user.createdAt,
  lastActiveAt: user.lastActiveAt,
});
