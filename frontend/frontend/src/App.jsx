import { Routes, Route, Navigate } from "react-router-dom";

function Home() {
  return (
    <div style={{ padding: "40px" }}>
      <h1>SearchHub</h1>
      <p>Knowledge Base Platform</p>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;