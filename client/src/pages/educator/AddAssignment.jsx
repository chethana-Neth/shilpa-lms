import React, { useState, useContext } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AppContext } from '../../context/AppContext'

const AddAssignment = () => {
    const { lectureId } = useParams()
    const { backendUrl, navigate } = useContext(AppContext)

    const [title, setTitle] = useState('')
    const [instructions, setInstructions] = useState('')
    const [deadline, setDeadline] = useState('')
    const [file, setFile] = useState(null)
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!title.trim()) return toast.error("Assignment title is required.")

        try {
            setSubmitting(true)
            const formData = new FormData()
            formData.append('lecture_id', lectureId)
            formData.append('title', title.trim())
            formData.append('instructions', instructions)
            if (deadline) formData.append('deadline', deadline)
            if (file) formData.append('assignmentFile', file)

            const { data } = await axios.post(`${backendUrl}/api/assignments/create`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            if (data.success) {
                toast.success("Assignment created successfully!")
                navigate(-1)
            } else {
                toast.error(data.message || "Failed to create assignment.")
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create assignment.")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className='min-h-screen md:p-8 p-4 pt-8'>
            <div className='max-w-2xl'>
                <div className='flex items-center gap-3 mb-6'>
                    <button onClick={() => navigate(-1)} className='text-gray-500 hover:text-gray-800'>← Back</button>
                    <h1 className='text-xl font-semibold text-gray-800'>Create Assignment</h1>
                </div>

                <form onSubmit={handleSubmit} className='bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-5'>

                    <div className='flex flex-col gap-1'>
                        <label className='text-sm font-medium text-gray-700'>Assignment Title *</label>
                        <input value={title} onChange={e => setTitle(e.target.value)}
                            type="text" placeholder='e.g. Chapter 1 Assignment'
                            className='border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-400' required />
                    </div>

                    <div className='flex flex-col gap-1'>
                        <label className='text-sm font-medium text-gray-700'>Instructions</label>
                        <textarea value={instructions} onChange={e => setInstructions(e.target.value)}
                            placeholder='Describe the assignment tasks, requirements and expectations...'
                            rows={5}
                            className='border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-400 resize-none' />
                    </div>

                    <div className='flex flex-col gap-1'>
                        <label className='text-sm font-medium text-gray-700'>Deadline (optional)</label>
                        <input value={deadline} onChange={e => setDeadline(e.target.value)}
                            type="datetime-local"
                            className='border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-400 w-fit' />
                    </div>

                    <div className='flex flex-col gap-1'>
                        <label className='text-sm font-medium text-gray-700'>Attachment (optional — PDF, doc, etc.)</label>
                        <input type="file" onChange={e => setFile(e.target.files[0])}
                            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                            className='text-sm text-gray-500' />
                        {file && <p className='text-xs text-green-600'>Selected: {file.name}</p>}
                    </div>

                    <button type='submit' disabled={submitting}
                        className={`py-3 rounded text-white font-medium mt-2 ${submitting ? 'bg-gray-400' : 'bg-black hover:bg-gray-800'}`}>
                        {submitting ? 'Creating...' : 'CREATE ASSIGNMENT'}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default AddAssignment
