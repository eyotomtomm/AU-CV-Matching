import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Save, FileText, Check, Plus, Trash2, RefreshCw, Upload, Type, Sparkles } from 'lucide-react';
import { jobsApi } from '../services/api';

function JobCreate() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Enter JD, 2: Review & Edit
  const [inputMode, setInputMode] = useState('paste');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [rawJdText, setRawJdText] = useState('');

  // Job metadata (auto-filled by AI, editable)
  const [formData, setFormData] = useState({
    title: '',
    reference_number: '',
    department: '',
    directorate: 'Human Resources Management Directorate',
    duty_station: '',
    grade_level: 'P3',
    description: '',
    raw_jd_text: '',
  });

  // Extracted criteria for review
  const [educationCriteria, setEducationCriteria] = useState([]);
  const [experienceCriteria, setExperienceCriteria] = useState([]);

  // Extract mutation: calls AI to get metadata + criteria
  const extractMutation = useMutation({
    mutationFn: (text) => jobsApi.extract(text),
    onSuccess: (data) => {
      setFormData(prev => ({
        ...prev,
        title: data.title || '',
        reference_number: data.reference_number || '',
        grade_level: data.grade_level || 'P3',
        department: data.department || '',
        duty_station: data.duty_station || '',
        raw_jd_text: rawJdText,
      }));
      setEducationCriteria(data.education_criteria || []);
      setExperienceCriteria(data.experience_criteria || []);
      setStep(2);
    },
  });

  // Create mutation: saves the job with all data
  const createMutation = useMutation({
    mutationFn: jobsApi.create,
    onSuccess: (data) => {
      navigate(`/jobs/${data.id}`);
    },
  });

  // Upload JD file
  const uploadJDMutation = useMutation({
    mutationFn: jobsApi.uploadJD,
    onSuccess: (data) => {
      setRawJdText(data.text);
      setUploadStatus({ type: 'success', message: `Extracted text from ${uploadedFile.name}` });
    },
    onError: (error) => {
      setUploadStatus({ type: 'error', message: error.response?.data?.detail || 'Failed to extract text from file' });
    },
  });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const processFile = (file) => {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(ext)) {
      setUploadStatus({ type: 'error', message: 'Only PDF, DOC, DOCX files are allowed' });
      return;
    }
    setUploadedFile(file);
    setUploadStatus({ type: 'info', message: 'Extracting text...' });
    uploadJDMutation.mutate(file);
  };

  const handleExtract = (e) => {
    e.preventDefault();
    if (!rawJdText.trim()) {
      setUploadStatus({ type: 'error', message: 'Please paste or upload a job description' });
      return;
    }
    extractMutation.mutate(rawJdText);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveJob = () => {
    createMutation.mutate({
      ...formData,
      education_criteria: educationCriteria,
      experience_criteria: experienceCriteria,
    });
  };

  const updateEducationCriterion = (index, field, value) => {
    const updated = [...educationCriteria];
    updated[index] = { ...updated[index], [field]: value };
    setEducationCriteria(updated);
  };

  const updateExperienceCriterion = (index, field, value) => {
    const updated = [...experienceCriteria];
    updated[index] = { ...updated[index], [field]: value };
    setExperienceCriteria(updated);
  };

  const deleteEducationCriterion = (index) => {
    setEducationCriteria(educationCriteria.filter((_, i) => i !== index));
  };

  const deleteExperienceCriterion = (index) => {
    setExperienceCriteria(experienceCriteria.filter((_, i) => i !== index));
  };

  const addEducationCriterion = () => {
    setEducationCriteria([...educationCriteria, {
      id: `edu_${Date.now()}`,
      name: 'New Criterion',
      description: '',
      is_mandatory: true
    }]);
  };

  const addExperienceCriterion = () => {
    if (experienceCriteria.length >= 7) {
      alert('Maximum 7 experience criteria allowed');
      return;
    }
    setExperienceCriteria([...experienceCriteria, {
      id: `exp_${Date.now()}`,
      name: 'New Criterion',
      description: '',
      years_required: 0,
      is_mandatory: true
    }]);
  };

  // Step 1: Upload/Paste JD text only
  if (step === 1) {
    return (
      <div>
        <div className="flex gap-4 mb-4" style={{ alignItems: 'center' }}>
          <button onClick={() => navigate('/')} className="btn btn-secondary">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '600' }}>Create New Job</h1>
            <p className="text-gray">Step 1: Provide the job description — AI will extract everything</p>
          </div>
        </div>

        {extractMutation.error && (
          <div className="alert alert-error mb-4">
            {extractMutation.error.response?.data?.detail || extractMutation.error.message}
          </div>
        )}

        <form onSubmit={handleExtract}>
          <div className="card">
            <h2 className="card-title mb-4">
              <FileText size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Job Description
            </h2>

            {/* Toggle between paste and upload */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                className={`btn ${inputMode === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setInputMode('upload')}
              >
                <Upload size={16} /> Upload File
              </button>
              <button
                type="button"
                className={`btn ${inputMode === 'paste' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setInputMode('paste')}
              >
                <Type size={16} /> Paste Text
              </button>
            </div>

            {inputMode === 'upload' && (
              <>
                <div
                  className={`upload-area ${dragOver ? 'dragover' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('jd-file-input').click()}
                  style={{ marginBottom: '16px' }}
                >
                  <input
                    id="jd-file-input"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  <Upload size={32} color="#009639" />
                  <p className="mt-2">
                    <strong>Drop JD file here</strong> or click to browse
                  </p>
                  <p className="text-small text-gray">PDF, DOC, DOCX supported</p>
                  {uploadedFile && (
                    <p className="text-small mt-2" style={{ color: '#009639' }}>
                      Selected: {uploadedFile.name}
                    </p>
                  )}
                </div>

                {uploadStatus && (
                  <div className={`alert alert-${uploadStatus.type === 'error' ? 'error' : uploadStatus.type === 'success' ? 'success' : 'info'} mb-4`}>
                    {uploadStatus.message}
                  </div>
                )}
              </>
            )}

            <p className="text-gray mb-2 text-small">
              {inputMode === 'upload' ? 'Extracted text (you can edit):' : 'Paste the full job description:'}
            </p>

            <div className="form-group">
              <textarea
                name="raw_jd_text"
                className="form-textarea"
                value={rawJdText}
                onChange={(e) => setRawJdText(e.target.value)}
                placeholder="Paste or upload the complete job description text here..."
                style={{ minHeight: inputMode === 'upload' ? '250px' : '400px' }}
                required
              />
            </div>

            <p className="text-small text-gray">
              AI will extract: Job title, grade level, department, duty station, reference number, 3 Education criteria (30%) + 7 Experience criteria (70%)
            </p>
          </div>

          <div className="flex gap-4 mt-4" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={extractMutation.isPending || !rawJdText.trim()}>
              {extractMutation.isPending ? (
                <>
                  <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                  Extracting with AI...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Extract with AI
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Step 2: Review & Edit all extracted data
  return (
    <div>
      <div className="flex gap-4 mb-4" style={{ alignItems: 'center' }}>
        <button onClick={() => setStep(1)} className="btn btn-secondary">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '600' }}>Review Extracted Data</h1>
          <p className="text-gray">Step 2: Review and edit the AI-extracted job details and criteria</p>
        </div>
      </div>

      {createMutation.error && (
        <div className="alert alert-error mb-4">
          {createMutation.error.response?.data?.detail || createMutation.error.message}
        </div>
      )}

      <div className="alert alert-info mb-4">
        <strong>AI has extracted the job details and criteria below.</strong> Review and edit anything before saving.
      </div>

      {/* Job Details Card */}
      <div className="card mb-4">
        <h2 className="card-title mb-4">Job Details</h2>
        <div className="grid grid-2" style={{ gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Job Title *</label>
            <input
              type="text"
              name="title"
              className="form-input"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Senior Policy Officer"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Reference Number</label>
            <input
              type="text"
              name="reference_number"
              className="form-input"
              value={formData.reference_number}
              onChange={handleChange}
              placeholder="e.g., AUC/HRMD/2024/001"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Grade Level *</label>
            <select
              name="grade_level"
              className="form-select"
              value={formData.grade_level}
              onChange={handleChange}
              required
            >
              <option value="P1">P1</option>
              <option value="P2">P2</option>
              <option value="P3">P3</option>
              <option value="P4">P4</option>
              <option value="P5">P5</option>
              <option value="P6">P6</option>
              <option value="D1">D1</option>
              <option value="D2">D2</option>
            </select>
            <p className="text-small text-gray mt-2">
              P5+: 70% cutoff | P4 and below: 60% cutoff
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">Department</label>
            <input
              type="text"
              name="department"
              className="form-input"
              value={formData.department}
              onChange={handleChange}
              placeholder="e.g., Political Affairs"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Duty Station</label>
            <input
              type="text"
              name="duty_station"
              className="form-input"
              value={formData.duty_station}
              onChange={handleChange}
              placeholder="e.g., Addis Ababa, Ethiopia"
            />
          </div>
        </div>
      </div>

      {/* Criteria */}
      <div className="grid grid-2">
        {/* Education Criteria */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Education Criteria (30%)</h2>
            <button className="btn btn-secondary" onClick={addEducationCriterion}>
              <Plus size={16} /> Add
            </button>
          </div>

          {educationCriteria.map((criterion, index) => (
            <div key={criterion.id || index} style={{
              padding: '16px',
              marginBottom: '12px',
              background: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <div className="flex-between mb-2">
                <input
                  type="text"
                  className="form-input"
                  value={criterion.name}
                  onChange={(e) => updateEducationCriterion(index, 'name', e.target.value)}
                  style={{ fontWeight: '600', marginBottom: '8px' }}
                />
                <button
                  className="btn btn-danger"
                  style={{ padding: '6px 10px' }}
                  onClick={() => deleteEducationCriterion(index)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <textarea
                className="form-textarea"
                value={criterion.description}
                onChange={(e) => updateEducationCriterion(index, 'description', e.target.value)}
                placeholder="Description..."
                style={{ minHeight: '80px' }}
              />
            </div>
          ))}

          {educationCriteria.length === 0 && (
            <p className="text-gray text-center" style={{ padding: '20px' }}>
              No education criteria. Click "Add" to create one.
            </p>
          )}
        </div>

        {/* Experience Criteria */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Experience Criteria (70%)</h2>
            <button
              className="btn btn-secondary"
              onClick={addExperienceCriterion}
              disabled={experienceCriteria.length >= 7}
            >
              <Plus size={16} /> Add ({experienceCriteria.length}/7)
            </button>
          </div>

          {experienceCriteria.map((criterion, index) => (
            <div key={criterion.id || index} style={{
              padding: '16px',
              marginBottom: '12px',
              background: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <div className="flex-between mb-2">
                <input
                  type="text"
                  className="form-input"
                  value={criterion.name}
                  onChange={(e) => updateExperienceCriterion(index, 'name', e.target.value)}
                  style={{ fontWeight: '600', marginBottom: '8px' }}
                />
                <button
                  className="btn btn-danger"
                  style={{ padding: '6px 10px' }}
                  onClick={() => deleteExperienceCriterion(index)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <textarea
                className="form-textarea"
                value={criterion.description}
                onChange={(e) => updateExperienceCriterion(index, 'description', e.target.value)}
                placeholder="Description..."
                style={{ minHeight: '80px' }}
              />
              <div className="flex gap-4 mt-2" style={{ alignItems: 'center' }}>
                <label className="text-small">Years Required:</label>
                <input
                  type="number"
                  className="form-input"
                  value={criterion.years_required || 0}
                  onChange={(e) => updateExperienceCriterion(index, 'years_required', parseInt(e.target.value) || 0)}
                  style={{ width: '80px' }}
                  min="0"
                />
              </div>
            </div>
          ))}

          {experienceCriteria.length === 0 && (
            <p className="text-gray text-center" style={{ padding: '20px' }}>
              No experience criteria. Click "Add" to create one.
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-4 mt-4" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary" onClick={() => setStep(1)}>
          <ArrowLeft size={18} /> Back to JD
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSaveJob}
          disabled={createMutation.isPending || !formData.title.trim() || educationCriteria.length === 0 || experienceCriteria.length === 0}
        >
          {createMutation.isPending ? (
            <>
              <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
              Saving...
            </>
          ) : (
            <>
              <Save size={18} />
              Save Job
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default JobCreate;
