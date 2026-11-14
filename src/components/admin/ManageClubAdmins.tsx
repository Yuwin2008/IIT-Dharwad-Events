import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/authContext';
import { dataStore, useDataStoreVersion } from '../../lib/dataStore';
import { SUPER_ADMIN_EMAIL } from '../../lib/seedData';
import { isIITDHEmail } from '../../lib/supabase';
import { 
  UserCheck, 
  UserPlus, 
  Trash2, 
  Search, 
  ShieldAlert, 
  Check, 
  X, 
  AlertTriangle,
  Building2
} from 'lucide-react';
import { ClubAdminAssignment, Club } from '../../types';

export const ManageClubAdmins: React.FC = () => {
  const { user, isSuperAdmin } = useAuth();
  useDataStoreVersion();

  const clubs = dataStore.getClubs();
  const assignments = dataStore.getClubAdmins();
  const syncedProfiles = dataStore.getProfiles();

  // Form State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmail, setSelectedEmail] = useState('');
  const [selectedClubId, setSelectedClubId] = useState(clubs[0]?.id || '');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [pendingRevokeId, setPendingRevokeId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedClubId && clubs.length > 0) {
      setSelectedClubId(clubs[0].id);
    }
  }, [selectedClubId, clubs]);

  // Merge live synced registered accounts with sample accounts for discovery
  const registeredUsersPool = Array.from(
    new Set([
      ...syncedProfiles.map((p) => p.email.toLowerCase()),
      'coding_admin@iitdh.ac.in',
      'robotics_lead@iitdh.ac.in',
      'ingene_lead@iitdh.ac.in',
      'ai_coordinator@iitdh.ac.in',
      'design_head@iitdh.ac.in',
      'student26@iitdh.ac.in',
      'ec26bt001@iitdh.ac.in',
      'cs26bt015@iitdh.ac.in',
      'me26bt042@iitdh.ac.in',
    ])
  ).filter((email) => email !== SUPER_ADMIN_EMAIL.toLowerCase());

  const filteredUsers = registeredUsersPool.filter((email) =>
    email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!isSuperAdmin) {
      setErrorMessage('Security Violation: Only Super Admin can assign club administrators.');
      return;
    }

    const targetEmail = selectedEmail.trim().toLowerCase();
    if (!isIITDHEmail(targetEmail)) {
      setErrorMessage('Institutional Requirement: Only valid @iitdh.ac.in user accounts can be assigned.');
      return;
    }

    if (!selectedClubId) {
      setErrorMessage('Please select a target club.');
      return;
    }

    try {
      await dataStore.assignClubAdmin(targetEmail, selectedClubId, user?.email || 'super_admin');
      const clubName = clubs.find((c) => c.id === selectedClubId)?.name;
      setSuccessMessage(`Successfully granted Club Admin privileges for ${clubName} to ${targetEmail}.`);
      setSelectedEmail('');
      setSearchQuery('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to assign administrator.');
    }
  };

  const handleRemove = async (assignment: ClubAdminAssignment) => {
    if (!isSuperAdmin) {
      setErrorMessage('Security Violation: Only Super Admin can revoke administrative privileges.');
      setPendingRevokeId(null);
      return;
    }

    try {
      await dataStore.removeClubAdmin(assignment.id, user?.email || 'super_admin');
      setPendingRevokeId(null);
      setSuccessMessage(`Revoked ${assignment.club_name} administrative privileges from ${assignment.user_email}.`);
    } catch (err: any) {
      setPendingRevokeId(null);
      setErrorMessage(err.message || 'Failed to remove administrator.');
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-8 bg-slate-900 border border-slate-800 rounded-xl text-center space-y-3">
        <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-base font-bold text-white">Super Admin Access Required</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Administrative privilege provisioning is strictly restricted to the Super Administrator (<code className="text-slate-300">ec26bt032@iitdh.ac.in</code>). Club Admins cannot view or modify administrative assignments.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
            Super Admin Authority
          </span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Manage Club Administrators (RBAC)
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Explicitly grant or revoke administrative roles for specific technical clubs. Changes take effect across Row Level Security policies.
        </p>
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

      {/* Assignment Control Box */}
      <form onSubmit={handleAssign} className="bg-slate-900 border border-indigo-500/40 rounded-xl p-6 space-y-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-indigo-400" />
            <span>Assign New Club Administrator</span>
          </h3>
          <span className="text-xs text-slate-400">Institutional accounts only</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
          {/* User search & selection */}
          <div className="md:col-span-6 space-y-1.5">
            <label className="block font-medium text-slate-300">
              Select or Search Registered Student Email *
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedEmail(e.target.value);
                }}
                placeholder="Search user email (e.g. cs26bt015@iitdh.ac.in)"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>

            {/* Quick selector options */}
            <div className="pt-2">
              <span className="text-[11px] text-slate-400 block mb-1">
                Suggested Registered Student Accounts:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {filteredUsers.slice(0, 6).map((email) => (
                  <button
                    key={email}
                    type="button"
                    onClick={() => {
                      setSelectedEmail(email);
                      setSearchQuery(email);
                    }}
                    className={`px-2 py-1 rounded text-[11px] border transition-colors ${
                      selectedEmail === email
                        ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                    }`}
                  >
                    {email}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Target Club */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="block font-medium text-slate-300">
              Assign to Technical Club *
            </label>
            <select
              value={selectedClubId}
              onChange={(e) => setSelectedClubId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 text-xs"
            >
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Note: You can assign a user to multiple clubs by repeating this step.
            </p>
          </div>

          {/* Submit Button */}
          <div className="md:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={!selectedEmail}
              className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors shadow-md shadow-indigo-950 flex items-center justify-center gap-1.5 h-[38px]"
            >
              <Check className="w-4 h-4" />
              <span>Grant Role</span>
            </button>
          </div>
        </div>
      </form>

      {/* Active Club Admin Assignments List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Active Club Admin Assignments ({assignments.length})</span>
          </span>
          <span className="text-xs text-slate-400">
            Designated Super Admin retains global authority
          </span>
        </div>

        {assignments.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No active club administrator assignments. Assign a user above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Administrator Email</th>
                  <th className="py-3 px-4">Assigned Club</th>
                  <th className="py-3 px-4">Assigned By</th>
                  <th className="py-3 px-4">Assigned On</th>
                  <th className="py-3 px-4 text-right">Revoke Privilege</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-white">
                      {assignment.user_email}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-medium flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>{assignment.club_name}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {assignment.assigned_by || 'Super Admin'}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(assignment.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {pendingRevokeId === assignment.id ? (
                        <span className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleRemove(assignment)}
                            className="px-2.5 py-1 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded transition-colors"
                          >
                            Confirm Revoke
                          </button>
                          <button
                            onClick={() => setPendingRevokeId(null)}
                            className="px-2 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setPendingRevokeId(assignment.id)}
                          className="px-2.5 py-1 text-xs text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900 border border-rose-800/60 rounded transition-colors inline-flex items-center gap-1"
                          title="Revoke club admin permissions"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Revoke</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
