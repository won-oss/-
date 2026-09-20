'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const GOODS = [
  { id: 'ticket', emoji: '🎫', name: '老成渝纪念车票', desc: '复刻 1952 年成渝铁路通车纪念票', price: 20, bg: 'from-amber-100 to-orange-100' },
  { id: 'cup', emoji: '☕', name: '搪瓷杯', desc: '「成都—重庆」绿皮车搪瓷杯', price: 50, bg: 'from-green-100 to-teal-100' },
  { id: 'bag', emoji: '👜', name: '铁路帆布袋', desc: '老成渝线手绘站点帆布袋', price: 40, bg: 'from-blue-100 to-indigo-100' },
  { id: 'fridge', emoji: '🧲', name: '站点冰箱贴', desc: '沿线 6 大站点冰箱贴套装', price: 30, bg: 'from-red-100 to-pink-100' },
  { id: 'badge', emoji: '📛', name: '铁路徽章', desc: '成渝铁路通车纪念徽章', price: 25, bg: 'from-purple-100 to-violet-100' },
  { id: 'postcard', emoji: '💌', name: '风景明信片', desc: '老成渝铁路四季风景明信片', price: 15, bg: 'from-yellow-100 to-amber-100' },
]

export default function ShopPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [points, setPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState<string | null>(null)
  const [owned, setOwned] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState('')

  useEffect(() => {
    init()
  }, [])

  async function init() {
    const { data: authData } = await supabase.auth.getUser()
    const currentUser = authData?.user || null
    setUser(currentUser)

    if (currentUser) {
      const { data } = await supabase
        .from('profiles')
        .select('total_points')
        .eq('id', currentUser.id)
        .maybeSingle()
      if (data) setPoints(data.total_points || 0)

      // 本地已兑换记录
      try {
        const saved = localStorage.getItem(`shop_owned_${currentUser.id}`)
        if (saved) setOwned(JSON.parse(saved))
      } catch { /* ignore */ }
    }
    setLoading(false)
  }

  async function handleRedeem(g: (typeof GOODS)[number]) {
    if (!user) { alert('请先登录！'); router.push('/login'); return }
    if (owned[g.id]) { alert('该文创已兑换过了'); return }
    if (points < g.price) {
      alert(`积分不足！${g.name} 需要 ${g.price} 分，当前 ${points} 分，快去打卡赚积分吧`)
      return
    }

    setRedeeming(g.id)
    const newPoints = points - g.price
    const { error } = await supabase
      .from('profiles')
      .update({ total_points: newPoints })
      .eq('id', user.id)

    setRedeeming(null)
    if (error) {
      alert('兑换失败：' + error.message)
      return
    }

    setPoints(newPoints)
    const next = { ...owned, [g.id]: true }
    setOwned(next)
    try {
      localStorage.setItem(`shop_owned_${user.id}`, JSON.stringify(next))
    } catch { /* ignore */ }
    setToast(`🎉 兑换成功！「${g.name}」即将发货，已扣除 ${g.price} 积分`)
    setTimeout(() => setToast(''), 3500)
  }

  return (
    <main className="p-6 max-w-md mx-auto">
      <h1 className="page-title mb-2">🏺 文创商店</h1>
      <p className="text-gray-600 mb-5">用打卡积分兑换老成渝铁路文创</p>

      {/* 我的积分 */}
      <div className="card-lift bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-4 rounded-xl mb-5 flex justify-between items-center shadow-lg shadow-indigo-200">
        <span className="font-bold">我的积分</span>
        <span className="text-2xl font-black">{loading ? '...' : points} 分</span>
      </div>

      {toast && <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4 text-sm">{toast}</div>}

      {loading ? (
        <div className="text-center text-gray-400 py-8">加载中...</div>
      ) : !user ? (
        <div className="text-center text-gray-500 py-8">
          <p className="mb-4">登录后即可使用积分兑换文创</p>
          <button onClick={() => router.push('/login')} className="bg-blue-500 text-white px-6 py-2 rounded-lg">去登录</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {GOODS.map((g) => {
            const canBuy = points >= g.price
            const done = owned[g.id]
            return (
              <div key={g.id} className="card-lift group bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className={`h-28 bg-gradient-to-br ${g.bg} flex items-center justify-center text-5xl`}>
                  <span className="transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-6">{g.emoji}</span>
                </div>
                <div className="p-3 flex flex-col flex-1">
                  <div className="font-bold text-gray-800 text-sm">{g.name}</div>
                  <div className="text-xs text-gray-400 mt-1 leading-snug flex-1">{g.desc}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-black text-amber-600 text-sm">{g.price} 分</span>
                    <button
                      onClick={() => handleRedeem(g)}
                      disabled={!canBuy || done || redeeming === g.id}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        done
                          ? 'bg-green-100 text-green-600'
                          : canBuy
                            ? 'bg-amber-500 text-white hover:bg-amber-600'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {done ? '✓ 已兑换' : redeeming === g.id ? '兑换中...' : canBuy ? '兑换' : '积分不足'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <a href="/" className="block text-center mt-8 text-blue-500">⬅ 返回首页</a>
    </main>
  )
}
