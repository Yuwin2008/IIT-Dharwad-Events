import React, { useState } from 'react';
import { useAuth } from '../../lib/authContext';
import { dataStore, useDataStoreVersion } from '../../lib/dataStore';
import { 
  Building2, 
  Plus, 
  Pencil, 
  Trash2, 
  Mail, 
  Check, 
  X, 
  ShieldAlert, 
  Globe 
} from 'lucide-react';
import { Club } from '../../types';

export const ManageClubs: React.FC = () => {
  const { user, isSuperAdmin } = useAuth();
  useDataStoreVersion();
  const clubs = dataStore.getClubs();

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('Technical');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setName('');
    setDomain('Technical');
    setDescription('');
    setEmail('');
    setLogoUrl('');
    setErrorMessage('');
  };

  const handleStartEdit = (club: Club) => {
    if (!isSuperAdmin) {
      alert('Access Restricted: Only Super Admin can modify club configuration.');
      return;
    }
    setEditingId(club.id);
    setIsEditing(true);
    setName(club.name);
    setDomain(club.domain);
    setDescription(club.description);
    setEmail(club.email);
    setLogoUrl(club.logo_url || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      setErrorMessage('Permission Denied: Only Super Admin can manage clubs.');
      return;
    }

    if (!name.trim()) {
      setErrorMessage('Club name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@iitdh.ac.in')) {
      setErrorMessage('Official club email must be a valid @iitdh.ac.in address.');
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        domain: domain.trim(),
        description: description.trim(),
        email: email.trim().toLowerCase(),
        logo_url: logoUrl.trim() || undefined,
      };

      if (editingId) {
        await dataStore.updateClub(editingId, payload, user?.email || 'admin');
        setSuccessMessage(`Club "${name}" updated successfully.`);
      } else {
        await dataStore.createClub(payload, user?.email || 'admin');
        setSuccessMessage(`Club "${name}" added to the institute directory.`);
      }

      resetForm();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save club.');
    }
  };

  const handleDelete = async (id: string, clubName: string) => {
    if (!isSuperAdmin) {
      alert('Only Super Admin can delete clubs.');
      return;
    }

    if (window.confirm(`Are you sure you want to permanently delete "${clubName}"? This will delete all related club events and announcements.`)) {
      try {
        await dataStore.deleteClub(id, user?.email || 'admin');
        setSuccessMessage(`Club "${clubName}" deleted.`);
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to delete club.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Institute Technical Clubs Directory
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isSuperAdmin
              ? 'Super Admin Authority: Create, modify, and manage official clubs'
              : 'Club View: Read-only access to institute clubs'}
          </p>
        </div>

        {isSuperAdmin && !isEditing && (
          <button
            onClick={() => {
              resetForm();
              setIsEditing(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm shadow-indigo-950"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Club</span>
          </button>
        )}
      </div>

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

      {/* Editor Form for Super Admin */}
      {isSuperAdmin && isEditing && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-indigo-500/40 rounded-xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {editingId ? 'Edit Club Profile' : 'Register New Official Club'}
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
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Club Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Quantum Computing Club"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Domain
              </label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g. Technical"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Official Institutional Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="clubname@iitdh.ac.in"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Logo Image URL (Optional)
              </label>
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-medium text-slate-300 mb-1">
                Club Charter & Description *
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the club mission, activities, equipment, and competencies..."
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
              <span>{editingId ? 'Update Club' : 'Save Club'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Clubs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Registered Clubs Directory ({clubs.length})
          </span>
          <span className="text-xs text-slate-400">
            {isSuperAdmin ? 'Full Edit Privileges' : 'View Only'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Club Name</th>
                <th className="py-3 px-4">Domain</th>
                <th className="py-3 px-4">Official Email</th>
                <th className="py-3 px-4">Description</th>
                {isSuperAdmin && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {clubs.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-semibold text-white">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0 text-indigo-400 font-bold text-[11px]">
                        {c.logo_url ? (
                          <img src={c.logo_url} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        ) : (
                          c.name.slice(0, 2)
                        )}
                      </div>
                      <span>{c.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {c.domain}
                  </td>
                  <td className="py-3 px-4 font-mono text-indigo-400">
                    <a href={`mailto:${c.email}`} className="hover:underline">
                      {c.email}
                    </a>
                  </td>
                  <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                    {c.description}
                  </td>
                  {isSuperAdmin && (
                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleStartEdit(c)}
                        className="p-1 text-indigo-400 hover:text-indigo-300 transition-colors"
                        title="Edit club"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id, c.name)}
                        className="p-1 text-rose-400 hover:text-rose-300 transition-colors"
                        title="Delete club"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
