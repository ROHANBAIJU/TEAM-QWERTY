'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { href: '/', icon: '', text: 'Dashboard', tab: 'dashboard' },
    { href: '/analytics', icon: '', text: 'Analytics', tab: 'analytics' },
    { href: '/notes', icon: '', text: 'Patient Notes', tab: 'patient-notes' },
    { href: '/hardware', icon: '', text: 'Hardware Status', tab: 'hardware-status' },
    { href: '/profile', icon: '', text: 'Patient Profile', tab: 'patient-profile' },
    { href: '/settings', icon: '', text: 'Settings', tab: 'settings' },
  ];

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
        
        <Link href="/login" className="menu-item menu-item-logout">
          <span className="menu-icon"></span>
          <span className="menu-text">Logout</span>
        </Link>
      </div>
    </nav>
  );
}
