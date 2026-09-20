'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getDistance } from '@/lib/distance'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Home() {
  const [checkpoints, setCheckpoints] = useState<any[]>([])
  const [message, setMessage] = useState('')
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    // 获取当前登录的用户
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUser(data.user)
    })
    loadCheckpoints()
  }, [])

  async function loadCheckpoints() {
    const { data } = await supabase.from('checkpoints').select('*')
    if (data) setCheckpoints(data)
  }

  async function handleCheckIn(cp: any) {
    // 如果没登录，提示并跳转到登录页
    if (!user) { 
      alert('请先登录！'); 
      router.push('/login'); 
      return; 
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

        // 这里已经改成了真实用户的 user.id
        const { error } = await supabase.from('checkins').insert({
          checkpoint_id: cp.id,
          type: 'gps',
          user_id: user.id
        })

        if (error) setMessage('打卡失败：' + error.message)
        else setMessage(`✅ ${cp.name} 打卡成功！+${cp.points}分`)
      },
      () => setMessage('获取位置失败，请允许浏览器定位')
    )
  }

  return (
    <main className="p-6 max-w-md mx-auto">
      {/* 顶部标题和登录状态 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🚂 老成渝铁路打卡</h1>
        {user ? (
          <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">已登录</span>
        ) : (
          <Link href="/login" className="text-sm text-blue-500 underline">去登录</Link>
        )}
      </div>

      {message && <div className="bg-yellow-100 p-3 rounded mb-4">{message}</div>}

      {/* 打卡按钮 */}
      <div className="space-y-3">
        {checkpoints.map((cp) => (
          <button key={cp.id} onClick={() => handleCheckIn(cp)} className="w-full bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600">
            📍 {cp.name}（{cp.radius_meters}米内）
          </button>
        ))}
      </div>

      {/* 底部导航链接 */}
      <div className="mt-8 flex flex-col items-center gap-2">
        <Link href="/cloud" className="text-blue-500 underline">☁️ 去云打卡</Link>
        <Link href="/stamps" className="text-blue-500 underline">🎫 去看集章</Link>
        <Link href="/rank" className="text-blue-500 underline">🏆 去看排行榜</Link>
        <Link href="/run" className="text-blue-500 underline">🏃 去跑步</Link>
        <Link href="/team" className="text-indigo-500 underline">👥 组队巡游</Link>
        <Link href="/medal" className="text-amber-500 underline">🎖️ 奖牌勋章</Link>
        <Link href="/shop" className="text-purple-500 underline">🏺 文创商店</Link>
      </div>
    </main>
  )
}