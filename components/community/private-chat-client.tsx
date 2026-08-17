'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MessageCircle, Send, ArrowLeft, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PrivateChatClientProps {
  userId: string
  username: string
}

const dmConversations = [
  {
    id: 'thunder',
    user: 'ThunderFC',
    avatar: 'T',
    color: 'bg-red-500',
    lastMsg: 'Queres jogar?',
    online: true,
    unread: 2,
  },
  {
    id: 'eagle',
    user: 'EagleFC',
    avatar: 'E',
    color: 'bg-blue-500',
    lastMsg: 'GG no torneio!',
    online: false,
    unread: 0,
  },
]

const initialMessages = [
  { id: '1', from: 'them', text: 'Bom jogo hoje! Queres um replay amanhã?', time: '14:22', user: 'ThunderFC' },
  { id: '2', from: 'me', text: 'Com certeza! Amanhã às 21h? 🤝', time: '14:25', user: 'CarloFC', read: true },
  {
    id: '3',
    from: 'them',
    text: '⚔️ Convite de Jogo — ThunderFC desafia-te para um jogo amigável',
    time: '14:28',
    user: 'ThunderFC',
    isInvite: true,
  },
]

export function PrivateChatClient({ userId, username }: PrivateChatClientProps) {
  const [activeDM, setActiveDM] = useState('thunder')
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')

  const activeConv = dmConversations.find((c) => c.id === activeDM)

  const handleSend = () => {
    if (!input.trim()) return
    setMessages([
      ...messages,
      {
        id: Date.now().toString(),
        from: 'me',
        text: input,
        time: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
        user: username,
        read: false,
      },
    ])
    setInput('')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-accent" />
            Direct Messages
          </h1>
          <p className="text-muted-foreground">Private conversations with other managers</p>
        </div>
        <Link href="/community">
          <Button variant="outline" size="sm">← Community</Button>
        </Link>
      </div>

      <div className="flex h-[550px] rounded-xl border border-border bg-card overflow-hidden">
        {/* DM List */}
        <div className="w-52 border-r border-border bg-secondary/10 p-3">
          <p className="text-xs font-bold text-muted-foreground uppercase mb-3">Messages</p>
          <Input placeholder="🔍 Search..." className="mb-3 text-xs h-8" />
          <div className="space-y-1">
            {dmConversations.map((dm) => (
              <button
                key={dm.id}
                onClick={() => setActiveDM(dm.id)}
                className={`w-full flex items-center gap-2 rounded-lg p-2 transition-colors ${
                  activeDM === dm.id ? 'bg-primary/10' : 'hover:bg-secondary'
                }`}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${dm.color}`}>
                  {dm.avatar}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium text-foreground">{dm.user}</span>
                    {dm.online && <span className="h-1.5 w-1.5 rounded-full bg-green-500" />}
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">{dm.lastMsg}</p>
                </div>
                {dm.unread > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                    {dm.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeConv && (
            <>
              <div className="flex items-center gap-3 border-b border-border p-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${activeConv.color}`}>
                  {activeConv.avatar}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{activeConv.user}</p>
                  <p className="text-xs text-green-500">● Online</p>
                </div>
                <div className="ml-auto flex gap-1">
                  <Button variant="outline" size="sm">⚔️ Challenge</Button>
                  <Button variant="outline" size="sm">👤 Profile</Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 items-start ${msg.from === 'me' ? 'justify-end' : ''}`}
                  >
                    {msg.from !== 'me' && (
                      <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white ${activeConv.color}`}>
                        {activeConv.avatar}
                      </div>
                    )}
                    <div className={`max-w-[70%] ${msg.from === 'me' ? 'order-1' : ''}`}>
                      {msg.isInvite ? (
                        <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800 p-3">
                          <p className="text-xs font-bold text-green-700 dark:text-green-300 mb-1">⚔️ Game Invite</p>
                          <p className="text-xs text-foreground/80">{msg.text}</p>
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" className="h-7 text-xs">✓ Accept</Button>
                            <Button variant="outline" size="sm" className="h-7 text-xs">✕ Decline</Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`rounded-lg p-2.5 ${
                            msg.from === 'me'
                              ? 'bg-primary/10 border border-primary/20'
                              : 'bg-secondary/50'
                          }`}
                        >
                          {msg.from !== 'me' && (
                            <p className="text-xs font-medium text-foreground mb-0.5">{msg.user}</p>
                          )}
                          <p className="text-xs text-foreground/80">{msg.text}</p>
                          <div className={`flex items-center gap-1 mt-1 ${msg.from === 'me' ? 'justify-end' : ''}`}>
                            <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                            {msg.from === 'me' && (
                              <CheckCheck className={`h-3 w-3 ${msg.read ? 'text-blue-500' : 'text-muted-foreground'}`} />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border p-3 flex gap-2">
                <Button variant="outline" size="icon" className="shrink-0">
                  <span className="text-sm">⚔️</span>
                </Button>
                <Input
                  placeholder={`Message ${activeConv.user}...`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="flex-1"
                />
                <Button size="icon" onClick={handleSend}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
