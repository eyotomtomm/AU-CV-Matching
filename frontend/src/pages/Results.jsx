import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download, FileText, Award, Users, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { jobsApi, candidatesApi, reportsApi } from '../services/api';

function Results() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const { data: job } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobsApi.get(jobId),
  });

  const { data: results, isLoading } = useQuery({
    queryKey: ['results', jobId],
    queryFn: () => candidatesApi.getResults(jobId),
  });

  const { data: statistics } = useQuery({
    queryKey: ['statistics', jobId],
    queryFn: () => jobsApi.getStatistics(jobId),
  });

  const getScoreClass = (score) => {
    if (score >= 70) return 'score-high';
    if (score >= 50) return 'score-medium';
    return 'score-low';
  };

  const COLORS = ['#009639', '#FCDD09', '#D21034', '#6c757d'];

  if (isLoading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  const longlist = results?.filter(r => r.is_in_longlist) || [];
  const genderData = statistics?.gender_distribution ? [
    { name: 'Female', value: statistics.gender_distribution.female || 0 },
    { name: 'Male', value: statistics.gender_distribution.male || 0 },
    { name: 'Other', value: statistics.gender_distribution.other || 0 },
  ].filter(d => d.value > 0) : [];

  const scoreDistribution = results ? [
    { range: '80-100', count: results.filter(r => r.final_score >= 80).length },
    { range: '60-79', count: results.filter(r => r.final_score >= 60 && r.final_score < 80).length },
    { range: '40-59', count: results.filter(r => r.final_score >= 40 && r.final_score < 60).length },
    { range: '0-39', count: results.filter(r => r.final_score < 40).length },
  ] : [];

  return (
    <div>
      {/* Header */}
      <div className="flex-between mb-4">
        <div className="flex gap-4" style={{ alignItems: 'center' }}>
          <button onClick={() => navigate(`/jobs/${jobId}`)} className="btn btn-secondary">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '600' }}>Screening Results</h1>
            <p className="text-gray">{job?.title} • {results?.length || 0} candidates evaluated</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => reportsApi.downloadLonglistDocx(jobId)} className="btn btn-primary">
            <Download size={18} />
            Download DOCX Report
          </button>
          <button onClick={() => reportsApi.downloadLonglistExcel(jobId)} className="btn btn-secondary">
            <Download size={18} />
            Download Excel
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-4 mb-4">
        <div className="stat-card">
          <div className="flex gap-4" style={{ alignItems: 'center' }}>
            <div style={{
              width: '48px', height: '48px', background: '#e8f5e9',
              borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Users size={24} color="#388e3c" />
            </div>
            <div>
              <div className="stat-value">{statistics?.total_candidates || 0}</div>
              <div className="stat-label">Total Screened</div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex gap-4" style={{ alignItems: 'center' }}>
            <div style={{
              width: '48px', height: '48px', background: '#fff3e0',
              borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Award size={24} color="#f57c00" />
            </div>
            <div>
              <div className="stat-value">{longlist.length}</div>
              <div className="stat-label">Top 20 Longlist</div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex gap-4" style={{ alignItems: 'center' }}>
            <div style={{
              width: '48px', height: '48px', background: '#e3f2fd',
              borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <TrendingUp size={24} color="#1976d2" />
            </div>
            <div>
              <div className="stat-value">{statistics?.score_statistics?.highest?.toFixed(0) || 0}</div>
              <div className="stat-label">Highest Score</div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex gap-4" style={{ alignItems: 'center' }}>
            <div style={{
              width: '48px', height: '48px', background: '#fce4ec',
              borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <TrendingUp size={24} color="#c2185b" />
            </div>
            <div>
              <div className="stat-value">{statistics?.score_statistics?.average?.toFixed(0) || 0}</div>
              <div className="stat-label">Average Score</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-2 mb-4">
        <div className="card">
          <h3 className="card-title mb-4">Gender Distribution</h3>
          {genderData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {genderData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray text-center">No data available</p>
          )}
        </div>

        <div className="card">
          <h3 className="card-title mb-4">Score Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={scoreDistribution}>
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#009639" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Longlist Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Top 20 Candidates (Longlist)</h2>
        </div>

        {longlist.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Candidate</th>
                <th>Gender</th>
                <th>Nationality</th>
                <th>Education</th>
                <th>Experience</th>
                <th>Bonus</th>
                <th>Final Score</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {longlist.map((result) => (
                <tr key={result.id}>
                  <td>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      background: result.rank <= 3 ? '#FCDD09' : '#e9ecef',
                      borderRadius: '50%',
                      fontWeight: 'bold'
                    }}>
                      {result.rank}
                    </span>
                  </td>
                  <td>
                    <Link
                      to={`/results/${result.id}`}
                      style={{ color: '#009639', textDecoration: 'none', fontWeight: '500' }}
                    >
                      {result.candidate_name}
                    </Link>
                  </td>
                  <td>
                    <span className={`badge ${result.candidate_gender === 'female' ? 'badge-info' : 'badge-gray'}`}>
                      {result.candidate_gender || 'N/S'}
                    </span>
                  </td>
                  <td>{result.candidate_nationality || '-'}</td>
                  <td>
                    <div className="progress-bar" style={{ width: '60px' }}>
                      <div
                        className="progress-fill"
                        style={{ width: `${(result.education_total / 30) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-small">{result.education_total.toFixed(1)}/30</span>
                  </td>
                  <td>
                    <div className="progress-bar" style={{ width: '60px' }}>
                      <div
                        className="progress-fill"
                        style={{ width: `${(result.experience_total / 70) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-small">{result.experience_total.toFixed(1)}/70</span>
                  </td>
                  <td>
                    <span className="badge badge-success">+{result.total_bonus}</span>
                  </td>
                  <td>
                    <div className={`score-circle ${getScoreClass(result.final_score)}`} style={{ width: '50px', height: '50px', fontSize: '14px' }}>
                      {result.final_score.toFixed(0)}
                    </div>
                  </td>
                  <td>
                    {result.passes_cutoff ? (
                      <span className="badge badge-success">Pass</span>
                    ) : (
                      <span className="badge badge-danger">Below Cutoff</span>
                    )}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <Link to={`/results/${result.id}`} className="btn btn-secondary" style={{ padding: '6px 12px' }}>
                        Details
                      </Link>
                      <button
                        onClick={() => reportsApi.downloadCandidateReport(result.id)}
                        className="btn btn-outline"
                        style={{ padding: '6px 12px' }}
                      >
                        <FileText size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <Award size={48} color="#ccc" />
            <h3>No results yet</h3>
            <p>Process candidates to see the longlist</p>
          </div>
        )}
      </div>

      {/* All Candidates */}
      {results && results.length > 20 && (
        <div className="card mt-4">
          <div className="card-header">
            <h2 className="card-title">All Other Candidates</h2>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Candidate</th>
                <th>Final Score</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.filter(r => !r.is_in_longlist).map((result) => (
                <tr key={result.id}>
                  <td>{result.rank}</td>
                  <td>{result.candidate_name}</td>
                  <td>{result.final_score.toFixed(1)}</td>
                  <td>
                    {result.passes_cutoff ? (
                      <span className="badge badge-success">Pass</span>
                    ) : (
                      <span className="badge badge-danger">Below Cutoff</span>
                    )}
                  </td>
                  <td>
                    <Link to={`/results/${result.id}`} className="btn btn-secondary" style={{ padding: '6px 12px' }}>
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Results;
