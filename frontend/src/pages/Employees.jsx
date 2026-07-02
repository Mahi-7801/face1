import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { employeeAPI } from '../services/api'
import { toast } from 'react-toastify'
import Swal from 'sweetalert2'
import {
  Plus, Search, Edit2, Trash2, User, X, Camera, Upload,
  ChevronLeft, ChevronRight, Loader
} from 'lucide-react'

export default function Employees() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const fileInputRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [formData, setFormData] = useState({
    employee_id: '',
    employee_name: '',
    department: '',
    designation: '',
    phone: '',
    email: '',
    joining_date: '',
    face_image: null,
  })

  const perPage = 10

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const res = await employeeAPI.list()
      setEmployees(res.data.employees)
    } catch (err) {
      toast.error('Failed to load employees')
    } finally {
      setLoading(false)
    }
  }

  const filtered = employees.filter(emp =>
    emp.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
    emp.employee_id?.toLowerCase().includes(search.toLowerCase()) ||
    emp.department?.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  const handleEdit = (emp) => {
    setEditingEmployee(emp)
    setFormData({
      employee_id: emp.employee_id,
      employee_name: emp.employee_name,
      department: emp.department,
      designation: emp.designation,
      phone: emp.phone || '',
      email: emp.email || '',
      joining_date: emp.joining_date ? emp.joining_date.split('T')[0] : '',
      face_image: null,
    })
    setPreview(emp.face_image_path ? `http://localhost:8000/${emp.face_image_path}` : null)
    setShowModal(true)
  }

  const handleDelete = async (emp) => {
    const result = await Swal.fire({
      title: 'Delete Employee?',
      text: `Remove ${emp.employee_name} from the system?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6366f1',
      confirmButtonText: 'Delete',
      background: 'rgba(255,255,255,0.9)',
      backdrop: 'rgba(0,0,0,0.5)',
    })

    if (result.isConfirmed) {
      try {
        await employeeAPI.delete(emp.employee_id)
        toast.success('Employee deleted successfully')
        fetchEmployees()
      } catch (err) {
        toast.error('Failed to delete employee')
      }
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData({ ...formData, face_image: file })
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.employee_id || !formData.employee_name || !formData.department || !formData.designation) {
      toast.error('Please fill in all required fields')
      return
    }

    if (!editingEmployee && !formData.face_image) {
      toast.error('Please upload a face image')
      return
    }

    setFormLoading(true)
    try {
      const fd = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          fd.append(key, value)
        }
      })

      if (editingEmployee) {
        await employeeAPI.update(editingEmployee.employee_id, fd)
        toast.success('Employee updated successfully')
      } else {
        await employeeAPI.register(fd)
        toast.success('Employee registered successfully')
      }

      setShowModal(false)
      resetForm()
      fetchEmployees()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Operation failed')
    } finally {
      setFormLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      employee_id: '',
      employee_name: '',
      department: '',
      designation: '',
      phone: '',
      email: '',
      joining_date: '',
      face_image: null,
    })
    setPreview(null)
    setEditingEmployee(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employees</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage employee profiles</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2.5 gradient-primary rounded-xl text-white font-medium shadow-lg shadow-primary-500/30 hover:shadow-xl transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Employee
        </motion.button>
      </div>

      <div className="glass-card rounded-2xl p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search employees by name, ID, or department..."
            className="w-full pl-12 pr-4 py-3 glass-input rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
          />
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
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Designation</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Contact</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/30">
                  {paginated.map((emp, i) => (
                    <motion.tr
                      key={emp.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center text-white font-medium text-sm">
                            {emp.employee_name?.[0] || '?'}
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{emp.employee_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 hidden md:table-cell font-mono">{emp.employee_id}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 hidden lg:table-cell">{emp.department}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 hidden lg:table-cell">{emp.designation}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 hidden sm:table-cell">{emp.phone || emp.email || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(emp)}
                            className="p-2 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(emp)}
                            className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                        No employees found
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
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors"
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
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingEmployee ? 'Edit Employee' : 'Add Employee'}
                </h2>
                <button
                  onClick={() => { setShowModal(false); resetForm() }}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employee ID *</label>
                    <input
                      type="text"
                      value={formData.employee_id}
                      onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                      disabled={!!editingEmployee}
                      className="w-full px-4 py-2.5 glass-input rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 disabled:opacity-50"
                      placeholder="EMP001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={formData.employee_name}
                      onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
                      className="w-full px-4 py-2.5 glass-input rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department *</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-4 py-2.5 glass-input rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                      placeholder="Engineering"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Designation *</label>
                    <input
                      type="text"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="w-full px-4 py-2.5 glass-input rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                      placeholder="Software Engineer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 glass-input rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                      placeholder="+1 234 567 890"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 glass-input rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                      placeholder="john@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Joining Date</label>
                    <input
                      type="date"
                      value={formData.joining_date}
                      onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                      className="w-full px-4 py-2.5 glass-input rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Face Image *</label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-[42px] glass-input rounded-xl flex items-center justify-center cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <Upload className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-500">
                        {formData.face_image ? formData.face_image.name : 'Click to upload'}
                      </span>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                </div>

                {preview && (
                  <div className="relative w-32 h-32 mx-auto rounded-xl overflow-hidden border-2 border-primary-200 dark:border-primary-800">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-4 border-t border-gray-200/50 dark:border-gray-700/30">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm() }}
                    className="px-6 py-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    disabled={formLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-2.5 gradient-primary rounded-xl text-white font-medium shadow-lg disabled:opacity-50 transition-all"
                  >
                    {formLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader className="w-4 h-4 animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      editingEmployee ? 'Update Employee' : 'Register Employee'
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
