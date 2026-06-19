import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { AppContext } from '../../context/AppContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AdminAnalytics = () => {
  const { backendUrl } = useContext(AppContext);
  const [studentProgress, setStudentProgress] = useState([]);
  const [quizPerformance, setQuizPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'x-access-token': token };

        const [progressRes, quizRes] = await Promise.all([
          axios.get(`${backendUrl}/api/admin/analytics/student-progress`, { headers }),
          axios.get(`${backendUrl}/api/admin/analytics/quiz-performance`, { headers })
        ]);

        if (progressRes.data.Status === 'Success') setStudentProgress(progressRes.data.data);
        if (quizRes.data.Status === 'Success') setQuizPerformance(quizRes.data.data);
      } catch (error) {
        console.error('Failed to fetch analytics', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [backendUrl]);

  // Average completion % per course (aggregated from per-student rows)
  const courseCompletionMap = {};
  studentProgress.forEach((row) => {
    if (!courseCompletionMap[row.course_title]) {
      courseCompletionMap[row.course_title] = { total: 0, count: 0 };
    }
    courseCompletionMap[row.course_title].total += row.completion_percent;
    courseCompletionMap[row.course_title].count += 1;
  });
  const courseCompletionLabels = Object.keys(courseCompletionMap);
  const courseCompletionData = courseCompletionLabels.map(
    (title) => Math.round(courseCompletionMap[title].total / courseCompletionMap[title].count)
  );

  // Total time spent (hours) per course
  const courseTimeMap = {};
  studentProgress.forEach((row) => {
    if (!courseTimeMap[row.course_title]) courseTimeMap[row.course_title] = 0;
    courseTimeMap[row.course_title] += row.time_spent_minutes;
  });
  const courseTimeLabels = Object.keys(courseTimeMap);
  const courseTimeData = courseTimeLabels.map((title) => Math.round((courseTimeMap[title] / 60) * 10) / 10);

  const barOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } }
  };

  if (loading) return <p className="text-gray-500">Loading analytics...</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Student Progress Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-gray-600 font-semibold mb-4">Average Completion % by Course</h3>
          <Bar
            data={{
              labels: courseCompletionLabels,
              datasets: [{
                label: 'Completion %',
                data: courseCompletionData,
                backgroundColor: '#6366f1'
              }]
            }}
            options={barOptions}
          />
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-gray-600 font-semibold mb-4">Average Quiz Score % by Course</h3>
          <Bar
            data={{
              labels: quizPerformance.map((q) => q.course_title),
              datasets: [{
                label: 'Avg Score %',
                data: quizPerformance.map((q) => q.avg_score_percent),
                backgroundColor: '#10b981'
              }]
            }}
            options={barOptions}
          />
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 md:col-span-2">
          <h3 className="text-gray-600 font-semibold mb-4">Total Time Spent (hours) by Course</h3>
          <Bar
            data={{
              labels: courseTimeLabels,
              datasets: [{
                label: 'Hours',
                data: courseTimeData,
                backgroundColor: '#f59e0b'
              }]
            }}
            options={barOptions}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="text-gray-600 font-semibold mb-4">Per-Student Progress</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="py-2 pr-4">Student</th>
                <th className="py-2 pr-4">Course</th>
                <th className="py-2 pr-4">Completion</th>
                <th className="py-2 pr-4">Time Spent</th>
              </tr>
            </thead>
            <tbody>
              {studentProgress.map((row, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-2 pr-4">{row.student_name}</td>
                  <td className="py-2 pr-4">{row.course_title}</td>
                  <td className="py-2 pr-4">{row.completion_percent}%</td>
                  <td className="py-2 pr-4">{Math.round(row.time_spent_minutes / 60 * 10) / 10}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;