import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import { loadJSON, saveJSON } from '@/utils/storage';

const STORAGE_KEY = 'studymate.subjects';

type SubjectsContextValue = {
  subjects: string[];
  addSubject: (name: string) => void;
  deleteSubject: (name: string) => void;
};

const SubjectsContext = createContext<SubjectsContextValue | null>(null);

const initialSubjects = ['Artificial Intelligence', 'Cybersecurity', 'Database Systems'];

export function SubjectsProvider({ children }: { children: ReactNode }) {
  const [subjects, setSubjects] = useState<string[]>(initialSubjects);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await loadJSON<string[]>(STORAGE_KEY);

      if (stored) {
        setSubjects(stored);
      }

      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    saveJSON(STORAGE_KEY, subjects);
  }, [subjects, hydrated]);

  const addSubject = (name: string) => {
    if (name.trim() === '') {
      return;
    }

    setSubjects((previous) => [...previous, name.trim()]);
  };

  const deleteSubject = (name: string) => {
    setSubjects((previous) => previous.filter((subject) => subject !== name));
  };

  return (
    <SubjectsContext.Provider value={{ subjects, addSubject, deleteSubject }}>
      {children}
    </SubjectsContext.Provider>
  );
}

export function useSubjects() {
  const context = useContext(SubjectsContext);

  if (!context) {
    throw new Error('useSubjects must be used within a SubjectsProvider');
  }

  return context;
}
