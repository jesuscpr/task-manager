import { useState, useEffect } from 'react'
import './ConfirmModal.css'

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "¿Estás seguro?",
  message = "Esta acción no se puede deshacer.",
  confirmText = "Eliminar",
  cancelText = "Cancelar",
  isDangerous = true 
}) => {
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setIsClosing(false)
    }
  }, [isOpen])

  if (!isOpen && !isClosing) return null

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 300)
  }

  const handleConfirm = () => {
    onConfirm()
    handleClose()
  }

  return (
    <div
      className={`confirm-modal-overlay ${isClosing ? 'closing' : ''}`}
      onClick={handleClose}
    >
      <div
        className={`confirm-modal-content ${isClosing ? 'closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className='confirm-modal-close' onClick={handleClose}>
          &times;
        </button>
        
        <div className='confirm-modal-header'>
          <h3 className='confirm-modal-title'>{title}</h3>
        </div>

        <div className='confirm-modal-body'>
          <p className='confirm-modal-message'>{message}</p>
        </div>

        <div className='confirm-modal-footer'>
          <button
            type='button'
            onClick={handleClose}
            className='confirm-btn-cancel'
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`confirm-btn-confirm ${isDangerous ? 'dangerous' : ''}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal