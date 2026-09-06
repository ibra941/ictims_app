// Mock adapter - set to false when using real backend
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true' || false;

// Simulate network delay for mock calls
export const simulateDelay = (ms: number = 200): Promise<void> => {
  if (!USE_MOCKS) return Promise.resolve();
  return new Promise(resolve => setTimeout(resolve, ms));
};
