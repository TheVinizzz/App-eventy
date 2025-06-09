import api from './api';
import { 
  EvenLoveProfile, 
  EvenLoveMatch, 
  EvenLoveMessage, 
  EvenLoveSwipe,
  EvenLoveStats,
  EvenLoveFilters,
  EvenLoveSettings,
  Gender,
  EvenLoveSwipeAction
} from '../types/evenLove';
import { ApiResponse } from '../types';

interface CreateProfileData {
  displayName: string;
  bio?: string;
  photos?: string[];
  lookingFor: 'FRIENDSHIP' | 'DATING' | 'NETWORKING' | 'ANY';
  showMe: 'EVERYONE' | 'MEN' | 'WOMEN' | 'NON_BINARY';
  ageRangeMin?: number;
  ageRangeMax?: number;
  maxDistance?: number;
  musicPreferences?: string[];
}

interface UpdateProfileData {
  displayName?: string;
  bio?: string;
  photos?: string[];
  lookingFor?: 'FRIENDSHIP' | 'DATING' | 'NETWORKING' | 'ANY';
  showMe?: 'EVERYONE' | 'MEN' | 'WOMEN' | 'NON_BINARY';
  ageRangeMin?: number;
  ageRangeMax?: number;
  maxDistance?: number;
  musicPreferences?: string[];
}

class EvenLoveService {
  // Profile Management
  async createProfile(eventId: string, profileData: CreateProfileData): Promise<EvenLoveProfile> {
    try {
      console.log('🚀 EvenLove: Criando perfil para evento:', eventId);
      console.log('📦 EvenLove: Dados enviados:', JSON.stringify(profileData, null, 2));
      
      const response = await api.post(`/events/${eventId}/evenlove/profile`, profileData);
      
      console.log('📡 EvenLove: Resposta do backend:', JSON.stringify(response.data, null, 2));
      
      // A API retorna diretamente os dados, não em response.data.data
      return response.data;
    } catch (error) {
      console.error('❌ EvenLove: Erro ao criar perfil:', error);
      throw error;
    }
  }

  async getProfile(eventId: string): Promise<EvenLoveProfile> {
    try {
      const response = await api.get(`/events/${eventId}/evenlove/profile`);
      return response.data;
    } catch (error) {
      console.error('Error getting EvenLove profile:', error);
      throw error;
    }
  }

  async updateProfile(eventId: string, profileData: UpdateProfileData): Promise<EvenLoveProfile> {
    try {
      const response = await api.put(`/events/${eventId}/evenlove/profile`, profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating EvenLove profile:', error);
      throw error;
    }
  }

  async uploadPhoto(eventId: string, photo: FormData): Promise<string> {
    try {
      const response = await api.post(`/events/${eventId}/evenlove/profile/photos`, photo, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.url;
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error;
    }
  }

  async deletePhoto(eventId: string, photoUrl: string): Promise<void> {
    try {
      await api.delete(`/events/${eventId}/evenlove/profile/photos`, {
        data: { photoUrl }
      });
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  }

  // Discovery and Matching
  async getProfiles(eventId: string, filters?: EvenLoveFilters): Promise<EvenLoveProfile[]> {
    try {
      console.log('🔍 EvenLove: Carregando perfis para evento:', eventId);
      
      const params = new URLSearchParams();
      if (filters?.minAge) params.append('minAge', filters.minAge.toString());
      if (filters?.maxAge) params.append('maxAge', filters.maxAge.toString());
      if (filters?.maxDistance) params.append('maxDistance', filters.maxDistance.toString());
      if (filters?.lookingFor) params.append('lookingFor', filters.lookingFor);
      if (filters?.showMe) params.append('showMe', filters.showMe);
      
      // Usar o endpoint correto: matches/potential
      const response = await api.get(`/events/${eventId}/evenlove/matches/potential?${params.toString()}`);
      
      console.log('📡 EvenLove: Resposta de perfis:', JSON.stringify(response.data, null, 2));
      
      // 🔧 CORREÇÃO: A API retorna { users: [...], hasMore: boolean }
      const profilesData = response.data?.users || [];
      
      console.log('✅ EvenLove: Perfis extraídos:', {
        total: profilesData.length,
        profiles: profilesData.map((p: any) => ({ id: p.id, name: p.displayName }))
      });
      
      return profilesData;
    } catch (error: any) {
      console.error('❌ EvenLove: Erro ao carregar perfis:', error);
      
      // Se for erro 404, retornar array vazio (usuário ainda não tem perfis para ver)
      if (error.response?.status === 404) {
        console.log('ℹ️ EvenLove: Nenhum perfil potencial encontrado - retornando array vazio');
        return [];
      }
      
      throw error;
    }
  }

  async swipeProfile(eventId: string, targetUserId: string, action: 'pass' | 'like' | 'super_like'): Promise<{ isMatch: boolean; match?: EvenLoveMatch }> {
    try {
      console.log('💫 EvenLove: Realizando swipe:', { eventId, targetUserId, action });
      
      // Map frontend actions to backend actions
      const backendAction: EvenLoveSwipeAction = action === 'pass' ? 'PASS' : 'LIKE';
      
      const response = await api.post(`/events/${eventId}/evenlove/swipe`, {
        targetUserId,
        action: backendAction
      });
      
      console.log('📡 EvenLove: Resposta do swipe:', JSON.stringify(response.data, null, 2));
      
      // A API retorna diretamente os dados, não em response.data.data
      return response.data;
    } catch (error: any) {
      console.error('❌ EvenLove: Erro no swipe:', error);
      throw error;
    }
  }

  async undoSwipe(eventId: string, targetUserId: string): Promise<void> {
    try {
      await api.delete(`/events/${eventId}/evenlove/swipe/${targetUserId}`);
    } catch (error) {
      console.error('Error undoing swipe:', error);
      throw error;
    }
  }

  // Match Management
  async getMatches(eventId: string): Promise<EvenLoveMatch[]> {
    try {
      console.log('🔍 EvenLove: Carregando matches para evento:', eventId);
      
      const response = await api.get(`/events/${eventId}/evenlove/matches`);
      
      console.log('📡 EvenLove: Resposta de matches:', JSON.stringify(response.data, null, 2));
      
      // 🔧 CORREÇÃO: Se a API retornar formato { users: [...] }, extrair corretamente
      const matchesData = response.data?.matches || response.data?.users || response.data || [];
      
      console.log('✅ EvenLove: Matches extraídos:', {
        total: matchesData.length,
        matches: matchesData.map((m: any) => ({ id: m.id, name: m.displayName || m.match?.displayName }))
      });
      
      return matchesData;
    } catch (error: any) {
      console.error('❌ EvenLove: Erro ao carregar matches:', error);
      
      // Se for erro 404, retornar array vazio (usuário ainda não tem matches)
      if (error.response?.status === 404) {
        console.log('ℹ️ EvenLove: Nenhum match encontrado - retornando array vazio');
        return [];
      }
      
      throw error;
    }
  }

  async getMatch(eventId: string, matchId: string): Promise<EvenLoveMatch> {
    try {
      const response = await api.get(`/evenlove/events/${eventId}/matches/${matchId}`);
      return response.data;
    } catch (error) {
      console.error('EvenLoveService: Error getting match:', error);
      throw error;
    }
  }

  async deleteMatch(eventId: string, matchId: string): Promise<void> {
    try {
      await api.delete(`/events/${eventId}/evenlove/matches/${matchId}`);
    } catch (error) {
      console.error('Error deleting match:', error);
      throw error;
    }
  }

  // Messaging
  async sendMessage(matchId: string, content: string, type: 'TEXT' | 'IMAGE' | 'AUDIO' = 'TEXT'): Promise<EvenLoveMessage> {
    try {
      const response = await api.post(`/evenlove/matches/${matchId}/messages`, {
        content,
        type
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async getMessages(matchId: string, page: number = 1, limit: number = 50): Promise<EvenLoveMessage[]> {
    try {
      const response = await api.get(`/evenlove/matches/${matchId}/messages?page=${page}&limit=${limit}`);
      return response.data || [];
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }

  async markMessagesAsRead(matchId: string): Promise<void> {
    try {
      await api.patch(`/evenlove/matches/${matchId}/read`);
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      await api.delete(`/evenlove/messages/${messageId}`);
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  // Settings
  async getSettings(eventId: string): Promise<EvenLoveSettings> {
    try {
      const response = await api.get(`/events/${eventId}/evenlove/settings`);
      return response.data;
    } catch (error) {
      console.error('Error getting settings:', error);
      throw error;
    }
  }

  async updateSettings(eventId: string, settings: Partial<EvenLoveSettings>): Promise<EvenLoveSettings> {
    try {
      const response = await api.put(`/events/${eventId}/evenlove/settings`, settings);
      return response.data;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }

  // User Management
  async blockUser(eventId: string, userId: string): Promise<void> {
    try {
      await api.post(`/events/${eventId}/evenlove/block/${userId}`);
    } catch (error) {
      console.error('Error blocking user:', error);
      throw error;
    }
  }

  async unblockUser(eventId: string, userId: string): Promise<void> {
    try {
      await api.delete(`/evenlove/events/${eventId}/block/${userId}`);
    } catch (error) {
      console.error('EvenLoveService: Error unblocking user:', error);
      throw error;
    }
  }

  async reportUser(eventId: string, userId: string, reason: string, description?: string): Promise<void> {
    try {
      await api.post(`/events/${eventId}/evenlove/report`, {
        reportedUserId: userId,
        reason,
        description
      });
    } catch (error) {
      console.error('Error reporting user:', error);
      throw error;
    }
  }

  // Statistics
  async getStats(eventId: string): Promise<EvenLoveStats> {
    try {
      const response = await api.get(`/events/${eventId}/evenlove/analytics`);
      return response.data;
    } catch (error) {
      console.error('Error getting stats:', error);
      throw error;
    }
  }

  // Eligibility
  async checkEligibility(eventId: string): Promise<{ isEligible: boolean; reason?: string }> {
    try {
      console.log('🔍 EvenLove: Verificando elegibilidade para evento:', eventId);
      
      const response = await api.get(`/events/${eventId}/evenlove/availability`);
      
      console.log('📡 EvenLove: Resposta da API recebida:', JSON.stringify(response.data, null, 2));
      
      // Verificar se a resposta existe
      if (!response || !response.data) {
        console.error('❌ EvenLove: Resposta da API inválida - sem dados');
        return { isEligible: false, reason: 'Resposta inválida do servidor' };
      }
      
      // A API retorna diretamente os dados, não em response.data.data
      const data = response.data;
      
      console.log('🎯 EvenLove: Dados de elegibilidade:', JSON.stringify(data, null, 2));
      
      // Verificar se tem as propriedades necessárias
      if (typeof data.available !== 'boolean') {
        console.error('❌ EvenLove: Propriedade "available" não encontrada ou inválida');
        return { isEligible: false, reason: 'Formato de resposta inválido' };
      }
      
      // Verificar elegibilidade
      const isEligible = data.available === true && (data.hasTicket !== false);
      const reason = data.reason || (isEligible ? undefined : 'Ingresso necessário para acessar');
      
      console.log('✅ EvenLove: Resultado final - Elegível:', isEligible, 'Razão:', reason);
      
      return {
        isEligible,
        reason
      };
    } catch (error: any) {
      console.error('❌ EvenLove: Erro ao verificar elegibilidade:', error);
      
      // Log detalhado do erro
      if (error.response) {
        console.error('❌ EvenLove: Status:', error.response.status);
        console.error('❌ EvenLove: Data:', error.response.data);
      }
      
      // Melhor tratamento de erros baseado no status HTTP
      if (error.response?.status === 404) {
        return { isEligible: false, reason: 'EvenLove não disponível para este evento' };
      }
      
      if (error.response?.status === 403) {
        return { isEligible: false, reason: 'Ingresso válido necessário para acessar o EvenLove' };
      }
      
      if (error.response?.status === 401) {
        return { isEligible: false, reason: 'Login necessário para acessar o EvenLove' };
      }
      
      // Erro de rede ou servidor
      if (!error.response) {
        return { isEligible: false, reason: 'Erro de conexão com o servidor' };
      }
      
      return { isEligible: false, reason: 'Erro ao verificar elegibilidade' };
    }
  }

  async getEventParticipants(eventId: string): Promise<number> {
    try {
      const response = await api.get(`/evenlove/events/${eventId}/participants`);
      return response.data.count || 0;
    } catch (error) {
      console.error('EvenLoveService: Error getting participants count:', error);
      throw error;
    }
  }
}

export default new EvenLoveService(); 