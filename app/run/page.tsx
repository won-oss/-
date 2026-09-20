'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import { getDistance } from '@/lib/distance'

// 地图组件依赖浏览器 API（leaflet），必须 dynamic import 并关闭 SSR，避免 SSR 报错
const TrackMap = dynamic(() => import('./TrackMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
      地图加载中...
    </div>
  ),
})

export default function RunTrackPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [path, setPath] = useState<[number, number][]>([])
  const [totalDistance, setTotalDistance] = useState(0)
  const [watchId, setWatchId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  // 最近一次历史轨迹
  const [history, setHistory] = useState<{
    path: [number, number][]
    distance_km: number | null
    created_at: string | null
  } | null>(null)

  useEffect(() => {
    loadLastTrack()
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [watchId])

  async function loadLastTrack() {
    const { data } = await supabase
      .from('run_tracks')
      .select('path, distance_km, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
    if (data && data.length > 0) setHistory(data[0])
  }

  function startRun() {
    if (!navigator.geolocation) {
      alert('当前浏览器不支持定位')
      return
    }
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
      (err) => console.error('定位失败：', err),
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

    if (path.length === 0) return
    setSaving(true)
    const { error } = await supabase.from('run_tracks').insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      path: path,
      distance_km: totalDistance / 1000,
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString()
    })

    setSaving(false)
    if (error) {
      alert('保存轨迹失败：' + error.message)
    } else {
      alert('✅ 跑步轨迹已保存！总距离：' + (totalDistance / 1000).toFixed(2) + ' 公里')
      await loadLastTrack()
    }
  }

  return (
    <main className="p-6 max-w-md mx-auto">
      <h1 className="page-title mb-2">🏃 跑步轨迹</h1>
      <p className="text-gray-600 mb-6">实时在地图上点亮你的每一步足迹</p>

      {/* 数据面板 */}
      <div className="card-lift bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-4 rounded-xl mb-4 flex justify-between items-center shadow-lg shadow-blue-200">
        <div>
          <div className="text-sm opacity-90">当前总距离</div>
          <div className="text-2xl font-bold mt-0.5">{(totalDistance / 1000).toFixed(2)} 公里</div>
        </div>
        <div className="text-right">
          <div className="text-sm opacity-90">轨迹点</div>
          <div className="text-2xl font-bold mt-0.5">{path.length}</div>
        </div>
      </div>

      {/* 地图 */}
      <TrackMap
        path={path}
        historyPath={history?.path}
        historyDistance={history?.distance_km}
        historyDate={history?.created_at}
      />

      {/* 历史轨迹信息 */}
      {history && history.path && history.path.length > 1 && !isRunning && (
        <div className="text-xs text-gray-400 mt-2">
          灰色虚线为上次轨迹（{history.distance_km?.toFixed(2) ?? '-'} 公里）
        </div>
      )}

      {/* 控制按钮 */}
      <div className="mt-4 space-y-3">
        {!isRunning ? (
          <button onClick={startRun} className="card-lift w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-xl text-lg font-bold shadow-lg shadow-green-200">
            ▶ 开始跑步
          </button>
        ) : (
          <button
            onClick={stopRun}
            disabled={saving || path.length === 0}
            className="card-lift w-full bg-gradient-to-r from-red-500 to-rose-500 text-white p-4 rounded-xl text-lg font-bold shadow-lg shadow-red-200 disabled:opacity-50"
          >
            {saving ? '保存中...' : '⏹ 结束并保存轨迹'}
          </button>
        )}
        <p className="text-xs text-gray-400 text-center">
          {isRunning ? '定位中，请保持屏幕常亮，绿色点为起点、红色点为终点' : '点击开始，用脚步绘制你的铁路轨迹'}
        </p>
      </div>

      <a href="/" className="block text-center mt-8 text-blue-500">⬅ 返回首页</a>
    </main>
  )
}
