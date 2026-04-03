import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Song, UserPlaylist, User, Friend, ChatMessage, PartySession, Artist, SearchResult } from '../types';
import { authService } from '../services/auth';
import { downloadSongWithProgress, OfflineStorage, api } from '../services/api';

interface PlayerState {
  isPlaying: boolean;
  isBuffering: boolean;
  isFullScreen: boolean;
  currentSong: Song | null;
  queue: Song[];
  history: Song[];
  likedSongs: Song[];
  favoriteArtists: Artist[];
  userPlaylists: UserPlaylist[];
  volume: number;
  
  // Shuffle State
  shuffleMode: 'off' | 'on' | 'smart';
  isVideoMode: boolean;
  
  streamingQuality: 'low' | 'normal' | 'high';
  themeColor: string;
  
  // Search History
  recentSearches: (SearchResult | string)[];

  // Audio Engine State
  audioElement: HTMLAudioElement | null;
  duration: number;

  // Offline & Downloads
  isOfflineMode: boolean;
  downloadedSongIds: string[];
  activeDownload: Song | null;
  downloadProgress: number;

  // Auth
  currentUser: User | null;

  // Algorithm & Stats
  playCounts: Record<string, number>;
  artistPlayCounts: Record<string, number>;
  totalListeningSeconds: number;
  weeklyListeningSeconds: number;
  weekStartTime: number;

  // Sleep Timer
  sleepTimerEnd: number | null;

  // Equalizer
  equalizerBass: number;
  equalizerMid: number;
  equalizerTreble: number;

  // App Theme
  appTheme: 'sakura' | 'moonlight' | 'ocean' | 'cherry' | 'midnight';

  // Actions for new features
  recordPlay: (song: Song) => void;
  setSleepTimer: (minutes: number | null) => void;
  setEqualizer: (bass: number, mid: number, treble: number) => void;
  setAppTheme: (theme: 'sakura' | 'moonlight' | 'ocean' | 'cherry' | 'midnight') => void;
  getTopSongs: () => Song[];
  getTopArtistIds: () => string[];

  // Social
  friends: Friend[]; // Unified list
  searchResults: { name: string, email: string, image?: string }[];
  activeChatFriendId: string | null;
  partySession: PartySession | null;
  
  // Realtime Cleanup
  unsubscribers: Function[];

  // Actions
  setAudioElement: (el: HTMLAudioElement) => void;
  setDuration: (duration: number) => void;
  playSong: (song: Song, newQueue?: Song[]) => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setIsBuffering: (isBuffering: boolean) => void;
  setFullScreen: (isFull: boolean) => void;
  nextSong: () => void;
  prevSong: () => void;
  toggleShuffle: () => void;
  toggleVideoMode: () => void;
  addToQueue: (song: Song) => void;
  setQueue: (songs: Song[]) => void;
  setVolume: (val: number) => void;
  addToHistory: (song: Song) => void;
  toggleLike: (song: Song) => void;
  toggleArtistLike: (artist: Artist) => void;
  createPlaylist: (playlist: UserPlaylist) => void;
  importPlaylist: (playlist: UserPlaylist) => void;
  addSongToPlaylist: (playlistId: string, song: Song) => void;
  removePlaylist: (id: string) => void;
  setStreamingQuality: (quality: 'low' | 'normal' | 'high') => void;
  setThemeColor: (color: string) => void;
  startDownload: (song: Song, url: string, filename: string) => Promise<void>;
  
  // Search History Actions
  addRecentSearch: (item: SearchResult | string) => void;
  removeRecentSearch: (id: string) => void;
  clearRecentSearches: () => void;

  // Network Actions
  setOfflineMode: (isOffline: boolean) => void;
  
  // Auth Actions
  loginUser: (user: User & { likedSongs?: Song[], history?: Song[], favoriteArtists?: Artist[], chats?: any }) => void;
  logoutUser: () => void;
  syncUserToCloud: (type?: 'public' | 'private' | 'both') => void;
  updateUserProfile: (name: string, image?: string) => void;
  initRealtimeListeners: () => void;

  // Social Actions
  searchUsers: (query: string) => Promise<void>;
  addContact: (email: string) => Promise<void>;
  refreshFriendsActivity: () => Promise<void>;
  openChat: (friendId: string | null) => void;
  sendMessage: (friendId: string, text: string) => void;
  startParty: () => void;
  stopParty: () => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      isPlaying: false,
      isBuffering: false,
      isFullScreen: false,
      currentSong: null,
      queue: [],
      history: [],
      likedSongs: [],
      favoriteArtists: [],
      userPlaylists: [],
      volume: 1,
      shuffleMode: 'off',
      isVideoMode: false,
      playCounts: {},
      artistPlayCounts: {},
      totalListeningSeconds: 0,
      weeklyListeningSeconds: 0,
      weekStartTime: Date.now(),
      sleepTimerEnd: null,
      equalizerBass: 0,
      equalizerMid: 0,
      equalizerTreble: 0,
      appTheme: 'sakura',
      currentUser: null,
      streamingQuality: 'high',
      themeColor: '#FF6B9D',
      recentSearches: [],
      
      // Audio Engine Initial
      audioElement: null,
      duration: 0,
      
      // Offline State
      isOfflineMode: !navigator.onLine,
      downloadedSongIds: [],
      activeDownload: null,
      downloadProgress: 0,

      // Social Initial State
      friends: [],
      searchResults: [],
      activeChatFriendId: null,
      partySession: null,
      unsubscribers: [],

      setAudioElement: (el) => set({ audioElement: el }),
      setDuration: (duration) => set({ duration }),

      setOfflineMode: (isOffline) => set({ isOfflineMode: isOffline }),

      playSong: (song, newQueue) => {
        const { addToHistory, currentUser, recordPlay } = get();
        recordPlay(song);
        addToHistory(song);
        
        if (currentUser && navigator.onLine) {
            authService.updateUserStatus('listening', song);
        }
        
        set((state) => ({
          currentSong: song,
          isPlaying: true,
          isBuffering: true, 
          queue: newQueue ? newQueue : state.queue,
          isFullScreen: false, 
        }));
      },

      togglePlay: () => {
          const { isPlaying, audioElement } = get();
          const nextState = !isPlaying;
          set({ isPlaying: nextState });

          // Direct Audio Control for responsiveness
          if (audioElement) {
              if (nextState) {
                  audioElement.play().catch(e => {
                      console.error("Play failed", e);
                      set({ isPlaying: false });
                  });
              } else {
                  audioElement.pause();
              }
          }
      },

      seek: (time) => {
          const { audioElement, duration } = get();
          if (!audioElement) return;
          const safeTime = Math.max(0, Math.min(time, duration));
          audioElement.currentTime = safeTime;
      },
      
      setIsPlaying: (isPlaying) => {
          set({ isPlaying });
          const { currentUser, currentSong, isOfflineMode } = get();
          if (currentUser && !isPlaying && !isOfflineMode) {
             authService.updateUserStatus('online', currentSong);
          }
      },

      setIsBuffering: (isBuffering) => set({ isBuffering }),
      setFullScreen: (isFullScreen) => set({ isFullScreen }),

      toggleShuffle: () => {
          const { shuffleMode, currentSong } = get();
          const nextMode = shuffleMode === 'off' ? 'on' : shuffleMode === 'on' ? 'smart' : 'off';
          
          set({ shuffleMode: nextMode });

          // AI Smart Shuffle Logic
          if (nextMode === 'smart' && currentSong) {
              api.getRecommendations(currentSong.id).then(recs => {
                  const { queue } = get();
                  // Ensure we don't add duplicate songs that are already in queue
                  // "selected suggestions mat dena"
                  const currentIds = new Set(queue.map(s => s.id));
                  const uniqueRecs = recs.filter(s => !currentIds.has(s.id));
                  
                  if (uniqueRecs.length > 0) {
                      set({ queue: [...queue, ...uniqueRecs] });
                  }
              }).catch(e => console.error("AI Shuffle Error", e));
          }
      },

      toggleVideoMode: () => set((state) => ({ isVideoMode: !state.isVideoMode })),

      nextSong: () => {
        const { queue, currentSong, shuffleMode } = get();
        if (!currentSong) return;
        
        // Mode: 'off' -> Sequential
        // Mode: 'on' (Standard) -> Random
        // Mode: 'smart' (AI) -> Random/Sequential from enriched queue. 
        // For UI clarity, Smart Shuffle here behaves like Shuffle (Random) but with a bigger pool of AI songs
        
        const currentIndex = queue.findIndex(s => s.id === currentSong.id);
        
        if (shuffleMode !== 'off') {
            // Random Shuffle Logic
            const nextIndex = Math.floor(Math.random() * queue.length);
            // Try to avoid repeating immediate song
            if (queue.length > 1 && queue[nextIndex].id === currentSong.id) {
                // Retry once
                const retryIndex = Math.floor(Math.random() * queue.length);
                get().playSong(queue[retryIndex]);
            } else {
                get().playSong(queue[nextIndex]);
            }
        } else {
            // Sequential
            if (currentIndex + 1 < queue.length) {
                get().playSong(queue[currentIndex + 1]);
            } else {
                set({ isPlaying: false });
            }
        }
      },

      prevSong: () => {
        const { queue, currentSong, audioElement } = get();
        if (!currentSong) return;
        
        // If > 3 seconds in, just restart song
        if (audioElement && audioElement.currentTime > 3) {
            audioElement.currentTime = 0;
            return;
        }

        const currentIndex = queue.findIndex(s => s.id === currentSong.id);
        if (currentIndex - 1 >= 0) get().playSong(queue[currentIndex - 1]);
      },

      addToQueue: (song) => set((state) => ({ queue: [...state.queue, song] })),
      setQueue: (songs) => set({ queue: songs }),
      
      setVolume: (volume) => {
          set({ volume });
          const { audioElement } = get();
          if (audioElement) audioElement.volume = volume;
      },

      setStreamingQuality: (quality) => set({ streamingQuality: quality }),
      setThemeColor: (color) => set({ themeColor: color }),

      addRecentSearch: (item) => set((state) => {
          const newRecent = [item, ...state.recentSearches.filter(i => {
              if (typeof i === 'string' && typeof item === 'string') return i.toLowerCase() !== item.toLowerCase();
              if (typeof i !== 'string' && typeof item !== 'string') return i.id !== item.id;
              // Filter out if types don't match (e.g. replacing a string with an object of same name? unlikely but safe)
              return true;
          })].slice(0, 10);
          return { recentSearches: newRecent };
      }),

      removeRecentSearch: (id) => set((state) => ({
          recentSearches: state.recentSearches.filter(i => {
              if (typeof i === 'string') return i !== id;
              return i.id !== id;
          })
      })),

      clearRecentSearches: () => set({ recentSearches: [] }),

      addToHistory: (song) => {
          set((state) => {
            const newHistory = [song, ...state.history.filter(s => s.id !== song.id)].slice(0, 20);
            if(navigator.onLine) setTimeout(() => get().syncUserToCloud('private'), 1000);
            return { history: newHistory };
          });
      },

      toggleLike: (song) => {
          set((state) => {
            const isLiked = state.likedSongs.some(s => s.id === song.id);
            const newLiked = isLiked ? state.likedSongs.filter(s => s.id !== song.id) : [song, ...state.likedSongs];
            if(navigator.onLine) setTimeout(() => get().syncUserToCloud('private'), 1000);
            return { likedSongs: newLiked };
          });
      },

      toggleArtistLike: (artist) => {
          set((state) => {
              const isLiked = state.favoriteArtists.some(a => a.id === artist.id);
              const newLiked = isLiked 
                  ? state.favoriteArtists.filter(a => a.id !== artist.id) 
                  : [...state.favoriteArtists, artist];
              return { favoriteArtists: newLiked };
          });
      },

      createPlaylist: (playlist) => {
        set((state) => {
           const newPlaylists = [playlist, ...state.userPlaylists];
           if(navigator.onLine) authService.savePublicPlaylist(playlist);
           if (state.currentUser) {
             const updatedUser = { ...state.currentUser, playlists: newPlaylists };
             if(navigator.onLine) setTimeout(() => get().syncUserToCloud('private'), 1000);
             return { userPlaylists: newPlaylists, currentUser: updatedUser };
           }
           return { userPlaylists: newPlaylists };
        });
      },

      importPlaylist: (playlist) => {
        set((state) => {
           if (state.userPlaylists.some(p => p.id === playlist.id)) return {};
           const newPlaylists = [playlist, ...state.userPlaylists];
           if (state.currentUser) {
             const updatedUser = { ...state.currentUser, playlists: newPlaylists };
             if(navigator.onLine) setTimeout(() => get().syncUserToCloud('private'), 1000);
             return { userPlaylists: newPlaylists, currentUser: updatedUser };
           }
           return { userPlaylists: newPlaylists };
        });
      },

      addSongToPlaylist: (playlistId, song) => {
        set((state) => {
          const newPlaylists = state.userPlaylists.map(p => {
            if (p.id === playlistId) {
               const updated = { ...p, songs: [...p.songs, song] };
               if (p.songs.some(s => s.id === song.id)) return p;
               if(navigator.onLine) authService.savePublicPlaylist(updated);
               return updated;
            }
            return p;
          });
          if (state.currentUser) {
             const updatedUser = { ...state.currentUser, playlists: newPlaylists };
             if(navigator.onLine) setTimeout(() => get().syncUserToCloud('private'), 1000);
             return { userPlaylists: newPlaylists, currentUser: updatedUser };
           }
           return { userPlaylists: newPlaylists };
        });
      },

      removePlaylist: (id) => {
        set((state) => {
           const newPlaylists = state.userPlaylists.filter(p => p.id !== id);
           if (state.currentUser) {
             const updatedUser = { ...state.currentUser, playlists: newPlaylists };
             if(navigator.onLine) setTimeout(() => get().syncUserToCloud('private'), 1000);
             return { userPlaylists: newPlaylists, currentUser: updatedUser };
           }
           return { userPlaylists: newPlaylists };
        });
      },

      startDownload: async (song, url, filename) => {
         set({ activeDownload: song, downloadProgress: 0 });
         try {
             await downloadSongWithProgress(song.id, url, filename, (progress) => {
                 set({ downloadProgress: progress });
             });
             
             // Mark as downloaded in state
             set(state => {
                 const newDownloads = state.downloadedSongIds.includes(song.id) 
                    ? state.downloadedSongIds 
                    : [...state.downloadedSongIds, song.id];
                 return { downloadProgress: 100, downloadedSongIds: newDownloads };
             });

             // Wait a bit before closing progress
             setTimeout(() => {
                 set({ activeDownload: null, downloadProgress: 0 });
             }, 2000);
         } catch (e) {
             console.error("Download Error", e);
             set({ activeDownload: null, downloadProgress: 0 });
         }
      },

      loginUser: (user) => {
          set({ 
            currentUser: user, 
            userPlaylists: user.playlists || [],
            likedSongs: user.likedSongs || [],
            history: user.history || [],
            favoriteArtists: user.favoriteArtists || []
          });
          get().initRealtimeListeners();
      },

      initRealtimeListeners: () => {
         const { unsubscribers, currentUser } = get();
         unsubscribers.forEach(unsub => unsub());
         
         if (!currentUser || !navigator.onLine) {
             set({ unsubscribers: [] });
             return;
         }

         const newUnsubscribers: Function[] = [];

         const unsubUser = authService.subscribeToUserData((data) => {
             set((state) => {
                 const updatedUser = { ...state.currentUser, ...data } as User;
                 const existingFriends = state.friends;
                 const serverContactEmails = data.friends || [];
                 const serverChats = data.chats || {};

                 const mergedFriends: Friend[] = serverContactEmails.map((email: string) => {
                     const existing = existingFriends.find(f => f.id === email);
                     const chatHistory = serverChats[email] || serverChats[email.replace(/\./g, '_dot_')] || [];
                     return {
                         id: email,
                         name: existing?.name || email.split('@')[0], 
                         image: existing?.image || '',
                         status: existing?.status || 'offline', 
                         currentSong: existing?.currentSong || null, 
                         lastActive: existing?.lastActive || 0,
                         chatHistory: chatHistory
                     };
                 });

                 return {
                     currentUser: updatedUser,
                     friends: mergedFriends,
                     userPlaylists: data.playlists || state.userPlaylists
                 };
             });
         });
         newUnsubscribers.push(unsubUser);

         if (currentUser.friends && currentUser.friends.length > 0) {
             const unsubFriends = authService.subscribeToFriendsActivity(currentUser.friends, (friendsData) => {
                 set((state) => {
                     const updatedFriends = state.friends.map(f => {
                         const liveData = friendsData.find((d: any) => d.email === f.id);
                         if (liveData) {
                             return {
                                 ...f,
                                 name: liveData.name || f.name,
                                 image: liveData.image || f.image,
                                 status: liveData.currentActivity?.status || 'offline',
                                 currentSong: liveData.currentActivity?.song || null,
                                 lastActive: liveData.currentActivity?.timestamp || 0
                             };
                         }
                         return f;
                     });
                     return { friends: updatedFriends };
                 });
             });
             newUnsubscribers.push(unsubFriends);
         }

         set({ unsubscribers: newUnsubscribers });
      },

      logoutUser: async () => {
        get().unsubscribers.forEach(unsub => unsub());
        if(navigator.onLine) await authService.logout();
        set({ 
            currentUser: null, 
            userPlaylists: [],
            friends: [],
            partySession: null,
            likedSongs: [],
            history: [],
            favoriteArtists: [],
            unsubscribers: []
        });
      },
      
      syncUserToCloud: async (type = 'both') => {
         const { currentUser, userPlaylists, likedSongs, history, favoriteArtists, isOfflineMode } = get();
         if (!currentUser || isOfflineMode) return;
         const updatedUser = { ...currentUser, playlists: userPlaylists };
         try {
             if (type === 'public' || type === 'both') await authService.syncPublicProfile(updatedUser);
             if (type === 'private' || type === 'both') await authService.syncPrivateData(updatedUser, { likedSongs, history, favoriteArtists });
         } catch (e) {
             console.error("Sync failed", e);
         }
      },

      updateUserProfile: (name, image) => {
        set((state) => {
          if (!state.currentUser) return {};
          const updatedUser = { 
              ...state.currentUser, 
              name: name,
              image: image !== undefined ? image : state.currentUser.image 
          };
          setTimeout(() => get().syncUserToCloud('public'), 100);
          return { currentUser: updatedUser };
        });
      },

      searchUsers: async (query) => {
          try {
              if (!navigator.onLine) return;
              const results = await authService.searchUsers(query);
              const { currentUser } = get();
              const filtered = results.filter(u => u.email !== currentUser?.email);
              set({ searchResults: filtered });
          } catch (e) { console.error(e); }
      },

      addContact: async (email) => {
          const { currentUser } = get();
          if (!currentUser || !navigator.onLine) return;
          await authService.addContact(email);
          set((state) => {
              if (state.friends.some(f => f.id === email)) return {};
              const newFriend: Friend = {
                  id: email,
                  name: email.split('@')[0],
                  image: '',
                  status: 'offline',
                  lastActive: 0,
                  chatHistory: []
              };
              return { 
                  friends: [...state.friends, newFriend],
                  activeChatFriendId: email 
              };
          });
          setTimeout(() => {
              get().initRealtimeListeners();
          }, 500);
      },

      refreshFriendsActivity: async () => {
          get().initRealtimeListeners();
      },

      openChat: (friendId) => set({ activeChatFriendId: friendId }),

      sendMessage: async (friendId, text) => {
          const { currentUser } = get();
          if (!currentUser) return;

          const newMessage: ChatMessage = {
              id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              senderId: currentUser.email,
              text,
              timestamp: Date.now()
          };

          set((state) => {
              const updatedFriends = state.friends.map(f => {
                  if (f.id === friendId) {
                      return { ...f, chatHistory: [...f.chatHistory, newMessage] };
                  }
                  return f;
              });
              return { friends: updatedFriends };
          });
          
          if(navigator.onLine) {
             await authService.sendChatMessage(currentUser.email, friendId, newMessage);
          }
      },

      recordPlay: (song) => {
        const now = Date.now();
        set((state) => {
          // Reset weekly counter if new week
          const weekMs = 7 * 24 * 60 * 60 * 1000;
          const isNewWeek = now - state.weekStartTime > weekMs;
          
          const newPlayCounts = { ...state.playCounts, [song.id]: (state.playCounts[song.id] || 0) + 1 };
          
          // Track artist play counts
          const newArtistCounts = { ...state.artistPlayCounts };
          const primaryArtists = song.artists?.primary || [];
          primaryArtists.forEach(a => {
            newArtistCounts[a.id] = (newArtistCounts[a.id] || 0) + 1;
          });

          const songDuration = parseInt(song.duration) || 180;
          
          return {
            playCounts: newPlayCounts,
            artistPlayCounts: newArtistCounts,
            totalListeningSeconds: state.totalListeningSeconds + songDuration,
            weeklyListeningSeconds: isNewWeek ? songDuration : state.weeklyListeningSeconds + songDuration,
            weekStartTime: isNewWeek ? now : state.weekStartTime,
          };
        });
      },

      setSleepTimer: (minutes) => {
        if (minutes === null) {
          set({ sleepTimerEnd: null });
        } else {
          set({ sleepTimerEnd: Date.now() + minutes * 60 * 1000 });
        }
      },

      setEqualizer: (bass, mid, treble) => set({ equalizerBass: bass, equalizerMid: mid, equalizerTreble: treble }),

      setAppTheme: (theme) => {
        const themeColors: Record<string, string> = {
          sakura: '#FF6B9D',
          moonlight: '#A855F7',
          ocean: '#06B6D4',
          cherry: '#EF4444',
          midnight: '#6366F1',
        };
        set({ appTheme: theme, themeColor: themeColors[theme] });
      },

      getTopSongs: () => {
        const { playCounts, history } = get();
        return [...history]
          .sort((a, b) => (playCounts[b.id] || 0) - (playCounts[a.id] || 0))
          .slice(0, 20);
      },

      getTopArtistIds: () => {
        const { artistPlayCounts } = get();
        return Object.entries(artistPlayCounts)
          .sort(([,a],[,b]) => b - a)
          .map(([id]) => id)
          .slice(0, 5);
      },

      startParty: () => set((state) => {
         if (!state.currentUser) return {};
         return {
             partySession: {
                 isActive: true,
                 hostId: 'me',
                 hostName: state.currentUser.name,
                 listeners: state.activeChatFriendId ? [state.activeChatFriendId] : []
             }
         }
      }),

      stopParty: () => set({ partySession: null })
    }),
    {
      name: 'vibestream-storage',
      partialize: (state) => ({ 
        history: state.history, 
        volume: state.volume,
        likedSongs: state.likedSongs,
        favoriteArtists: state.favoriteArtists,
        userPlaylists: state.userPlaylists,
        currentUser: state.currentUser,
        streamingQuality: state.streamingQuality,
        themeColor: state.themeColor,
        recentSearches: state.recentSearches,
        downloadedSongIds: state.downloadedSongIds,
        shuffleMode: state.shuffleMode,
        playCounts: state.playCounts,
        artistPlayCounts: state.artistPlayCounts,
        totalListeningSeconds: state.totalListeningSeconds,
        weeklyListeningSeconds: state.weeklyListeningSeconds,
        weekStartTime: state.weekStartTime,
        equalizerBass: state.equalizerBass,
        equalizerMid: state.equalizerMid,
        equalizerTreble: state.equalizerTreble,
        appTheme: state.appTheme,
      }), 
    }
  )
);