'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [message, setMessage] = useState('')
  const router = useRouter()

  async function handleSubmit() {
    setMessage('处理中...')
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        // Supabase 会把"邮箱未确认"也统一报成 Invalid login credentials
        if (error.message.includes('Invalid login credentials')) {
          setMessage('登录失败：邮箱未确认或密码错误。如果是新注册的账号，请先到邮箱点击确认链接')
        } else {
          setMessage('登录失败：' + error.message)
        }
      } else { setMessage('登录成功！即将跳转...'); setTimeout(() => router.push('/'), 1000); }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username: email.split('@')[0] } }
      })
      if (error) {
        setMessage('注册失败：' + error.message)
      } else {
        // 同步创建 profile，供排行榜/集章/勋章/商店使用
        if (data.user) {
          const { error: pErr } = await supabase.from('profiles').insert({
            id: data.user.id,
            username: email.split('@')[0],
            total_points: 0,
            city: ''
          })
          if (pErr) console.error('创建 profile 失败：', pErr.message)
        }
        if (data.session) {
          // 项目未开启邮箱确认：注册即登录
          setMessage('注册成功！即将进入首页...')
          setTimeout(() => router.push('/'), 1000)
        } else {
          // 项目开启了邮箱确认：需要先去邮箱点确认
          setMessage('注册成功！请前往邮箱点击确认链接后，再回来登录')
          setIsLogin(true)
        }
      }
    }
  }

  return (
    <main className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">{isLogin ? '🚂 登录' : '🚂 注册新账号'}</h1>
      
      {message && <div className="bg-yellow-100 p-3 rounded mb-4">{message}</div>}

      <input 
        type="email" placeholder="你的邮箱" value={email} onChange={e => setEmail(e.target.value)}
        className="w-full border p-3 rounded mb-3"
      />
      <input 
        type="password" placeholder="你的密码（至少6位）" value={password} onChange={e => setPassword(e.target.value)}
        className="w-full border p-3 rounded mb-4"
      />

      <button onClick={handleSubmit} className="w-full bg-blue-500 text-white p-3 rounded font-bold">
        {isLogin ? '登录' : '注册'}
      </button>

      <button onClick={() => { setIsLogin(!isLogin); setMessage('') }} className="w-full mt-4 text-blue-500 underline">
        {isLogin ? '没有账号？去注册' : '已有账号？去登录'}
      </button>
      
      <Link href="/" className="block text-center mt-6 text-gray-500">⬅ 返回首页</Link>
    </main>
  )
}