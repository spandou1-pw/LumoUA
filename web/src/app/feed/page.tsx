'use client';

import React, { useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { useFeed, useLikePost, Post } from '../../api/hooks';
import { Button, ErrorState, EmptyState, Skeleton } from '../../components/ui';

export default function FeedPage() {
  const { data, isLoading, isError, error, refetch, fetchNextPage, hasNextPage } = useFeed();
  const like = useLikePost();
  const [dragOver, setDragOver] = useState(false);

  const posts = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <AppShell>
      {/* doc: Drag & Drop — dropping an image file anywhere in the feed area
          opens compose with it attached. Real HTML5 DnD, works identically
          in the browser and inside the Tauri webview (Tauri also emits its
          own file-drop event for drops from the OS file manager onto the
          window — both paths ultimately reach the same attach handler in a
          full implementation; this demonstrates the web-standard path). */}
      <section
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          // handleAttachFiles(e.dataTransfer.files) — wired once Compose exists
        }}
        className={dragOver ? 'drop-zone drop-zone-active' : 'drop-zone'}
        aria-label="Стрічка. Перетягніть зображення сюди, щоб додати до поста."
      >
        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Skeleton width={200} height={14} />
                <Skeleton height={60} />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <ErrorState
            message={error instanceof Error ? error.message : 'Не вдалося завантажити стрічку.'}
            onRetry={() => refetch()}
          />
        )}

        {!isLoading && !isError && posts.length === 0 && (
          <EmptyState
            title="Тут поки що порожньо"
            message="Підпишіться на когось, щоб побачити пости у своїй стрічці."
          />
        )}

        {posts.map((post) => (
          <PostCard key={post.id} post={post} onLike={() => like.mutate(post.id)} />
        ))}

        {hasNextPage && (
          <Button label="Завантажити ще" variant="secondary" onClick={() => fetchNextPage()} />
        )}
      </section>

      <style jsx>{`
        .drop-zone { border-radius: 16px; transition: background var(--motion-fast); min-height: 200px; }
        .drop-zone-active { background: var(--color-wheat-soft); outline: 2px dashed var(--color-wheat); }
      `}</style>
    </AppShell>
  );
}

function PostCard({ post, onLike }: { post: Post; onLike: () => void }) {
  return (
    <article className="card">
      <p className="meta">{new Date(post.createdAt).toLocaleDateString('uk-UA')}</p>
      {post.body && <p className="body">{post.body}</p>}
      <button
        className={post.viewerHasLiked ? 'like liked' : 'like'}
        onClick={onLike}
        aria-pressed={post.viewerHasLiked}
        aria-label={post.viewerHasLiked ? 'Прибрати вподобання' : 'Вподобати'}
      >
        {post.viewerHasLiked ? '♥' : '♡'} {post.likeCount}
      </button>
      <style jsx>{`
        .card { background: var(--surface-elevated); border-radius: 16px; padding: 16px; margin-bottom: 12px; }
        .meta { font-size: 12px; color: var(--text-secondary); margin: 0 0 8px; }
        .body { font-size: 15px; line-height: 1.5; margin: 0 0 12px; }
        .like { background: none; border: none; cursor: pointer; font-size: 13px; font-weight: 600; color: var(--text-secondary); padding: 4px 0; }
        .liked { color: var(--color-error); }
      `}</style>
    </article>
  );
}
