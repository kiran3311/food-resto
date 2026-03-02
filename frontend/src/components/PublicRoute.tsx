import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const PublicRoute = (): JSX.Element => {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <div className="min-h-screen" />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};