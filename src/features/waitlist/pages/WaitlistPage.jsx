import { useEffect, useRef, useState } from 'react'
import iotrootLogo from '../../../assets/iotroot-logo.png'
import { createLead } from '../api/leadApi'

const pains = [
  'Setting up device login is confusing',
  'Device control is spread across tools',
  'Hard to know how much each device is using',
  'No ready backend for hardware projects',
]

const solutions = [
  'Connect your device in minutes',
  'Control devices from your app or dashboard',
  'Manage every device in one place',
  'See live device data from anywhere',
]

const demoVideos = [
  {
    title: 'Create and connect your first device',
    videoId: 'djF78_KouoI',
  },
  {
    title: 'Control your device from the dashboard',
    videoId: 'j1HAM1Tyvzs',
  },
  {
    title: 'Watch live device data',
    videoId: 'cA211UTlzkY',
  },
]

const demoSteps = [
  {
    title: 'Create project',
    imageUrl: 'https://i.ytimg.com/vi/djF78_KouoI/hqdefault.jpg',
    videoId: 'djF78_KouoI',
  },
  {
    title: 'Add device',
    imageUrl: 'https://i.ytimg.com/vi/j1HAM1Tyvzs/hqdefault.jpg',
    videoId: 'j1HAM1Tyvzs',
  },
  {
    title: 'Get MQTT credentials',
    imageUrl: 'https://i.ytimg.com/vi/cA211UTlzkY/hqdefault.jpg',
    videoId: 'cA211UTlzkY',
  },
  {
    title: 'View live data',
    imageUrl: 'https://i.ytimg.com/vi/djF78_KouoI/hqdefault.jpg',
    videoId: 'djF78_KouoI',
  },
]

const features = [
  'Simple device login',
  'Safe access for each device',
  'Easy app connection',
  'Usage limits',
  'Live data dashboard',
  'Turn devices on or off',
]

const users = [
  'IoT product startups',
  'ESP32 / embedded developers',
  'Smart home / automation companies',
  'Industrial IoT teams',
]

const pricing = [
  { name: 'Starter', price: '₹490/mo', devices: '35 devices' },
  { name: 'Growth', price: '₹1400/mo', devices: '100 devices' },
  { name: 'Business', price: '₹4190/mo', devices: '400 devices' },
]

const initialLead = {
  name: '',
  email: '',
  useCase: '',
  deviceCount: '',
}

const deviceGroups = [
  {
    name: 'Factory Line A',
    totalDevices: 25,
    device: 'esp32-gateway-04',
    seed: { temperature: 72, vibration: 58, power: 790 },
    topics: [
      {
        key: 'temperature',
        name: 'factory/line-a/temperature',
        unit: 'C',
        min: 46,
        max: 96,
        step: 6,
        timerMs: 1400,
        triggers: [
          {
            label: 'temperature > 88C',
            all: [{ key: 'temperature', operator: '>', value: 88 }],
            event: 'temperature_critical',
            action: 'start_cooling_cycle',
            status: 'critical',
            timerMs: 900,
          },
          {
            label: 'temperature > 78C and power > 860W',
            all: [
              { key: 'temperature', operator: '>', value: 78 },
              { key: 'power', operator: '>', value: 860 },
            ],
            event: 'load_spike',
            action: 'reduce_motor_speed',
            status: 'warning',
            timerMs: 1100,
          },
        ],
      },
      {
        key: 'vibration',
        name: 'factory/line-a/motor',
        unit: 'Hz',
        min: 20,
        max: 92,
        step: 8,
        timerMs: 1500,
        triggers: [
          {
            label: 'vibration > 78Hz',
            all: [{ key: 'vibration', operator: '>', value: 78 }],
            event: 'motor_vibration_alert',
            action: 'notify_operator',
            status: 'warning',
            timerMs: 1000,
          },
        ],
      },
      {
        key: 'power',
        name: 'factory/line-a/power',
        unit: 'W',
        min: 420,
        max: 980,
        step: 70,
        timerMs: 1700,
        triggers: [
          {
            label: 'power > 920W',
            all: [{ key: 'power', operator: '>', value: 920 }],
            event: 'power_peak',
            action: 'shed_non_critical_load',
            status: 'critical',
            timerMs: 950,
          },
        ],
      },
    ],
  },
  {
    name: 'My Home',
    totalDevices: 12,
    device: 'home-hub-01',
    seed: { lightLux: 260, smokePpm: 8, doorLocked: 1 },
    topics: [
      {
        key: 'lightLux',
        name: 'home/living-room/light',
        unit: 'lux',
        min: 15,
        max: 520,
        step: 54,
        timerMs: 1600,
        triggers: [
          {
            label: 'light < 80 lux and door is unlocked',
            all: [
              { key: 'lightLux', operator: '<', value: 80 },
              { key: 'doorLocked', operator: '==', value: 0 },
            ],
            event: 'entry_detected_low_light',
            action: 'switch_on_entry_lights',
            status: 'warning',
            timerMs: 1000,
          },
        ],
      },
      {
        key: 'smokePpm',
        name: 'home/kitchen/smoke',
        unit: 'ppm',
        min: 2,
        max: 45,
        step: 6,
        timerMs: 1500,
        triggers: [
          {
            label: 'smoke > 28ppm',
            all: [{ key: 'smokePpm', operator: '>', value: 28 }],
            event: 'smoke_alert',
            action: 'trigger_alarm_and_notify',
            status: 'critical',
            timerMs: 850,
          },
        ],
      },
      {
        key: 'doorLocked',
        name: 'home/door-lock/status',
        unit: '',
        min: 0,
        max: 1,
        step: 1,
        timerMs: 1700,
        discrete: true,
        triggers: [
          {
            label: 'door unlocked while smoke > 20ppm',
            all: [
              { key: 'doorLocked', operator: '==', value: 0 },
              { key: 'smokePpm', operator: '>', value: 20 },
            ],
            event: 'safety_exit_path_open',
            action: 'unlock_all_exits',
            status: 'warning',
            timerMs: 950,
          },
        ],
      },
    ],
  },
  {
    name: 'Office Hall',
    totalDevices: 18,
    device: 'office-panel-02',
    seed: { acTemp: 24, peopleCount: 38, lightState: 1 },
    topics: [
      {
        key: 'acTemp',
        name: 'office/hall/ac',
        unit: 'C',
        min: 18,
        max: 33,
        step: 2,
        timerMs: 1500,
        triggers: [
          {
            label: 'ac temperature > 30C and people > 55',
            all: [
              { key: 'acTemp', operator: '>', value: 30 },
              { key: 'peopleCount', operator: '>', value: 55 },
            ],
            event: 'comfort_drop',
            action: 'increase_ac_output',
            status: 'warning',
            timerMs: 1000,
          },
        ],
      },
      {
        key: 'peopleCount',
        name: 'office/hall/people-count',
        unit: 'people',
        min: 0,
        max: 90,
        step: 11,
        timerMs: 1400,
        triggers: [
          {
            label: 'people count > 72',
            all: [{ key: 'peopleCount', operator: '>', value: 72 }],
            event: 'occupancy_alert',
            action: 'open_secondary_zone',
            status: 'critical',
            timerMs: 900,
          },
        ],
      },
      {
        key: 'lightState',
        name: 'office/hall/lights',
        unit: '',
        min: 0,
        max: 1,
        step: 1,
        timerMs: 1700,
        discrete: true,
        triggers: [
          {
            label: 'lights off while people > 12',
            all: [
              { key: 'lightState', operator: '==', value: 0 },
              { key: 'peopleCount', operator: '>', value: 12 },
            ],
            event: 'lighting_mismatch',
            action: 'restore_hall_lighting',
            status: 'warning',
            timerMs: 1050,
          },
        ],
      },
    ],
  },
]

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1))
}

function formatMetric(topic, value) {
  if (topic.key === 'doorLocked') {
    return value === 1 ? 'locked' : 'unlocked'
  }

  if (topic.key === 'lightState') {
    return value === 1 ? 'on' : 'off'
  }

  return `${value}${topic.unit ? ` ${topic.unit}` : ''}`
}

function evaluateCondition(currentData, condition) {
  const left = Number(currentData[condition.key] ?? 0)
  const right = Number(condition.value)

  switch (condition.operator) {
    case '>':
      return left > right
    case '>=':
      return left >= right
    case '<':
      return left < right
    case '<=':
      return left <= right
    case '==':
      return left === right
    default:
      return false
  }
}

function pickMatchedTrigger(topic, currentData) {
  return topic.triggers.find((trigger) => trigger.all.every((condition) => evaluateCondition(currentData, condition)))
}

function buildNextData(group, currentData) {
  return group.topics.reduce((nextData, topic) => {
    const previousValue = Number(currentData[topic.key] ?? group.seed[topic.key] ?? topic.min)
    if (topic.discrete) {
      const shouldFlip = Math.random() > 0.7
      const nextValue = shouldFlip ? (previousValue === topic.max ? topic.min : topic.max) : previousValue
      return { ...nextData, [topic.key]: nextValue }
    }

    const drift = randomInt(-topic.step, topic.step)
    return { ...nextData, [topic.key]: clamp(previousValue + drift, topic.min, topic.max) }
  }, {})
}

function buildSignalBars(status) {
  if (status === 'critical') {
    return [86, 92, 98, 100]
  }

  if (status === 'warning') {
    return [52, 68, 80, 92]
  }

  return Array.from({ length: 4 }, (_, index) => 30 + index * 16 + randomInt(-8, 10))
}

export function WaitlistPage() {
  const demoSectionRef = useRef(null)
  const videoIframeRef = useRef(null)
  const [lead, setLead] = useState(initialLead)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeVideoId, setActiveVideoId] = useState(demoVideos[0].videoId)
  const [shouldAutoplayVideo, setShouldAutoplayVideo] = useState(false)
  const [preview, setPreview] = useState({
    onlineDevices: 18,
    totalDevices: 25,
    messages: 1240000,
    accessRules: 64,
    groupIndex: 0,
    topicIndex: 0,
    signal: [35, 58, 82, 100],
    deviceOk: true,
    liveData: { ...deviceGroups[0].seed },
    eventName: 'telemetry_ingested',
    actionName: 'store_payload',
    conditionLabel: 'waiting for first rule check',
    triggerStatus: 'normal',
    payloadValue: formatMetric(deviceGroups[0].topics[0], deviceGroups[0].seed.temperature),
    topicTimerMs: deviceGroups[0].topics[0].timerMs,
  })

  const activeVideo = demoVideos.find((video) => video.videoId === activeVideoId) || demoVideos[0]
  const activeGroup = deviceGroups[preview.groupIndex]
  const activeTopic = activeGroup.topics[preview.topicIndex % activeGroup.topics.length]

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPreview((currentPreview) => {
        const currentGroup = deviceGroups[currentPreview.groupIndex]
        const nextTopicIndex = (currentPreview.topicIndex + 1) % currentGroup.topics.length
        const isLastTopicInGroup = nextTopicIndex === 0
        const nextGroupIndex = isLastTopicInGroup
          ? (currentPreview.groupIndex + 1) % deviceGroups.length
          : currentPreview.groupIndex
        const nextGroup = deviceGroups[nextGroupIndex]
        const baseData = isLastTopicInGroup ? nextGroup.seed : currentPreview.liveData
        const nextLiveData = buildNextData(nextGroup, baseData)
        const nextTopic = nextGroup.topics[nextTopicIndex]
        const matchedTrigger = pickMatchedTrigger(nextTopic, nextLiveData)
        const triggerStatus = matchedTrigger?.status || 'normal'
        const nextOnlineDevices = Math.max(
          1,
          nextGroup.totalDevices - randomInt(0, triggerStatus === 'critical' ? 4 : 2),
        )
        const nextMessages = currentPreview.messages + 1100 + randomInt(900, 6200)
        const nextPayloadValue = formatMetric(nextTopic, nextLiveData[nextTopic.key])

        return {
          onlineDevices: nextOnlineDevices,
          totalDevices: nextGroup.totalDevices,
          messages: nextMessages,
          accessRules: 60 + randomInt(0, 8),
          groupIndex: nextGroupIndex,
          topicIndex: nextTopicIndex,
          signal: buildSignalBars(triggerStatus),
          deviceOk: triggerStatus !== 'critical' && Math.random() > 0.08,
          liveData: nextLiveData,
          eventName: matchedTrigger?.event || 'telemetry_ingested',
          actionName: matchedTrigger?.action || 'update_dashboard',
          conditionLabel: matchedTrigger?.label || `No condition matched for ${nextTopic.key}`,
          triggerStatus,
          payloadValue: nextPayloadValue,
          topicTimerMs: matchedTrigger?.timerMs || nextTopic.timerMs,
        }
      })
    }, preview.topicTimerMs)

    return () => window.clearTimeout(timer)
  }, [preview.topicTimerMs])

  useEffect(() => {
    if (!shouldAutoplayVideo || !videoIframeRef.current) {
      return undefined
    }

    const playerWindow = videoIframeRef.current.contentWindow
    const sendPlayerCommand = (func, args = []) => {
      playerWindow?.postMessage(
        JSON.stringify({
          event: 'command',
          func,
          args,
        }),
        '*',
      )
    }

    const timer = window.setTimeout(() => {
      sendPlayerCommand('setVolume', [50])
      sendPlayerCommand('unMute')
      sendPlayerCommand('playVideo')
    }, 800)

    return () => window.clearTimeout(timer)
  }, [activeVideo.videoId, shouldAutoplayVideo])

  useEffect(() => {
    const demoSection = demoSectionRef.current

    if (!demoSection) {
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldAutoplayVideo(true)
          observer.disconnect()
        }
      },
      { threshold: 0.35 },
    )

    observer.observe(demoSection)

    return () => observer.disconnect()
  }, [])

  const formattedMessages = `${(preview.messages / 1000000).toFixed(2)}M`

  function updateLead(field, value) {
    setLead((currentLead) => ({ ...currentLead, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setIsSubmitting(true)
    setStatus({ type: '', message: '' })

    try {
      await createLead({
        name: lead.name.trim(),
        email: lead.email.trim(),
        useCase: lead.useCase.trim(),
        deviceCount: Number(lead.deviceCount),
      })
      setLead(initialLead)
      setStatus({
        type: 'success',
        message: 'Thanks. We received your pilot request and will contact you shortly.',
      })
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Could not save your request. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  function playVideo(videoId) {
    setActiveVideoId(videoId)
    setShouldAutoplayVideo(true)
  }

  return (
    <main className="min-h-dvh bg-[#f7f8fc] text-[#1d2f6f] [&_.landing-kicker]:mb-3 [&_.landing-kicker]:text-xs [&_.landing-kicker]:font-extrabold [&_.landing-kicker]:uppercase [&_.landing-kicker]:tracking-[.08em] [&_.landing-kicker]:text-[#8390fa] [&_.landing-section-text]:mt-3 [&_.landing-section-text]:max-w-[520px] [&_.landing-section-text]:text-slate-600 [&_.landing-section-head]:mb-5 [&_.landing-section-head]:max-w-[720px] [&_.landing-card-icon]:grid [&_.landing-card-icon]:size-7 [&_.landing-card-icon]:place-items-center [&_.landing-card-icon]:rounded [&_.landing-card-icon]:bg-[#fac748] [&_.landing-card-icon]:font-black [&_.landing-product-grid]:grid [&_.landing-product-grid]:grid-cols-3 [&_.landing-product-grid]:gap-2.5 [&_.landing-product-grid>div]:rounded [&_.landing-product-grid>div]:border [&_.landing-product-grid>div]:border-slate-300 [&_.landing-product-grid>div]:bg-[#f7f8fc] [&_.landing-product-grid>div]:p-3 [&_.landing-product-top]:flex [&_.landing-product-top]:justify-between [&_.landing-product-top]:border-b [&_.landing-product-top]:border-slate-300 [&_.landing-product-top]:pb-3 [&_.landing-topic-preview]:flex [&_.landing-topic-preview]:items-center [&_.landing-topic-preview]:justify-between [&_.landing-topic-preview]:rounded [&_.landing-topic-preview]:border [&_.landing-topic-preview]:border-slate-300 [&_.landing-topic-preview]:bg-[#f7f8fc] [&_.landing-topic-preview]:p-3.5 [&_.landing-device-row]:flex [&_.landing-device-row]:items-center [&_.landing-device-row]:justify-between [&_.landing-device-row]:rounded [&_.landing-device-row]:border [&_.landing-device-row]:border-slate-300 [&_.landing-device-row]:bg-[#f7f8fc] [&_.landing-device-row]:p-3.5 [&_.landing-trigger-preview]:grid [&_.landing-trigger-preview]:gap-2 [&_.landing-trigger-preview]:rounded [&_.landing-trigger-preview]:border [&_.landing-trigger-preview]:border-slate-300 [&_.landing-trigger-preview]:bg-[#f7f8fc] [&_.landing-trigger-preview]:p-3.5 [&_.landing-demo-flow]:grid [&_.landing-demo-flow]:gap-3 [&_.landing-step]:relative [&_.landing-step]:overflow-hidden [&_.landing-step]:rounded [&_.landing-step]:bg-[#1d2f6f] [&_.landing-step]:text-white [&_.landing-step_img]:aspect-video [&_.landing-step_img]:w-full [&_.landing-step_img]:object-cover [&_.landing-step_img]:brightness-75 [&_.landing-step-overlay]:absolute [&_.landing-step-overlay]:inset-x-3 [&_.landing-step-overlay]:top-3 [&_.landing-step-overlay]:flex [&_.landing-step-overlay]:items-center [&_.landing-step-overlay]:gap-2.5 [&_.landing-users]:flex [&_.landing-users]:flex-wrap [&_.landing-users]:gap-3 [&_.landing-users_span]:rounded-full [&_.landing-users_span]:border [&_.landing-users_span]:border-slate-300 [&_.landing-users_span]:bg-white [&_.landing-users_span]:px-3.5 [&_.landing-users_span]:py-2.5 [&_.landing-users_span]:font-bold [&_.landing-button]:inline-flex [&_.landing-button]:min-h-11 [&_.landing-button]:items-center [&_.landing-button]:justify-center [&_.landing-button]:rounded [&_.landing-button]:px-4 [&_.landing-button]:py-3 [&_.landing-button]:font-extrabold [&_.landing-button-primary]:bg-[#1d2f6f] [&_.landing-button-primary]:text-white [&_.landing-button-secondary]:border [&_.landing-button-secondary]:border-slate-300 [&_.landing-button-secondary]:bg-white [&_.landing-button-secondary]:text-slate-600 [&_.landing-actions]:mt-6 [&_.landing-actions]:flex [&_.landing-actions]:flex-wrap [&_.landing-actions]:gap-3 [&_.landing-band]:mx-auto [&_.landing-band]:w-[min(1180px,calc(100%-2rem))] [&_.landing-band]:border-t [&_.landing-band]:border-slate-300 [&_.landing-band]:py-[clamp(2.4rem,6vw,4.5rem)] [&_.landing-two-column]:grid [&_.landing-two-column]:grid-cols-2 [&_.landing-two-column]:gap-8 max-[760px]:[&_.landing-two-column]:grid-cols-1 [&_.landing-trust]:grid [&_.landing-trust]:grid-cols-3 [&_.landing-trust]:gap-3 max-[620px]:[&_.landing-trust]:grid-cols-1 [&_.landing-cta]:mx-auto [&_.landing-cta]:flex [&_.landing-cta]:w-[min(1180px,calc(100%-2rem))] [&_.landing-cta]:items-center [&_.landing-cta]:justify-between [&_.landing-cta]:border-t [&_.landing-cta]:border-slate-300 [&_.landing-cta]:py-12 max-[760px]:[&_.landing-cta]:grid">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 shadow-[0_1px_8px_rgb(15_23_42_/_5%)] backdrop-blur">
        <div className="mx-auto flex min-h-16 w-full max-w-[1240px] items-center gap-6 px-6 max-sm:min-h-14 max-sm:px-4">
        <a className="inline-flex shrink-0 items-center gap-2.5 text-[#1d2f6f] no-underline" href="#top" aria-label="IoTRoot home">
          <img className="size-9 rounded-lg object-contain max-sm:size-8" src={iotrootLogo} alt="" />
          <span className="text-lg font-bold tracking-tight">IoTRoot</span>
        </a>
        <nav className="ml-auto flex items-center justify-center gap-1 text-sm max-[760px]:hidden [&_a]:rounded-md [&_a]:px-3 [&_a]:py-2 [&_a]:font-medium [&_a]:text-slate-600 [&_a]:no-underline [&_a]:transition-colors [&_a:hover]:bg-[#eef0ff] [&_a:hover]:text-[#1d2f6f]" aria-label="Primary">
          <a href="#demo">How it works</a>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <div className="ml-3 flex items-center gap-2">
          <a className="rounded-md px-3 py-2 text-sm font-semibold text-[#1d2f6f] no-underline hover:bg-[#eef0ff] max-[420px]:hidden" href="/iotroot/login">Sign in</a>
          <a className="inline-flex min-h-9 items-center rounded-md bg-[#1d2f6f] px-4 text-sm font-semibold text-white no-underline shadow-sm transition-colors hover:bg-[#8390fa]" href="#lead">Start pilot</a>
        </div>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-68px)] w-[min(1180px,calc(100%-2rem))] grid-cols-[minmax(0,1fr)_minmax(340px,.85fr)] items-center gap-[clamp(1.5rem,5vw,4rem)] py-[clamp(2.5rem,7vw,5rem)] max-[760px]:min-h-0 max-[760px]:grid-cols-1" id="top">
        <div className="[&_h1]:m-0 [&_h1]:max-w-[760px] [&_h1]:text-[clamp(2.15rem,5.3vw,6rem)] [&_h1]:leading-[1.04]">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-[.08em] text-[#8390fa]">Backend for connected devices</p>
          <h1>Build smart devices without backend worries</h1>
          <p className="mt-4 max-w-[680px] text-[clamp(1.05rem,2vw,1.32rem)] text-slate-600">
            For hobby projects, smart home devices, and industrial products. Connect,
            control, and monitor your hardware from anywhere in the world.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a className="inline-flex min-h-11 items-center justify-center rounded bg-[#1d2f6f] px-4 py-3 font-extrabold text-white no-underline hover:bg-[#8390fa]" href="#lead">
              Start Free Pilot
            </a>
            <a className="inline-flex min-h-11 items-center justify-center rounded border border-slate-300 bg-white px-4 py-3 font-extrabold text-slate-600 no-underline hover:border-[#8390fa]" href="mailto:contact@astraval.com?subject=IoTRoot%20demo">
              Book Demo
            </a>
          </div>
        </div>

        <div className="relative py-16">
          <div className="absolute right-[-3.3rem] top-1 z-0 grid min-h-[190px] w-[92%] scale-95 gap-3 overflow-hidden rounded border border-slate-300 bg-white p-3.5 opacity-75 shadow-xl max-[620px]:inset-x-0 max-[620px]:max-w-full" aria-hidden="true">
            <div>
              <span>Project: {deviceGroups[(preview.groupIndex + 1) % deviceGroups.length].name}</span>
              <strong>OK</strong>
            </div>
            <p>{deviceGroups[(preview.groupIndex + 1) % deviceGroups.length].device}</p>
            <small>{deviceGroups[(preview.groupIndex + 1) % deviceGroups.length].totalDevices} devices</small>
          </div>
          <div className="absolute bottom-1 left-[-3.3rem] z-0 grid min-h-[190px] w-[92%] scale-[.94] gap-3 overflow-hidden rounded border border-slate-300 bg-white p-3.5 opacity-60 shadow-xl max-[620px]:inset-x-0 max-[620px]:max-w-full" aria-hidden="true">
            <div>
              <span>Project: {deviceGroups[(preview.groupIndex + 2) % deviceGroups.length].name}</span>
              <strong>OK</strong>
            </div>
            <p>{deviceGroups[(preview.groupIndex + 2) % deviceGroups.length].device}</p>
            <small>{deviceGroups[(preview.groupIndex + 2) % deviceGroups.length].totalDevices} devices</small>
          </div>
          <div className="relative z-[1] grid gap-3.5 rounded border border-[#d5dbdb] bg-white p-4 shadow-2xl" aria-label="IoTRoot dashboard preview">
            <div className="flex items-center justify-between gap-4 border-b border-slate-300 pb-3">
              <span>Project: {activeGroup.name}</span>
              <strong>Live</strong>
            </div>
            <div className="grid grid-cols-3 gap-2.5 max-[620px]:grid-cols-1">
              <div>
                <span>Online devices</span>
                <strong>{preview.onlineDevices} / {preview.totalDevices}</strong>
              </div>
              <div>
                <span>Messages today</span>
                <strong>{formattedMessages}</strong>
              </div>
              <div>
                <span>Access rules</span>
                <strong>{preview.accessRules}</strong>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 rounded border border-slate-300 bg-[#f7f8fc] p-3.5">
              <span>{activeTopic.name}</span>
              <div className="flex h-[34px] items-end gap-1 [&_i]:w-[9px] [&_i]:rounded-t-full [&_i]:bg-[#1d2f6f]">
                {preview.signal.map((barHeight, index) => (
                  <i
                    key={`${barHeight}-${index}`}
                    style={{ height: `${barHeight}%` }}
                  />
                ))}
              </div>
            </div>
            <div className={`grid gap-2 rounded border p-3.5 ${preview.triggerStatus === 'critical' ? 'border-red-300 bg-red-50' : preview.triggerStatus === 'warning' ? 'border-[#fac748] bg-amber-50' : 'border-slate-300 bg-[#f7f8fc]'}`}>
              <div className="flex items-center justify-between gap-2">
                <strong>Conditional Engine</strong>
                <small>{`${Math.round(preview.topicTimerMs / 100) / 10}s timer`}</small>
              </div>
              <p>{preview.conditionLabel}</p>
              <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-3 gap-y-1 text-sm">
                <span>Data</span>
                <strong>{preview.payloadValue}</strong>
                <span>Event</span>
                <strong>{preview.eventName}</strong>
                <span>Action</span>
                <strong>{preview.actionName}</strong>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 rounded border border-slate-300 bg-[#f7f8fc] p-3.5">
              <span>{activeGroup.device}</span>
              <strong className={preview.deviceOk ? 'rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700' : 'rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800'}>
                {preview.deviceOk ? 'OK' : 'Check'}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-[min(1180px,calc(100%-2rem))] grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)] items-start gap-[clamp(1.2rem,4vw,3rem)] border-t border-slate-300 py-[clamp(2.4rem,6vw,4.5rem)] max-[760px]:grid-cols-1">
        <div>
          <p className="landing-kicker">Problem</p>
          <h2>IoT teams lose time on backend plumbing.</h2>
          <p className="landing-section-text">
            You want to build the device, not spend weeks figuring out servers,
            passwords, access rules, and dashboards.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 max-[620px]:grid-cols-1">
          {pains.map((pain) => (
            <article className="grid min-h-[104px] content-between gap-3 rounded border border-slate-300 bg-white p-4" key={pain}>
              <span className="landing-card-icon">!</span>
              <p>{pain}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-[min(1180px,calc(100%-2rem))] grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)] items-start gap-[clamp(1.2rem,4vw,3rem)] border-t border-slate-300 py-[clamp(2.4rem,6vw,4.5rem)] max-[760px]:grid-cols-1">
        <div>
          <p className="landing-kicker">Solution</p>
          <h2>IoTRoot handles the device backend for you.</h2>
          <p className="landing-section-text">
            Add your device, get the details it needs to connect, and start sending
            data. Then control and monitor it from your dashboard.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 max-[620px]:grid-cols-1">
          {solutions.map((solution) => (
            <article className="grid min-h-[104px] content-between gap-3 rounded border border-slate-300 bg-white p-4" key={solution}>
              <span className="landing-card-icon">✓</span>
              <p>{solution}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-[min(1180px,calc(100%-2rem))] border-t border-slate-300 py-[clamp(2.4rem,6vw,4.5rem)]" id="demo" ref={demoSectionRef}>
        <div className="landing-section-head">
          <p className="landing-kicker">Demo flow</p>
          <h2>From new Product to live device data.</h2>
        </div>
        <div className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(210px,260px)] items-start gap-3.5 max-[760px]:grid-cols-1" aria-label="IoTRoot demo videos">
          <article className="aspect-video overflow-hidden rounded border border-slate-300 bg-white [&_iframe]:h-full [&_iframe]:w-full">
            <iframe
              ref={videoIframeRef}
              src={`https://www.youtube.com/embed/${activeVideo.videoId}?enablejsapi=1${shouldAutoplayVideo ? '&autoplay=1&mute=0' : ''}`}
              title={activeVideo.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </article>
          <div className="grid gap-3">
            {demoSteps.map((step, index) => (
              <article className="relative grid overflow-hidden rounded bg-[#1d2f6f] text-white" key={step.title}>
                <img src={step.imageUrl} alt="" loading="lazy" />
                <div className="absolute inset-x-3 top-3 flex items-center gap-2.5">
                  <span>{index + 1}</span>
                  <strong>{step.title}</strong>
                </div>
                <button type="button" onClick={() => playVideo(step.videoId)}>
                  Play now
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-[min(1180px,calc(100%-2rem))] border-t border-slate-300 py-[clamp(2.4rem,6vw,4.5rem)]" id="features">
        <div className="landing-section-head">
          <p className="landing-kicker">Core features</p>
          <h2>Everything your device Product needs.</h2>
        </div>
        <div className="grid grid-cols-3 gap-3 max-[760px]:grid-cols-2 max-[620px]:grid-cols-1">
          {features.map((feature) => (
            <article className="flex items-center gap-3 rounded border border-slate-300 bg-white p-4" key={feature}>
              <span />
              <strong>{feature}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-band landing-two-column">
        <div>
          <p className="landing-kicker">Target users</p>
          <h2>For builders making real connected hardware.</h2>
        </div>
        <div className="landing-users">
          {users.map((user) => (
            <span key={user}>{user}</span>
          ))}
        </div>
      </section>

      <section className="mx-auto w-[min(1180px,calc(100%-2rem))] border-t border-slate-300 py-[clamp(2.4rem,6vw,4.5rem)]" id="pricing">
        <div className="landing-section-head">
          <p className="landing-kicker">Pricing</p>
          <h2>Simple plans for testing and production.</h2>
        </div>
        <div className="grid grid-cols-3 gap-3 max-[760px]:grid-cols-2 max-[620px]:grid-cols-1">
          {pricing.map((plan) => (
            <article className="grid gap-2.5 rounded border border-slate-300 bg-white p-5" key={plan.name}>
              <span>{plan.name}</span>
              <strong>{plan.price}</strong>
              <p>{plan.devices}</p>
              <a href="#lead">Start Free Pilot</a>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-band landing-trust">
        <article>
          <strong>Built for production use</strong>
          <p>Safe device connection, clear access control, and live usage tracking.</p>
        </article>
        <article>
          <strong>Demo use case: smart home fleet</strong>
          <p>Connect lights, sensors, and gateways, then control them from one dashboard.</p>
        </article>
        <article>
          <strong>Demo use case: industrial sensors</strong>
          <p>Monitor machines and sensors from anywhere while keeping usage under control.</p>
        </article>
      </section>

      <section className="landing-cta">
        <h2>Start your IoT backend pilot.</h2>
        <div className="landing-actions">
          <a className="landing-button landing-button-primary" href="#lead">
            Start Free Pilot
          </a>
          <a className="landing-button landing-button-secondary" href="mailto:contact@astraval.com?subject=IoTRoot%20live%20demo">
            Book Live Demo
          </a>
        </div>
      </section>

      <section className="mx-auto grid w-[min(1180px,calc(100%-2rem))] grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)] gap-8 border-t border-slate-300 py-[clamp(2.4rem,6vw,4.5rem)] max-[760px]:grid-cols-1" id="lead">
        <div>
          <p className="landing-kicker">Lead capture</p>
          <h2>Tell us what you are building.</h2>
          <p>
            Share your use case and estimated device count. We will help you map the pilot around
            device connection, control, live monitoring, and usage limits.
          </p>
        </div>

        <form className="grid gap-3.5 rounded border border-slate-300 bg-white p-4 [&_label]:grid [&_label]:gap-1.5 [&_input]:rounded [&_input]:border [&_input]:border-slate-300 [&_input]:bg-[#f7f8fc] [&_input]:p-3 [&_textarea]:rounded [&_textarea]:border [&_textarea]:border-slate-300 [&_textarea]:bg-[#f7f8fc] [&_textarea]:p-3" onSubmit={handleSubmit}>
          <label htmlFor="lead-name">
            <span>Name</span>
            <input
              id="lead-name"
              value={lead.name}
              onChange={(event) => updateLead('name', event.target.value)}
              autoComplete="name"
              required
            />
          </label>
          <label htmlFor="lead-email">
            <span>Email</span>
            <input
              id="lead-email"
              type="email"
              value={lead.email}
              onChange={(event) => updateLead('email', event.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label htmlFor="lead-use-case">
            <span>Use case</span>
            <textarea
              id="lead-use-case"
              value={lead.useCase}
              onChange={(event) => updateLead('useCase', event.target.value)}
              rows="4"
              required
            />
          </label>
          <label htmlFor="lead-device-count">
            <span>Device count</span>
            <input
              id="lead-device-count"
              type="number"
              min="1"
              value={lead.deviceCount}
              onChange={(event) => updateLead('deviceCount', event.target.value)}
              required
            />
          </label>
          <button className="inline-flex min-h-11 items-center justify-center rounded bg-[#1d2f6f] px-4 py-3 font-extrabold text-white hover:bg-[#8390fa] disabled:opacity-50" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Start Free Pilot'}
          </button>
          {status.message ? (
            <p className={`m-0 rounded p-3 text-sm ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{status.message}</p>
          ) : null}
        </form>
      </section>

      <footer className="mx-auto flex w-[min(1180px,calc(100%-2rem))] flex-wrap items-center gap-4 border-t border-slate-300 pb-8 pt-5 text-sm">
        <span>IoTRoot</span>
        <a href="mailto:contact@astraval.com">Contact</a>
        <a href="/docs">Docs</a>
        <a href="https://github.com" target="_blank" rel="noreferrer">
          GitHub
        </a>
        <a href="/privacy">Privacy</a>
      </footer>
    </main>
  )
}
