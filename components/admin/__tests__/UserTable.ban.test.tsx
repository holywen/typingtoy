import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserTable from '../UserTable';
import { useLanguage } from '@/lib/i18n/LanguageContext';

// Mock the language context
jest.mock('@/lib/i18n/LanguageContext', () => ({
  useLanguage: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock window methods
global.confirm = jest.fn();
global.prompt = jest.fn();
global.alert = jest.fn();

describe('UserTable - Ban Functionality', () => {
  const mockUsers = [
    {
      _id: '1',
      email: 'user1@example.com',
      name: 'User One',
      role: 'user' as const,
      createdAt: '2024-01-01T00:00:00.000Z',
      emailVerified: '2024-01-01T00:00:00.000Z',
      banned: false,
    },
    {
      _id: '2',
      email: 'banned@example.com',
      name: 'Banned User',
      role: 'user' as const,
      createdAt: '2024-01-01T00:00:00.000Z',
      emailVerified: '2024-01-01T00:00:00.000Z',
      banned: true,
      banReason: 'Spamming',
    },
    {
      _id: '3',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin' as const,
      createdAt: '2024-01-01T00:00:00.000Z',
      emailVerified: '2024-01-01T00:00:00.000Z',
      banned: false,
    },
  ];

  const mockTranslations = {
    admin: {
      user: 'User',
      admin: 'Admin',
      verified: 'Verified',
      unverified: 'Unverified',
      banned: 'Banned',
      ban: 'Ban',
      unban: 'Unban',
      delete: 'Delete',
      confirmBan: 'Are you sure you want to ban this user?',
      confirmUnban: 'Are you sure you want to unban this user?',
      confirmRoleChange: 'Are you sure you want to change this user\'s role to {role}?',
      confirmDeleteUser: 'Are you sure you want to delete the user {email}?',
      banReason: 'Ban Reason',
      noName: 'No Name',
    },
    multiplayer: {
      you: 'You',
    },
  };

  const mockOnUpdateUser = jest.fn();
  const mockOnDeleteUser = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useLanguage as jest.Mock).mockReturnValue({ t: mockTranslations });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Success' }),
    });
  });

  describe('Ban Status Display', () => {
    it('should not show banned badge for non-banned users', () => {
      render(
        <UserTable
          users={[mockUsers[0]]}
          onUpdateUser={mockOnUpdateUser}
          onDeleteUser={mockOnDeleteUser}
          currentUserId="999"
        />
      );

      expect(screen.queryByText('Banned')).not.toBeInTheDocument();
    });

    it('should show banned badge for banned users', () => {
      render(
        <UserTable
          users={[mockUsers[1]]}
          onUpdateUser={mockOnUpdateUser}
          onDeleteUser={mockOnDeleteUser}
          currentUserId="999"
        />
      );

      expect(screen.getByText('Banned')).toBeInTheDocument();
    });

    it('should show Ban button for non-banned users', () => {
      render(
        <UserTable
          users={[mockUsers[0]]}
          onUpdateUser={mockOnUpdateUser}
          onDeleteUser={mockOnDeleteUser}
          currentUserId="999"
        />
      );

      expect(screen.getByRole('button', { name: 'Ban' })).toBeInTheDocument();
    });

    it('should show Unban button for banned users', () => {
      render(
        <UserTable
          users={[mockUsers[1]]}
          onUpdateUser={mockOnUpdateUser}
          onDeleteUser={mockOnDeleteUser}
          currentUserId="999"
        />
      );

      expect(screen.getByRole('button', { name: 'Unban' })).toBeInTheDocument();
    });
  });

  describe('Ban User Flow', () => {
    it('should ban user when Ban button is clicked and confirmed', async () => {
      (global.confirm as jest.Mock).mockReturnValue(true);
      (global.prompt as jest.Mock).mockReturnValue('Inappropriate behavior');

      render(
        <UserTable
          users={[mockUsers[0]]}
          onUpdateUser={mockOnUpdateUser}
          onDeleteUser={mockOnDeleteUser}
          currentUserId="999"
        />
      );

      const banButton = screen.getByRole('button', { name: 'Ban' });
      fireEvent.click(banButton);

      await waitFor(() => {
        expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to ban this user?');
        expect(global.prompt).toHaveBeenCalledWith('Ban Reason:', '');
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/users/1/ban',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              banned: true,
              banReason: 'Inappropriate behavior',
            }),
          })
        );
      });

      await waitFor(() => {
        expect(mockOnUpdateUser).toHaveBeenCalledWith('1', {
          banned: true,
          banReason: 'Inappropriate behavior',
        });
      });
    });

    it('should use default reason if no reason provided', async () => {
      (global.confirm as jest.Mock).mockReturnValue(true);
      (global.prompt as jest.Mock).mockReturnValue('');

      render(
        <UserTable
          users={[mockUsers[0]]}
          onUpdateUser={mockOnUpdateUser}
          onDeleteUser={mockOnDeleteUser}
          currentUserId="999"
        />
      );

      const banButton = screen.getByRole('button', { name: 'Ban' });
      fireEvent.click(banButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/users/1/ban',
          expect.objectContaining({
            body: JSON.stringify({
              banned: true,
              banReason: 'No reason provided',
            }),
          })
        );
      });
    });

    it('should not ban user if not confirmed', async () => {
      (global.confirm as jest.Mock).mockReturnValue(false);

      render(
        <UserTable
          users={[mockUsers[0]]}
          onUpdateUser={mockOnUpdateUser}
          onDeleteUser={mockOnDeleteUser}
          currentUserId="999"
        />
      );

      const banButton = screen.getByRole('button', { name: 'Ban' });
      fireEvent.click(banButton);

      await waitFor(() => {
        expect(global.confirm).toHaveBeenCalled();
      });

      expect(global.prompt).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
      expect(mockOnUpdateUser).not.toHaveBeenCalled();
    });
  });

  describe('Unban User Flow', () => {
    it('should unban user when Unban button is clicked and confirmed', async () => {
      (global.confirm as jest.Mock).mockReturnValue(true);

      render(
        <UserTable
          users={[mockUsers[1]]}
          onUpdateUser={mockOnUpdateUser}
          onDeleteUser={mockOnDeleteUser}
          currentUserId="999"
        />
      );

      const unbanButton = screen.getByRole('button', { name: 'Unban' });
      fireEvent.click(unbanButton);

      await waitFor(() => {
        expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to unban this user?');
      });

      expect(global.prompt).not.toHaveBeenCalled();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/users/2/ban',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              banned: false,
              banReason: undefined,
            }),
          })
        );
      });

      await waitFor(() => {
        expect(mockOnUpdateUser).toHaveBeenCalledWith('2', {
          banned: false,
          banReason: undefined,
        });
      });
    });

    it('should not unban user if not confirmed', async () => {
      (global.confirm as jest.Mock).mockReturnValue(false);

      render(
        <UserTable
          users={[mockUsers[1]]}
          onUpdateUser={mockOnUpdateUser}
          onDeleteUser={mockOnDeleteUser}
          currentUserId="999"
        />
      );

      const unbanButton = screen.getByRole('button', { name: 'Unban' });
      fireEvent.click(unbanButton);

      await waitFor(() => {
        expect(global.confirm).toHaveBeenCalled();
      });

      expect(global.fetch).not.toHaveBeenCalled();
      expect(mockOnUpdateUser).not.toHaveBeenCalled();
    });
  });

  describe('Ban/Unban Button State', () => {
    it('should disable ban button for current user', () => {
      render(
        <UserTable
          users={[mockUsers[0]]}
          onUpdateUser={mockOnUpdateUser}
          onDeleteUser={mockOnDeleteUser}
          currentUserId="1"
        />
      );

      const banButton = screen.getByRole('button', { name: 'Ban' });
      expect(banButton).toBeDisabled();
    });

    it('should enable ban button for other users', () => {
      render(
        <UserTable
          users={[mockUsers[0]]}
          onUpdateUser={mockOnUpdateUser}
          onDeleteUser={mockOnDeleteUser}
          currentUserId="999"
        />
      );

      const banButton = screen.getByRole('button', { name: 'Ban' });
      expect(banButton).not.toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should show error alert when ban API fails', async () => {
      (global.confirm as jest.Mock).mockReturnValue(true);
      (global.prompt as jest.Mock).mockReturnValue('Test reason');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Cannot ban admin users' }),
      });

      render(
        <UserTable
          users={[mockUsers[0]]}
          onUpdateUser={mockOnUpdateUser}
          onDeleteUser={mockOnDeleteUser}
          currentUserId="999"
        />
      );

      const banButton = screen.getByRole('button', { name: 'Ban' });
      fireEvent.click(banButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Error: Cannot ban admin users');
      });

      expect(mockOnUpdateUser).not.toHaveBeenCalled();
    });

    it('should show error alert when network request fails', async () => {
      (global.confirm as jest.Mock).mockReturnValue(true);
      (global.prompt as jest.Mock).mockReturnValue('Test reason');
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(
        <UserTable
          users={[mockUsers[0]]}
          onUpdateUser={mockOnUpdateUser}
          onDeleteUser={mockOnDeleteUser}
          currentUserId="999"
        />
      );

      const banButton = screen.getByRole('button', { name: 'Ban' });
      fireEvent.click(banButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Failed to update ban status');
      });

      expect(mockOnUpdateUser).not.toHaveBeenCalled();
    });
  });
});
