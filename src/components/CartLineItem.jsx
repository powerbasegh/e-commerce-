import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'
import QuantitySelector from './QuantitySelector.jsx'
import { formatGHS } from '../data/mockData.js'

export default function CartLineItem({ item, onIncrement, onDecrement, onRemove }) {
  const lineTotal = item.price * item.quantity
  const atStockLimit = item.quantity >= item.stockQuantity

  return (
    <div className="flex gap-3 py-4 first:pt-0 last:pb-0">
      <Link
        to={`/product/${item.productId}`}
        className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-pb-gray-bg"
      >
        <img src={item.productImage} alt={item.productName} className="h-full w-full object-contain p-2" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <Link
            to={`/product/${item.productId}`}
            className="line-clamp-2 text-sm font-medium text-pb-gray-text hover:text-pb-green"
          >
            {item.productName}
          </Link>
          <button
            type="button"
            onClick={() => onRemove(item.productId)}
            aria-label={`Remove ${item.productName} from cart`}
            className="shrink-0 text-pb-gray-muted transition-colors hover:text-pb-red"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-pb-gray-text">{formatGHS(item.price)}</span>
          {item.oldPrice && (
            <span className="text-xs text-pb-gray-muted line-through">{formatGHS(item.oldPrice)}</span>
          )}
        </div>

        <p className={`text-xs font-medium ${item.stockQuantity > 0 ? 'text-pb-gray-muted' : 'text-pb-red'}`}>
          {item.stockQuantity > 0 ? `${item.stockQuantity} in stock` : 'Out of stock'}
        </p>

        <div className="mt-1 flex items-center justify-between">
          <QuantitySelector
            quantity={item.quantity}
            max={item.stockQuantity}
            onChange={(next) => {
              if (next > item.quantity) onIncrement(item.productId)
              else onDecrement(item.productId)
            }}
          />
          <span className="text-sm font-bold text-pb-gray-text">{formatGHS(lineTotal)}</span>
        </div>
        {atStockLimit && (
          <p className="text-[11px] text-pb-amber">Maximum available stock reached</p>
        )}
      </div>
    </div>
  )
}
