import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uploadEventImage } from './imageService';

export interface EventCommunity {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  memberCount: number;
  joinedAt?: string;
  lastActivity?: string;
  canJoin?: boolean;
  event: {
    id: string;
    title: string;
    date: string;
    imageUrl?: string;
    venue: {
      name: string;
      city: string;
    };
  };
}

export interface CommunityPost {
  id: string;
  content: string;
  imageUrls: string[];
  videoUrl?: string;
  eventId: string;
  authorId: string;
  createdAt: string;
  isLiked: boolean;
  likesCount: number;
  commentsCount: number;
  author: {
    id: string;
    name: string;
    profileImage?: string;
  };
}

export interface CommunityComment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    profileImage?: string;
  };
}

export interface CommunityStory {
  id: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  content?: string;
  createdAt: string;
  isViewed: boolean;
  viewsCount: number;
  author: {
    id: string;
    name: string;
    profileImage?: string;
  };
}

export interface CommunityStoriesGroup {
  author: {
    id: string;
    name: string;
    profileImage?: string;
  };
  stories: CommunityStory[];
  hasUnviewed: boolean;
}

class EventCommunityService {
  private cache = new Map<string, { data: any; timestamp: number; expiresIn: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  private readonly STORAGE_KEY = 'event_communities_cache';

  // ========= SISTEMA DE CACHE =========

  private async getCachedData<T>(key: string): Promise<T | null> {
    try {
      // Verificar cache em memória primeiro
      const memoryCache = this.cache.get(key);
      if (memoryCache && Date.now() < memoryCache.timestamp + memoryCache.expiresIn) {
        return memoryCache.data as T;
      }

      // Verificar cache persistente
      const persistentCache = await AsyncStorage.getItem(`${this.STORAGE_KEY}_${key}`);
      if (persistentCache) {
        const parsed = JSON.parse(persistentCache);
        if (Date.now() < parsed.timestamp + parsed.expiresIn) {
          // Restaurar no cache em memória
          this.cache.set(key, parsed);
          return parsed.data as T;
        } else {
          // Remover cache expirado
          await AsyncStorage.removeItem(`${this.STORAGE_KEY}_${key}`);
        }
      }
    } catch (error) {
      console.warn('Erro ao recuperar cache:', error);
    }
    return null;
  }

  private async setCachedData<T>(key: string, data: T, customDuration?: number): Promise<void> {
    try {
      const expiresIn = customDuration || this.CACHE_DURATION;
      const cacheEntry = {
        data,
        timestamp: Date.now(),
        expiresIn,
      };

      // Salvar no cache em memória
      this.cache.set(key, cacheEntry);

      // Salvar no cache persistente
      await AsyncStorage.setItem(`${this.STORAGE_KEY}_${key}`, JSON.stringify(cacheEntry));
    } catch (error) {
      console.warn('Erro ao salvar no cache:', error);
    }
  }

  private async clearCache(): Promise<void> {
    try {
      this.cache.clear();
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.STORAGE_KEY));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.warn('Erro ao limpar cache:', error);
    }
  }

  // ========= GESTÃO DA COMUNIDADE =========

  async getUserCommunities(forceRefresh: boolean = false): Promise<EventCommunity[]> {
    const cacheKey = 'user_communities';
    
    try {
      // Tentar buscar do cache primeiro (se não for refresh forçado)
      if (!forceRefresh) {
        const cachedData = await this.getCachedData<EventCommunity[]>(cacheKey);
        if (cachedData && Array.isArray(cachedData)) {
          return cachedData;
        }
      }

      const response = await api.get('/event-communities/my-communities');
      const communities = Array.isArray(response.data) ? response.data : [];
      
      // Salvar no cache
      await this.setCachedData(cacheKey, communities);
      
      return communities;
    } catch (error: any) {
      console.error('Erro ao buscar comunidades do usuário:', error);
      
      // Em caso de erro, tentar usar dados do cache como fallback
      const cachedData = await this.getCachedData<EventCommunity[]>(cacheKey);
      if (cachedData && Array.isArray(cachedData)) {
        console.log('Usando dados do cache como fallback');
        return cachedData;
      }
      
      // Se o erro for 404, retornar array vazio em vez de lançar erro
      if (error?.response?.status === 404) {
        console.warn('Endpoint de comunidades não encontrado, retornando array vazio');
        return [];
      }
      
      // Para outros erros, ainda lançar para que a UI possa mostrar uma mensagem
      throw error;
    }
  }

  async getCommunityDetails(eventId: string, forceRefresh: boolean = false): Promise<EventCommunity> {
    const cacheKey = `community_details_${eventId}`;
    
    try {
      if (!forceRefresh) {
        const cachedData = await this.getCachedData<EventCommunity>(cacheKey);
        if (cachedData) {
          return cachedData;
        }
      }

      const response = await api.get(`/event-communities/${eventId}`);
      const community = response.data;
      
      await this.setCachedData(cacheKey, community);
      
      return community;
    } catch (error) {
      console.error('Erro ao buscar detalhes da comunidade:', error);
      
      const cachedData = await this.getCachedData<EventCommunity>(cacheKey);
      if (cachedData) {
        console.log('Usando dados do cache como fallback');
        return cachedData;
      }
      
      throw error;
    }
  }

  async getAvailableCommunities(forceRefresh: boolean = false): Promise<EventCommunity[]> {
    const cacheKey = 'available_communities';
    
    try {
      console.log('🔍 Frontend: Buscando comunidades disponíveis...');
      
      if (!forceRefresh) {
        const cachedData = await this.getCachedData<EventCommunity[]>(cacheKey);
        if (cachedData && Array.isArray(cachedData)) {
          console.log('📋 Frontend: Usando dados do cache:', cachedData.length, 'comunidades');
          return cachedData;
        }
      }

      console.log('🌐 Frontend: Fazendo requisição para /event-communities/available-communities');
      const response = await api.get('/event-communities/available-communities');
      const communities = Array.isArray(response.data) ? response.data : [];
      
      console.log('✅ Frontend: Recebidas', communities.length, 'comunidades disponíveis:', 
        communities.map((c: any) => c.name));
      
      await this.setCachedData(cacheKey, communities);
      
      return communities;
    } catch (error: any) {
      console.error('❌ Frontend: Erro ao buscar comunidades disponíveis:', error);
      console.error('Response status:', error?.response?.status);
      console.error('Response data:', error?.response?.data);
      
      const cachedData = await this.getCachedData<EventCommunity[]>(cacheKey);
      if (cachedData && Array.isArray(cachedData)) {
        console.log('📋 Frontend: Usando dados do cache como fallback');
        return cachedData;
      }
      
      if (error?.response?.status === 404) {
        console.warn('⚠️ Frontend: Endpoint de comunidades disponíveis não encontrado, retornando array vazio');
        return [];
      }
      
      throw error;
    }
  }

  async joinCommunity(eventId: string): Promise<void> {
    try {
      await api.post(`/event-communities/${eventId}/join`);
      
      // Invalidar cache relacionado
      await this.invalidateCommunityCache(eventId);
    } catch (error) {
      console.error('Erro ao entrar na comunidade:', error);
      throw error;
    }
  }

  private async invalidateCommunityCache(eventId?: string): Promise<void> {
    try {
      // Remover cache das comunidades do usuário
      await AsyncStorage.removeItem(`${this.STORAGE_KEY}_user_communities`);
      this.cache.delete('user_communities');
      
      // Remover cache das comunidades disponíveis
      await AsyncStorage.removeItem(`${this.STORAGE_KEY}_available_communities`);
      this.cache.delete('available_communities');
      
      if (eventId) {
        // Remover cache específico da comunidade
        await AsyncStorage.removeItem(`${this.STORAGE_KEY}_community_details_${eventId}`);
        this.cache.delete(`community_details_${eventId}`);
      }
    } catch (error) {
      console.warn('Erro ao invalidar cache:', error);
    }
  }

  // ========= POSTS DA COMUNIDADE =========

  async getCommunityPosts(eventId: string, page = 1, limit = 20, forceRefresh: boolean = false): Promise<CommunityPost[]> {
    const cacheKey = `community_posts_${eventId}_${page}_${limit}`;
    
    try {
      if (!forceRefresh && page === 1) { // Apenas usar cache para primeira página
        const cachedData = await this.getCachedData<CommunityPost[]>(cacheKey);
        if (cachedData && Array.isArray(cachedData)) {
          return cachedData;
        }
      }

      const response = await api.get(`/event-communities/${eventId}/posts`, {
        params: { page, limit }
      });
      
      const posts = Array.isArray(response.data) ? response.data : [];
      
      if (page === 1) {
        await this.setCachedData(cacheKey, posts, 2 * 60 * 1000); // Cache posts por 2 minutos
      }
      
      return posts;
    } catch (error) {
      console.error('Erro ao buscar posts da comunidade:', error);
      
      if (page === 1) {
        const cachedData = await this.getCachedData<CommunityPost[]>(cacheKey);
        if (cachedData && Array.isArray(cachedData)) {
          return cachedData;
        }
      }
      
      return []; // Retornar array vazio em caso de erro
    }
  }

  async createPost(eventId: string, content: string, imageUris: string[] = []): Promise<CommunityPost> {
    try {
      let uploadedImageUrls: string[] = [];

      // Upload images first if any
      if (imageUris.length > 0) {
        console.log('Uploading images for community post...', imageUris.length);
        for (const imageUri of imageUris) {
          try {
            const uploadedUrl = await uploadEventImage(imageUri);
            uploadedImageUrls.push(uploadedUrl);
            console.log('Image uploaded successfully:', uploadedUrl);
          } catch (uploadError) {
            console.error('Error uploading image:', uploadError);
            throw new Error('Falha no upload da imagem');
          }
        }
      }

      // Create post with uploaded image URLs
      const postData = {
        content,
        imageUrls: uploadedImageUrls,
      };

      const response = await api.post(`/event-communities/${eventId}/posts`, postData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao criar post:', error);
      throw error;
    }
  }

  async togglePostLike(postId: string): Promise<{ liked: boolean }> {
    try {
      const response = await api.post(`/event-communities/posts/${postId}/like`);
      return response.data;
    } catch (error) {
      console.error('Erro ao curtir/descurtir post:', error);
      throw error;
    }
  }

  async getPostComments(postId: string): Promise<CommunityComment[]> {
    try {
      const response = await api.get(`/event-communities/posts/${postId}/comments`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
      throw error;
    }
  }

  async addComment(postId: string, content: string): Promise<CommunityComment> {
    try {
      const response = await api.post(`/event-communities/posts/${postId}/comments`, {
        content
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      throw error;
    }
  }

  // ========= STORIES DA COMUNIDADE =========

  async getCommunityStories(eventId: string): Promise<CommunityStoriesGroup[]> {
    try {
      const response = await api.get(`/event-communities/${eventId}/stories`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar stories da comunidade:', error);
      throw error;
    }
  }

  async createStory(eventId: string, mediaUri: string, mediaType: 'IMAGE' | 'VIDEO', content?: string): Promise<CommunityStory> {
    try {
      let uploadedMediaUrl: string;

      // Upload media first
      console.log('Uploading media for community story...', mediaType);
      try {
        uploadedMediaUrl = await uploadEventImage(mediaUri);
        console.log('Story media uploaded successfully:', uploadedMediaUrl);
      } catch (uploadError) {
        console.error('Error uploading story media:', uploadError);
        throw new Error('Falha no upload da mídia');
      }

      // Create story with uploaded media URL
      const storyData = {
        mediaUrl: uploadedMediaUrl,
        mediaType,
        content: content || undefined,
      };

      const response = await api.post(`/event-communities/${eventId}/stories`, storyData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao criar story:', error);
      throw error;
    }
  }

  async viewStory(storyId: string): Promise<void> {
    try {
      await api.post(`/event-communities/stories/${storyId}/view`);
    } catch (error) {
      console.error('Erro ao visualizar story:', error);
      throw error;
    }
  }
}

export const eventCommunityService = new EventCommunityService(); 