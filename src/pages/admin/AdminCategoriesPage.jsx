import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout.jsx'
import ConfirmDialog from '../../components/vendor/ConfirmDialog.jsx'
import { LoadingBlock, ErrorBlock, EmptyBlock } from '../../components/vendor/StateBlocks.jsx'
import Icon from '../../components/Icon.jsx'
import { api } from '../../services/api.js'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [editing, setEditing] = useState(null) // { id, name }
  const [editBusy, setEditBusy] = useState(false)
  const [editError, setEditError] = useState('')
  const [toDelete, setToDelete] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  function load() {
    setLoading(true)
    setError('')
    api
      .getAdminCategories()
      .then((res) => setCategories(res.categories || []))
      .catch((e) => setError(e.message || 'Could not load categories'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function createCategory(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true); setCreateError('')
    try {
      await api.createAdminCategory(newName.trim())
      setNewName('')
      load()
    } catch (e) {
      setCreateError(e.message || 'Could not create category')
    } finally {
      setCreating(false)
    }
  }

  async function saveEdit(e) {
    e.preventDefault()
    setEditBusy(true); setEditError('')
    try {
      await api.updateAdminCategory(editing.id, editing.name.trim())
      setEditing(null)
      load()
    } catch (e) {
      setEditError(e.message || 'Could not update category')
    } finally {
      setEditBusy(false)
    }
  }

  async function confirmDelete() {
    setDeleteBusy(true); setDeleteError('')
    try {
      await api.deleteAdminCategory(toDelete.id)
      setToDelete(null)
      load()
    } catch (e) {
      setDeleteError(e.message || 'Could not delete category')
      setDeleteBusy(false)
    }
  }

  return (
    <AdminLayout title="Categories">
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-card border border-pb-gray-border bg-white p-5 shadow-card lg:order-2">
          <h2 className="mb-3 text-sm font-bold text-pb-gray-text">New category</h2>
          <form onSubmit={createCategory} className="flex items-center gap-2">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Category name" className="flex-1 rounded-lg border border-pb-gray-border p-2.5 text-sm" />
            <button disabled={creating || !newName.trim()} className="flex items-center gap-1.5 rounded-lg bg-pb-navy px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              <Icon name="plus" size={15} /> Add
            </button>
          </form>
          {createError && <p className="mt-2 rounded-lg bg-pb-red/10 p-2.5 text-xs text-pb-red">{createError}</p>}
        </section>

        <section className="rounded-card border border-pb-gray-border bg-white p-5 shadow-card lg:order-1">
          {loading ? (
            <LoadingBlock label="Loading categories…" />
          ) : error ? (
            <ErrorBlock message={error} onRetry={load} />
          ) : categories.length === 0 ? (
            <EmptyBlock icon="tag" title="No categories yet" description="Create one to start organising the catalogue." />
          ) : (
            <ul className="divide-y divide-pb-gray-border">
              {categories.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                  {editing?.id === c.id ? (
                    <form onSubmit={saveEdit} className="flex flex-1 items-center gap-2">
                      <input autoFocus value={editing.name} onChange={(e) => setEditing((s) => ({ ...s, name: e.target.value }))} className="flex-1 rounded-lg border border-pb-gray-border p-2 text-sm" />
                      <button disabled={editBusy} className="rounded-lg bg-pb-green px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Save</button>
                      <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-pb-gray-border px-3 py-2 text-xs font-semibold text-pb-gray-text">Cancel</button>
                    </form>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm font-medium text-pb-gray-text">{c.name}</p>
                        <p className="text-xs text-pb-gray-muted">{c.productCount} product{c.productCount === 1 ? '' : 's'}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => setEditing({ id: c.id, name: c.name })} aria-label={`Edit ${c.name}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-pb-gray-muted hover:bg-pb-gray-bg">
                          <Icon name="edit" size={15} />
                        </button>
                        <button type="button" onClick={() => setToDelete(c)} aria-label={`Delete ${c.name}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-pb-red hover:bg-pb-red/10">
                          <Icon name="trash" size={15} />
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
          {editError && <p className="mt-2 rounded-lg bg-pb-red/10 p-2.5 text-xs text-pb-red">{editError}</p>}
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={`Delete "${toDelete?.name}"?`}
        description={deleteError || 'This only succeeds if no products are assigned to this category.'}
        confirmLabel="Delete"
        tone="danger"
        busy={deleteBusy}
        onConfirm={confirmDelete}
        onCancel={() => { setToDelete(null); setDeleteError('') }}
      />
    </AdminLayout>
  )
}
