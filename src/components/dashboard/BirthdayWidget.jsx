import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cake, Gift, PartyPopper } from 'lucide-react';
import { format, isToday, isTomorrow, addDays, parseISO } from 'date-fns';

export default function BirthdayWidget() {
  const { data: students = [] } = useQuery({
    queryKey: ['students-birthdays'],
    queryFn: () => base44.entities.Student.list(),
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers-birthdays'],
    queryFn: () => base44.entities.Teacher.list(),
  });

  const today = new Date();
  const thisMonth = today.getMonth();
  const thisDay = today.getDate();

  const isBirthdayToday = (dob) => {
    if (!dob) return false;
    const date = new Date(dob);
    return date.getMonth() === thisMonth && date.getDate() === thisDay;
  };

  const isBirthdayThisWeek = (dob) => {
    if (!dob) return false;
    const date = new Date(dob);
    const birthdayThisYear = new Date(today.getFullYear(), date.getMonth(), date.getDate());
    const weekFromNow = addDays(today, 7);
    return birthdayThisYear > today && birthdayThisYear <= weekFromNow;
  };

  const todayBirthdays = [
    ...students.filter(s => s.status === 'Active' && isBirthdayToday(s.date_of_birth)).map(s => ({
      name: `${s.first_name} ${s.last_name}`,
      type: 'Student',
      photo: s.photo_url,
    })),
    ...teachers.filter(t => t.status === 'Active' && isBirthdayToday(t.date_of_birth)).map(t => ({
      name: `${t.first_name} ${t.last_name}`,
      type: 'Teacher',
      photo: t.photo_url,
    })),
  ];

  const upcomingBirthdays = [
    ...students.filter(s => s.status === 'Active' && isBirthdayThisWeek(s.date_of_birth)).map(s => ({
      name: `${s.first_name} ${s.last_name}`,
      type: 'Student',
      date: s.date_of_birth,
      photo: s.photo_url,
    })),
    ...teachers.filter(t => t.status === 'Active' && isBirthdayThisWeek(t.date_of_birth)).map(t => ({
      name: `${t.first_name} ${t.last_name}`,
      type: 'Teacher',
      date: t.date_of_birth,
      photo: t.photo_url,
    })),
  ].slice(0, 5);

  if (todayBirthdays.length === 0 && upcomingBirthdays.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-pink-700">
          <Cake className="w-5 h-5" />
          Birthdays
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {todayBirthdays.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <PartyPopper className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-semibold text-gray-700">Today's Celebrations!</span>
            </div>
            <div className="space-y-2">
              {todayBirthdays.map((person, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 bg-white/60 rounded-lg">
                  {person.photo ? (
                    <img src={person.photo} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center text-white font-semibold">
                      {person.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{person.name}</p>
                    <p className="text-xs text-gray-500">{person.type}</p>
                  </div>
                  <Gift className="w-5 h-5 text-pink-500 ml-auto" />
                </div>
              ))}
            </div>
          </div>
        )}

        {upcomingBirthdays.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Coming Up This Week</p>
            <div className="space-y-2">
              {upcomingBirthdays.map((person, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 bg-white/40 rounded-lg">
                  {person.photo ? (
                    <img src={person.photo} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-300 to-purple-300 flex items-center justify-center text-white text-sm font-semibold">
                      {person.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{person.name}</p>
                    <p className="text-xs text-gray-500">{person.type}</p>
                  </div>
                  <span className="text-xs text-pink-600 font-medium">
                    {format(new Date(new Date().getFullYear(), new Date(person.date).getMonth(), new Date(person.date).getDate()), 'MMM d')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}