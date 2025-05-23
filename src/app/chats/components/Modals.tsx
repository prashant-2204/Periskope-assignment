import React from 'react';
import { Dialog } from '@headlessui/react';
import { User } from './ChatList';
// TODO: Import types for modal data if needed
// TODO: Accept props for modal open/close state, handlers, and any required data
// TODO: Add clear comments for maintainability

interface GroupModalProps {
  open: boolean;
  onClose: () => void;
  groupName: string;
  setGroupName: (name: string) => void;
  allUsers: User[];
  groupMembers: string[];
  setGroupMembers: (members: string[] | ((prev: string[]) => string[])) => void;
  groupLoading: boolean;
  handleCreateGroup: (e: React.FormEvent) => void;
}

// Group Creation Modal
export const GroupModal = ({ open, onClose, groupName, setGroupName, allUsers, groupMembers, setGroupMembers, groupLoading, handleCreateGroup }: GroupModalProps) => (
  <Dialog open={open} onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto">
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" />
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md z-10">
        <Dialog.Title className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Create Group</Dialog.Title>
        <form onSubmit={handleCreateGroup} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Group Name"
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            className="rounded px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none"
            required
          />
          <div className="max-h-40 overflow-y-auto border rounded bg-gray-50 dark:bg-gray-700 p-2">
            {allUsers.length === 0 ? (
              <div className="text-gray-500 text-sm">No users found.</div>
            ) : (
              allUsers.map((u: User) => (
                <label key={u.id} className="flex items-center gap-2 py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={groupMembers.includes(u.id)}
                    onChange={e => {
                      setGroupMembers((members: string[]): string[] =>
                        e.target.checked
                          ? [...members, u.id]
                          : members.filter((id: string) => id !== u.id)
                      );
                    }}
                  />
                  <span className="text-gray-900 dark:text-gray-100">{u.full_name || u.email}</span>
                </label>
              ))
            )}
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={groupLoading}
              className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {groupLoading ? "Creating..." : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Dialog>
);

interface NewChatModalProps {
  open: boolean;
  onClose: () => void;
  newChatSearch: string;
  setNewChatSearch: (v: string) => void;
  newChatUsers: User[];
  newChatLoading: boolean;
  newChatError: string | null;
  handleStartChat: (u: User) => void;
}

// New Chat Modal
export const NewChatModal = ({ open, onClose, newChatSearch, setNewChatSearch, newChatUsers, newChatLoading, newChatError, handleStartChat }: NewChatModalProps) => (
  <Dialog open={open} onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto">
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" />
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md z-10">
        <Dialog.Title className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Start New Chat</Dialog.Title>
        <input
          type="text"
          placeholder="Search users..."
          value={newChatSearch}
          onChange={e => setNewChatSearch(e.target.value)}
          className="w-full mb-3 px-3 py-2 rounded border border-gray-200 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none"
        />
        <div className="max-h-60 overflow-y-auto mb-4">
          {newChatLoading ? (
            <div className="text-gray-500 text-center py-4">Loading users...</div>
          ) : newChatError ? (
            <div className="text-red-500 text-center py-4">{newChatError}</div>
          ) : newChatUsers.length === 0 ? (
            <div className="text-gray-500 text-center py-4">No users found.</div>
          ) : (
            newChatUsers
              .filter((u: User) =>
                (u.full_name || u.email).toLowerCase().includes(newChatSearch.toLowerCase())
              )
              .map((u: User) => (
                <button
                  key={u.id}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-green-50 text-left"
                  onClick={() => handleStartChat(u)}
                  disabled={newChatLoading}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                    {u.full_name?.[0] || u.email?.[0] || "U"}
                  </div>
                  <span className="text-gray-900 dark:text-gray-100">{u.full_name || u.email}</span>
                  <span className="text-xs text-gray-500">{u.email}</span>
                </button>
              ))
          )}
        </div>
        <div className="flex gap-2 justify-end mt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
            disabled={newChatLoading}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </Dialog>
);

interface AddMembersModalProps {
  open: boolean;
  onClose: () => void;
  newChatSearch: string;
  setNewChatSearch: (v: string) => void;
  newChatUsers: User[];
  newChatLoading: boolean;
  newChatError: string | null;
  selectedMembers: string[];
  setSelectedMembers: (v: string[] | ((prev: string[]) => string[])) => void;
  handleAddMembers: (ids: string[]) => void;
  selectedChat: { members?: User[] } | null;
}

// Add Members Modal
export const AddMembersModal = ({ open, onClose, newChatSearch, setNewChatSearch, newChatUsers, newChatLoading, newChatError, selectedMembers, setSelectedMembers, handleAddMembers, selectedChat }: AddMembersModalProps) => (
  <Dialog open={open} onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto">
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" />
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md z-10">
        <Dialog.Title className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Add Members to Group</Dialog.Title>
        <input
          type="text"
          placeholder="Search users..."
          value={newChatSearch}
          onChange={e => setNewChatSearch(e.target.value)}
          className="w-full mb-3 px-3 py-2 rounded border border-gray-200 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none"
        />
        <div className="max-h-60 overflow-y-auto mb-4">
          {newChatLoading ? (
            <div className="text-gray-500 text-center py-4">Loading users...</div>
          ) : newChatError ? (
            <div className="text-red-500 text-center py-4">{newChatError}</div>
          ) : newChatUsers.length === 0 ? (
            <div className="text-gray-500 text-center py-4">No users found.</div>
          ) : (
            newChatUsers
              .filter((u: User) =>
                (u.full_name || u.email).toLowerCase().includes(newChatSearch.toLowerCase()) &&
                !selectedChat?.members?.some((m: User) => m.id === u.id)
              )
              .map((u: User) => (
                <label
                  key={u.id}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-green-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(u.id)}
                    onChange={e => {
                      setSelectedMembers((prev: string[]): string[] =>
                        e.target.checked
                          ? [...prev, u.id]
                          : prev.filter(id => id !== u.id)
                      );
                    }}
                    className="rounded"
                  />
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                    {u.full_name?.[0] || u.email?.[0] || "U"}
                  </div>
                  <span className="text-gray-900 dark:text-gray-100">{u.full_name || u.email}</span>
                  <span className="text-xs text-gray-500">{u.email}</span>
                </label>
              ))
          )}
        </div>
        <div className="flex gap-2 justify-end mt-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              setSelectedMembers([]);
            }}
            className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleAddMembers(selectedMembers)}
            disabled={selectedMembers.length === 0}
            className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            Add Members
          </button>
        </div>
      </div>
    </div>
  </Dialog>
);

const Modals = () => {
  // Implementation will be filled in after extracting from page.tsx
  return null;
};

export default Modals; 