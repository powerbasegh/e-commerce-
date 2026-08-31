import AccountLayout from '../components/account/AccountLayout.jsx'
import ProfileForm from '../components/account/ProfileForm.jsx'

export default function AccountProfilePage() {
  return (
    <AccountLayout activeId="profile" title="Profile">
      <div className="max-w-xl">
        <ProfileForm />
      </div>
    </AccountLayout>
  )
}
