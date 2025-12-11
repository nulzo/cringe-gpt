import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  AnalyticsTimeRange,
  AnalyticsFilters,
  AnalyticsLoadingState
} from '@/features/analytics/types';

interface AnalyticsState {
  // Time range and filters
  timeRange: AnalyticsTimeRange;
  filters: AnalyticsFilters;

  // Loading states
  loading: AnalyticsLoadingState;

  // Cached data
  lastUpdated: Date | null;
  cacheExpiry: number; // minutes

  // UI state
  activeTab: 'overview' | 'costs' | 'usage' | 'performance' | 'models' | 'providers';
  chartType: 'line' | 'bar' | 'area' | 'pie' | 'donut';
  theme: 'light' | 'dark' | 'auto';

  // Actions
  setTimeRange: (timeRange: AnalyticsTimeRange) => void;
  setFilters: (filters: Partial<AnalyticsFilters>) => void;
  setLoading: (loading: Partial<AnalyticsLoadingState>) => void;
  setActiveTab: (tab: AnalyticsState['activeTab']) => void;
  setChartType: (type: AnalyticsState['chartType']) => void;
  setTheme: (theme: AnalyticsState['theme']) => void;

  // Utility functions
  resetFilters: () => void;
  isCacheValid: () => boolean;
  updateCacheTimestamp: () => void;
  getQuickTimeRange: (preset: '7d' | '30d' | '90d' | '1y' | 'all') => AnalyticsTimeRange;
}

const defaultTimeRange: AnalyticsTimeRange = {
  from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  to: new Date(),
  preset: '30d'
};

const defaultFilters: AnalyticsFilters = {
  timeRange: defaultTimeRange,
  groupBy: 'day'
};

const defaultLoadingState: AnalyticsLoadingState = {
  dashboard: false,
  timeSeries: false,
  providers: false,
  models: false,
  performance: false,
  costBreakdown: false,
  usageHabits: false,
  trends: false
};

const useAnalyticsStore = create<AnalyticsState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        timeRange: defaultTimeRange,
        filters: defaultFilters,
        loading: defaultLoadingState,
        lastUpdated: null,
        cacheExpiry: 5, // 5 minutes
        activeTab: 'overview',
        chartType: 'line',
        theme: 'auto',

        // Actions
        setTimeRange: (timeRange) =>
          set((state) => ({
            timeRange,
            filters: { ...state.filters, timeRange },
            lastUpdated: new Date()
          }), false, 'setTimeRange'),

        setFilters: (newFilters) =>
          set((state) => ({
            filters: { ...state.filters, ...newFilters },
            lastUpdated: new Date()
          }), false, 'setFilters'),

        setLoading: (loading) =>
          set((state) => ({
            loading: { ...state.loading, ...loading }
          }), false, 'setLoading'),

        setActiveTab: (activeTab) =>
          set((state) => (state.activeTab === activeTab ? state : { activeTab }), false, 'setActiveTab'),

        setChartType: (chartType) =>
          set({ chartType }, false, 'setChartType'),

        setTheme: (theme) =>
          set({ theme }, false, 'setTheme'),

        // Utility functions
        resetFilters: () =>
          set({
            filters: defaultFilters,
            timeRange: defaultTimeRange,
            lastUpdated: new Date()
          }, false, 'resetFilters'),

        isCacheValid: () => {
          const state = get();
          if (!state.lastUpdated) return false;
          const now = new Date();
          const diffMinutes = (now.getTime() - state.lastUpdated.getTime()) / (1000 * 60);
          return diffMinutes < state.cacheExpiry;
        },

        updateCacheTimestamp: () =>
          set({ lastUpdated: new Date() }, false, 'updateCacheTimestamp'),

        getQuickTimeRange: (preset) => {
          const now = new Date();
          let from: Date;

          switch (preset) {
            case '7d':
              from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              break;
            case '30d':
              from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              break;
            case '90d':
              from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
              break;
            case '1y':
              from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
              break;
            case 'all':
              from = new Date(2020, 0, 1); // Far back date for "all" data
              break;
            default:
              from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          }

          return {
            from,
            to: now,
            preset
          };
        }
      }),
      {
        name: 'analytics-store',
        partialize: (state) => ({
          timeRange: state.timeRange,
          filters: state.filters,
          activeTab: state.activeTab,
          chartType: state.chartType,
          theme: state.theme,
          cacheExpiry: state.cacheExpiry
        })
      }
    ),
    {
      name: 'analytics-store'
    }
  )
);

// Selectors used by the remaining analytics UI
export const useAnalyticsTimeRange = () => useAnalyticsStore((state) => state.timeRange);
export const useAnalyticsFilters = () => useAnalyticsStore((state) => state.filters);
export const useSetTimeRange = () => useAnalyticsStore((state) => state.setTimeRange);
export const useGetQuickTimeRange = () => useAnalyticsStore((state) => state.getQuickTimeRange);
