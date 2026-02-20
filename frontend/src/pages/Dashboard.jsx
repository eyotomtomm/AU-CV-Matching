import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Plus, Briefcase, Users, Clock, CheckCircle, FileText,
  TrendingUp, Eye
} from 'lucide-react';
import { jobsApi } from '../services/api';

function Dashboard() {
  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => jobsApi.list(),
  });

  const getStatusConfig = (status) => {
    const config = {
      draft: { label: 'Draft', bg: '#f1f3f5', color: '#495057', dot: '#adb5bd' },
      active: { label: 'Active', bg: '#e7f5ff', color: '#1971c2', dot: '#339af0' },
      screening: { label: 'Screening', bg: '#fff9db', color: '#e67700', dot: '#fcc419' },
      completed: { label: 'Completed', bg: '#ebfbee', color: '#2b8a3e', dot: '#51cf66' },
      archived: { label: 'Archived', bg: '#f1f3f5', color: '#495057', dot: '#adb5bd' },
    };
    return config[status] || config.draft;
  };

  const stats = jobs ? {
    total: jobs.length,
    active: jobs.filter(j => j.status === 'active').length,
    screening: jobs.filter(j => j.status === 'screening').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    totalCandidates: jobs.reduce((sum, j) => sum + (j.candidate_count || 0), 0),
  } : { total: 0, active: 0, screening: 0, completed: 0, totalCandidates: 0 };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: '48px', height: '48px', margin: '0 auto 16px' }}></div>
          <p style={{ color: 'var(--au-gray)', fontSize: '14px' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: '#fff5f5',
        border: '1px solid #ffc9c9',
        borderRadius: '12px',
        padding: '24px',
        textAlign: 'center',
        maxWidth: '500px',
        margin: '60px auto'
      }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>!</div>
        <h3 style={{ marginBottom: '8px', color: '#c92a2a' }}>Connection Error</h3>
        <p style={{ color: '#e03131', fontSize: '14px' }}>Failed to load jobs: {error.message}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '28px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '700', color: 'var(--au-dark)', letterSpacing: '-0.02em' }}>
            Dashboard
          </h1>
          <p style={{ color: 'var(--au-gray)', marginTop: '4px', fontSize: '15px' }}>
            Overview of job postings and candidate screening pipeline
          </p>
        </div>
        <Link to="/jobs/new" className="btn btn-primary" style={{
          padding: '12px 24px',
          fontSize: '14px',
          fontWeight: '600',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0, 150, 57, 0.25)'
        }}>
          <Plus size={18} />
          Create New Job
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-4 mb-4">
        {[
          {
            icon: <Briefcase size={22} />,
            value: stats.total,
            label: 'Total Jobs',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            lightBg: '#f3f0ff'
          },
          {
            icon: <Users size={22} />,
            value: stats.totalCandidates,
            label: 'Total Candidates',
            gradient: 'linear-gradient(135deg, #009639 0%, #00b347 100%)',
            lightBg: '#ebfbee'
          },
          {
            icon: <Clock size={22} />,
            value: stats.screening,
            label: 'In Screening',
            gradient: 'linear-gradient(135deg, #f59f00 0%, #fab005 100%)',
            lightBg: '#fff9db'
          },
          {
            icon: <CheckCircle size={22} />,
            value: stats.completed,
            label: 'Completed',
            gradient: 'linear-gradient(135deg, #1971c2 0%, #339af0 100%)',
            lightBg: '#e7f5ff'
          },
        ].map((stat, i) => (
          <div key={i} style={{
            background: 'white',
            borderRadius: '14px',
            padding: '22px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
            border: '1px solid #f1f3f5',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'default',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                background: stat.gradient,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                flexShrink: 0
              }}>
                {stat.icon}
              </div>
              <div>
                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--au-dark)', lineHeight: 1 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--au-gray)', marginTop: '4px', fontWeight: '500' }}>
                  {stat.label}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Jobs List */}
      <div style={{
        background: 'white',
        borderRadius: '14px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
        border: '1px solid #f1f3f5',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: '1px solid #f1f3f5'
        }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '650', color: 'var(--au-dark)' }}>
              Recent Jobs
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--au-gray)', marginTop: '2px' }}>
              {jobs?.length || 0} job posting{jobs?.length !== 1 ? 's' : ''}
            </p>
          </div>
          {jobs && jobs.length > 0 && (
            <div style={{
              fontSize: '13px',
              color: 'var(--au-green)',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <TrendingUp size={14} />
              {stats.totalCandidates} candidates total
            </div>
          )}
        </div>

        {jobs && jobs.length > 0 ? (
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafbfc' }}>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#868e96', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Job Title</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#868e96', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Reference</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#868e96', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Grade</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#868e96', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Candidates</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#868e96', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#868e96', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Created</th>
                  <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: '11px', fontWeight: '600', color: '#868e96', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  const statusConfig = getStatusConfig(job.status);
                  return (
                    <tr key={job.id} style={{ borderBottom: '1px solid #f1f3f5', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafb'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '16px 24px' }}>
                        <Link to={`/jobs/${job.id}`} style={{ textDecoration: 'none' }}>
                          <div style={{ fontWeight: '600', color: 'var(--au-dark)', fontSize: '14px', marginBottom: '2px' }}>
                            {job.title}
                          </div>
                        </Link>
                      </td>
                      <td style={{ padding: '16px', fontSize: '13px', color: '#868e96', fontFamily: 'monospace' }}>
                        {job.reference_number || '-'}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 14px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '700',
                          background: '#e7f5ff',
                          color: '#1971c2',
                          letterSpacing: '0.3px'
                        }}>
                          {job.grade_level}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <Users size={14} color="#868e96" />
                          <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--au-dark)' }}>
                            {job.candidate_count || 0}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '5px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: statusConfig.bg,
                          color: statusConfig.color,
                        }}>
                          <span style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            background: statusConfig.dot,
                            flexShrink: 0
                          }}></span>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td style={{ padding: '16px', fontSize: '13px', color: '#868e96' }}>
                        {new Date(job.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <Link to={`/jobs/${job.id}`} style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '7px 14px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '500',
                            background: '#f1f3f5',
                            color: '#495057',
                            textDecoration: 'none',
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#e9ecef'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#f1f3f5'; }}
                          >
                            <Eye size={14} />
                            View
                          </Link>
                          {(job.status === 'screening' || job.status === 'completed') && (
                            <Link to={`/jobs/${job.id}/results`} style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '7px 14px',
                              borderRadius: '8px',
                              fontSize: '13px',
                              fontWeight: '500',
                              background: 'var(--au-green)',
                              color: 'white',
                              textDecoration: 'none',
                              transition: 'all 0.15s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#007a2e'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--au-green)'; }}
                            >
                              <FileText size={14} />
                              Results
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: '#f1f3f5',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <Briefcase size={36} color="#adb5bd" />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '600', color: 'var(--au-dark)', marginBottom: '8px' }}>
              No jobs yet
            </h3>
            <p style={{ color: 'var(--au-gray)', fontSize: '14px', marginBottom: '24px', maxWidth: '360px', margin: '0 auto 24px' }}>
              Create your first job posting to start screening candidates with AI-powered matching
            </p>
            <Link to="/jobs/new" className="btn btn-primary" style={{
              padding: '12px 28px',
              borderRadius: '10px',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(0, 150, 57, 0.25)'
            }}>
              <Plus size={18} />
              Create First Job
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
