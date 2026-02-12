import { useEffect, useState, useCallback } from 'react'
import { GoPlus, GoTrash, GoSync, GoDownload, GoUpload, GoCheck, GoAlert, GoHourglass } from 'react-icons/go'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import CreateBackupModal from '../components/CreateBackupModal'
import UploadBackupModal from '../components/UploadBackupModal'
import Notification from '../components/Notification'

interface Backup {
  name: string
}

interface BackupJob {
  job_id: string
  index_id: string
  backup_name: string
  status: 'in_progress' | 'completed' | 'failed'
  error?: string
  started_at: number
  completed_at?: number
}

type Tab = 'backups' | 'jobs'

const STATUS_CONFIG = {
  completed: {
    label: 'Completed',
    icon: GoCheck,
    dot: 'bg-green-500',
    text: 'text-green-700 dark:text-green-400',
  },
  in_progress: {
    label: 'In Progress',
    icon: GoHourglass,
    dot: 'bg-amber-500 animate-pulse',
    text: 'text-amber-700 dark:text-amber-400',
  },
  failed: {
    label: 'Failed',
    icon: GoAlert,
    dot: 'bg-red-500',
    text: 'text-red-700 dark:text-red-400',
  },
} as const

export default function BackupsPage() {
  const [backups, setBackups] = useState<Backup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('backups')

  // Create backup modal state
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Upload backup modal state
  const [showUploadModal, setShowUploadModal] = useState(false)

  // Restore modal state
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [restoreBackupName, setRestoreBackupName] = useState('')
  const [restoreTargetIndex, setRestoreTargetIndex] = useState('')
  const [restoring, setRestoring] = useState(false)
  const [restoreError, setRestoreError] = useState<string | null>(null)

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteBackupName, setDeleteBackupName] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Backup jobs state
  const [jobs, setJobs] = useState<BackupJob[]>([])

  // Authentication operations
  const { token, handleUnauthorized } = useAuth()
  const { notification, showNotification, clearNotification } = useNotification()

  const loadJobs = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/backups/jobs', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: token })
        }
      })
      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized()
        }
        return
      }
      const data = await response.json()
      const allJobs: BackupJob[] = Array.isArray(data.jobs) ? data.jobs : []
      // Sort by started_at descending (latest first)
      allJobs.sort((a, b) => b.started_at - a.started_at)
      setJobs(allJobs)
    } catch {
      // Silently fail - jobs are supplementary info
    }
  }, [token, handleUnauthorized])

  useEffect(() => {
    if (window.location.hash === '#jobs') {
      setActiveTab('jobs')
    }
    loadBackups()
    loadJobs()
  }, [])

  // Poll for job updates when there are in-progress jobs
  useEffect(() => {
    const hasInProgress = jobs.some(j => j.status === 'in_progress')
    if (!hasInProgress) return

    const interval = setInterval(() => {
      loadJobs()
      loadBackups()
    }, 5000)
    return () => clearInterval(interval)
  }, [jobs, loadJobs])

  const loadBackups = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/v1/backups', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: token })
        }
      })
      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized()
          throw new Error("Authentication Token Required.")
        }
        throw new Error('Failed to fetch backups.')
      }
      const data = await response.json()
      // API returns array of backup names as strings
      const backupList = Array.isArray(data) ? data.map((name: string) => ({ name })) : []
      setBackups(backupList)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load backups')
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setShowCreateModal(true)
  }

  const closeCreateModal = () => {
    setShowCreateModal(false)
    loadBackups()
    loadJobs()
    setActiveTab('jobs')
  }

  const openUploadModal = () => {
    setShowUploadModal(true)
  }

  const closeUploadModal = () => {
    setShowUploadModal(false)
    loadBackups()
  }

  const openRestoreModal = (backupName: string) => {
    setRestoreBackupName(backupName)
    setRestoreTargetIndex('')
    setRestoreError(null)
    setShowRestoreModal(true)
  }

  const closeRestoreModal = () => {
    setShowRestoreModal(false)
    setRestoreBackupName('')
    setRestoreTargetIndex('')
    setRestoreError(null)
  }

  const handleRestoreBackup = async () => {
    if (!restoreBackupName || !restoreTargetIndex.trim()) return

    setRestoring(true)
    setRestoreError(null)
    try {
      const response = await fetch(`/api/v1/backups/${encodeURIComponent(restoreBackupName)}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: token })
        },
        body: JSON.stringify({ target_index_name: restoreTargetIndex.trim() })
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized()
          throw new Error("Authentication Token Required.")
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to restore backup')
      }

      closeRestoreModal()
      showNotification('success', `Backup "${restoreBackupName}" restored to index "${restoreTargetIndex.trim()}"`)
    } catch (err) {
      setRestoreError(err instanceof Error ? err.message : 'Failed to restore backup')
    } finally {
      setRestoring(false)
    }
  }

  const openDeleteModal = (backupName: string) => {
    setDeleteBackupName(backupName)
    setShowDeleteModal(true)
  }

  const closeDeleteModal = () => {
    setShowDeleteModal(false)
    setDeleteBackupName('')
  }

  const handleDeleteBackup = async () => {
    if (!deleteBackupName) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/v1/backups/${encodeURIComponent(deleteBackupName)}`, {
        method: 'DELETE',
        headers: { ...(token && { Authorization: token }) },
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized()
          throw new Error("Authentication Token Required.")
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete backup')
      }

      closeDeleteModal()
      showNotification('success', `Backup "${deleteBackupName}" deleted successfully`)
      loadBackups()
    } catch (err) {
      closeDeleteModal()
      showNotification('error', err instanceof Error ? err.message : 'Failed to delete backup')
    } finally {
      setDeleting(false)
    }
  }

  const handleDownloadBackup = (backupName: string) => {
    let downloadUrl = `/api/v1/backups/${encodeURIComponent(backupName)}/download`
    if (token) {
      downloadUrl += `?token=${encodeURIComponent(token)}`
    }

    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    iframe.src = downloadUrl
    document.body.appendChild(iframe)

    setTimeout(() => {
      document.body.removeChild(iframe)
    }, 60000)

    showNotification('success', `Downloading backup "${backupName}"`)
  }

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Backups</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Manage your index backups</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openUploadModal}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
          >
            <GoUpload className="w-5 h-5" />
            Upload Backup
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <GoPlus className="w-5 h-5" />
            Create Backup
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onDismiss={clearNotification}
          className="mb-4"
        />
      )}

      {/* Error State */}
      {error && (
        <Notification
          type="error"
          message={error}
          onDismiss={() => setError(null)}
          className="mb-4"
        />
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
        <div className="flex gap-6">
          <button
            id="backups"
            onClick={() => setActiveTab('backups')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'backups'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
          >
            Backups
            {/* {backups.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {backups.length}
              </span>
            )} */}
          </button>
          <button
            id="jobs"
            onClick={() => setActiveTab('jobs')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'jobs'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
          >
            Jobs
            {/* {jobs.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {jobs.length}
              </span>
            )} */}
          </button>
        </div>
      </div>

      {/* ===== Backups Tab ===== */}
      {activeTab === 'backups' && (
        <>
          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="text-slate-600 dark:text-slate-300">Loading backups...</div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && backups.length === 0 && (
            <div className="text-center py-12">
              <div className="text-slate-600 dark:text-slate-300 mb-4">No backups found</div>
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create your first backup
              </button>
            </div>
          )}

          {/* Backups List */}
          {!loading && backups.length > 0 && (
            <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-600">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Backup Name
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                  {backups.map((backup) => (
                    <tr key={backup.name}>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {backup.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            title='Restore'
                            onClick={() => openRestoreModal(backup.name)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/30 rounded hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-colors"
                          >
                            <GoSync className="w-4 h-4" />
                          </button>
                          <button
                            title='Delete'
                            onClick={() => openDeleteModal(backup.name)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/30 rounded hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-colors"
                          >
                            <GoTrash className="w-4 h-4" />
                          </button>
                          <button
                            title='Download'
                            onClick={() => handleDownloadBackup(backup.name)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/30 rounded hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-colors"
                          >
                            <GoDownload className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ===== Jobs Tab ===== */}
      {activeTab === 'jobs' && (
        <div className='bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-600 p-2'>
          {jobs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-slate-600 dark:text-slate-300">No backup jobs yet</div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {jobs.map((job) => {
                const cfg = STATUS_CONFIG[job.status]
                return (
                  <div
                    key={job.job_id}
                    className="flex items-center gap-3 px-2 py-2 text-sm font-mono"
                  >
                    {/* Timestamp */}
                    <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                      {formatDateTime(job.completed_at || job.started_at)}
                    </span>
                    <div className='flex flex-col gap-2 flex-1 min-w-0'>
                      <div className='flex gap-3'>
                        {/* Status dot + label */}
                        <span className="flex items-center gap-1.5 shrink-0">
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          <span className={`text-xs ${cfg.text}`}>{cfg.label}</span>
                        </span>

                        {/* Name */}
                        <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
                          {job.backup_name}
                        </span>
                      </div>

                      {/* Error */}
                      {job.error && (
                        <span className="text-xs text-red-500 dark:text-red-400 truncate block">
                          {job.error}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Create Backup Modal */}
      {showCreateModal && (
        <CreateBackupModal closeBackupModal={closeCreateModal} />
      )}

      {/* Restore Backup Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Restore Backup</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Restoring backup: <span className="font-medium text-slate-800 dark:text-slate-200">{restoreBackupName}</span>
            </p>

            {restoreError && (
              <Notification type="error" message={restoreError} compact className="mb-4" />
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Target Index Name
              </label>
              <input
                type="text"
                value={restoreTargetIndex}
                onChange={(e) => setRestoreTargetIndex(e.target.value)}
                placeholder="Name for the restored index"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                This will create a new index with the given name from the backup data.
              </p>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={closeRestoreModal}
                disabled={restoring}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRestoreBackup}
                disabled={restoring || !restoreTargetIndex.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {restoring ? 'Restoring...' : 'Restore'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Delete Backup</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Are you sure you want to delete the backup "<span className="font-medium">{deleteBackupName}</span>"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={closeDeleteModal}
                disabled={deleting}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBackup}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:bg-red-400"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Backup Modal */}
      {showUploadModal && (
        <UploadBackupModal closeUploadModal={closeUploadModal} />
      )}
    </div>
  )
}
