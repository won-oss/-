'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type TabKey = 'personal' | 'team' | 'city' | 'train'

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'personal', label: '个人榜', icon: '👤' },
  { key: 'team', label: '战队榜', icon: '🚩' },
  { key: 'city', label: '城市榜', icon: '🏙️' },
  { key: 'train', label: '列车进度榜', icon: '🚂' },
]

export default function RankPage() {
  const [tab, setTab] = useState<TabKey>('personal')
  const [loading, setLoading] = useState(true)
  const [personal, setPersonal] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])
  const [trainProgress, setTrainProgress] = useState<any[]>([])
  const [totalStations, setTotalStations] = useState(0)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    const tasks = [
      loadPersonal(),
      loadTeams(),
      loadCities(),
      loadTrainProgress(),
      loadStationCount(),
    ]
    await Promise.all(tasks)
    setLoading(false)
  }

  async function loadPersonal() {
    const { data } = await supabase
      .from('profiles')
      .select('username, total_points')
      .order('total_points', { ascending: false })
      .limit(20)
    if (data) setPersonal(data)
  }

  async function loadTeams() {
    const { data } = await supabase
      .from('teams')
      .select('name, total_points, member_count')
      .order('total_points', { ascending: false })
      .limit(20)
    if (data) setTeams(data)
  }

  async function loadCities() {
    // 拉取用户城市与积分，在客户端按城市聚合（浏览器端 SDK 不支持 group by）
    const { data } = await supabase
      .from('profiles')
      .select('city, total_points')
      .limit(500)
    if (!data) return

    const agg: Record<string, { total: number; people: number }> = {}
    data.forEach((p) => {
      const city = (p.city || '未知城市').trim() || '未知城市'
      if (!agg[city]) agg[city] = { total: 0, people: 0 }
      agg[city].total += p.total_points || 0
      agg[city].people += 1
    })

    const list = Object.entries(agg)
      .map(([name, v]) => ({ name, total: v.total, people: v.people }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 20)
    setCities(list)
  }

  async function loadTrainProgress() {
    // 按 user_id 统计打卡站数，再匹配用户名
    const [ciRes, pRes] = await Promise.all([
      supabase.from('checkins').select('user_id'),
      supabase.from('profiles').select('id, username'),
    ])

    const nameMap: Record<string, string> = {}
    pRes.data?.forEach((p) => { nameMap[p.id] = p.username })

    const countMap: Record<string, number> = {}
    ciRes.data?.forEach((c) => {
      countMap[c.user_id] = (countMap[c.user_id] || 0) + 1
    })

    // 同站多次打卡去重（checkins 表结构差异场景下退化为按记录数计）
    const list = Object.entries(countMap)
      .map(([userId, count]) => ({
        username: nameMap[userId] || '匿名旅客',
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)
    setTrainProgress(list)
  }

  async function loadStationCount() {
    const { count } = await supabase
      .from('checkpoints')
      .select('id', { count: 'exact', head: true })
    setTotalStations(count || 0)
  }

  function renderList() {
    if (loading) return <div className="text-center text-gray-400 py-8">加载中...</div>

    switch (tab) {
      case 'personal':
        return personal.length === 0 ? (
          <Empty tip="暂无数据，快去打卡抢占第一名！" />
        ) : (
          <div className="space-y-2">
            {personal.map((u, i) => (
              <Row key={i} index={i} left={<span className="font-medium text-gray-800">{u.username || '匿名旅客'}</span>}
                right={<span className="font-bold text-blue-600">{u.total_points} 分</span>} />
            ))}
          </div>
        )

      case 'team':
        return teams.length === 0 ? (
          <Empty tip="暂无战队，去创建一支吧！" />
        ) : (
          <div className="space-y-2">
            {teams.map((t, i) => (
              <Row key={i} index={i}
                left={<span className="font-medium text-gray-800">🚩 {t.name}</span>}
                right={<span className="font-bold text-indigo-600">{t.total_points} 分 · {t.member_count ?? '-'}人</span>} />
            ))}
          </div>
        )

      case 'city':
        return cities.length === 0 ? (
          <Empty tip="暂无城市数据" />
        ) : (
          <div className="space-y-2">
            {cities.map((c, i) => (
              <Row key={i} index={i}
                left={<span className="font-medium text-gray-800">🏙️ {c.name}</span>}
                right={<span className="font-bold text-green-600">{c.total} 分 · {c.people}人</span>} />
            ))}
          </div>
        )

      case 'train':
        return trainProgress.length === 0 ? (
          <Empty tip="暂无打卡记录" />
        ) : (
          <div className="space-y-2">
            {trainProgress.map((p, i) => {
              const pct = totalStations ? Math.round((p.count / totalStations) * 100) : 0
              return (
                <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="font-bold w-6 text-center text-gray-300">{i + 1}</span>
                    <span className="font-medium text-gray-800 truncate">{p.username}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex-1 max-w-[140px]">
                      <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                        style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-16 text-right">{p.count}/{totalStations} 站</span>
                  </div>
                </div>
              )
            })}
          </div>
        )
    }
  }

  return (
    <main className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-2">🏆 铁路英雄榜</h1>
      <p className="text-gray-600 mb-5">四大榜单，看看谁是最强铁路达人！</p>

      {/* Tab 切换 */}
      <div className="grid grid-cols-4 gap-1 bg-gray-100 p-1 rounded-xl mb-5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`py-2 rounded-lg text-sm font-bold transition-colors ${
              tab === t.key ? 'bg-white text-blue-600 shadow' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="mr-0.5">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {renderList()}

      <a href="/" className="block text-center mt-8 text-blue-500">⬅ 返回首页</a>
    </main>
  )
}

function Row({ index, left, right }: { index: number; left: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
      <div className="flex items-center gap-3">
        <span className={`font-bold text-xl w-6 text-center ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-orange-400' : 'text-gray-300'}`}>
          {index === 0 || index === 1 || index === 2 ? index + 1 : <span className="text-sm">{index + 1}</span>}
        </span>
        {left}
      </div>
      {right}
    </div>
  )
}

function Empty({ tip }: { tip: string }) {
  return <div className="text-center text-gray-400 p-6 bg-gray-50 rounded">{tip}</div>
}
