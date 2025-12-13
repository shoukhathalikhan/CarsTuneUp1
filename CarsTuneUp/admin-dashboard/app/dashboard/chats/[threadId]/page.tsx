'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import DashboardLayout from '@/components/DashboardLayout'
import api from '@/lib/api'
import { db } from '@/lib/firebase'

type MessageDoc = {
  senderRole?: 'customer' | 'admin'
  message?: string
  createdAt?: any
}

export default function ChatThreadPage() {
  const params = useParams()
  const threadId = params?.threadId as string

  const [messages, setMessages] = useState<{ id: string } & MessageDoc[]>([] as any)
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const adminId = useMemo(() => {
    try {
      const raw = localStorage.getItem('adminUser')
      const parsed = raw ? JSON.parse(raw) : null
      return parsed?._id || null
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    if (!threadId) return

    const q = query(collection(db, 'chats', threadId, 'messages'), orderBy('createdAt', 'asc'))

    const unsub = onSnapshot(q, (snap) => {
      const next: any[] = []
      snap.forEach((doc) => next.push({ id: doc.id, ...(doc.data() as MessageDoc) }))
      setMessages(next)
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }))
    })

    return () => unsub()
  }, [threadId])

  const send = async () => {
    const trimmed = text.trim()
    if (!trimmed) return

    setText('')

    try {
      await api.post(`/chats/admin/${threadId}/reply`, { message: trimmed })
      await api.put(`/chats/${threadId}/seen`)
    } catch (e: any) {
      console.error('Admin reply error:', e?.response?.data || e?.message || e)
      setText(trimmed)
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Conversation</h1>
        <p className="text-gray-600 mt-2">Thread: {threadId}</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col" style={{ height: '70vh' }}>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {messages.map((m: any) => {
            const mine = m.senderRole === 'admin'
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    mine ? 'bg-primary text-white' : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {m.message}
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-gray-200 p-4 flex gap-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a reply..."
            className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none"
          />
          <button
            onClick={send}
            className="px-5 py-3 rounded-xl bg-primary text-white font-medium"
          >
            Send
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
