import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

function Home() {
  return (
    <div style={{ padding: "40px" }}>
      <h1>SearchHub</h1>
      <p>Knowledge Base Platform</p>
    </div>
  );
}

function Dashboard() {
  return (
    <div style={{ padding: "40px" }}>
      <h1>Dashboard</h1>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;