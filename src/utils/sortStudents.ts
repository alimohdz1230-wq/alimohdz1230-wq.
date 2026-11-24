import { SortMode, Student } from '../types';

export function sortStudents(students: Student[], mode: SortMode): Student[] {
  const list = [...students];
  if (mode === 'alphabetical') {
    return list.sort((a, b) => a.fullName.localeCompare(b.fullName, 'ar'));
  }
  if (mode === 'date') {
    return list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
  return list.sort((a, b) => a.manualOrder - b.manualOrder || a.createdAt.localeCompare(b.createdAt));
}
