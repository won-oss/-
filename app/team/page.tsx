'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function TeamPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [teamName, setTeamName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [myTeam, setMyTeam] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUser(data.user)
        loadMyTeam(data.user.id)
      } else {
        setLoading(false)
      }
    })
  }, [])

  const loadMyTeam = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('team_members')
      .select('team_id, teams(id, name, code, total_points)')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      setMessage('加载战队失败：' + error.message)
      setLoading(false)
      return
    }
    // 嵌套关联在无 schema 时会被推断为数组，这里显式断言为单对象
    const team = (data as any)?.teams
    if (team) {
      setMyTeam(team)
      loadMembers(team.id)
    }
    setLoading(false)
  }, [])

  const loadMembers = useCallback(async (teamId: string) => {
    const { data, error } = await supabase
      .from('team_members')
      .select('id, joined_at, profiles(id, username, total_points, city)')
      .eq('team_id', teamId)

    if (!error && data) setMembers(data)
  }, [])

  async function handleCreateTeam() {
    if (!user) { alert('请先登录！'); router.push('/login'); return }
    if (!teamName.trim()) { alert('请输入战队名称'); return }

    setCreating(true)
    setMessage('')
    // 生成 6 位加入码
    const code = Math.random().toString(36).slice(2, 8).toUpperCase()

    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({ name: teamName.trim(), code, creator_id: user.id })
      .select('id, name, code, total_points')
      .single()

    if (teamError) {
      setMessage('创建战队失败：' + teamError.message)
      setCreating(false)
      return
    }

    const { error: memberError } = await supabase
      .from('team_members')
      .insert({ team_id: team.id, user_id: user.id })

    if (memberError) {
      setMessage('加入战队失败：' + memberError.message)
      setCreating(false)
      return
    }

    setTeamName('')
    setMyTeam(team)
    setMembers([{ profiles: { username: user.user_metadata?.username || '我', total_points: 0 } }])
    setMessage(`✅ 战队「${team.name}」创建成功，加入码：${team.code}`)
    setCreating(false)
  }

  async function handleJoinTeam() {
    if (!user) { alert('请先登录！'); router.push('/login'); return }
    if (!joinCode.trim()) { alert('请输入加入码'); return }

    setJoining(true)
    setMessage('')
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, name, code, total_points')
      .eq('code', joinCode.trim().toUpperCase())
      .maybeSingle()

    if (teamError || !team) {
      setMessage('未找到该加入码对应的战队，请检查后重试')
      setJoining(false)
      return
    }

    const { error: memberError } = await supabase
      .from('team_members')
      .insert({ team_id: team.id, user_id: user.id })

    if (memberError) {
      setMessage('加入失败：' + memberError.message)
      setJoining(false)
      return
    }

    setJoinCode('')
    setMyTeam(team)
    await loadMembers(team.id)
    setMessage(`✅ 已加入战队「${team.name}」！`)
    setJoining(false)
  }

  return (
    <main className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">👥 组队巡游</h1>
      <p className="text-gray-600 mb-6">和好友组队，一起打卡老成渝铁路！</p>

      {message && <div className="bg-yellow-100 p-3 rounded mb-4 text-sm">{message}</div>}

      {loading ? (
        <div className="text-center text-gray-400 py-8">加载中...</div>
      ) : !user ? (
        <div className="text-center text-gray-500 py-8">
          <p className="mb-4">登录后即可创建或加入战队</p>
          <button onClick={() => router.push('/login')} className="bg-blue-500 text-white px-6 py-2 rounded-lg">去登录</button>
        </div>
      ) : myTeam ? (
        // 已加入战队：显示战队信息和成员列表
        <div>
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-5 rounded-xl mb-6 shadow">
            <div className="text-lg font-bold">🚩 {myTeam.name}</div>
            <div className="text-sm mt-1 opacity-90">加入码：<span className="font-mono font-bold">{myTeam.code}</span></div>
            <div className="text-sm mt-1">战队积分：{myTeam.total_points ?? 0} 分</div>
          </div>

          <h2 className="font-bold text-gray-800 mb-3">👨‍👩‍👧‍👦 成员列表（{members.length}）</h2>
          {members.length === 0 ? (
            <div className="text-center text-gray-400 p-4 bg-gray-50 rounded">暂无成员</div>
          ) : (
            <div className="space-y-2">
              {members.map((m, i) => (
                <div key={m.id || i} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                      {(m.profiles?.username || '旅')[0]}
                    </span>
                    <div>
                      <div className="font-medium text-gray-800">{m.profiles?.username || '匿名旅客'}</div>
                      {m.profiles?.city && <div className="text-xs text-gray-400">📍 {m.profiles.city}</div>}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-blue-600">{m.profiles?.total_points ?? 0} 分</span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => {
              if (navigator.clipboard) navigator.clipboard.writeText(myTeam.code)
              alert('加入码已复制：' + myTeam.code)
            }}
            className="w-full mt-4 bg-indigo-500 text-white p-3 rounded-lg font-bold"
          >
            📋 复制加入码邀请好友
          </button>
        </div>
      ) : (
        // 未加入战队：创建 / 加入表单
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <h2 className="font-bold text-gray-800 mb-3">🆕 创建战队</h2>
            <div className="flex gap-2">
              <input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="输入战队名称"
                className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                onClick={handleCreateTeam}
                disabled={creating}
                className="bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50"
              >
                {creating ? '创建中...' : '创建'}
              </button>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <h2 className="font-bold text-gray-800 mb-3">🔑 加入战队</h2>
            <div className="flex gap-2">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="输入 6 位加入码"
                className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                onClick={handleJoinTeam}
                disabled={joining}
                className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50"
              >
                {joining ? '加入中...' : '加入'}
              </button>
            </div>
          </div>
        </div>
      )}

      <a href="/" className="block text-center mt-8 text-blue-500">⬅ 返回首页</a>
    </main>
  )
}
