import React, { createContext, useContext, useState, ReactNode } from 'react';
import { EventCommunity } from '../services/eventCommunityService';

interface CommunityContextType {
  currentCommunity: EventCommunity | null;
  isInEventCommunity: boolean;
  enterEventCommunity: (community: EventCommunity) => void;
  exitToGeneralCommunity: () => void;
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

interface CommunityProviderProps {
  children: ReactNode;
}

export const CommunityProvider: React.FC<CommunityProviderProps> = ({ children }) => {
  const [currentCommunity, setCurrentCommunity] = useState<EventCommunity | null>(null);

  const enterEventCommunity = (community: EventCommunity) => {
    setCurrentCommunity(community);
  };

  const exitToGeneralCommunity = () => {
    setCurrentCommunity(null);
  };

  const value: CommunityContextType = {
    currentCommunity,
    isInEventCommunity: !!currentCommunity,
    enterEventCommunity,
    exitToGeneralCommunity,
  };

  return (
    <CommunityContext.Provider value={value}>
      {children}
    </CommunityContext.Provider>
  );
};

export const useCommunity = (): CommunityContextType => {
  const context = useContext(CommunityContext);
  if (context === undefined) {
    throw new Error('useCommunity must be used within a CommunityProvider');
  }
  return context;
}; 