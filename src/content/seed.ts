/**
 * Bundled seed content.
 *
 * Two jobs, one source of truth:
 *  1. `prisma/seed.ts` upserts these rows into Supabase.
 *  2. `src/lib/content.ts` serves them verbatim whenever the database is
 *     unset or unreachable, so the site always renders.
 *
 * Every entry exists twice — once per locale — paired by `translationKey`.
 * Slugs are shared across locales (the DB unique key is `[slug, locale]`),
 * which keeps URLs stable when the reader switches language.
 */

import type { PostRecord, ProjectRecord } from '@/lib/content-types'
import type { EditorBlock, EditorDocument } from '@/lib/editor'

const EDITOR_VERSION = '2.31.0'

/** Fixed timestamp so re-seeding produces byte-identical JSON. */
const AUTHORED_AT = Date.parse('2025-08-01T00:00:00.000Z')

/* --------------------------- block builders --------------------------- */
/* Shapes mirror Editor.js 2.3x output exactly — the renderer reads these
   straight out of the `content` JSON column, so they must not drift. */

const h2 = (text: string): EditorBlock => ({ type: 'header', data: { text, level: 2 } })
const h3 = (text: string): EditorBlock => ({ type: 'header', data: { text, level: 3 } })
const para = (text: string): EditorBlock => ({ type: 'paragraph', data: { text } })

/** @editorjs/list v2 nested-list item. */
const li = (content: string) => ({ content, meta: {}, items: [] })

const ul = (items: string[]): EditorBlock => ({
  type: 'list',
  data: { style: 'unordered', items: items.map(li) },
})

const ol = (items: string[]): EditorBlock => ({
  type: 'list',
  data: { style: 'ordered', items: items.map(li) },
})

const todo = (items: Array<[string, boolean]>): EditorBlock => ({
  type: 'checklist',
  data: { items: items.map(([text, checked]) => ({ text, checked })) },
})

const quote = (text: string, caption: string): EditorBlock => ({
  type: 'quote',
  data: { text, caption, alignment: 'left' },
})

/** Lines are joined rather than written as a template literal so indentation
 *  in this file never leaks into the rendered code block. */
const code = (lines: string[]): EditorBlock => ({
  type: 'code',
  data: { code: lines.join('\n') },
})

const hr = (): EditorBlock => ({ type: 'delimiter', data: {} })

const table = (content: string[][], withHeadings = true): EditorBlock => ({
  type: 'table',
  data: { withHeadings, content },
})

/**
 * Wrap blocks into a document, stamping short deterministic ids.
 * `prefix` is unique per row, so ids are unique across the whole seed set.
 */
function doc(prefix: string, blocks: EditorBlock[]): EditorDocument {
  return {
    time: AUTHORED_AT,
    version: EDITOR_VERSION,
    blocks: blocks.map((block, index) => ({ ...block, id: `${prefix}${index + 1}` })),
  }
}

/* ============================== projects ============================== */
/* All three were built at Thanes Development Co., Ltd. They are internal
   hospital systems, so there is no public live URL or repository. */

export const seedProjects: ProjectRecord[] = [
  /* ------------------------------ SMTrack+ ------------------------------ */
  {
    id: 'seed-project-smtrack-th',
    slug: 'smtrack-plus',
    locale: 'th',
    translationKey: 'smtrack',
    title: 'SMTrack+',
    summary:
      'ระบบติดตามอุณหภูมิตู้ยาในโรงพยาบาลแบบเรียลไทม์ แจ้งเตือนผ่าน WebSocket และเชื่อมต่ออุปกรณ์ IOT ด้วย MQTT',
    coverImage: null,
    content: doc('sm-th-', [
      h2('ภาพรวมของระบบ'),
      para(
        '<b>SMTrack+</b> คือระบบติดตามอุณหภูมิตู้เก็บยาในโรงพยาบาล ที่ทำงานร่วมกับ RESTful API ของฝั่งเซิร์ฟเวอร์ ตัวเว็บแอปพัฒนาด้วยเทคโนโลยีฝั่งหน้าบ้านสมัยใหม่ พร้อมวางระบบ <i>state management</i> ไว้ตั้งแต่ต้น เพราะข้อมูลที่ไหลเข้ามาไม่ได้มาเป็นครั้งคราว แต่มาต่อเนื่องจากอุปกรณ์หลายสิบตัวพร้อมกัน',
      ),
      h3('เส้นทางของข้อมูลแบบเรียลไทม์'),
      ul([
        'อุปกรณ์ฝังตัวภายในตู้ยาอ่านค่าอุณหภูมิและความชื้น แล้วส่งขึ้น MQTT broker ตาม topic ประจำเครื่องของตัวเอง',
        'ฝั่งเซิร์ฟเวอร์ subscribe ทุก topic บันทึกค่าลง PostgreSQL และตรวจว่าค่าที่ได้หลุดกรอบที่ตั้งไว้หรือไม่',
        'เมื่อพบความผิดปกติ เซิร์ฟเวอร์จะ broadcast ผ่าน <code class="inline-code">WebSocket</code> ไปยังหน้าจอที่เปิดค้างอยู่ทันที ผู้ใช้ไม่ต้องกดรีเฟรชเอง',
        'หน้าเว็บเก็บค่าล่าสุดไว้ใน store กลาง กราฟ การ์ดสรุป และรายการแจ้งเตือนจึงอ่านจากแหล่งเดียวกันเสมอ',
      ]),
      code([
        "client.subscribe('smtrack/+/temperature', { qos: 1 })",
        '',
        "client.on('message', (topic, payload) => {",
        "  const deviceId = topic.split('/')[1]",
        '  const reading = JSON.parse(payload.toString())',
        '',
        '  void readings.save(deviceId, reading)',
        "  if (readings.isOutOfRange(reading)) gateway.emit('alert', { deviceId, reading })",
        '})',
      ]),
      quote(
        'ระบบแจ้งเตือนที่มาช้าไปห้านาที แทบไม่ต่างจากการไม่มีระบบแจ้งเตือนเลย',
        'บทเรียนจากการติดตั้งใช้งานจริงในหอผู้ป่วย',
      ),
      hr(),
      h3('การส่งมอบและการดูแลระบบ'),
      ol([
        'ตั้งค่า <b>GitHub Actions</b> ให้ build และ deploy อัตโนมัติทุกครั้งที่ merge เข้า branch หลัก',
        'แยก environment ของ staging กับ production ออกจากกัน เพื่อให้ทดสอบได้ก่อนขึ้นใช้งานจริง',
        'เก็บ log ของอุปกรณ์ที่หลุดการเชื่อมต่อไว้ต่างหาก ทำให้ไล่ปัญหาหน้างานได้เร็วขึ้นมาก',
      ]),
      table([
        ['ส่วนประกอบ', 'เทคโนโลยี', 'หน้าที่'],
        ['เว็บแอป', 'Next.js + TypeScript', 'แดชบอร์ด กราฟย้อนหลัง และการตั้งค่าอุปกรณ์'],
        ['API', 'NestJS + PostgreSQL', 'จัดเก็บค่าที่วัดได้และตรรกะการแจ้งเตือน'],
        ['อุปกรณ์', 'MQTT', 'ส่งค่าจากเซนเซอร์ในตู้ยาขึ้นมาที่ broker'],
        ['การแจ้งเตือน', 'WebSocket', 'ผลักข้อมูลขึ้นหน้าจอผู้ใช้แบบทันที'],
      ]),
    ]),
    tags: ['Next.js', 'TypeScript', 'WebSocket', 'MQTT', 'IoT'],
    status: 'PUBLISHED',
    featured: true,
    publishedAt: '2025-01-15T09:00:00.000Z',
    updatedAt: '2025-07-28T10:30:00.000Z',
    role: 'ดูแลหน้าบ้านหลักและพัฒนา API',
    stack: [
      'Next.js',
      'React',
      'TypeScript',
      'Tailwind CSS',
      'NestJS',
      'PostgreSQL',
      'MQTT',
      'WebSocket',
      'GitHub Actions',
    ],
    year: 2024,
    liveUrl: null,
    repoUrl: null,
    sortOrder: 0,
  },
  {
    id: 'seed-project-smtrack-en',
    slug: 'smtrack-plus',
    locale: 'en',
    translationKey: 'smtrack',
    title: 'SMTrack+',
    summary:
      'Real-time temperature monitoring for hospital medicine cabinets, with WebSocket alerts and MQTT-connected devices.',
    coverImage: null,
    content: doc('sm-en-', [
      h2('What the system does'),
      para(
        '<b>SMTrack+</b> monitors the temperature of medicine cabinets across a hospital and reports on it through a set of RESTful APIs. The web client is built with a modern front-end stack, and state management was part of the design from day one — readings do not trickle in, they stream continuously from dozens of cabinets at once.',
      ),
      h3('How a reading reaches the screen'),
      ul([
        'An embedded device inside each cabinet samples temperature and humidity, then publishes to its own MQTT topic.',
        'The server subscribes to every topic, persists each reading to PostgreSQL, and checks it against the configured safe range.',
        'When a reading falls out of range the server broadcasts over <code class="inline-code">WebSocket</code>, so any dashboard already open updates itself — nobody has to refresh.',
        'The client keeps the latest values in one store, so the charts, the summary cards and the alert list can never disagree with each other.',
      ]),
      code([
        "client.subscribe('smtrack/+/temperature', { qos: 1 })",
        '',
        "client.on('message', (topic, payload) => {",
        "  const deviceId = topic.split('/')[1]",
        '  const reading = JSON.parse(payload.toString())',
        '',
        '  void readings.save(deviceId, reading)',
        "  if (readings.isOutOfRange(reading)) gateway.emit('alert', { deviceId, reading })",
        '})',
      ]),
      quote(
        'An alert that arrives five minutes late is barely different from having no alerting at all.',
        'Lesson from the first ward rollout',
      ),
      hr(),
      h3('Shipping and keeping it running'),
      ol([
        'Configured <b>GitHub Actions</b> to build and deploy automatically on every merge into the main branch.',
        'Kept staging and production on separate environments so changes are exercised before they reach a live ward.',
        'Logged device disconnects separately from application errors, which cut on-site debugging time considerably.',
      ]),
      table([
        ['Layer', 'Technology', 'Responsibility'],
        ['Web app', 'Next.js + TypeScript', 'Dashboard, history charts, device configuration'],
        ['API', 'NestJS + PostgreSQL', 'Reading storage and alerting rules'],
        ['Devices', 'MQTT', 'Publish sensor readings from inside each cabinet'],
        ['Alerts', 'WebSocket', 'Push state changes to open dashboards instantly'],
      ]),
    ]),
    tags: ['Next.js', 'TypeScript', 'WebSocket', 'MQTT', 'IoT'],
    status: 'PUBLISHED',
    featured: true,
    publishedAt: '2025-01-15T09:00:00.000Z',
    updatedAt: '2025-07-28T10:30:00.000Z',
    role: 'Front-end lead & API development',
    stack: [
      'Next.js',
      'React',
      'TypeScript',
      'Tailwind CSS',
      'NestJS',
      'PostgreSQL',
      'MQTT',
      'WebSocket',
      'GitHub Actions',
    ],
    year: 2024,
    liveUrl: null,
    repoUrl: null,
    sortOrder: 0,
  },

  /* --------------------------- Conhis System --------------------------- */
  {
    id: 'seed-project-conhis-th',
    slug: 'conhis-system',
    locale: 'th',
    translationKey: 'conhis',
    title: 'Conhis System',
    summary:
      'แพลตฟอร์มบริหารจัดการที่สร้างด้วย Next.js, React และ TypeScript พร้อมระบบย่อย LGS สถานีนำทางด้วยแสง',
    coverImage: null,
    content: doc('co-th-', [
      h2('ภาพรวมของแพลตฟอร์ม'),
      para(
        '<b>Conhis System</b> เป็นแพลตฟอร์มบริหารจัดการที่พัฒนาด้วย <b>Next.js</b>, <b>React</b> และ <b>TypeScript</b> โดยออกแบบส่วนติดต่อผู้ใช้ให้ตอบสนองทุกขนาดหน้าจอด้วย <b>Tailwind CSS</b> ร่วมกับชุดคอมโพเนนต์ <b>shadcn/ui</b> ทำให้ทีมมีภาษาการออกแบบเดียวกันตั้งแต่ปุ่มไปจนถึงตารางข้อมูลขนาดใหญ่',
      ),
      h3('แนวทางการวางหน้าบ้าน'),
      ul([
        'ยึด <code class="inline-code">shadcn/ui</code> เป็นฐาน แล้วต่อยอดเป็นคอมโพเนนต์ของโปรเจกต์เอง แทนที่จะเขียนสไตล์ซ้ำในทุกหน้า',
        'ออกแบบตารางข้อมูลให้ทำงานได้จริงบนจอเล็ก ด้วยการยุบคอลัมน์ที่ไม่จำเป็นและคงคอลัมน์ที่ผู้ใช้ต้องตัดสินใจไว้เสมอ',
        'แยกสถานะของเซิร์ฟเวอร์ออกจากสถานะของหน้าจอ ทำให้การรีเฟรชข้อมูลไม่ไปรีเซ็ตสิ่งที่ผู้ใช้กำลังกรอกอยู่',
        'กำหนดรูปแบบการจัดการข้อผิดพลาดให้เหมือนกันทั้งระบบ ผู้ใช้จึงเจอข้อความที่คาดเดาได้ ไม่ใช่หน้าจอว่างเปล่า',
      ]),
      para(
        'อีกส่วนที่รับผิดชอบร่วมกับทีมคือระบบย่อย <b>LGS</b> (light-guiding station) หรือสถานีนำทางด้วยแสง ซึ่งใช้สัญญาณไฟบอกตำแหน่งช่องจัดเก็บให้ผู้ปฏิบัติงานหยิบของได้ถูกต้อง งานส่วนนี้ต้องประสานทั้งฝั่งซอฟต์แวร์และอุปกรณ์หน้างานไปพร้อมกัน',
      ),
      todo([
        ['วางโครงคอมโพเนนต์กลางและธีมให้ใช้ซ้ำได้ทั้งระบบ', true],
        ['ทำหน้าจัดการข้อมูลหลักให้รองรับการใช้งานบนแท็บเล็ตหน้างาน', true],
        ['เชื่อมระบบย่อย LGS เข้ากับขั้นตอนการทำงานเดิมของผู้ใช้', true],
        ['ทยอยเก็บงานปรับปรุงประสบการณ์ใช้งานตามฟีดแบ็กจากหน้างาน', false],
      ]),
      hr(),
      h3('การซัพพอร์ตหลังส่งมอบ'),
      quote(
        'ระบบที่ดีไม่ได้จบตอนขึ้น production แต่จบตอนที่ผู้ใช้หน้างานทำงานได้โดยไม่ต้องโทรหาเรา',
        'จากการดูแลระบบทั้งที่หน้างานและจากระยะไกล',
      ),
      table([
        ['ส่วนงาน', 'สิ่งที่ทำ'],
        ['หน้าบ้าน', 'พัฒนาหน้าจอด้วย Next.js, React และ TypeScript'],
        ['ส่วนติดต่อผู้ใช้', 'ออกแบบ UI แบบ responsive ด้วย Tailwind CSS และ shadcn/ui'],
        ['ระบบย่อย LGS', 'พัฒนาสถานีนำทางด้วยแสงร่วมกับทีม'],
        ['การซัพพอร์ต', 'ดูแลระบบทั้งหน้างานและระยะไกลให้ทำงานได้ต่อเนื่อง'],
      ]),
    ]),
    tags: ['Next.js', 'React', 'TypeScript', 'shadcn/ui'],
    status: 'PUBLISHED',
    featured: true,
    publishedAt: '2024-11-04T09:00:00.000Z',
    updatedAt: '2025-06-12T08:15:00.000Z',
    role: 'พัฒนาหน้าบ้านและออกแบบ UI',
    stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'shadcn/ui'],
    year: 2024,
    liveUrl: null,
    repoUrl: null,
    sortOrder: 1,
  },
  {
    id: 'seed-project-conhis-en',
    slug: 'conhis-system',
    locale: 'en',
    translationKey: 'conhis',
    title: 'Conhis System',
    summary:
      'A management platform built with Next.js, React and TypeScript, plus the LGS light-guiding station subsystem.',
    coverImage: null,
    content: doc('co-en-', [
      h2('What the platform is'),
      para(
        '<b>Conhis System</b> is a management platform built with <b>Next.js</b>, <b>React</b> and <b>TypeScript</b>. The interface is responsive by construction, using <b>Tailwind CSS</b> together with <b>shadcn/ui</b> so the whole team shares one design vocabulary — from a single button all the way up to dense data tables.',
      ),
      h3('How the front end is put together'),
      ul([
        'Treat <code class="inline-code">shadcn/ui</code> as the base layer and grow project-specific components on top of it, rather than restyling from scratch on every screen.',
        'Design data tables that stay usable on small screens: collapse the columns nobody acts on, always keep the columns a decision depends on.',
        'Keep server state separate from view state, so refreshing data never wipes out what the user is halfway through typing.',
        'Handle errors the same way everywhere, so users get a predictable message instead of an empty screen.',
      ]),
      para(
        'A second piece of the work, built together with the team, is the <b>LGS</b> (light-guiding station) subsystem: indicator lights point an operator at the exact storage slot to pick from. It required software and on-site hardware to be brought into agreement at the same time.',
      ),
      todo([
        ['Establish shared components and theming for reuse across the platform', true],
        ['Make the core management screens workable on the tablets used on the floor', true],
        ['Wire the LGS subsystem into the operators existing workflow', true],
        ['Keep folding in usability fixes as they come back from the floor', false],
      ]),
      hr(),
      h3('Support after handover'),
      quote(
        'A system is not finished when it reaches production. It is finished when the people using it stop needing to call you.',
        'From supporting the system both on site and remotely',
      ),
      table([
        ['Area', 'Contribution'],
        ['Front end', 'Built the screens with Next.js, React and TypeScript'],
        ['Interface', 'Responsive UI design with Tailwind CSS and shadcn/ui'],
        ['LGS subsystem', 'Built the light-guiding station together with the team'],
        ['Support', 'On-site and remote support to keep the system stable'],
      ]),
    ]),
    tags: ['Next.js', 'React', 'TypeScript', 'shadcn/ui'],
    status: 'PUBLISHED',
    featured: true,
    publishedAt: '2024-11-04T09:00:00.000Z',
    updatedAt: '2025-06-12T08:15:00.000Z',
    role: 'Front-end development & UI',
    stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'shadcn/ui'],
    year: 2024,
    liveUrl: null,
    repoUrl: null,
    sortOrder: 1,
  },

  /* ----------------------------- Ward Stock ---------------------------- */
  {
    id: 'seed-project-ward-stock-th',
    slug: 'ward-stock',
    locale: 'th',
    translationKey: 'ward-stock',
    title: 'Ward Stock',
    summary:
      'ระบบจ่ายยาอัตโนมัติที่พัฒนาด้วย Kotlin และ Jetpack Compose เชื่อมต่อฮาร์ดแวร์ผ่าน NDK',
    coverImage: null,
    content: doc('ws-th-', [
      h2('ภาพรวมของระบบ'),
      para(
        '<b>Ward Stock</b> คือระบบจ่ายยาอัตโนมัติประจำหอผู้ป่วย ทำงานร่วมกับ RESTful API เพื่อดึงรายการยาและบันทึกการจ่ายกลับเข้าระบบกลาง ตัวแอปพัฒนาด้วย <b>Kotlin</b> และวางหน้าจอทั้งหมดด้วย <b>Jetpack Compose</b> โดยเครื่องที่ติดตั้งจริงเป็นอุปกรณ์เฉพาะทางที่มีกลไกจ่ายยาอยู่ภายใน',
      ),
      h3('เชื่อมต่อฮาร์ดแวร์ผ่าน NDK'),
      ol([
        'ไลบรารีควบคุมกลไกของเครื่องเป็นโค้ดภาษา C จึงเรียกใช้ผ่าน <b>Android NDK</b> ด้วย JNI',
        'ห่อทุกฟังก์ชันฝั่ง native ไว้หลังอินเทอร์เฟซของ Kotlin ชั้นเดียว เพื่อไม่ให้รายละเอียดของฮาร์ดแวร์รั่วขึ้นไปถึงหน้าจอ',
        'สั่งงานฮาร์ดแวร์ทั้งหมดบน dispatcher สำหรับงาน I/O เพราะการเปิดช่องจ่ายยาใช้เวลาเป็นวินาที และห้ามค้าง UI เด็ดขาด',
      ]),
      code([
        'external fun openDrawer(slot: Int): Int',
        '',
        'private val _state = MutableStateFlow<DispenseState>(DispenseState.Idle)',
        'val state: StateFlow<DispenseState> = _state.asStateFlow()',
        '',
        'fun dispense(slot: Int) = viewModelScope.launch(Dispatchers.IO) {',
        '    _state.value = DispenseState.Running(slot)',
        '    val outcome = runCatching { openDrawer(slot) }',
        '    _state.value = outcome.fold(',
        '        onSuccess = { DispenseState.Done(slot) },',
        '        onFailure = { DispenseState.Failed(it.message) },',
        '    )',
        '}',
      ]),
      todo([
        ['ออกแบบสถานะของเครื่องให้ครบทุกกรณี รวมถึงกรณีจ่ายยาไม่สำเร็จ', true],
        ['ทำหน้าจอด้วย Jetpack Compose ให้กดง่ายแม้ผู้ใช้สวมถุงมือ', true],
        ['เชื่อม RESTful API สำหรับรายการยาและการบันทึกผลการจ่าย', true],
        ['รองรับการทำงานต่อเนื่องเมื่อเครือข่ายในหอผู้ป่วยสะดุดชั่วคราว', true],
      ]),
      hr(),
      h3('การจัดการสถานะและงานแบบอะซิงโครนัส'),
      quote(
        'เครื่องที่ต้องหยิบยาให้คนไข้ ต้องบอกให้ชัดเสมอว่ากำลังทำอะไรอยู่ และทำสำเร็จหรือไม่',
        'หลักที่ยึดตอนออกแบบสถานะของระบบ',
      ),
      ul([
        'ใช้สถาปัตยกรรมแบบ <i>stateful</i> ให้หน้าจอสะท้อนสถานะเดียวของเครื่องเสมอ ไม่ให้มีสองแหล่งความจริง',
        'ใช้ <code class="inline-code">coroutines</code> จัดการงานที่ต้องรอ ทั้งการเรียก API และการสั่งกลไกจ่ายยา',
        'ทุกสถานะที่แสดงบนหน้าจอย้อนกลับไปหาเหตุการณ์จริงได้ ทำให้ไล่ปัญหาจากภาพหน้าจอเดียวก็พอ',
      ]),
    ]),
    tags: ['Kotlin', 'Jetpack Compose', 'Android', 'NDK'],
    status: 'PUBLISHED',
    featured: true,
    publishedAt: '2024-06-10T09:00:00.000Z',
    updatedAt: '2025-04-02T07:45:00.000Z',
    role: 'พัฒนาแอปพลิเคชัน Android',
    stack: ['Kotlin', 'Jetpack Compose', 'Android NDK', 'Coroutines'],
    year: 2023,
    liveUrl: null,
    repoUrl: null,
    sortOrder: 2,
  },
  {
    id: 'seed-project-ward-stock-en',
    slug: 'ward-stock',
    locale: 'en',
    translationKey: 'ward-stock',
    title: 'Ward Stock',
    summary:
      'An automated medication dispensing system built in Kotlin with Jetpack Compose, talking to hardware through the NDK.',
    coverImage: null,
    content: doc('ws-en-', [
      h2('What the system does'),
      para(
        '<b>Ward Stock</b> is an automated medication dispensing system for hospital wards. It integrates with RESTful APIs to pull the medication list and post every dispense back to the central system. The app is written in <b>Kotlin</b> with the entire UI in <b>Jetpack Compose</b>, running on purpose-built hardware with the dispensing mechanism inside the unit.',
      ),
      h3('Talking to hardware through the NDK'),
      ol([
        'The vendor library that drives the mechanism is C, so it is called through the <b>Android NDK</b> over JNI.',
        'Every native call sits behind a single Kotlin interface, which keeps hardware details from leaking upward into the UI layer.',
        'All hardware commands run on an I/O dispatcher — opening a drawer takes seconds, and blocking the UI thread is never acceptable.',
      ]),
      code([
        'external fun openDrawer(slot: Int): Int',
        '',
        'private val _state = MutableStateFlow<DispenseState>(DispenseState.Idle)',
        'val state: StateFlow<DispenseState> = _state.asStateFlow()',
        '',
        'fun dispense(slot: Int) = viewModelScope.launch(Dispatchers.IO) {',
        '    _state.value = DispenseState.Running(slot)',
        '    val outcome = runCatching { openDrawer(slot) }',
        '    _state.value = outcome.fold(',
        '        onSuccess = { DispenseState.Done(slot) },',
        '        onFailure = { DispenseState.Failed(it.message) },',
        '    )',
        '}',
      ]),
      todo([
        ['Model every machine state, including the ways a dispense can fail', true],
        ['Build the Compose UI so targets stay easy to hit with gloves on', true],
        ['Integrate the RESTful APIs for stock lists and dispense records', true],
        ['Keep working through short network drops on the ward', true],
      ]),
      hr(),
      h3('State and asynchronous work'),
      quote(
        'A machine that hands medication to a patient has to say clearly what it is doing, and whether it succeeded.',
        'The rule the state design was built around',
      ),
      ul([
        'A <i>stateful</i> architecture keeps the screen reflecting one machine state — never two competing sources of truth.',
        '<code class="inline-code">Coroutines</code> carry everything that has to wait: API calls and the dispensing mechanism alike.',
        'Every state on screen traces back to a real event, so a single screenshot is usually enough to debug a report from the ward.',
      ]),
    ]),
    tags: ['Kotlin', 'Jetpack Compose', 'Android', 'NDK'],
    status: 'PUBLISHED',
    featured: true,
    publishedAt: '2024-06-10T09:00:00.000Z',
    updatedAt: '2025-04-02T07:45:00.000Z',
    role: 'Android application development',
    stack: ['Kotlin', 'Jetpack Compose', 'Android NDK', 'Coroutines'],
    year: 2023,
    liveUrl: null,
    repoUrl: null,
    sortOrder: 2,
  },
]

/* ================================ posts =============================== */

export const seedPosts: PostRecord[] = [
  /* --------------------- editorjs-json-to-react ------------------------ */
  {
    id: 'seed-post-editorjs-json-to-react-th',
    slug: 'editorjs-json-to-react',
    locale: 'th',
    translationKey: 'editorjs-json-to-react',
    title: 'แปลง JSON ของ Editor.js ให้เป็นคอมโพเนนต์ React',
    summary:
      'Editor.js ไม่ได้คืน HTML ออกมา แต่คืนโครงสร้าง JSON ของบล็อก บันทึกนี้เล่าวิธีเรนเดอร์มันด้วย React ให้ต่อเติมง่ายและไม่พังเมื่อเจอบล็อกที่ไม่รู้จัก',
    coverImage: null,
    content: doc('pj-th-', [
      h2('ทำไมถึงเก็บเป็น JSON ไม่ใช่ HTML'),
      para(
        'ตอนเลือกตัวแก้ไขบทความให้เว็บนี้ ข้อที่ทำให้ตัดสินใจใช้ <a href="https://editorjs.io/">Editor.js</a> คือมันไม่ได้คืน HTML ก้อนเดียวออกมา แต่คืนรายการของบล็อกในรูปแบบ JSON ความต่างตรงนี้ฟังดูเล็ก แต่ส่งผลกับทุกอย่างที่ตามมา',
      ),
      ul([
        'ข้อมูลยังเป็นข้อมูล ไม่ใช่มาร์กอัป จะสร้างสารบัญจากบล็อก <code class="inline-code">header</code> หรือคำนวณเวลาอ่านจากเนื้อความก็ทำได้ตรง ๆ',
        'เปลี่ยนหน้าตาได้โดยไม่ต้องแก้ข้อมูลเดิม เพราะสไตล์อยู่ที่คอมโพเนนต์ ไม่ได้ฝังอยู่ในเนื้อหา',
        'พื้นที่ที่ต้องไว้ใจ HTML ดิบเหลือแค่ระดับ inline เท่านั้น ไม่ใช่ทั้งบทความ',
        'เนื้อหาเดียวกันเอาไปใช้ที่อื่นได้ ทั้ง RSS, meta description หรือหน้าค้นหา โดยไม่ต้องถอด tag ทิ้งก่อน',
      ]),
      h3('หน้าตาของข้อมูลที่ได้'),
      code([
        '{',
        '  "time": 1754006400000,',
        '  "blocks": [',
        '    { "id": "a1", "type": "header", "data": { "text": "ภาพรวม", "level": 2 } },',
        '    { "id": "a2", "type": "paragraph", "data": { "text": "ข้อความมี <b>ตัวหนา</b> ได้" } }',
        '  ],',
        '  "version": "2.31.0"',
        '}',
      ]),
      h3('แมปชนิดบล็อกไปหาคอมโพเนนต์'),
      para(
        'หัวใจของฝั่งเรนเดอร์คือตารางแมปเดียว จาก <code class="inline-code">block.type</code> ไปหาคอมโพเนนต์ เพิ่มเครื่องมือใหม่ในตัวแก้ไขเมื่อไร ก็มาเติมอีกหนึ่งบรรทัดที่นี่ ไม่ต้องไปไล่แก้ที่อื่น',
      ),
      code([
        'const RENDERERS: Record<string, ComponentType<BlockProps>> = {',
        '  header: HeaderBlock,',
        '  paragraph: ParagraphBlock,',
        '  list: ListBlock,',
        '  checklist: ChecklistBlock,',
        '  quote: QuoteBlock,',
        '  code: CodeBlock,',
        '  table: TableBlock,',
        '  delimiter: DelimiterBlock,',
        '}',
        '',
        'export function Blocks({ doc }: { doc: EditorDocument }) {',
        '  return doc.blocks.map((block) => {',
        '    const Block = RENDERERS[block.type]',
        '    if (!Block) return null // เครื่องมือที่ยังไม่รองรับ: ข้ามไป ไม่ทำให้หน้าพัง',
        '    return <Block key={block.id} data={block.data} />',
        '  })',
        '}',
      ]),
      quote(
        'บล็อกที่ไม่รู้จักต้องหายไปเงียบ ๆ ไม่ใช่ทำให้ทั้งหน้าเป็นจอขาว',
        'กฎข้อแรกของการเรนเดอร์เนื้อหาที่ผู้ใช้แก้ไขเองได้',
      ),
      hr(),
      h2('จุดที่มักพลาด'),
      ol([
        'ข้อความในบล็อกเป็น HTML ระดับ inline เสมอ (<code class="inline-code">&lt;b&gt;</code>, <code class="inline-code">&lt;i&gt;</code>, ลิงก์) ถ้าจะเอาไปทำสารบัญหรือคำโปรย ต้องถอด tag ออกก่อน',
        'อย่าเชื่อว่า <code class="inline-code">data</code> จะมีรูปร่างตามที่คิดเสมอ เพราะมันมาจากคอลัมน์ JSON ควรตรวจก่อนใช้ทุกครั้ง',
        '@editorjs/list เวอร์ชัน 2 เปลี่ยน <code class="inline-code">items</code> จากอาเรย์ของสตริง เป็นอาเรย์ของออบเจกต์ที่มีทั้ง content, meta และ items ซ้อนกัน',
        'บล็อก <code class="inline-code">checklist</code> ใช้คีย์ชื่อ text ไม่ใช่ content แบบ list ตรงนี้พลาดกันบ่อย',
      ]),
      todo([
        ['ทำคอมโพเนนต์ครบทุกชนิดบล็อกที่เปิดใช้ในตัวแก้ไข', true],
        ['กันหน้าพังเมื่อเจอบล็อกหรือฟิลด์ที่ไม่รู้จัก', true],
        ['ถอด tag ก่อนนำข้อความไปใช้ในสารบัญและ meta', true],
        ['เพิ่มบล็อกรูปภาพและ embed เมื่อมีไฟล์สื่อจริง', false],
      ]),
      table([
        ['ชนิดบล็อก', 'ฟิลด์สำคัญ', 'สิ่งที่ต้องระวัง'],
        ['header', 'text, level', 'level เป็นได้ตั้งแต่ 1 ถึง 6 ควรบีบให้เหลือ h2/h3 ก่อนทำสารบัญ'],
        ['list', 'style, items[]', 'เวอร์ชัน 2 items เป็นออบเจกต์ ไม่ใช่สตริงอีกต่อไป'],
        ['checklist', 'items[].text, items[].checked', 'ใช้คีย์ text ไม่เหมือน list ที่ใช้ content'],
        ['table', 'withHeadings, content[][]', 'แถวแรกเป็นหัวตารางก็ต่อเมื่อ withHeadings เป็น true'],
      ]),
    ]),
    tags: ['Editor.js', 'React', 'TypeScript', 'Next.js'],
    status: 'PUBLISHED',
    featured: true,
    publishedAt: '2025-06-18T08:00:00.000Z',
    updatedAt: '2025-07-30T09:20:00.000Z',
    readingMinutes: 6,
  },
  {
    id: 'seed-post-editorjs-json-to-react-en',
    slug: 'editorjs-json-to-react',
    locale: 'en',
    translationKey: 'editorjs-json-to-react',
    title: 'Turning Editor.js JSON into React components',
    summary:
      'Editor.js hands you a block tree, not an HTML blob. Here is how I render it in React so it stays easy to extend and never white-screens on an unknown block.',
    coverImage: null,
    content: doc('pj-en-', [
      h2('Why store JSON instead of HTML'),
      para(
        'When picking an editor for this site, the thing that settled it for <a href="https://editorjs.io/">Editor.js</a> was that it does not hand back one lump of HTML — it hands back a list of blocks as JSON. That sounds like a small difference. It changes everything downstream.',
      ),
      ul([
        'Content stays data rather than markup, so building a table of contents from the <code class="inline-code">header</code> blocks or computing reading time from the prose is direct work.',
        'The presentation can change without touching a single stored row, because the styling lives in components rather than inside the content.',
        'The surface where raw HTML has to be trusted shrinks to inline formatting instead of a whole article.',
        'The same content can be reused for RSS, meta descriptions and search indexing without stripping tags first.',
      ]),
      h3('The shape you actually get'),
      code([
        '{',
        '  "time": 1754006400000,',
        '  "blocks": [',
        '    { "id": "a1", "type": "header", "data": { "text": "Overview", "level": 2 } },',
        '    { "id": "a2", "type": "paragraph", "data": { "text": "Text can be <b>bold</b>." } }',
        '  ],',
        '  "version": "2.31.0"',
        '}',
      ]),
      h3('Mapping block types to components'),
      para(
        'The whole renderer hinges on one lookup table from <code class="inline-code">block.type</code> to a component. Enabling a new tool in the editor means adding one line here, and nowhere else.',
      ),
      code([
        'const RENDERERS: Record<string, ComponentType<BlockProps>> = {',
        '  header: HeaderBlock,',
        '  paragraph: ParagraphBlock,',
        '  list: ListBlock,',
        '  checklist: ChecklistBlock,',
        '  quote: QuoteBlock,',
        '  code: CodeBlock,',
        '  table: TableBlock,',
        '  delimiter: DelimiterBlock,',
        '}',
        '',
        'export function Blocks({ doc }: { doc: EditorDocument }) {',
        '  return doc.blocks.map((block) => {',
        '    const Block = RENDERERS[block.type]',
        '    if (!Block) return null // unsupported tool: skip it, never crash the page',
        '    return <Block key={block.id} data={block.data} />',
        '  })',
        '}',
      ]),
      quote(
        'An unrecognised block should disappear quietly. It should never take the page down with it.',
        'First rule of rendering user-authored content',
      ),
      hr(),
      h2('The parts that catch people out'),
      ol([
        'Block text is always inline HTML (<code class="inline-code">&lt;b&gt;</code>, <code class="inline-code">&lt;i&gt;</code>, links). Strip the tags before reusing it in a table of contents or an excerpt.',
        'Never assume <code class="inline-code">data</code> has the shape you expect — it comes out of a JSON column, so narrow it before you read it.',
        '@editorjs/list v2 changed <code class="inline-code">items</code> from an array of strings to an array of objects carrying content, meta and nested items.',
        'The <code class="inline-code">checklist</code> block keys its items on text, not on content the way list does. This one bites almost everybody once.',
      ]),
      todo([
        ['Write a component for every block type enabled in the editor', true],
        ['Fail soft on unknown blocks and missing fields', true],
        ['Strip inline tags before using text in the TOC and meta tags', true],
        ['Add image and embed blocks once there are real media files', false],
      ]),
      table([
        ['Block', 'Key fields', 'Watch out for'],
        ['header', 'text, level', 'level can be 1 to 6; clamp it to h2/h3 before building a TOC'],
        ['list', 'style, items[]', 'v2 items are objects, no longer plain strings'],
        ['checklist', 'items[].text, items[].checked', 'Uses text, unlike list which uses content'],
        ['table', 'withHeadings, content[][]', 'The first row is a header row only when withHeadings is true'],
      ]),
    ]),
    tags: ['Editor.js', 'React', 'TypeScript', 'Next.js'],
    status: 'PUBLISHED',
    featured: true,
    publishedAt: '2025-06-18T08:00:00.000Z',
    updatedAt: '2025-07-30T09:20:00.000Z',
    readingMinutes: 7,
  },

  /* --------------------- realtime-mqtt-websocket ----------------------- */
  {
    id: 'seed-post-realtime-mqtt-websocket-th',
    slug: 'realtime-mqtt-websocket',
    locale: 'th',
    translationKey: 'realtime-mqtt-websocket',
    title: 'MQTT คู่กับ WebSocket: ส่งข้อมูลจากอุปกรณ์ถึงหน้าจอแบบเรียลไทม์',
    summary:
      'ทำไมระบบติดตามอุณหภูมิถึงใช้สองโปรโตคอล ไม่ใช่หนึ่ง และรายละเอียดที่ทำให้ข้อมูลจากเซนเซอร์ขึ้นหน้าจอได้จริงโดยไม่ท่วมทั้งเบราว์เซอร์และเซิร์ฟเวอร์',
    coverImage: null,
    content: doc('pm-th-', [
      h2('ทำไมต้องใช้สองโปรโตคอล'),
      para(
        'คำถามที่เจอบ่อยเวลาเล่าเรื่อง <b>SMTrack+</b> คือ ในเมื่อ MQTT วิ่งบน WebSocket ได้อยู่แล้ว ทำไมไม่ให้เบราว์เซอร์ต่อเข้า broker ตรง ๆ ไปเลย คำตอบสั้น ๆ คือทั้งสองโปรโตคอลถูกออกแบบมาเพื่อคนละฝั่งของระบบ และการฝืนใช้อันเดียวจบก็แค่ย้ายปัญหาไปไว้อีกที่',
      ),
      table([
        ['หัวข้อ', 'MQTT', 'WebSocket'],
        ['ออกแบบมาเพื่อ', 'อุปกรณ์ที่มีทรัพยากรจำกัด', 'หน้าเว็บที่เปิดอยู่ในเบราว์เซอร์'],
        ['รูปแบบการสื่อสาร', 'publish/subscribe ผ่าน broker', 'ช่องทางสองทางระหว่างเบราว์เซอร์กับเซิร์ฟเวอร์'],
        ['ต้นทุนต่อข้อความ', 'ส่วนหัวเล็กมาก ทนเครือข่ายไม่เสถียร', 'ใหญ่กว่า แต่ไม่ใช่ปัญหาบนเครือข่ายในอาคาร'],
        ['จุดแข็งที่ได้ใช้จริง', 'QoS, retained message และ last will', 'ผลักข้อมูลขึ้นหน้าจอที่เปิดค้างอยู่ได้ทันที'],
      ]),
      h3('ฝั่งอุปกรณ์: ให้ MQTT ทำงานที่มันถนัด'),
      ul([
        'ให้แต่ละเครื่องมี topic ของตัวเอง เช่น <code class="inline-code">smtrack/&lt;deviceId&gt;/temperature</code> การกรองข้อมูลจึงเป็นหน้าที่ของ broker ไม่ใช่ของแอป',
        'ใช้ <b>QoS 1</b> กับค่าที่วัดได้ เพราะการได้ข้อมูลซ้ำยังดีกว่าการทำข้อมูลหาย',
        'ตั้ง <b>last will</b> ให้แต่ละเครื่อง พอสายหลุดหรือไฟดับ broker จะประกาศแทนให้เอง ไม่ต้องมานั่งเดาว่าเครื่องเงียบเพราะอะไร',
        'ใช้ <b>retained message</b> เก็บค่าล่าสุดไว้ที่ topic ระบบที่เพิ่งรีสตาร์ตจึงเห็นสถานะทันทีโดยไม่ต้องรอรอบวัดถัดไป',
      ]),
      code([
        '// เซิร์ฟเวอร์ต่อ broker เส้นเดียว ไม่ใช่หนึ่งเส้นต่อหนึ่งแท็บของผู้ใช้',
        'private readonly latest = new Map<string, Reading>()',
        '',
        'onModuleInit() {',
        "  this.mqtt.subscribe('smtrack/+/temperature', { qos: 1 })",
        "  this.mqtt.on('message', (topic, payload) => {",
        "    const deviceId = topic.split('/')[1]",
        '    this.latest.set(deviceId, JSON.parse(payload.toString()))',
        '  })',
        '',
        '  // อุปกรณ์ส่งทุก 2 วินาที แต่หน้าจอต้องการแค่วินาทีละครั้ง',
        '  setInterval(() => this.flush(), 1000)',
        '}',
        '',
        'private flush() {',
        '  for (const [deviceId, reading] of this.latest) {',
        "    this.gateway.to(`device:${deviceId}`).emit('reading', reading)",
        '  }',
        '  this.latest.clear()',
        '}',
      ]),
      h3('ฝั่งเบราว์เซอร์: ให้ WebSocket ส่งเฉพาะที่จำเป็น'),
      para(
        'เซิร์ฟเวอร์ทำหน้าที่เป็นสะพาน ต่อ broker ไว้เส้นเดียวแล้วกระจายต่อผ่าน WebSocket ตาม <i>room</i> ของผู้ใช้แต่ละคน ข้อดีที่ได้ทันทีคือสิทธิ์การเข้าถึงถูกตรวจที่เซิร์ฟเวอร์ ไม่ใช่ปล่อยให้เบราว์เซอร์ subscribe topic อะไรก็ได้ตามใจ',
      ),
      ol([
        'รวบค่าที่วัดได้ก่อนส่ง หน้าจอไม่ได้ต้องการทุกตัวอย่างที่เซนเซอร์ยิงมา ต้องการแค่ค่าล่าสุดที่เชื่อถือได้',
        'ส่งเฉพาะอุปกรณ์ที่ผู้ใช้กำลังดูอยู่จริง เข้าห้องตอนเปิดหน้า ออกจากห้องตอนปิด',
        'ตอนเชื่อมต่อใหม่ ให้ดึงภาพรวมล่าสุดผ่าน REST ก่อนหนึ่งครั้ง แล้วค่อยรับสตรีมต่อ ไม่อย่างนั้นหน้าจอจะค้างอยู่กับค่าเก่าเงียบ ๆ',
        'แยกช่องของการแจ้งเตือนออกจากช่องของค่าที่วัดได้ เพราะสองอย่างนี้มีความสำคัญไม่เท่ากัน',
      ]),
      quote(
        'ปัญหาที่แก้ยากที่สุดไม่ใช่ข้อมูลมาไม่ถึง แต่คือข้อมูลมาถึงแล้วหน้าจอยังโชว์ค่าเก่าอยู่โดยไม่มีใครรู้',
        'สิ่งที่ได้จากการเฝ้าระบบจริง',
      ),
      hr(),
      h2('สิ่งที่เรียนรู้จากหน้างาน'),
      todo([
        ['ให้เซิร์ฟเวอร์เป็นสะพานเส้นเดียวระหว่าง broker กับผู้ใช้ทุกคน', true],
        ['รวบค่าที่วัดได้ก่อนกระจายออก ป้องกันไม่ให้เบราว์เซอร์ทำงานหนักเกินจำเป็น', true],
        ['ใช้ last will จับเครื่องที่หลุดการเชื่อมต่อแทนการเดาจากความเงียบ', true],
        ['ดึงภาพรวมล่าสุดทุกครั้งหลังเชื่อมต่อใหม่ กันหน้าจอค้างค่าเก่า', true],
        ['เก็บสถิติความหน่วงตั้งแต่เซนเซอร์จนถึงหน้าจอไว้ดูย้อนหลัง', false],
      ]),
    ]),
    tags: ['MQTT', 'WebSocket', 'IoT', 'NestJS', 'Realtime'],
    status: 'PUBLISHED',
    featured: false,
    publishedAt: '2025-02-11T07:30:00.000Z',
    updatedAt: '2025-05-19T11:05:00.000Z',
    readingMinutes: 5,
  },
  {
    id: 'seed-post-realtime-mqtt-websocket-en',
    slug: 'realtime-mqtt-websocket',
    locale: 'en',
    translationKey: 'realtime-mqtt-websocket',
    title: 'MQTT and WebSocket: one pipeline from device to browser',
    summary:
      'Why a temperature monitoring system uses two protocols rather than one, and the details that get sensor data onto a screen without flooding the browser or the server.',
    coverImage: null,
    content: doc('pm-en-', [
      h2('Why two protocols'),
      para(
        'The question that always comes up about <b>SMTrack+</b> is this: MQTT can run over WebSocket already, so why not let the browser connect straight to the broker? The short answer is that the two protocols were designed for opposite ends of the system, and collapsing them into one only moves the problem somewhere else.',
      ),
      table([
        ['Concern', 'MQTT', 'WebSocket'],
        ['Designed for', 'Constrained devices', 'Pages open in a browser'],
        ['Model', 'Publish/subscribe through a broker', 'A two-way channel between browser and server'],
        ['Per-message cost', 'Tiny headers, tolerant of flaky links', 'Larger, which is fine on a building network'],
        ['What we actually use it for', 'QoS, retained messages, last will', 'Pushing state into an already-open dashboard'],
      ]),
      h3('Device side: let MQTT do what it is good at'),
      ul([
        'Give each unit its own topic — <code class="inline-code">smtrack/&lt;deviceId&gt;/temperature</code> — so filtering is the brokers job, not the applications.',
        'Publish readings at <b>QoS 1</b>: a duplicate reading is a far cheaper mistake than a lost one.',
        'Set a <b>last will</b> per device, so when a cable is pulled or power drops the broker announces it for you instead of leaving you to interpret silence.',
        'Keep the newest value as a <b>retained message</b>, so a freshly restarted service sees current state without waiting for the next sampling cycle.',
      ]),
      code([
        '// one broker connection for the whole server, not one per browser tab',
        'private readonly latest = new Map<string, Reading>()',
        '',
        'onModuleInit() {',
        "  this.mqtt.subscribe('smtrack/+/temperature', { qos: 1 })",
        "  this.mqtt.on('message', (topic, payload) => {",
        "    const deviceId = topic.split('/')[1]",
        '    this.latest.set(deviceId, JSON.parse(payload.toString()))',
        '  })',
        '',
        '  // devices publish every 2s; the dashboard only needs 1 Hz',
        '  setInterval(() => this.flush(), 1000)',
        '}',
        '',
        'private flush() {',
        '  for (const [deviceId, reading] of this.latest) {',
        "    this.gateway.to(`device:${deviceId}`).emit('reading', reading)",
        '  }',
        '  this.latest.clear()',
        '}',
      ]),
      h3('Browser side: send only what the screen needs'),
      para(
        'The server is the bridge. It holds one connection to the broker and fans messages out over WebSocket into per-user <i>rooms</i>. The immediate payoff is that access control is enforced server-side, instead of trusting a browser not to subscribe to topics it should not see.',
      ),
      ol([
        'Coalesce readings before sending. A dashboard does not want every sample a sensor produces, it wants the latest trustworthy value.',
        'Only stream the devices someone is actually looking at: join the room on mount, leave it on unmount.',
        'On reconnect, fetch a snapshot over REST once and then resume the stream — otherwise the UI sits on stale numbers and says nothing about it.',
        'Keep alerts on a separate channel from routine readings, because the two do not carry the same urgency.',
      ]),
      quote(
        'The hard failure is never data that does not arrive. It is data that arrives while the screen quietly keeps showing the old value.',
        'From watching the system run in production',
      ),
      hr(),
      h2('What the rollout taught me'),
      todo([
        ['Make the server the single bridge between the broker and every client', true],
        ['Coalesce readings before fan-out so browsers are not doing needless work', true],
        ['Detect dropped devices with last will instead of inferring it from silence', true],
        ['Always re-fetch a snapshot after a reconnect so nothing goes stale', true],
        ['Record sensor-to-screen latency so it can be tracked over time', false],
      ]),
    ]),
    tags: ['MQTT', 'WebSocket', 'IoT', 'NestJS', 'Realtime'],
    status: 'PUBLISHED',
    featured: false,
    publishedAt: '2025-02-11T07:30:00.000Z',
    updatedAt: '2025-05-19T11:05:00.000Z',
    readingMinutes: 6,
  },

  /* -------------------- thai-typography-on-the-web --------------------- */
  {
    id: 'seed-post-thai-typography-on-the-web-th',
    slug: 'thai-typography-on-the-web',
    locale: 'th',
    translationKey: 'thai-typography-on-the-web',
    title: 'งานตัวอักษรไทยบนเว็บ: การตัดบรรทัด ความสูงบรรทัด และเวลาอ่าน',
    summary:
      'ค่าพื้นฐานของ CSS ส่วนใหญ่ถูกปรับมาเพื่อภาษาที่เว้นวรรคระหว่างคำ บันทึกนี้รวบรวมสิ่งที่ต้องแก้เมื่อเนื้อหาหลักของเว็บเป็นภาษาไทย',
    coverImage: null,
    content: doc('pt-th-', [
      h2('ทำไมงานตัวอักษรไทยถึงยากกว่าที่คิด'),
      para(
        'เว็บส่วนใหญ่ถูกออกแบบมาบนสมมติฐานว่าคำจะถูกคั่นด้วยช่องว่าง ตั้งแต่การตัดบรรทัด การนับจำนวนคำ ไปจนถึงค่าเริ่มต้นของความสูงบรรทัด พอเนื้อหาหลักเป็นภาษาไทย สมมติฐานนั้นหายไปทั้งชุด และปัญหาจะโผล่มาทีละอย่างแบบไม่มีข้อความ error ให้เห็น',
      ),
      ul([
        'ภาษาไทยไม่เว้นวรรคระหว่างคำ ช่องว่างที่เห็นในข้อความไทยทำหน้าที่คั่นวลีหรือประโยค ไม่ใช่คั่นคำ',
        'ตัวอักษรซ้อนกันได้หลายชั้น ทั้งพยัญชนะ สระบน สระล่าง และวรรณยุกต์ ความสูงบรรทัดที่พอดีกับภาษาอังกฤษจึงแน่นเกินไปสำหรับไทย',
        'ฟอนต์ที่เลือกมาเพื่อภาษาอังกฤษมักไม่มีอักขระไทย เบราว์เซอร์จะถอยไปใช้ฟอนต์ของระบบซึ่งมีขนาดตาไม่เท่ากัน ผลคือหน้าเว็บดูไม่กลมกลืน',
        'เครื่องมือที่นับจำนวนคำด้วยการแยกที่ช่องว่าง จะมองย่อหน้าไทยทั้งย่อหน้าเป็นคำเดียว',
      ]),
      h3('การตัดบรรทัด'),
      para(
        'ข่าวดีคือเบราว์เซอร์สมัยใหม่ตัดคำไทยด้วยพจนานุกรมได้เองอยู่แล้ว แต่มันจะทำก็ต่อเมื่อรู้ว่าข้อความนั้นเป็นภาษาไทย การใส่ <code class="inline-code">lang</code> ให้ถูกจึงมีผลกับหน้าตาของงานมากกว่าที่หลายคนคิด และเป็นสิ่งที่โปรแกรมอ่านหน้าจอต้องใช้อยู่แล้วด้วย',
      ),
      code([
        ':lang(th) {',
        '  /* ปล่อยให้เบราว์เซอร์ใช้พจนานุกรมตัดคำ อย่าไปฝืน */',
        '  line-break: auto;',
        '  word-break: normal;',
        '',
        '  /* กันเฉพาะกรณีคำภาษาอังกฤษยาวหรือ URL ล้นกรอบ */',
        '  overflow-wrap: break-word;',
        '',
        '  /* เผื่อที่ให้วรรณยุกต์ที่วางซ้อนอยู่บนสระอีกชั้น */',
        '  line-height: 1.85;',
        '}',
        '',
        '/* อย่าทำแบบนี้กับข้อความไทย: มันตัดกลางพยางค์ */',
        '.dont-do-this { word-break: break-all; }',
      ]),
      ol([
        'ประกาศภาษาให้ถูกต้องด้วย <code class="inline-code">lang="th"</code> ที่ระดับ html หรือที่ก้อนเนื้อหา แล้วเบราว์เซอร์จะจัดการตัดคำให้เอง',
        'อย่าใช้ <code class="inline-code">word-break: break-all</code> กับข้อความไทย เพราะมันตัดกลางพยางค์จนสระหลุดไปขึ้นต้นบรรทัดถัดไป',
        'คุณสมบัติ <code class="inline-code">hyphens</code> ไม่มีผลกับภาษาไทย เพราะไทยไม่ใช้ยัติภังค์ในการตัดคำ',
        'ถ้าเนื้อหาปนภาษาอังกฤษหรือลิงก์ยาว ให้ใช้ <code class="inline-code">overflow-wrap</code> กันล้นกรอบ ซึ่งไม่ไปรบกวนการตัดคำไทย',
        'เลี่ยงการจัดข้อความไทยแบบ <code class="inline-code">justify</code> ในคอลัมน์แคบ เพราะไม่มีช่องว่างระหว่างคำให้ยืด ช่องไฟจึงไปกระจายผิดที่',
      ]),
      h3('ความสูงบรรทัดและช่องไฟ'),
      table([
        ['องค์ประกอบ', 'ค่าที่มักใช้กับอังกฤษ', 'ค่าที่เหมาะกับไทย', 'เหตุผล'],
        ['เนื้อความ', '1.5', '1.75 – 1.9', 'สระบนกับวรรณยุกต์ซ้อนกันได้ถึงสองชั้น'],
        ['หัวข้อใหญ่', '1.1', '1.25 – 1.35', 'ยิ่งตัวใหญ่ยิ่งเห็นการชนกันของบรรทัดชัด'],
        ['ระยะห่างตัวอักษร', 'ปรับได้ตามใจ', 'ปล่อยเป็น normal', 'การขยายช่องไฟทำให้สระดูหลุดออกจากพยัญชนะ'],
        ['ความกว้างคอลัมน์', 'ประมาณ 65 ตัวอักษร', 'ประมาณ 40 – 45 ตัวอักษร', 'ตัวอักษรไทยกินพื้นที่ต่อความหมายมากกว่า'],
      ]),
      quote(
        'ข้อความไทยที่จัดไม่ดีจะไม่แจ้ง error ออกมา มันแค่อ่านแล้วเหนื่อยกว่าเดิมโดยที่ผู้อ่านก็บอกไม่ถูกว่าเพราะอะไร',
        'เหตุผลที่ควรตรวจงานตัวอักษรด้วยเนื้อหาไทยจริง',
      ),
      hr(),
      h2('เวลาอ่านที่คำนวณจากจำนวนคำใช้กับไทยไม่ได้'),
      code([
        '// การนับคำด้วยการแยกที่ช่องว่าง มองย่อหน้าไทยทั้งย่อหน้าเป็นคำเดียว',
        '// จึงนับจำนวนอักขระไทยแทน แล้วบวกกับจำนวนคำละตินที่เหลือ',
        'const thaiChars = (text.match(/[\\u0E00-\\u0E7F]/g) ?? []).length',
        "const latinWords = text.replace(/[\\u0E00-\\u0E7F]/g, ' ').split(/\\s+/).filter(Boolean).length",
        '',
        '// ไทยราว 400 อักขระต่อนาที อังกฤษราว 230 คำต่อนาที',
        'const minutes = thaiChars / 400 + latinWords / 230',
        'return Math.max(1, Math.round(minutes))',
      ]),
      todo([
        ['ใส่ lang ให้ถูกต้องทั้งที่ระดับหน้าและที่ก้อนเนื้อหาที่สลับภาษา', true],
        ['เลือกฟอนต์ที่มีอักขระไทยครบ และตั้งฟอนต์สำรองไว้ให้ชัดเจน', true],
        ['ตั้งความสูงบรรทัดของเนื้อความไทยแยกจากค่าเริ่มต้นของภาษาอังกฤษ', true],
        ['คำนวณเวลาอ่านจากจำนวนอักขระเมื่อเนื้อหาเป็นภาษาไทย', true],
        ['ทดสอบการตัดบรรทัดบนหน้าจอแคบด้วยเนื้อหาไทยจริง ไม่ใช่ข้อความหลอก', false],
      ]),
    ]),
    tags: ['Typography', 'CSS', 'i18n', 'Thai', 'Accessibility'],
    status: 'PUBLISHED',
    featured: false,
    publishedAt: '2024-10-05T06:00:00.000Z',
    updatedAt: '2025-03-08T12:40:00.000Z',
    readingMinutes: 4,
  },
  {
    id: 'seed-post-thai-typography-on-the-web-en',
    slug: 'thai-typography-on-the-web',
    locale: 'en',
    translationKey: 'thai-typography-on-the-web',
    title: 'Thai typography on the web: line breaking, leading, and reading time',
    summary:
      'Most CSS defaults are tuned for languages that put spaces between words. Here is what has to change when the primary content of a site is Thai.',
    coverImage: null,
    content: doc('pt-en-', [
      h2('Why Thai text is harder than it looks'),
      para(
        'The web is built on the assumption that words are separated by spaces — line breaking, word counting, and the default leading all rest on it. When the primary content is Thai, that assumption disappears completely, and the consequences show up one at a time with no error message attached.',
      ),
      ul([
        'Thai does not put spaces between words. The spaces you do see mark phrase or sentence boundaries, not word boundaries.',
        'Glyphs stack: a consonant can carry a vowel above it and a tone mark above that, plus a vowel below. Leading that feels right in English is cramped in Thai.',
        'Fonts chosen for a Latin design usually have no Thai coverage, so the browser falls back to a system font at a different optical size and the page stops looking like one design.',
        'Any tool that counts words by splitting on whitespace will see an entire Thai paragraph as a single word.',
      ]),
      h3('Line breaking'),
      para(
        'The good news is that modern browsers already break Thai using a dictionary. The catch is that they only do it when they know the text is Thai, which makes a correct <code class="inline-code">lang</code> attribute far more visually load-bearing than most people expect — and screen readers need it regardless.',
      ),
      code([
        ':lang(th) {',
        '  /* let the browser use its dictionary; do not fight it */',
        '  line-break: auto;',
        '  word-break: normal;',
        '',
        '  /* only to stop long Latin words and URLs from overflowing */',
        '  overflow-wrap: break-word;',
        '',
        '  /* headroom for a tone mark sitting on top of a vowel */',
        '  line-height: 1.85;',
        '}',
        '',
        '/* never do this to Thai: it breaks inside a syllable cluster */',
        '.dont-do-this { word-break: break-all; }',
      ]),
      ol([
        'Declare the language properly with <code class="inline-code">lang="th"</code>, on the document or on the content block, and the browser handles word breaking for you.',
        'Do not reach for <code class="inline-code">word-break: break-all</code> on Thai text — it splits syllables and strands a vowel at the start of the next line.',
        'The <code class="inline-code">hyphens</code> property does nothing useful here, because Thai does not hyphenate across a break.',
        'For mixed content or long links, <code class="inline-code">overflow-wrap</code> prevents overflow without disturbing Thai word breaking.',
        'Avoid <code class="inline-code">justify</code> for Thai in narrow columns: there are no inter-word spaces to stretch, so the extra space lands in the wrong places.',
      ]),
      h3('Leading and spacing'),
      table([
        ['Element', 'Typical English value', 'Better for Thai', 'Reason'],
        ['Body text', '1.5', '1.75 – 1.9', 'Vowels and tone marks stack up to two levels above the line'],
        ['Large headings', '1.1', '1.25 – 1.35', 'The bigger the type, the more visible the collision'],
        ['Letter spacing', 'Adjust freely', 'Leave it at normal', 'Extra tracking visually detaches marks from their consonant'],
        ['Measure', 'Around 65 characters', 'Around 40 – 45 characters', 'Thai carries more meaning per character of width'],
      ]),
      quote(
        'Badly set Thai never throws an error. It just makes the page quietly more tiring to read, in a way readers cannot name.',
        'Why typography should be reviewed with real Thai content',
      ),
      hr(),
      h2('Word-based reading time does not work'),
      code([
        '// splitting on whitespace treats a whole Thai paragraph as one word,',
        '// so count Thai characters instead and add the remaining Latin words',
        'const thaiChars = (text.match(/[\\u0E00-\\u0E7F]/g) ?? []).length',
        "const latinWords = text.replace(/[\\u0E00-\\u0E7F]/g, ' ').split(/\\s+/).filter(Boolean).length",
        '',
        '// roughly 400 Thai characters per minute, 230 English words per minute',
        'const minutes = thaiChars / 400 + latinWords / 230',
        'return Math.max(1, Math.round(minutes))',
      ]),
      todo([
        ['Set lang correctly on the document and on any block that switches language', true],
        ['Pick a font with real Thai coverage and declare an explicit fallback', true],
        ['Give Thai body text its own leading rather than inheriting the Latin default', true],
        ['Compute reading time from character counts when the content is Thai', true],
        ['Test wrapping on narrow screens with real Thai copy, not lorem ipsum', false],
      ]),
    ]),
    tags: ['Typography', 'CSS', 'i18n', 'Thai', 'Accessibility'],
    status: 'PUBLISHED',
    featured: false,
    publishedAt: '2024-10-05T06:00:00.000Z',
    updatedAt: '2025-03-08T12:40:00.000Z',
    readingMinutes: 5,
  },
]
