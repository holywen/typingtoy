'use client';

import { useState, useEffect } from 'react';
import { GameType } from '@/types/multiplayer';
import { getPlayerDisplayName } from '@/lib/services/deviceId';
import RoomList from './RoomList';
import CreateRoomDialog from './CreateRoomDialog';
import QuickMatchButton from './QuickMatchButton';
import ChatBox from './ChatBox';
import OnlinePlayerList from './OnlinePlayerList';

interface GameLobbyProps {
  deviceIdentity: any;
  session: any;
}

export default function GameLobby({ deviceIdentity, session }: GameLobbyProps) {
  const displayName = getPlayerDisplayName(session?.user, deviceIdentity);
  const [selectedGameType, setSelectedGameType] = useState<GameType>('falling-blocks');
  const [showCreateRoom, setShowCreateRoom] = useState(false);

  const gameTypes: { value: GameType; label: string; description: string }[] = [
    {
      value: 'falling-blocks',
      label: 'Falling Blocks',
      description: 'Type letters before they hit the ground',
    },
    {
      value: 'blink',
      label: 'Blink',
      description: 'Type the displayed character quickly',
    },
    {
      value: 'typing-walk',
      label: 'Typing Walk',
      description: 'Navigate the grid by typing correctly',
    },
    {
      value: 'falling-words',
      label: 'Falling Words',
      description: 'Complete words before they fall',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Multiplayer Lobby
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Playing as: <span className="font-semibold">{displayName}</span>
            </p>
          </div>
        </div>

        {/* Game Type Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {gameTypes.map((game) => (
            <button
              key={game.value}
              onClick={() => setSelectedGameType(game.value)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedGameType === game.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
              }`}
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                {game.label}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {game.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Rooms and Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action Buttons */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setShowCreateRoom(true)}
                className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Room
              </button>

              <QuickMatchButton
                gameType={selectedGameType}
                playerId={deviceIdentity?.deviceId}
                displayName={displayName}
              />
            </div>
          </div>

          {/* Room List */}
          <RoomList
            gameType={selectedGameType}
            playerId={deviceIdentity?.deviceId}
            displayName={displayName}
          />
        </div>

        {/* Right Column - Chat and Online Players */}
        <div className="space-y-6">
          <OnlinePlayerList />
          <ChatBox
            playerId={deviceIdentity?.deviceId}
            displayName={displayName}
          />
        </div>
      </div>

      {/* Create Room Dialog */}
      {showCreateRoom && (
        <CreateRoomDialog
          gameType={selectedGameType}
          playerId={deviceIdentity?.deviceId}
          displayName={displayName}
          onClose={() => setShowCreateRoom(false)}
        />
      )}
    </div>
  );
}
