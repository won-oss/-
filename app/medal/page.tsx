'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const MEDALS = [
  { key: 'bronze', icon: '🥉', name: '铜牌', title: '初登列车', desc: '累计打卡 3 站', require: 3 },
  { key: 'silver', icon: '🥈', name: '银牌', title: '铁轨行者', desc: '累计打卡 5 站', require: 5 },
  { key: 'gold', icon: '🥇', name: '金牌', title: '全线征服', desc: '全线站点全部打卡', require: Infinity },
]

export default function MedalPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [checkedCount, setCheckedCount] = useState(0)
  const [totalStations, setTotalStations] = useState(0)
  const [loading, setLoading] = useState(true)
  const [redeemed, setRedeemed] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState('')

  useEffect(() => {
    init()
  }, [])

  async function init() {
    const { data: authData } = await supabase.auth.getUser()
    const currentUser = authData?.user || null
    setUser(currentUser)

    // 总站数
    const { count: stationCount } = await supabase
      .from('checkpoints')
      .select('id', { count: 'exact', head: true })
    setTotalStations(stationCount || 0)

    if (currentUser) {
      // 已打卡站点数（去重）
      const { data: checkins } = await supabase
        .from('checkins')
        .select('checkpoint_id')
        .eq('user_id', currentUser.id)
      if (checkins) {
        setCheckedCount(new Set(checkins.map((c) => c.checkpoint_id)).size)
      }

      // 本地已兑换记录（localStorage，避免依赖额外表结构）
      try {
        const key = `medal_redeemed_${currentUser.id}`
        const saved = localStorage.getItem(key)
        if (saved) setRedeemed(JSON.parse(saved))
      } catch { /* ignore */ }
    }
    setLoading(false)
  }

  const goldRequire = totalStations // 全线金牌 = 全部站点

  function isUnlocked(medal: (typeof MEDALS)[number]) {
    const need = medal.key === 'gold' ? goldRequire : medal.require
    return checkedCount >= need
  }

  function remaining(medal: (typeof MEDALS)[number]) {
    const need = medal.key === 'gold' ? goldRequire : medal.require
    return Math.max(0, need - checkedCount)
  }

  function handleRedeem(medal: (typeof MEDALS)[number]) {
    if (!user) { alert('请先登录！'); router.push('/login'); return }
    if (!isUnlocked(medal)) { alert(`还差 ${remaining(medal)} 站才能解锁${medal.name}，继续打卡吧！`); return }
    if (redeemed[medal.key]) { alert('该奖牌已兑换过了'); return }

    const next = { ...redeemed, [medal.key]: true }
    setRedeemed(next)
    try {
      localStorage.setItem(`medal_redeemed_${user.id}`, JSON.stringify(next))
    } catch { /* ignore */ }
    setToast(`🎉 恭喜兑换「${medal.title}」${medal.name}！已收录到你的勋章墙`)
    setTimeout(() => setToast(''), 3000)
  }

  return (
    <main className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-2">🎖️ 奖牌勋章</h1>
      <p className="text-gray-600 mb-5">集齐站点，解锁属于你的铁路勋章！</p>

      {/* 进度卡片 */}
      <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white p-5 rounded-2xl mb-6 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm opacity-90">当前集章进度</div>
            <div className="text-3xl font-black mt-1">{checkedCount} <span className="text-lg font-bold opacity-80">/ {totalStations} 站</span></div>
          </div>
          <div className="text-5xl">{checkedCount >= goldRequire && goldRequire > 0 ? '🏆' : '🚂'}</div>
        </div>
      </div>

      {toast && <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4 text-sm">{toast}</div>}

      {loading ? (
        <div className="text-center text-gray-400 py-8">加载中...</div>
      ) : !user ? (
        <div className="text-center text-gray-500 py-8">
          <p className="mb-4">登录后查看你的勋章墙</p>
          <button onClick={() => router.push('/login')} className="bg-blue-500 text-white px-6 py-2 rounded-lg">去登录</button>
        </div>
      ) : (
        <div className="space-y-4">
          {MEDALS.map((medal) => {
            const unlocked = isUnlocked(medal)
            const done = redeemed[medal.key]
            return (
              <div key={medal.key}
                className={`rounded-2xl border p-5 flex items-center gap-4 transition-all ${
                  unlocked ? 'bg-white border-amber-300 shadow-md' : 'bg-gray-50 border-gray-200 opacity-80'
                }`}
              >
                <div className={`text-5xl ${unlocked ? '' : 'grayscale opacity-60'}`}>{medal.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">{medal.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      medal.key === 'bronze' ? 'bg-orange-100 text-orange-600'
                      : medal.key === 'silver' ? 'bg-gray-200 text-gray-600'
                      : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      {medal.name}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {medal.key === 'gold'
                      ? `打卡全部 ${totalStations} 个站点`
                      : medal.desc}
                  </div>
                  {!unlocked && (
                    <div className="text-xs text-gray-400 mt-1">还差 {remaining(medal)} 站解锁</div>
                  )}
                </div>
                <button
                  onClick={() => handleRedeem(medal)}
                  disabled={!unlocked || done}
                  className={`px-4 py-2 rounded-lg text-sm font-bold shrink-0 transition-colors ${
                    done
                      ? 'bg-green-100 text-green-600'
                      : unlocked
                        ? 'bg-amber-500 text-white hover:bg-amber-600'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {done ? '✓ 已兑换' : unlocked ? '兑换' : '未解锁'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      <a href="/" className="block text-center mt-8 text-blue-500">⬅ 返回首页</a>
    </main>
  )
}
