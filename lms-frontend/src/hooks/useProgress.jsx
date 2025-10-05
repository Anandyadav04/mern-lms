import { useState, useEffect, useCallback, useRef } from 'react';
import { progressAPI } from '../services/api';
import toast from 'react-hot-toast';

export const useProgress = (courseId, lessons = [], currentLessonIndex = 0) => {
  const [userProgress, setUserProgress] = useState(null);
  const [savingProgress, setSavingProgress] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [apiAvailable, setApiAvailable] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [localProgress, setLocalProgress] = useState({});
  
  // Refs for tracking
  const previousLessonIndexRef = useRef(currentLessonIndex);
  const saveTimeoutRef = useRef(null);
  const pendingSavesRef = useRef(new Map()); // Track pending saves by lessonId

  // Quick local progress calculation
  const calculateLocalProgress = useCallback(() => {
    const completedLessons = lessons.filter(lesson => 
      localProgress[lesson._id]?.completed
    ).length;
    const totalLessons = lessons.length;
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  }, [lessons, localProgress]);

  // Enhanced save with fallback to localStorage
  const saveProgress = useCallback(async (
    lessonId = null,
    completed = false,
    videoTimestamp = 0,
    options = {}
  ) => {
    const { immediate = false, isAutoSave = false } = options;
    
    if (!courseId || !lessons.length) {
      console.log('Progress saving skipped - missing courseId or lessons');
      return false;
    }

    const targetLessonId = lessonId || (lessons[currentLessonIndex]?._id);
    
    if (!targetLessonId) {
      console.log('No valid lesson ID for progress saving');
      return false;
    }

    // Clear any pending debounced save for this lesson
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    // Update local state immediately (optimistic update)
    const progressUpdate = {
      completed,
      videoTimestamp,
      lastAccessedAt: new Date().toISOString(),
      savedAt: new Date().toISOString(),
    };

    console.log('Updating progress for lesson:', targetLessonId, progressUpdate);

    // Update local progress state
    setLocalProgress(prev => ({
      ...prev,
      [targetLessonId]: {
        ...prev[targetLessonId],
        ...progressUpdate
      }
    }));

    // Update userProgress state for immediate UI feedback
    setUserProgress(prev => ({
      ...prev,
      progress: calculateLocalProgress(),
      lastAccessedAt: new Date().toISOString(),
      lastAccessedLesson: targetLessonId,
      lessons: updateLessonsInProgress(prev?.lessons || [], targetLessonId, progressUpdate)
    }));

    setLastSaved(new Date());

    // Save to localStorage as backup
    saveToLocalStorage(courseId, targetLessonId, progressUpdate);

    // If API is unavailable, skip server save
    if (!apiAvailable && !immediate) {
      console.log('API unavailable, using local storage only');
      return true;
    }

    // For auto-saves, use shorter timeout and don't show errors
    const timeoutDuration = isAutoSave ? 5000 : 10000; // 5s for auto-save, 10s for manual

    try {
      setSavingProgress(true);

      console.log('Saving to server...');

      // Create a clean save function without race conditions
      const saveToServer = async () => {
        const progressData = {
          completed,
          videoTimestamp,
          lastAccessedAt: new Date().toISOString(),
        };

        return await progressAPI.updateLessonProgress(
          courseId,
          targetLessonId,
          progressData
        );
      };

      const response = await saveToServer();

      console.log('Server save successful');
      setApiAvailable(true); // Re-enable API on success
      return true;

    } catch (error) {
      console.error('Server save failed:', error.message);

      // Handle different error types
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        console.log('Save timeout - will retry later');
        
        // Don't disable API immediately for timeouts
        // Queue for retry on next save attempt
        if (!isAutoSave) {
          toast.error('Progress save delayed (network issue)');
        }
      } else if (error.response?.status === 404) {
        console.log('Progress API not available');
        setApiAvailable(false);
        if (!isAutoSave) {
          toast.error('Progress tracking unavailable');
        }
      } else {
        console.log('Other save error:', error.message);
        if (!isAutoSave) {
          toast.error('Failed to save progress');
        }
      }
      
      return false;
    } finally {
      setSavingProgress(false);
    }
  }, [courseId, lessons, currentLessonIndex, apiAvailable, calculateLocalProgress]);

  // Debounced save with better logic
  const debouncedSaveProgress = useCallback((
    lessonId = null,
    completed = false,
    videoTimestamp = 0,
    options = {}
  ) => {
    const targetLessonId = lessonId || (lessons[currentLessonIndex]?._id);
    
    if (!targetLessonId) return;

    // Clear existing timeout for this lesson
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // For important saves (completions), save immediately
    if (completed || options.immediate) {
      saveProgress(lessonId, completed, videoTimestamp, { ...options, isAutoSave: !completed });
      return;
    }

    // For video progress and auto-saves, use debouncing
    saveTimeoutRef.current = setTimeout(() => {
      saveProgress(lessonId, completed, videoTimestamp, { ...options, isAutoSave: true });
    }, 3000); // 3 second debounce for non-critical saves
  }, [saveProgress, lessons, currentLessonIndex]);

  // Load progress from localStorage and server
  const fetchUserProgress = useCallback(async () => {
    if (!courseId) return null;

    try {
      console.log('Loading progress...');

      // First, try to load from server
      let serverProgress = null;
      try {
        const response = await progressAPI.getProgress(courseId);
        serverProgress = response.data?.data || response.data;
        setApiAvailable(true);
        console.log('Server progress loaded:', serverProgress);
      } catch (serverError) {
        console.log('Server progress load failed:', serverError.message);
        // Continue to localStorage fallback
      }

      // Load from localStorage as fallback/backup
      const localProgressData = loadFromLocalStorage(courseId);
      console.log('Local progress data:', localProgressData);

      // Merge server and local progress (local wins for conflicts)
      const mergedProgress = mergeProgressData(serverProgress, localProgressData, lessons);
      
      setUserProgress(mergedProgress);
      
      // Update localProgress state from merged data
      if (mergedProgress.lessons) {
        const localProgressMap = {};
        mergedProgress.lessons.forEach(lesson => {
          if (lesson.lessonId) {
            localProgressMap[lesson.lessonId] = {
              completed: lesson.completed || false,
              videoTimestamp: lesson.videoTimestamp || 0,
              lastAccessedAt: lesson.lastAccessedAt
            };
          }
        });
        setLocalProgress(localProgressMap);
      }

      return mergedProgress;

    } catch (error) {
      console.error('Error loading progress:', error);
      return null;
    }
  }, [courseId, lessons]);

  // Local storage helpers
  const saveToLocalStorage = (courseId, lessonId, progress) => {
    try {
      const key = `progress_${courseId}`;
      const existing = JSON.parse(localStorage.getItem(key) || '{}');
      
      existing[lessonId] = {
        ...existing[lessonId],
        ...progress,
        savedAt: new Date().toISOString()
      };
      
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  const loadFromLocalStorage = (courseId) => {
    try {
      const key = `progress_${courseId}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return {};
    }
  };

  const mergeProgressData = (serverProgress, localProgress, lessonsArray) => {
    // Start with server progress
    const merged = serverProgress ? { ...serverProgress } : {
      progress: 0,
      status: 'in-progress',
      lessons: []
    };

    // Merge local progress data
    const mergedLessons = [...(merged.lessons || [])];
    
    Object.entries(localProgress).forEach(([lessonId, localData]) => {
      const existingIndex = mergedLessons.findIndex(
        lesson => lesson.lessonId === lessonId || lesson._id === lessonId
      );
      
      if (existingIndex !== -1) {
        // Update existing lesson with local data (local wins)
        mergedLessons[existingIndex] = {
          ...mergedLessons[existingIndex],
          ...localData
        };
      } else {
        // Add new lesson from local data
        mergedLessons.push({
          lessonId,
          ...localData
        });
      }
    });

    merged.lessons = mergedLessons;
    
    // Recalculate overall progress
    const completedLessons = lessonsArray.filter(lesson => 
      localProgress[lesson._id]?.completed || 
      mergedLessons.find(l => (l.lessonId === lesson._id || l._id === lesson._id)?.completed)
    ).length;
    
    merged.progress = lessonsArray.length > 0 ? 
      Math.round((completedLessons / lessonsArray.length) * 100) : 0;

    return merged;
  };

  // Helper function to update lessons in progress data
  const updateLessonsInProgress = (existingLessons, lessonId, updates) => {
    const lessonIndex = existingLessons.findIndex(
      lesson => lesson.lessonId === lessonId || lesson._id === lessonId
    );
    
    if (lessonIndex !== -1) {
      const updatedLessons = [...existingLessons];
      updatedLessons[lessonIndex] = {
        ...updatedLessons[lessonIndex],
        ...updates
      };
      return updatedLessons;
    } else {
      return [
        ...existingLessons,
        {
          lessonId,
          ...updates
        }
      ];
    }
  };

  // Initialize progress
  const initializeProgress = useCallback(async () => {
    if (!courseId || !lessons.length || initialized) return;

    try {
      console.log('Initializing progress tracking...');
      
      await fetchUserProgress();
      setInitialized(true);
      
    } catch (error) {
      console.error('Error initializing progress:', error);
      setInitialized(true); // Mark as initialized even if failed
    }
  }, [courseId, lessons, fetchUserProgress, initialized]);

  // Auto-save when lesson changes
  useEffect(() => {
    if (initialized && currentLessonIndex !== previousLessonIndexRef.current) {
      console.log('Lesson changed, auto-saving...');
      debouncedSaveProgress(null, false, 0);
      previousLessonIndexRef.current = currentLessonIndex;
    }
  }, [currentLessonIndex, debouncedSaveProgress, initialized]);

  // Initialize on mount
  useEffect(() => {
    if (courseId && lessons.length > 0 && !initialized) {
      initializeProgress();
    }
  }, [courseId, lessons, initializeProgress, initialized]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Export progress data (for debugging or backup)
  const exportProgress = useCallback(() => {
    return {
      server: userProgress,
      local: localProgress,
      lastSaved,
      calculatedProgress: calculateLocalProgress()
    };
  }, [userProgress, localProgress, lastSaved, calculateLocalProgress]);

  return {
    userProgress,
    savingProgress,
    lastSaved,
    apiAvailable,
    initialized,
    localProgress,
    fetchUserProgress,
    saveProgress,
    debouncedSaveProgress,
    initializeProgress,
    exportProgress,
    markLessonComplete: (lessonId) => saveProgress(lessonId, true, 0, { immediate: true }),
    updateVideoProgress: (lessonId, timestamp) => debouncedSaveProgress(lessonId, false, timestamp),
    // Quick progress getter
    getCurrentProgress: () => userProgress?.progress || calculateLocalProgress(),
  };
};