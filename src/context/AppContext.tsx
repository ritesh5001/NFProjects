import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Client, NotificationSettings } from '../types';
import { AgencyProject, getProjects } from '../api/projects';
import { getClients } from '../api/clients';

export type ThemePreference = 'system' | 'light' | 'dark';

const DEFAULT_NOTIF_SETTINGS: NotificationSettings = {
  enabled: true,
  remind7Days: true,
  remind3Days: true,
  remind1Day: true,
};

interface AppState {
  projects: AgencyProject[];
  clients: Client[];
  notifSettings: NotificationSettings;
  theme: ThemePreference;
  dbReady: boolean;
}

type Action =
  | { type: 'SET_PROJECTS'; payload: AgencyProject[] }
  | { type: 'SET_CLIENTS'; payload: Client[] }
  | { type: 'SET_NOTIF_SETTINGS'; payload: NotificationSettings }
  | { type: 'SET_THEME'; payload: ThemePreference }
  | { type: 'SET_DB_READY' };

const initialState: AppState = {
  projects: [],
  clients: [],
  notifSettings: DEFAULT_NOTIF_SETTINGS,
  theme: 'system',
  dbReady: false,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_PROJECTS': return { ...state, projects: action.payload };
    case 'SET_CLIENTS': return { ...state, clients: action.payload };
    case 'SET_NOTIF_SETTINGS': return { ...state, notifSettings: action.payload };
    case 'SET_THEME': return { ...state, theme: action.payload };
    case 'SET_DB_READY': return { ...state, dbReady: true };
    default: return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
  refreshProjects: () => Promise<void>;
  refreshClients: () => Promise<void>;
}>({
  state: initialState,
  dispatch: () => {},
  refreshProjects: async () => {},
  refreshClients: async () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const refreshProjects = useCallback(async () => {
    const projects = await getProjects();
    dispatch({ type: 'SET_PROJECTS', payload: projects });
  }, []);

  const refreshClients = useCallback(async () => {
    const clients = await getClients();
    dispatch({ type: 'SET_CLIENTS', payload: clients });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [savedTheme, savedNotif] = await Promise.all([
          AsyncStorage.getItem('theme'),
          AsyncStorage.getItem('notifSettings'),
        ]);
        if (savedTheme === 'system' || savedTheme === 'light' || savedTheme === 'dark') {
          dispatch({ type: 'SET_THEME', payload: savedTheme });
        }
        if (savedNotif) {
          dispatch({ type: 'SET_NOTIF_SETTINGS', payload: JSON.parse(savedNotif) });
        }
      } catch {}
    })();
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, refreshProjects, refreshClients }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
