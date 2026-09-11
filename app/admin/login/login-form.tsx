"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/admin/login/actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="mt-10 space-y-6">
      <div>
        <label htmlFor="username" className="block text-sm text-muted">
          用户名
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          className="mt-1 w-full border-b border-rule bg-transparent py-2 text-ink outline-none"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm text-muted">
          密码
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1 w-full border-b border-rule bg-transparent py-2 text-ink outline-none"
        />
      </div>
      {state.error ? (
        <p className="text-sm text-pine" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="text-pine hover:text-ink disabled:text-muted"
      >
        {pending ? "登录中…" : "登录"}
      </button>
    </form>
  );
}
