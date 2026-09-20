import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import VendorLayout from '../../components/vendor/VendorLayout.jsx'
import { LoadingBlock, ErrorBlock } from '../../components/vendor/StateBlocks.jsx'
import Icon from '../../components/Icon.jsx'
import { api } from '../../services/api.js'
import { formatGHS } from '../../data/mockData.js'

const emptySpec = () => ({ label: '', value: '' })

export default function VendorProductFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(isEdit)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadAvailable, setUploadAvailable] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [defaultShare, setDefaultShare] = useState(null)

  const [form, setForm] = useState({
    name: '',
    sku: '',
    categoryId: '',
    price: '',
    oldPrice: '',
    stock: '',
    imageUrl: '',
    description: '',
    isActive: true,
  })
  const [specs, setSpecs] = useState([emptySpec()])

  // The upload control only appears if the server actually has image hosting
  // configured, so a vendor is never shown a button that can't work.
  useEffect(() => {
    api
      .getUploadStatus()
      .then((res) => setUploadAvailable(Boolean(res.available)))
      .catch(() => setUploadAvailable(false))
  }, [])

  useEffect(() => {
    api.getCategories().then((res) => setCategories(res.categories || [])).catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    if (!isEdit) return
    setLoading(true)
    api
      .getVendorProduct(id)
      .then((res) => {
        const p = res.product
        setForm({
          name: p.name,
          sku: p.sku || '',
          categoryId: p.category?.id || '',
          price: String(p.price),
          oldPrice: p.oldPrice != null ? String(p.oldPrice) : '',
          stock: String(p.stock),
          imageUrl: p.image || '',
          description: p.description || '',
          isActive: p.isActive,
        })
        setSpecs(p.specs?.length ? p.specs.map((s) => ({ label: s.label, value: s.value })) : [emptySpec()])
        setDefaultShare(p.sharePercent)
      })
      .catch((e) => setLoadError(e.message || 'Could not load this product'))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function updateSpec(index, field, value) {
    setSpecs((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  }

  function addSpec() {
    setSpecs((prev) => [...prev, emptySpec()])
  }

  function removeSpec(index) {
    setSpecs((prev) => prev.filter((_, i) => i !== index))
  }

  // Mirrors the server-side rule in vendorController.normalizeImageUrl so the
  // vendor gets the message immediately. The server re-validates regardless.
  function imageUrlError(value) {
    const raw = value.trim()
    if (!raw) return ''
    if (raw.startsWith('/') || /^https?:\/\//i.test(raw)) return ''
    return 'Image URL must start with http://, https:// or /'
  }

  async function handleImageFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setSaveError('')
    try {
      const res = await api.uploadProductImage(file)
      updateField('imageUrl', res.imageUrl)
    } catch (err) {
      setSaveError(err.message || 'Could not upload that image')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaveError('')
    const imageProblem = imageUrlError(form.imageUrl)
    if (imageProblem) {
      setSaveError(imageProblem)
      return
    }
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim() || null,
      categoryId: form.categoryId || null,
      price: Number(form.price),
      oldPrice: form.oldPrice === '' ? null : Number(form.oldPrice),
      stock: Number(form.stock),
      imageUrl: form.imageUrl.trim() || null,
      description: form.description.trim(),
      specs: specs.filter((s) => s.label.trim() && s.value.trim()),
      isActive: form.isActive,
    }
    try {
      if (isEdit) {
        await api.updateVendorProduct(id, payload)
      } else {
        await api.createVendorProduct(payload)
      }
      navigate('/vendor/products')
    } catch (err) {
      setSaveError(err.message || 'Could not save this product')
    } finally {
      setSaving(false)
    }
  }

  const priceNum = Number(form.price)
  const sharePreview = defaultShare != null ? defaultShare : 80
  const grossPreview = Number.isFinite(priceNum) && priceNum > 0 ? (priceNum * sharePreview) / 100 : null

  return (
    <VendorLayout title={isEdit ? 'Edit Product' : 'Add Product'}>
      {loading ? (
        <LoadingBlock label="Loading product…" />
      ) : loadError ? (
        <ErrorBlock message={loadError} />
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-5 lg:col-span-2">
            <div className="rounded-card border border-pb-gray-border bg-white p-5 shadow-card">
              <h2 className="mb-4 text-sm font-semibold text-pb-gray-text">Basic Information</h2>
              <div className="flex flex-col gap-4">
                <Field label="Product name" required>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="input"
                    placeholder="e.g. Samsung 43-inch Smart TV"
                  />
                </Field>
                <Field label="SKU">
                  <input
                    value={form.sku}
                    onChange={(e) => updateField('sku', e.target.value)}
                    className="input"
                    maxLength={64}
                    placeholder="Optional — your own stock code, e.g. TV-SAM-43"
                  />
                </Field>
                <Field label="Category">
                  <select value={form.categoryId} onChange={(e) => updateField('categoryId', e.target.value)} className="input">
                    <option value="">Select a category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Description">
                  <textarea
                    value={form.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    rows={5}
                    className="input resize-none"
                    placeholder="Describe the product for customers…"
                  />
                </Field>
                <Field label="Image URL">
                  <input
                    value={form.imageUrl}
                    onChange={(e) => updateField('imageUrl', e.target.value)}
                    className="input"
                    placeholder="https://…"
                  />
                  {uploadAvailable ? (
                    <span className="mt-2 flex flex-wrap items-center gap-2">
                      <label className="cursor-pointer rounded-lg border border-pb-gray-border px-3 py-1.5 text-xs font-semibold text-pb-gray-text hover:bg-pb-gray-bg">
                        {uploading ? 'Uploading…' : 'Upload an image'}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          disabled={uploading}
                          onChange={handleImageFile}
                        />
                      </label>
                      <span className="text-xs text-pb-gray-muted">JPEG, PNG or WebP, up to 5MB — or paste a link above.</span>
                    </span>
                  ) : (
                    <span className="text-xs text-pb-gray-muted">
                      Paste a link to an image already hosted online.
                    </span>
                  )}
                  {form.imageUrl && (
                    <img
                      src={form.imageUrl}
                      alt=""
                      className="mt-2 h-24 w-24 rounded-lg border border-pb-gray-border object-cover"
                    />
                  )}
                </Field>
              </div>
            </div>

            <div className="rounded-card border border-pb-gray-border bg-white p-5 shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-pb-gray-text">Specifications</h2>
                <button type="button" onClick={addSpec} className="flex items-center gap-1 text-xs font-semibold text-pb-green">
                  <Icon name="plus" size={14} />
                  Add spec
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {specs.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={s.label}
                      onChange={(e) => updateSpec(i, 'label', e.target.value)}
                      placeholder="Label (e.g. Screen Size)"
                      className="input"
                    />
                    <input
                      value={s.value}
                      onChange={(e) => updateSpec(i, 'value', e.target.value)}
                      placeholder="Value (e.g. 43 inches)"
                      className="input"
                    />
                    <button
                      type="button"
                      onClick={() => removeSpec(i)}
                      aria-label="Remove spec"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-pb-gray-muted hover:bg-pb-gray-bg"
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="rounded-card border border-pb-gray-border bg-white p-5 shadow-card">
              <h2 className="mb-4 text-sm font-semibold text-pb-gray-text">Pricing &amp; Stock</h2>
              <div className="flex flex-col gap-4">
                <Field label="Price (GH₵)" required>
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => updateField('price', e.target.value)}
                    className="input"
                  />
                </Field>
                <Field label="Old price (GH₵)">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.oldPrice}
                    onChange={(e) => updateField('oldPrice', e.target.value)}
                    className="input"
                    placeholder="Optional — for showing a discount"
                  />
                </Field>
                <Field label="Stock quantity" required>
                  <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={(e) => updateField('stock', e.target.value)}
                    className="input"
                  />
                </Field>

                {grossPreview != null && (
                  <div className="rounded-lg bg-pb-green-light px-3 py-2.5 text-xs text-pb-green-dark">
                    At {sharePreview}% your share, you'd earn <span className="font-semibold">{formatGHS(grossPreview)}</span> per unit sold.
                  </div>
                )}

                <label className="flex items-center gap-2 text-sm text-pb-gray-text">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => updateField('isActive', e.target.checked)} className="h-4 w-4 rounded border-pb-gray-border text-pb-green" />
                  Active (visible to customers)
                </label>
              </div>
            </div>

            {saveError && <p className="rounded-lg bg-pb-red/10 px-3 py-2 text-sm text-pb-red">{saveError}</p>}

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-pb-green px-4 py-3 text-sm font-semibold text-white hover:bg-pb-green-dark disabled:opacity-60"
            >
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      )}
    </VendorLayout>
  )
}

function Field({ label, required, children }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-pb-gray-text">
        {label}
        {required && <span className="text-pb-red"> *</span>}
      </span>
      {children}
    </label>
  )
}
