/**
 * Shared "what content can this user see" rule, used by every student-
 * facing service that reads tenant-scoped content (resources, exam
 * configs/mock exams, store items):
 *
 *   - schoolId: null  -> platform-wide content, visible to EVERY user
 *   - schoolId: <id>  -> exclusive to that school's own users
 *
 * A user with no schoolId (not part of any school) only ever sees
 * platform-wide content. A user belonging to a school sees platform-wide
 * content PLUS their own school's exclusive content — never another
 * school's exclusive content.
 */
export const tenantVisibilityFilter = (user) => {
  if (user?.schoolId) {
    return { $or: [{ schoolId: null }, { schoolId: user.schoolId }] };
  }
  return { schoolId: null };
};
