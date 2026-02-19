'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Bookmark = {
  id: string;
  title: string;
  url: string;
  created_at: string;
};

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  // Get session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Fetch bookmarks
  const fetchBookmarks = async () => {
    const { data } = await supabase
      .from('bookmarks')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setBookmarks(data);
  };

useEffect(() => {
  if (!session) return;

  fetchBookmarks();

  const channel = supabase
    .channel('realtime-bookmarks')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bookmarks' },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          setBookmarks((prev) => [payload.new as Bookmark, ...prev]);
        }

        if (payload.eventType === 'DELETE') {
          setBookmarks((prev) =>
            prev.filter((b) => b.id !== (payload.old as any).id)
          );
        }

        if (payload.eventType === 'UPDATE') {
          setBookmarks((prev) =>
            prev.map((b) =>
              b.id === (payload.new as any).id ? (payload.new as Bookmark) : b
            )
          );
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [session]);



  // Login
  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google'
    });
  };

  // Logout
  const logout = async () => {
    await supabase.auth.signOut();
  };

  // Add bookmark
 const addBookmark = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!title || !url) return;

  const { data, error } = await supabase
    .from('bookmarks')
    .insert({
      title,
      url,
      user_id: session.user.id
    })
    .select()
    .single();

  if (!error && data) {
    setBookmarks((prev) => [data, ...prev]); // instant add
  }

  setTitle('');
  setUrl('');
};


  // Delete bookmark
const deleteBookmark = async (id: string) => {
  setBookmarks((prev) => prev.filter((b) => b.id !== id)); // instant UI

  const { error } = await supabase.from('bookmarks').delete().eq('id', id);

  if (error) {
    console.error(error);
    fetchBookmarks(); // rollback if failed
  }
};


// If not logged in
if (!session) {
  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-logo">🔖</div>
        <h1 className="auth-title">Smart Bookmark</h1>
        <p className="auth-subtitle">
          Save and manage your favorite links in one place
        </p>

        <button onClick={loginWithGoogle} className="btn-primary auth-btn">
          Sign in with Google
        </button>
      </div>
    </div>
  );
}


// Logged in UI

return (
  <div className="app-bg">
    {/* Header */}
    <header className="app-header">
      <div className="container header-inner">
        <div className="logo">
          <span>🔖</span>
          <h1>Smart Bookmark</h1>
        </div>
        <button className="btn-outline" onClick={logout}>
          Logout
        </button>
      </div>
    </header>

    {/* Main */}
    <main className="container main-content">
      {/* Add Card */}
      <div className="card add-card">
        <h2>Add a new bookmark</h2>

        <form onSubmit={addBookmark} className="add-form">
          <input
            className="input"
            placeholder="Title (e.g. React Docs)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <input
            className="input"
            placeholder="URL (https://...)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          <button type="submit" className="btn-primary">
            Add
          </button>
        </form>
      </div>

      {/* List */}
      {bookmarks.length === 0 ? (
        <div className="empty-state">
          <div className="emoji">📭</div>
          <p className="empty-title">No bookmarks yet</p>
          <p className="empty-sub">Add your first link above 👆</p>
        </div>
      ) : (
        <div className="bookmark-grid">
          {bookmarks.map((b) => (
            <div key={b.id} className="card bookmark-card">
              <div className="bookmark-info">
                <a href={b.url} target="_blank" rel="noreferrer">
                  {b.title}
                </a>
                <div className="bookmark-url">{b.url}</div>
              </div>

              <button
                onClick={() => deleteBookmark(b.id)}
                className="btn-danger"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  </div>
);




}
