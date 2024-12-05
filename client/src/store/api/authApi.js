import { api } from './baseApi'

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Inscription
    register: builder.mutation({
      query: (userData) => ({
        url: 'auth/register',
        method: 'POST',
        body: userData,
      }),
    }),

    // Connexion
    login: builder.mutation({
      query: (credentials) => ({
        url: 'auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),

    // Déconnexion
    logout: builder.mutation({
      query: () => ({
        url: 'auth/logout',
        method: 'POST',
      }),
    }),

    // Obtenir le profil
    getProfile: builder.query({
      query: () => 'auth/profile',
      providesTags: ['Profile'],
    }),

    // Mettre à jour le profil
    updateProfile: builder.mutation({
      query: (profileData) => ({
        url: 'auth/profile',
        method: 'PUT',
        body: profileData,
      }),
      invalidatesTags: ['Profile'],
    }),

    // Mot de passe oublié
    forgotPassword: builder.mutation({
      query: (email) => ({
        url: 'auth/password/forgot',
        method: 'POST',
        body: { email },
      }),
    }),

    // Réinitialisation du mot de passe
    resetPassword: builder.mutation({
      query: ({ token, password }) => ({
        url: `auth/password/reset/${token}`,
        method: 'PUT',
        body: { password },
      }),
    }),

    // Changement de mot de passe
    changePassword: builder.mutation({
      query: (passwordData) => ({
        url: 'auth/password/change',
        method: 'PUT',
        body: passwordData,
      }),
    }),
  }),
})

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
} = authApi
