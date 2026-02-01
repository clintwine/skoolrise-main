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
      
      // For parents, fetch by user_id filter
      try {
        const parents = await base44.entities.Parent.filter({ user_id: user.id });
        console.log('Parents from filter({ user_id }):', parents.length, parents);
        if (parents.length > 0) {
          return parents[0];
        }
      } catch (e) {
        console.log('Filter by user_id failed:', e);
      }
      
      // Fallback: list all and find
      try {
        const allParents = await base44.entities.Parent.list();
        console.log('All parents from list():', allParents.length);
        allParents.forEach(p => console.log('Parent:', p.id, 'user_id:', p.user_id));
        const myParent = allParents.find(p => p.user_id === user.id);
        if (myParent) {
          console.log('Found parent via list fallback:', myParent);
          return myParent;
        }
      } catch (e) {
        console.log('List parents failed:', e);
      }
      
      console.log('No parent profile found for user');
      return null;
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