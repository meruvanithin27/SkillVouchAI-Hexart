import { API } from './axiosService';
import { User, Skill, QuizQuestion } from '../types';
import { transformUserData } from './transformUserData';

// Helper to simulate delay for "real" feel (reduced for better performance)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Safe UUID generator that works even if crypto.randomUUID is not available
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
    return (crypto as any).randomUUID();
  }

  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const bytes = new Uint8Array(16);
    (crypto as any).getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0'));
    return `${hex.slice(0,4).join('')}-${hex.slice(4,6).join('')}-${hex.slice(6,8).join('')}-${hex.slice(8,10).join('')}-${hex.slice(10,16).join('')}`;
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Session storage for current user
const SESSION_KEY = 'skillvouch_session';

export const apiService = {

  // --- SESSION ---
  getCurrentSession: (): User | null => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  },

  setSession: (user: User) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  },

  logout: async () => {
    await delay(50); // Reduced from 300ms
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('authToken');
  },

  // --- USER MGMT ---
  getUsers: async (): Promise<User[]> => {
    await delay(50); // Reduced from 300ms
    try {
      const response = await API.get('/api/users');
      const data = response.data;
      
      // Ensure we return an array
      if (Array.isArray(data)) {
        return data;
      } else if (data && Array.isArray(data.data)) {
        return data.data;
      } else {
        console.warn('getUsers: Unexpected response format, returning empty array');
        return [];
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      return [];
    }
  },

  getUserById: async (id: string): Promise<User | undefined> => {
    try {
      const response = await API.get(`/api/users/${id}`);
      return response.data;
    } catch {
      return undefined;
    }
  },

  saveUser: async (user: User) => {
    try {
      console.log('💾 Saving user to backend:', user.id, user.email);
      
      // No delay for save operations to make them feel instant
      const response = await API.put(`/api/users/${user.id}`, user);
      
      console.log(' User saved successfully:', response.data);
      
      // Update session if it's the current user
      const session = apiService.getCurrentSession();
      if (session && session.id === user.id) {
        apiService.setSession(user);
        console.log(' Session updated with new user data');
      }
      
      return response.data;
    } catch (error: any) {
      console.error(' Failed to save user:', error);
      console.error('Error details:', error.response?.data);
      
      // Don't throw the error to prevent breaking the UI
      // Instead, just log it and continue with local state update
      if (error.response?.status === 404) {
        console.warn(' User not found on backend, but local state updated');
      } else if (error.response?.status === 403) {
        console.warn(' Authentication failed, but local state updated');
      } else {
        console.warn(' Backend save failed, but local state updated');
        console.warn('⚠️ Backend save failed, but local state updated');
      }
      
      throw error; // Re-throw so the calling function can handle it
    }
  },

  // --- SKILL MANAGEMENT - Production Ready ---
  addKnownSkill: async (skillName: string, level: string = 'Beginner') => {
    const response = await API.post('/api/skills/known', { skillName, level });
    return transformUserData(response.data.data.user);
  },

  addSkillToLearn: async (skillName: string, priority: string = 'Medium') => {
    const response = await API.post('/api/skills/learn', { skillName, priority });
    return transformUserData(response.data.data.user);
  },

  removeKnownSkill: async (skillName: string) => {
    const response = await API.delete(`/api/skills/known/${encodeURIComponent(skillName)}`);
    return transformUserData(response.data.data.user);
  },

  removeSkillToLearn: async (skillName: string) => {
    const response = await API.delete(`/api/skills/learn/${encodeURIComponent(skillName)}`);
    return transformUserData(response.data.data.user);
  },

  // Enhanced profile fetch
  getProfile: async (): Promise<User> => {
    const response = await API.get('/api/user/profile');
    return transformUserData(response.data.data.user);
  },

  // --- QUIZ RESULTS ---
  saveQuizResult: async (skillName: string, score: number, questions: any[], level?: string) => {
    const response = await API.post('/api/quiz/result', { skillName, score, questions, level });
    return response.data.data;
  },

  getQuizResults: async () => {
    try {
      const response = await API.get('/api/quiz/results');
      return response.data?.data?.results || [];
    } catch (error) {
      console.error('Failed to fetch quiz results:', error);
      return [];
    }
  },

  // --- PROFILE ---

  // --- AUTH ---
  login: async (email: string, password: string): Promise<User> => {
    console.log('🔐 Frontend login attempt for:', email);
    
    try {
      const response = await API.post('/api/auth/login', { 
        email: email.trim(), 
        password 
      });
      
      const { user, token } = response.data;
      
      // Store token
      localStorage.setItem('authToken', token);
      apiService.setSession(user);
      
      console.log('✅ Frontend login successful for:', email);
      return user;
      
    } catch (error: any) {
      console.error('❌ Frontend login error:', error);
      const message = error.response?.data?.message || 'Login failed';
      throw new Error(message);
    }
  },

  signup: async (name: string, email: string, password: string): Promise<User> => {
    console.log('🚀 Frontend signup attempt for:', email);
    
    try {
      const response = await API.post('/api/auth/signup', {
        name: name.trim(),
        email: email.trim(),
        password
      });
      
      const { user, token } = response.data;
      
      // Store token
      localStorage.setItem('authToken', token);
      
      console.log('✅ Frontend signup successful for:', email);
      return user;
      
    } catch (error: any) {
      console.error('❌ Frontend signup error:', error);
      const message = error.response?.data?.message || 'Signup failed';
      throw new Error(message);
    }
  },

  googleLogin: async (): Promise<User> => {
    await delay(800);
    // Simulate Google Login
    const mockUser: User = {
        id: 'google_' + Date.now(),
        name: 'Google User',
        email: `google_${Date.now()}@example.com`,
        password: '',
        avatar: `https://ui-avatars.com/api/?background=random&name=Google+User`,
        bio: 'Signed in via Google',
        skillsKnown: [],
        skillsToLearn: [],
        rating: 5
    };
    await apiService.saveUser(mockUser);
    return mockUser;
  },

  // --- REQUESTS ---
  createExchangeRequest: async (request: ExchangeRequest) => {
    await delay(50); // Reduced from 300ms
    const response = await API.post('/api/requests', request);
    return response.data;
  },

  getRequestsForUser: async (userId: string): Promise<ExchangeRequest[]> => {
    await delay(50); // Reduced from 300ms
    try {
      const response = await API.get(`/api/requests?userId=${userId}`);
      const data = response.data;
      
      // Ensure we return an array
      if (Array.isArray(data)) {
        return data;
      } else if (data && Array.isArray(data.data)) {
        return data.data;
      } else {
        console.warn('getRequestsForUser: Unexpected response format, returning empty array');
        return [];
      }
    } catch (error) {
      console.error('Failed to fetch requests for user:', error);
      return [];
    }
  },

  updateExchangeRequestStatus: async (id: string, status: ExchangeRequest['status']): Promise<{ success: true; status: ExchangeRequest['status']; completedAt?: number; }> => {
    const response = await API.put(`/api/requests/${id}/status`, { status });
    return response.data;
  },

  // --- FEEDBACK ---
  submitExchangeFeedback: async (feedback: Omit<ExchangeFeedback, 'id' | 'createdAt'> & Partial<Pick<ExchangeFeedback, 'id' | 'createdAt'>>): Promise<ExchangeFeedback> => {
    const response = await API.post('/api/feedback', feedback);
    return response.data;
  },

  getReceivedFeedback: async (userId: string): Promise<ExchangeFeedback[]> => {
    try {
      const response = await API.get(`/api/feedback/received?userId=${userId}`);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch received feedback:', error);
      return [];
    }
  },

  getFeedbackStats: async (userId: string): Promise<{ avgStars: number; count: number }> => {
    const response = await API.get(`/api/feedback/stats?userId=${userId}`);
    return response.data;
  },

  // --- MESSAGING ---
  sendMessage: async (senderId: string, receiverId: string, content: string): Promise<Message> => {
    // No delay for instant messaging
    const response = await API.post('/api/messages', { senderId, receiverId, content });
    return response.data;
  },

  getUnreadCount: async (userId: string): Promise<number> => {
    const response = await API.get(`/api/messages/unread-count?userId=${userId}`);
    const result = response.data;
    return result.count || 0;
  },

  markAsRead: async (userId: string, senderId: string) => {
    const response = await API.post('/api/messages/mark-as-read', { userId, senderId });
    return response.data;
  },

  getConversation: async (user1Id: string, user2Id: string): Promise<Message[]> => {
    try {
      const response = await API.get(`/api/messages/conversation?user1Id=${user1Id}&user2Id=${user2Id}`);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch conversation:', error);
      return [];
    }
  },

  subscribeToConversation: (user1Id: string, user2Id: string, callback: (messages: Message[]) => void) => {
    const checkMessages = async () => {
        try {
            const conversation = await apiService.getConversation(user1Id, user2Id);
            callback(conversation);
        } catch (error) {
            console.error('Error fetching conversation:', error);
        }
    };

    checkMessages(); // Initial
    const interval = setInterval(checkMessages, 1000); // Polling every 1s for "real-time" feel
    return () => clearInterval(interval);
  },

  getConversations: async (): Promise<User[]> => {
    await delay(50); // Reduced from 300ms
    try {
      const response = await API.get('/api/messages/conversations');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      return [];
    }
  },

  // --- QUIZ ---
  generateQuiz: async (skill: string, difficulty: string) => {
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        console.log(`Attempt ${retryCount + 1}: Generating quiz for ${skill} (${difficulty})`);
        
        const response = await API.post('/api/quiz/generate', { skill, difficulty });
        
        const data = response.data;
        console.log('Quiz generated successfully:', data);
        return data;
        
      } catch (error: any) {
        console.error(`Quiz generation error (attempt ${retryCount + 1}):`, error);
        
        if (retryCount === maxRetries - 1) {
          throw new Error('Failed to generate quiz. Please try again.');
        }
        
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }
    
    throw new Error('Failed to generate quiz after multiple attempts');
  },

  // --- SKILL SUGGESTION ---
  suggestSkills: async (currentSkills: string[], currentGoals: string[] = []) => {
    try {
      const response = await API.post('/api/skills/suggest', { currentSkills, currentGoals });
      return response.data;
    } catch (error) {
      console.error('Skill suggestion failed:', error);
      throw new Error('Failed to suggest skills');
    }
  },

  // --- ROADMAP GENERATION ---
  generateRoadmap: async (skill: string) => {
    try {
      const response = await API.post('/api/roadmap/generate', { skill });
      return response.data;
    } catch (error) {
      console.error('Roadmap generation failed:', error);
      throw new Error('Failed to generate roadmap');
    }
  },
};
