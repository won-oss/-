'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Rank() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRank()
  }, [])

  async function loadRank() {
    // 从 profiles 表里查用户，按 total_points 从高到低排序
    const { data, error } = await supabase
      .from('profiles')
      .select('username, total_points, city')
      .order('total_points', { ascending: false })
      .limit(20)
    
    if (data) setUsers(data)
    setLoading(false)
  }

  return (
    <main className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">🏆 铁路英雄榜</h1>
      <p className="text-gray-600 mb-6">看看谁是打卡最多的铁路达人！</p >

      {loading ? (
        <div className="text-center text-gray-400">加载中...</div>
      ) : users.length === 0 ? (
        <div className="text-center text-gray-400 p-4 bg-gray-50 rounded">暂无数据，快来抢占第一名吧！</div>
      ) : (
        <div className="space-y-3">
          {users.map((u, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg shadow border">
              <div className="flex items-center gap-3">
                <span className={`font-bold text-xl w-6 text-center ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-orange-400' : 'text-gray-300'}`}>
                  {index + 1}
                </span>
                <span className="font-medium text-gray-800">{u.username || '匿名旅客'}</span>
              </div>
              <span className="font-bold text-blue-600">{u.total_points} 分</span>
            </div>
          ))}
        </div>
      )}

      <a href=" " className="block text-center mt-8 text-blue-500">⬅ 返回首页</a >
    </main>
  )
}