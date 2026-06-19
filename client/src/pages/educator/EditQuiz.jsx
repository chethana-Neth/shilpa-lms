import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContext } from '../../context/AppContext';

const EditQuiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { backendUrl } = useContext(AppContext);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    time_limit: '',
    questions: []
  });

  // Fetch existing quiz data
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/quizzes/take/${quizId}`);
        if (data.success && data.quiz) {
          const quiz = data.quiz;
          setQuizData({
            title: quiz.title,
            description: quiz.description || '',
            time_limit: quiz.time_limit || '',
            questions: quiz.questions.map(q => ({
              question_text: q.question_text,
              options: q.options.map(opt => ({
                option_text: opt.option_text,
                is_correct: opt.is_correct || false
              }))
            }))
          });
        } else {
          toast.error('Quiz not found');
          navigate('/educator/my-courses');
        }
      } catch (error) {
        console.error('Fetch quiz error:', error);
        toast.error('Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId, backendUrl, navigate]);

  // Handlers for quiz structure
  const handleTitleChange = (e) => {
    setQuizData({ ...quizData, title: e.target.value });
  };

  const handleDescriptionChange = (e) => {
    setQuizData({ ...quizData, description: e.target.value });
  };

  const handleTimeLimitChange = (e) => {
    setQuizData({ ...quizData, time_limit: e.target.value });
  };

  const addQuestion = () => {
    setQuizData({
      ...quizData,
      questions: [
        ...quizData.questions,
        {
          question_text: '',
          options: [
            { option_text: '', is_correct: false },
            { option_text: '', is_correct: false }
          ]
        }
      ]
    });
  };

  const removeQuestion = (index) => {
    const updated = [...quizData.questions];
    updated.splice(index, 1);
    setQuizData({ ...quizData, questions: updated });
  };

  const handleQuestionTextChange = (qIndex, value) => {
    const updated = [...quizData.questions];
    updated[qIndex].question_text = value;
    setQuizData({ ...quizData, questions: updated });
  };

  const addOption = (qIndex) => {
    const updated = [...quizData.questions];
    updated[qIndex].options.push({ option_text: '', is_correct: false });
    setQuizData({ ...quizData, questions: updated });
  };

  const removeOption = (qIndex, oIndex) => {
    const updated = [...quizData.questions];
    updated[qIndex].options.splice(oIndex, 1);
    setQuizData({ ...quizData, questions: updated });
  };

  const handleOptionTextChange = (qIndex, oIndex, value) => {
    const updated = [...quizData.questions];
    updated[qIndex].options[oIndex].option_text = value;
    setQuizData({ ...quizData, questions: updated });
  };

  const handleCorrectChange = (qIndex, oIndex) => {
    const updated = [...quizData.questions];
    updated[qIndex].options.forEach((opt, idx) => {
      opt.is_correct = idx === oIndex;
    });
    setQuizData({ ...quizData, questions: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!quizData.title.trim()) {
      toast.error('Quiz title is required');
      return;
    }
    if (quizData.questions.length === 0) {
      toast.error('Add at least one question');
      return;
    }
    for (let i = 0; i < quizData.questions.length; i++) {
      const q = quizData.questions[i];
      if (!q.question_text.trim()) {
        toast.error(`Question ${i + 1} text is empty`);
        return;
      }
      if (q.options.length < 2) {
        toast.error(`Question ${i + 1} must have at least 2 options`);
        return;
      }
      let hasCorrect = false;
      for (let opt of q.options) {
        if (!opt.option_text.trim()) {
          toast.error(`Option text missing in question ${i + 1}`);
          return;
        }
        if (opt.is_correct) hasCorrect = true;
      }
      if (!hasCorrect) {
        toast.error(`Question ${i + 1} must have one correct answer`);
        return;
      }
    }

    setSaving(true);
    try {
      await axios.put(`${backendUrl}/api/quizzes/${quizId}`, quizData);
      toast.success('Quiz updated successfully!');
      navigate('/educator/my-courses');
    } catch (error) {
      console.error('Update quiz error:', error);
      toast.error(error.response?.data?.message || 'Failed to update quiz');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading quiz...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Quiz</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block font-medium mb-1">Quiz Title *</label>
          <input
            type="text"
            value={quizData.title}
            onChange={handleTitleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block font-medium mb-1">Description (optional)</label>
          <textarea
            value={quizData.description}
            onChange={handleDescriptionChange}
            className="w-full border rounded px-3 py-2"
            rows="3"
          />
        </div>

        {/* Time limit */}
        <div>
          <label className="block font-medium mb-1">Time Limit (minutes, optional)</label>
          <input
            type="number"
            value={quizData.time_limit}
            onChange={handleTimeLimitChange}
            className="w-full border rounded px-3 py-2"
            min="0"
          />
        </div>

        {/* Questions */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Questions</h2>
            <button type="button" onClick={addQuestion} className="bg-blue-600 text-white px-3 py-1 rounded">
              + Add Question
            </button>
          </div>

          {quizData.questions.map((question, qIndex) => (
            <div key={qIndex} className="border p-4 rounded-lg bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-medium">Question {qIndex + 1}</h3>
                <button
                  type="button"
                  onClick={() => removeQuestion(qIndex)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
              <div className="mb-3">
                <input
                  type="text"
                  value={question.question_text}
                  onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                  placeholder="Question text"
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div className="ml-4">
                <label className="block text-sm font-medium mb-2">Options</label>
                {question.options.map((option, oIndex) => (
                  <div key={oIndex} className="flex items-center gap-2 mb-2">
                    <input
                      type="radio"
                      name={`correct_${qIndex}`}
                      checked={option.is_correct}
                      onChange={() => handleCorrectChange(qIndex, oIndex)}
                    />
                    <input
                      type="text"
                      value={option.option_text}
                      onChange={(e) => handleOptionTextChange(qIndex, oIndex, e.target.value)}
                      placeholder={`Option ${oIndex + 1}`}
                      className="flex-1 border rounded px-3 py-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(qIndex, oIndex)}
                      className="text-red-500"
                      disabled={question.options.length <= 2}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addOption(qIndex)}
                  className="text-sm text-blue-600 mt-1"
                >
                  + Add Option
                </button>
              </div>
            </div>
          ))}
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

export default EditQuiz;