import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/context/auth/AuthProvider.jsx'
import { router } from '@/routes/index.jsx'

/**
 * App root. Global providers wrap the router so every route has access to the
 * authenticated session (and, later, toast/socket providers).
 */
export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
