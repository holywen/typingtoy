'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface User {
  _id: string;
  email: string;
  name?: string;
  role: 'user' | 'admin';
  createdAt: string;
  emailVerified?: string | null;
  banned?: boolean;
  banReason?: string;
}

interface UserTableProps {
  users: User[];
  onUpdateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  currentUserId?: string;
}

export default function UserTable({
  users,
  onUpdateUser,
  onDeleteUser,
  currentUserId,
}: UserTableProps) {
  const { t } = useLanguage();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    const roleText = newRole === 'admin' ? t.admin.admin : t.admin.user;
    if (confirm(t.admin.confirmRoleChange.replace('{role}', roleText))) {
      setUpdatingUserId(userId);
      try {
        await onUpdateUser(userId, { role: newRole });
      } finally {
        setUpdatingUserId(null);
      }
    }
  };

  const handleDelete = async (userId: string, userEmail: string) => {
    if (confirm(t.admin.confirmDeleteUser.replace('{email}', userEmail))) {
      setUpdatingUserId(userId);
      try {
        await onDeleteUser(userId);
      } finally {
        setUpdatingUserId(null);
      }
    }
  };

  const handleBanToggle = async (userId: string, currentBanStatus: boolean, userEmail: string) => {
    const confirmMessage = currentBanStatus ? t.admin.confirmUnban : t.admin.confirmBan;

    if (confirm(confirmMessage)) {
      setUpdatingUserId(userId);
      try {
        const banReason = !currentBanStatus
          ? prompt(t.admin.banReason + ':', '') || 'No reason provided'
          : undefined;

        const response = await fetch(`/api/admin/users/${userId}/ban`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            banned: !currentBanStatus,
            banReason,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // Update local state
          await onUpdateUser(userId, {
            banned: !currentBanStatus,
            banReason: !currentBanStatus ? banReason : undefined,
          });
        } else {
          alert(`Error: ${data.error}`);
        }
      } catch (error) {
        console.error('Error toggling ban status:', error);
        alert('Failed to update ban status');
      } finally {
        setUpdatingUserId(null);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {t.admin.userColumn}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {t.admin.role}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {t.admin.status}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {t.admin.joined}
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {t.admin.actions}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {users.map((user) => (
            <tr key={user._id} className={updatingUserId === user._id ? 'opacity-50' : ''}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.name || t.admin.noName}
                      {currentUserId === user._id && (
                        <span className="ml-2 px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 dark:text-blue-100 dark:bg-blue-800 rounded">
                          {t.multiplayer.you}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {user.email}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user._id, e.target.value as 'user' | 'admin')}
                  disabled={currentUserId === user._id || updatingUserId === user._id}
                  className={`text-sm rounded-md border ${
                    user.role === 'admin'
                      ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900 dark:text-purple-100'
                      : 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-100'
                  } px-2 py-1 ${
                    currentUserId === user._id
                      ? 'cursor-not-allowed opacity-50'
                      : 'cursor-pointer hover:bg-opacity-80'
                  }`}
                >
                  <option value="user">{t.admin.user}</option>
                  <option value="admin">{t.admin.admin}</option>
                </select>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col gap-1">
                  {user.emailVerified ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                      {t.admin.verified}
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                      {t.admin.unverified}
                    </span>
                  )}
                  {user.banned && (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                      {t.admin.banned}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {formatDate(user.createdAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => handleBanToggle(user._id, user.banned || false, user.email)}
                    disabled={currentUserId === user._id || updatingUserId === user._id}
                    className={`${
                      user.banned
                        ? 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'
                        : 'text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300'
                    } ${
                      currentUserId === user._id
                        ? 'cursor-not-allowed opacity-50'
                        : ''
                    }`}
                  >
                    {user.banned ? t.admin.unban : t.admin.ban}
                  </button>
                  <button
                    onClick={() => handleDelete(user._id, user.email)}
                    disabled={currentUserId === user._id || updatingUserId === user._id}
                    className={`text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 ${
                      currentUserId === user._id
                        ? 'cursor-not-allowed opacity-50'
                        : ''
                    }`}
                  >
                    {t.admin.delete}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
