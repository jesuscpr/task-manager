const SunIcon = ({ className = '' }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="4.25" stroke="currentColor" strokeWidth="1.9" />
    <path
      d="M12 2.75V5.1M12 18.9v2.35M5.46 5.46l1.66 1.66M16.88 16.88l1.66 1.66M2.75 12H5.1M18.9 12h2.35M5.46 18.54l1.66-1.66M16.88 7.12l1.66-1.66"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
  </svg>
)

export default SunIcon
