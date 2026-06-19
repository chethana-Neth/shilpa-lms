import React, { useState, useContext } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AppContext } from '../../context/AppContext'

const AddQuiz = () => {
    const { lectureId } = useParams()
    const { backendUrl, navigate } = useContext(AppContext)

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [timeLimit, setTimeLimit] = useState('')
    const [questions, setQuestions] = useState([
        {
            question_text: '',
            options: [
                { option_text: '', is_correct: false },
                { option_text: '', is_correct: false },
                { option_text: '', is_correct: false },
                { option_text: '', is_correct: false },
            ]
        }
    ])
    const [submitting, setSubmitting] = useState(false)

    const addQuestion = () => {
        setQuestions([...questions, {
            question_text: '',
            options: [
                { option_text: '', is_correct: false },
                { option_text: '', is_correct: false },
                { option_text: '', is_correct: false },
                { option_text: '', is_correct: false },
            ]
        }])
    }

    const removeQuestion = (qIndex) => {
        if (questions.length === 1) return toast.error("At least one question is required.")
        setQuestions(questions.filter((_, i) => i !== qIndex))
    }

    const updateQuestion = (qIndex, value) => {
        const updated = [...questions]
        updated[qIndex].question_text = value
        setQuestions(updated)
    }

    const updateOption = (qIndex, oIndex, value) => {
        const updated = [...questions]
        updated[qIndex].options[oIndex].option_text = value
        setQuestions(updated)
    }

    // Only one option can be correct per question
    const setCorrectOption = (qIndex, oIndex) => {
        const updated = [...questions]
        updated[qIndex].options = updated[qIndex].options.map((opt, i) => ({
            ...opt,
            is_correct: i === oIndex
        }))
        setQuestions(updated)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!title.trim()) return toast.error("Quiz title is required.")

        // Validate all questions
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i]
            if (!q.question_text.trim()) return toast.error(`Question ${i + 1} text is required.`)
            const hasCorrect = q.options.some(o => o.is_correct)
            if (!hasCorrect) return toast.error(`Please select a correct answer for question ${i + 1}.`)
            const hasEmpty = q.options.some(o => !o.option_text.trim())
            if (hasEmpty) return toast.error(`All options in question ${i + 1} must be filled.`)
        }

        try {
            setSubmitting(true)
            const { data } = await axios.post(`${backendUrl}/api/quizzes/create`, {
                lecture_id: lectureId,
                title: title.trim(),
                description: description.trim(),
                time_limit: timeLimit ? Number(timeLimit) : null,
                questions
            })

            if (data.success) {
                toast.success("Quiz created successfully!")
                navigate(-1)
            } else {
                toast.error(data.message || "Failed to create quiz.")
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create quiz.")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className='min-h-screen md:p-8 p-4 pt-8 overflow-y-auto'>
            <div className='max-w-2xl'>
                <div className='flex items-center gap-3 mb-6'>
                    <button onClick={() => navigate(-1)} className='text-gray-500 hover:text-gray-800'>← Back</button>
                    <h1 className='text-xl font-semibold text-gray-800'>Create Quiz</h1>
                </div>

                <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
                    {/* Quiz details */}
                    <div className='bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-4'>
                        <div className='flex flex-col gap-1'>
                            <label className='text-sm font-medium text-gray-700'>Quiz Title *</label>
                            <input value={title} onChange={e => setTitle(e.target.value)}
                                type="text" placeholder='e.g. Chapter 1 Quiz'
                                className='border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-400' required />
                        </div>
                        <div className='flex flex-col gap-1'>
                            <label className='text-sm font-medium text-gray-700'>Description (optional)</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)}
                                placeholder='Instructions for students...'
                                rows={2}
                                className='border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-400 resize-none' />
                        </div>
                        <div className='flex flex-col gap-1'>
                            <label className='text-sm font-medium text-gray-700'>Time Limit (minutes, optional)</label>
                            <input value={timeLimit} onChange={e => setTimeLimit(e.target.value)}
                                type="number" min="1" placeholder='e.g. 30'
                                className='border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-400 w-32' />
                        </div>
                    </div>

                    {/* Questions */}
                    {questions.map((q, qIndex) => (
                        <div key={qIndex} className='bg-white border border-gray-200 rounded-lg p-5'>
                            <div className='flex justify-between items-center mb-3'>
                                <h3 className='font-medium text-gray-700'>Question {qIndex + 1}</h3>
                                <button type='button' onClick={() => removeQuestion(qIndex)}
                                    className='text-red-500 text-sm hover:text-red-700'>Remove</button>
                            </div>

                            <textarea value={q.question_text}
                                onChange={e => updateQuestion(qIndex, e.target.value)}
                                placeholder='Enter your question...'
                                rows={2}
                                className='w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-400 resize-none mb-4' />

                            <p className='text-xs text-gray-500 mb-2'>Select the correct answer:</p>
                            <div className='flex flex-col gap-2'>
                                {q.options.map((opt, oIndex) => (
                                    <div key={oIndex} className='flex items-center gap-3'>
                                        <input
                                            type="radio"
                                            name={`correct_${qIndex}`}
                                            checked={opt.is_correct}
                                            onChange={() => setCorrectOption(qIndex, oIndex)}
                                            className='w-4 h-4 accent-green-600'
                                        />
                                        <input
                                            type="text"
                                            value={opt.option_text}
                                            onChange={e => updateOption(qIndex, oIndex, e.target.value)}
                                            placeholder={`Option ${oIndex + 1}`}
                                            className={`flex-1 border rounded px-3 py-1.5 outline-none text-sm ${
                                                opt.is_correct ? 'border-green-400 bg-green-50' : 'border-gray-300'
                                            }`}
                                        />
                                        {opt.is_correct && (
                                            <span className='text-xs text-green-600 font-medium'>✓ Correct</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    <button type='button' onClick={addQuestion}
                        className='flex items-center justify-center gap-2 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg py-3 hover:bg-blue-50 transition-colors'>
                        + Add Question
                    </button>

                    <button type='submit' disabled={submitting}
                        className={`py-3 rounded text-white font-medium ${submitting ? 'bg-gray-400' : 'bg-black hover:bg-gray-800'}`}>
                        {submitting ? 'Creating...' : 'CREATE QUIZ'}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default AddQuiz
