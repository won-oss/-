'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getDistance } from '@/lib/distance'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const SECTIONS = [
  { href: '/cloud', emoji: '☁️', name: '云打卡', desc: '写下你的铁路故事', color: 'from-sky-400 to-blue-500', shadow: 'shadow-blue-200' },
  { href: '/stamps', emoji: '🎫', name: '动态集章', desc: '点亮沿线站点印章', color: 'from-orange-400 to-red-400', shadow: 'shadow-orange-200' },
  { href: '/rank', emoji: '🏆', name: '排行榜', desc: '四大榜单争霸', color: 'from-amber-400 to-yellow-500', shadow: 'shadow-amber-200' },
  { href: '/team', emoji: '👥', name: '组队巡游', desc: '和好友一起打卡', color: 'from-indigo-400 to-violet-500', shadow: 'shadow-indigo-200' },
  { href: '/medal', emoji: '🎖️', name: '奖牌勋章', desc: '解锁铁路勋章', color: 'from-amber-400 to-orange-500', shadow: 'shadow-orange-200' },
  { href: '/shop', emoji: '🏺', name: '文创商店', desc: '积分兑换文创', color: 'from-purple-400 to-fuchsia-500', shadow: 'shadow-purple-200' },
  { href: '/run', emoji: '🏃', name: '跑步轨迹', desc: '地图点亮足迹', color: 'from-green-400 to-emerald-500', shadow: 'shadow-green-200' },
  { href: '/login', emoji: '🚂', name: '登录 / 注册', desc: '开启你的铁路之旅', color: 'from-blue-400 to-cyan-500', shadow: 'shadow-blue-200' },
]

export default function Home() {
  const [checkpoints, setCheckpoints] = useState<any[]>([])
  const [message, setMessage] = useState('')
  const [user, setUser] = useState<any>(null)
  const [points, setPoints] = useState(0)
  const [checkedCount, setCheckedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    init()
  }, [])

  async function init() {
    const { data: authData } = await supabase.auth.getUser()
    const currentUser = authData?.user || null
    setUser(currentUser)

    const { data: cps } = await supabase.from('checkpoints').select('*').order('seq', { ascending: true })
    if (cps) setCheckpoints(cps)

    if (currentUser) {
      const [pRes, ciRes] = await Promise.all([
        supabase.from('profiles').select('total_points').eq('id', currentUser.id).maybeSingle(),
        supabase.from('checkins').select('checkpoint_id').eq('user_id', currentUser.id),
      ])
      if (pRes.data) setPoints(pRes.data.total_points || 0)
      if (ciRes.data) setCheckedCount(new Set(ciRes.data.map((c: any) => c.checkpoint_id)).size)
    }
    setLoading(false)
  }

  async function handleCheckIn(cp: any) {
    if (!user) {
      alert('请先登录！')
      router.push('/login')
      return
    }

    setMessage('正在获取位置...')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        const distance = getDistance(latitude, longitude, cp.lat, cp.lon)

        if (distance > cp.radius_meters) {
          setMessage(`距离 ${cp.name} 还有 ${Math.round(distance)} 米，请在 ${cp.radius_meters} 米内打卡`)
          return
        }

        const { error } = await supabase.from('checkins').insert({
          checkpoint_id: cp.id,
          type: 'gps',
          user_id: user.id
        })

        if (error) setMessage('打卡失败：' + error.message)
        else {
          setMessage(`✅ ${cp.name} 打卡成功！+${cp.points}分`)
          setCheckedCount((c) => c + 1)
        }
      },
      () => setMessage('获取位置失败，请允许浏览器定位')
    )
  }

  return (
    <main className="px-6 pb-12 max-w-2xl mx-auto">
      {/* ===== Hero 区 ===== */}
      <div className="relative pt-12 pb-8 text-center overflow-hidden">
        <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[340px] h-[340px] bg-gradient-to-b from-amber-200/50 to-transparent rounded-full blur-2xl" />
        <div className="relative animate-floaty text-6xl" style={{ '--rot': '-4deg' } as any}>🚂</div>
        <h1 className="relative mt-3 text-4xl font-black text-shimmer tracking-wide">老成渝铁路打卡</h1>
        <p className="relative mt-2 text-gray-600">重走 1952 成渝线 · 打卡 · 集章 · 组队 · 拿勋章</p>

        {/* 登录状态 */}
        <div className="relative mt-5 inline-flex items-center gap-2 bg-white/80 backdrop-blur rounded-full px-4 py-1.5 text-sm shadow border border-amber-100">
          {loading ? (
            <span className="text-gray-400">加载中...</span>
          ) : user ? (
            <>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-soft" />
              <span className="font-medium text-gray-700">已登录</span>
              <span className="text-gray-400">·</span>
              <span className="font-black text-amber-600">{points} 分</span>
            </>
          ) : (
            <Link href="/login" className="text-blue-600 font-medium hover:underline">点击登录，开启铁路之旅 →</Link>
          )}
        </div>
      </div>

      {/* ===== 我的数据卡 ===== */}
      {user && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="card-lift bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-2xl p-4 shadow-lg shadow-orange-200">
            <div className="text-xs opacity-90">我的积分</div>
            <div className="text-3xl font-black mt-1">{points}<span className="text-base font-bold ml-1 opacity-90">分</span></div>
            <div className="text-xs opacity-90 mt-1">打卡、云打卡均可获得</div>
          </div>
          <div className="card-lift bg-gradient-to-br from-blue-400 to-indigo-500 text-white rounded-2xl p-4 shadow-lg shadow-blue-200">
            <div className="text-xs opacity-90">集章进度</div>
            <div className="text-3xl font-black mt-1">{checkedCount}<span className="text-base font-bold ml-1 opacity-90">/ {checkpoints.length} 站</span></div>
            <div className="text-xs opacity-90 mt-1">每站一个专属印章</div>
          </div>
        </div>
      )}

      {message && (
        <div className="animate-rise bg-yellow-100 border border-yellow-200 text-yellow-800 p-3 rounded-xl mb-5 text-sm">{message}</div>
      )}

      {/* ===== 沿线打卡 ===== */}
      <section className="mb-8">
        <h2 className="text-lg font-black text-gray-800 mb-3 flex items-center gap-2">
          <span className="text-xl">📍</span> 沿线打卡
          <span className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent" />
        </h2>
        <div className="space-y-2.5">
          {checkpoints.map((cp) => (
            <button
              key={cp.id}
              onClick={() => handleCheckIn(cp)}
              className="card-lift w-full flex items-center justify-between bg-white/90 backdrop-blur border border-gray-100 rounded-xl px-4 py-3.5 shadow-sm hover:border-amber-200 text-left"
            >
              <span className="flex items-center gap-3">
                <span className="text-xl">{cp.emoji || '🚉'}</span>
                <span className="font-bold text-gray-800">{cp.name}</span>
              </span>
              <span className="text-xs text-gray-400 bg-gray-50 rounded-full px-2.5 py-1">
                {cp.radius_meters}米内 · +{cp.points}分
              </span>
            </button>
          ))}
          {checkpoints.length === 0 && (
            <div className="text-center text-gray-400 p-4 bg-white/60 rounded-xl">站点数据加载中...</div>
          )}
        </div>
      </section>

      {/* ===== 功能入口网格 ===== */}
      <section>
        <h2 className="text-lg font-black text-gray-800 mb-3 flex items-center gap-2">
          <span className="text-xl">🧭</span> 全部板块
          <span className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent" />
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className={`card-lift group relative overflow-hidden rounded-2xl bg-gradient-to-br ${s.color} text-white p-4 shadow-lg ${s.shadow}`}
            >
              <span className="absolute -right-3 -top-3 text-6xl opacity-20 group-hover:opacity-30 group-hover:scale-110 transition-all">
                {s.emoji}
              </span>
              <span className="text-3xl block">{s.emoji}</span>
              <span className="font-black mt-2 block">{s.name}</span>
              <span className="text-xs opacity-90 block mt-0.5">{s.desc}</span>
              <span className="mt-2 inline-block text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                进入 →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== 底部 ===== */}
      <footer className="mt-10 text-center text-xs text-gray-400 space-y-1">
        <div className="text-base">🛤️ 老成渝铁路 · 1952—至今</div>
        <div>成都 — 重庆 · 505 公里 · 千年蜀道变通途</div>
      </footer>
    </main>
  )
}
