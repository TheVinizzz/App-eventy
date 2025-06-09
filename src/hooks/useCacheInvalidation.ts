import { useRef } from 'react';

interface CacheInvalidationOptions {
  onTicketPurchase?: () => Promise<void>;
  onEventCreated?: () => Promise<void>;
  onCommunityJoined?: () => Promise<void>;
}

export const useCacheInvalidation = (options: CacheInvalidationOptions = {}) => {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const invalidateAfterTicketPurchase = async () => {
    try {
      console.log('🔄 Invalidating cache after ticket purchase...');
      
      // Invalidar cache das comunidades
      await optionsRef.current.onTicketPurchase?.();
      
      console.log('✅ Cache invalidated successfully');
    } catch (error) {
      console.error('❌ Error invalidating cache after ticket purchase:', error);
    }
  };

  const invalidateAfterEventCreation = async () => {
    try {
      console.log('🔄 Invalidating cache after event creation...');
      
      // Invalidar cache da lista de eventos
      await optionsRef.current.onEventCreated?.();
      
      console.log('✅ Cache invalidated successfully');
    } catch (error) {
      console.error('❌ Error invalidating cache after event creation:', error);
    }
  };

  const invalidateAfterCommunityJoin = async () => {
    try {
      console.log('🔄 Invalidating cache after community join...');
      
      // Invalidar cache das comunidades
      await optionsRef.current.onCommunityJoined?.();
      
      console.log('✅ Cache invalidated successfully');
    } catch (error) {
      console.error('❌ Error invalidating cache after community join:', error);
    }
  };

  return {
    invalidateAfterTicketPurchase,
    invalidateAfterEventCreation,
    invalidateAfterCommunityJoin,
  };
};

export default useCacheInvalidation; 