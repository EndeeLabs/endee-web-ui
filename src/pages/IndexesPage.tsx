import { useEffect, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GoPlus, GoArchive, GoCheck, GoX } from 'react-icons/go'
import { api, isHybridIndex } from '../api/client'
import type { Index } from '../api/client'

export default function IndexesPage() {
  const [indices, setIndices] = useState<Index[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const pageTopRef = useRef<HTMLDivElement>(null)

  // Backup modal state
  const [showBackupModal, setShowBackupModal] = useState(false)
  const [backupIndexName, setBackupIndexName] = useState('')
  const [backupName, setBackupName] = useState('')
  const [creatingBackup, setCreatingBackup] = useState(false)
  const [backupError, setBackupError] = useState<string | null>(null)

  // Success notification state
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    loadIndices()
  }, [])

  const loadIndices = async () => {
    setLoading(true)
    try {
      const response = await api.listIndexes()

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch indices')
      }

      setIndices(response.data?.indexes || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load indices')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const openBackupModal = (indexName: string) => {
    setBackupIndexName(indexName)
    setBackupName('')
    setBackupError(null)
    setShowBackupModal(true)
  }

  const closeBackupModal = () => {
    setShowBackupModal(false)
    setBackupIndexName('')
    setBackupName('')
    setBackupError(null)
  }

  const scrollToTop = () => {
    pageTopRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    scrollToTop()
    setTimeout(() => setSuccessMessage(null), 4000)
  }

  const handleCreateBackup = async () => {
    if (!backupIndexName || !backupName.trim()) return

    setCreatingBackup(true)
    setBackupError(null)
    try {
      const response = await fetch(`/api/v1/index/${encodeURIComponent(backupIndexName)}/backup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: backupName.trim() })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create backup')
      }

      closeBackupModal()
      showSuccess(`Backup "${backupName.trim()}" created successfully for index "${backupIndexName}"`)
    } catch (err) {
      setBackupError(err instanceof Error ? err.message : 'Failed to create backup')
    } finally {
      setCreatingBackup(false)
    }
  }

  return (
    <div>
      <div ref={pageTopRef} />
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Indexes</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Manage your vector indexes</p>
        </div>

        {!loading && !error && indices.length !== 0 && (
          <button
            onClick={() => navigate('/indexes/create')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <GoPlus className="w-5 h-5" />
            Create Index
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

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-slate-600 dark:text-slate-300">Loading indices...</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && indices.length === 0 && (
        <div className="text-center py-12">
          <div className="text-slate-600 dark:text-slate-300 mb-4">No indexes found</div>
          <button
            onClick={() => navigate('/indexes/create')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create your first index
          </button>
        </div>
      )}

      {/* Indices List */}
      {!loading && !error && indices.length > 0 && (
        <div className="grid gap-4">
          {indices.map((index, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <Link to={`/indexes/${index.name}`} className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{index.name}</h3>
                  {isHybridIndex(index) ? (
                    <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full">
                      Hybrid
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                      Dense
                    </span>
                  )}
                </Link>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openBackupModal(index.name)}
                    className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-600 rounded hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors"
                  >
                    <GoArchive className="w-4 h-4" />
                    Backup
                  </button>
                </div>
              </div>

              <Link to={`/indexes/${index.name}`}>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Created {formatDate(index.created_at)}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-600">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase">Dimension</div>
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1">{index.dimension}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase">Space Type</div>
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1">{index.space_type}</div>
                  </div>
                   <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase">Precision</div>
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1 capitalize">{index.precision}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase">Vectors</div>
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1">
                      {index.total_elements.toLocaleString()}
                    </div>
                  </div>
                  {isHybridIndex(index) && (
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 uppercase">Sparse Dim</div>
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1">{index.sparse_dim}</div>
                    </div>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Backup Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Create Backup</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Creating backup for index: <span className="font-medium text-slate-800 dark:text-slate-200">{backupIndexName}</span>
            </p>

            {/* Error inside modal */}
            {backupError && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-3 py-2 rounded-md text-sm">
                {backupError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Backup Name
              </label>
              <input
                type="text"
                value={backupName}
                onChange={(e) => setBackupName(e.target.value)}
                placeholder="Enter a name for the backup"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={closeBackupModal}
                disabled={creatingBackup}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBackup}
                disabled={creatingBackup || !backupName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {creatingBackup ? 'Creating...' : 'Create Backup'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
