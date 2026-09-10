import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between bg-teal-100 px-4 py-3">
        <span className="text-lg text-teal-800">{user?.displayName}</span>
        <button
          type="button"
          onClick={() => void logout()}
          className="rounded-lg px-3 py-2 text-teal-700 hover:bg-teal-200"
        >
          Log out
        </button>
      </header>
      <Outlet />
    </div>
  );
}
