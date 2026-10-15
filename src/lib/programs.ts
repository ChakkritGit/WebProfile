import type { Locale } from '@/i18n/routing'

/** The apps I run, listed on the home page (components/home/program-list.tsx). */
export interface Program {
  id: string
  name: Record<Locale, string>
  url: string
  /** a 192px icon in public/apps/, or none for a glyph tile */
  icon?: string
  about: Record<Locale, string>
  stack: string[]
}

export const PROGRAMS: Program[] = [
  {
    id: 'thai-weather',
    name: { th: 'ฟ้าละเอียด', en: 'Thai Weather HD', ja: 'タイ天気HD' },
    url: 'https://thai-weather.chakkritton.com',
    icon: '/apps/thai-weather.png',
    about: {
      th: 'พยากรณ์อากาศความละเอียด 2 กม. ทั่วประเทศไทย พร้อมเรดาร์ฝนและแจ้งเตือนพายุ',
      en: '2 km weather forecasts for all of Thailand, with rain radar and storm alerts',
      ja: 'タイ全土の2km解像度の天気予報。雨雲レーダーと嵐の通知つき',
    },
    stack: ['Next.js', 'FastAPI', 'MapLibre'],
  },
  {
    id: 'spent-cost',
    name: { th: 'Spent/Cost', en: 'Spent/Cost', ja: 'Spent/Cost' },
    url: 'https://expenses.chakkritton.com',
    icon: '/apps/spent-cost.png',
    about: {
      th: 'บันทึกรายจ่าย ผ่อน และหนี้ เดือนต่อเดือน แจ้งเตือนก่อนครบกำหนด',
      en: 'Monthly spending, installments and debts, with a reminder before each is due',
      ja: '毎月の支出・分割払い・借金の記録。期日前に通知',
    },
    stack: ['Next.js', 'PostgreSQL', 'Web Push'],
  },
  {
    id: 'whiteboard',
    name: { th: 'Whiteboard', en: 'Whiteboard', ja: 'ホワイトボード' },
    url: 'https://whiteboard.chakkritton.com',
    icon: '/apps/whiteboard.png',
    about: {
      th: 'ไวท์บอร์ดออนไลน์ วาดและแปะโน้ตร่วมกันแบบเรียลไทม์ ไม่ต้องสมัคร',
      en: 'An online whiteboard to draw and pin notes together in real time, no sign-up',
      ja: '登録不要、リアルタイムで一緒に描けるオンラインホワイトボード',
    },
    stack: ['Next.js', 'Yjs', 'Bun'],
  },
  {
    id: 'drive-music',
    name: { th: 'Drive Music', en: 'Drive Music', ja: 'Drive Music' },
    url: 'https://drive-music.chakkritton.com',
    icon: '/apps/drive-music.png',
    about: {
      th: 'เล่นเพลงจาก Google Drive ฟังออฟไลน์ได้ และต่อเพลงแบบดีเจ',
      en: 'Your Google Drive music, offline and mixed like a DJ',
      ja: 'Google Driveの音楽をオフラインで、DJのようにつないで再生',
    },
    stack: ['Next.js', 'IndexedDB', 'Party Play'],
  },
  {
    id: 'status',
    name: { th: 'สถานะระบบ', en: 'Status', ja: 'ステータス' },
    url: 'https://status.chakkritton.com',
    about: {
      th: 'ทุกแอปข้างบนทำงานปกติไหม ตรวจทุก 5 นาที ย้อนหลัง 90 วัน',
      en: 'Whether every app above is up, checked every 5 minutes, 90 days back',
      ja: '上のアプリが正常か、5分ごとに確認。90日分の履歴',
    },
    stack: ['Bun', 'Elysia'],
  },
]
