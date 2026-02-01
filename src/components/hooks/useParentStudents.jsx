import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Hook to get parent profile and linked students for the current user
 * Uses a consistent approach: Parent.linked_student_ids -> Student.get(id)
 */
export function useParentStudents(user) {
  // Get parent profile for current user
  const { data: parentProfile, isLoading: parentLoading } = useQuery({
    queryKey: ['parent-profile', user?.id, user?.parent_profile_id],
    queryFn: async () => {
      console.log('Fetching parent profile for user:', user.id, user.email);
      
      // First try direct parent_profile_id from User entity
      if (user.parent_profile_id) {
        try {
          const parent = await base44.entities.Parent.get(user.parent_profile_id);
          console.log('Found parent by profile_id:', parent);
          if (parent) return parent;
        } catch (e) {
          console.log('Could not fetch parent by profile_id:', e);
        }
      }
      
      // RLS filters to only this user's parent record (user_id matches)
      const parents = await base44.entities.Parent.list();
      console.log('Parents from list() call:', parents.length, parents);
      
      // Find parent where user_id matches current user
      const myParent = parents.find(p => p.user_id === user.id);
      console.log('Found my parent profile:', myParent);
      return myParent || null;
    },
    enabled: !!user?.id,
  });

  // Get students linked to this parent via linked_student_ids
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['parent-students', parentProfile?.id, parentProfile?.linked_student_ids],
    queryFn: async () => {
      if (!parentProfile?.linked_student_ids) {
        console.log('No linked_student_ids on parent profile');
        return [];
      }
      
      let linkedIds = [];
      try {
        linkedIds = JSON.parse(parentProfile.linked_student_ids);
      } catch (e) {
        console.error('Error parsing linked_student_ids:', e);
        return [];
      }
      
      if (!Array.isArray(linkedIds) || linkedIds.length === 0) {
        return [];
      }
      
      console.log('Fetching students with IDs:', linkedIds);
      
      // Fetch all students the parent can see, then filter by linked IDs
      const allStudents = await base44.entities.Student.list();
      console.log('All students visible to parent:', allStudents.length);
      
      const foundStudents = allStudents.filter(s => linkedIds.includes(s.id));
      console.log('Found linked students:', foundStudents.length, 'of', linkedIds.length);
      return foundStudents;
    },
    enabled: !!parentProfile?.id,
  });

  return {
    parentProfile,
    students,
    isLoading: parentLoading || studentsLoading,
    studentIds: students.map(s => s.id),
  };
}