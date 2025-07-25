import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  LayoutDashboard,
  Bot,
  Phone,
  BarChart3,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  Bell,
  PhoneCall,
  Clock,
  Mic,
  PhoneOff,
  Archive,
} from "lucide-react";

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      console.log("Logout clicked");
      setUserMenuOpen(false);
      await logout();
      console.log("Logout completed, navigating to login");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Agents", href: "/agents", icon: Bot },
    { name: "Phone Numbers", href: "/phone-numbers", icon: Phone },
    {
      name: "Telephony",
      href: "#",
      icon: PhoneCall,
      children: [
        { name: "Active Calls", href: "/calls/active", icon: PhoneCall },
        { name: "Call Queues", href: "/calls/queues", icon: Clock },
        { name: "Recordings", href: "/calls/recordings", icon: Mic },
        { name: "Missed Calls", href: "/calls/missed", icon: PhoneOff },
        { name: "Post-Call", href: "/calls/post-call", icon: Archive },
      ],
    },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
  ];

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:flex-shrink-0`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">
                VoiceFlow
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 mt-6 px-3 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              const hasChildren = item.children && item.children.length > 0;
              const isChildActive =
                hasChildren &&
                item.children.some((child) => location.pathname === child.href);

              if (hasChildren) {
                return (
                  <div key={item.name} className="mb-2">
                    <div
                      className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                        isChildActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <Icon
                        className={`mr-3 h-5 w-5 ${
                          isChildActive
                            ? "text-blue-700"
                            : "text-gray-400 group-hover:text-gray-500"
                        }`}
                      />
                      {item.name}
                    </div>
                    <div className="ml-6 mt-1 space-y-1">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildItemActive =
                          location.pathname === child.href;

                        return (
                          <Link
                            key={child.name}
                            to={child.href}
                            className={`group flex items-center px-3 py-2 text-xs font-medium rounded-md ${
                              isChildItemActive
                                ? "bg-blue-100 text-blue-800 border-r-2 border-blue-700"
                                : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                            }`}
                            onClick={() => setSidebarOpen(false)}
                          >
                            <ChildIcon
                              className={`mr-3 h-4 w-4 ${
                                isChildItemActive
                                  ? "text-blue-800"
                                  : "text-gray-400 group-hover:text-gray-500"
                              }`}
                            />
                            {child.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md mb-1 ${
                    isActive
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon
                    className={`mr-3 h-5 w-5 ${
                      isActive
                        ? "text-blue-700"
                        : "text-gray-400 group-hover:text-gray-500"
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 lg:hidden"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-1 rounded-full text-gray-400 hover:text-gray-500">
                <Bell className="w-5 h-5" />
              </button>

              <div className="relative" ref={userMenuRef}>
                <button 
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-md text-sm text-gray-700 hover:bg-gray-100"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="hidden sm:block">
                    {user?.name || user?.email}
                  </span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
