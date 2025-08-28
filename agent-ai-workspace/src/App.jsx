import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Welcome from './pages/Welcome'
import Dashboard from './pages/Dashboard'
import CreateAgent from './pages/CreateAgent'
import AgentDetail from './pages/AgentDetail'
import Chat from './pages/Chat'
import Credentials from './pages/Credentials'
import Loading from './components/Loading'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return <Loading />
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/create-agent" element={<CreateAgent />} />
        <Route path="/agent/:id" element={<AgentDetail />} />
        <Route path="/agent/:id/chat" element={<Chat />} />
        <Route path="/credentials" element={<Credentials />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
