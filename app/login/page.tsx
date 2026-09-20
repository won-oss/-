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
      if (error) setMessage('登录失败：' + error.message)
      else { setMessage('登录成功！即将跳转...'); setTimeout(() => router.push('/'), 1000); }
    } else {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { data: { username: email.split('@')[0] } }
      })
      if (error) setMessage('注册失败：' + error.message)
      else { setMessage('注册成功！请点击下方切换为登录'); setIsLogin(true); }
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