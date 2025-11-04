'use client';

import { useState, useEffect, useRef } from 'react';
import { emitSocketEvent, onSocketEvent, offSocketEvent } from '@/lib/services/socketClient';

interface ChatMessage {
  playerId: string;
  displayName: string;
  message: string;
  timestamp: number;
  type?: 'system' | 'user';
}

interface ChatBoxProps {
  playerId: string;
  displayName: string;
  roomId?: string; // If provided, shows room chat; otherwise shows lobby chat
}

export default function ChatBox({ playerId, displayName, roomId }: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listen for chat messages
  useEffect(() => {
    const handleChatMessage = (data: ChatMessage) => {
      setMessages((prev) => [...prev, data]);
    };

    const handleChatError = (data: { error: string }) => {
      setError(data.error);
      setTimeout(() => setError(null), 3000);
    };

    const cleanupMessage = onSocketEvent('chat:message', handleChatMessage);
    const cleanupError = onSocketEvent('chat:error', handleChatError);

    return () => {
      cleanupMessage();
      cleanupError();
    };
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputMessage.trim() || isSending) return;

    setIsSending(true);
    setError(null);

    emitSocketEvent(
      'chat:send',
      {
        message: inputMessage.trim(),
        roomId,
      },
      (response) => {
        setIsSending(false);
        if (response.success) {
          setInputMessage('');
        } else {
          setError(response.error || 'Failed to send message');
          setTimeout(() => setError(null), 3000);
        }
      }
    );
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col h-[500px]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {roomId ? 'Room Chat' : 'Lobby Chat'}
        </h2>
        <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>

      {error && (
        <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`${
                msg.type === 'system'
                  ? 'text-center'
                  : msg.playerId === playerId
                  ? 'flex justify-end'
                  : 'flex justify-start'
              }`}
            >
              {msg.type === 'system' ? (
                <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-300">
                  {msg.message}
                </div>
              ) : (
                <div
                  className={`max-w-[80%] ${
                    msg.playerId === playerId
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  } rounded-lg px-3 py-2`}
                >
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xs font-semibold">
                      {msg.playerId === playerId ? 'You' : msg.displayName}
                    </span>
                    <span className={`text-xs ${
                      msg.playerId === playerId
                        ? 'text-blue-200'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm break-words">{msg.message}</p>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message..."
          maxLength={200}
          disabled={isSending}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || isSending}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {isSending ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
