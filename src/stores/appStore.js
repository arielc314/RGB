import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db, isConfigured as firebaseConfigured } from '../firebase'
import {
  ref as dbRef,
  onValue,
  set,
  get
} from 'firebase/database'

const DATA_VERSION = 3

const LOCATIONS = {
  jerusalem_gaza: { id: 'jerusalem_gaza', name: 'ירושלים, רח׳ עזה' },
  givat_yaarim: { id: 'givat_yaarim', name: 'גבעת יערים' }
}

const PROFILES = {
  arik: {
    id: 'arik',
    name: 'אריק',
    color: '#ff3b3b',
    colorDim: 'rgba(255, 59, 59, 0.15)',
    colorMid: 'rgba(255, 59, 59, 0.4)',
    glow: '0 0 30px rgba(255, 59, 59, 0.3)',
    letter: 'R',
    emoji: '🔴',
    homeLocation: 'jerusalem_gaza'
  },
  dor: {
    id: 'dor',
    name: 'דור',
    color: '#3bff6f',
    colorDim: 'rgba(59, 255, 111, 0.15)',
    colorMid: 'rgba(59, 255, 111, 0.4)',
    glow: '0 0 30px rgba(59, 255, 111, 0.3)',
    letter: 'G',
    emoji: '🟢',
    homeLocation: 'givat_yaarim'
  },
  otsar: {
    id: 'otsar',
    name: 'אוצר',
    color: '#3b8bff',
    colorDim: 'rgba(59, 139, 255, 0.15)',
    colorMid: 'rgba(59, 139, 255, 0.4)',
    glow: '0 0 30px rgba(59, 139, 255, 0.3)',
    letter: 'B',
    emoji: '🔵',
    homeLocation: 'givat_yaarim'
  }
}

const DAYS = [
  { id: 'sunday', name: 'ראשון', short: 'א׳', dow: 0 },
  { id: 'monday', name: 'שני', short: 'ב׳', dow: 1 },
  { id: 'tuesday', name: 'שלישי', short: 'ג׳', dow: 2 },
  { id: 'wednesday', name: 'רביעי', short: 'ד׳', dow: 3 },
  { id: 'thursday', name: 'חמישי', short: 'ה׳', dow: 4 },
  { id: 'friday', name: 'שישי', short: 'ו׳', dow: 5 },
  { id: 'saturday', name: 'שבת', short: 'ש׳', dow: 6 }
]

const HOURS = Array.from({ length: 17 }, (_, i) => ({
  value: i + 7,
  label: `${(i + 7).toString().padStart(2, '0')}:00`
}))

const METERS = [
  { id: 'readiness', name: 'נכונות כללית', icon: '🎯', description: 'כמה בא לך לצאת?' },
  { id: 'fatigue', name: 'עייפות', icon: '😴', description: 'כמה עייף/ה?', inverted: true },
  { id: 'competitiveness', name: 'קומפטטיביות', icon: '🔥', description: 'כמה בא לך להתחרות?' },
  { id: 'fuel', name: 'דלק באוטו', icon: '⛽', description: 'כמה דלק יש?' },
  { id: 'mobility', name: 'נכונות לנסיעה', icon: '🚗', description: 'מוכן/ה לנסוע?' },
  { id: 'hosting', name: 'נכונות לאירוח', icon: '🏠', description: 'עד כמה נכון/ה לארח?' }
]

const ACTIVITIES = [
  { id: 'catan', name: 'קטאן', icon: '🏝️', category: 'games' },
  { id: 'gang_beasts', name: 'Gang Beasts', icon: '👊', category: 'games' },
  { id: 'rocket_league', name: 'Rocket League', icon: '🚀', category: 'games' },
  { id: 'dst', name: "Don't Starve", icon: '🍖', category: 'games' },
  { id: 'music', name: 'לנגן ביחד', icon: '🎸', category: 'hangout' },
  { id: 'beer', name: 'בירה / בילוי', icon: '🍺', category: 'hangout' },
  { id: 'hike', name: 'טיול', icon: '🥾', category: 'hangout' },
  { id: 'space', name: 'לעוף לחלל', icon: '🛸', category: 'hangout' }
]

const ACTIVITY_LEVELS = [
  { value: 0, label: 'לא בא לי', emoji: '😐', cls: 'level-no' },
  { value: 1, label: 'אולי', emoji: '🤔', cls: 'level-maybe' },
  { value: 2, label: 'בא לי', emoji: '😊', cls: 'level-yes' },
  { value: 3, label: 'חייב!', emoji: '🤩', cls: 'level-must' }
]

function formatDateKey(date) {
  const y = date.getFullYear()
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const d = date.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getWeekDates(weekOffset = 0) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const sunday = new Date(today)
  sunday.setDate(today.getDate() - today.getDay() + weekOffset * 7)

  const todayKey = formatDateKey(today)
  return DAYS.map((day, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    const key = formatDateKey(d)
    return {
      ...day,
      date: d,
      dateKey: key,
      dateDisplay: `${d.getDate()}/${d.getMonth() + 1}`,
      isToday: key === todayKey
    }
  })
}

function createEmptyMeters() {
  const meters = {}
  METERS.forEach(m => { meters[m.id] = null })
  return meters
}

function createEmptyActivities() {
  const activities = {}
  ACTIVITIES.forEach(a => { activities[a.id] = null })
  return activities
}

function ensureProfileFields(profile) {
  if (!profile.activities) profile.activities = createEmptyActivities()
  if (profile.busy === undefined) profile.busy = false
  if (!profile.meters) profile.meters = createEmptyMeters()
  if (!profile.availability) profile.availability = {}
  if (!profile.scheduledChanges) profile.scheduledChanges = []
  if (profile.note === undefined) profile.note = ''
  ACTIVITIES.forEach(a => {
    if (profile.activities[a.id] === undefined) profile.activities[a.id] = null
  })
  METERS.forEach(m => {
    if (profile.meters[m.id] === undefined) profile.meters[m.id] = null
  })
  return profile
}

function createDefaultProfiles() {
  const data = {}
  Object.keys(PROFILES).forEach(id => {
    data[id] = ensureProfileFields({
      busy: false,
      meters: createEmptyMeters(),
      activities: createEmptyActivities(),
      availability: {},
      scheduledChanges: [],
      lastUpdated: null,
      note: ''
    })
  })
  return data
}

// ── localStorage helpers ──

function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem('rgb-app-data')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed && parsed.profiles) {
        Object.keys(parsed.profiles).forEach(id => {
          ensureProfileFields(parsed.profiles[id])
        })
        return parsed.profiles
      }
    }
  } catch (e) {
    console.warn('localStorage load failed:', e)
  }
  return null
}

function saveToLocalStorage(profiles) {
  try {
    localStorage.setItem('rgb-app-data', JSON.stringify({
      version: DATA_VERSION,
      profiles
    }))
  } catch (e) {
    console.warn('localStorage save failed:', e)
  }
}

// ── Store ──

export const useAppStore = defineStore('app', () => {
  const currentProfileId = ref(localStorage.getItem('rgb-current-profile') || null)
  const profileData = ref(loadFromLocalStorage() || createDefaultProfiles())
  const weekOffset = ref(0)

  const isConnected = ref(false)
  const firebaseReady = ref(false)
  const useFirebase = ref(firebaseConfigured)

  const lastLocalWrite = {}
  let saveTimer = null

  // ── Computed ──

  const currentProfile = computed(() =>
    currentProfileId.value ? PROFILES[currentProfileId.value] : null
  )

  const currentData = computed(() =>
    currentProfileId.value ? profileData.value[currentProfileId.value] : null
  )

  const currentWeek = computed(() => getWeekDates(weekOffset.value))

  // ── Firebase init ──

  async function initFirebase() {
    if (!db) return

    const connRef = dbRef(db, '.info/connected')
    onValue(connRef, (snap) => {
      isConnected.value = snap.val() === true
    })

    const profilesRef = dbRef(db, 'profiles')

    try {
      const snapshot = await get(profilesRef)
      if (!snapshot.exists()) {
        await set(profilesRef, JSON.parse(JSON.stringify(profileData.value)))
      }
    } catch (e) {
      console.warn('Firebase seed check failed:', e)
    }

    onValue(profilesRef, (snapshot) => {
      const data = snapshot.val()
      if (!data) return

      const now = Date.now()
      Object.keys(PROFILES).forEach(id => {
        if (!data[id]) return
        const timeSinceWrite = now - (lastLocalWrite[id] || 0)
        if (timeSinceWrite < 2000) return
        ensureProfileFields(data[id])
        profileData.value[id] = data[id]
      })

      saveToLocalStorage(profileData.value)
      firebaseReady.value = true
    })
  }

  initFirebase()

  // ── Write helpers ──

  function _save() {
    const id = currentProfileId.value
    if (!id) return
    profileData.value[id].lastUpdated = new Date().toISOString()
    lastLocalWrite[id] = Date.now()

    saveToLocalStorage(profileData.value)

    if (db) {
      clearTimeout(saveTimer)
      saveTimer = setTimeout(() => {
        const data = JSON.parse(JSON.stringify(profileData.value[id]))
        set(dbRef(db, `profiles/${id}`), data).catch(e =>
          console.warn('Firebase write failed:', e)
        )
      }, 400)
    }
  }

  function _flushSave() {
    const id = currentProfileId.value
    if (!id || !db) return
    clearTimeout(saveTimer)
    const data = JSON.parse(JSON.stringify(profileData.value[id]))
    set(dbRef(db, `profiles/${id}`), data).catch(() => {})
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', _flushSave)
  }

  // ── Profile actions ──

  function selectProfile(id) {
    currentProfileId.value = id
    localStorage.setItem('rgb-current-profile', id)
  }

  function logout() {
    _flushSave()
    currentProfileId.value = null
    localStorage.removeItem('rgb-current-profile')
  }

  function toggleBusy() {
    if (!currentProfileId.value) return
    profileData.value[currentProfileId.value].busy =
      !profileData.value[currentProfileId.value].busy
    _save()
  }

  function updateMeter(meterId, value) {
    if (!currentProfileId.value) return
    profileData.value[currentProfileId.value].meters[meterId] = value
    _save()
  }

  function clearMeter(meterId) {
    if (!currentProfileId.value) return
    profileData.value[currentProfileId.value].meters[meterId] = null
    _save()
  }

  // ── Activities ──

  function cycleActivity(activityId) {
    if (!currentProfileId.value) return
    const current = profileData.value[currentProfileId.value].activities[activityId]
    if (current === null) profileData.value[currentProfileId.value].activities[activityId] = 0
    else if (current >= 3) profileData.value[currentProfileId.value].activities[activityId] = null
    else profileData.value[currentProfileId.value].activities[activityId] = current + 1
    _save()
  }

  function clearActivity(activityId) {
    if (!currentProfileId.value) return
    profileData.value[currentProfileId.value].activities[activityId] = null
    _save()
  }

  function getActivityOverlap() {
    const results = []
    ACTIVITIES.forEach(activity => {
      const interested = []
      Object.keys(PROFILES).forEach(id => {
        const level = profileData.value[id].activities[activity.id]
        if (level !== null && level >= 1) {
          interested.push({ id, level, name: PROFILES[id].name, color: PROFILES[id].color })
        }
      })
      if (interested.length > 0) {
        const avgLevel = interested.reduce((s, p) => s + p.level, 0) / interested.length
        results.push({ ...activity, interested, avgLevel, count: interested.length })
      }
    })
    return results.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count
      return b.avgLevel - a.avgLevel
    })
  }

  // ── Availability ──

  function isHourAvailable(profileId, dateKey, hour) {
    const avail = profileData.value[profileId].availability
    return !!(avail[dateKey] && avail[dateKey][hour])
  }

  function setHourAvailability(dateKey, hour, value) {
    if (!currentProfileId.value) return
    const avail = profileData.value[currentProfileId.value].availability
    if (!avail[dateKey]) avail[dateKey] = {}
    avail[dateKey][hour] = value
    _save()
  }

  function toggleHourAvailability(dateKey, hour) {
    if (!currentProfileId.value) return
    const current = isHourAvailable(currentProfileId.value, dateKey, hour)
    setHourAvailability(dateKey, hour, !current)
  }

  // ── Scheduled changes ──

  function addScheduledChange(dateKey, hour, meterId, value) {
    if (!currentProfileId.value) return
    profileData.value[currentProfileId.value].scheduledChanges.push({
      id: Date.now(), dateKey, hour, meterId, value
    })
    _save()
  }

  function removeScheduledChange(changeId) {
    if (!currentProfileId.value) return
    const d = profileData.value[currentProfileId.value]
    d.scheduledChanges = d.scheduledChanges.filter(c => c.id !== changeId)
    _save()
  }

  function getEffectiveMeterValue(profileId, meterId, dateKey, hour) {
    const data = profileData.value[profileId]
    const base = data.meters[meterId]
    const applicable = (data.scheduledChanges || [])
      .filter(c => c.meterId === meterId)
      .filter(c => c.dateKey < dateKey || (c.dateKey === dateKey && c.hour <= hour))
      .sort((a, b) =>
        a.dateKey === b.dateKey ? a.hour - b.hour : a.dateKey.localeCompare(b.dateKey)
      )
    return applicable.length > 0 ? applicable[applicable.length - 1].value : base
  }

  function getEffectiveMeters(profileId, dateKey, hour) {
    const result = {}
    METERS.forEach(m => {
      result[m.id] = getEffectiveMeterValue(profileId, m.id, dateKey, hour)
    })
    return result
  }

  function updateNote(note) {
    if (!currentProfileId.value) return
    profileData.value[currentProfileId.value].note = note
    _save()
  }

  // ── Logistics (default: everyone at home) ──
  const LOGISTICS_THRESHOLD = 30
  const canTravel = (id, dateKey, hour) => {
    const m = getEffectiveMeters(id, dateKey, hour)
    const mobilityOk = m.mobility !== null && m.mobility >= LOGISTICS_THRESHOLD
    const fuelOk = m.fuel !== null && m.fuel >= LOGISTICS_THRESHOLD
    return mobilityOk && fuelOk
  }
  const canHost = (id, dateKey, hour) => {
    const m = getEffectiveMeters(id, dateKey, hour)
    return m.hosting !== null && m.hosting >= LOGISTICS_THRESHOLD
  }
  const getLocationAt = (id, dateKey, hour) => {
    const loc = profileData.value[id].locationOverride?.[dateKey]?.[hour]
    return loc || PROFILES[id]?.homeLocation || 'givat_yaarim'
  }

  function getLogisticsForSlot(dateKey, hour, availableIds) {
    if (availableIds.length < 2) return { ok: false, reason: 'פחות משניים זמינים', insights: [], suggestions: [] }

    const byLoc = {}
    availableIds.forEach(id => {
      const loc = getLocationAt(id, dateKey, hour)
      if (!byLoc[loc]) byLoc[loc] = []
      byLoc[loc].push(id)
    })

    const locs = Object.keys(byLoc)
    const allSamePlace = locs.length === 1
    if (allSamePlace) {
      return { ok: true, reason: 'כולם באותו מקום', insights: [], suggestions: [] }
    }

    // Need travel + host match
    const canTravelIds = availableIds.filter(id => canTravel(id, dateKey, hour))
    const canHostIds = availableIds.filter(id => canHost(id, dateKey, hour))

    if (canTravelIds.length === 0 && !allSamePlace) {
      const insights = [
        'כולם בבית ונצרכים לנסוע — אף אחד לא יכול לנסוע (נכונות לנסיעה + דלק)',
        'חסר רק שמישהו יחליט שהוא יכול להוציא רכב'
      ]
      const suggestions = []
      availableIds.forEach(id => {
        const m = getEffectiveMeters(id, dateKey, hour)
        const name = PROFILES[id]?.name
        if (m.fuel === null || m.fuel < LOGISTICS_THRESHOLD) {
          suggestions.push({ who: name, action: 'תתדלק', result: 'אולי תוכל לגרום למפגש אפשרי' })
        }
        if (m.mobility === null || m.mobility < LOGISTICS_THRESHOLD) {
          suggestions.push({ who: name, action: 'עדכן נכונות לנסוע', result: 'אולי תוכל לגרום למפגש אפשרי' })
        }
      })
      return { ok: false, reason: 'אין אף אחד שיכול לנסוע', insights, suggestions }
    }

    if (canHostIds.length === 0 && !allSamePlace) {
      const insights = [
        'כולם בבית ונצרך מישהו לארח — אף אחד לא יכול לארח',
        'חסר רק שמישהו שיסכים לארח'
      ]
      const suggestions = availableIds.map(id => ({
        who: PROFILES[id]?.name,
        action: 'עדכן נכונות לארח',
        result: 'יכול לגרום למפגש אפשרי'
      }))
      return { ok: false, reason: 'אין אף אחד שיכול לארח', insights, suggestions }
    }

    return { ok: true, reason: 'יש התאמה נסיעה–אירוח', insights: [], suggestions: [] }
  }

  function getLogisticsInsights(dateKey, hour, availableIds, logistics) {
    if (logistics.ok) return []
    const lines = [...logistics.insights]
    logistics.suggestions.forEach(s => {
      lines.push(`${s.who}, אם ${s.action} — ${s.result}`)
    })
    if (lines.length === 0 && !logistics.ok) {
      lines.push('חסר רק שמישהו יחליט שהוא יכול להוציא רכב או לארח')
    }
    return lines
  }

  // ── Meeting logic ──

  function getOverlapScore(dateKey, hour) {
    let available = 0
    let totalReadiness = 0
    const availableIds = []
    const ids = Object.keys(PROFILES)

    ids.forEach(id => {
      const data = profileData.value[id]
      if (data.busy) return
      if (!isHourAvailable(id, dateKey, hour)) return

      available++
      availableIds.push(id)
      const meters = getEffectiveMeters(id, dateKey, hour)

      let score = 50
      if (meters.readiness !== null) score = meters.readiness
      if (meters.fatigue !== null) score = Math.max(0, score - meters.fatigue * 0.3)
      if (meters.mobility !== null) score = (score + meters.mobility) / 2
      totalReadiness += score
    })

    let baseLabel = 'אין זמינות'
    let baseScore = 0
    if (available >= 1) baseLabel = available === 1 ? 'אחד זמין' : (available === 2 ? 'שניים זמינים' : 'כולם זמינים!')
    if (available >= 1) baseScore = totalReadiness / available * (available === 1 ? 0.3 : available === 2 ? 0.7 : 1)

    const logistics = getLogisticsForSlot(dateKey, hour, availableIds)
    const insights = getLogisticsInsights(dateKey, hour, availableIds, logistics)
    const logisticsPenalty = logistics.ok ? 1 : 0.25
    const score = baseScore * logisticsPenalty

    return {
      available,
      score,
      label: baseLabel,
      logisticsOk: logistics.ok,
      logisticsReason: logistics.reason,
      logisticsInsights: insights,
      availableIds
    }
  }

  function getSlotSuggestedActivities(dateKey, hour) {
    const availableIds = Object.keys(PROFILES).filter(id => {
      return !profileData.value[id].busy && isHourAvailable(id, dateKey, hour)
    })
    if (availableIds.length < 2) return []

    const suggestions = []
    ACTIVITIES.forEach(activity => {
      let totalLevel = 0
      let voters = 0
      availableIds.forEach(id => {
        const level = profileData.value[id].activities[activity.id]
        if (level !== null && level >= 1) {
          totalLevel += level
          voters++
        }
      })
      if (voters >= 2 || (voters === 1 && totalLevel >= 2)) {
        suggestions.push({
          ...activity,
          voters,
          avgLevel: voters > 0 ? totalLevel / voters : 0,
          score: (voters / availableIds.length) * (totalLevel / (voters || 1))
        })
      }
    })
    return suggestions.sort((a, b) => b.score - a.score).slice(0, 3)
  }

  function getBestMeetingSlots() {
    const slots = []
    const week = getWeekDates(weekOffset.value)

    week.forEach(day => {
      HOURS.forEach(hour => {
        const overlap = getOverlapScore(day.dateKey, hour.value)
        if (overlap.available >= 2) {
          const activities = getSlotSuggestedActivities(day.dateKey, hour.value)
          slots.push({
            dateKey: day.dateKey,
            dayName: day.name,
            dateDisplay: day.dateDisplay,
            hour: hour.value,
            hourLabel: hour.label,
            isToday: day.isToday,
            suggestedActivities: activities,
            ...overlap
          })
        }
      })
    })
    return slots.sort((a, b) => b.score - a.score)
  }

  // ── Week nav ──

  function changeWeek(delta) { weekOffset.value += delta }
  function resetWeek() { weekOffset.value = 0 }

  return {
    PROFILES,
    LOCATIONS,
    DAYS,
    HOURS,
    METERS,
    ACTIVITIES,
    ACTIVITY_LEVELS,
    DATA_VERSION,
    currentProfileId,
    currentProfile,
    currentData,
    profileData,
    weekOffset,
    currentWeek,
    isConnected,
    firebaseReady,
    useFirebase,
    selectProfile,
    logout,
    toggleBusy,
    updateMeter,
    clearMeter,
    cycleActivity,
    clearActivity,
    getActivityOverlap,
    isHourAvailable,
    setHourAvailability,
    toggleHourAvailability,
    addScheduledChange,
    removeScheduledChange,
    getEffectiveMeterValue,
    getEffectiveMeters,
    updateNote,
    getOverlapScore,
    getSlotSuggestedActivities,
    getBestMeetingSlots,
    changeWeek,
    resetWeek,
    formatDateKey,
    getWeekDates
  }
})
