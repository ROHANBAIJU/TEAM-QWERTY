'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // Import useRouter

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter(); // Get router instance for redirecting

  const menuItems = [
    { href: '/', icon: '', text: 'Dashboard', tab: 'dashboard' },
    { href: '/analytics', icon: '', text: 'Analytics', tab: 'analytics' },
    { href: '/notes', icon: '', text: 'Patient Notes', tab: 'patient-notes' },
    {
      href: '/hardware',
      icon: '',
      text: 'Hardware Status',
      tab: 'hardware-status',
    },
    {
      href: '/profile',
      icon: '',
      text: 'Patient Profile',
      tab: 'patient-profile',
    },
    { href: '/settings', icon: '', text: 'Settings', tab: 'settings' },
  ];

  // Logout event handler
  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent the default link navigation
    localStorage.removeItem('isLoggedIn'); // Clear the authentication flag
    router.push('/login'); // Redirect to the login page
  };

  // --- Main Fix ---
  // If the user is on the login page, don't render the sidebar
  if (pathname === '/login') {
    return null;
  }

  // If not on login, render the sidebar
  return (
    <nav className="sidebar-nav">
      <div className="sidebar-header">
        <span className="logo-icon">📊</span>
        <span className="logo-text">StanceSense</span>
      </div>

      <div className="sidebar-menu">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`menu-item ${pathname === item.href ? 'active' : ''}`}
          >
            <span className="menu-icon">{item.icon}</span>
            <span className="menu-text">{item.text}</span>
          </Link>
        ))}

        {/* Updated Logout Button */}
        <a
          href="/login" // Fallback for right-click, etc.
          onClick={handleLogout}
          className="menu-item menu-item-logout"
          style={{ cursor: 'pointer' }}
        >
          <span className="menu-icon"></span>
          <span className="menu-text">Logout</span>
        </a>
      </div>
    </nav>
  );
}