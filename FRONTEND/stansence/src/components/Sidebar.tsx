'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const menuItems = [
    { href: '/', icon: '/icons/dashboard.svg', text: 'Dashboard', tab: 'dashboard' },
    { href: '/analytics', icon: '/icons/analytics.svg', text: 'Analytics', tab: 'analytics' },
    { href: '/games', icon: '/icons/games.svg', text: 'Games', tab: 'games' },
    { href: '/rewards-hub', icon: '🎁', text: 'Rewards', tab: 'rewards' },
    { href: '/notes', icon: '/icons/notes.svg', text: 'Patient Notes', tab: 'patient-notes' },
    {
      href: '/hardware',
      icon: '/icons/hardware.svg',
      text: 'Hardware Status',
      tab: 'hardware-status',
    },
    {
      href: '/profile',
      icon: '/icons/profile.svg',
      text: 'Patient Profile',
      tab: 'patient-profile',
    },
    { href: '/settings', icon: '/icons/settings.svg', text: 'Settings', tab: 'settings' },
  ];

  // Logout event handler
  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await logout();
    router.push('/login');
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
        <span className="logo-icon">
          <Image 
            src="/icons/StanceSense.svg"
            alt="StanceSense"
            width={32}
            height={32}
          />
        </span>
        <span className="logo-text">StanceSense</span>
      </div>

      <div className="sidebar-menu">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`menu-item ${pathname === item.href ? 'active' : ''}`}
          >
            <span className="menu-icon">
              {(item.icon.endsWith('.svg') || item.icon.endsWith('.png')) ? (
                <Image 
                  src={item.icon} 
                  alt={item.text}
                  width={20}
                  height={20}
                />
              ) : (
                item.icon
              )}
            </span>
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
          <span className="menu-icon">
            <Image 
              src="/icons/logout.svg"
              alt="Logout"
              width={20}
              height={20}
            />
          </span>
          <span className="menu-text">Logout</span>
        </a>
      </div>
    </nav>
  );
}