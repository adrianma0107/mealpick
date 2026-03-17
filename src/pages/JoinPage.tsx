import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'

export default function JoinPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { registered, familyId, registerUser, joinFamily } = useUser()

  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [joined, setJoined] = useState(false)

  const normalizedCode = (code ?? '').trim().toUpperCase()

  // Already has family → go home
  useEffect(() => {
    if (familyId && !joined) {
      navigate('/', { replace: true })
    }
  }, [familyId, joined, navigate])

  // Registered but no family → auto-join
  useEffect(() => {
    if (registered && !familyId && normalizedCode.length === 6 && !submitting && !error) {
      doJoin()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registered, familyId])

  async function doJoin() {
    setSubmitting(true)
    setError('')
    const result = await joinFamily(normalizedCode)
    setSubmitting(false)
    if (result.ok) {
      setJoined(true)
    } else {
      setError(result.error ?? '加入失败')
    }
  }

  // Step 1: not registered → enter nickname then join
  async function handleSubmit() {
    if (!nickname.trim() || submitting) return
    setSubmitting(true)
    setError('')
    await registerUser(nickname.trim())
    // After register, the useEffect above will trigger doJoin
    // But in case timing is off, do it explicitly:
    const result = await joinFamily(normalizedCode)
    setSubmitting(false)
    if (result.ok) {
      setJoined(true)
    } else {
      setError(result.error ?? '加入失败')
    }
  }

  // Invalid code
  if (normalizedCode.length !== 6) {
    return (
      <div className="flex flex-col h-full max-w-md mx-auto bg-gray-50">
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
          <div className="text-5xl">😕</div>
          <h1 className="text-xl font-bold text-gray-900">邀请码无效</h1>
          <p className="text-sm text-gray-400">请检查链接是否正确</p>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="mt-4 bg-orange-500 text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-orange-600 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  // Joined success
  if (joined) {
    return (
      <div className="flex flex-col h-full max-w-md mx-auto bg-gray-50">
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
          <div className="text-5xl">🎉</div>
          <h1 className="text-xl font-bold text-gray-900">加入成功!</h1>
          <p className="text-sm text-gray-400">你已加入家庭，现在可以开始点菜了</p>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="w-full max-w-xs bg-orange-500 text-white py-3 rounded-xl font-medium hover:bg-orange-600 transition-colors"
          >
            开始点菜
          </button>
        </div>
      </div>
    )
  }

  // Loading / auto-joining
  if (registered && !familyId && submitting) {
    return (
      <div className="flex flex-col h-full max-w-md mx-auto bg-gray-50">
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">正在加入家庭...</p>
        </div>
      </div>
    )
  }

  // Not registered → nickname input
  return (
    <div className="flex flex-col h-full max-w-md mx-auto bg-gray-50">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full space-y-8">
          <div className="text-center">
            <div className="text-5xl mb-4">🍳</div>
            <h1 className="text-2xl font-bold text-gray-900">加入家庭点菜</h1>
            <p className="text-sm text-gray-400 mt-2">
              邀请码：<span className="font-mono font-bold text-orange-500 tracking-wider">{normalizedCode}</span>
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1.5">输入你的昵称</label>
              <input
                type="text"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="如：妈妈、爸爸、小明"
                autoFocus
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-orange-400 transition-colors"
              />
              <p className="text-xs text-gray-300 mt-1.5">已有账号？输入原昵称即可找回</p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!nickname.trim() || submitting}
              className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium hover:bg-orange-600 transition-colors disabled:opacity-40"
            >
              {submitting ? '加入中...' : '加入并开始点菜'}
            </button>
          </div>

          {error && (
            <p className="text-center text-sm text-red-500">{error}</p>
          )}
        </div>
      </div>
    </div>
  )
}
