import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Briefcase, Users, Clock, CheckCircle, FileText } from 'lucide-react';
import { jobsApi } from '../services/api';

function Dashboard() {
  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['jobs'],
    queryFn: jobsApi.list,
  });

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'badge-gray',
      active: 'badge-info',
      screening: 'badge-warning',
      completed: 'badge-success',
      archived: 'badge-gray',
    };
    return badges[status] || 'badge-gray';
  };

  const stats = jobs ? {
    total: jobs.length,
    active: jobs.filter(j => j.status === 'active').length,
    screening: jobs.filter(j => j.status === 'screening').length,
    completed: jobs.filter(j => j.status === 'completed').length,
  } : { total: 0, active: 0, screening: 0, completed: 0 };

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        Failed to load jobs: {error.message}
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex-between mb-4">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '600' }}>Dashboard</h1>
          <p className="text-gray">Manage job postings and candidate screening</p>
        </div>
        <Link to="/jobs/new" className="btn btn-primary">
          <Plus size={18} />
          Create New Job
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-4 mb-4">
        <div className="stat-card">
          <div className="flex gap-4" style={{ alignItems: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: '#e3f2fd',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Briefcase size={24} color="#1976d2" />
            </div>
            <div>
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Jobs</div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex gap-4" style={{ alignItems: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: '#e8f5e9',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={24} color="#388e3c" />
            </div>
            <div>
              <div className="stat-value">{stats.active}</div>
              <div className="stat-label">Active Jobs</div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex gap-4" style={{ alignItems: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: '#fff3e0',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={24} color="#f57c00" />
            </div>
            <div>
              <div className="stat-value">{stats.screening}</div>
              <div className="stat-label">In Screening</div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex gap-4" style={{ alignItems: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: '#e8f5e9',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle size={24} color="#388e3c" />
            </div>
            <div>
              <div className="stat-value">{stats.completed}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Jobs</h2>
        </div>

        {jobs && jobs.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Reference</th>
                <th>Grade</th>
                <th>Candidates</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>
                    <Link to={`/jobs/${job.id}`} style={{ color: '#009639', textDecoration: 'none', fontWeight: '500' }}>
                      {job.title}
                    </Link>
                  </td>
                  <td>{job.reference_number || '-'}</td>
                  <td><span className="badge badge-info">{job.grade_level}</span></td>
                  <td>{job.candidate_count || 0}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(job.status)}`}>
                      {job.status}
                    </span>
                  </td>
                  <td>{new Date(job.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="flex gap-2">
                      <Link to={`/jobs/${job.id}`} className="btn btn-secondary" style={{ padding: '6px 12px' }}>
                        View
                      </Link>
                      {(job.status === 'screening' || job.status === 'completed') && (
                        <Link to={`/jobs/${job.id}/results`} className="btn btn-outline" style={{ padding: '6px 12px' }}>
                          <FileText size={14} />
                          Results
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <Briefcase size={48} color="#ccc" />
            <h3>No jobs yet</h3>
            <p>Create your first job posting to get started</p>
            <Link to="/jobs/new" className="btn btn-primary mt-4">
              <Plus size={18} />
              Create Job
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
