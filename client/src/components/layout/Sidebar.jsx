import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  FileText,
  User,
  LogOut,
  BrainCircuit,
  BookOpen,
  X,
  AlertCircle,
} from "lucide-react";

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const handleConfirmLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinks = [
    { to: "/dashboard", icon: LayoutDashboard, text: "Dashboard" },
    { to: "/documents", icon: FileText, text: "Documents" },
    { to: "/flashcards", icon: BookOpen, text: "Flashcards" },
    { to: "/profile", icon: User, text: "Profile" },
  ];

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/30 z-40 md:hidden transition-opacity duration-300 ${
          isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={toggleSidebar}
        aria-hidden="true"
      ></div>
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white/90 backdrop-blur-lg border-r border-slate-200/60 z-50 md:relative md:w-64 md:shrink-0 md:flex md:flex-col md:translate-x-0 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo and Close button for mobile */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-200/60">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-linear-to-br from-emerald-400 to-teal-500 shadow-md shadow-emerald-500/20">
              <BrainCircuit
                className="text-white"
                size={20}
                strokeWidth={2.5}
              />
            </div>
            <h1 className="text-sm md:text-base font-bold text-slate-900 tracking-tight">
              Cortex Lab
            </h1>
          </div>
          <button
            className="md:hidden text-slate-500 hover:text-slate-800"
            onClick={toggleSidebar}
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1.5">
          {navLinks.map((link) => {
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={toggleSidebar}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-linear-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  }`
                }
              >
                {({ isActive }) => {
                  return (
                    <>
                      <link.icon
                        size={18}
                        strokeWidth={2.5}
                        className={`transition-transform duration-200 ${
                          isActive ? "" : "group-hover:scale-110"
                        }`}
                      />
                      {link.text}
                    </>
                  );
                }}
              </NavLink>
            );
          })}
        </nav>

        {/* Logout Section */}
        <div className="px-3 py-4 border-t border-slate-200/60">
          <button
            onClick={handleLogoutClick}
            className="group flex items-center gap-3 w-full px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200"
          >
            <LogOut
              size={18}
              strokeWidth={2.5}
              className="transition-transform duration-200 group-hover:scale-110"
            />
            Logout
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-2xl shadow-slate-900/20 p-8">
            {/* Close button */}
            <button
              onClick={() => setIsLogoutModalOpen(false)}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200"
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </button>

            {/* Modal Header */}
            <div className="mb-6">
              <div className="w-12 h-12 rounded-xl bg-linear-to-r from-amber-100 to-orange-100 flex items-center justify-center mb-4">
                <AlertCircle
                  className="w-6 h-6 text-amber-600"
                  strokeWidth={2}
                />
              </div>
              <h2 className="text-xl font-medium text-slate-900 tracking-tight">
                Confirm Logout
              </h2>
            </div>

            {/* Content */}
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to logout? You'll need to login again to access your account.
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 h-11 px-4 border-2 border-slate-200 rounded-xl bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 h-11 px-4 bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-amber-500/25 active:scale-[0.98]"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
