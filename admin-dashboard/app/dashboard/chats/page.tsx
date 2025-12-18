'use client'

import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { db } from '@/lib/firebase'

type ChatThreadDoc = {
  customerId?: string
  customerName?: string
  adminId?: string
  lastMessage?: string
  lastMessageAt?: any
  adminUnreadCount?: number
  customerUnreadCount?: number
}

export default function ChatsPage() {
  const router = useRouter()
  const [threads, setThreads] = useState<{ id: string } & ChatThreadDoc[]>([] as any)

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
    const q = query(collection(db, 'chats'), orderBy('lastMessageAt', 'desc'))

    const unsub = onSnapshot(q, (snap) => {
      const next: any[] = []
      snap.forEach((doc) => {
        const data = doc.data() as ChatThreadDoc
        if (adminId && data.adminId !== adminId) return
        next.push({ id: doc.id, ...data })
      })
      setThreads(next)
    })

    return () => unsub()
  }, [adminId])

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Chats</h1>
        <p className="text-gray-600 mt-2">Customer conversations (realtime)</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {threads.length === 0 ? (
          <div className="p-6 text-gray-600">No conversations yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {threads.map((t: any) => (
              <button
                key={t.id}
                className="w-full text-left p-5 hover:bg-gray-50 transition flex items-center justify-between"
                onClick={() => router.push(`/dashboard/chats/${t.id}`)}
              >
                <div>
                  <div className="text-sm text-gray-500">Customer: {t.customerName || t.customerId || '-'}</div>
                  <div className="text-gray-900 font-medium mt-1 line-clamp-1">{t.lastMessage || '—'}</div>
                </div>
                <div className="flex items-center gap-3">
                  {typeof t.adminUnreadCount === 'number' && t.adminUnreadCount > 0 && (
                    <span className="px-2 py-1 rounded-full bg-red-600 text-white text-xs">
                      {t.adminUnreadCount}
                    </span>
                  )}
                  <span className="text-gray-400">›</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
