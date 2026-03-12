<template>
  <div class="group-dashboard">
    <h2 class="section-title">
      <span class="icon">👥</span>
      סטטוס הקבוצה
    </h2>

    <div class="profiles-row">
      <div
        v-for="(profile, id) in store.PROFILES"
        :key="id"
        class="profile-status-card"
        :style="{ '--color': profile.color, '--dim': profile.colorDim, '--glow': profile.glow }"
        :class="{ 'is-me': id === store.currentProfileId, busy: pdata(id).busy }"
      >
        <div class="busy-banner" v-if="pdata(id).busy">🔴 עסוק</div>

        <div class="card-header">
          <span class="card-letter">{{ profile.letter }}</span>
          <span class="card-name">{{ profile.name }}</span>
          <span class="card-badge" v-if="id === store.currentProfileId">אני</span>
        </div>

        <div class="card-meters">
          <div
            v-for="meter in store.METERS"
            :key="meter.id"
            class="mini-meter"
          >
            <span class="mini-icon">{{ meter.icon }}</span>
            <div class="mini-bar-track">
              <div
                class="mini-bar-fill"
                :style="{
                  width: (pdata(id).meters[meter.id] ?? 0) + '%',
                  opacity: pdata(id).meters[meter.id] !== null ? 1 : 0.15
                }"
              ></div>
            </div>
            <span class="mini-value" :class="{ empty: pdata(id).meters[meter.id] === null }">
              {{ pdata(id).meters[meter.id] !== null ? pdata(id).meters[meter.id] + '%' : '—' }}
            </span>
          </div>
        </div>

        <div class="card-availability">
          <div class="avail-label">זמינות היום:</div>
          <div class="avail-hours">
            <span
              v-for="hour in todayAvailableHours(id)"
              :key="hour"
              class="avail-hour-chip"
            >{{ hour }}:00</span>
            <span v-if="todayAvailableHours(id).length === 0" class="no-avail">אין</span>
          </div>
        </div>

        <div class="card-activities" v-if="hasAnyActivity(id)">
          <span
            v-for="act in activeActivities(id)"
            :key="act.id"
            class="card-act-chip"
            :class="act.cls"
          >{{ act.icon }} {{ act.emoji }}</span>
        </div>

        <div class="card-note" v-if="pdata(id).note">
          💬 {{ pdata(id).note }}
        </div>

        <div class="card-updated" v-if="pdata(id).lastUpdated">
          עדכון: {{ formatTime(pdata(id).lastUpdated) }}
        </div>
      </div>
    </div>

    <!-- Activity Overlap (collapsible) -->
    <div class="collapsible-section" v-if="activityOverlap.length > 0">
      <button class="section-toggle" @click="showOverlap = !showOverlap">
        <h3 class="sub-title">🎮 חשק משותף לפעילויות</h3>
        <span class="toggle-arrow">{{ showOverlap ? '▲' : '▼' }}</span>
      </button>
      <Transition name="expand">
        <div v-show="showOverlap" class="section-body">
      <div class="overlap-list">
        <div
          v-for="item in activityOverlap"
          :key="item.id"
          class="overlap-item"
          :class="{ hot: item.count === 3 }"
        >
          <span class="overlap-icon">{{ item.icon }}</span>
          <span class="overlap-name">{{ item.name }}</span>
          <div class="overlap-people">
            <span
              v-for="p in item.interested"
              :key="p.id"
              class="overlap-person"
              :style="{ background: p.color }"
              :title="`${p.name}: ${store.ACTIVITY_LEVELS[p.level]?.emoji || ''} ${store.ACTIVITY_LEVELS[p.level]?.label || ''}`"
            >
              {{ store.PROFILES[p.id].letter }}
            </span>
          </div>
          <span class="overlap-heat">
            {{ item.count === 3 ? '🔥' : item.avgLevel >= 2 ? '👍' : '' }}
          </span>
        </div>
      </div>
        </div>
      </Transition>
    </div>

    <div class="composite-section collapsible-section">
      <button class="section-toggle" @click="showComposite = !showComposite">
        <h3 class="sub-title">🎯 מד נכונות משולב</h3>
        <span class="toggle-arrow">{{ showComposite ? '▲' : '▼' }}</span>
      </button>
      <Transition name="expand">
        <div v-show="showComposite" class="section-body">
      <div class="composite-meter">
        <div class="composite-track">
          <div
            v-for="(profile, id) in store.PROFILES"
            :key="id"
            class="composite-segment"
            :style="{
              width: getCompositeScore(id) + '%',
              background: profile.color,
              opacity: getCompositeScore(id) > 0 ? 0.8 : 0.1
            }"
          ></div>
        </div>
        <div class="composite-labels">
          <div
            v-for="(profile, id) in store.PROFILES"
            :key="id"
            class="composite-label"
            :style="{ color: profile.color }"
            :class="{ dimmed: pdata(id).busy }"
          >
            {{ profile.name }}: {{ pdata(id).busy ? 'עסוק' : Math.round(getCompositeScore(id)) + '%' }}
          </div>
        </div>
      </div>
      <div class="group-score">
        <div class="group-score-value" :style="{ color: groupScoreColor }">
          {{ Math.round(groupScore) }}%
        </div>
        <div class="group-score-label">סיכוי למפגש</div>
      </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAppStore } from '../stores/appStore'

const store = useAppStore()

const showOverlap = ref(false)
const showComposite = ref(false)

function pdata(id) {
  return store.profileData[id]
}

const todayKey = computed(() => {
  return store.formatDateKey(new Date())
})

function todayAvailableHours(profileId) {
  const avail = store.profileData[profileId].availability[todayKey.value]
  if (!avail) return []
  return Object.entries(avail)
    .filter(([, v]) => v)
    .map(([h]) => Number(h))
    .sort((a, b) => a - b)
    .map(h => h.toString().padStart(2, '0'))
}

const activityOverlap = computed(() => store.getActivityOverlap())

function hasAnyActivity(profileId) {
  const acts = pdata(profileId).activities
  if (!acts) return false
  return Object.values(acts).some(v => v !== null && v >= 1)
}

function activeActivities(profileId) {
  const acts = pdata(profileId).activities
  if (!acts) return []
  return store.ACTIVITIES
    .filter(a => acts[a.id] !== null && acts[a.id] >= 1)
    .map(a => ({
      ...a,
      level: acts[a.id],
      emoji: store.ACTIVITY_LEVELS[acts[a.id]]?.emoji || '',
      cls: store.ACTIVITY_LEVELS[acts[a.id]]?.cls || ''
    }))
}

function getCompositeScore(id) {
  const d = store.profileData[id]
  if (d.busy) return 0
  const values = store.METERS.map(m => {
    const val = d.meters[m.id]
    if (val === null) return null
    return m.inverted ? 100 - val : val
  }).filter(v => v !== null)

  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

const groupScore = computed(() => {
  const scores = Object.keys(store.PROFILES).map(id => getCompositeScore(id))
  const active = scores.filter(s => s > 0)
  if (active.length === 0) return 0
  return active.reduce((a, b) => a + b, 0) / active.length
})

const groupScoreColor = computed(() => {
  const s = groupScore.value
  if (s >= 70) return '#3bff6f'
  if (s >= 40) return '#ffbb3b'
  return '#ff3b3b'
})

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return 'הרגע'
  if (diff < 3600000) return `לפני ${Math.floor(diff / 60000)} דק׳`
  if (diff < 86400000) return `לפני ${Math.floor(diff / 3600000)} שעות`
  return d.toLocaleDateString('he-IL', { weekday: 'short', hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.group-dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
}

.profiles-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
}

.profile-status-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 1rem;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.profile-status-card.is-me {
  border-color: var(--color);
  box-shadow: var(--glow);
}

.profile-status-card.busy {
  opacity: 0.65;
}

.busy-banner {
  background: rgba(255, 59, 59, 0.15);
  color: #ff6b6b;
  text-align: center;
  padding: 0.3rem;
  font-size: 0.8rem;
  font-weight: 700;
  margin: -1.25rem -1.25rem 0 -1.25rem;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.card-letter {
  font-size: 1.5rem;
  font-weight: 900;
  color: var(--color);
}

.card-name {
  font-size: 1.1rem;
  font-weight: 600;
  flex: 1;
}

.card-badge {
  font-size: 0.7rem;
  background: var(--dim);
  color: var(--color);
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
  font-weight: 600;
}

.card-meters {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.mini-meter {
  display: grid;
  grid-template-columns: 24px 1fr 40px;
  align-items: center;
  gap: 0.5rem;
}

.mini-icon { font-size: 0.9rem; text-align: center; }

.mini-bar-track {
  height: 6px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 3px;
  overflow: hidden;
}

.mini-bar-fill {
  height: 100%;
  background: var(--color);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.mini-value {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  text-align: left;
  font-weight: 600;
  direction: ltr;
}

.mini-value.empty {
  color: rgba(255, 255, 255, 0.2);
}

.card-availability {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.avail-label {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.4);
}

.avail-hours {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.avail-hour-chip {
  font-size: 0.7rem;
  background: var(--dim);
  color: var(--color);
  padding: 0.15rem 0.4rem;
  border-radius: 0.3rem;
  font-weight: 600;
  direction: ltr;
}

.no-avail {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.2);
}

.card-note {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.03);
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  line-height: 1.4;
}

.card-updated {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.25);
}

.composite-section {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 1rem;
}

.toggle-arrow {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.35);
}

.expand-enter-active, .expand-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.expand-enter-from, .expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}
.expand-enter-to, .expand-leave-from {
  max-height: 500px;
}

.collapsible-section {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 1rem;
  overflow: hidden;
}

.collapsible-section .section-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s;
}

.collapsible-section .section-toggle:hover {
  background: rgba(255, 255, 255, 0.03);
}

.collapsible-section .section-body {
  padding: 0 1.25rem 1.25rem;
}

.sub-title {
  font-size: 1rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 1rem 0;
}

.composite-meter {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.composite-track {
  height: 12px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 6px;
  overflow: hidden;
  display: flex;
}

.composite-segment {
  height: 100%;
  transition: width 0.5s ease;
}

.composite-labels {
  display: flex;
  justify-content: space-between;
}

.composite-label {
  font-size: 0.8rem;
  font-weight: 600;
}

.composite-label.dimmed {
  opacity: 0.4;
}

.group-score {
  text-align: center;
  margin-top: 1rem;
}

.group-score-value {
  font-size: 3rem;
  font-weight: 900;
  line-height: 1;
}

.group-score-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 0.25rem;
}

/* Activity chips in cards */
.card-activities {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.card-act-chip {
  font-size: 0.7rem;
  padding: 0.15rem 0.4rem;
  border-radius: 0.3rem;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.5);
}

.card-act-chip.level-yes,
.card-act-chip.level-must {
  background: rgba(59, 255, 111, 0.1);
  color: rgba(130, 255, 170, 0.8);
}

.card-act-chip.level-must {
  background: var(--dim);
  color: var(--color);
  font-weight: 600;
}

/* Activity overlap section */
.activity-overlap-section {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 1rem;
  padding: 1.25rem;
}

.overlap-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.overlap-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.6rem;
  background: rgba(255, 255, 255, 0.02);
  transition: all 0.2s;
}

.overlap-item.hot {
  background: rgba(255, 187, 59, 0.06);
  border: 1px solid rgba(255, 187, 59, 0.15);
}

.overlap-icon {
  font-size: 1.2rem;
}

.overlap-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  flex: 1;
}

.overlap-people {
  display: flex;
  gap: 0.25rem;
}

.overlap-person {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  font-weight: 800;
  color: #000;
}

.overlap-heat {
  font-size: 1rem;
  min-width: 20px;
  text-align: center;
}
</style>
