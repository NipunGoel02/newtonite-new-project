import api from "./api";

export const searchDocuments = async (params, signal) => {
  const response = await api.get("/search", {
    params,
    signal,
  });

  return response.data;
};

export const getSuggestions = async (prefix, signal) => {
  const response = await api.get("/search/suggest", {
    params: { prefix },
    signal,
  });

  return response.data;
};