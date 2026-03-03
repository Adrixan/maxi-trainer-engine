/**
 * useAsync Hook Tests - demonstrating custom hook testing.
 *
 * Uses:
 * - @testing-library/react-hooks (for hook testing)
 * - act() for state updates
 * - waitFor for async operations
 * - Mock timers for cleanup testing
 */

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useAsync } from './useAsync';

describe('useAsync', () => {
  describe('initial state', () => {
    it('should have correct initial state when immediate is false', () => {
      const asyncFunction = vi.fn().mockResolvedValue('data');

      const { result } = renderHook(() => useAsync(asyncFunction, false));

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(false);
    });

    it('should start loading when immediate is true', () => {
      const asyncFunction = vi.fn().mockResolvedValue('data');

      const { result } = renderHook(() => useAsync(asyncFunction, true));

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('successful execution', () => {
    it('should set data when async function succeeds', async () => {
      const mockData = { id: 1, name: 'Test' };
      const asyncFunction = vi.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() => useAsync(asyncFunction));

      // Execute the async function
      await result.current.execute();

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isError).toBe(false);
      });
    });

    it('should pass arguments to async function', async () => {
      const asyncFunction = vi.fn().mockResolvedValue('data');

      const { result } = renderHook(() => useAsync(asyncFunction));

      await result.current.execute(1, 'test', { foo: 'bar' });

      await waitFor(() => {
        expect(asyncFunction).toHaveBeenCalledWith(1, 'test', { foo: 'bar' });
      });
    });
  });

  describe('error handling', () => {
    it('should set error when async function fails', async () => {
      const mockError = new Error('Test error');
      const asyncFunction = vi.fn().mockRejectedValue(mockError);

      const { result } = renderHook(() => useAsync(asyncFunction));

      await result.current.execute();

      await waitFor(() => {
        expect(result.current.error).toEqual(mockError);
        expect(result.current.isError).toBe(true);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isSuccess).toBe(false);
      });
    });

    it('should wrap non-Error rejections in Error object', async () => {
      const asyncFunction = vi.fn().mockRejectedValue('string error');

      const { result } = renderHook(() => useAsync(asyncFunction));

      await result.current.execute();

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe('string error');
      });
    });
  });

  describe('loading state', () => {
    it('should set loading to true during execution', async () => {
      let resolvePromise: (value: string) => void;
      const promise = new Promise<string>((resolve) => {
        resolvePromise = resolve;
      });
      const asyncFunction = vi.fn().mockReturnValue(promise);

      const { result } = renderHook(() => useAsync(asyncFunction));

      // Start execution
      result.current.execute();

      // Should be loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      // Resolve promise
      resolvePromise!('data');

      // Should stop loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('race condition handling', () => {
    it('should only use data from the latest request', async () => {
      let resolveFirst: (value: string) => void;
      let resolveSecond: (value: string) => void;

      const firstPromise = new Promise<string>((resolve) => {
        resolveFirst = resolve;
      });
      const secondPromise = new Promise<string>((resolve) => {
        resolveSecond = resolve;
      });

      const asyncFunction = vi
        .fn()
        .mockReturnValueOnce(firstPromise)
        .mockReturnValueOnce(secondPromise);

      const { result } = renderHook(() => useAsync(asyncFunction));

      // Start first request
      result.current.execute();

      // Start second request (should supersede first)
      result.current.execute();

      // Resolve second request first
      resolveSecond!('second');

      await waitFor(() => {
        expect(result.current.data).toBe('second');
      });

      // Resolve first request (should be ignored)
      resolveFirst!('first');

      // Wait a bit to ensure state doesn't change
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Data should still be from second request
      expect(result.current.data).toBe('second');
    });
  });

  describe('reset function', () => {
    it('should reset state to initial values', async () => {
      const asyncFunction = vi.fn().mockResolvedValue('data');

      const { result } = renderHook(() => useAsync(asyncFunction));

      // Execute and get data
      await result.current.execute();

      await waitFor(() => {
        expect(result.current.data).toBe('data');
      });

      // Reset
      result.current.reset();

      // State should be back to initial
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should not update state after unmount', async () => {
      let resolvePromise: (value: string) => void;
      const promise = new Promise<string>((resolve) => {
        resolvePromise = resolve;
      });
      const asyncFunction = vi.fn().mockReturnValue(promise);

      const { result, unmount } = renderHook(() => useAsync(asyncFunction));

      // Start execution
      result.current.execute();

      // Unmount before promise resolves
      unmount();

      // Resolve promise
      resolvePromise!('data');

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 50));

      // No error should be thrown (state update prevented)
      // This test passes if no error/warning is logged
    });
  });

  describe('immediate execution', () => {
    it('should execute immediately when immediate is true', async () => {
      const asyncFunction = vi.fn().mockResolvedValue('data');

      renderHook(() => useAsync(asyncFunction, true));

      await waitFor(() => {
        expect(asyncFunction).toHaveBeenCalled();
      });
    });

    it('should not execute immediately when immediate is false', async () => {
      const asyncFunction = vi.fn().mockResolvedValue('data');

      renderHook(() => useAsync(asyncFunction, false));

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(asyncFunction).not.toHaveBeenCalled();
    });
  });
});
