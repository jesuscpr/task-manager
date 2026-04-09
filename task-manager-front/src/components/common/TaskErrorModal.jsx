import { useState, useEffect } from 'react'
import './ConfirmModal.css'

const TaskErrorModal = ({
  isOpen,
  onClose,
  onRetry = null,
  title = 'Ha ocurrido un error',
  message = 'No se pudo completar la acción.',
  closeText = 'Cerrar',
  retryText = 'Reintentar',
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

  const handleRetry = () => {
    if (onRetry) onRetry()
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
            {closeText}
          </button>
          {onRetry && (
            <button
              type='button'
              onClick={handleRetry}
              className='confirm-btn-confirm'
            >
              {retryText}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default TaskErrorModal
