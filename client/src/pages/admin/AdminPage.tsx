import { Link } from 'react-router-dom'

const STAT_CARDS = [
  { label: '1:1문의', value: '152', tone: 'dark' as const },
  { label: '공지사항', value: '20', tone: 'primary' as const },
  { label: 'FAQ', value: '3', tone: 'blue' as const },
  { label: '입점관리', value: '7', tone: 'muted' as const },
]

const LIST_SECTIONS = [
  {
    title: '공지사항 관리',
    items: [
      { text: '공지사항 제목이 출력되는 공간입니다.', date: '2018-03-01' },
      { text: '공지사항 제목이 출력되는 공간입니다.', date: '2018-03-01' },
      { text: '공지사항 제목이 출력되는 공간입니다.', date: '2018-03-01' },
      { text: '공지사항 제목이 출력되는 공간입니다.', date: '2018-03-01' },
      { text: '공지사항 제목이 출력되는 공간입니다.', date: '2018-03-01' },
    ],
  },
  {
    title: '이벤트 관리',
    items: [
      { text: '이벤트 제목이 출력되는 공간입니다.', date: '2018-03-01' },
      { text: '이벤트 제목이 출력되는 공간입니다.', date: '2018-03-01' },
      { text: '이벤트 제목이 출력되는 공간입니다.', date: '2018-03-01' },
      { text: '이벤트 제목이 출력되는 공간입니다.', date: '2018-03-01' },
      { text: '이벤트 제목이 출력되는 공간입니다.', date: '2018-03-01' },
    ],
  },
  {
    title: '채용 관리',
    items: [
      { text: '채용 제목이 출력되는 공간입니다.', date: '2018-03-01' },
      { text: '채용 제목이 출력되는 공간입니다.', date: '2018-03-01' },
      { text: '채용 제목이 출력되는 공간입니다.', date: '2018-03-01' },
      { text: '채용 제목이 출력되는 공간입니다.', date: '2018-03-01' },
      { text: '채용 제목이 출력되는 공간입니다.', date: '2018-03-01' },
    ],
  },
]

const MEMBER_ROWS = [
  {
    period: '오늘',
    total: '1,200',
    visitors: '120',
    signups: '10',
    loggedIn: '50',
    withdrawn: '2',
  },
  {
    period: '이번달',
    total: '1,200',
    visitors: '120',
    signups: '10',
    loggedIn: '50',
    withdrawn: '2',
  },
]

const CHART_POINTS = [40, 55, 45, 70, 60, 85, 75]

const CALENDAR_DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

export function AdminPage() {
  return (
    <main className="admin-main">
      <p className="admin-breadcrumb">Home &gt; Dashboard</p>
      <div className="admin-page-head">
        <h1 className="admin-title">Dashboard</h1>
        <div className="admin-page-head__actions">
          <Link to="/admin/orders" className="admin-btn admin-btn--primary">
            주문 관리
          </Link>
          <Link to="/admin/products/new" className="admin-btn">
            새 상품 등록하기
          </Link>
        </div>
      </div>

      <div className="admin-stats">
        {STAT_CARDS.map((card) => (
          <article key={card.label} className={`admin-stat admin-stat--${card.tone}`}>
            <p className="admin-stat__label">{card.label}</p>
            <p className="admin-stat__value">{card.value}</p>
            <div className="admin-stat__foot">
              <span>12:00 Update</span>
              <button type="button" aria-label="새로고침">
                ↻
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="admin-panels">
        <section className="admin-panel admin-panel--chart">
          <h2 className="admin-panel__title">주간방문자 수</h2>
          <div className="admin-chart" role="img" aria-label="주간 방문자 수 차트">
            <svg viewBox="0 0 400 160" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="var(--admin-burgundy)"
                strokeWidth="3"
                points={CHART_POINTS.map((y, i) => {
                  const x = (i / (CHART_POINTS.length - 1)) * 380 + 10
                  const py = 150 - y
                  return `${x},${py}`
                }).join(' ')}
              />
              {CHART_POINTS.map((y, i) => {
                const x = (i / (CHART_POINTS.length - 1)) * 380 + 10
                const py = 150 - y
                return (
                  <circle key={i} cx={x} cy={py} r="4" fill="var(--admin-burgundy)" />
                )
              })}
            </svg>

            <div className="admin-chart__labels">
              {['월', '화', '수', '목', '금', '토', '일'].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="admin-panel admin-panel--calendar">
          <h2 className="admin-panel__title">일정</h2>
          <div className="admin-calendar">
            <div className="admin-calendar__head">2018년 3월</div>
            <div className="admin-calendar__weekdays">
              {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="admin-calendar__grid">
              <span />
              <span />
              <span />
              {CALENDAR_DAYS.map((day) => (
                <span
                  key={day}
                  className={day === 14 ? 'admin-calendar__day--active' : undefined}
                >
                  {day}
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="admin-lists">
        {LIST_SECTIONS.map((section) => (
          <section key={section.title} className="admin-list-panel">
            <h2 className="admin-list-panel__title">{section.title}</h2>
            <ul>
              {section.items.map((item, i) => (
                <li key={`${section.title}-${i}`}>
                  <span>{item.text}</span>
                  <time>{item.date}</time>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="admin-table-section">
        <h2 className="admin-table-section__title">회원현황</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th scope="col" />
              <th scope="col">총 회원수</th>
              <th scope="col">방문자</th>
              <th scope="col">신규가입</th>
              <th scope="col">로그인 회원</th>
              <th scope="col">탈퇴 회원</th>
            </tr>
          </thead>
          <tbody>
            {MEMBER_ROWS.map((row) => (
              <tr key={row.period}>
                <th scope="row">{row.period}</th>
                <td>{row.total}</td>
                <td>{row.visitors}</td>
                <td>{row.signups}</td>
                <td>{row.loggedIn}</td>
                <td>{row.withdrawn}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}
