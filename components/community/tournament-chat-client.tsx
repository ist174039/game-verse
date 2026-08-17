'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MessageCircle, Send, Swords } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface TournamentChatClientProps {
  tournamentId: string
  tournamentName: string
  userId: string
  username: string
}

const initialMessages = [
  { id: '1', user: 'CarloFC', text: 'Boa sorte a todos! Que ganhe o melhor 🤝', time: '20:05', color: 'bg-amber-500' },
  { id: '2', user: 'ThunderFC', text: 'Vai ser épico! 🔥 Vemo-nos na final', time: '20:07', color: 'bg-red-500' },
]

export function TournamentChatClient({ tournamentId, tournamentName, userId, username }: TournamentChatClientProps) {
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
            <Swords className="h-6 w-6 text-chart-4" />
            {tournamentName} Chat
          </h1>
          <p className="text-muted-foreground">Private chat for tournament participants</p>
        </div>
        <Link href={`/tournaments/${tournamentId}`}>
          <Button variant="outline" size="sm">← Back to Tournament</Button>
        </Link>
      </div>

      <div className="flex h-[500px] rounded-xl border border-border bg-card overflow-hidden">
        {/* Channel Sidebar */}
        <div className="w-40 border-r border-border bg-secondary/20 p-3 flex flex-col">
          <p className="text-xs font-bold text-muted-foreground uppercase mb-3">Channels</p>
          <div className="space-y-1">
            {['# geral-torneio', '# quartos-final', '# meias-final', '# final', '# resultados'].map((ch) => (
              <div
                key={ch}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs transition-colors ${
                  ch === '# geral-torneio' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground'
                }`}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                {ch}
              </div>
            ))}
          </div>
          <div className="mt-auto pt-3 border-t border-border">
            <div className="rounded-lg bg-primary/5 p-2 text-xs">
              <p className="font-medium text-foreground">⚡ Your next match:</p>
              <p className="text-muted-foreground mt-0.5">CarloFC vs StormFC</p>
              <p className="text-muted-foreground">Today, 22:00</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="text-center py-2 px-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-xs text-amber-700 dark:text-amber-300">
              🏆 <strong>Quartos de Final iniciados!</strong> Verifica o teu jogo no bracket.
            </div>
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
              placeholder={`Message in #geral-torneio...`}
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
      </div>
    </div>
  )
}
