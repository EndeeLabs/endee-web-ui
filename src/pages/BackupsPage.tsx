import { useEffect, useState, useRef } from 'react'
import { GoPlus, GoTrash, GoSync, GoCheck, GoX } from 'react-icons/go'
import { useAuth } from '../context/AuthContext'
import CreateBackupModal from '../components/CreateBackupModal'

interface Backup {
  name: string
}

export default function BackupsPage() {
  const [backups, setBackups] = useState<Backup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pageTopRef = useRef<HTMLDivElement>(null)

  // Create backup modal state
  const [showCreateModal, setShowCreateModal] = useState(false)

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

  // Success notification state
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Authentication operations
  const { token, handleUnauthorized } = useAuth()

  useEffect(() => {
    loadBackups()
  }, [])

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

  const scrollToTop = () => {
    pageTopRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    scrollToTop()
    setTimeout(() => setSuccessMessage(null), 4000)
  }

  const showError = (message: string) => {
    setError(message)
    scrollToTop()
  }

  const openCreateModal = () => {
    setShowCreateModal(true)
  }

  const closeCreateModal = () => {
    setShowCreateModal(false)
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
      showSuccess(`Backup "${restoreBackupName}" restored to index "${restoreTargetIndex.trim()}"`)
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
      showSuccess(`Backup "${deleteBackupName}" deleted successfully`)
      loadBackups()
    } catch (err) {
      closeDeleteModal()
      showError(err instanceof Error ? err.message : 'Failed to delete backup')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div ref={pageTopRef} />
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Backups</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Manage your index backups</p>
        </div>
        {!loading && !error && backups.length !== 0 && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <GoPlus className="w-5 h-5" />
            Create Backup
          </button>
        )}
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="mb-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GoCheck className="w-5 h-5" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="hover:opacity-70">
            <GoX className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-md mb-4 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="hover:opacity-70">
            <GoX className="w-5 h-5" />
          </button>
        </div>
      )}

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
                <tr key={backup.name} className="">
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Backup Modal */}
      {showCreateModal && (
        <CreateBackupModal closeBackupModal={closeCreateModal} showSuccess={showSuccess} />
      )}

      {/* Restore Backup Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Restore Backup</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Restoring backup: <span className="font-medium text-slate-800 dark:text-slate-200">{restoreBackupName}</span>
            </p>

            {/* Error inside modal */}
            {restoreError && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-3 py-2 rounded-md text-sm">
                {restoreError}
              </div>
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
    </div>
  )
}
