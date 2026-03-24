import { Modal } from './Modal.jsx'

export function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <Modal title="Confirm" onClose={onCancel}>
      <p className="text-slate-300 mb-6">{message}</p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-lg bg-slate-700 text-slate-200 font-medium hover:bg-slate-600"
        >Cancel</button>
        <button
          onClick={onConfirm}
          className="flex-1 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-500"
        >Delete</button>
      </div>
    </Modal>
  )
}
