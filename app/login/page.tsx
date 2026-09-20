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
    <main className="px-6 py-10 max-w-md mx-auto">
      <div className="bg-white/85 backdrop-blur rounded-3xl border border-amber-100 shadow-xl shadow-amber-100/60 p-7">
        <div className="text-center mb-6">
          <div className="animate-floaty text-5xl inline-block" style={{ '--rot': '-4deg' } as any}>🚂</div>
          <h1 className="page-title mt-2">{isLogin ? '登录' : '注册新账号'}</h1>
          <p className="text-gray-500 text-sm mt-1">老成渝铁路打卡之旅</p>
        </div>

        {message && <div className="bg-yellow-100 border border-yellow-200 text-yellow-800 p-3 rounded-xl mb-4 text-sm animate-rise">{message}</div>}

        <input
          type="email" placeholder="你的邮箱" value={email} onChange={e => setEmail(e.target.value)}
          className="w-full border border-gray-200 bg-gray-50/60 rounded-xl p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all"
        />
        <input
          type="password" placeholder="你的密码（至少6位）" value={password} onChange={e => setPassword(e.target.value)}
          className="w-full border border-gray-200 bg-gray-50/60 rounded-xl p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all"
        />

        <button onClick={handleSubmit} className="card-lift w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white p-3.5 rounded-xl font-bold shadow-lg shadow-orange-200">
          {isLogin ? '🚂 登录' : '🚀 注册'}
        </button>

        <button onClick={() => { setIsLogin(!isLogin); setMessage('') }} className="w-full mt-4 text-blue-500 underline hover:text-blue-700 transition-colors">
          {isLogin ? '没有账号？去注册' : '已有账号？去登录'}
        </button>
      </div>

      <Link href="/" className="block text-center mt-6 text-gray-400 hover:text-gray-600 transition-colors">⬅ 返回首页</Link>
    </main>
  )
}