import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const SchoolContext = createContext(null);

export function SchoolProvider({ children }) {
  const { user } = useAuth();
  const [currentSchool, setCurrentSchool] = useState(null);
  const [currentRole, setCurrentRole] = useState(null);

  useEffect(() => {
    if (user?.memberships?.length > 0) {
      // Pick the first school membership by default
      const membership = user.memberships[0];
      setCurrentSchool({ id: membership.school_id, name: membership.school_name, slug: membership.school_slug, carNumber: membership.car_number, timezone: membership.school_timezone || 'America/New_York' });
      setCurrentRole(membership.role);
    }
  }, [user]);

  const switchSchool = (schoolId) => {
    const membership = user?.memberships?.find(m => m.school_id === schoolId);
    if (membership) {
      setCurrentSchool({ id: membership.school_id, name: membership.school_name, slug: membership.school_slug, carNumber: membership.car_number, timezone: membership.school_timezone || 'America/New_York' });
      setCurrentRole(membership.role);
    }
  };

  return (
    <SchoolContext.Provider value={{ currentSchool, setCurrentSchool, currentRole, switchSchool, memberships: user?.memberships || [] }}>
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool() {
  const context = useContext(SchoolContext);
  if (!context) throw new Error('useSchool must be used within SchoolProvider');
  return context;
}
