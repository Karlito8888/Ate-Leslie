import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// Définir l'URL de base de votre API
const baseUrl = 'http://localhost:3000' // Ajustez selon votre configuration

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ 
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      // Vous pouvez ajouter ici la logique pour les headers d'authentification
      const token = localStorage.getItem('token')
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  endpoints: () => ({}),
  // Configuration du cache par défaut
  keepUnusedDataFor: 5 * 60, // Garde les données en cache pendant 5 minutes
})

// Export des hooks qui seront générés automatiquement
export const enhancedApi = api
