"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/admin/login/actions";
import styles from "./login-form.module.css";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className={styles.form}>
      <div>
        <label htmlFor="username" className={styles.label}>
          用户名
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          className={styles.field}
        />
      </div>
      <div>
        <label htmlFor="password" className={styles.label}>
          密码
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={styles.field}
        />
        {state.error ? (
          <p className={styles.alert} role="alert">
            {state.error}
          </p>
        ) : null}
      </div>
      <button type="submit" disabled={pending} className={styles.submit}>
        {pending ? "登录中…" : "登录"}
      </button>
    </form>
  );
}
