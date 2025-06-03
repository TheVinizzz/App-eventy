import api from './api';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  bio?: string;
  instagram?: string;
  tiktok?: string;
  facebook?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  eventsCount: number;
  isFollowing: boolean;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPost {
  id: string;
  content: string;
  imageUrl?: string;
  eventId?: string;
  authorId: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    profileImage?: string;
  };
  event?: {
    id: string;
    title: string;
    imageUrl?: string;
  };
}

export interface UserEvent {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  date: string;
  venue: {
    id: string;
    name: string;
    address: string;
  };
  type: 'attended' | 'created';
  status: 'upcoming' | 'past';
}

export interface Post {
  id: string;
  content: string;
  imageUrl?: string;
  eventId?: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    profileImage?: string;
  };
  event?: {
    id: string;
    title: string;
  };
  _count: {
    likes: number;
    comments: number;
  };
  isLiked: boolean;
}

export interface Story {
  id: string;
  author: {
    id: string;
    name: string;
    profileImage?: string;
  };
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  textOverlay?: string;
  textColor?: string;
  textSize?: number;
  textPosition?: { x: number; y: number };
  backgroundColor?: string;
  createdAt: string;
  expiresAt: string;
  viewed: boolean;
  _count: {
    views: number;
  };
}

export interface CreatePostData {
  content: string;
  imageUrl?: string;
  eventId?: string;
}

export interface CreateStoryData {
  mediaUrl: string;
  mediaType: 'image' | 'video';
  textOverlay?: string;
  textColor?: string;
  textSize?: number;
  textPosition?: { x: number; y: number };
  backgroundColor?: string;
}

export interface FollowResponse {
  isFollowing: boolean;
  followersCount: number;
}

class SocialService {
  // User Profile
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const response = await api.get(`/users/${userId}/profile`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const response = await api.patch('/users/profile', updates);
      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Follow System
  async followUser(userId: string): Promise<FollowResponse> {
    try {
      const response = await api.post(`/social/follow/${userId}`);
      return {
        isFollowing: response.data.isFollowing,
        followersCount: response.data.followersCount,
      };
    } catch (error) {
      console.error('Error following user:', error);
      return {
        isFollowing: false,
        followersCount: 0,
      };
    }
  }

  async unfollowUser(userId: string): Promise<FollowResponse> {
    try {
      const response = await api.delete(`/social/follow/${userId}`);
      return {
        isFollowing: response.data.isFollowing,
        followersCount: response.data.followersCount,
      };
    } catch (error) {
      console.error('Error unfollowing user:', error);
      return {
        isFollowing: true,
        followersCount: 0,
      };
    }
  }

  async isFollowing(userId: string): Promise<{ isFollowing: boolean }> {
    try {
      const response = await api.get(`/social/follow/${userId}/is-following`);
      return response.data;
    } catch (error) {
      console.error('Error checking follow status:', error);
      throw error;
    }
  }

  // Posts
  async getPosts(page: number = 1, limit: number = 20, eventId?: string): Promise<Post[]> {
    try {
      const params: any = { page, limit };
      if (eventId) params.eventId = eventId;
      
      const response = await api.get('/social/posts', { params });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching posts:', error);
      return [];
    }
  }

  async getUserPosts(userId: string, page: number = 1, limit: number = 20): Promise<{
    posts: UserPost[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const response = await api.get(`/social/posts/user/${userId}`, {
        params: { page, limit }
      });
      

      
      // Handle direct array response or object with posts property
      let posts: any[] = [];
      let total = 0;
      let hasMore = false;
      
      if (Array.isArray(response.data)) {
        posts = response.data;
        total = posts.length;
        hasMore = posts.length === limit;
      } else if (response.data?.posts) {
        posts = response.data.posts;
        total = response.data.total || 0;
        hasMore = response.data.hasMore || false;
      }
      
      return {
        posts: posts.map((post: any) => ({
          id: post.id,
          content: post.content,
          imageUrl: post.imageUrl,
          eventId: post.eventId,
          authorId: post.authorId,
          likesCount: post._count?.likes || post.likesCount || 0,
          commentsCount: post._count?.comments || post.commentsCount || 0,
          isLiked: post.isLiked || false,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          author: post.author,
          event: post.event,
        })),
        total,
        hasMore,
      };
    } catch (error) {
      console.error('Error fetching user posts:', error);
      return {
        posts: [],
        total: 0,
        hasMore: false,
      };
    }
  }

  async createPost(data: CreatePostData): Promise<Post> {
    try {
      const response = await api.post('/social/posts', data);
      return response.data;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  async deletePost(postId: string): Promise<void> {
    try {
      await api.delete(`/social/posts/${postId}`);
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }

  async getPost(postId: string): Promise<Post> {
    try {
      const response = await api.get(`/social/posts/${postId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching post:', error);
      throw error;
    }
  }

  async likePost(postId: string): Promise<{ isLiked: boolean; likesCount: number }> {
    try {
      const response = await api.post(`/social/posts/${postId}/like`);
      
      return {
        isLiked: response.data.isLiked || response.data.liked || false,
        likesCount: response.data.likesCount || response.data.likes_count || response.data.count || 0
      };
    } catch (error) {
      console.error('Error liking post:', error);
      throw new Error('Failed to like post');
    }
  }

  // Enhanced simple like method for better compatibility
  async likePostSimple(postId: string, shouldLike: boolean): Promise<{ isLiked: boolean; likesCount: number }> {
    try {
      // Use different endpoints if available
      const endpoint = shouldLike 
        ? `/social/posts/${postId}/like`
        : `/social/posts/${postId}/unlike`;
      
      let response;
      try {
        response = await api.post(endpoint);
      } catch (endpointError) {
        // Fallback to toggle endpoint
        response = await api.post(`/social/posts/${postId}/like`);
      }
      
      // Extract data with multiple fallbacks
      const data = response.data || {};
      
      let isLiked = shouldLike; // Default to intended state
      let likesCount = 0;
      
      // Try to get isLiked status
      if (typeof data.isLiked === 'boolean') {
        isLiked = data.isLiked;
      } else if (typeof data.liked === 'boolean') {
        isLiked = data.liked;
      } else if (typeof data.is_liked === 'boolean') {
        isLiked = data.is_liked;
      }
      
      // Try to get likes count
      if (typeof data.likesCount === 'number') {
        likesCount = data.likesCount;
      } else if (typeof data.likes_count === 'number') {
        likesCount = data.likes_count;
      } else if (typeof data.count === 'number') {
        likesCount = data.count;
      } else if (typeof data.likes === 'number') {
        likesCount = data.likes;
      }
      
      return { isLiked, likesCount };
    } catch (error: any) {
      console.error('Error updating like status:', error);
      throw new Error('Failed to update like status');
    }
  }

  // Instagram-style optimistic like toggle - PRODUCTION VERSION
  async toggleLike(postId: string, currentIsLiked: boolean, currentLikesCount: number): Promise<{ isLiked: boolean; likesCount: number }> {
    try {
      const response = await api.post(`/social/posts/${postId}/like`);
      
      // Handle different response formats from backend
      let isLiked = false;
      let likesCount = currentLikesCount; // Default to current count
      
      if (response.data) {
        // Parse isLiked status
        if (response.data.hasOwnProperty('isLiked')) {
          isLiked = Boolean(response.data.isLiked);
        } else if (response.data.hasOwnProperty('liked')) {
          isLiked = Boolean(response.data.liked);
        } else if (response.data.hasOwnProperty('is_liked')) {
          isLiked = Boolean(response.data.is_liked);
        } else {
          // Fallback: assume it's the opposite of current state
          isLiked = !currentIsLiked;
        }
        
        // Parse likes count
        if (response.data.hasOwnProperty('likesCount')) {
          likesCount = Number(response.data.likesCount) || 0;
        } else if (response.data.hasOwnProperty('likes_count')) {
          likesCount = Number(response.data.likes_count) || 0;
        } else if (response.data.hasOwnProperty('count')) {
          likesCount = Number(response.data.count) || 0;
        } else if (response.data.hasOwnProperty('likes')) {
          likesCount = Number(response.data.likes) || 0;
        } else {
          // Fallback: calculate based on toggle
          likesCount = isLiked 
            ? currentLikesCount + 1 
            : Math.max(0, currentLikesCount - 1);
        }
      } else {
        // No response data - use optimistic calculation
        isLiked = !currentIsLiked;
        likesCount = isLiked 
          ? currentLikesCount + 1 
          : Math.max(0, currentLikesCount - 1);
      }
      
      return { isLiked, likesCount };
    } catch (error: any) {
      console.error('Error toggling like:', error);
      
      // If network error, throw to trigger optimistic revert
      if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network')) {
        throw new Error('Network error');
      }
      
      // For other errors, return optimistic result to avoid UI glitches
      const optimisticIsLiked = !currentIsLiked;
      const optimisticLikesCount = optimisticIsLiked 
        ? currentLikesCount + 1 
        : Math.max(0, currentLikesCount - 1);
      
      return {
        isLiked: optimisticIsLiked,
        likesCount: optimisticLikesCount
      };
    }
  }

  // Comments
  async getPostComments(postId: string): Promise<any[]> {
    try {
      const response = await api.get(`/social/posts/${postId}/comments`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  }

  async addComment(postId: string, content: string): Promise<any> {
    try {
      const response = await api.post(`/social/posts/${postId}/comments`, { content });
      return response.data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  async likeComment(commentId: string): Promise<{ isLiked: boolean; likesCount: number }> {
    try {
      const response = await api.post(`/social/posts/comments/${commentId}/like`);
      return response.data;
    } catch (error) {
      console.error('Error liking comment:', error);
      throw error;
    }
  }

  // Enhanced Reports with better error handling
  async reportPost(postId: string, reason: string, details?: string): Promise<{ success: boolean; message?: string }> {
    try {
      const payload: any = { reason };
      if (details) payload.details = details;
      
      const response = await api.post(`/social/posts/${postId}/report`, payload);
      
      return {
        success: true,
        message: response.data?.message || 'Denúncia enviada com sucesso'
      };
    } catch (error: any) {
      console.error('Error reporting post:', error);
      
      // Handle specific error cases
      if (error.response?.status === 409) {
        throw new Error('Você já denunciou este post anteriormente');
      } else if (error.response?.status === 404) {
        throw new Error('Post não encontrado');
      } else if (error.response?.status === 400) {
        throw new Error('Dados inválidos para a denúncia');
      } else if (error.response?.status === 403) {
        throw new Error('Você não tem permissão para denunciar este post');
      }
      
      throw new Error('Erro ao enviar denúncia. Tente novamente.');
    }
  }

  // Stories
  async getStories(page: number = 1, limit: number = 20): Promise<Story[]> {
    try {
      const response = await api.get('/social/stories', {
        params: { page, limit }
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching stories:', error);
      return [];
    }
  }

  async createStory(data: CreateStoryData): Promise<Story> {
    try {
      const response = await api.post('/social/stories', data);
      return response.data;
    } catch (error) {
      console.error('Error creating story:', error);
      throw error;
    }
  }

  async viewStory(storyId: string): Promise<void> {
    try {
      await api.post(`/social/stories/${storyId}/view`);
    } catch (error) {
      console.error('Error viewing story:', error);
      throw error;
    }
  }

  async deleteStory(storyId: string): Promise<void> {
    try {
      await api.delete(`/social/stories/${storyId}`);
    } catch (error) {
      console.error('Error deleting story:', error);
      throw error;
    }
  }

  // Events
  async getUserEvents(userId: string, type?: 'attended' | 'created', page: number = 1, limit: number = 20): Promise<{
    events: UserEvent[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const params: any = { page, limit };
      if (type) params.type = type;
      
      const response = await api.get(`/users/${userId}/events`, { params });
      return {
        events: Array.isArray(response.data?.events) ? response.data.events : [],
        total: response.data?.total || 0,
        hasMore: response.data?.hasMore || false,
      };
    } catch (error) {
      console.error('Error fetching user events:', error);
      return {
        events: [],
        total: 0,
        hasMore: false,
      };
    }
  }

  // Search
  async searchUsers(query: string, page: number = 1, limit: number = 20): Promise<{
    users: UserProfile[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const response = await api.get('/users/search', {
        params: { q: query, page, limit }
      });
      return {
        users: Array.isArray(response.data?.users) ? response.data.users : [],
        total: response.data?.total || 0,
        hasMore: response.data?.hasMore || false,
      };
    } catch (error) {
      console.error('Error searching users:', error);
      return {
        users: [],
        total: 0,
        hasMore: false,
      };
    }
  }

  // Feed
  async getFeed(page: number = 1, limit: number = 20): Promise<any[]> {
    try {
      const response = await api.get('/social/feed', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching feed:', error);
      throw error;
    }
  }
}

const socialService = new SocialService();
export default socialService; 