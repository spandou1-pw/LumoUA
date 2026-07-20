import { useState, useEffect } from 'react'

type Page = 'home' | 'feed' | 'messages' | 'chat' | 'marketplace' | 'profile'

const P = '#2AABEE'
const PD = '#0088CC'
const INK = '#1C1C1E'
const SURF = '#F2F2F7'
const BDR = 'rgba(60,60,67,0.12)'
const MUTED = '#8E8E93'
const W = '#FFFFFF'

// ─── Icons ───────────────────────────────────────────────────────────────────

const IcoMsg = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)
const IcoSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)
const IcoTag = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
)
const IcoHeart = ({ filled }: { filled?: boolean }) => (
  <svg viewBox="0 0 24 24" fill={filled ? '#FF3B30' : 'none'} stroke={filled ? '#FF3B30' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)
const IcoShare = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
)
const IcoHome = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)
const IcoGrid = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
)
const IcoSend = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
)
const IcoBack = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
    <polyline points="15 18 9 12 15 6" />
  </svg>
)
const IcoShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)
const IcoUsers = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)
const IcoCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const IcoPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)
const IcoPin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
)

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ letter, size = 44, color = P, online = false }: { letter: string; size?: number; color?: string; online?: boolean }) {
  const grad = color === P ? `linear-gradient(135deg, ${P}, #0088CC)` : `linear-gradient(135deg, ${color}, ${color}99)`
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{ width: size, height: size, borderRadius: '50%', background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: W, fontWeight: 700, fontSize: size * 0.42 }}>{letter}</span>
      </div>
      {online && <div style={{ position: 'absolute', bottom: 1, right: 1, width: size * 0.26, height: size * 0.26, borderRadius: '50%', background: '#34C759', border: '2px solid white' }} />}
    </div>
  )
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav({ page, setPage, scrolled }: { page: Page; setPage: (p: Page) => void; scrolled: boolean }) {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 max(24px, calc((100vw - 1200px)/2 + 24px))',
      background: scrolled ? 'rgba(255,255,255,0.82)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
      borderBottom: scrolled ? `1px solid ${BDR}` : 'none',
      transition: 'all 0.25s ease',
    }}>
      {/* Logo */}
      <button onClick={() => setPage('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${P}, ${PD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 2px 8px ${P}40` }}>
          <span style={{ color: W, fontWeight: 900, fontSize: 17, letterSpacing: -0.5, fontFamily: 'inherit' }}>L</span>
        </div>
        <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: -0.4, color: INK }}>Lumo</span>
        <span style={{ fontWeight: 400, fontSize: 13, color: MUTED, marginLeft: -2 }}>.ua</span>
      </button>

      {/* Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {([['feed', 'Стрічка'], ['messages', 'Повідомлення'], ['marketplace', 'Маркет']] as [Page, string][]).map(([pg, label]) => (
          <button key={pg} onClick={() => setPage(pg)} style={{
            background: 'none', border: 'none', padding: '6px 14px', borderRadius: 8,
            fontSize: 14, fontWeight: page === pg ? 600 : 400,
            color: page === pg ? P : INK, cursor: 'pointer',
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => setPage('profile')} style={{ background: 'none', border: `1.5px solid ${BDR}`, padding: '7px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500, color: INK, cursor: 'pointer' }}>
          Увійти
        </button>
        <button
          style={{ background: P, border: 'none', padding: '8px 18px', borderRadius: 10, fontSize: 14, fontWeight: 600, color: W, cursor: 'pointer', transition: 'background 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.background = PD)}
          onMouseLeave={e => (e.currentTarget.style.background = P)}
        >
          Приєднатись
        </button>
      </div>
    </nav>
  )
}

// ─── Phone Mockup (inside hero) ───────────────────────────────────────────────

function MiniPost({ user, text, likes, img, color = P }: { user: string; text: string; likes: number; img?: string; color?: string }) {
  const [liked, setLiked] = useState(false)
  return (
    <div style={{ borderBottom: `1px solid ${BDR}`, paddingBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px 8px' }}>
        <Avatar letter={user[0]} size={30} color={color} />
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: INK }}>{user}</div>
          <div style={{ fontSize: 10, color: MUTED }}>щойно</div>
        </div>
      </div>
      {img && <div style={{ height: 130, background: `url(${img}) center/cover` }} />}
      <div style={{ padding: '6px 12px', fontSize: 12, color: INK, lineHeight: 1.5 }}>{text}</div>
      <div style={{ padding: '6px 12px 0', display: 'flex', gap: 12 }}>
        <button onClick={e => { e.stopPropagation(); setLiked(!liked) }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: liked ? '#FF3B30' : MUTED, padding: 0, fontSize: 11 }}>
          <div style={{ width: 14, height: 14 }}><IcoHeart filled={liked} /></div>
          {likes + (liked ? 1 : 0)}
        </button>
      </div>
    </div>
  )
}

function MiniMsgList() {
  return (
    <div>
      <div style={{ padding: '10px 12px 8px' }}>
        <div style={{ background: SURF, borderRadius: 9, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 13, height: 13, color: MUTED }}><IcoSearch /></div>
          <span style={{ fontSize: 12, color: MUTED }}>Пошук</span>
        </div>
      </div>
      {[
        { name: 'Андрій', msg: 'Привіт! Як справи?', time: '12:34', unread: 2, color: '#5856D6' },
        { name: 'Оксана', msg: 'Підтверджую замовлення', time: '11:20', unread: 0, color: '#FF9500' },
        { name: 'Lumo Bot', msg: 'Ласкаво просимо!', time: 'вчора', unread: 0, color: P },
      ].map((m, i) => (
        <div key={i} style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${BDR}` }}>
          <Avatar letter={m.name[0]} size={38} color={m.color} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: INK }}>{m.name}</span>
              <span style={{ fontSize: 10, color: MUTED }}>{m.time}</span>
            </div>
            <span style={{ fontSize: 11, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{m.msg}</span>
          </div>
          {m.unread > 0 && <div style={{ background: P, color: W, borderRadius: 10, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{m.unread}</div>}
        </div>
      ))}
    </div>
  )
}

function MiniMarket() {
  return (
    <div>
      <div style={{ padding: '10px 12px', fontSize: 14, fontWeight: 700, color: INK }}>Маркет</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 12px 12px' }}>
        {[
          { name: 'iPhone 15 Pro', price: '42 000 ₴', img: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=200&h=200&fit=crop&auto=format' },
          { name: 'Велосипед Trek', price: '8 500 ₴', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop&auto=format' },
          { name: 'Sony WH-1000XM5', price: '6 200 ₴', img: 'https://images.unsplash.com/photo-1545127398-14699f92334b?w=200&h=200&fit=crop&auto=format' },
          { name: 'Книга з дизайну', price: '350 ₴', img: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&h=200&fit=crop&auto=format' },
        ].map((item, i) => (
          <div key={i} style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${BDR}` }}>
            <div style={{ height: 80, background: `url(${item.img}) center/cover` }} />
            <div style={{ padding: '7px 8px' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: INK, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: P }}>{item.price}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PhoneMockup() {
  const [tab, setTab] = useState<'feed' | 'msg' | 'market'>('feed')
  return (
    <div style={{ width: 290, height: 600, background: W, borderRadius: 44, border: '10px solid #1C1C1E', boxShadow: '0 40px 80px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)', overflow: 'hidden', flexShrink: 0 }}>
      {/* Status bar */}
      <div style={{ height: 40, background: W, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', borderBottom: `1px solid ${BDR}`, position: 'relative' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: INK }}>9:41</span>
        <div style={{ width: 100, height: 24, background: INK, borderRadius: 16, position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 6 }} />
        <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end' }}>
          {[9, 12, 15].map((h, i) => <div key={i} style={{ width: 3, height: h, background: INK, borderRadius: 2 }} />)}
          <div style={{ width: 20, height: 10, border: `1.5px solid ${INK}`, borderRadius: 3, display: 'flex', alignItems: 'center', padding: '0 1px' }}>
            <div style={{ height: 6, width: '80%', background: INK, borderRadius: 1 }} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ height: 'calc(100% - 40px - 52px)', overflowY: 'auto' }}>
        {tab === 'feed' && (
          <div>
            <div style={{ padding: '10px 12px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: INK }}>Lumo</span>
              <div style={{ width: 18, height: 18, color: MUTED }}><IcoSearch /></div>
            </div>
            <MiniPost user="Олена К." text="Чудовий ранок у Львові ☀️" likes={24} img="https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&h=200&fit=crop&auto=format" color={P} />
            <MiniPost user="Іван М." text="Хто йде на концерт сьогодні? 🎵" likes={12} color="#5856D6" />
            <MiniPost user="Марія Б." text="Продам велосипед, майже новий 🚲" likes={8} color="#34C759" />
          </div>
        )}
        {tab === 'msg' && <MiniMsgList />}
        {tab === 'market' && <MiniMarket />}
      </div>

      {/* Tab bar */}
      <div style={{ height: 52, background: W, borderTop: `1px solid ${BDR}`, display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
        {([['feed', IcoHome, 'Стрічка'], ['msg', IcoMsg, 'Чати'], ['market', IcoTag, 'Маркет']] as [typeof tab, () => JSX.Element, string][]).map(([id, Icon, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'pointer', color: tab === id ? P : MUTED, padding: 0 }}>
            <div style={{ width: 20, height: 20 }}><Icon /></div>
            <span style={{ fontSize: 9 }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Landing Page ─────────────────────────────────────────────────────────────

function HeroSection({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '80px max(24px, calc((100vw - 1200px)/2 + 24px)) 60px' }}>
      <div style={{ display: 'flex', gap: 60, alignItems: 'center', width: '100%', flexWrap: 'wrap' }}>
        {/* Left */}
        <div style={{ flex: '1 1 440px', maxWidth: 560 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `${P}12`, borderRadius: 100, padding: '4px 14px 4px 4px', marginBottom: 28 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: P, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>🇺🇦</div>
            <span style={{ fontSize: 13, fontWeight: 600, color: P }}>Соціальна мережа України</span>
          </div>

          <h1 style={{ fontSize: 'clamp(44px, 6.5vw, 80px)', fontWeight: 800, lineHeight: 1.04, letterSpacing: -2.5, color: INK, margin: '0 0 22px' }}>
            Спілкуйтесь.<br />Шукайте.<br />
            <span style={{ color: P }}>Продавайте.</span>
          </h1>

          <p style={{ fontSize: 18, fontWeight: 400, lineHeight: 1.65, color: MUTED, margin: '0 0 36px', maxWidth: 440 }}>
            Lumo — нова соціальна мережа України. Месенджер, стрічка та маркетплейс на одній платформі. Безкоштовно та безпечно.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => setPage('feed')}
              style={{ background: P, color: W, border: 'none', padding: '14px 30px', borderRadius: 14, fontSize: 16, fontWeight: 600, cursor: 'pointer', boxShadow: `0 8px 24px ${P}40`, transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = PD; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = P; e.currentTarget.style.transform = 'none' }}
            >
              Почати безкоштовно
            </button>
            <button
              onClick={() => setPage('messages')}
              style={{ background: SURF, color: INK, border: 'none', padding: '14px 30px', borderRadius: 14, fontSize: 16, fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#E5E5EA'}
              onMouseLeave={e => e.currentTarget.style.background = SURF}
            >
              Дивитись демо
            </button>
          </div>

          <div style={{ display: 'flex', gap: 22, marginTop: 36, flexWrap: 'wrap' }}>
            {[['Безкоштовно', '#34C759'], ['Без реклами', '#34C759'], ['Шифрування E2E', '#34C759']].map(([text, c]) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 16, height: 16, color: c }}><IcoCheck /></div>
                <span style={{ fontSize: 13, color: MUTED }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — phone */}
        <div style={{ flex: '1 1 290px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <PhoneMockup />
        </div>
      </div>
    </section>
  )
}

function FeatureCard({ icon, color, title, desc, items }: { icon: JSX.Element; color: string; title: string; desc: string; items: string[] }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: W, borderRadius: 20, padding: 36, border: `1px solid ${hov ? color + '45' : BDR}`, transition: 'all 0.2s', transform: hov ? 'translateY(-4px)' : 'none', boxShadow: hov ? `0 20px 48px ${color}12` : '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      <div style={{ width: 52, height: 52, borderRadius: 14, background: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, color }}>
        <div style={{ width: 26, height: 26 }}>{icon}</div>
      </div>
      <h3 style={{ fontSize: 22, fontWeight: 700, color: INK, margin: '0 0 12px', letterSpacing: -0.5 }}>{title}</h3>
      <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.65, margin: '0 0 24px' }}>{desc}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {items.map(item => (
          <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
              <div style={{ width: 10, height: 10 }}><IcoCheck /></div>
            </div>
            <span style={{ fontSize: 14, color: INK }}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FeaturesSection() {
  return (
    <section style={{ background: SURF, padding: '100px max(24px, calc((100vw - 1200px)/2 + 24px))' }}>
      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: P, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>Можливості</p>
        <h2 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, letterSpacing: -1.5, color: INK }}>
          Все, що потрібно.<br />На одній платформі.
        </h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        <FeatureCard
          icon={<IcoMsg />} color={P} title="Спілкуйтесь"
          desc="Telegram-стиль чати з наскрізним шифруванням. Групи, канали, голосові повідомлення та боти."
          items={['Шифрування E2E', 'Групи до 200 000 осіб', 'Боти та автоматизація']}
        />
        <FeatureCard
          icon={<IcoSearch />} color="#FF9500" title="Шукайте"
          desc="Знаходьте людей, товари, події та спільноти по всій Україні за лічені секунди."
          items={['Смарт-пошук з ШІ', 'Карта подій і місць', 'Персональні рекомендації']}
        />
        <FeatureCard
          icon={<IcoTag />} color="#34C759" title="Продавайте"
          desc="Вбудований маркетплейс для продажу будь-чого без жодної комісії та без зайвих кліків."
          items={['0% комісії назавжди', 'Захищені угоди', 'Рейтинг продавців']}
        />
      </div>
    </section>
  )
}

function StatsSection() {
  return (
    <section style={{ background: INK, padding: '80px max(24px, calc((100vw - 1200px)/2 + 24px))' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 40, textAlign: 'center' }}>
        {[['1M+', 'Користувачів'], ['50K+', 'Оголошень'], ['99.9%', 'Uptime'], ['0₴', 'Комісія']].map(([val, label]) => (
          <div key={label}>
            <div style={{ fontSize: 'clamp(40px, 5vw, 60px)', fontWeight: 800, color: W, letterSpacing: -2, lineHeight: 1 }}>{val}</div>
            <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', marginTop: 8 }}>{label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

function PreviewSection({ setPage }: { setPage: (p: Page) => void }) {
  const [active, setActive] = useState(0)
  const tabs = [
    { page: 'feed' as Page, title: 'Стрічка', desc: 'Instagram-стиль лента з публікаціями, сторіс і рекомендаціями від друзів та спільнот.', color: P, content: 'feed' },
    { page: 'messages' as Page, title: 'Чати', desc: 'Telegram-стиль месенджер з групами, каналами, шифруванням і голосовими повідомленнями.', color: '#5856D6', content: 'msg' },
    { page: 'marketplace' as Page, title: 'Маркетплейс', desc: 'Купуйте і продавайте без комісії. Захищені угоди та рейтинг продавців.', color: '#34C759', content: 'market' },
  ]
  const t = tabs[active]

  return (
    <section style={{ padding: '100px max(24px, calc((100vw - 1200px)/2 + 24px))' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: P, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>Як це працює</p>
          <h2 style={{ fontSize: 'clamp(30px, 4vw, 48px)', fontWeight: 800, letterSpacing: -1.5, color: INK, margin: '0 0 36px' }}>
            Три розділи.<br />Безліч можливостей.
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tabs.map((tab, i) => (
              <button key={i} onClick={() => setActive(i)} style={{ background: active === i ? `${tab.color}0C` : 'none', border: `1.5px solid ${active === i ? tab.color + '45' : BDR}`, borderRadius: 16, padding: '18px 22px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: active === i ? tab.color : INK, marginBottom: active === i ? 8 : 0 }}>{tab.title}</div>
                {active === i && <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.6 }}>{tab.desc}</div>}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPage(t.page)}
            style={{ marginTop: 24, background: t.color, color: W, border: 'none', padding: '13px 26px', borderRadius: 13, fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Відкрити {t.title} →
          </button>
        </div>

        {/* Preview phone */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 270, height: 540, background: W, borderRadius: 40, border: '8px solid #1C1C1E', boxShadow: `0 40px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.05), 0 0 60px ${t.color}18`, overflow: 'hidden', transition: 'box-shadow 0.3s' }}>
            <div style={{ height: 32, background: W, borderBottom: `1px solid ${BDR}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: INK }}>9:41</span>
            </div>
            <div style={{ height: 'calc(100% - 32px)', overflowY: 'auto' }}>
              {active === 0 && (
                <div>
                  <div style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>Lumo</span>
                    <div style={{ width: 16, height: 16, color: MUTED }}><IcoSearch /></div>
                  </div>
                  <MiniPost user="Олена К." text="Чудовий ранок у Львові ☀️" likes={24} img="https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&h=200&fit=crop&auto=format" />
                  <MiniPost user="Іван М." text="Хто йде на концерт сьогодні? 🎵" likes={12} color="#5856D6" />
                </div>
              )}
              {active === 1 && <MiniMsgList />}
              {active === 2 && <MiniMarket />}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function CtaSection() {
  return (
    <section style={{ background: SURF, padding: '100px 24px', textAlign: 'center' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, background: `linear-gradient(135deg, ${P}, ${PD})`, margin: '0 auto 28px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 16px 40px ${P}40` }}>
          <span style={{ color: W, fontWeight: 900, fontSize: 36 }}>L</span>
        </div>
        <h2 style={{ fontSize: 'clamp(32px, 5vw, 54px)', fontWeight: 800, letterSpacing: -2, color: INK, margin: '0 0 16px' }}>
          Приєднуйтесь до Lumo
        </h2>
        <p style={{ fontSize: 18, color: MUTED, margin: '0 0 40px', lineHeight: 1.65 }}>
          Безкоштовно. Без реклами. Тільки для України.
        </p>
        <button
          style={{ background: P, color: W, border: 'none', padding: '16px 44px', borderRadius: 16, fontSize: 17, fontWeight: 700, cursor: 'pointer', boxShadow: `0 12px 32px ${P}40`, transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = PD; e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => { e.currentTarget.style.background = P; e.currentTarget.style.transform = 'none' }}
        >
          Почати безкоштовно →
        </button>
        <p style={{ fontSize: 13, color: MUTED, marginTop: 16 }}>Не потрібна кредитна картка. Реєстрація за 30 секунд.</p>
      </div>
    </section>
  )
}

function FooterSection() {
  const cols: Record<string, string[]> = {
    'Продукт': ['Стрічка', 'Повідомлення', 'Маркет', 'Профіль'],
    'Компанія': ['Про нас', 'Команда', 'Вакансії', 'Блог'],
    'Підтримка': ['Довідка', 'Контакти', 'Статус', 'API'],
    'Правова': ['Конфіденційність', 'Умови', 'Cookies'],
  }
  return (
    <footer style={{ background: INK, padding: '60px max(24px, calc((100vw - 1200px)/2 + 24px)) 36px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr repeat(4, 1fr)', gap: 40, marginBottom: 48 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${P}, ${PD})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: W, fontWeight: 900, fontSize: 17 }}>L</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 17, color: W }}>Lumo.ua</span>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.65, color: 'rgba(255,255,255,0.45)', maxWidth: 200 }}>
            Нова соціальна мережа України. Спілкуйтесь, шукайте, продавайте.
          </p>
          <div style={{ marginTop: 16, display: 'flex', gap: 6, alignItems: 'center' }}>
            <span>🇺🇦</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Зроблено в Україні</span>
          </div>
        </div>
        {Object.entries(cols).map(([section, items]) => (
          <div key={section}>
            <div style={{ fontSize: 13, fontWeight: 600, color: W, marginBottom: 14 }}>{section}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {items.map(item => (
                <a key={item} href="#" style={{ fontSize: 13, color: 'rgba(255,255,255,0.42)', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = W}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.42)'}
                >{item}</a>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
        <span>© 2024 Lumo UA. Всі права захищені.</span>
        <span>Зроблено з ❤️ для України</span>
      </div>
    </footer>
  )
}

function HomePage({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <>
      <HeroSection setPage={setPage} />
      <FeaturesSection />
      <StatsSection />
      <PreviewSection setPage={setPage} />
      <CtaSection />
      <FooterSection />
    </>
  )
}

// ─── Feed Page ────────────────────────────────────────────────────────────────

const feedPosts = [
  { user: 'Олена Коваленко', handle: '@olena_k', avatar: 'О', color: P, text: 'Сьогодні нарешті вийшло сонце у Львові! Перша кава на терасі за місяць ☀️☕', likes: 247, comments: 18, time: '5 хв', img: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&h=480&fit=crop&auto=format' },
  { user: 'Іван Мельник', handle: '@ivan.dev', avatar: 'І', color: '#5856D6', text: 'Запустили новий проект на React + TypeScript. Шукаємо бета-тестерів для тестування MVP 🚀 Пишіть в особисті!', likes: 134, comments: 41, time: '22 хв' },
  { user: 'Марія Бойко', handle: '@maria_boiko', avatar: 'М', color: '#FF9500', text: 'Продам велосипед Trek FX3 у відмінному стані. Київ, Поділ. 8 500 грн 🚲 Торг доречний.', likes: 23, comments: 7, time: '1 год', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=480&fit=crop&auto=format' },
  { user: 'Дмитро Шевченко', handle: '@dmytro_photo', avatar: 'Д', color: '#34C759', text: 'Нові фото з Карпат! Похід тривав 5 днів, пройшли 82 км. Неймовірно красиво 🏔️', likes: 512, comments: 64, time: '2 год', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=480&fit=crop&auto=format' },
]

function PostCard({ user, handle, avatar, color, text, likes, comments, time, img }: typeof feedPosts[0]) {
  const [liked, setLiked] = useState(false)
  return (
    <div style={{ background: W, borderRadius: 20, border: `1px solid ${BDR}`, marginBottom: 16, overflow: 'hidden' }}>
      <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar letter={avatar} size={44} color={color} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: INK }}>{user}</div>
          <div style={{ fontSize: 13, color: MUTED }}>{handle} · {time}</div>
        </div>
      </div>
      <div style={{ padding: '0 16px 14px', fontSize: 15, color: INK, lineHeight: 1.65 }}>{text}</div>
      {img && (
        <div style={{ position: 'relative', paddingTop: '55%', background: SURF }}>
          <img src={img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 20, borderTop: `1px solid ${BDR}` }}>
        <button onClick={() => setLiked(!liked)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: liked ? '#FF3B30' : MUTED, padding: 0, fontSize: 14, fontWeight: 500 }}>
          <div style={{ width: 20, height: 20 }}><IcoHeart filled={liked} /></div>
          {likes + (liked ? 1 : 0)}
        </button>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: MUTED, padding: 0, fontSize: 14, fontWeight: 500 }}>
          <div style={{ width: 20, height: 20 }}><IcoMsg /></div>
          {comments}
        </button>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: MUTED, padding: 0, marginLeft: 'auto', fontSize: 14 }}>
          <div style={{ width: 20, height: 20 }}><IcoShare /></div>
        </button>
      </div>
    </div>
  )
}

function FeedPage() {
  const stories = ['О', 'І', 'М', 'Д', 'К', 'А', 'Н']
  const colors = [P, '#5856D6', '#FF9500', '#34C759', '#FF3B30', P, '#FF9500']
  return (
    <div style={{ paddingTop: 60, maxWidth: 680, margin: '0 auto', padding: '80px 16px 48px' }}>
      {/* Stories */}
      <div style={{ display: 'flex', gap: 14, paddingBottom: 20, overflowX: 'auto', borderBottom: `1px solid ${BDR}`, marginBottom: 20 }}>
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
          <div style={{ width: 62, height: 62, borderRadius: '50%', border: `2px dashed ${BDR}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 22, height: 22, color: MUTED }}><IcoPlus /></div>
          </div>
          <span style={{ fontSize: 11, color: MUTED }}>Ваша</span>
        </div>
        {stories.map((l, i) => (
          <div key={i} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
            <div style={{ width: 62, height: 62, borderRadius: '50%', border: `2.5px solid ${P}`, padding: 2.5 }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: `linear-gradient(135deg, ${colors[i]}, ${colors[i]}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: W, fontWeight: 700, fontSize: 22 }}>{l}</span>
              </div>
            </div>
            <span style={{ fontSize: 11, color: INK }}>Користувач</span>
          </div>
        ))}
      </div>
      {feedPosts.map((post, i) => <PostCard key={i} {...post} />)}
    </div>
  )
}

// ─── Messages Page ────────────────────────────────────────────────────────────

const convos = [
  { name: 'Андрій Петренко', msg: 'Зустрічаємось о 18:00 біля метро?', time: '12:34', unread: 3, online: true, color: '#5856D6' },
  { name: 'Оксана Лисенко', msg: 'Підтверджую замовлення! Дякую 🙏', time: '11:20', unread: 0, online: false, color: '#FF9500' },
  { name: 'Команда Lumo', msg: 'Ласкаво просимо до Lumo!', time: 'вчора', unread: 1, online: true, color: P },
  { name: 'Дмитро Шевченко', msg: 'Надішліть фото товару будь ласка', time: 'вчора', unread: 0, online: false, color: '#34C759' },
  { name: 'Марія Бойко', msg: 'Чудово! Домовились 👍', time: 'пн', unread: 0, online: false, color: '#FF3B30' },
  { name: 'Новини UA', msg: 'Канал: 5 нових публікацій', time: 'пн', unread: 5, online: true, color: '#FF9500' },
  { name: 'Катерина В.', msg: 'Дякую за швидку доставку!', time: 'нд', unread: 0, online: false, color: '#5856D6' },
]

function MessagesPage({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '80px 0 48px' }}>
      <div style={{ padding: '0 24px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: INK, letterSpacing: -1 }}>Повідомлення</h1>
        <button style={{ background: P, border: 'none', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: W }}>
          <div style={{ width: 18, height: 18 }}><IcoPlus /></div>
        </button>
      </div>
      <div style={{ padding: '0 24px 16px' }}>
        <div style={{ background: SURF, borderRadius: 12, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 18, height: 18, color: MUTED }}><IcoSearch /></div>
          <span style={{ fontSize: 15, color: MUTED }}>Пошук</span>
        </div>
      </div>
      {convos.map((c, i) => (
        <div key={i} onClick={() => setPage('chat')}
          style={{ padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', borderBottom: `1px solid ${BDR}`, transition: 'background 0.1s' }}
          onMouseEnter={e => e.currentTarget.style.background = SURF}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Avatar letter={c.name[0]} size={52} color={c.color} online={c.online} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: INK }}>{c.name}</span>
              <span style={{ fontSize: 13, color: MUTED }}>{c.time}</span>
            </div>
            <span style={{ fontSize: 14, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{c.msg}</span>
          </div>
          {c.unread > 0 && (
            <div style={{ background: P, color: W, borderRadius: 12, minWidth: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, padding: '0 7px', flexShrink: 0 }}>
              {c.unread}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Chat Page ────────────────────────────────────────────────────────────────

type Msg = { text: string; mine: boolean; time: string }

function ChatPage({ setPage }: { setPage: (p: Page) => void }) {
  const [input, setInput] = useState('')
  const [msgs, setMsgs] = useState<Msg[]>([
    { text: 'Привіт! Як справи?', mine: false, time: '12:30' },
    { text: 'Чудово, дякую! А ти як?', mine: true, time: '12:31' },
    { text: 'Теж добре. Слухай, ти вже бачив нову функцію в Lumo? Тепер можна продавати товари прямо в чаті!', mine: false, time: '12:32' },
    { text: 'Так, дуже зручно! Продав старий ноут за 3 дні 😄', mine: true, time: '12:33' },
    { text: 'Серйозно?! Треба спробувати. До речі, зустрічаємось о 18:00 біля метро?', mine: false, time: '12:34' },
  ])

  const send = () => {
    if (!input.trim()) return
    setMsgs(prev => [...prev, { text: input, mine: true, time: 'зараз' }])
    setInput('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: 760, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ position: 'fixed', top: 60, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 760, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${BDR}`, padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 14, zIndex: 200 }}>
        <button onClick={() => setPage('messages')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P, display: 'flex', alignItems: 'center', padding: 0 }}>
          <div style={{ width: 26, height: 26 }}><IcoBack /></div>
        </button>
        <Avatar letter="А" size={44} color="#5856D6" online />
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: INK }}>Андрій Петренко</div>
          <div style={{ fontSize: 13, color: '#34C759' }}>онлайн</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '148px 24px 90px' }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.mine ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
            <div style={{ maxWidth: '72%', background: m.mine ? P : SURF, color: m.mine ? W : INK, borderRadius: m.mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px', padding: '11px 15px' }}>
              <div style={{ fontSize: 15, lineHeight: 1.55 }}>{m.text}</div>
              <div style={{ fontSize: 11, color: m.mine ? 'rgba(255,255,255,0.6)' : MUTED, marginTop: 4, textAlign: 'right' }}>{m.time}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 760, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderTop: `1px solid ${BDR}`, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Повідомлення..." style={{ flex: 1, background: SURF, border: 'none', borderRadius: 22, padding: '11px 16px', fontSize: 15, color: INK, outline: 'none', fontFamily: 'inherit' }} />
        <button onClick={send} style={{ width: 44, height: 44, borderRadius: '50%', background: P, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: W, flexShrink: 0 }}>
          <div style={{ width: 20, height: 20 }}><IcoSend /></div>
        </button>
      </div>
    </div>
  )
}

// ─── Marketplace Page ─────────────────────────────────────────────────────────

const mktItems = [
  { title: 'iPhone 15 Pro 256GB', price: '42 000 ₴', loc: 'Київ', time: '5 хв', img: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&h=600&fit=crop&auto=format', badge: 'Нове' },
  { title: 'Велосипед Trek FX3', price: '8 500 ₴', loc: 'Львів', time: '20 хв', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop&auto=format', badge: null },
  { title: 'Sony WH-1000XM5', price: '6 200 ₴', loc: 'Одеса', time: '1 год', img: 'https://images.unsplash.com/photo-1545127398-14699f92334b?w=600&h=600&fit=crop&auto=format', badge: 'Топ' },
  { title: 'MacBook Air M2', price: '58 000 ₴', loc: 'Харків', time: '2 год', img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=600&fit=crop&auto=format', badge: null },
  { title: 'Шкіряна куртка XL', price: '3 800 ₴', loc: 'Дніпро', time: '3 год', img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=600&fit=crop&auto=format', badge: null },
  { title: 'Книги з дизайну (15 шт)', price: '1 500 ₴', loc: 'Київ', time: '5 год', img: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&h=600&fit=crop&auto=format', badge: 'Знижка' },
]

function MktCard({ title, price, loc, time, img, badge }: typeof mktItems[0]) {
  const [hov, setHov] = useState(false)
  const badgeColor = badge === 'Нове' ? P : badge === 'Топ' ? '#FF9500' : badge === 'Знижка' ? '#34C759' : P
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: W, borderRadius: 18, border: `1px solid ${BDR}`, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s', transform: hov ? 'translateY(-3px)' : 'none', boxShadow: hov ? '0 12px 32px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      <div style={{ position: 'relative', paddingTop: '75%', background: SURF }}>
        <img src={img} alt={title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        {badge && <div style={{ position: 'absolute', top: 10, left: 10, background: badgeColor, color: W, borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{badge}</div>}
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: INK, marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 8 }}>{price}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: MUTED, fontSize: 13 }}>
          <div style={{ width: 14, height: 14 }}><IcoPin /></div>
          <span>{loc} · {time}</span>
        </div>
      </div>
    </div>
  )
}

function MarketplacePage() {
  const [cat, setCat] = useState('Всі')
  const cats = ['Всі', 'Електроніка', 'Транспорт', 'Одяг', 'Дім', 'Книги']
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px 48px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: INK, letterSpacing: -1, marginBottom: 8 }}>Маркетплейс</h1>
        <p style={{ fontSize: 16, color: MUTED }}>Купуй і продавай без комісії по всій Україні</p>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <div style={{ flex: 1, background: SURF, borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 20, height: 20, color: MUTED }}><IcoSearch /></div>
          <span style={{ fontSize: 15, color: MUTED }}>Пошук товарів...</span>
        </div>
        <button style={{ background: P, color: W, border: 'none', borderRadius: 14, padding: '0 22px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Продати</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, overflowX: 'auto', paddingBottom: 4 }}>
        {cats.map(c => (
          <button key={c} onClick={() => setCat(c)} style={{ background: cat === c ? P : SURF, color: cat === c ? W : INK, border: 'none', borderRadius: 100, padding: '8px 18px', fontSize: 14, fontWeight: 500, cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' }}>
            {c}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 16 }}>
        {mktItems.map((item, i) => <MktCard key={i} {...item} />)}
      </div>
    </div>
  )
}

// ─── Profile Page ─────────────────────────────────────────────────────────────

function ProfilePage() {
  const [tab, setTab] = useState<'posts' | 'market' | 'about'>('posts')
  const imgs = [
    'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&h=400&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=400&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop&auto=format',
  ]
  const likes = [247, 512, 89, 134, 67, 203]

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 0 48px' }}>
      {/* Cover */}
      <div style={{ height: 180, position: 'relative', overflow: 'hidden', background: `${P}12` }}>
        <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=220&fit=crop&auto=format" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }} />
      </div>

      <div style={{ padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
          <div style={{ width: 90, height: 90, borderRadius: '50%', marginTop: -45, background: `linear-gradient(135deg, ${P}, ${PD})`, border: '4px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
            <span style={{ color: W, fontWeight: 800, fontSize: 36 }}>О</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ background: SURF, color: INK, border: 'none', padding: '8px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Редагувати</button>
            <button style={{ background: P, color: W, border: 'none', padding: '8px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Підписатись</button>
          </div>
        </div>

        <h2 style={{ fontSize: 24, fontWeight: 800, color: INK, marginBottom: 4, letterSpacing: -0.5 }}>Олена Коваленко</h2>
        <p style={{ fontSize: 15, color: MUTED, marginBottom: 4 }}>@olena_k</p>
        <p style={{ fontSize: 15, color: INK, marginBottom: 18, lineHeight: 1.55 }}>
          Дизайнер та фотограф 📷 Люблю Карпати та добру каву ☕<br />Київ 🇺🇦
        </p>

        <div style={{ display: 'flex', gap: 32, marginBottom: 26 }}>
          {[['247', 'Публікацій'], ['3.4K', 'Підписники'], ['512', 'Підписки']].map(([v, l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: INK }}>{v}</div>
              <div style={{ fontSize: 13, color: MUTED }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${BDR}`, marginBottom: 20 }}>
          {[['posts', IcoGrid, 'Публікації'], ['market', IcoTag, 'Маркет'], ['about', IcoUsers, 'Про мене']].map(([id, Icon, label]) => (
            <button key={id} onClick={() => setTab(id as any)} style={{ flex: 1, background: 'none', border: 'none', padding: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 14, fontWeight: tab === id ? 600 : 400, color: tab === id ? P : MUTED, borderBottom: `2px solid ${tab === id ? P : 'transparent'}`, cursor: 'pointer', transition: 'all 0.15s' }}>
              <div style={{ width: 17, height: 17 }}><Icon /></div>
              {label}
            </button>
          ))}
        </div>

        {tab === 'posts' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
            {imgs.map((src, i) => (
              <div key={i} style={{ position: 'relative', paddingTop: '100%', borderRadius: 4, overflow: 'hidden', cursor: 'pointer' }}>
                <img src={src} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                <div
                  style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.42)'; (e.currentTarget.lastElementChild as HTMLElement).style.opacity = '1' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0)'; (e.currentTarget.lastElementChild as HTMLElement).style.opacity = '0' }}
                >
                  <div style={{ color: W, display: 'flex', alignItems: 'center', gap: 5, opacity: 0, transition: 'opacity 0.2s', fontWeight: 700, fontSize: 14 }}>
                    <div style={{ width: 18, height: 18 }}><IcoHeart /></div>
                    {likes[i]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'market' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {[
              { title: 'Книги з дизайну', price: '450 ₴', img: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=300&fit=crop&auto=format' },
              { title: 'Фотоапарат Sony A7', price: '18 000 ₴', img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop&auto=format' },
            ].map((item, i) => (
              <div key={i} style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${BDR}`, cursor: 'pointer' }}>
                <div style={{ paddingTop: '65%', position: 'relative', background: SURF }}>
                  <img src={item.img} alt={item.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: 14 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: INK, marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>{item.price}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'about' && (
          <div>
            {[['Місто', 'Київ, Україна'], ['Робота', 'UI/UX Designer at TechUA'], ['Приєднався', 'Грудень 2023'], ['Сайт', 'olena-design.ua']].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', padding: '14px 0', borderBottom: `1px solid ${BDR}` }}>
                <span style={{ width: 120, fontSize: 14, color: MUTED, flexShrink: 0 }}>{l}</span>
                <span style={{ fontSize: 14, color: INK }}>{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<Page>('home')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [page])

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <div style={{ fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif", background: W, color: INK, minHeight: '100vh' }}>
      <Nav page={page} setPage={setPage} scrolled={scrolled} />
      {page === 'home' && <HomePage setPage={setPage} />}
      {page === 'feed' && <FeedPage />}
      {page === 'messages' && <MessagesPage setPage={setPage} />}
      {page === 'chat' && <ChatPage setPage={setPage} />}
      {page === 'marketplace' && <MarketplacePage />}
      {page === 'profile' && <ProfilePage />}
    </div>
  )
}
