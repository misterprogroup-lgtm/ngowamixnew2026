'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { usePlayer } from '../../components/player/PlayerContext';
import { api } from '../../lib/api';
import LikeButton from '../../components/ui/LikeButton';
import FollowButton from '../../components/ui/FollowButton';
import ShareButton from '../../components/ui/ShareButton';
import ReportModal from '../../components/ui/ReportModal';
import { Download, Loader2 } from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; pseudo: string; avatarUrl: string | null };
}

interface TrackDetail {
  id: string;
  title: string;
  slug: string;
  audioUrl: string;
  coverUrl: string | null;
  genre: string | null;
  tags: string[];
  playCount: number;
  likeCount: number;
  audioDuration: number;
  description: string | null;
  createdAt: string;
  artist: {
    id: string;
    artistName: string;
    slug: string;
    user: { pseudo: string; avatarUrl: string | null };
  };
}

export default function TrackDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { play } = usePlayer();
  const [track, setTrack] = useState<TrackDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchTrack = async () => {
      try {
        const data = await api.get<TrackDetail>(`/music/tracks/${slug}`);
        setTrack(data);
        const commentsRes = await api.get<{ data: Comment[] }>(`/comments/track/${data.id}`);
        setComments(commentsRes.data || []);
      } catch {
        setTrack(null);
      } finally {
        setLoading(false);
      }
    };
    fetchTrack();
  }, [slug]);

  const playTrack = () => {
    if (!track) return;
    play({
      id: track.id,
      title: track.title,
      audioUrl: `/api/music/stream/${track.id}`,
      coverUrl: track.coverUrl || undefined,
      artist: { artistName: track.artist.artistName, slug: track.artist.slug },
    });
  };

  const handleDownload = async () => {
    if (!track || downloading) return;
    setDownloading(true);
    try {
      const result = await api.post<{ allowed: boolean; message?: string }>(`/music/download/${track.id}`);
      if (result.allowed) {
        window.location.href = `/api/music/stream/${track.id}?download=true`;
      } else {
        alert(result.message || 'Limite de téléchargements atteinte');
      }
    } catch (err: any) {
      alert(err.message || 'Erreur lors du téléchargement');
    } finally {
      setDownloading(false);
    }
  };

  const handleComment = async () => {
    if (!newComment.trim() || !track) return;
    setCommentLoading(true);
    try {
      const comment = await api.post<Comment>(`/comments/track/${track.id}`, { content: newComment });
      setComments([comment, ...comments]);
      setNewComment('');
    } catch {
      // error
    } finally {
      setCommentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 py-8">
        <div className="max-w-4xl mx-auto px-4 animate-pulse">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-72 aspect-square bg-dark-700/50 rounded-xl" />
            <div className="flex-1 space-y-4">
              <div className="h-8 bg-dark-700/50 rounded w-1/2" />
              <div className="h-5 bg-dark-700/50 rounded w-1/3" />
              <div className="h-12 bg-dark-700/50 rounded w-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Morceau non trouvé</h2>
          <Link href="/morceaux" className="text-primary-600 hover:text-primary-700">Retour aux morceaux</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <div className="w-full md:w-72 aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-primary-400 to-primary-600 flex-shrink-0">
            {track.coverUrl ? (
              <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-20 h-20 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">{track.title}</h1>
            <Link href={`/artistes/${track.artist.slug}`} className="text-primary-600 hover:text-primary-700 font-medium">
              {track.artist.artistName}
            </Link>

            <div className="flex items-center gap-4 mt-4 text-sm text-dark-400 flex-wrap">
              <span>{track.playCount.toLocaleString()} écoutes</span>
              <span>{track.genre || 'Non classé'}</span>
              {track.audioDuration > 0 && (
                <span>{Math.floor(track.audioDuration / 60)}:{(track.audioDuration % 60).toString().padStart(2, '0')}</span>
              )}
            </div>

            {track.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {track.tags.map(tag => (
                  <span key={tag} className="text-xs bg-dark-700/50 text-dark-400 px-2 py-1 rounded-full">#{tag}</span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 mt-6 flex-wrap">
              <button onClick={playTrack} className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-full font-medium flex items-center gap-2 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                Écouter
              </button>
              <LikeButton trackId={track.id} initialCount={track.likeCount} />
              <ShareButton title={track.title} iconOnly />
              <FollowButton artistId={track.artist.id} size="sm" />
              <button onClick={handleDownload} disabled={downloading}
                className="text-dark-400 hover:text-primary-600 transition-colors p-2 disabled:opacity-50" title="Télécharger">
                {downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              </button>
              <button onClick={() => setShowReport(true)} className="text-dark-400 hover:text-red-500 transition-colors p-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Comments */}
        <div className="bg-dark-800/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Commentaires ({comments.length})</h2>

          <div className="flex gap-3 mb-6">
            <input
              type="text"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Ajouter un commentaire..."
              className="input-field flex-1"
              onKeyDown={e => e.key === 'Enter' && handleComment()}
            />
            <button
              onClick={handleComment}
              disabled={!newComment.trim() || commentLoading}
              className="bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {commentLoading ? '...' : 'Publier'}
            </button>
          </div>

          {comments.length === 0 ? (
            <p className="text-dark-400 text-sm text-center py-6">Aucun commentaire pour le moment.</p>
          ) : (
            <div className="space-y-4">
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-9 h-9 bg-dark-700/50 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {comment.user.avatarUrl ? (
                      <img src={comment.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm text-dark-400 font-medium">{comment.user.pseudo.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{comment.user.pseudo}</span>
                      <span className="text-xs text-dark-400">{new Date(comment.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <p className="text-sm text-dark-300 mt-0.5">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showReport && (
          <ReportModal targetType="track" targetId={track.id} onClose={() => setShowReport(false)} />
        )}
      </div>
    </div>
  );
}
