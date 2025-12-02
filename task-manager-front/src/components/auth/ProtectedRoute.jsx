import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuthStore()

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.5rem',
        color: '#667eea'
      }}>
        Cargando...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute