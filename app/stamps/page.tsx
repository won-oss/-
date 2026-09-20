'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// 印章颜色池：按站点顺序轮换彩色
const STAMP_COLORS = [
  { bg: 'bg-red-50', border: 'border-red-400', text: 'text-red-600', rotate: 'rotate-3' },
  { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-600', rotate: '-rotate-3' },
  { bg: 'bg-green-50', border: 'border-green-400', text: 'text-green-600', rotate: 'rotate-2' },
  { bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-600', rotate: '-rotate-2' },
  { bg: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-600', rotate: 'rotate-1' },
  { bg: 'bg-pink-50', border: 'border-pink-400', text: 'text-pink-600', rotate: '-rotate-1' },
]

export default function StampsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [checkpoints, setCheckpoints] = useState<any[]>([])
  const [checkinMap, setCheckinMap] = useState<Record<string, string>>({}) // checkpoint_id -> 打卡时间
  const [loading, setLoading] = useState(true)
  const [count, setCount] = useState(0)

  useEffect(() => {
    init()
  }, [])

  async function init() {
    const { data: authData } = await supabase.auth.getUser()
    const currentUser = authData?.user || null
    setUser(currentUser)

    // 查全部站点
    const { data: cps, error: cpError } = await supabase
      .from('checkpoints')
      .select('id, name, seq, points')
      .order('seq', { ascending: true })

    if (cpError) {
      setLoading(false)
      return
    }
    setCheckpoints(cps || [])

    // 查当前用户打卡记录
    if (currentUser) {
      const { data: checkins, error: ciError } = await supabase
        .from('checkins')
        .select('checkpoint_id, created_at')
        .eq('user_id', currentUser.id)

      if (!ciError && checkins) {
        const map: Record<string, string> = {}
        checkins.forEach((c) => {
          // 同一站点多次打卡只保留最早一次
          if (!map[c.checkpoint_id] || c.created_at < map[c.checkpoint_id]) {
            map[c.checkpoint_id] = c.created_at
          }
        })
        setCheckinMap(map)
        setCount(Object.keys(map).length)
      }
    }
    setLoading(false)
  }

  function formatTime(iso: string) {
    if (!iso) return ''
    const d = new Date(iso)
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  }

  return (
    <main className="p-6 max-w-md mx-auto">
      <h1 className="page-title mb-2">🎫 动态集章</h1>
      <p className="text-gray-600 mb-4">已打卡站点点亮彩色印章，未打卡显示灰色</p>

      {/* 进度条 */}
      <div className="bg-white rounded-xl border p-4 mb-6 shadow-sm">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>集章进度</span>
          <span className="font-bold text-blue-600">{count} / {checkpoints.length}</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${checkpoints.length ? Math.round((count / checkpoints.length) * 100) : 0}%` }}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-8">加载中...</div>
      ) : !user ? (
        <div className="text-center text-gray-500 py-8">
          <p className="mb-4">登录后即可查看你的集章墙</p>
          <button onClick={() => router.push('/login')} className="bg-blue-500 text-white px-6 py-2 rounded-lg">去登录</button>
        </div>
      ) : checkpoints.length === 0 ? (
        <div className="text-center text-gray-400 p-4 bg-gray-50 rounded">暂无站点数据</div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {checkpoints.map((cp, index) => {
            const time = checkinMap[cp.id]
            const checked = !!time
            const color = STAMP_COLORS[index % STAMP_COLORS.length]
            return (
              <div
                key={cp.id}
                className={`relative h-52 rounded-xl border-4 border-dashed p-3 flex flex-col items-center justify-center transition-all duration-300 ${
                  checked
                    ? `animate-pop ${color.bg} ${color.border} shadow-lg ${color.rotate}`
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className={`text-4xl mb-1 ${checked ? color.text : 'text-gray-300'}`}>
                  {checked ? '🟥' : '🏔️'}
                </div>
                <div className={`font-bold text-base ${checked ? 'text-gray-800' : 'text-gray-400'}`}>
                  {index + 1}. {cp.name}
                </div>
                <div className={`text-xs mt-1 ${checked ? 'text-gray-500' : 'text-gray-400'}`}>
                  {checked ? formatTime(time) : '未打卡'}
                </div>
                {checked ? (
                  <div className={`mt-2 px-2 py-0.5 border-2 ${color.border} ${color.text} rounded text-xs font-bold -rotate-6`}>
                    已集章
                  </div>
                ) : (
                  <div className="mt-2 px-2 py-0.5 border-2 border-gray-300 text-gray-400 rounded text-xs font-bold -rotate-6">
                    待打卡
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <a href="/" className="block text-center mt-8 text-blue-500">⬅ 返回首页</a>
    </main>
  )
}
