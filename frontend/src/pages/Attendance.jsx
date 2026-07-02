import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { attendanceAPI } from '../services/api'
import { toast } from 'react-toastify'
import { Calendar, Search, Filter, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock } from 'lucide-react'

export default function Attendance() {
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [stats, setStats] = useState({ total_employees: 0, total_present: 0, total_absent: 0 })

  const perPage = 15

  useEffect(() => {
    fetchTodayAttendance()
  }, [date])

  const fetchTodayAttendance = async () => {
    try {
      const res = await attendanceAPI.getToday()
      setAttendance(res.data.attendance)
      setStats({
        total_employees: res.data.total_employees,
        total_present: res.data.total_present,
        total_absent: res.data.total_absent,
      })
    } catch (err) {
      toast.error('Failed to load attendance')
    } finally {
      setLoading(false)
    }
  }

  const filtered = attendance.filter(a =>
    a.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.employee_id?.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance Records</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">View today's attendance and history</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-info rounded-xl flex items-center justify-center shadow-lg">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Employees</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.total_employees}</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-success rounded-xl flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Present</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{stats.total_present}</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-danger rounded-xl flex items-center justify-center shadow-lg">
              <XCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Absent</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">{stats.total_absent}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="glass-card rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by name or ID..."
              className="w-full pl-12 pr-4 py-3 glass-input rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-12 pr-4 py-3 glass-input rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner w-10 h-10"></div>
        </div>
      ) : (
        <>
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200/50 dark:border-gray-700/30">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employee</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">ID</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Department</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/30">
                  {paginated.map((a, i) => (
                    <motion.tr
                      key={a.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center text-white text-sm font-medium">
                            {a.employee_name?.[0] || '?'}
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{a.employee_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 hidden md:table-cell font-mono">{a.employee_id}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 hidden lg:table-cell">{a.department || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{a.attendance_time}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                          a.status === 'Present'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : a.status === 'Late'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {a.status === 'Present' ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                           a.status === 'Late' ? <Clock className="w-3.5 h-3.5" /> :
                           <XCircle className="w-3.5 h-3.5" />}
                          {a.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <span className={`text-sm font-medium ${
                          a.confidence_score >= 95
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : a.confidence_score >= 80
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {a.confidence_score ? `${a.confidence_score}%` : '-'}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                        No attendance records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {(page - 1) * perPage + 1}-{Math.min(page * perPage, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                      page === p
                        ? 'bg-primary-500 text-white shadow-md'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
