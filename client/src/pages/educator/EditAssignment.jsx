import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContext } from '../../context/AppContext';

const EditAssignment = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { backendUrl } = useContext(AppContext);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    instructions: '',
    deadline: '',
    file: null
  });
  const [existingFile, setExistingFile] = useState(null);

  // Fetch existing assignment
  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/assignments/get/${assignmentId}`);
        if (data.success && data.assignment) {
          const assign = data.assignment;
          setFormData({
            title: assign.title,
            instructions: assign.instructions || '',
            deadline: assign.deadline ? assign.deadline.slice(0, 16) : '',
            file: null
          });
          setExistingFile(assign.file_path);
        } else {
          toast.error('Assignment not found');
          navigate('/educator/my-courses');
        }
      } catch (error) {
        console.error('Fetch assignment error:', error);
        toast.error('Failed to load assignment');
      } finally {
        setLoading(false);
      }
    };
    fetchAssignment();
  }, [assignmentId, backendUrl, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, file: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Assignment title is required');
      return;
    }

    setSaving(true);
    const submitData = new FormData();
    submitData.append('title', formData.title);
    submitData.append('instructions', formData.instructions);
    if (formData.deadline) submitData.append('deadline', formData.deadline);
    if (formData.file) submitData.append('assignmentFile', formData.file);

    try {
      await axios.put(`${backendUrl}/api/assignments/${assignmentId}`, submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Assignment updated successfully!');
      navigate('/educator/my-courses');
    } catch (error) {
      console.error('Update assignment error:', error);
      toast.error(error.response?.data?.message || 'Failed to update assignment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading assignment...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Assignment</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block font-medium mb-1">Assignment Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Instructions (optional)</label>
          <textarea
            name="instructions"
            value={formData.instructions}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            rows="5"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Deadline (optional)</label>
          <input
            type="datetime-local"
            name="deadline"
            value={formData.deadline}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Assignment File (optional)</label>
          {existingFile && (
            <div className="mb-2 text-sm text-gray-600">
              Current file: <a href={`${backendUrl}/uploads/${existingFile}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View</a>
            </div>
          )}
          <input
            type="file"
            onChange={handleFileChange}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">Leave empty to keep current file</p>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="bg-gray-300 text-gray-800 px-6 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditAssignment;