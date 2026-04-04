/**
 * Admin Page for Editor Picks
 * Allows authors to manage curated related posts
 */

'use client';

import { useState, useEffect } from 'react';
import { getAllArticles } from '@/lib/content/articleData';
import { getAllEditorPicks, EditorPick } from '@/lib/db/editor-picks';

interface Article {
  id: string;
  title: string;
}

export default function EditorPicksAdmin() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [editorPicks, setEditorPicks] = useState<Record<string, EditorPick[]>>({});
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [position, setPosition] = useState<number>(1);
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const allArticles = getAllArticles();
      setArticles(allArticles);

      const picks = await fetch('/api/admin/editor-picks').then(r => r.json());
      setEditorPicks(picks);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveEditorPick() {
    if (!selectedSource || !selectedTarget) {
      alert('Please select both source and target articles');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/editor-picks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_article_id: selectedSource,
          target_article_id: selectedTarget,
          position,
          reason: reason || null,
        }),
      });

      if (response.ok) {
        // Reset form
        setSelectedTarget('');
        setReason('');
        setPosition(1);
        // Reload data
        await loadData();
        alert('Editor pick saved successfully!');
      } else {
        alert('Failed to save editor pick');
      }
    } catch (error) {
      console.error('Error saving editor pick:', error);
      alert('Failed to save editor pick');
    } finally {
      setSaving(false);
    }
  }

  async function deleteEditorPick(sourceId: string, pos: number) {
    if (!confirm('Delete this editor pick?')) return;

    try {
      const response = await fetch(
        `/api/admin/editor-picks?source_article_id=${sourceId}&position=${pos}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        await loadData();
        alert('Editor pick deleted successfully!');
      } else {
        alert('Failed to delete editor pick');
      }
    } catch (error) {
      console.error('Error deleting editor pick:', error);
      alert('Failed to delete editor pick');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-gray-900 text-white">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Editor Picks Management</h1>

        {/* Add new editor pick form */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Add Editor Pick</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Source Article (the article being read)
              </label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full p-3 bg-gray-700 rounded border border-gray-600 text-white"
              >
                <option value="">Select source article...</option>
                {articles.map((article) => (
                  <option key={article.id} value={article.id}>
                    {article.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Target Article (the recommended article)
              </label>
              <select
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value)}
                className="w-full p-3 bg-gray-700 rounded border border-gray-600 text-white"
                disabled={!selectedSource}
              >
                <option value="">Select target article...</option>
                {articles
                  .filter((a) => a.id !== selectedSource)
                  .map((article) => (
                    <option key={article.id} value={article.id}>
                      {article.title}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Position (1 = highest priority)
              </label>
              <select
                value={position}
                onChange={(e) => setPosition(parseInt(e.target.value))}
                className="w-full p-3 bg-gray-700 rounded border border-gray-600 text-white"
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Reason (optional - why this recommendation?)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder='e.g., "This post extends the framework..."'
                className="w-full p-3 bg-gray-700 rounded border border-gray-600 text-white"
              />
            </div>

            <button
              onClick={saveEditorPick}
              disabled={saving || !selectedSource || !selectedTarget}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-opacity font-medium disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Editor Pick'}
            </button>
          </div>
        </div>

        {/* List existing editor picks */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Existing Editor Picks</h2>

          {Object.keys(editorPicks).length === 0 ? (
            <p className="text-gray-400">No editor picks configured yet.</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(editorPicks).map(([sourceId, picks]) => {
                const sourceArticle = articles.find((a) => a.id === sourceId);
                return (
                  <div key={sourceId} className="border border-gray-700 rounded p-4">
                    <h3 className="font-medium mb-3">
                      {sourceArticle?.title || sourceId}
                    </h3>
                    <div className="space-y-2">
                      {picks.map((pick) => {
                        const targetArticle = articles.find((a) => a.id === pick.target_article_id);
                        return (
                          <div
                            key={`${pick.source_article_id}-${pick.position}`}
                            className="flex items-center justify-between p-3 bg-gray-700 rounded"
                          >
                            <div>
                              <div className="font-medium">
                                Position {pick.position}: {targetArticle?.title || pick.target_article_id}
                              </div>
                              {pick.reason && (
                                <div className="text-sm text-gray-400 italic">
                                  "{pick.reason}"
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => deleteEditorPick(pick.source_article_id, pick.position)}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
