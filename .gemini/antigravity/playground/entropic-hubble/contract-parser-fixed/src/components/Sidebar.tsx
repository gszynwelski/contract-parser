"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Receipt, History, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import styles from "./Sidebar.module.css";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    { name: "Contratos PDF", href: "/", icon: FileText },
    { name: "Recebimentos", href: "/recebimentos", icon: Receipt },
    { name: "Histórico", href: "/historico", icon: History },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>G</div>
        <span className={styles.logoText}>GestãoPro</span>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ""}`}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        {session?.user && (
          <div className={styles.userInfo}>
            {session.user.image ? (
              <img src={session.user.image} alt="" className={styles.avatar} />
            ) : (
              <div className={styles.avatarFallback}>
                {session.user.name?.[0] || session.user.email?.[0]}
              </div>
            )}
            <div className={styles.userDetails}>
              <span className={styles.userName}>{session.user.name}</span>
            </div>
          </div>
        )}
        <button className={styles.logoutBtn} onClick={() => signOut()}>
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  );
}
