import type { Metadata } from "next";
import Link from "next/link";
import {
  formatPostDate,
  getLatestFleetPost,
  listPublishedPosts,
  tagHref,
  type PostMeta,
} from "@/lib/posts";
import styles from "./page.module.css";

/**
 * 专栏文章在运行时的 content 卷里，镜像构建时的预渲染不能当这一页的列表。
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "专栏",
};

const COLUMNS = [
  {
    id: "column-record",
    tag: "记录",
    title: "实践记录",
    intro: "记录个人实践的过程、问题和结论。",
  },
  {
    id: "column-fleet",
    tag: "舰队",
    title: "AI 助手舰队",
    intro: "这支 bot 舰队里谁负责什么、彼此怎么接力，每月更新一次。",
    fleet: true,
  },
  {
    id: "column-weekly",
    tag: "Bot周报",
    title: "Bot 周报",
    intro: "Bot周报，记录bot实践、优化和迭代历程。",
  },
] as const;

const NEWS = {
  id: "column-news",
  tag: "资讯",
  title: "资讯",
  intro: "AI 资讯速览，每几天一辑。",
};

const COLUMN_LIMIT = 3;
const EMPTY_POSTS = "还没有文章，第一篇在路上。";
const EMPTY_FLEET = "舰队介绍还在整理中。";

export default async function ColumnsPage() {
  const [posts, fleetLatest] = await Promise.all([
    listPublishedPosts(),
    getLatestFleetPost(),
  ]);

  const news = posts.filter((post) => post.tags.includes(NEWS.tag)).slice(0, COLUMN_LIMIT);

  return (
    <main className={`measure ${styles.page}`}>
      <header className={styles.head}>
        <h1 className={styles.title}>专栏</h1>
        <p className={styles.lead}>舰队产出、作者审过的三类内容。</p>
      </header>
      <div className={styles.cols}>
        {COLUMNS.map((column) => {
          const matched = posts.filter((post) => post.tags.includes(column.tag));
          return (
            <section key={column.tag} className={styles.card} aria-labelledby={column.id}>
              <div className={styles.cardHead}>
                <h2 id={column.id} className={styles.cardTitle}>
                  {column.title}
                  <span className={styles.count}> · {matched.length} 篇</span>
                </h2>
                {matched.length > 0 ? (
                  <Link href={tagHref(column.tag)} className={styles.more}>
                    {"fleet" in column ? "往期 →" : "全部 →"}
                  </Link>
                ) : null}
              </div>
              <p className={styles.intro}>{column.intro}</p>
              {"fleet" in column ? (
                fleetLatest ? (
                  <div className={styles.fleetRow}>
                    <p className={styles.fleetMeta}>
                      更新于{" "}
                      <b>
                        <time dateTime={fleetLatest.post.date}>
                          {formatPostDate(fleetLatest.post.date)}
                        </time>
                      </b>
                      {" · "}
                      <b>{fleetLatest.botCount}</b> 个 bot
                    </p>
                    <Link href="/fleet" className={styles.go}>
                      查看舰队 →
                    </Link>
                  </div>
                ) : (
                  <p className={styles.empty}>{EMPTY_FLEET}</p>
                )
              ) : matched.length > 0 ? (
                <PostList posts={matched.slice(0, COLUMN_LIMIT)} />
              ) : (
                <p className={styles.empty}>{EMPTY_POSTS}</p>
              )}
            </section>
          );
        })}
      </div>
      <section className={styles.news} aria-labelledby={NEWS.id}>
        <div className={styles.newsHead}>
          <h2 id={NEWS.id} className={styles.newsTitle}>
            {NEWS.title}
          </h2>
          <p className={styles.newsIntro}>{NEWS.intro}</p>
        </div>
        {news.length > 0 ? (
          <ul className={styles.newsList}>
            {news.map((post) => (
              <li key={post.slug}>
                <Link href={`/posts/${post.slug}`}>{post.title}</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>{EMPTY_POSTS}</p>
        )}
        {news.length > 0 ? (
          <Link href={tagHref(NEWS.tag)} className={styles.more}>
            全部 →
          </Link>
        ) : null}
      </section>
    </main>
  );
}

function PostList({ posts }: { posts: PostMeta[] }) {
  return (
    <ol className={styles.list}>
      {posts.map((post) => (
        <li key={post.slug} className={styles.item}>
          <time dateTime={post.date}>{formatPostDate(post.date)}</time>
          <h3>
            <Link href={`/posts/${post.slug}`}>{post.title}</Link>
          </h3>
          {post.summary ? <p>{post.summary}</p> : null}
        </li>
      ))}
    </ol>
  );
}
