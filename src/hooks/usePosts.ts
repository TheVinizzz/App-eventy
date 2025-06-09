import { useState, useCallback, useRef, useEffect } from 'react';
import socialService, { Post } from '../services/socialService';

interface UsePostsReturn {
  posts: Post[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  hasMorePosts: boolean;
  error: string | null;
  loadPosts: () => Promise<void>;
  refreshPosts: () => Promise<void>;
  loadMorePosts: () => Promise<void>;
  updatePost: (postId: string, updates: Partial<Post>) => void;
  updatePostLikes: (postId: string, isLiked: boolean, likesCount: number) => void;
  updatePostComments: (postId: string, commentsCount: number) => void;
  addNewPost: (post: Post) => void;
  removePost: (postId: string) => void;
  // Instagram-style like toggle
  togglePostLike: (postId: string) => Promise<void>;
}

const POSTS_PER_PAGE = 20;
const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds like Instagram

export const usePosts = (eventId?: string): UsePostsReturn => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const lastLoadTime = useRef<number>(0);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const silentRefresh = useCallback(async () => {
    try {
      const now = Date.now();
      if (now - lastLoadTime.current < 10000) return; // Prevent too frequent requests
      
      const newPosts = await socialService.getPosts(1, POSTS_PER_PAGE, eventId);
      
      if (Array.isArray(newPosts) && newPosts.length > 0) {
        setPosts(prevPosts => {
          const newPostsFiltered = newPosts.filter(newPost => 
            !prevPosts.find(existingPost => existingPost.id === newPost.id)
          );
          
          if (newPostsFiltered.length > 0) {
            return [...newPostsFiltered, ...prevPosts];
          }
          
          // Update existing posts with fresh data
          return prevPosts.map(existingPost => {
            const updatedPost = newPosts.find(p => p.id === existingPost.id);
            return updatedPost || existingPost;
          });
        });
      }
      
      lastLoadTime.current = now;
    } catch (error) {
      console.log('Silent refresh failed:', error);
    }
  }, [eventId]);

  // Desativar auto-refresh temporariamente para evitar piscamento
  // useEffect(() => {
  //   const startAutoRefresh = () => {
  //     refreshTimeoutRef.current = setTimeout(() => {
  //       if (!loading && !refreshing) {
  //         silentRefresh();
  //       }
  //       startAutoRefresh();
  //     }, AUTO_REFRESH_INTERVAL);
  //   };

  //   startAutoRefresh();

  //   return () => {
  //     if (refreshTimeoutRef.current) {
  //       clearTimeout(refreshTimeoutRef.current);
  //     }
  //   };
  // }, [loading, refreshing, silentRefresh]);

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const newPosts = await socialService.getPosts(1, POSTS_PER_PAGE, eventId);
      
      setPosts(Array.isArray(newPosts) ? newPosts : []);
      setCurrentPage(1);
      setHasMorePosts(Array.isArray(newPosts) && newPosts.length === POSTS_PER_PAGE);
      lastLoadTime.current = Date.now();
    } catch (error) {
      console.error('Error loading posts:', error);
      setError('Erro ao carregar posts');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const refreshPosts = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      const newPosts = await socialService.getPosts(1, POSTS_PER_PAGE, eventId);
      
      setPosts(Array.isArray(newPosts) ? newPosts : []);
      setCurrentPage(1);
      setHasMorePosts(Array.isArray(newPosts) && newPosts.length === POSTS_PER_PAGE);
      lastLoadTime.current = Date.now();
      
      // Haptic feedback for successful refresh
      try {
        const { Haptics } = require('expo-haptics');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        // Haptics not available
      }
    } catch (error) {
      console.error('Error refreshing posts:', error);
      setError('Erro ao atualizar posts');
    } finally {
      setRefreshing(false);
    }
  }, [eventId]);

  const loadMorePosts = useCallback(async () => {
    if (loadingMore || !hasMorePosts) return;

    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      const newPosts = await socialService.getPosts(nextPage, POSTS_PER_PAGE, eventId);
      
      if (Array.isArray(newPosts) && newPosts.length > 0) {
        setPosts(prevPosts => {
          const existingIds = new Set(prevPosts.map(post => post.id));
          const uniqueNewPosts = newPosts.filter(post => !existingIds.has(post.id));
          return [...prevPosts, ...uniqueNewPosts];
        });
        setCurrentPage(nextPage);
        setHasMorePosts(newPosts.length === POSTS_PER_PAGE);
      } else {
        setHasMorePosts(false);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
      // Don't show error for pagination failures
    } finally {
      setLoadingMore(false);
    }
  }, [currentPage, hasMorePosts, loadingMore, eventId]);

  const updatePost = useCallback((postId: string, updates: Partial<Post>) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId ? { ...post, ...updates } : post
      )
    );
  }, []);

  const updatePostLikes = useCallback((postId: string, isLiked: boolean, likesCount: number) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              isLiked,
              _count: { ...post._count, likes: likesCount }
            } 
          : post
      )
    );
  }, []);

  const updatePostComments = useCallback((postId: string, commentsCount: number) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              _count: { ...post._count, comments: commentsCount }
            } 
          : post
      )
    );
  }, []);

  const addNewPost = useCallback((post: Post) => {
    setPosts(prevPosts => [post, ...prevPosts]);
  }, []);

  const removePost = useCallback((postId: string) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
  }, []);

  const togglePostLike = useCallback(async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    // Instagram-style: immediate optimistic update
    const newIsLiked = !post.isLiked;
    const newLikesCount = newIsLiked ? post._count.likes + 1 : Math.max(0, post._count.likes - 1);
    
    // Apply optimistic update immediately for instant feedback
    updatePostLikes(postId, newIsLiked, newLikesCount);

    try {
      // Try the enhanced toggle method first
      let result;
      try {
        result = await socialService.toggleLike(postId, post.isLiked, post._count.likes);
      } catch (toggleError) {
        // Fallback to simple like method
        result = await socialService.likePostSimple(postId, newIsLiked);
      }
      
      // Validate the result and update with server response
      if (typeof result.isLiked === 'boolean' && typeof result.likesCount === 'number' && result.likesCount >= 0) {
        updatePostLikes(postId, result.isLiked, result.likesCount);
      }
      // If server response is invalid, keep the optimistic update
    } catch (error: any) {
      // Only revert if it's a network error to maintain smooth UX
      if (error?.message?.includes('Network')) {
        updatePostLikes(postId, post.isLiked, post._count.likes);
      }
      // For other errors, keep optimistic update to avoid UI glitches
    }
  }, [posts, updatePostLikes]);

  return {
    posts,
    loading,
    refreshing,
    loadingMore,
    hasMorePosts,
    error,
    loadPosts,
    refreshPosts,
    loadMorePosts,
    updatePost,
    updatePostLikes,
    updatePostComments,
    addNewPost,
    removePost,
    togglePostLike,
  };
}; 