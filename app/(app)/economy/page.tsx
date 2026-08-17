import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Coins } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { WalletOverview } from '@/components/economy/wallet-overview'
import { CoinPackages } from '@/components/economy/coin-packages'
import { TransactionHistory } from '@/components/economy/transaction-history'

export default async function EconomyPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  const [walletResult, packagesResult, transactionsResult] = await Promise.all([
    supabase.from('wallet').select('*').eq('user_id', user.id).single(),
    supabase.from('coin_package').select('*').eq('active', true).order('price_cents', { ascending: true }),
    supabase.from('coin_transaction').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
  ])

  const wallet = walletResult.data
  const packages = packagesResult.data || []
  const transactions = transactionsResult.data || []

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Coins className="h-6 w-6" />}
        title="Economy"
        description="Manage your GameCoins and purchase more"
        breadcrumbs={[{ label: 'Economy' }]}
      />

      <WalletOverview 
        balance={wallet?.balance || 0}
        infrastructureCredit={wallet?.infrastructure_credit || 0}
      />

      <CoinPackages packages={packages} userId={user.id} />

      <TransactionHistory transactions={transactions} />
    </div>
  )
}
