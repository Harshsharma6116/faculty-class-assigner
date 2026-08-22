'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, Image as ImageIcon, Camera } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [name, setName] = useState(session?.user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(session?.user?.avatarUrl || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, avatarUrl }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      await update({ name, avatarUrl });
      setSuccess(true);
      router.refresh(); // Refresh the page to make sure layout picks up new session
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-card/60 backdrop-blur-md rounded-2xl shadow-xl border border-border overflow-hidden">
        <div className="px-8 py-6 border-b border-border/50 bg-muted/20">
          <h2 className="text-2xl font-bold text-foreground">Profile Settings</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Update your account details and public profile picture.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-sm">
              Profile updated successfully!
            </div>
          )}

          {/* Avatar Preview */}
          <div className="flex flex-col items-center justify-center space-y-4 py-4">
            <div className="relative h-32 w-32 rounded-full overflow-hidden bg-muted flex items-center justify-center border-4 border-background shadow-lg">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar Preview" className="h-full w-full object-cover" />
              ) : (
                <Camera className="h-10 w-10 text-muted-foreground opacity-50" />
              )}
            </div>
          </div>

          <div className="space-y-6 max-w-xl mx-auto">
            <div className="space-y-3">
              <label htmlFor="name" className="text-sm font-medium text-foreground">
                Display Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-background/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                required
              />
            </div>

            <div className="space-y-3">
              <label htmlFor="avatarUrl" className="text-sm font-medium text-foreground">
                Profile Picture URL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="avatarUrl"
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-background/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Paste a direct link to an image from the web (e.g. from Google Images or LinkedIn) to use as your avatar.
              </p>
            </div>
          </div>

          <div className="pt-8 flex justify-end border-t border-border/50 max-w-xl mx-auto">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all flex items-center shadow-lg shadow-primary/20"
            >
              {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
