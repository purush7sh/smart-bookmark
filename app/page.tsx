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

  // Realtime subscription
  useEffect(() => {
    if (!session) return;

    fetchBookmarks();

    const channel = supabase
      .channel('realtime-bookmarks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookmarks' },
        () => {
          fetchBookmarks();
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

    await supabase.from('bookmarks').insert({
      title,
      url,
      user_id: session.user.id
    });

    setTitle('');
    setUrl('');
  };

  // Delete bookmark
  const deleteBookmark = async (id: string) => {
    await supabase.from('bookmarks').delete().eq('id', id);
  };

  // If not logged in
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <button
          onClick={loginWithGoogle}
          className="px-6 py-3 bg-black text-white rounded-lg"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  // Logged in UI
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🔖 Smart Bookmark App</h1>
        <button onClick={logout} className="text-red-600">
          Logout
        </button>
      </div>

      <form onSubmit={addBookmark} className="flex gap-2 mb-6">
        <input
          className="border p-2 flex-1 rounded"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="border p-2 flex-1 rounded"
          placeholder="URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button className="bg-blue-600 text-white px-4 rounded">
          Add
        </button>
      </form>

      <ul className="space-y-3">
        {bookmarks.map((b) => (
          <li key={b.id} className="border p-3 rounded flex justify-between items-center">
            <div>
              <a href={b.url} target="_blank" className="font-semibold text-blue-600">
                {b.title}
              </a>
              <div className="text-sm text-gray-500">{b.url}</div>
            </div>
            <button
              onClick={() => deleteBookmark(b.id)}
              className="text-red-600"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
