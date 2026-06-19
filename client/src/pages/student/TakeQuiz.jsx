import React, { useState, useEffect, useContext } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AppContext } from '../../context/AppContext'
import Loading from '../../components/student/Loading'

const TakeQuiz = () => {
    const { quizId } = useParams()
    const { backendUrl, userData, navigate } = useContext(AppContext)

    const [quiz, setQuiz] = useState(null)
    const [answers, setAnswers] = useState({})
    const [submitting, setSubmitting] = useState(false)
    const [result, setResult] = useState(null)       
    const [prevAttempt, setPrevAttempt] = useState(null) 
    const [loading, setLoading] = useState(true)
    const [timeLeft, setTimeLeft] = useState(null)

    useEffect(() => {
        const load = async () => {
            try {
                // Load quiz (without correct answers)
                const { data: qData } = await axios.get(
                    `${backendUrl}/api/quizzes/lecture/0?quizId=${quizId}`
                );

                // Load quiz directly by quizId — need to fetch quiz details
                const { data: quizData } = await axios.get(
                    `${backendUrl}/api/quizzes/take/${quizId}`
                );

                if (quizData.success) {
                    setQuiz(quizData.quiz);
                    if (quizData.quiz.time_limit) {
                        setTimeLeft(quizData.quiz.time_limit * 60);
                    }
                }

                // Check previous attempt
                if (userData?.id) {
                    const { data: attemptData } = await axios.get(
                        `${backendUrl}/api/quizzes/attempt/${quizId}/${userData.id}`
                    );
                    if (attemptData.attempt) {
                        setPrevAttempt(attemptData.attempt);
                    }
                }
            } catch (error) {
                console.error("Load quiz error:", error);
                toast.error("Failed to load quiz.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [quizId, userData]);

    // Countdown timer
    useEffect(() => {
        if (timeLeft === null || result || prevAttempt) return;
        if (timeLeft <= 0) {
            handleSubmit();
            return;
        }
        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft, result, prevAttempt]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const selectOption = (questionId, optionId) => {
        if (result || prevAttempt) return; // can't change after submission
        setAnswers({ ...answers, [questionId]: optionId });
    };

    const handleSubmit = async () => {
        if (!userData?.id) return toast.error("Please log in.");

        const unanswered = quiz.questions.filter(q => !answers[q.question_id]);
        if (unanswered.length > 0) {
            return toast.error(`Please answer all questions. ${unanswered.length} unanswered.`);
        }

        try {
            setSubmitting(true);
            const formattedAnswers = Object.entries(answers).map(([question_id, selected_option_id]) => ({
                question_id: Number(question_id),
                selected_option_id: Number(selected_option_id)
            }));

            const { data } = await axios.post(`${backendUrl}/api/quizzes/submit`, {
                quiz_id: quizId,
                student_id: userData.id,
                answers: formattedAnswers
            });

            if (data.success) {
                setResult(data);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Failed to submit quiz.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Loading />;

    if (!quiz) return (
        <div className='flex flex-col items-center justify-center min-h-screen text-gray-500'>
            <p>Quiz not found.</p>
            <button onClick={() => navigate(-1)} className='mt-4 text-blue-600 underline'>Go back</button>
        </div>
    );

    // Show result screen after submission
    if (result || prevAttempt) {
        const r = result || prevAttempt;
        const pct = result
            ? result.percentage
            : Math.round((prevAttempt.score / prevAttempt.total_questions) * 100);

        return (
            <div className='flex flex-col items-center justify-center min-h-screen p-8'>
                <div className='bg-white border border-gray-200 rounded-xl p-8 max-w-md w-full text-center shadow-sm'>
                    <div className={`text-6xl mb-4 ${pct >= 50 ? '🎉' : '📝'}`}>{pct >= 50 ? '🎉' : '📝'}</div>
                    <h2 className='text-2xl font-bold text-gray-800 mb-2'>
                        {prevAttempt && !result ? 'Previous Result' : 'Quiz Complete!'}
                    </h2>
                    <p className='text-gray-500 mb-6'>{quiz.title}</p>

                    <div className={`text-5xl font-bold mb-2 ${pct >= 50 ? 'text-green-600' : 'text-red-500'}`}>
                        {pct}%
                    </div>
                    <p className='text-gray-600 mb-6'>
                        {result ? result.score : prevAttempt.score} / {result ? result.total : prevAttempt.total_questions} correct
                    </p>

                    <div className={`px-4 py-2 rounded-full text-sm font-medium inline-block mb-8 ${
                        pct >= 80 ? 'bg-green-100 text-green-700' :
                        pct >= 50 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                    }`}>
                        {pct >= 80 ? 'Excellent!' : pct >= 50 ? 'Good effort!' : 'Keep studying!'}
                    </div>

                    <button onClick={() => navigate(-1)}
                        className='w-full py-3 bg-red-800 text-white rounded hover:bg-red-700 transition-colors'>
                        Back to Course
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className='md:px-36 px-8 pt-20 pb-16 min-h-screen'>
            {/* Header */}
            <div className='flex items-start justify-between mb-6'>
                <div>
                    <button onClick={() => navigate(-1)} className='text-gray-500 hover:text-gray-800 text-sm mb-2 block'>← Back</button>
                    <h1 className='text-2xl font-semibold text-gray-800'>{quiz.title}</h1>
                    {quiz.description && <p className='text-gray-500 mt-1'>{quiz.description}</p>}
                    <p className='text-sm text-gray-400 mt-1'>{quiz.questions.length} questions</p>
                </div>
                {timeLeft !== null && (
                    <div className={`text-xl font-bold px-4 py-2 rounded-lg ${
                        timeLeft < 60 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-700'
                    }`}>
                        ⏱ {formatTime(timeLeft)}
                    </div>
                )}
            </div>

            {/* Progress */}
            <div className='mb-6'>
                <div className='flex justify-between text-xs text-gray-500 mb-1'>
                    <span>{Object.keys(answers).length} of {quiz.questions.length} answered</span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2'>
                    <div className='bg-blue-500 h-2 rounded-full transition-all'
                        style={{ width: `${(Object.keys(answers).length / quiz.questions.length) * 100}%` }} />
                </div>
            </div>

            {/* Questions */}
            <div className='flex flex-col gap-6 max-w-2xl'>
                {quiz.questions.map((q, qIndex) => (
                    <div key={q.question_id} className='bg-white border border-gray-200 rounded-lg p-5'>
                        <p className='font-medium text-gray-800 mb-4'>
                            {qIndex + 1}. {q.question_text}
                        </p>
                        <div className='flex flex-col gap-2'>
                            {q.options.map((opt) => (
                                <button
                                    key={opt.option_id}
                                    type='button'
                                    onClick={() => selectOption(q.question_id, opt.option_id)}
                                    className={`text-left px-4 py-3 rounded-lg border transition-all text-sm ${
                                        answers[q.question_id] === opt.option_id
                                            ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                                            : 'border-gray-200 hover:border-gray-400 text-gray-700'
                                    }`}
                                >
                                    {opt.option_text}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Submit */}
            <div className='max-w-2xl mt-8'>
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className={`w-full py-3 rounded text-white font-medium ${
                        submitting ? 'bg-gray-400' : 'bg-red-800 hover:bg-red-700'
                    }`}
                >
                    {submitting ? 'Submitting...' : 'Submit Quiz'}
                </button>
            </div>
        </div>
    );
};

export default TakeQuiz;
