import AsyncStorage from '@react-native-async-storage/async-storage';
import { Event } from './eventsService';

const FAVORITES_KEY = '@eventy_favorites';

export interface FavoriteEvent {
  id: string;
  title: string;
  eventDate: string;
  location: string;
  imageUrl?: string;
  price: number;
  isActive: boolean;
  favoriteDate: string; // Data quando foi favoritado
  category?: string;
  organizer?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

class FavoritesService {
  /**
   * Adiciona um evento aos favoritos
   */
  async addToFavorites(event: Event): Promise<boolean> {
    try {
      console.log('📌 FavoritesService: Adding event to favorites:', event.id);
      
      const favorites = await this.getFavorites();
      
      // Verificar se já está nos favoritos
      if (favorites.some(fav => fav.id === event.id)) {
        console.log('⚠️ FavoritesService: Event already in favorites');
        return false;
      }

      // Converter Event para FavoriteEvent
      const favoriteEvent: FavoriteEvent = {
        id: event.id,
        title: event.title,
        eventDate: event.date,
        location: event.location,
        imageUrl: event.imageUrl,
        price: event.lowestPrice || 0,
        isActive: event.published !== false,
        favoriteDate: new Date().toISOString(),
        category: event.type,
        organizer: event.createdById ? {
          id: event.createdById,
          name: 'Organizador', // Nome padrão, pode ser melhorado no futuro
          avatar: undefined,
        } : undefined,
      };

      favorites.unshift(favoriteEvent); // Adicionar no início da lista
      
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      
      console.log('✅ FavoritesService: Event added to favorites successfully');
      return true;
    } catch (error) {
      console.error('❌ FavoritesService: Error adding to favorites:', error);
      throw new Error('Erro ao adicionar aos favoritos');
    }
  }

  /**
   * Remove um evento dos favoritos
   */
  async removeFromFavorites(eventId: string): Promise<boolean> {
    try {
      console.log('🗑️ FavoritesService: Removing event from favorites:', eventId);
      
      const favorites = await this.getFavorites();
      const filteredFavorites = favorites.filter(fav => fav.id !== eventId);
      
      if (filteredFavorites.length === favorites.length) {
        console.log('⚠️ FavoritesService: Event not found in favorites');
        return false;
      }

      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(filteredFavorites));
      
      console.log('✅ FavoritesService: Event removed from favorites successfully');
      return true;
    } catch (error) {
      console.error('❌ FavoritesService: Error removing from favorites:', error);
      throw new Error('Erro ao remover dos favoritos');
    }
  }

  /**
   * Verifica se um evento está nos favoritos
   */
  async isFavorite(eventId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      return favorites.some(fav => fav.id === eventId);
    } catch (error) {
      console.error('❌ FavoritesService: Error checking favorite status:', error);
      return false;
    }
  }

  /**
   * Alterna o status de favorito de um evento
   */
  async toggleFavorite(event: Event): Promise<{ isFavorite: boolean; action: 'added' | 'removed' }> {
    try {
      const isCurrentlyFavorite = await this.isFavorite(event.id);
      
      if (isCurrentlyFavorite) {
        await this.removeFromFavorites(event.id);
        return { isFavorite: false, action: 'removed' };
      } else {
        await this.addToFavorites(event);
        return { isFavorite: true, action: 'added' };
      }
    } catch (error) {
      console.error('❌ FavoritesService: Error toggling favorite:', error);
      throw error;
    }
  }

  /**
   * Obtém todos os eventos favoritos
   */
  async getFavorites(): Promise<FavoriteEvent[]> {
    try {
      const favoritesData = await AsyncStorage.getItem(FAVORITES_KEY);
      
      if (!favoritesData) {
        return [];
      }

      const favorites: FavoriteEvent[] = JSON.parse(favoritesData);
      
      // Ordenar por data de favoritado (mais recentes primeiro)
      return favorites.sort((a, b) => 
        new Date(b.favoriteDate).getTime() - new Date(a.favoriteDate).getTime()
      );
    } catch (error) {
      console.error('❌ FavoritesService: Error getting favorites:', error);
      return [];
    }
  }

  /**
   * Obtém apenas favoritos ativos (eventos que ainda não aconteceram)
   */
  async getActiveFavorites(): Promise<FavoriteEvent[]> {
    try {
      const favorites = await this.getFavorites();
      const now = new Date();
      
      return favorites.filter(favorite => {
        const eventDate = new Date(favorite.eventDate);
        return eventDate > now && favorite.isActive;
      });
    } catch (error) {
      console.error('❌ FavoritesService: Error getting active favorites:', error);
      return [];
    }
  }

  /**
   * Obtém favoritos por categoria
   */
  async getFavoritesByCategory(category: string): Promise<FavoriteEvent[]> {
    try {
      const favorites = await this.getFavorites();
      return favorites.filter(favorite => 
        favorite.category?.toLowerCase() === category.toLowerCase()
      );
    } catch (error) {
      console.error('❌ FavoritesService: Error getting favorites by category:', error);
      return [];
    }
  }

  /**
   * Obtém estatísticas dos favoritos
   */
  async getFavoritesStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    byCategory: { [category: string]: number };
  }> {
    try {
      const favorites = await this.getFavorites();
      const now = new Date();
      
      let active = 0;
      let expired = 0;
      const byCategory: { [category: string]: number } = {};

      favorites.forEach(favorite => {
        const eventDate = new Date(favorite.eventDate);
        
        if (eventDate > now && favorite.isActive) {
          active++;
        } else {
          expired++;
        }

        if (favorite.category) {
          byCategory[favorite.category] = (byCategory[favorite.category] || 0) + 1;
        }
      });

      return {
        total: favorites.length,
        active,
        expired,
        byCategory,
      };
    } catch (error) {
      console.error('❌ FavoritesService: Error getting favorites stats:', error);
      return {
        total: 0,
        active: 0,
        expired: 0,
        byCategory: {},
      };
    }
  }

  /**
   * Limpa favoritos expirados
   */
  async cleanupExpiredFavorites(): Promise<number> {
    try {
      console.log('🧹 FavoritesService: Cleaning up expired favorites...');
      
      const favorites = await this.getFavorites();
      const now = new Date();
      
      const activeFavorites = favorites.filter(favorite => {
        const eventDate = new Date(favorite.eventDate);
        return eventDate > now || favorite.isActive;
      });

      const removedCount = favorites.length - activeFavorites.length;
      
      if (removedCount > 0) {
        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(activeFavorites));
        console.log(`✅ FavoritesService: Removed ${removedCount} expired favorites`);
      }

      return removedCount;
    } catch (error) {
      console.error('❌ FavoritesService: Error cleaning up favorites:', error);
      return 0;
    }
  }

  /**
   * Limpa todos os favoritos
   */
  async clearAllFavorites(): Promise<void> {
    try {
      console.log('🗑️ FavoritesService: Clearing all favorites...');
      await AsyncStorage.removeItem(FAVORITES_KEY);
      console.log('✅ FavoritesService: All favorites cleared');
    } catch (error) {
      console.error('❌ FavoritesService: Error clearing favorites:', error);
      throw new Error('Erro ao limpar favoritos');
    }
  }

  /**
   * Busca favoritos por termo
   */
  async searchFavorites(query: string): Promise<FavoriteEvent[]> {
    try {
      const favorites = await this.getFavorites();
      const searchTerm = query.toLowerCase().trim();
      
      if (!searchTerm) {
        return favorites;
      }

      return favorites.filter(favorite => 
        favorite.title.toLowerCase().includes(searchTerm) ||
        favorite.location.toLowerCase().includes(searchTerm) ||
        favorite.category?.toLowerCase().includes(searchTerm) ||
        favorite.organizer?.name.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.error('❌ FavoritesService: Error searching favorites:', error);
      return [];
    }
  }

  /**
   * Exporta favoritos (para backup)
   */
  async exportFavorites(): Promise<string> {
    try {
      const favorites = await this.getFavorites();
      return JSON.stringify(favorites, null, 2);
    } catch (error) {
      console.error('❌ FavoritesService: Error exporting favorites:', error);
      throw new Error('Erro ao exportar favoritos');
    }
  }

  /**
   * Importa favoritos (de backup)
   */
  async importFavorites(favoritesData: string): Promise<number> {
    try {
      const importedFavorites: FavoriteEvent[] = JSON.parse(favoritesData);
      const currentFavorites = await this.getFavorites();
      
      // Merge sem duplicatas
      const mergedFavorites = [...currentFavorites];
      let addedCount = 0;

      importedFavorites.forEach(imported => {
        if (!mergedFavorites.some(current => current.id === imported.id)) {
          mergedFavorites.push(imported);
          addedCount++;
        }
      });

      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(mergedFavorites));
      
      console.log(`✅ FavoritesService: Imported ${addedCount} new favorites`);
      return addedCount;
    } catch (error) {
      console.error('❌ FavoritesService: Error importing favorites:', error);
      throw new Error('Erro ao importar favoritos');
    }
  }
}

// Instância singleton
export const favoritesService = new FavoritesService();
export default favoritesService; 