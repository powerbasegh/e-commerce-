export default function QuantitySelector({ quantity, onChange, max = 99, min = 1 }) {
  function decrement() {
    onChange(Math.max(min, quantity - 1))
  }

  function increment() {
    onChange(Math.min(max, quantity + 1))
  }

  return (
    <div className="inline-flex items-center rounded-full border border-pb-gray-border">
      <button
        type="button"
        onClick={decrement}
        disabled={quantity <= min}
        aria-label="Decrease quantity"
        className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-pb-gray-text transition-colors hover:bg-pb-gray-bg disabled:cursor-not-allowed disabled:opacity-40"
      >
        −
      </button>
      <span className="w-8 text-center text-sm font-semibold text-pb-gray-text" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        onClick={increment}
        disabled={quantity >= max}
        aria-label="Increase quantity"
        className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-pb-gray-text transition-colors hover:bg-pb-gray-bg disabled:cursor-not-allowed disabled:opacity-40"
      >
        +
      </button>
    </div>
  )
}
