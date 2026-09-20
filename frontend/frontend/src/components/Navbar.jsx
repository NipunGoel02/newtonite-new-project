import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar-brand">
        SearchHub
      </Link>

      <div className="navbar-links">
        <Link to="/dashboard">Dashboard</Link>

        <Link to="/search">Search</Link>

        {isAdmin && (
          <Link to="/admin/documents">
            Admin
          </Link>
        )}

        <span className="navbar-user">
          {user?.name || user?.email}
        </span>

        <button onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}