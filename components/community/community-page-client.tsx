'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MessageCircle, Globe, TrendingUp, Award, Megaphone, Heart, MessageSquare, Share2, Trophy, Users, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface CommunityPageClientProps {
  username: string
}

const initialPosts = [
  {
    id: '1',
    author: 'CarloFC',
    avatar: 'C',
    avatarColor: 'bg-amber-500',
    content: 'Grande vitória hoje na Copa! 3-1 contra os Dark Knights. A equipa está cada vez mais afinada! 🚀⚽',
    likes: 24,
    comments: 8,
    time: 'há 15 min',
    tags: ['#GameVerse', '#Vitória'],
  },
  {
    id: '2',
    author: 'ThunderFC',
    avatar: 'T',
    avatarColor: 'bg-red-500',
    content: 'Alguém interessado num amigável esta noite? Preciso testar uma nova formação 4-3-3 💪',
    likes: 12,
    comments: 5,
    time: 'há 42 min',
    tags: ['#Amigável', '#4-3-3'],
  },
  {
    id: '3',
    author: 'Admin GameVerse',
    avatar: 'GV',
    avatarColor: 'bg-primary',
    content: '🎉 Novo torneio semanal com 1,600 GC em prémios! Inscrições abertas até Quinta-feira. Não percam!',
    likes: 45,
    comments: 15,
    time: 'há 2h',
    tags: ['#Anúncio', '#Torneio'],
    pinned: true,
  },
]

const leaderboardUsers = [
  { name: 'Mystic FC', points: 2840, avatar: 'M', color: 'bg-gray-500' },
  { name: 'ThunderFC', points: 2710, avatar: 'T', color: 'bg-red-500' },
  { name: 'CarloFC', points: 2650, avatar: 'C', color: 'bg-amber-500' },
]

export function CommunityPageClient({ username }: CommunityPageClientProps) {
  const [activeTab, setActiveTab] = useState('trending')
  const [posts, setPosts] = useState(initialPosts)
  const [newPost, setNewPost] = useState('')

  const tabs = [
    { id: 'trending', label: 'Em Alta', icon: <Flame className="h-4 w-4" /> },
    { id: 'recent', label: 'Recentes', icon: <MessageCircle className="h-4 w-4" /> },
    { id: 'achievements', label: 'Conquistas', icon: <Award className="h-4 w-4" /> },
    { id: 'announcements', label: 'Anúncios', icon: <Megaphone className="h-4 w-4" /> },
  ]

  const handlePostSubmit = () => {
    if (!newPost.trim()) return
    setPosts([
      {
        id: Date.now().toString(),
        author: username,
        avatar: username.charAt(0).toUpperCase(),
        avatarColor: 'bg-amber-500',
        content: newPost,
        likes: 0,
        comments: 0,
        time: 'agora',
        tags: [],
      },
      ...posts,
    ])
    setNewPost('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Globe className="h-6 w-6 text-chart-3" />
            Community
          </h1>
          <p className="text-muted-foreground">Connect, share and earn with fellow managers</p>
        </div>
        <div className="flex gap-2">
          <Link href="/community/chat">
            <Button variant="outline" size="sm">
              <MessageCircle className="mr-2 h-4 w-4" />
              Global Chat
            </Button>
          </Link>
          <Link href="/community/dm">
            <Button variant="outline" size="sm">
              <MessageSquare className="mr-2 h-4 w-4" />
              Messages
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          {/* Create Post */}
          <Card className="p-4">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-medium text-primary">
                {username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 space-y-3">
                <textarea
                  className="w-full resize-none rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-primary"
                  placeholder="Share something with the community..."
                  rows={2}
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                />
                <div className="flex justify-between items-center">
                  <div className="flex gap-2 text-muted-foreground">
                    <span className="text-xs">🏷️ Tag</span>
                  </div>
                  <Button size="sm" onClick={handlePostSubmit}>
                    <Megaphone className="mr-1 h-3 w-3" />
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <div className="flex gap-1 rounded-lg bg-secondary/30 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Posts Feed */}
          <div className="space-y-3">
            {posts
              .filter((p) => {
                if (activeTab === 'announcements') return p.tags.includes('#Anúncio')
                if (activeTab === 'achievements') return p.tags.includes('#GameVerse')
                return true
              })
              .map((post) => (
                <Card key={post.id} className={`p-4 ${post.pinned ? 'border-primary/30 bg-primary/5' : ''}`}>
                  {post.pinned && (
                    <div className="mb-2 flex items-center gap-1 text-xs font-medium text-primary">
                      <Megaphone className="h-3 w-3" />
                      Pinned
                    </div>
                  )}
                  <div className="flex gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white ${post.avatarColor}`}>
                      {post.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{post.author}</span>
                        <span className="text-xs text-muted-foreground">{post.time}</span>
                      </div>
                      <p className="mt-1 text-sm text-foreground/90">{post.content}</p>
                      {post.tags.length > 0 && (
                        <div className="mt-2 flex gap-1">
                          {post.tags.map((tag) => (
                            <span key={tag} className="rounded bg-secondary/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                        <button className="flex items-center gap-1 hover:text-primary transition-colors">
                          <Heart className="h-3.5 w-3.5" />
                          {post.likes}
                        </button>
                        <button className="flex items-center gap-1 hover:text-primary transition-colors">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {post.comments}
                        </button>
                        <button className="flex items-center gap-1 hover:text-primary transition-colors">
                          <Share2 className="h-3.5 w-3.5" />
                          Share
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4">
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-chart-4" />
              Weekly Leaderboard
            </h3>
            <div className="space-y-3">
              {leaderboardUsers.map((user, i) => (
                <div key={user.name} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}º</span>
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white ${user.color}`}>
                    {user.avatar}
                  </div>
                  <span className="flex-1 text-sm font-medium text-foreground">{user.name}</span>
                  <span className="text-xs font-semibold text-chart-4">{user.points} pts</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-chart-2" />
              Online Now
            </h3>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 rounded-full bg-secondary/50 px-2.5 py-1 text-xs">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                CarloFC
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-secondary/50 px-2.5 py-1 text-xs">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                ThunderFC
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-secondary/50 px-2.5 py-1 text-xs">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Mystic FC
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              Chat Rooms
            </h3>
            <div className="space-y-2">
              <Link href="/community/chat">
                <div className="flex items-center gap-3 rounded-lg bg-secondary/30 p-3 cursor-pointer hover:bg-secondary/50 transition-colors">
                  <Globe className="h-4 w-4 text-chart-3" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Global Chat</p>
                    <p className="text-xs text-muted-foreground">General discussion</p>
                  </div>
                </div>
              </Link>
              <Link href="/community/dm">
                <div className="flex items-center gap-3 rounded-lg bg-secondary/30 p-3 cursor-pointer hover:bg-secondary/50 transition-colors">
                  <MessageSquare className="h-4 w-4 text-accent" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Direct Messages</p>
                    <p className="text-xs text-muted-foreground">Private conversations</p>
                  </div>
                </div>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
