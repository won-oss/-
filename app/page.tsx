'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getDistance } from '@/lib/distance'

export default function Home() {
  const [checkpoints, setCheckpoints] = useState<any[]>([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadCheckpoints()
  }, [])

  async function loadCheckpoints() {
    const { data } = await supabase.from('checkpoints').select('*')
    if (data) setCheckpoints(data)
  }

  async function handleCheckIn(cp: any) {
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
          user_id: '00000000-0000-0000-0000-000000000000'
        })

        if (error) {
          setMessage('打卡失败：' + error.message)
        } else {
          setMessage(`✅ ${cp.name} 打卡成功！+${cp.points}分`)
        }
      },
      () => setMessage('获取位置失败，请允许浏览器定位')
    )
  }

  return (
    <main className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">🚂 老成渝铁路打卡</h1>
      <p className="text-gray-600 mb-6">点击下方站点打卡</p >

      {message && (
        <div className="bg-yellow-100 p-3 rounded mb-4">{message}</div>
      )}

      <div className="space-y-3">
        {checkpoints.map((cp) => (
          <button
            key={cp.id}
            onClick={() => handleCheckIn(cp)}
            className="w-full bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600"
          >
            📍 {cp.name}（{cp.radius_meters}米内）
          </button>
        ))}
      </div>
    </main>
  )
}