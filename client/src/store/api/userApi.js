import { api } from './baseApi'

export const userApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Obtenir le profil de l'utilisateur
    getProfile: builder.query({
      query: () => 'users/profile',
    }),
    
    // Connexion
    login: builder.mutation({
      query: (credentials) => ({
        url: 'auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    
    // Inscription
    register: builder.mutation({
      query: (userData) => ({
        url: 'auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetProfileQuery,
  useLoginMutation,
  useRegisterMutation,
} = userApi
