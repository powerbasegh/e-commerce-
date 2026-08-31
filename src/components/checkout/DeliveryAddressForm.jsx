import { useState } from 'react'
import Icon from '../Icon.jsx'
import FormField, { inputClass, inputErrorClass } from './FormField.jsx'

// Location permission is optional and never blocks checkout — manual address
// entry always works whether or not the browser grants location access.
const LOCATION_STATUS = {
  IDLE: 'idle',
  REQUESTING: 'requesting',
  GRANTED: 'granted',
  DENIED: 'denied',
  UNSUPPORTED: 'unsupported',
}

export default function DeliveryAddressForm({ location, errors, onFieldChange, onCoords, instructions, onInstructionsChange }) {
  const [locationStatus, setLocationStatus] = useState(LOCATION_STATUS.IDLE)

  function handleUseCurrentLocation() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationStatus(LOCATION_STATUS.UNSUPPORTED)
      return
    }

    setLocationStatus(LOCATION_STATUS.REQUESTING)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onCoords(position.coords.latitude, position.coords.longitude)
        setLocationStatus(LOCATION_STATUS.GRANTED)
      },
      () => {
        // Permission denied or unavailable — checkout continues normally
        // with manual address entry, per PowerBase's requirement that GPS
        // is never required to complete an order.
        setLocationStatus(LOCATION_STATUS.DENIED)
      },
      { timeout: 10000 },
    )
  }

  return (
    <section className="flex flex-col gap-3 rounded-card border border-pb-gray-border bg-white p-4 shadow-card sm:p-5">
      <h2 className="text-sm font-bold text-pb-gray-text sm:text-base">Delivery Information</h2>

      <button
        type="button"
        onClick={handleUseCurrentLocation}
        disabled={locationStatus === LOCATION_STATUS.REQUESTING}
        className="flex items-center justify-center gap-2 rounded-lg border border-pb-green px-3 py-2.5 text-sm font-semibold text-pb-green transition-colors hover:bg-pb-green-light disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Icon name="location" size={16} />
        {locationStatus === LOCATION_STATUS.REQUESTING ? 'Getting your location…' : 'Use Current Location'}
      </button>

      {locationStatus === LOCATION_STATUS.GRANTED && (
        <p className="text-xs text-pb-green-dark">
          Location captured. Please still fill in your address details below so PowerBase can confirm delivery.
        </p>
      )}
      {locationStatus === LOCATION_STATUS.DENIED && (
        <p className="text-xs text-pb-gray-muted">
          Location access wasn't available. No problem — just enter your address manually below.
        </p>
      )}
      {locationStatus === LOCATION_STATUS.UNSUPPORTED && (
        <p className="text-xs text-pb-gray-muted">
          Location isn't supported on this device/browser. Please enter your address manually below.
        </p>
      )}

      <FormField label="Delivery Address" required error={errors.address}>
        <input
          type="text"
          value={location.address}
          onChange={(e) => onFieldChange('address', e.target.value)}
          placeholder="House number, street name"
          className={errors.address ? inputErrorClass : inputClass}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="City" required error={errors.city}>
          <input
            type="text"
            value={location.city}
            onChange={(e) => onFieldChange('city', e.target.value)}
            placeholder="e.g. Accra"
            className={errors.city ? inputErrorClass : inputClass}
          />
        </FormField>

        <FormField label="Area" required error={errors.area}>
          <input
            type="text"
            value={location.area}
            onChange={(e) => onFieldChange('area', e.target.value)}
            placeholder="e.g. East Legon"
            className={errors.area ? inputErrorClass : inputClass}
          />
        </FormField>
      </div>

      <FormField label="Landmark (optional)">
        <input
          type="text"
          value={location.landmark}
          onChange={(e) => onFieldChange('landmark', e.target.value)}
          placeholder="e.g. Opposite the pharmacy"
          className={inputClass}
        />
      </FormField>

      <FormField label="Delivery Instructions (optional)">
        <textarea
          value={instructions}
          onChange={(e) => onInstructionsChange(e.target.value)}
          placeholder="e.g. Call me when you arrive, blue gate"
          rows={3}
          className={`${inputClass} resize-none`}
        />
      </FormField>
    </section>
  )
}
