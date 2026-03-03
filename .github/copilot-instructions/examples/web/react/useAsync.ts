/**
 * useAsync Hook - Example of custom React hook best practices.
 *
 * Demonstrates:
 * - Generic type parameters
 * - Async state management
 * - Error handling
 * - Loading states
 * - Cleanup and cancellation
 * - useCallback for memoization
 */

import { useState, useCallback, useEffect, useRef } from 'react';

interface AsyncState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}

interface UseAsyncReturn<T> extends AsyncState<T> {
  execute: (...args: unknown[]) => Promise<void>;
  reset: () => void;
}

/**
 * Custom hook for handling async operations with loading/error states.
 *
 * @template T The type of data returned by the async function
 * @param asyncFunction The async function to execute
 * @param immediate Whether to execute immediately on mount (default: false)
 * @returns Object containing data, error, loading state, and control functions
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, execute } = useAsync(
 *   async (userId: number) => fetchUser(userId)
 * );
 *
 * useEffect(() => {
 *   execute(123);
 * }, [execute]);
 * ```
 */
export function useAsync<T>(
  asyncFunction: (...args: unknown[]) => Promise<T>,
  immediate = false
): UseAsyncReturn<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    isLoading: immediate,
    isSuccess: false,
    isError: false,
  });

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  // Track the latest request to cancel outdated ones
  const requestIdRef = useRef(0);

  // Execute async function
  const execute = useCallback(
    async (...args: unknown[]) => {
      const currentRequestId = ++requestIdRef.current;

      setState((prev) => ({
        ...prev,
        isLoading: true,
        isError: false,
        error: null,
      }));

      try {
        const data = await asyncFunction(...args);

        // Only update state if this is still the latest request and component is mounted
        if (isMountedRef.current && currentRequestId === requestIdRef.current) {
          setState({
            data,
            error: null,
            isLoading: false,
            isSuccess: true,
            isError: false,
          });
        }
      } catch (error) {
        // Only update state if this is still the latest request and component is mounted
        if (isMountedRef.current && currentRequestId === requestIdRef.current) {
          setState({
            data: null,
            error: error instanceof Error ? error : new Error(String(error)),
            isLoading: false,
            isSuccess: false,
            isError: true,
          });
        }
      }
    },
    [asyncFunction]
  );

  // Reset state to initial values
  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      isLoading: false,
      is Success: false,
      isError: false,
    });
  }, []);

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  // Cleanup: mark as unmounted
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

/**
 * Example usage in a component
 */
export function UserProfileExample({ userId }: { userId: number }) {
  const { data: user, isLoading, error, execute } = useAsync(
    async (id: number) => {
      const response = await fetch(`/api/users/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      return response.json();
    }
  );

  useEffect(() => {
    execute(userId);
  }, [userId, execute]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!user) {
    return <div>No user found</div>;
  }

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
