// Shared helpers for calls to the Express /ai routes.

export const aiHeaders = () => {
  const token = JSON.parse(localStorage.getItem("token"));
  return {
    Authorization: `Bearer ${token}`,
    'X-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
  }
}

export const errorMessage = (error, fallback) => {
  return error.response?.data?.message || fallback;
}
