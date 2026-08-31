import { useState } from 'react'
import AccountLayout from '../components/account/AccountLayout.jsx'
import AddressCard from '../components/account/AddressCard.jsx'
import AddressFormPanel from '../components/account/AddressFormPanel.jsx'
import EmptyAddresses from '../components/account/EmptyAddresses.jsx'
import Icon from '../components/Icon.jsx'
import { useAccount } from '../context/AccountContext.jsx'

export default function AccountAddressesPage() {
  const { addresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useAccount()
  // null = closed, 'new' = add form, or an address object being edited
  const [panel, setPanel] = useState(null)

  function handleSave(fields) {
    if (panel === 'new') {
      addAddress(fields)
    } else if (panel) {
      updateAddress(panel.id, fields)
    }
    setPanel(null)
  }

  function handleDelete(id) {
    deleteAddress(id)
    if (panel && panel !== 'new' && panel.id === id) setPanel(null)
  }

  return (
    <AccountLayout activeId="addresses" title="Saved Addresses">
      <div className="flex max-w-2xl flex-col gap-4">
        {addresses.length === 0 && panel !== 'new' ? (
          <EmptyAddresses onAdd={() => setPanel('new')} />
        ) : (
          <>
            {panel !== 'new' && (
              <button
                type="button"
                onClick={() => setPanel('new')}
                className="flex w-fit items-center gap-1.5 rounded-full bg-pb-green px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pb-green-dark"
              >
                <Icon name="plus" size={16} />
                Add Address
              </button>
            )}

            {panel === 'new' && (
              <AddressFormPanel onSave={handleSave} onCancel={() => setPanel(null)} />
            )}

            {addresses.map((address) =>
              panel && panel !== 'new' && panel.id === address.id ? (
                <AddressFormPanel
                  key={address.id}
                  initialAddress={address}
                  onSave={handleSave}
                  onCancel={() => setPanel(null)}
                />
              ) : (
                <AddressCard
                  key={address.id}
                  address={address}
                  onEdit={setPanel}
                  onDelete={handleDelete}
                  onSetDefault={setDefaultAddress}
                />
              ),
            )}
          </>
        )}
      </div>
    </AccountLayout>
  )
}
