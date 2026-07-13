import React, { useState, useEffect, useContext } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import axios from 'axios'
import { AppContext } from '../../context/AppContext'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const RevenueDashboard = () => {
  const { backendUrl, currency } = useContext(AppContext)

  const [groupBy, setGroupBy] = useState('monthly') // 'monthly' | 'weekly'
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [chartData, setChartData] = useState(null)
  const [summary, setSummary] = useState({ totalRevenue: 0, totalTransactions: 0 })
  const [loading, setLoading] = useState(true)

  const fetchRevenueData = async () => {
    setLoading(true)
    try {
      const params = { groupBy }
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate

      const { data } = await axios.get(`${backendUrl}/api/admin/analytics/revenue`, {
        params,
        headers: { 'x-access-token': localStorage.getItem('token') }
      })

      if (data.Status === 'Success') {
        setChartData({
          labels: data.data.map((row) => row.period),
          datasets: [
            {
              label: `Revenue (${currency})`,
              data: data.data.map((row) => Number(row.revenue)),
              backgroundColor: 'rgba(79, 70, 229, 0.7)', // indigo-600
              borderRadius: 4
            }
          ]
        })
        setSummary(data.summary)
      } else {
        console.error('Revenue analytics error:', data.Error)
      }
    } catch (error) {
      console.error('Error fetching revenue analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRevenueData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupBy])

  const handleApplyDateRange = () => {
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      alert('Start Date is after End Date — the range has been swapped automatically.')
    }
    fetchRevenueData()
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: groupBy === 'weekly' ? 'Weekly Revenue' : 'Monthly Revenue'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `${currency}${value}`
        }
      }
    }
  }

  return (
    <div className='p-4 md:p-8'>
      <h2 className='text-xl font-semibold text-gray-800 mb-6'>Revenue Dashboard</h2>

      {/* Summary cards */}
      <div className='flex gap-4 mb-6'>
        <div className='bg-white border border-gray-200 rounded-lg px-6 py-4 shadow-sm'>
          <p className='text-xs text-gray-500 mb-1 uppercase font-medium tracking-wider'>Total Revenue</p>
          <p className='text-2xl font-bold text-green-700'>{currency}{summary.totalRevenue.toFixed(2)}</p>
        </div>
        <div className='bg-white border border-gray-200 rounded-lg px-6 py-4 shadow-sm'>
          <p className='text-xs text-gray-500 mb-1 uppercase font-medium tracking-wider'>Total Transactions</p>
          <p className='text-2xl font-bold text-gray-800'>{summary.totalTransactions}</p>
        </div>
      </div>

      {/* Filters */}
      <div className='flex flex-wrap items-end gap-4 mb-6 bg-white border border-gray-200 rounded-lg p-4 shadow-sm'>
        {/* Weekly / Monthly toggle */}
        <div>
          <label className='block text-xs text-gray-500 mb-1'>View</label>
          <div className='flex rounded-lg border border-gray-300 overflow-hidden'>
            <button
              onClick={() => setGroupBy('weekly')}
              className={`px-4 py-2 text-sm font-medium ${
                groupBy === 'weekly' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setGroupBy('monthly')}
              className={`px-4 py-2 text-sm font-medium ${
                groupBy === 'monthly' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* Date range */}
        <div>
          <label className='block text-xs text-gray-500 mb-1'>Start Date</label>
          <input
            type='date'
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className='border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700'
          />
        </div>
        <div>
          <label className='block text-xs text-gray-500 mb-1'>End Date</label>
          <input
            type='date'
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className='border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700'
          />
        </div>

        <button
          onClick={handleApplyDateRange}
          className='bg-indigo-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-indigo-700 transition'
        >
          Apply
        </button>
      </div>

      {/* Chart */}
      <div className='bg-white border border-gray-200 rounded-lg p-4 shadow-sm'>
        {loading ? (
          <p className='text-gray-400 text-sm text-center py-10'>Loading revenue data...</p>
        ) : chartData && chartData.labels.length > 0 ? (
          <Bar data={chartData} options={chartOptions} />
        ) : (
          <p className='text-gray-400 text-sm text-center py-10'>No revenue data for this range.</p>
        )}
      </div>
    </div>
  )
}

export default RevenueDashboard
