/**
 * API endpoint constants
 * Centralized API endpoint definitions for type safety and maintainability
 */

export const API_ENDPOINTS = {
  // Wallet auth (D-001). See docs/API_SPEC.md §1.
  auth: {
    challenge: '/auth/challenge',
    verify: '/auth/verify',
    logout: '/auth/logout',
    me: '/auth/me',
  },

  // Content (docs/API_SPEC.md §2)
  content: {
    list: '/content',
    upload: '/content/upload',
    confirm: (draftId: string) => `/content/${draftId}/confirm`,
    download: (contentId: string) => `/content/${contentId}/download`,
  },

  // Traction (docs/API_SPEC.md §3)
  stats: '/stats',

  // Users — generic pre-existing scaffold, unrelated to komunify auth (Phase 0 note)
  users: {
    list: '/users',
    byId: (id: string) => `/users/${id}`,
    create: '/users',
    update: (id: string) => `/users/${id}`,
    delete: (id: string) => `/users/${id}`,
  },

  // Health check
  health: '/health',
} as const;
