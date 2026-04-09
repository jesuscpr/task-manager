const ArrowRightIcon = ({ className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M14 12l-10 0" />
    <path d="M14 12l-4 4" />
    <path d="M14 12l-4 -4" />
    <path d="M20 4l0 16" />
  </svg>
)

export default ArrowRightIcon
