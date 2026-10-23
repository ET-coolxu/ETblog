"use client";

import { useActionState, useState } from "react";
import { saveAboutAction, type SaveAboutState } from "./actions";
import styles from "./page.module.css";

const initialState: SaveAboutState = {};

/** 关于页正文表单。只把文本框交给保存动作，不读磁盘、不校验登录。 */
export function AboutForm({ initialBody }: { initialBody: string }) {
  const [state, formAction, pending] = useActionState(saveAboutAction, initialState);
  const [body, setBody] = useState(initialBody);
  const [prevInitialBody, setPrevInitialBody] = useState(initialBody);

  // 保存成功后服务端会去掉末尾空白再写回。用写盘结果对齐文本框，失败时不覆盖正在改的正文。
  if (initialBody !== prevInitialBody) {
    setPrevInitialBody(initialBody);
    setBody(initialBody);
  }

  return (
    <form action={formAction} className={styles.form}>
      <div>
        <label htmlFor="about-body" className={styles.label}>
          正文
        </label>
        <textarea
          id="about-body"
          name="body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={16}
          className={styles.body}
        />
      </div>
      {state.error ? (
        <p className={styles.alert} role="alert">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p className={styles.status} role="status">
          {state.message}
        </p>
      ) : null}
      <div>
        <button type="submit" disabled={pending} className={styles.save}>
          {pending ? "保存中…" : "保存"}
        </button>
      </div>
    </form>
  );
}
