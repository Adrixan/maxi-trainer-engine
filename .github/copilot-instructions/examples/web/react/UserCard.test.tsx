/**
 * Tests for UserCard component.
 *
 * Uses:
 * - React Testing Library
 * - Vitest
 * - User event simulation
 * - Accessibility testing
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserCard, UserCardSkeleton } from './UserCard';

// Extend expect with accessibility matchers
expect.extend(toHaveNoViolations);

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'user.avatarAlt': `Avatar of ${params?.name}`,
        'user.roleLabel': `Role: ${params?.role}`,
        'user.roles.admin': 'Administrator',
        'user.roles.user': 'User',
        'user.roles.guest': 'Guest',
        'user.edit': `Edit ${params?.name}`,
        'user.delete': `Delete ${params?.name}`,
        'user.confirmDelete': 'Are you sure?',
        'common.edit': 'Edit',
        'common.delete': 'Delete',
        'common.deleting': 'Deleting...',
        'common.loading': 'Loading...',
        'errors.unknown': 'An unknown error occurred',
      };
      return translations[key] || key;
    },
  }),
}));

const mockUser = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  role: 'user' as const,
};

describe('UserCard', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('Rendering', () => {
    it('renders user information correctly', () => {
      render(<UserCard user={mockUser} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('User')).toBeInTheDocument();
    });

    it('displays avatar when provided', () => {
      const userWithAvatar = {
        ...mockUser,
        avatar: 'https://example.com/avatar.jpg',
      };

      render(<UserCard user={userWithAvatar} />);

      const img = screen.getByRole('img', { name: /Avatar of John Doe/i });
      expect(img).toHaveAttribute('src', userWithAvatar.avatar);
    });

    it('displays initials when no avatar', () => {
      render(<UserCard user={mockUser} />);

      // Check for the initial letter
      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('applies correct role badge styling', () => {
      const { rerender } = render(<UserCard user={mockUser} />);

      // User role
      let badge = screen.getByText('User');
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');

      // Admin role
      rerender(<UserCard user={{ ...mockUser, role: 'admin' }} />);
      badge = screen.getByText('Administrator');
      expect(badge).toHaveClass('bg-red-100', 'text-red-800');

      // Guest role
      rerender(<UserCard user={{ ...mockUser, role: 'guest' }} />);
      badge = screen.getByText('Guest');
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
    });
  });

  describe('Edit functionality', () => {
    it('calls onEdit when edit button is clicked', async () => {
      const handleEdit = vi.fn();
      render(<UserCard user={mockUser} onEdit={handleEdit} />);

      const editButton = screen.getByRole('button', { name: /Edit John Doe/i });
      await user.click(editButton);

      expect(handleEdit).toHaveBeenCalledOnce();
      expect(handleEdit).toHaveBeenCalledWith(mockUser);
    });

    it('does not render edit button when onEdit is not provided', () => {
      render(<UserCard user={mockUser} />);

      expect(
        screen.queryByRole('button', { name: /Edit/i })
      ).not.toBeInTheDocument();
    });

    it('disables edit button when loading', () => {
      const handleEdit = vi.fn();
      render(<UserCard user={mockUser} onEdit={handleEdit} isLoading />);

      const editButton = screen.getByRole('button', { name: /Edit John Doe/i });
      expect(editButton).toBeDisabled();
    });
  });

  describe('Delete functionality', () => {
    beforeEach(() => {
      // Mock window.confirm
      global.confirm = vi.fn(() => true);
    });

    it('calls onDelete when delete button is clicked and confirmed', async () => {
      const handleDelete = vi.fn(() => Promise.resolve());
      render(<UserCard user={mockUser} onDelete={handleDelete} />);

      const deleteButton = screen.getByRole('button', {
        name: /Delete John Doe/i,
      });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(handleDelete).toHaveBeenCalledOnce();
        expect(handleDelete).toHaveBeenCalledWith(mockUser.id);
      });
    });

    it('does not call onDelete when not confirmed', async () => {
      global.confirm = vi.fn(() => false);
      const handleDelete = vi.fn();
      render(<UserCard user={mockUser} onDelete={handleDelete} />);

      const deleteButton = screen.getByRole('button', {
        name: /Delete John Doe/i,
      });
      await user.click(deleteButton);

      expect(handleDelete).not.toHaveBeenCalled();
    });

    it('shows deleting state during deletion', async () => {
      let resolveDelete: () => void;
      const handleDelete = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveDelete = resolve;
          })
      );

      render(<UserCard user={mockUser} onDelete={handleDelete} />);

      const deleteButton = screen.getByRole('button', {
        name: /Delete John Doe/i,
      });
      await user.click(deleteButton);

      // Should show "Deleting..." text
      await waitFor(() => {
        expect(screen.getByText('Deleting...')).toBeInTheDocument();
      });

      // Button should be disabled
      expect(deleteButton).toBeDisabled();

      // Resolve the promise
      resolveDelete!();
    });

    it('displays error message when delete fails', async () => {
      const errorMessage = 'Failed to delete user';
      const handleDelete = vi.fn(() => Promise.reject(new Error(errorMessage)));

      render(<UserCard user={mockUser} onDelete={handleDelete} />);

      const deleteButton = screen.getByRole('button', {
        name: /Delete John Doe/i,
      });
      await user.click(deleteButton);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent(errorMessage);
      });
    });

    it('does not render delete button when onDelete is not provided', () => {
      render(<UserCard user={mockUser} />);

      expect(
        screen.queryByRole('button', { name: /Delete/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('shows loading overlay when isLoading is true', () => {
      render(<UserCard user={mockUser} isLoading />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByRole('article')).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <UserCard user={mockUser} onEdit={vi.fn()} onDelete={vi.fn()} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA labels', () => {
      render(<UserCard user={mockUser} onEdit={vi.fn()} onDelete={vi.fn()} />);

      expect(screen.getByRole('article')).toHaveAttribute(
        'aria-labelledby',
        `user-${mockUser.id}-name`
      );

      expect(
        screen.getByRole('button', { name: /Edit John Doe/i })
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', { name: /Delete John Doe/i })
      ).toBeInTheDocument();
    });

    it('has proper heading structure', () => {
      render(<UserCard user={mockUser} />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('John Doe');
      expect(heading).toHaveAttribute('id', `user-${mockUser.id}-name`);
    });
  });

  describe('Responsive design', () => {
    it('applies custom className', () => {
      const { container } = render(
        <UserCard user={mockUser} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});

describe('UserCardSkeleton', () => {
  it('renders loading skeleton', () => {
    render(<UserCardSkeleton />);

    expect(screen.getByLabelText(/Loading user information/i)).toBeInTheDocument();
  });

  it('has proper aria-busy attribute', () => {
    const { container } = render(<UserCardSkeleton />);

    expect(container.firstChild).toHaveAttribute('aria-busy', 'true');
  });

  it('applies custom className', () => {
    const { container } = render(<UserCardSkeleton className="custom-class" />);

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
