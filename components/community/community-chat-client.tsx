'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MessageCircle, Send, Users, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface CommunityChatClientProps {
  userId: string
  username: string
}

const channels = [
  { id: 'geral', name: 'geral', label: 'General', active: true },
  { id: 'torneios', name: 'torneios', label: 'Tournaments', active: false },
  { id: 'mercado', name: 'mercado', label: 'Market', active: false },
  { id: 'estrategia', name: 'estratégia', label: 'Strategy', active: false },
  { id: 'memes', name: 'memes', label: 'Memes', active: false },
]

const initialMessages = [
  { id: '1', user: 'CarloFC', text: 'Alguém para um jogo agora? 🔥', time: '14:23', color: 'bg-amber-500' },
  { id: '2', user: 'ThunderFC', text: 'Boa sorte a todos! Que ganhe o melhor 🤝', time: '14:25', color: 'bg-red-500' },
  { id: '3', user: 'Admin', text: 'Lembramos que o prazo de inscrição para a Copa termina amanhã!', time: '14:30', color: 'bg-primary' },
]

const onlineUsers = [
  { name: 'CarloFC', color: 'bg-amber-500' },
  { name: 'ThunderFC', color: 'bg-red-500' },
  { name: 'Mystic FC', color: 'bg-gray-500' },
  { name: 'EagleFC', color: 'bg-blue-500' },
]

export function CommunityChatClient({ userId, username }: CommunityChatClientProps) {
  const [activeChannel, setActiveChannel] = useState('geral')
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (!input.trim()) return
    setMessages([
      ...messages,
      {
        id: Date.now().toString(),
        user: username,
        text: input,
        time: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
        color: 'bg-amber-500',
      },
    ])
    setInput('')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-primary" />
            Community Chat
          </h1>
          <p className="text-muted-foreground">Chat with all GameVerse managers</p>
        </div>
        <Link href="/community">
          <Button variant="outline" size="sm">← Community</Button>
        </Link>
      </div>

      <div className="flex h-[600px] rounded-xl border border-border bg-card overflow-hidden">
        {/* Channels Sidebar */}
        <div className="w-48 border-r border-border bg-secondary/20 p-3 flex flex-col">
          <p className="text-xs font-bold text-muted-foreground uppercase mb-3">Channels</p>
          <div className="flex-1 space-y-1">
            {channels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setActiveChannel(ch.id)}
                className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs transition-colors ${
                  activeChannel === ch.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <Hash className="h-3.5 w-3.5" />
                {ch.label}
              </button>
            ))}
          </div>
          <Link href="/community/dm">
            <Button variant="outline" size="sm" className="w-full mt-3">
              <MessageCircle className="mr-1 h-3 w-3" />
              DMs
            </Button>
          </Link>
        </div>

        {/* Messages */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className="flex gap-3 items-start">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${msg.color}`}>
                  {msg.user.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{msg.user}</span>
                    <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                  </div>
                  <p className="text-sm text-foreground/80 mt-0.5">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-border p-3 flex gap-2">
            <Input
              placeholder="Message in #geral..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1"
            />
            <Button size="icon" onClick={handleSend}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Online Users */}
        <div className="w-40 border-l border-border p-3 hidden md:block">
          <p className="text-xs font-bold text-muted-foreground uppercase mb-3 flex items-center gap-1">
            <Users className="h-3 w-3" />
            Online
          </p>
          <div className="space-y-2">
            {onlineUsers.map((u) => (
              <div key={u.name} className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${u.color}`} />
                <span className="text-xs text-foreground">{u.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
