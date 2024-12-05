import { createSlice } from '@reduxjs/toolkit'
import { authApi } from '../api/authApi'

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      localStorage.removeItem('token')
    },
  },
  extraReducers: (builder) => {
    builder
      // Après une connexion réussie
      .addMatcher(
        authApi.endpoints.login.matchFulfilled,
        (state, { payload }) => {
          state.token = payload.token
          state.isAuthenticated = true
          localStorage.setItem('token', payload.token)
        }
      )
      // Après avoir obtenu le profil
      .addMatcher(
        authApi.endpoints.getProfile.matchFulfilled,
        (state, { payload }) => {
          state.user = payload.user
        }
      )
      // Après une déconnexion réussie
      .addMatcher(
        authApi.endpoints.logout.matchFulfilled,
        (state) => {
          state.user = null
          state.token = null
          state.isAuthenticated = false
          localStorage.removeItem('token')
        }
      )
  },
})

export const { logout } = authSlice.actions
export default authSlice.reducer

// Sélecteurs
export const selectCurrentUser = (state) => state.auth.user
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated
export const selectToken = (state) => state.auth.token
