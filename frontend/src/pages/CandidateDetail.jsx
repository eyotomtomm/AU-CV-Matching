import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download, Award, CheckCircle, XCircle, AlertTriangle, User } from 'lucide-react';
import { candidatesApi, reportsApi } from '../services/api';

function CandidateDetail() {
  const { resultId } = useParams();
  const navigate = useNavigate();

  const { data: result, isLoading } = useQuery({
    queryKey: ['result', resultId],
    queryFn: () => candidatesApi.getResult(resultId),
  });

  const getScoreClass = (score) => {
    if (score >= 70) return 'score-high';
    if (score >= 50) return 'score-medium';
    return 'score-low';
  };

  if (isLoading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  if (!result) {
    return <div className="alert alert-error">Result not found</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex-between mb-4">
        <div className="flex gap-4" style={{ alignItems: 'center' }}>
          <button onClick={() => navigate(-1)} className="btn btn-secondary">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '600' }}>{result.candidate_name}</h1>
            <p className="text-gray">
              Rank #{result.rank} • {result.candidate_nationality || 'Nationality not specified'}
            </p>
          </div>
        </div>
        <a href={reportsApi.downloadCandidateReport(resultId)} className="btn btn-primary">
          <Download size={18} />
          Download Detailed Report
        </a>
      </div>

      {/* Score Summary */}
      <div className="grid grid-4 mb-4">
        <div className="card text-center">
          <div className={`score-circle ${getScoreClass(result.final_score)}`} style={{ margin: '0 auto', width: '100px', height: '100px', fontSize: '28px' }}>
            {result.final_score.toFixed(0)}
          </div>
          <p className="text-bold mt-2">Final Score</p>
          <p className="text-small text-gray">Out of 100 + bonuses</p>
        </div>

        <div className="card">
          <h3 className="text-bold mb-2">Education Score</h3>
          <div className="stat-value" style={{ color: '#009639' }}>{result.education_total.toFixed(1)}</div>
          <div className="progress-bar mt-2">
            <div className="progress-fill" style={{ width: `${(result.education_total / 30) * 100}%` }}></div>
          </div>
          <p className="text-small text-gray mt-2">Out of 30 (30% weight)</p>
        </div>

        <div className="card">
          <h3 className="text-bold mb-2">Experience Score</h3>
          <div className="stat-value" style={{ color: '#009639' }}>{result.experience_total.toFixed(1)}</div>
          <div className="progress-bar mt-2">
            <div className="progress-fill" style={{ width: `${(result.experience_total / 70) * 100}%` }}></div>
          </div>
          <p className="text-small text-gray mt-2">Out of 70 (70% weight)</p>
        </div>

        <div className="card">
          <h3 className="text-bold mb-2">Bonus Points</h3>
          <div className="stat-value" style={{ color: '#FCDD09' }}>+{result.total_bonus}</div>
          <div className="mt-2">
            {result.bonus_female > 0 && <span className="badge badge-info" style={{ marginRight: '4px' }}>Female +5</span>}
            {result.bonus_age > 0 && <span className="badge badge-info" style={{ marginRight: '4px' }}>Age ≤35 +5</span>}
            {result.bonus_least_represented > 0 && <span className="badge badge-info" style={{ marginRight: '4px' }}>LRC +5</span>}
            {result.bonus_inclusion > 0 && <span className="badge badge-info">Inclusion +5</span>}
            {result.total_bonus === 0 && <span className="text-gray">No bonuses</span>}
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="card mb-4">
        <div className="flex gap-4" style={{ alignItems: 'center' }}>
          {result.passes_cutoff ? (
            <CheckCircle size={32} color="#388e3c" />
          ) : (
            <XCircle size={32} color="#D21034" />
          )}
          <div>
            <h2 className="text-bold">
              {result.passes_cutoff ? 'Meets Cutoff Requirements' : 'Below Cutoff Score'}
            </h2>
            <p className="text-gray">
              {result.is_in_longlist
                ? 'This candidate is in the Top 20 Longlist for SAIS review'
                : 'This candidate did not make it to the Top 20 Longlist'}
            </p>
          </div>
          {result.is_in_longlist && (
            <span className="badge badge-success" style={{ marginLeft: 'auto', padding: '8px 16px' }}>
              <Award size={16} style={{ marginRight: '4px' }} />
              Top 20 Longlist
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-2">
        {/* Education Breakdown */}
        <div className="card">
          <h2 className="card-title mb-4">Education Assessment (30%)</h2>
          {result.education_scores && Object.entries(result.education_scores).map(([key, data]) => (
            <div key={key} style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
              <div className="flex-between mb-2">
                <h3 className="text-bold">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                <span className={`badge ${data.score >= 7 ? 'badge-success' : data.score >= 4 ? 'badge-warning' : 'badge-danger'}`}>
                  {data.score}/{data.max}
                </span>
              </div>
              <div className="progress-bar mb-2">
                <div className="progress-fill" style={{ width: `${(data.score / data.max) * 100}%` }}></div>
              </div>
              <p className="text-small text-gray">{data.reasoning}</p>
            </div>
          ))}
        </div>

        {/* Experience Breakdown */}
        <div className="card">
          <h2 className="card-title mb-4">Experience Assessment (70%)</h2>
          {result.experience_scores && Object.entries(result.experience_scores).map(([key, data]) => (
            <div key={key} style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
              <div className="flex-between mb-2">
                <h3 className="text-bold">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                <span className={`badge ${data.score >= 7 ? 'badge-success' : data.score >= 4 ? 'badge-warning' : 'badge-danger'}`}>
                  {data.score}/{data.max}
                </span>
              </div>
              <div className="progress-bar mb-2">
                <div className="progress-fill" style={{ width: `${(data.score / data.max) * 100}%` }}></div>
              </div>
              <p className="text-small text-gray">{data.reasoning}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Overall Assessment */}
      <div className="card mt-4">
        <h2 className="card-title mb-4">Overall Assessment</h2>
        <p style={{ lineHeight: '1.8' }}>{result.overall_reasoning || 'No overall assessment provided.'}</p>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-2 mt-4">
        <div className="card">
          <h2 className="card-title mb-4" style={{ color: '#388e3c' }}>
            <CheckCircle size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Strengths
          </h2>
          {result.strengths && result.strengths.length > 0 ? (
            <ul style={{ paddingLeft: '20px' }}>
              {result.strengths.map((strength, index) => (
                <li key={index} style={{ marginBottom: '8px' }}>{strength}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray">No strengths identified</p>
          )}
        </div>

        <div className="card">
          <h2 className="card-title mb-4" style={{ color: '#D21034' }}>
            <AlertTriangle size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Areas of Concern / Gaps
          </h2>
          {result.weaknesses && result.weaknesses.length > 0 ? (
            <ul style={{ paddingLeft: '20px' }}>
              {result.weaknesses.map((weakness, index) => (
                <li key={index} style={{ marginBottom: '8px' }}>{weakness}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray">No concerns identified</p>
          )}
        </div>
      </div>

      {/* Flags */}
      {result.flags && result.flags.length > 0 && (
        <div className="card mt-4">
          <h2 className="card-title mb-4" style={{ color: '#f57c00' }}>
            <AlertTriangle size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Flags
          </h2>
          <ul style={{ paddingLeft: '20px' }}>
            {result.flags.map((flag, index) => (
              <li key={index} style={{ marginBottom: '8px', color: '#f57c00' }}>{flag}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      <div className="card mt-4">
        <h2 className="card-title mb-4">AI Recommendations</h2>
        <p style={{ lineHeight: '1.8' }}>{result.recommendations || 'No recommendations provided.'}</p>
      </div>
    </div>
  );
}

export default CandidateDetail;
