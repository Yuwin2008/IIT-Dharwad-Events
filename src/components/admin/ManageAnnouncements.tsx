import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/authContext';
import { dataStore, useDataStoreVersion } from '../../lib/dataStore';
import { 
  Megaphone, 
  Plus, 
  Pencil, 
  Trash2, 
  Check, 
  X, 
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { AnnouncementItem, AnnouncementType, AnnouncementStatus } from '../../types';

export const ManageAnnouncements: React.FC = () => {
  const { user, isSuperAdmin, assignedClubs } = useAuth();
  useDataStoreVersion();

  const clubs = dataStore.getClubs();
  const allowedClubs = isSuperAdmin
    ? clubs
    : clubs.filter((c) => assignedClubs.includes(c.id));
  const allowedClubIds = allowedClubs.map((c) => c.id);

  const announcements = dataStore.getAnnouncements(true, isSuperAdmin ? undefined : allowedClubIds);

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<AnnouncementType>(
    isSuperAdmin ? 'Campus-wide Announcement' : 'Club Announcement'
  );
  const [clubId, setClubId] = useState(allowedClubs[0]?.id || '');
  const [externalUrl, setExternalUrl] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [status, setStatus] = useState<AnnouncementStatus>('Published');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditing) {
      if (!isSuperAdmin && type === 'Campus-wide Announcement') {
        setType('Club Announcement');
      }
      if (allowedClubs.length > 0 && (!clubId || !allowedClubs.some((c) => c.id === clubId))) {
        setClubId(allowedClubs[0].id);
      }
    }
  }, [isEditing, isSuperAdmin, type, clubId, allowedClubs]);

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setTitle('');
    setContent('');
    setType(isSuperAdmin ? 'Campus-wide Announcement' : 'Club Announcement');
    setClubId(allowedClubs[0]?.id || '');
    setExternalUrl('');
    setAttachmentUrl('');
    setStatus('Published');
    setErrorMessage('');
  };

  const handleStartEdit = (ann: AnnouncementItem) => {
    if (!isSuperAdmin && ann.club_id && !assignedClubs.includes(ann.club_id)) {
      setErrorMessage('Permission Denied: You can only edit announcements for your assigned clubs.');
      return;
    }
    if (!isSuperAdmin && !ann.club_id) {
      setErrorMessage('Permission Denied: Only Super Admin can modify campus-wide announcements.');
      return;
    }

    setEditingId(ann.id);
    setIsEditing(true);
    setTitle(ann.title);
    setContent(ann.content);
    setType(ann.type);
    setClubId(ann.club_id || allowedClubs[0]?.id || '');
    setExternalUrl(ann.external_url || '');
    setAttachmentUrl(ann.attachment_url || '');
    setStatus(ann.status);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!title.trim()) {
      setErrorMessage('Please provide an announcement title.');
      return;
    }
    if (!content.trim()) {
      setErrorMessage('Please provide announcement content.');
      return;
    }

    // Role verification: only Super Admin can create Campus-wide
    if (type === 'Campus-wide Announcement' && !isSuperAdmin) {
      setErrorMessage('Security Violation: Only the designated Super Admin can publish campus-wide announcements.');
      return;
    }

    if (type === 'Club Announcement' && !clubId) {
      setErrorMessage('Please select a club for the club announcement.');
      return;
    }

    if (type === 'Club Announcement' && !isSuperAdmin && !assignedClubs.includes(clubId)) {
      setErrorMessage('Unauthorized: You cannot post announcements for a club you are not assigned to.');
      return;
    }

    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        type,
        club_id: type === 'Campus-wide Announcement' ? null : clubId,
        external_url: externalUrl.trim() || undefined,
        attachment_url: attachmentUrl.trim() || undefined,
        status,
        published_at: new Date().toISOString(),
        created_by: user?.id,
      };

      if (editingId) {
        await dataStore.updateAnnouncement(editingId, payload, user?.email || 'admin');
        setSuccessMessage(`Announcement "${title}" updated successfully!`);
      } else {
        await dataStore.createAnnouncement(payload, user?.email || 'admin');
        setSuccessMessage(`Announcement "${title}" published successfully!`);
      }

      resetForm();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save announcement.');
    }
  };

  const handleDelete = async (id: string, annTitle: string, annClubId?: string | null) => {
    if (!isSuperAdmin && annClubId && !assignedClubs.includes(annClubId)) {
      setErrorMessage('Permission Denied: You cannot delete this announcement.');
      setPendingDeleteId(null);
      return;
    }
    if (!isSuperAdmin && !annClubId) {
      setErrorMessage('Permission Denied: Only Super Admin can delete campus-wide announcements.');
      setPendingDeleteId(null);
      return;
    }

    try {
      await dataStore.deleteAnnouncement(id, user?.email || 'admin');
      setPendingDeleteId(null);
      setSuccessMessage(`Announcement "${annTitle}" deleted.`);
    } catch (err: any) {
      setPendingDeleteId(null);
      setErrorMessage(err.message || 'Failed to delete announcement.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Campus Announcements Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Publish official notifications, updates, and campus circulars
          </p>
        </div>

        {!isEditing && (
          <button
            onClick={() => {
              resetForm();
              setIsEditing(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm shadow-indigo-950"
          >
            <Plus className="w-4 h-4" />
            <span>Create Announcement</span>
          </button>
        )}
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-emerald-200 text-xs flex items-center justify-between">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')}>
            <X className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-200 text-xs flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')}>
            <X className="w-4 h-4 text-rose-400" />
          </button>
        </div>
      )}

      {/* Editor Form */}
      {isEditing && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-indigo-500/40 rounded-xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {editingId ? 'Edit Announcement' : 'New Circular / Announcement'}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block font-medium text-slate-300 mb-1">
                Announcement Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Schedule Update for Project Submissions"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Announcement Scope *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AnnouncementType)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {isSuperAdmin && (
                  <option value="Campus-wide Announcement">
                    Campus-wide Announcement (Institute-wide)
                  </option>
                )}
                <option value="Club Announcement">
                  Club Announcement (Club specific)
                </option>
              </select>
              {!isSuperAdmin && (
                <p className="text-[11px] text-amber-400 mt-1">
                  * Note: Campus-wide announcements can only be authorized by the Super Admin.
                </p>
              )}
            </div>

            {/* Club Selection */}
            {type === 'Club Announcement' && (
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Target Club *
                </label>
                <select
                  value={clubId}
                  onChange={(e) => setClubId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  {allowedClubs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Status */}
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Publication Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AnnouncementStatus)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="Published">Published (Visible to all students)</option>
                <option value="Draft">Draft</option>
              </select>
            </div>

            {/* External URL */}
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                External Link (Optional)
              </label>
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://iitdh.ac.in/..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Content */}
            <div className="md:col-span-2">
              <label className="block font-medium text-slate-300 mb-1">
                Announcement Content *
              </label>
              <textarea
                rows={5}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write the full announcement message for the student body..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-950"
            >
              <Check className="w-4 h-4" />
              <span>{editingId ? 'Save Changes' : 'Publish Circular'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Announcement List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            All Announcements ({announcements.length})
          </span>
          <span className="text-xs text-slate-400 font-medium">
            Chronological order
          </span>
        </div>

        {announcements.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No announcements created yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {announcements.map((ann) => {
              const canManage = isSuperAdmin || (ann.club_id && assignedClubs.includes(ann.club_id));

              return (
                <div key={ann.id} className="p-4 hover:bg-slate-800/30 transition-colors flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`font-semibold ${
                        ann.type === 'Campus-wide Announcement' ? 'text-purple-400' : 'text-indigo-400'
                      }`}>
                        {ann.type === 'Campus-wide Announcement' ? 'Campus-wide' : ann.club?.name || 'Club'}
                      </span>
                      <span className="text-slate-400 text-[11px]">·</span>
                      <span className="text-slate-400 text-[11px]">
                        {new Date(ann.published_at || ann.created_at).toLocaleDateString()}
                      </span>
                      {ann.status === 'Draft' && (
                        <span className="text-[10px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded">
                          Draft
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-white">{ann.title}</h4>
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {ann.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 pt-1">
                    {canManage ? (
                      <>
                        <button
                          onClick={() => handleStartEdit(ann)}
                          className="p-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 rounded transition-colors"
                          title="Edit announcement"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {pendingDeleteId === ann.id ? (
                          <span className="inline-flex items-center gap-1 ml-1">
                            <button
                              onClick={() => handleDelete(ann.id, ann.title, ann.club_id)}
                              className="px-2 py-0.5 text-[11px] font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setPendingDeleteId(null)}
                              className="px-2 py-0.5 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                            >
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setPendingDeleteId(ann.id)}
                            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-slate-800 rounded transition-colors"
                            title="Delete announcement"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Read-only</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
