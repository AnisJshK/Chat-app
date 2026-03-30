import { MessageCircle, Lock, Layers, Smartphone, Github, Mail, ArrowRight, Zap, Shield, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-100 overflow-x-hidden">

      {/* Ambient blobs — same as AuthPage */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full bg-indigo-600/10 blur-[140px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-violet-700/10 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-blue-600/5 blur-[100px]" />
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-indigo-500/5 blur-[80px]" />
      </div>

      <div className="relative z-10">

        {/* ── Nav ── */}
        <nav className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            {/* Logo — mirrors AuthPage brand block */}
            <div className="flex items-center gap-2.5 select-none">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Chat<span className="text-indigo-400">Nova</span>
              </span>
            </div>
            <button
              onClick={() => navigate('/Authpage')}
              className="px-5 py-2.5 bg-gray-900/80 backdrop-blur-xl border border-gray-800/60 rounded-xl text-sm font-semibold text-gray-300 hover:text-white hover:border-indigo-500/40 transition-all duration-200 shadow-sm"
            >
              Login
            </button>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section className="container mx-auto px-6 py-24 lg:py-36">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-sm text-indigo-400 font-medium">
                <Zap className="w-3.5 h-3.5" />
                Real-time Messaging Platform
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
                Connect instantly.
                <br />
                <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  Chat smarter.
                </span>
                <br />
                Stay in sync.
              </h1>
              <p className="text-lg text-gray-400 leading-relaxed max-w-lg">
                ChatNova is a real-time messaging platform that lets you manage multiple conversations, communicate seamlessly, and stay organized — all in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button
                  onClick={() => navigate('/Authpage')}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold tracking-wide shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate('/Authpage')}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-gray-900/80 backdrop-blur-xl border border-gray-800/60 rounded-xl text-sm font-semibold text-gray-300 hover:text-white hover:border-gray-700/60 transition-all duration-200"
                >
                  Login
                </button>
              </div>
            </div>

            {/* Mock chat window — glass card like AuthPage */}
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-600/10 rounded-3xl blur-3xl" />
              <div className="relative bg-gray-900/80 backdrop-blur-xl border border-gray-800/60 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
                {/* Window chrome */}
                <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-800/60">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                  <span className="ml-3 text-xs text-gray-600 font-medium tracking-wide">ChatNova</span>
                </div>
                {/* Sidebar + chat split */}
                <div className="flex h-64">
                  {/* Sidebar */}
                  <div className="w-1/3 bg-gray-950/40 border-r border-gray-800/60 p-3 space-y-2">
                    {[
                      { from: 'from-indigo-500', to: 'to-violet-500', active: true },
                      { from: 'from-violet-500', to: 'to-pink-500', active: false },
                      { from: 'from-cyan-500', to: 'to-blue-500', active: false },
                    ].map((u, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-colors ${
                          u.active ? 'bg-indigo-500/10 border border-indigo-500/20' : 'hover:bg-gray-800/40'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${u.from} ${u.to} flex-shrink-0`} />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-2 bg-gray-700 rounded w-14" />
                          <div className="h-1.5 bg-gray-800 rounded w-10" />
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Chat area */}
                  <div className="flex-1 flex flex-col">
                    <div className="px-4 py-3 border-b border-gray-800/60 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500" />
                      <div className="space-y-1">
                        <div className="h-2 bg-gray-600 rounded w-20" />
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <div className="h-1.5 bg-gray-700 rounded w-10" />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 p-4 space-y-3">
                      <div className="flex gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex-shrink-0 mt-1" />
                        <div className="bg-gray-800/60 border border-gray-700/40 rounded-2xl rounded-tl-sm px-3 py-2 max-w-xs">
                          <div className="h-2 bg-gray-600 rounded w-28 mb-1.5" />
                          <div className="h-2 bg-gray-700 rounded w-20" />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl rounded-tr-sm px-3 py-2 max-w-xs shadow-md shadow-indigo-500/20">
                          <div className="h-2 bg-white/25 rounded w-24" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex-shrink-0 mt-1" />
                        <div className="bg-gray-800/60 border border-gray-700/40 rounded-2xl rounded-tl-sm px-3 py-2 max-w-xs">
                          <div className="h-2 bg-gray-600 rounded w-36" />
                        </div>
                      </div>
                    </div>
                    {/* Input bar */}
                    <div className="px-4 pb-4">
                      <div className="bg-gray-800/60 border border-gray-700/40 rounded-xl px-3 py-2.5 flex items-center justify-between">
                        <div className="h-2 bg-gray-700 rounded w-32" />
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                          <ArrowRight className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="container mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              Everything you need to{' '}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                chat better
              </span>
            </h2>
            <p className="text-gray-500 text-lg">Powerful features designed for modern communication</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: <MessageCircle className="w-6 h-6 text-white" />,
                grad: 'from-indigo-500 to-violet-600',
                glow: 'group-hover:shadow-indigo-500/20',
                border: 'group-hover:border-indigo-500/30',
                title: 'Real-time Messaging',
                desc: 'Send and receive messages instantly with zero delay. Stay connected in real-time.',
              },
              {
                icon: <Lock className="w-6 h-6 text-white" />,
                grad: 'from-violet-500 to-purple-600',
                glow: 'group-hover:shadow-violet-500/20',
                border: 'group-hover:border-violet-500/30',
                title: 'Secure Authentication',
                desc: 'Your conversations are protected with enterprise-grade security and encryption.',
              },
              {
                icon: <Layers className="w-6 h-6 text-white" />,
                grad: 'from-blue-500 to-indigo-600',
                glow: 'group-hover:shadow-blue-500/20',
                border: 'group-hover:border-blue-500/30',
                title: 'Multiple Chats',
                desc: 'Manage unlimited conversations and switch between them effortlessly.',
              },
              {
                icon: <Smartphone className="w-6 h-6 text-white" />,
                grad: 'from-indigo-400 to-cyan-500',
                glow: 'group-hover:shadow-cyan-500/20',
                border: 'group-hover:border-cyan-500/30',
                title: 'Responsive UI',
                desc: 'Beautiful interface that works seamlessly on desktop, tablet, and mobile.',
              },
            ].map((f, i) => (
              <div
                key={i}
                className={`group bg-gray-900/80 backdrop-blur-xl border border-gray-800/60 rounded-2xl p-7 hover:shadow-xl ${f.glow} ${f.border} transition-all duration-300`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.grad} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {f.icon}
                </div>
                <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Feature highlight ── */}
        <section className="container mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: second mock UI */}
            <div className="relative order-2 lg:order-1">
              <div className="absolute inset-0 bg-violet-600/10 rounded-3xl blur-3xl" />
              <div className="relative bg-gray-900/80 backdrop-blur-xl border border-gray-800/60 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500" />
                    <div className="space-y-1">
                      <div className="h-2 bg-gray-600 rounded w-20" />
                      <div className="h-1.5 bg-emerald-500/60 rounded w-12" />
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-6 h-6 bg-gray-800/60 border border-gray-700/40 rounded-lg" />
                    <div className="w-6 h-6 bg-gray-800/60 border border-gray-700/40 rounded-lg" />
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  {['w-3/4', 'w-1/2', 'w-5/6'].map((w, i) => (
                    <div key={i} className="flex gap-3">
                      <div className={`w-7 h-7 rounded-full flex-shrink-0 mt-0.5 ${i % 2 === 0 ? 'bg-gradient-to-br from-indigo-500 to-violet-500' : 'bg-gradient-to-br from-violet-500 to-pink-500'}`} />
                      <div className="flex-1 space-y-2">
                        <div className="h-2 bg-gray-700 rounded w-16" />
                        <div className={`h-8 bg-gray-800/60 border border-gray-700/40 rounded-xl rounded-tl-sm`}>
                          <div className={`h-2 bg-gray-600 rounded mt-3 ml-3 ${w}`} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-3 justify-end">
                    <div className="h-8 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl rounded-tr-sm w-2/3 shadow-md shadow-indigo-500/20">
                      <div className="h-2 bg-white/20 rounded mt-3 ml-3 w-3/4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: copy */}
            <div className="order-1 lg:order-2 space-y-7">
              <h2 className="text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
                Experience the future of{' '}
                <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  messaging
                </span>
              </h2>
              <p className="text-gray-400 leading-relaxed text-lg">
                Our intuitive dashboard makes it easy to manage all your conversations in one place. Switch between chats, organize your messages, and stay productive.
              </p>
              <div className="space-y-5">
                {[
                  { icon: <Shield className="w-4 h-4 text-white" />, grad: 'from-indigo-500 to-violet-500', title: 'Organized Sidebar', desc: 'Quick access to all your active conversations' },
                  { icon: <MessageCircle className="w-4 h-4 text-white" />, grad: 'from-violet-500 to-purple-600', title: 'Clean Message View', desc: 'Focus on what matters with a distraction-free interface' },
                  { icon: <Zap className="w-4 h-4 text-white" />, grad: 'from-blue-500 to-indigo-500', title: 'Smart Notifications', desc: 'Never miss an important message' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${item.grad} flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md`}>
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm mb-0.5">{item.title}</h4>
                      <p className="text-gray-500 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="container mx-auto px-6 py-24">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-600/10 rounded-3xl blur-3xl" />
            <div className="relative bg-gray-900/80 backdrop-blur-xl border border-gray-800/60 rounded-2xl shadow-2xl shadow-black/50 p-12 lg:p-16 text-center overflow-hidden">
              {/* inner ambient */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-indigo-600/10 blur-[60px] rounded-full pointer-events-none" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-sm text-indigo-400 font-medium mb-6">
                  <Users className="w-3.5 h-3.5" />
                  Join thousands of users
                </div>
                <h2 className="text-4xl lg:text-6xl font-bold tracking-tight mb-4">
                  Start chatting in{' '}
                  <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                    seconds
                  </span>
                </h2>
                <p className="text-gray-500 text-lg mb-8 max-w-xl mx-auto">
                  Join thousands of users already experiencing seamless real-time communication.
                </p>
                <button
                  onClick={() => navigate('/Authpage')}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold tracking-wide shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                >
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-gray-800/60 py-10">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2.5 select-none">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white tracking-tight">
                  Chat<span className="text-indigo-400">Nova</span>
                </span>
              </div>
              <div className="flex gap-8">
                <a href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">About</a>
                <a href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors flex items-center gap-1.5">
                  <Github className="w-3.5 h-3.5" />GitHub
                </a>
                <a href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />Contact
                </a>
              </div>
              <p className="text-gray-700 text-xs">© 2024 ChatNova. All rights reserved.</p>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}