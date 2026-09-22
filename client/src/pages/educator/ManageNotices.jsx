import React, { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AppContext } from '../../context/AppContext'

const ManageNotices = () => {
  const { courseId } = useParams()
  const { backendUrl, navigate } = useContext(AppContext)

  const [notices, setNotices] = useState([])
  const [courseTitle, setCourseTitle] = useState('')
  const [loading, setLoading] = useState(true)

  // Form state
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Edit state
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editMessage, setEditMessage] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)

  // Delete state
  const [deletingId, setDeletingId] = useState(null)

  const fetchNotices = async () => {
    try {
      const [noticesRes, courseRes] = await Promise.all([
        axios.get(`${backendUrl}/api/notices/${courseId}`),
        axios.get(`${backendUrl}/api/courses/${courseId}`)
      ])
      if (noticesRes.data.success) setNotices(noticesRes.data.notices)
      if (courseRes.data.success) setCourseTitle(courseRes.data.courseData.courseTitle)
    } catch (error) {
      console.error('Error fetching notices', error)
      toast.error('Failed to load notices.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) return toast.error('Title and message are required.')
    setSubmitting(true)
    try {
      const { data } = await axios.post(`${backendUrl}/api/notices/create`, {
        course_id: courseId,
        title: title.trim(),
        message: message.trim()
      })
      if (data.success) {
        setNotices(prev => [data.notice, ...prev])
        setTitle('')
        setMessage('')
        toast.success('Notice posted!')
      }
    } catch (error) {
      toast.error('Failed to post notice.')
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (notice) => {
    setEditingId(notice.notice_id)
    setEditTitle(notice.title)
    setEditMessage(notice.message)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
    setEditMessage('')
  }

  const handleUpdate = async (noticeId) => {
    if (!editTitle.trim() || !editMessage.trim()) return toast.error('Title and message are required.')
    setEditSubmitting(true)
    try {
      const { data } = await axios.put(`${backendUrl}/api/notices/${noticeId}`, {
        title: editTitle.trim(),
        message: editMessage.trim()
      })
      if (data.success) {
        setNotices(prev => prev.map(n =>
          n.notice_id === noticeId
            ? { ...n, title: editTitle.trim(), message: editMessage.trim() }
            : n
        ))
        cancelEdit()
        toast.success('Notice updated.')
      }
    } catch (error) {
      toast.error('Failed to update notice.')
    } finally {
      setEditSubmitting(false)
    }
  }

  const handleDelete = async (noticeId) => {
    if (!window.confirm('Delete this notice? This cannot be undone.')) return
    setDeletingId(noticeId)
    try {
      const { data } = await axios.delete(`${backendUrl}/api/notices/${noticeId}`)
      if (data.success) {
        setNotices(prev => prev.filter(n => n.notice_id !== noticeId))
        toast.success('Notice deleted.')
      }
    } catch (error) {
      toast.error('Failed to delete notice.')
    } finally {
      setDeletingId(null)
    }
  }

  useEffect(() => { fetchNotices() }, [courseId])

  if (loading) return (
    <div className='flex items-center justify-center min-h-screen'>
      <p className='text-gray-500'>Loading notices...</p>
    </div>
  )

  return (
    <div className='min-h-screen p-6 md:p-10 max-w-3xl mx-auto'>

      {/* Header */}
      <div className='flex items-center gap-3 mb-8'>
        <button
          onClick={() => navigate('/educator/my-courses')}
          className='text-gray-400 hover:text-gray-600 transition'
        >
          ← Back
        </button>
        <div>
          <h1 className='text-2xl font-bold text-gray-800'>Manage Notices</h1>
          <p className='text-sm text-gray-500 mt-0.5'>{courseTitle}</p>
        </div>
      </div>

      {/* Create notice form */}
      <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8'>
        <h2 className='text-base font-semibold text-gray-700 mb-4'>Post a New Notice</h2>
        <form onSubmit={handleCreate} className='flex flex-col gap-4'>
          <div>
            <label className='text-sm text-gray-600 font-medium mb-1 block'>Title</label>
            <input
              type='text'
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder='e.g. Assignment deadline extended'
              className='w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300'
            />
          </div>
          <div>
            <label className='text-sm text-gray-600 font-medium mb-1 block'>Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder='Write your notice here...'
              rows={4}
              className='w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none'
            />
          </div>
          <button
            type='submit'
            disabled={submitting}
            className='self-end bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50'
          >
            {submitting ? 'Posting...' : 'Post Notice'}
          </button>
        </form>
      </div>

      {/* Notices list */}
      <div>
        <h2 className='text-base font-semibold text-gray-700 mb-4'>
          Posted Notices <span className='text-gray-400 font-normal'>({notices.length})</span>
        </h2>

        {notices.length === 0 ? (
          <div className='bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center'>
            <p className='text-gray-400 text-sm'>No notices posted yet. Post your first notice above.</p>
          </div>
        ) : (
          <div className='flex flex-col gap-4'>
            {notices.map(notice => (
              <div key={notice.notice_id} className='bg-white rounded-2xl shadow-sm border border-gray-200 p-5'>
                {editingId === notice.notice_id ? (
                  /* Edit form inline */
                  <div className='flex flex-col gap-3'>
                    <input
                      type='text'
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      className='w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300'
                    />
                    <textarea
                      value={editMessage}
                      onChange={e => setEditMessage(e.target.value)}
                      rows={4}
                      className='w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none'
                    />
                    <div className='flex gap-2 justify-end'>
                      <button
                        onClick={cancelEdit}
                        className='px-4 py-1.5 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition'
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleUpdate(notice.notice_id)}
                        disabled={editSubmitting}
                        className='px-4 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50'
                      >
                        {editSubmitting ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Notice display */
                  <>
                    <div className='flex items-start justify-between gap-4 mb-2'>
                      <div className='flex items-center gap-2'>
                        <span className='text-lg'>📢</span>
                        <h3 className='font-semibold text-gray-800'>{notice.title}</h3>
                      </div>
                      <div className='flex gap-2 flex-shrink-0'>
                        <button
                          onClick={() => startEdit(notice)}
                          className='text-xs px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition'
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(notice.notice_id)}
                          disabled={deletingId === notice.notice_id}
                          className='text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition disabled:opacity-50'
                        >
                          {deletingId === notice.notice_id ? '...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                    <p className='text-sm text-gray-600 leading-relaxed whitespace-pre-wrap'>
                      {notice.message}
                    </p>
                    <p className='text-xs text-gray-400 mt-3'>
                      Posted {new Date(notice.created_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ManageNotices
