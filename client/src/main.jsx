import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { store } from './store'
import App from './App'
import Home from './pages/Home'
import RegisterForm from './components/auth/RegisterForm';
import Login from './components/auth/Login';
import './styles/main.scss'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: '/auth/register',
        element: <RegisterForm />,  // Route pour le formulaire d'inscription
      },
      {
        path: '/auth/login',
        element: <Login />,  // Nouvelle route pour le formulaire de connexion
      },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>,
)
