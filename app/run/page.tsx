'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getDistance } from '@/lib/distance'

export default function RunTrack() {
  const [isRunning, setIsRunning] = useState(false)
  const [path, setPath] = useState<[number, number][]>([])
  const [totalDistance, setTotalDistance] = useState(0)
  const [watchId, setWatchId] = useState<number | null>(null)

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [watchId])

  async function startRun() {
    setIsRunning(true)
    setPath([])
    setTotalDistance(0)

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setPath((prev) => {
          if (prev.length > 0) {
            const lastPoint = prev[prev.length - 1]
            const d = getDistance(lastPoint[0], lastPoint[1], latitude, longitude)
            setTotalDistance((prevDist) => prevDist + d)
          }
          return [...prev, [latitude, longitude]]
        })
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, maximumAge: 5000 }
    )
    setWatchId(id)
  }

  async function stopRun() {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
    setIsRunning(false)

    const { error } = await supabase.from('run_tracks').insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      path: path,
      distance_km: totalDistance / 1000,
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString()
    })

    if (error) {
      alert('保存轨迹失败：' + error.message)
    } else {
      alert('✅ 跑步轨迹已保存！总距离：' + (totalDistance / 1000).toFixed(2) + ' 公里')
    }
  }

  return (
    <main className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">🏃 跑步轨迹记录</h1>
      <p className="text-gray-600 mb-6">开始跑步，系统会记录你的轨迹并计算距离</p >

      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <div className="text-lg font-bold text-blue-800 mb-2">当前总距离</div>
        <div className="text-3xl font-bold text-blue-600">{(totalDistance / 1000).toFixed(2)} 公里</div>
        <div className="text-sm text-gray-500 mt-1">已记录 {path.length} 个轨迹点</div>
      </div>

      {!isRunning ? (
        <button onClick={startRun} className="w-full bg-green-500 text-white p-4 rounded-lg text-lg font-bold">
          开始跑步
        </button>
      ) : (
        <button onClick={stopRun} className="w-full bg-red-500 text-white p-4 rounded-lg text-lg font-bold">
          结束并保存轨迹
        </button>
      )}

      <a href=" " className="block text-center mt-8 text-blue-500">⬅ 返回首页</a >
    </main>
  )
}