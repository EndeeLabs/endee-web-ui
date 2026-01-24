import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { GoArrowLeft, GoSearch, GoTrash } from 'react-icons/go'
import { api } from '../api/client'
import type { IndexDescription } from '../api/client'
import type { VectorInfo } from 'endee'

export default function VectorGetPage() {
  const { indexName } = useParams<{ indexName: string }>()
  const navigate = useNavigate()
  const [indexInfo, setIndexInfo] = useState<IndexDescription | null>(null)
  const [vectorId, setVectorId] = useState('')
  const [searching, setSearching] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deletingByFilter, setDeletingByFilter] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [result, setResult] = useState<VectorInfo | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteFilterInput, setDeleteFilterInput] = useState('')

  const isHybrid = indexInfo?.isHybrid;

  useEffect(() => {
    if (indexName) {
      loadIndexInfo()
    }
  }, [indexName])

  const loadIndexInfo = async () => {
    if (!indexName) return
    try {
      const response = await api.getIndexInfo(indexName)
      if (response.success && response.data) {
        setIndexInfo(response.data)
      }
    } catch (err) {
      console.error('Failed to load index info:', err)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setResult(null)

    if (!indexName) return

    if (!vectorId.trim()) {
      setError('Vector ID is required')
      return
    }

    setSearching(true)
    try {
      const response = await api.getVector(indexName, { id: vectorId.trim() })

      if (!response.success) {
        throw new Error(response.error || 'Failed to get vector')
      }

      setResult(response.data!)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get vector')
    } finally {
      setSearching(false)
    }
  }

  const handleDeleteById = async () => {
    if (!indexName || !result) return

    setDeleting(true)
    setError(null)
    try {
      const response = await api.deleteVectorById(indexName, result.id)

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete vector')
      }

      setSuccess(`Vector "${result.id}" deleted successfully`)
      setResult(null)
      setVectorId('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete vector')
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteByFilter = async () => {
    if (!indexName || !deleteFilterInput.trim()) return

    setDeletingByFilter(true)
    setError(null)
    setShowDeleteConfirm(false)
    try {
      const filter = JSON.parse(deleteFilterInput)
      const response = await api.deleteVectorsByFilter(indexName, filter)

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete vectors')
      }

      setSuccess(`Deleted ${response.data?.deleted || 0} vector(s) matching the filter`)
      setResult(null)
      setDeleteFilterInput('')
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON filter')
      } else {
        setError(err instanceof Error ? err.message : 'Failed to delete vectors')
      }
    } finally {
      setDeletingByFilter(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(`/indexes/${indexName}`)}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 mb-4"
        >
          <GoArrowLeft className="w-5 h-5" />
          Back to {indexName}
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Get & Delete Vectors</h1>
          {isHybrid && (
            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full">
              Hybrid Index
            </span>
          )}
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          Retrieve and manage vectors in "{indexName}"
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded-md mb-6">
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* Get Vector Form */}
      <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Get Vector by ID</h3>
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Vector ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={vectorId}
              onChange={(e) => setVectorId(e.target.value)}
              placeholder="e.g., vec_001"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={searching}
            />
          </div>

          <button
            type="submit"
            disabled={searching}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            <GoSearch className="w-4 h-4" />
            {searching ? 'Searching...' : 'Get Vector'}
          </button>
        </form>
      </div>

      {/* Result */}
      {result && (
        <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-4 mb-6">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-3 border-b pb-2 border-slate-200">
            <div className='flex gap-4'>
              <span className="font-medium text-slate-500 dark:text-slate-400 uppercase shrink-0">ID</span>
              <span className="font-medium text-slate-800 dark:text-slate-100">{result.id}</span>
            </div>
            <button
              onClick={handleDeleteById}
              disabled={deleting}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors disabled:bg-red-400"
            >
              <GoTrash className="w-4 h-4" />
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>

          {/* Content */}
          <div className="space-y-2 text-sm">
            {result.meta && Object.keys(result.meta).length > 0 && (
              <div className="flex gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase w-16 shrink-0">Meta</span>
                <pre className="text-slate-700 dark:text-slate-300 text-xs overflow-x-auto">
                  {JSON.stringify(result.meta, null, 2)}
                </pre>
              </div>
            )}

            {result.filter && (
              <div className="flex gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase w-16 shrink-0">Filter</span>
                <code className="text-slate-700 dark:text-slate-300 text-xs">
                  {JSON.stringify(result.filter, null, 2)}
                </code>
              </div>
            )}

            <div className="flex gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase w-16 shrink-0">Norm</span>
              <code className="text-slate-700 dark:text-slate-300 text-xs">{result.norm.toFixed(6)}</code>
            </div>

            <div className="flex gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase w-16 shrink-0">Vector</span>
              <code className="text-slate-700 dark:text-slate-300 text-xs">
                [{result.vector.slice(0, 8).map(v => v.toFixed(4)).join(', ')}
                {result.vector.length > 8 && `, ... (${result.vector.length})`}]
              </code>
            </div>
          </div>
        </div>
      )}

      {/* Delete by Filter Section */}
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
          Bulk Delete by Filter
        </h3>
        <p className="text-sm text-red-700 dark:text-red-300 mb-4">
          Delete multiple vectors matching a filter. This action cannot be undone.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-red-800 dark:text-red-200 mb-2">
              Delete Filter
            </label>
            <textarea
              value={deleteFilterInput}
              onChange={(e) => setDeleteFilterInput(e.target.value)}
              placeholder='e.g., {"year": {"$lt": 2020}}'
              rows={2}
              className="w-full px-3 py-2 border border-red-300 dark:border-red-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono text-sm"
              disabled={deletingByFilter}
            />
          </div>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={!deleteFilterInput.trim() || deletingByFilter}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:bg-red-400 disabled:cursor-not-allowed"
            >
              <GoTrash className="w-4 h-4" />
              Delete Matching Vectors
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-red-700 dark:text-red-300">Are you sure?</span>
              <button
                onClick={handleDeleteByFilter}
                disabled={deletingByFilter}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors disabled:bg-red-400"
              >
                {deletingByFilter ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deletingByFilter}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Help Card */}
      {!result && (
        <div className="bg-blue-50 dark:bg-slate-600 border border-blue-200 dark:border-slate-500 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-slate-100 mb-2">Filter Operators</h3>
          <div className="grid md:grid-cols-2 gap-4 text-xs text-blue-800 dark:text-slate-200 font-mono">
            <div>
              <p className="mb-1"><code>$eq</code> - Equal to</p>
              <p className="mb-1"><code>$in</code> - Value in array</p>
            </div>
            <div>
              <p className="mb-1"><code>$range</code> - Value in range</p>
            </div>
          </div>
          <div className="mt-3 p-2 bg-blue-100 dark:bg-slate-700 rounded text-xs font-mono text-blue-900 dark:text-slate-200">
            Example: {`{"type": {"$eq": "article"}}`}
          </div>
        </div>
      )}
    </div>
  )
}
