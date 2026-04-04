import ClipForm from '../ClipForm'

export default function NewClipPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Add Practice</h1>
        <p className="text-text-secondary text-sm mt-1">Add a new practice clip to the library.</p>
      </div>
      <ClipForm mode="new" />
    </div>
  )
}
