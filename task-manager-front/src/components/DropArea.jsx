import { useState } from 'react';
import './DropArea.css';

const DropArea = ({ onDrop, big }) => {
  const [showDrop, setShowDrop] = useState(false)
  return (
    <section
      onDragEnter={() => setShowDrop(true)}
      onDragLeave={() => setShowDrop(false)}
      onDrop={() => {
        onDrop();
        setShowDrop(false)
      }}
      onDragOver={e => e.preventDefault()}
      className={`${showDrop ? "dropArea" : "hideDrop"} ${big ? "big" : ""}`}
    >Drop Here</section>
  )
}

export default DropArea
