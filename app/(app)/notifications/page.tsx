import { redirect } from 'next/navigation'
import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'
import { EmptyState } from '@/components/ui/async-state'
import { NotificationActivityItem } from '@/components/dashboard/notification-activity-item'

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous) redirect('/auth/login')

  const notifications = await createApplicationServices(supabase).communications.listNotifications(user.id, 50)
  const unreadCount = notifications.filter(notification => !notification.readAt).length

  return <div className="space-y-6">
    <header className="brand-watermark rounded-2xl border border-white/[0.07] bg-[#0b0b0b] px-5 py-6 sm:px-7">
      <p className="clan-kicker">Centro de atividade</p>
      <div className="mt-2 flex items-center gap-3">
        <Bell className="size-6 text-primary" aria-hidden="true" />
        <h1 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">Notificações</h1>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{unreadCount ? `${unreadCount} por ler` : 'Estás atualizado.'} As notificações são privadas e pertencem à tua conta.</p>
    </header>

    <section aria-label="Lista de notificações" className="clan-panel-neutral rounded-2xl p-3 sm:p-5">
      {notifications.length === 0 ? <EmptyState title="Ainda não tens notificações" description="Resultados, transferências e outras atividades da tua conta aparecerão aqui." /> : (
        <ul className="divide-y divide-white/[0.06]">
          {notifications.map(notification => <li key={notification.id}>
            <NotificationActivityItem id={notification.id} href={notification.href} unread={!notification.readAt} className="flex items-start gap-3 rounded-xl px-3 py-4 transition-[background-color] hover:bg-white/[.025]">
              <span className={`mt-1 size-2 shrink-0 rounded-full ${notification.readAt ? 'bg-transparent' : 'bg-primary'}`} aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="flex flex-col justify-between gap-1 sm:flex-row sm:items-start sm:gap-4">
                  <span className="text-sm font-semibold text-foreground">{notification.title}</span>
                  <time className="shrink-0 text-[10px] text-muted-foreground" dateTime={notification.createdAt}>{new Date(notification.createdAt).toLocaleString('pt-PT')}</time>
                </span>
                <span className="mt-1 block whitespace-pre-wrap text-sm leading-5 text-muted-foreground">{notification.body}</span>
              </span>
            </NotificationActivityItem>
          </li>)}
        </ul>
      )}
    </section>
  </div>
}
