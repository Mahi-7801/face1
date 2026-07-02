import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { attendanceAPI } from '../services/api'
import { toast } from 'react-toastify'
import {
  Users, UserCheck, UserX, Clock, Activity, TrendingUp,
  Calendar, ChevronRight, AlertTriangle
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6']

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await attendanceAPI.getStats()
      setStats(res.data.stats)
    } catch (err) {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner w-10 h-10"></div>
      </div>
    )
  }

  const cards = [
    { label: 'Total Employees', value: stats?.total_employees || 0, icon: Users, color: 'from-blue-500 to-blue-600', gradient: 'gradient-info' },
    { label: 'Present Today', value: stats?.present_today || 0, icon: UserCheck, color: 'from-emerald-500 to-emerald-600', gradient: 'gradient-success' },
    { label: 'Absent Today', value: stats?.absent_today || 0, icon: UserX, color: 'from-red-500 to-red-600', gradient: 'gradient-danger' },
    { label: 'Recognition Rate', value: `${stats?.recognition_success_rate || 0}%`, icon: Activity, color: 'from-amber-500 to-amber-600', gradient: 'gradient-warning' },
  ]

  const weeklyData = stats?.weekly_data?.map(d => ({
    day: new Date(d.attendance_date).toLocaleDateString('en-US', { weekday: 'short' }),
    present: d.count,
  })) || []

  const monthlyData = stats?.monthly_data?.map(d => ({
    month: d.month,
    attendance: d.count,
  })) || []

  const pieData = stats?.department_stats?.map(d => ({
    name: d.department,
    value: d.employee_count || 0,
  })) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Overview of today's attendance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card rounded-2xl p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.label}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{card.value}</p>
              </div>
              <div className={`w-12 h-12 ${card.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Weekly Attendance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  background: 'rgba(255,255,255,0.9)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                }}
              />
              <Bar dataKey="present" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  background: 'rgba(255,255,255,0.9)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                }}
              />
              <Area type="monotone" dataKey="attendance" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Department Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-card rounded-2xl p-6 lg:col-span-2"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {stats?.recent_logs?.slice(0, 8).map((log, i) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/30"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  log.log_type === 'recognition' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' :
                  log.log_type === 'failed_attempt' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                  log.log_type === 'registration' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                  'bg-gray-100 dark:bg-gray-800 text-gray-600'
                }`}>
                  {log.log_type === 'recognition' ? <UserCheck className="w-5 h-5" /> :
                   log.log_type === 'failed_attempt' ? <AlertTriangle className="w-5 h-5" /> :
                   log.log_type === 'registration' ? <Users className="w-5 h-5" /> :
                   <Activity className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{log.message}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {log.employee_name || 'System'} · {new Date(log.created_at).toLocaleString()}
                  </p>
                </div>
                {log.confidence_score && (
                  <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                    log.confidence_score >= 95 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {log.confidence_score}%
                  </span>
                )}
              </motion.div>
            ))}
            {(!stats?.recent_logs || stats.recent_logs.length === 0) && (
              <p className="text-center text-gray-400 dark:text-gray-500 py-8">No recent activity</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
