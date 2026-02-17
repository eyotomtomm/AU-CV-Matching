import { useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Upload, Play, FileText, Download, Users,
  CheckCircle, AlertCircle, Trash2, RefreshCw
} from 'lucide-react';
import { jobsApi, candidatesApi, reportsApi } from '../services/api';

function JobDetail() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dragOver, setDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobsApi.get(jobId),
  });

  const { data: candidates, isLoading: candidatesLoading } = useQuery({
    queryKey: ['candidates', jobId],
    queryFn: () => candidatesApi.list(jobId),
  });

  const { data: statistics } = useQuery({
    queryKey: ['statistics', jobId],
    queryFn: () => jobsApi.getStatistics(jobId),
    enabled: !!job && (job.status === 'screening' || job.status === 'completed'),
  });

  const uploadMutation = useMutation({
    mutationFn: (files) => candidatesApi.uploadBulk(jobId, files),
    onSuccess: (data) => {
      setUploadStatus({
        type: 'success',
        message: `Uploaded ${data.successful.length} CVs successfully`,
        errors: data.errors,
      });
      queryClient.invalidateQueries(['candidates', jobId]);
    },
    onError: (error) => {
      setUploadStatus({
        type: 'error',
        message: error.response?.data?.detail || error.message,
      });
    },
  });

  const processMutation = useMutation({
    mutationFn: () => candidatesApi.processAll(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries(['job', jobId]);
      queryClient.invalidateQueries(['statistics', jobId]);
      navigate(`/jobs/${jobId}/results`);
    },
  });

  const deleteCandidateMutation = useMutation({
    mutationFn: candidatesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['candidates', jobId]);
    },
  });

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      uploadMutation.mutate(files);
    }
  }, [uploadMutation]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      uploadMutation.mutate(files);
    }
  };

  if (jobLoading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  if (!job) {
    return <div className="alert alert-error">Job not found</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex-between mb-4">
        <div className="flex gap-4" style={{ alignItems: 'center' }}>
          <button onClick={() => navigate('/')} className="btn btn-secondary">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '600' }}>{job.title}</h1>
            <p className="text-gray">
              {job.reference_number && `${job.reference_number} • `}
              Grade {job.grade_level} • Cutoff: {job.min_pass_mark}%
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {(job.status === 'screening' || job.status === 'completed') && (
            <>
              <Link to={`/jobs/${jobId}/results`} className="btn btn-primary">
                <FileText size={18} />
                View Results
              </Link>
              <a href={reportsApi.downloadLonglistDocx(jobId)} className="btn btn-secondary">
                <Download size={18} />
                DOCX
              </a>
              <a href={reportsApi.downloadLonglistExcel(jobId)} className="btn btn-secondary">
                <Download size={18} />
                Excel
              </a>
            </>
          )}
        </div>
      </div>

      {/* Status & Stats */}
      {statistics && (
        <div className="grid grid-4 mb-4">
          <div className="stat-card">
            <div className="stat-value">{statistics.total_candidates}</div>
            <div className="stat-label">Total Candidates</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#388e3c' }}>{statistics.passing_cutoff}</div>
            <div className="stat-label">Passing Cutoff</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{statistics.longlist_count}</div>
            <div className="stat-label">In Longlist (Top 20)</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {statistics.score_statistics?.average?.toFixed(1) || 0}
            </div>
            <div className="stat-label">Average Score</div>
          </div>
        </div>
      )}

      <div className="grid grid-2">
        {/* Criteria */}
        <div className="card">
          <h2 className="card-title mb-4">Extracted Criteria</h2>

          <h3 className="text-bold mb-2">Education (30%)</h3>
          {job.education_criteria && job.education_criteria.length > 0 ? (
            <ul style={{ paddingLeft: '20px', marginBottom: '20px' }}>
              {job.education_criteria.map((criterion, index) => (
                <li key={index} style={{ marginBottom: '8px' }}>
                  <strong>{criterion.name}</strong>
                  <p className="text-small text-gray">{criterion.description}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray">No education criteria extracted</p>
          )}

          <h3 className="text-bold mb-2">Experience (70%)</h3>
          {job.experience_criteria && job.experience_criteria.length > 0 ? (
            <ul style={{ paddingLeft: '20px' }}>
              {job.experience_criteria.map((criterion, index) => (
                <li key={index} style={{ marginBottom: '8px' }}>
                  <strong>{criterion.name}</strong>
                  {criterion.years_required && (
                    <span className="badge badge-info" style={{ marginLeft: '8px' }}>
                      {criterion.years_required}+ years
                    </span>
                  )}
                  <p className="text-small text-gray">{criterion.description}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray">No experience criteria extracted</p>
          )}
        </div>

        {/* Upload & Candidates */}
        <div className="card">
          <h2 className="card-title mb-4">
            <Users size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Candidates ({candidates?.length || 0})
          </h2>

          {/* Upload Area */}
          {job.status !== 'completed' && (
            <>
              <div
                className={`upload-area ${dragOver ? 'dragover' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input').click()}
              >
                <input
                  id="file-input"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <Upload size={32} color="#009639" />
                <p className="mt-2">
                  <strong>Drop CVs here</strong> or click to browse
                </p>
                <p className="text-small text-gray">PDF, DOC, DOCX files supported</p>
              </div>

              {uploadMutation.isPending && (
                <div className="alert alert-info mt-4">
                  <div className="flex gap-2" style={{ alignItems: 'center' }}>
                    <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                    Uploading and parsing CVs...
                  </div>
                </div>
              )}

              {uploadStatus && (
                <div className={`alert ${uploadStatus.type === 'success' ? 'alert-success' : 'alert-error'} mt-4`}>
                  {uploadStatus.message}
                  {uploadStatus.errors?.length > 0 && (
                    <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                      {uploadStatus.errors.map((err, i) => (
                        <li key={i}>{err.filename}: {err.error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          )}

          {/* Candidates List */}
          {candidatesLoading ? (
            <div className="loading"><div className="spinner"></div></div>
          ) : candidates && candidates.length > 0 ? (
            <>
              <div style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '16px' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Gender</th>
                      <th>Nationality</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map((candidate) => (
                      <tr key={candidate.id}>
                        <td>{candidate.full_name}</td>
                        <td>
                          <span className={`badge ${candidate.gender === 'female' ? 'badge-info' : 'badge-gray'}`}>
                            {candidate.gender || 'N/S'}
                          </span>
                        </td>
                        <td>{candidate.nationality || '-'}</td>
                        <td>
                          {job.status !== 'completed' && (
                            <button
                              className="btn btn-danger"
                              style={{ padding: '4px 8px' }}
                              onClick={() => deleteCandidateMutation.mutate(candidate.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Process Button */}
              {job.status === 'active' && candidates.length > 0 && (
                <button
                  className="btn btn-primary mt-4"
                  style={{ width: '100%' }}
                  onClick={() => processMutation.mutate()}
                  disabled={processMutation.isPending}
                >
                  {processMutation.isPending ? (
                    <>
                      <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                      Processing with AI... This may take a while
                    </>
                  ) : (
                    <>
                      <Play size={18} />
                      Start AI Matching ({candidates.length} candidates)
                    </>
                  )}
                </button>
              )}

              {processMutation.error && (
                <div className="alert alert-error mt-4">
                  {processMutation.error.response?.data?.detail || processMutation.error.message}
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <Users size={32} color="#ccc" />
              <p>No candidates uploaded yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default JobDetail;
