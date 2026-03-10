import { useState } from 'react'
import { useUser } from '../contexts/UserContext'

type Step = 'nickname' | 'family' | 'success'

export default function WelcomePage() {
  const { registerUser, createFamily, joinFamily, confirmFamily, name: currentName } = useUser()
  const [step, setStep] = useState<Step>(currentName ? 'family' : 'nickname')
  const [nickname, setNickname] = useState('')
  const [familyName, setFamilyName] = useState('')
  const [inviteInput, setInviteInput] = useState('')
  const [createdCode, setCreatedCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleNickname = async () => {
    if (!nickname.trim() || submitting) return
    setSubmitting(true)
    await registerUser(nickname.trim())
    setSubmitting(false)
    setStep('family')
  }

  const handleCreate = async () => {
    if (!familyName.trim() || submitting) return
    setSubmitting(true)
    setError('')
    const code = await createFamily(familyName.trim())
    setSubmitting(false)
    if (code) {
      setCreatedCode(code)
      setStep('success')
    } else {
      setError('创建失败，请检查网络后重试')
    }
  }

  const handleJoin = async () => {
    if (!inviteInput.trim() || submitting) return
    setSubmitting(true)
    setError('')
    const result = await joinFamily(inviteInput.trim())
    setSubmitting(false)
    if (result.ok) {
      // joinFamily already updates state → App will re-render to main
    } else {
      setError(result.error ?? '加入失败')
    }
  }

  const handleCopyLink = async () => {
    try {
      const link = `${window.location.origin}/join/${createdCode}`
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  const displayName = currentName || nickname

  return (
    <div className="flex flex-col h-full max-w-md mx-auto bg-gray-50">
      <div className="flex-1 flex flex-col items-center justify-center p-6">

        {/* Step 1: Nickname */}
        {step === 'nickname' && (
          <div className="w-full space-y-8">
            <div className="text-center">
              <div className="text-5xl mb-4">🍳</div>
              <h1 className="text-2xl font-bold text-gray-900">家庭点菜助手</h1>
              <p className="text-sm text-gray-400 mt-2">全家一起选，轻松做好饭</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1.5">输入你的昵称</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleNickname()}
                  placeholder="如：妈妈、爸爸、小明"
                  autoFocus
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-orange-400 transition-colors"
                />
              </div>
              <button
                onClick={handleNickname}
                disabled={!nickname.trim() || submitting}
                className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium hover:bg-orange-600 transition-colors disabled:opacity-40"
              >
                {submitting ? '...' : '下一步'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Create or Join Family */}
        {step === 'family' && (
          <div className="w-full space-y-6">
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900">欢迎，{displayName}!</h1>
              <p className="text-sm text-gray-400 mt-1">现在加入你的家庭</p>
            </div>

            {/* Create family card */}
            <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏠</span>
                <h2 className="font-semibold text-gray-800">创建新家庭</h2>
              </div>
              <p className="text-xs text-gray-400">成为主厨，管理本周菜单</p>
              <input
                type="text"
                value={familyName}
                onChange={e => setFamilyName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="家庭名称（如：我们家）"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-orange-400 transition-colors"
              />
              <button
                onClick={handleCreate}
                disabled={!familyName.trim() || submitting}
                className="w-full bg-orange-500 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-orange-600 transition-colors disabled:opacity-40"
              >
                {submitting ? '创建中...' : '创建家庭'}
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">或者</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Join family card */}
            <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔗</span>
                <h2 className="font-semibold text-gray-800">加入已有家庭</h2>
              </div>
              <p className="text-xs text-gray-400">输入家人分享的邀请码</p>
              <input
                type="text"
                value={inviteInput}
                onChange={e => setInviteInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                placeholder="输入6位邀请码"
                maxLength={6}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-orange-400 transition-colors text-center tracking-widest font-mono uppercase"
              />
              <button
                onClick={handleJoin}
                disabled={inviteInput.trim().length !== 6 || submitting}
                className="w-full bg-gray-800 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-gray-900 transition-colors disabled:opacity-40"
              >
                {submitting ? '加入中...' : '加入家庭'}
              </button>
            </div>

            {error && (
              <p className="text-center text-sm text-red-500">{error}</p>
            )}
          </div>
        )}

        {/* Step 3: Success — show invite code & link */}
        {step === 'success' && (
          <div className="w-full space-y-8">
            <div className="text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h1 className="text-xl font-bold text-gray-900">家庭创建成功!</h1>
              <p className="text-sm text-gray-400 mt-2">分享邀请链接给家人，让他们加入</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 text-center space-y-4">
              <p className="text-xs text-gray-500 font-medium">邀请码</p>
              <div className="text-3xl font-mono font-bold text-orange-500 tracking-[0.3em]">
                {createdCode}
              </div>

              <div className="pt-2 space-y-3">
                <p className="text-xs text-gray-400">或发送邀请链接</p>
                <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-500 font-mono break-all">
                  {window.location.origin}/join/{createdCode}
                </div>
                <button
                  onClick={handleCopyLink}
                  className="text-sm text-orange-500 font-medium hover:text-orange-600"
                >
                  {copied ? '已复制 ✓' : '复制邀请链接'}
                </button>
              </div>
            </div>

            <button
              onClick={confirmFamily}
              className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium hover:bg-orange-600 transition-colors"
            >
              开始使用
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
