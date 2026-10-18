// MOCK - remaining until Phase 3.
// Chat, history and memories now come from the real /ai endpoints (Phase 2).
// Only the follow-up text for action cards is still mocked; Phase 3 deletes this file.

const assistant = (fields) => ({
  _id: `m-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  role: 'assistant',
  createdAt: new Date().toISOString(),
  ...fields,
});

export const mockActionFollowUp = (action, status) => {
  const messages = {
    confirmed: {
      update_game: 'Done. Your game has been updated.',
      delete_session: 'Done. The session was deleted.',
    },
    cancelled: 'Cancelled. Nothing was changed.',
    undone: 'Undone. The session was removed and your playtime restored.',
  };
  const text = status === 'confirmed' ? messages.confirmed[action.type] : messages[status];
  return assistant({ text });
}
