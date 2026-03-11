"use client";

import { signIn } from "next-auth/react";
import styles from "./login.module.css";

export default function LoginPage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>G</div>
          <span className={styles.logoText}>GestãoPro</span>
        </div>
        <h1 className={styles.title}>Bem-vindo</h1>
        <p className={styles.subtitle}>
          Faça login para gerenciar contratos e recebimentos.
        </p>
        <button
          className={styles.loginBtn}
          onClick={() => signIn("google", { callbackUrl: "/" })}
        >
          <img
            src="https://authjs.dev/img/providers/google.svg"
            alt="Google"
            width={20}
            height={20}
          />
          Entrar com Google
        </button>
      </div>
    </div>
  );
}
