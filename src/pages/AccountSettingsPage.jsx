import AccountLayout from '../components/account/AccountLayout.jsx'
import SettingsToggle from '../components/account/SettingsToggle.jsx'
import Icon from '../components/Icon.jsx'
import { useAccount } from '../context/AccountContext.jsx'

export default function AccountSettingsPage() {
  const { settings, updateSettings } = useAccount()

  return (
    <AccountLayout activeId="settings" title="Settings">
      <div className="flex max-w-xl flex-col gap-4">
        <section className="rounded-card border border-pb-gray-border bg-white p-4 shadow-card sm:p-5">
          <h2 className="text-sm font-bold text-pb-gray-text sm:text-base">
            Notification Preferences
          </h2>
          <p className="mt-1 text-xs text-pb-gray-muted">
            These control what PowerBase shows in your Notifications tab. Real email/SMS/WhatsApp
            delivery isn't connected yet.
          </p>
          <div className="mt-2 divide-y divide-pb-gray-border">
            <SettingsToggle
              label="Email Notifications"
              description="Receive updates by email once email delivery is available"
              checked={settings.emailNotifications}
              onChange={(value) => updateSettings({ emailNotifications: value })}
            />
            <SettingsToggle
              label="Order Updates"
              description="Delivery fee, order status, and delivery updates"
              checked={settings.orderUpdates}
              onChange={(value) => updateSettings({ orderUpdates: value })}
            />
            <SettingsToggle
              label="Marketing & Promotional Messages"
              description="Deals, promo codes, and PowerBase announcements"
              checked={settings.marketingMessages}
              onChange={(value) => updateSettings({ marketingMessages: value })}
            />
          </div>
        </section>

        <section className="flex gap-3 rounded-card border border-pb-gray-border bg-white p-4 shadow-card sm:p-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pb-gray-bg text-pb-gray-muted">
            <Icon name="secure" size={17} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-pb-gray-text sm:text-base">Account Security</h2>
            <p className="mt-1 text-xs text-pb-gray-muted">
              Password and login security will be available once PowerBase supports secure
              sign-in. For now, your account data is stored only on this device.
            </p>
          </div>
        </section>
      </div>
    </AccountLayout>
  )
}
