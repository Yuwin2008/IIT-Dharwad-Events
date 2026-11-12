import React, { useState } from 'react';
import { useAuth } from '../../lib/authContext';
import { dataStore } from '../../lib/dataStore';
import { 
  Calendar, 
  Plus, 
  Pencil, 
  Trash2, 
  Eye, 
  Check, 
  X, 
  Clock, 
  MapPin, 
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { EventItem, EventStatus, Club } from '../../types';

interface ManageEventsProps {
  onPreviewEvent: (event: EventItem) => void;
}

export const ManageEvents: React.FC<ManageEventsProps> = ({ onPreviewEvent }) => {
  const { user, isSuperAdmin, assignedClubs } = useAuth();

  const clubs = dataStore.getClubs();
  const allowedClubs = isSuperAdmin
    ? clubs
    : clubs.filter((c) => assignedClubs.includes(c.id));
  const allowedClubIds = allowedClubs.map((c) => c.id);

  const [events, setEvents] = useState<EventItem[]>(() =>
    dataStore.getEvents(true, isSuperAdmin ? undefined : allowedClubIds)
  );

  const refreshEvents = () => {
    setEvents(dataStore.getEvents(true, isSuperAdmin ? undefined : allowedClubIds));
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [clubId, setClubId] = useState(allowedClubs[0]?.id || '');
  const [category, setCategory] = useState('Technical / Buildathon');
  const [shortDesc, setShortDesc] = useState('');
  const [fullDesc, setFullDesc] = useState('');
  const [eventDate, setEventDate] = useState('2026-11-20');
  const [startTime, setStartTime] = useState('14:00:00');
  const [endTime, setEndTime] = useState('18:00:00');
  const [venue, setVenue] = useState('Makerspace Lab, Central Research Facility');
  const [regUrl, setRegUrl] = useState('');
  const [regDeadline, setRegDeadline] = useState('');
  const [posterUrl, setPosterUrl] = useState('/src/assets/images/robotics_club_showcase_1794484939484.jpg');
  const [status, setStatus] = useState<EventStatus>('Published');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setTitle('');
    setClubId(allowedClubs[0]?.id || '');
    setCategory('Technical / Buildathon');
    setShortDesc('');
    setFullDesc('');
    setEventDate('2026-11-20');
    setStartTime('14:00:00');
    setEndTime('18:00:00');
    setVenue('');
    setRegUrl('');
    setRegDeadline('');
    setPosterUrl('/src/assets/images/robotics_club_showcase_1794484939484.jpg');
    setStatus('Published');
    setErrorMessage('');
  };

  const handleStartEdit = (evt: EventItem) => {
    // Verify permissions: Club Admin cannot edit other clubs!
    if (!isSuperAdmin && !assignedClubs.includes(evt.club_id)) {
      alert('Permission Denied: You can only edit events belonging to your assigned clubs.');
      return;
    }

    setEditingId(evt.id);
    setIsEditing(true);
    setTitle(evt.title);
    setClubId(evt.club_id);
    setCategory(evt.category);
    setShortDesc(evt.short_description);
    setFullDesc(evt.description);
    setEventDate(evt.event_date);
    setStartTime(evt.start_time || '10:00:00');
    setEndTime(evt.end_time || '17:00:00');
    setVenue(evt.venue);
    setRegUrl(evt.registration_url || '');
    setRegDeadline(evt.registration_deadline ? evt.registration_deadline.slice(0, 16) : '');
    setPosterUrl(evt.poster_url || '');
    setStatus(evt.status);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!title.trim()) {
      setErrorMessage('Please provide an event title.');
      return;
    }
    if (!clubId) {
      setErrorMessage('Please select an organizing club.');
      return;
    }
    if (!isSuperAdmin && !assignedClubs.includes(clubId)) {
      setErrorMessage('Unauthorized: You are not authorized to publish events for this club.');
      return;
    }

    try {
      const eventPayload = {
        club_id: clubId,
        title: title.trim(),
        category,
        short_description: shortDesc.trim(),
        description: fullDesc.trim() || shortDesc.trim(),
        event_date: eventDate,
        start_time: startTime,
        end_time: endTime,
        venue: venue.trim() || 'To be announced',
        registration_url: regUrl.trim() || undefined,
        registration_deadline: regDeadline ? new Date(regDeadline).toISOString() : undefined,
        poster_url: posterUrl.trim(),
        status,
        created_by: user?.email,
      };

      if (editingId) {
        await dataStore.updateEvent(editingId, eventPayload, user?.email || 'admin');
        setSuccessMessage(`Event "${title}" successfully updated!`);
      } else {
        await dataStore.createEvent(eventPayload, user?.email || 'admin');
        setSuccessMessage(`Event "${title}" successfully created!`);
      }

      refreshEvents();
      resetForm();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save event.');
    }
  };

  const handleDelete = async (id: string, eventTitle: string, eventClubId: string) => {
    if (!isSuperAdmin && !assignedClubs.includes(eventClubId)) {
      alert('Permission Denied: You can only delete events for your assigned clubs.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete the event "${eventTitle}"? This action is permanent.`)) {
      await dataStore.deleteEvent(id, user?.email || 'admin');
      refreshEvents();
      setSuccessMessage(`Event "${eventTitle}" was deleted.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Campus Events Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Create, schedule, draft, and publish institute events
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
            <span>Create New Event</span>
          </button>
        )}
      </div>

      {/* Success/Error Alerts */}
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

      {/* Event Editor Form */}
      {isEditing && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-indigo-500/40 rounded-xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {editingId ? 'Edit Event Details' : 'Create New Event'}
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
                Event Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Autonomous Mobile Robotics Bootcamp"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Organizing Club */}
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Organizing Club * {isSuperAdmin ? '(Super Admin: All Clubs)' : '(Assigned Clubs Only)'}
              </label>
              <select
                value={clubId}
                onChange={(e) => setClubId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {allowedClubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.domain})
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="Technical / Buildathon">Technical / Buildathon</option>
                <option value="Technical / Workshop">Technical / Workshop</option>
                <option value="Technical / Seminar">Technical / Seminar</option>
                <option value="Technical / Hackathon">Technical / Hackathon</option>
                <option value="Cultural">Cultural</option>
                <option value="Sports">Sports</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Event Date */}
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Event Date *
              </label>
              <input
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Venue */}
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Venue
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. Auditorium 2 / To be announced"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Timings */}
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Registration URL */}
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Registration URL (Google Form / External Portal)
              </label>
              <input
                type="url"
                value={regUrl}
                onChange={(e) => setRegUrl(e.target.value)}
                placeholder="https://docs.google.com/forms/..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Registration Deadline */}
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Registration Deadline
              </label>
              <input
                type="datetime-local"
                value={regDeadline}
                onChange={(e) => setRegDeadline(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Poster URL */}
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Poster Image URL
              </label>
              <input
                type="text"
                value={posterUrl}
                onChange={(e) => setPosterUrl(e.target.value)}
                placeholder="/src/assets/images/..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Event Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EventStatus)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="Published">Published (Live for students)</option>
                <option value="Draft">Draft (Internal review)</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Short Description */}
            <div className="md:col-span-2">
              <label className="block font-medium text-slate-300 mb-1">
                Short Description (1-2 sentences for card view) *
              </label>
              <input
                type="text"
                required
                value={shortDesc}
                onChange={(e) => setShortDesc(e.target.value)}
                placeholder="Concise summary for feed cards..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Full Description */}
            <div className="md:col-span-2">
              <label className="block font-medium text-slate-300 mb-1">
                Full Description (Rules, eligibility, prizes, agenda)
              </label>
              <textarea
                rows={5}
                value={fullDesc}
                onChange={(e) => setFullDesc(e.target.value)}
                placeholder="Provide complete breakdown of the event requirements and rules..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => {
                setStatus('Draft');
                handleSubmit(e);
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
            >
              Save as Draft
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-md shadow-indigo-950 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{editingId ? 'Update & Save Event' : 'Publish Event'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Events List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Active Managed Events ({events.length})
          </span>
          <span className="text-xs text-slate-400">
            {isSuperAdmin ? 'Full Campus Access' : `${allowedClubs.length} Club(s) In Scope`}
          </span>
        </div>

        {events.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No events found. Click "Create New Event" above to schedule an event for your club.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Event & Category</th>
                  <th className="py-3 px-4">Organizing Club</th>
                  <th className="py-3 px-4">Event Date</th>
                  <th className="py-3 px-4">Venue</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {events.map((evt) => {
                  const canManage = isSuperAdmin || assignedClubs.includes(evt.club_id);

                  return (
                    <tr key={evt.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{evt.title}</div>
                        <span className="text-[11px] text-slate-400">{evt.category}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {evt.club?.name || 'Unknown Club'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {evt.event_date}
                      </td>
                      <td className="py-3 px-4 text-slate-400 max-w-[150px] truncate">
                        {evt.venue || 'TBA'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                          evt.status === 'Published'
                            ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/60'
                            : evt.status === 'Draft'
                            ? 'bg-amber-950/70 text-amber-300 border border-amber-800/60'
                            : 'bg-rose-950/70 text-rose-300 border border-rose-800/60'
                        }`}>
                          {evt.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => onPreviewEvent(evt)}
                          className="p-1 text-slate-400 hover:text-white transition-colors"
                          title="Preview details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {canManage ? (
                          <>
                            <button
                              onClick={() => handleStartEdit(evt)}
                              className="p-1 text-indigo-400 hover:text-indigo-300 transition-colors"
                              title="Edit event"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(evt.id, evt.title, evt.club_id)}
                              className="p-1 text-rose-400 hover:text-rose-300 transition-colors"
                              title="Delete event"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Read-only</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
