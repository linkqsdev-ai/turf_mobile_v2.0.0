/**
 * enrollment-store.ts
 * Records a player enrolling in a coach's class.
 *
 * This is the record that decides whether a coach may still edit or delete a
 * class: once a class has one of these against it, the class is locked because
 * someone has already paid to attend it.
 */

export interface ClassEnrollment {
  id: string;
  classId: string;
  /** Snapshotted so the record stays readable if the class is later renamed. */
  className: string;
  studentName: string;
  studentAge: string;
  contactNumber: string;
  amountPaid: number;
  appliedCode?: string;
  createdAt: string;
}

export function createEnrollment(
  params: Omit<ClassEnrollment, 'id' | 'createdAt'>
): ClassEnrollment {
  return {
    ...params,
    id: `enroll-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
}

export function countForClass(list: ClassEnrollment[], classId: string): number {
  if (!classId) return 0;
  return list.filter(e => e.classId === classId).length;
}

/**
 * A class is editable/deletable only while nobody has enrolled. Centralised so
 * the coach's list, the edit screen and the delete action can't drift apart on
 * what "no bookings" means.
 */
export function isClassLocked(list: ClassEnrollment[], classId: string): boolean {
  return countForClass(list, classId) > 0;
}
