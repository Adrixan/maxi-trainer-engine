/**
 * UserCard Component - Example of React/TypeScript best practices.
 *
 * Demonstrates:
 * - TypeScript strict typing
 * - Accessibility (ARIA labels, semantic HTML)
 * - Internationalization
 * - Error handling
 * - Loading states
 * - Responsive design
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user' | 'guest';
}

interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
  onDelete?: (userId: number) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

/**
 * UserCard displays user information with actions.
 *
 * @param user - User object to display
 * @param onEdit - Optional callback when edit button is clicked
 * @param onDelete - Optional async callback when delete button is clicked
 * @param isLoading - Whether the card is in a loading state
 * @param className - Additional CSS classes
 */
export function UserCard({
  user,
  onEdit,
  onDelete,
  isLoading = false,
  className = '',
}: UserCardProps) {
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = () => {
    if (onEdit && !isLoading) {
      onEdit(user);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || isDeleting || !window.confirm(t('user.confirmDelete'))) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await onDelete(user.id);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t('errors.unknown');
      setError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadgeColor = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'user':
        return 'bg-blue-100 text-blue-800';
      case 'guest':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <article
      className={`user-card bg-white rounded-lg shadow-md p-6 ${className}`}
      aria-busy={isLoading || isDeleting}
      aria-labelledby={`user-${user.id}-name`}
    >
      {/* Header with avatar and name */}
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={t('user.avatarAlt', { name: user.name })}
              className="w-16 h-16 rounded-full object-cover"
              loading="lazy"
            />
          ) : (
            <div
              className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center"
              aria-hidden="true"
            >
              <span className="text-2xl text-gray-600">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* User info */}
        <div className="flex-1 min-w-0">
          <h2
            id={`user-${user.id}-name`}
            className="text-xl font-semibold text-gray-900 truncate"
          >
            {user.name}
          </h2>

          <p className="text-sm text-gray-600 truncate">{user.email}</p>

          {/* Role badge */}
          <span
            className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded ${getRoleBadgeColor(
              user.role
            )}`}
            aria-label={t('user.roleLabel', { role: user.role })}
          >
            {t(`user.roles.${user.role}`)}
          </span>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800"
        >
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        {onEdit && (
          <button
            onClick={handleEdit}
            disabled={isLoading || isDeleting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            aria-label={t('user.edit', { name: user.name })}
          >
            {t('common.edit')}
          </button>
        )}

        {onDelete && (
          <button
            onClick={handleDelete}
            disabled={isLoading || isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            aria-label={t('user.delete', { name: user.name })}
          >
            {isDeleting ? t('common.deleting') : t('common.delete')}
          </button>
        )}
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div
          className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg"
          aria-live="polite"
        >
          <div className="flex flex-col items-center gap-2">
            <div
              className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
              aria-hidden="true"
            />
            <span className="text-sm text-gray-600">
              {t('common.loading')}
            </span>
          </div>
        </div>
      )}
    </article>
  );
}

/**
 * UserCardSkeleton - Loading placeholder.
 *
 * Prevents layout shift while data is loading.
 */
export function UserCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`user-card bg-white rounded-lg shadow-md p-6 animate-pulse ${className}`}
      aria-busy="true"
      aria-label="Loading user information"
    >
      <div className="flex items-start gap-4">
        {/* Avatar skeleton */}
        <div className="w-16 h-16 bg-gray-200 rounded-full" />

        {/* Content skeleton */}
        <div className="flex-1 space-y-3">
          <div className="h-6 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-6 bg-gray-200 rounded w-16" />
        </div>
      </div>

      {/* Action buttons skeleton */}
      <div className="mt-4 flex gap-2">
        <div className="h-10 bg-gray-200 rounded w-20" />
        <div className="h-10 bg-gray-200 rounded w-20" />
      </div>
    </div>
  );
}
