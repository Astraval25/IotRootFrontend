import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
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
    topics: ['factory/line-a/temperature', 'factory/line-a/motor', 'factory/line-a/power'],
    device: 'esp32-gateway-04',
  },
  {
    name: 'My Home',
    totalDevices: 12,
    topics: ['home/living-room/light', 'home/kitchen/smoke', 'home/door-lock/status'],
    device: 'home-hub-01',
  },
  {
    name: 'Office Hall',
    totalDevices: 18,
    topics: ['office/hall/ac', 'office/hall/people-count', 'office/hall/lights'],
    device: 'office-panel-02',
  },
]

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
  })

  const activeVideo = demoVideos.find((video) => video.videoId === activeVideoId) || demoVideos[0]
  const activeGroup = deviceGroups[preview.groupIndex]
  const activeTopic = activeGroup.topics[preview.topicIndex % activeGroup.topics.length]

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPreview((currentPreview) => {
        const nextGroupIndex = (currentPreview.groupIndex + 1) % deviceGroups.length
        const nextGroup = deviceGroups[nextGroupIndex]
        const nextOnlineDevices = Math.max(
          1,
          nextGroup.totalDevices - Math.floor(Math.random() * 5),
        )
        const nextMessages = currentPreview.messages + 1200 + Math.floor(Math.random() * 7800)

        return {
          onlineDevices: nextOnlineDevices,
          totalDevices: nextGroup.totalDevices,
          messages: nextMessages,
          accessRules: 60 + Math.floor(Math.random() * 9),
          groupIndex: nextGroupIndex,
          topicIndex: (currentPreview.topicIndex + 1) % nextGroup.topics.length,
          signal: Array.from({ length: 4 }, () => 28 + Math.floor(Math.random() * 72)),
          deviceOk: Math.random() > 0.12,
        }
      })
    }, 1800)

    return () => window.clearInterval(timer)
  }, [])

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
    <main className="landing-page">
      <header className="landing-nav">
        <a className="landing-brand" href="#top" aria-label="IoTRoot home">
          <img src={iotrootLogo} alt="" />
          IoTRoot
        </a>
        <nav className="landing-nav-links" aria-label="Primary">
          <a href="#demo">Demo</a>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#lead">Pilot</a>
        </nav>
        {/* <Link className="landing-nav-login" to="/iotroot/login">
          Sign in
        </Link> */}
      </header>

      <section className="landing-hero" id="top">
        <div className="landing-hero-copy">
          <p className="landing-kicker">Backend for connected devices</p>
          <h1>Build smart devices without backend worries</h1>
          <p className="landing-hero-text">
            For hobby projects, smart home devices, and industrial products. Connect,
            control, and monitor your hardware from anywhere in the world.
          </p>
          <div className="landing-actions">
            <a className="landing-button landing-button-primary" href="#lead">
              Start Free Pilot
            </a>
            <a className="landing-button landing-button-secondary" href="mailto:contact@astraval.com?subject=IoTRoot%20demo">
              Book Demo
            </a>
          </div>
        </div>

        <div className="landing-product-stack">
          <div className="landing-product-back-card landing-product-back-card-one" aria-hidden="true">
            <div>
              <span>Project: {deviceGroups[(preview.groupIndex + 1) % deviceGroups.length].name}</span>
              <strong>OK</strong>
            </div>
            <p>{deviceGroups[(preview.groupIndex + 1) % deviceGroups.length].device}</p>
            <small>{deviceGroups[(preview.groupIndex + 1) % deviceGroups.length].totalDevices} devices</small>
          </div>
          <div className="landing-product-back-card landing-product-back-card-two" aria-hidden="true">
            <div>
              <span>Project: {deviceGroups[(preview.groupIndex + 2) % deviceGroups.length].name}</span>
              <strong>OK</strong>
            </div>
            <p>{deviceGroups[(preview.groupIndex + 2) % deviceGroups.length].device}</p>
            <small>{deviceGroups[(preview.groupIndex + 2) % deviceGroups.length].totalDevices} devices</small>
          </div>
          <div className="landing-product-shot" aria-label="IoTRoot dashboard preview">
            <div className="landing-product-top">
              <span>Project: {activeGroup.name}</span>
              <strong>Live</strong>
            </div>
            <div className="landing-product-grid">
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
            <div className="landing-topic-preview">
              <span>{activeTopic}</span>
              <div className="landing-signal-bars">
                {preview.signal.map((barHeight, index) => (
                  <i
                    key={`${barHeight}-${index}`}
                    style={{ height: `${barHeight}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="landing-device-row">
              <span>{activeGroup.device}</span>
              <strong className={preview.deviceOk ? '' : 'landing-status-warning'}>
                {preview.deviceOk ? 'OK' : 'Check'}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-band landing-two-column">
        <div>
          <p className="landing-kicker">Problem</p>
          <h2>IoT teams lose time on backend plumbing.</h2>
          <p className="landing-section-text">
            You want to build the device, not spend weeks figuring out servers,
            passwords, access rules, and dashboards.
          </p>
        </div>
        <div className="landing-list-grid">
          {pains.map((pain) => (
            <article className="landing-card" key={pain}>
              <span className="landing-card-icon">!</span>
              <p>{pain}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-band landing-two-column landing-solution">
        <div>
          <p className="landing-kicker">Solution</p>
          <h2>IoTRoot handles the device backend for you.</h2>
          <p className="landing-section-text">
            Add your device, get the details it needs to connect, and start sending
            data. Then control and monitor it from your dashboard.
          </p>
        </div>
        <div className="landing-list-grid">
          {solutions.map((solution) => (
            <article className="landing-card landing-card-strong" key={solution}>
              <span className="landing-card-icon">✓</span>
              <p>{solution}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-band" id="demo" ref={demoSectionRef}>
        <div className="landing-section-head">
          <p className="landing-kicker">Demo flow</p>
          <h2>From new Product to live device data.</h2>
        </div>
        <div className="landing-video-showcase" aria-label="IoTRoot demo videos">
          <article className="landing-video-main">
            <iframe
              ref={videoIframeRef}
              src={`https://www.youtube.com/embed/${activeVideo.videoId}?enablejsapi=1${shouldAutoplayVideo ? '&autoplay=1&mute=0' : ''}`}
              title={activeVideo.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </article>
          <div className="landing-demo-flow">
            {demoSteps.map((step, index) => (
              <article className="landing-step" key={step.title}>
                <img src={step.imageUrl} alt="" loading="lazy" />
                <div className="landing-step-overlay">
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

      <section className="landing-band" id="features">
        <div className="landing-section-head">
          <p className="landing-kicker">Core features</p>
          <h2>Everything your device Product needs.</h2>
        </div>
        <div className="landing-feature-grid">
          {features.map((feature) => (
            <article className="landing-feature" key={feature}>
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

      <section className="landing-band" id="pricing">
        <div className="landing-section-head">
          <p className="landing-kicker">Pricing</p>
          <h2>Simple plans for testing and production.</h2>
        </div>
        <div className="landing-pricing-grid">
          {pricing.map((plan) => (
            <article className="landing-price-card" key={plan.name}>
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

      <section className="landing-band landing-lead-section" id="lead">
        <div>
          <p className="landing-kicker">Lead capture</p>
          <h2>Tell us what you are building.</h2>
          <p>
            Share your use case and estimated device count. We will help you map the pilot around
            device connection, control, live monitoring, and usage limits.
          </p>
        </div>

        <form className="landing-lead-form" onSubmit={handleSubmit}>
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
          <button className="landing-button landing-button-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Start Free Pilot'}
          </button>
          {status.message ? (
            <p className={`landing-form-message landing-form-message-${status.type}`}>{status.message}</p>
          ) : null}
        </form>
      </section>

      <footer className="landing-footer">
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
