'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function CloudCheckIn() {
  const [story, setStory] = useState('')
  const [message, setMessage] = useState('')

  async function submitCloud() {
    if (!story) { setMessage('写点故事吧~'); return; }
    setMessage('上传中...')
    
    // 注意：这里我们简化了，不传图片，只传文字故事
    const { error } = await supabase.from('checkins').insert({
      checkpoint_id: 1, // 暂时写死1，代表云打卡某个站点
      type: 'cloud',
      story: story,
      user_id: '00000000-0000-0000-0000-000000000000'
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
      <h1 className="text-2xl font-bold mb-4">☁️ 云打卡</h1>
      <p className="text-gray-600 mb-4">无法到场？写下你的故事，同样能获得积分！</p >
      
      {message && <div className="bg-blue-100 p-3 rounded mb-4">{message}</div>}

      <textarea
        className="w-full border rounded p-3 mb-4 h-32"
        placeholder="写下你和这条铁路的故事..."
        value={story}
        onChange={(e) => setStory(e.target.value)}
      />
      <button onClick={submitCloud} className="w-full bg-blue-500 text-white p-3 rounded">
        提交云打卡
      </button>
      
      <a href=" " className="block text-center mt-4 text-blue-500">⬅ 返回首页</a >
    </main>
  )
}