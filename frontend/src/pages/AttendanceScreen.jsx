import { useState, useRef, useCallback } from 'react'
import Webcam from 'react-webcam'
import { motion, AnimatePresence } from 'framer-motion'
import { attendanceAPI } from '../services/api'
import { toast } from 'react-toastify'
import { Camera, CheckCircle2, XCircle, User, Loader, AlertTriangle, RefreshCw } from 'lucide-react'

export default function AttendanceScreen() {
  const webcamRef = useRef(null)
  const [result, setResult] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [cameraError, setCameraError] = useState(null)

  const capture = useCallback(async () => {
    if (!webcamRef.current || processing) return

    const imageSrc = webcamRef.current.getScreenshot()
    if (!imageSrc) {
      toast.error('Could not capture image. Please check your camera.')
      return
    }

    setProcessing(true)
    setResult(null)

    try {
      const res = await attendanceAPI.recognize({
        image: imageSrc,
        camera_device: navigator.mediaDevices?.enumerateDevices ? 'webcam' : 'unknown',
      })

      setResult(res.data)

      if (res.data.attendance_marked) {
        toast.success(`Welcome ${res.data.employee_name}! Attendance marked.`)
      } else if (res.data.recognized && !res.data.attendance_marked) {
        toast.info(`Already recorded today, ${res.data.employee_name}`)
      } else {
        toast.error('Face not recognized')
      }
    } catch (err) {
      toast.error('Recognition failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }, [processing])

  const handleUserMediaError = (err) => {
    if (err?.message?.includes('NotAllowed') || err?.name === 'NotAllowedError') {
      setCameraError('Camera permission denied. Please allow camera access in your browser settings and refresh.')
    } else if (err?.message?.includes('NotFound') || err?.name === 'NotFoundError') {
      setCameraError('No camera device found. Please connect a webcam and refresh.')
    } else if (err?.message?.includes('NotReadable') || err?.name === 'NotReadableError') {
      setCameraError('Camera is busy or in use by another application. Please close other apps using the camera.')
    } else {
      setCameraError(`Camera error: ${err?.message || 'Unknown error'}. Please check your camera and refresh.`)
    }
  }

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: 'user',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-2xl"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="w-16 h-16 mx-auto gradient-primary rounded-2xl flex items-center justify-center mb-4 shadow-2xl"
          >
            <Camera className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">Face Attendance</h1>
          <p className="text-gray-400">Stand in front of the camera to mark your attendance</p>
        </div>

        {cameraError ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-3xl p-8 shadow-2xl border border-red-500/30 text-center"
          >
            <div className="w-16 h-16 mx-auto gradient-danger rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Camera Unavailable</h2>
            <p className="text-gray-300 mb-6">{cameraError}</p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setCameraError(null); window.location.reload() }}
              className="px-6 py-3 gradient-primary rounded-xl text-white font-semibold shadow-lg inline-flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Retry
            </motion.button>
          </motion.div>
        ) : (
          <div className="glass rounded-3xl p-4 shadow-2xl border border-white/10">
            <div className="relative rounded-2xl overflow-hidden bg-black/50">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="w-full aspect-[4/3] object-cover"
                mirrored
                onUserMediaError={handleUserMediaError}
              />

              <div className="absolute inset-0 border-2 border-dashed border-white/20 rounded-2xl m-4" />

              <div className="scan-line" />

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 rounded-full border-2 border-primary-400/50 shadow-[0_0_30px_rgba(99,102,241,0.3)]" />
              </div>

              {processing && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-2xl">
                  <div className="text-center">
                    <Loader className="w-12 h-12 text-primary-400 animate-spin mx-auto mb-3" />
                    <p className="text-white font-medium">Analyzing face...</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Camera active
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={capture}
                disabled={processing}
                className="relative px-8 py-3 gradient-primary rounded-2xl text-white font-semibold shadow-2xl shadow-primary-500/40 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    Capture & Recognize
                  </>
                )}
              </motion.button>
            </div>
          </div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mt-6 rounded-3xl p-6 border ${
                result.recognized
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  result.recognized
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {result.recognized
                    ? <CheckCircle2 className="w-7 h-7" />
                    : <XCircle className="w-7 h-7" />
                  }
                </div>
                <div className="flex-1">
                  <h3 className={`text-xl font-bold ${
                    result.recognized ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {result.recognized ? result.employee_name : 'Unknown Face'}
                  </h3>
                  <p className="text-gray-300 mt-1">{result.message}</p>
                  {result.confidence && (
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-gray-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${
                            result.recognized ? 'bg-emerald-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${result.confidence}%` }}
                        />
                      </div>
                      <span className={`text-sm font-semibold ${
                        result.recognized ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {result.confidence}%
                      </span>
                    </div>
                  )}
                  {result.attendance_marked && (
                    <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Attendance Marked at {result.time}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-gray-500 text-xs mt-6">
          Powered by AI Face Recognition Technology
        </p>
      </motion.div>
    </div>
  )
}
