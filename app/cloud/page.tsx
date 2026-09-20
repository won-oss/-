'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link' // 新增这一行

export default function CloudCheckIn() {
  const [story, setStory] = useState('')
  const [message, setMessage] = useState('')

  async function submitCloud() {
    if (!story) { setMessage('写点故事吧~'); return; }
    setMessage('上传中...')
    
    const { error } = await supabase.from('checkins').insert({
      checkpoint_id: 1,
      type: 'cloud',
      story: story,
      user_id: '00000000-0000-0000-0000-000000000000' // 以后要改成真实 user.id
    })

    if (error) {
      setMessage('提交失败：' + error.message)
    } else {
      setMessage('✅ 云打卡成功！+3分（故事已保存）')
      setStory('')
    }
  }

  return (
    <main className="p-6 max-w-md mx-auto">
      <h1 className="page-title mb-2">☁️ 云打卡</h1>
      <p className="text-gray-600 mb-4">无法到场？写下你的故事，同样能获得积分！</p >
      
      {message && <div className="bg-blue-100 border border-blue-200 text-blue-800 p-3 rounded-xl mb-4 animate-rise">{message}</div>}

      <textarea
        className="w-full border border-gray-200 bg-white/80 rounded-xl p-3 mb-4 h-32 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all"
        placeholder="写下你和这条铁路的故事..."
        value={story}
        onChange={(e) => setStory(e.target.value)}
      />
      <button onClick={submitCloud} className="card-lift w-full bg-gradient-to-r from-sky-500 to-blue-500 text-white p-3.5 rounded-xl font-bold shadow-lg shadow-sky-200">
        ☁️ 提交云打卡
      </button>
      
      {/* 这里变成了 Link */}
      <Link href="/" className="block text-center mt-4 text-blue-500">⬅ 返回首页</Link>
    </main>
  )
}