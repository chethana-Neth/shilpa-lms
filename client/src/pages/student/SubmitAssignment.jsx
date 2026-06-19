import React, { useState, useEffect, useContext } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AppContext } from '../../context/AppContext'
import Loading from '../../components/student/Loading'

const SubmitAssignment = () => {
    const { assignmentId } = useParams()
    const { backendUrl, userData, navigate } = useContext(AppContext)

    const [assignment, setAssignment] = useState(null)
    const [textAnswer, setTextAnswer] = useState('')
    const [file, setFile] = useState(null)
    const [existingSubmission, setExistingSubmission] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                const { data: aData } = await axios.get(
                    `${backendUrl}/api/assignments/get/${assignmentId}`
                );
                if (aData.success) setAssignment(aData.assignment);

                if (userData?.id) {
                    const { data: sData } = await axios.get(
                        `${backendUrl}/api/assignments/submission/${assignmentId}/${userData.id}`
                    );
                    if (sData.submission) {
                        setExistingSubmission(sData.submission);
                        setTextAnswer(sData.submission.text_answer || '');
                    }
                }
            } catch (error) {
                console.error("Load assignment error:", error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [assignmentId, userData]);

    const isOverdue = assignment?.deadline && new Date(assignment.deadline) < new Date();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userData?.id) return toast.error("Please log in.");
        if (!textAnswer.trim() && !file) return toast.error("Please provide a text answer or upload a file.");

        try {
            setSubmitting(true);
            const formData = new FormData();
            formData.append('assignment_id', assignmentId);
            formData.append('student_id', userData.id);
            if (textAnswer.trim()) formData.append('text_answer', textAnswer.trim());
            if (file) formData.append('submissionFile', file);

            const { data } = await axios.post(`${backendUrl}/api/assignments/submit`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (data.success) {
                toast.success(data.message);
                // Reload submission
                const { data: sData } = await axios.get(
                    `${backendUrl}/api/assignments/submission/${assignmentId}/${userData.id}`
                );
                if (sData.submission) setExistingSubmission(sData.submission);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Failed to submit assignment.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Loading />;
    if (!assignment) return (
        <div className='flex flex-col items-center justify-center min-h-screen text-gray-500'>
            <p>Assignment not found.</p>
            <button onClick={() => navigate(-1)} className='mt-4 text-blue-600 underline'>Go back</button>
        </div>
    );

    return (
        <div className='md:px-36 px-8 pt-20 pb-16 min-h-screen'>
            <button onClick={() => navigate(-1)} className='text-gray-500 hover:text-gray-800 text-sm mb-4 block'>← Back</button>

            <div className='max-w-2xl'>
                <h1 className='text-2xl font-semibold text-gray-800 mb-1'>{assignment.title}</h1>

                {/* Deadline badge */}
                {assignment.deadline && (
                    <div className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full mb-4 ${
                        isOverdue ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'
                    }`}>
                        {isOverdue ? '⚠ Deadline passed' : '📅 Due'}: {new Date(assignment.deadline).toLocaleString()}
                    </div>
                )}

                {/* Instructions */}
                {assignment.instructions && (
                    <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-5'>
                        <p className='text-sm font-medium text-blue-700 mb-1'>Instructions</p>
                        <p className='text-sm text-gray-700 whitespace-pre-wrap'>{assignment.instructions}</p>
                    </div>
                )}

                {/* Educator file download */}
                {assignment.file_path && (
                    <div className='bg-gray-50 border border-gray-200 rounded-lg p-4 mb-5 flex items-center gap-3'>
                        <span className='text-2xl'>📎</span>
                        <div>
                            <p className='text-sm font-medium text-gray-700'>Assignment File</p>
                            <a href={`${backendUrl}/uploads/${assignment.file_path}`}
                                target='_blank' rel='noopener noreferrer'
                                className='text-sm text-blue-600 underline'>
                                Download
                            </a>
                        </div>
                    </div>
                )}

                {/* Previous submission info */}
                {existingSubmission && (
                    <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-5'>
                        <p className='text-sm font-medium text-yellow-700'>
                            ✓ You submitted this assignment on {new Date(existingSubmission.submitted_at).toLocaleString()}
                        </p>
                        {existingSubmission.grade && (
                            <p className='text-sm text-gray-700 mt-1'>
                                Grade: <span className='font-medium'>{existingSubmission.grade}</span>
                                {existingSubmission.feedback && ` — ${existingSubmission.feedback}`}
                            </p>
                        )}
                        <p className='text-xs text-gray-500 mt-1'>You can resubmit to update your answer.</p>
                    </div>
                )}

                {/* Submission form */}
                <form onSubmit={handleSubmit} className='bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-4'>
                    <div className='flex flex-col gap-1'>
                        <label className='text-sm font-medium text-gray-700'>Your Answer (typed)</label>
                        <textarea
                            value={textAnswer}
                            onChange={e => setTextAnswer(e.target.value)}
                            placeholder='Type your answer here...'
                            rows={6}
                            className='border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-400 resize-none text-sm'
                        />
                    </div>

                    <div className='flex flex-col gap-1'>
                        <label className='text-sm font-medium text-gray-700'>Upload File (optional)</label>
                        <input type="file" onChange={e => setFile(e.target.files[0])}
                            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.zip"
                            className='text-sm text-gray-500' />
                        {file && <p className='text-xs text-green-600'>Selected: {file.name}</p>}
                        {existingSubmission?.file_path && !file && (
                            <p className='text-xs text-gray-500'>
                                Previously uploaded: <a href={`${backendUrl}/uploads/${existingSubmission.file_path}`}
                                    target='_blank' rel='noopener noreferrer' className='text-blue-600 underline'>View file</a>
                            </p>
                        )}
                    </div>

                    <button type='submit' disabled={submitting}
                        className={`py-3 rounded text-white font-medium ${
                            submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-800 hover:bg-red-700'
                        }`}>
                        {submitting ? 'Submitting...' : existingSubmission ? 'Resubmit' : 'Submit Assignment'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SubmitAssignment;
