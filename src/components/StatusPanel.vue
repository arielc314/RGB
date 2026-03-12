<template>
  <div class="status-panel">
    <!-- Busy Toggle -->
    <button
      class="busy-toggle"
      :class="{ active: store.currentData.busy }"
      @click="store.toggleBusy()"
    >
      <span class="busy-icon">{{ store.currentData.busy ? '🔴' : '🟢' }}</span>
      <span class="busy-text">{{ store.currentData.busy ? 'עסוק — לא זמין' : 'פנוי' }}</span>
      <span class="busy-switch">
        <span class="busy-knob"></span>
      </span>
    </button>

    <h2 class="section-title">
      <span class="icon">📊</span>
      המדדים שלי
    </h2>
    <p class="section-hint">לא חובה למלא הכל — מה שרלוונטי</p>

    <div class="meters-grid">
      <div
        v-for="meter in store.METERS"
        :key="meter.id"
        class="meter-card"
        :class="{ active: currentMeters[meter.id] !== null }"
      >
        <div class="meter-header">
          <span class="meter-icon">{{ meter.icon }}</span>
          <span class="meter-name">{{ meter.name }}</span>
          <button
            v-if="currentMeters[meter.id] !== null"
            class="meter-clear"
            @click="store.clearMeter(meter.id)"
            title="נקה"
          >✕</button>
        </div>

        <p class="meter-desc">{{ meter.description }}</p>

        <div class="meter-control">
          <div
            class="custom-slider"
            :ref="el => sliderRefs[meter.id] = el"
            @pointerdown="startSlider($event, meter.id)"
          >
            <div class="slider-bg"></div>
            <div
              class="slider-fill"
              :style="{
                width: (currentMeters[meter.id] ?? 0) + '%',
                background: currentMeters[meter.id] !== null
                  ? `linear-gradient(90deg, ${profileColor}44, ${profileColor})`
                  : 'rgba(255,255,255,0.08)'
              }"
            ></div>
            <div
              v-if="currentMeters[meter.id] !== null"
              class="slider-thumb"
              :style="{
                left: currentMeters[meter.id] + '%',
                background: profileColor
              }"
            ></div>
          </div>
          <div class="meter-value" v-if="currentMeters[meter.id] !== null">
            <span class="value-number" :style="{ color: profileColor }">{{ currentMeters[meter.id] }}%</span>
            <span class="value-label">{{ getLabel(currentMeters[meter.id], meter.inverted) }}</span>
          </div>
          <div class="meter-value empty" v-else>
            <span class="value-label">לחצו או גררו כדי לקבוע</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Activities Section -->
    <h2 class="section-title" style="margin-top: 0.5rem;">
      <span class="icon">🎮</span>
      חשק לפעילויות
    </h2>
    <p class="section-hint">לחצו כדי לעדכן — לחיצה נוספת משנה רמה</p>

    <div class="activities-category">
      <h3 class="category-label">🕹️ משחקים</h3>
      <div class="activities-grid">
        <button
          v-for="act in gameActivities"
          :key="act.id"
          class="activity-card"
          :class="getActivityClass(act.id)"
          @click="store.cycleActivity(act.id)"
          @contextmenu.prevent="store.clearActivity(act.id)"
        >
          <span class="act-icon">{{ act.icon }}</span>
          <span class="act-name">{{ act.name }}</span>
          <span class="act-level">{{ getActivityEmoji(act.id) }}</span>
        </button>
      </div>
    </div>

    <div class="activities-category">
      <h3 class="category-label">🌟 פעילויות</h3>
      <div class="activities-grid">
        <button
          v-for="act in hangoutActivities"
          :key="act.id"
          class="activity-card"
          :class="getActivityClass(act.id)"
          @click="store.cycleActivity(act.id)"
          @contextmenu.prevent="store.clearActivity(act.id)"
        >
          <span class="act-icon">{{ act.icon }}</span>
          <span class="act-name">{{ act.name }}</span>
          <span class="act-level">{{ getActivityEmoji(act.id) }}</span>
        </button>
      </div>
    </div>

    <div class="note-section">
      <label class="note-label">
        <span class="icon">💬</span>
        הערה חופשית
      </label>
      <textarea
        class="note-input"
        :value="store.currentData.note"
        @input="store.updateNote($event.target.value)"
        placeholder="משהו שחשוב לציין... (למשל: ׳יש לי רכב היום׳)"
        rows="2"
      ></textarea>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive } from 'vue'
import { useAppStore } from '../stores/appStore'

const store = useAppStore()
const sliderRefs = reactive({})

const currentMeters = computed(() => store.currentData.meters)
const profileColor = computed(() => store.currentProfile?.color || '#fff')

const gameActivities = computed(() => store.ACTIVITIES.filter(a => a.category === 'games'))
const hangoutActivities = computed(() => store.ACTIVITIES.filter(a => a.category === 'hangout'))

function getActivityClass(activityId) {
  const level = store.currentData.activities?.[activityId]
  if (level === null || level === undefined) return 'level-unset'
  return store.ACTIVITY_LEVELS[level]?.cls || 'level-unset'
}

function getActivityEmoji(activityId) {
  const level = store.currentData.activities?.[activityId]
  if (level === null || level === undefined) return '⚫'
  return store.ACTIVITY_LEVELS[level]?.emoji || '⚫'
}

function calcValueFromEvent(e, meterId) {
  const track = sliderRefs[meterId]
  if (!track) return 50
  const rect = track.getBoundingClientRect()
  const x = e.clientX - rect.left
  const pct = Math.max(0, Math.min(100, (x / rect.width) * 100))
  return Math.round(pct / 5) * 5
}

function startSlider(e, meterId) {
  e.preventDefault()
  const el = sliderRefs[meterId]
  if (!el) return
  el.setPointerCapture(e.pointerId)

  const val = calcValueFromEvent(e, meterId)
  store.updateMeter(meterId, val)

  function onMove(ev) {
    store.updateMeter(meterId, calcValueFromEvent(ev, meterId))
  }
  function onUp() {
    el.removeEventListener('pointermove', onMove)
    el.removeEventListener('pointerup', onUp)
    el.removeEventListener('pointercancel', onUp)
  }
  el.addEventListener('pointermove', onMove)
  el.addEventListener('pointerup', onUp)
  el.addEventListener('pointercancel', onUp)
}

function getLabel(value, inverted) {
  if (value === null) return ''
  const effective = inverted ? 100 - value : value
  if (effective >= 80) return inverted ? 'רענן' : 'מלא!'
  if (effective >= 60) return inverted ? 'סבבה' : 'טוב'
  if (effective >= 40) return inverted ? 'ככה ככה' : 'בינוני'
  if (effective >= 20) return inverted ? 'עייף' : 'נמוך'
  return inverted ? 'גמור' : 'ריק'
}
</script>

<style scoped>
.status-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.busy-toggle {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(59, 255, 111, 0.06);
  cursor: pointer;
  transition: all 0.3s;
  font-family: inherit;
  color: white;
  width: 100%;
}

.busy-toggle.active {
  background: rgba(255, 59, 59, 0.1);
  border-color: rgba(255, 59, 59, 0.3);
}

.busy-icon {
  font-size: 1.3rem;
}

.busy-text {
  flex: 1;
  text-align: right;
  font-size: 1rem;
  font-weight: 600;
}

.busy-switch {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: rgba(59, 255, 111, 0.3);
  position: relative;
  transition: background 0.3s;
}

.busy-toggle.active .busy-switch {
  background: rgba(255, 59, 59, 0.4);
}

.busy-knob {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #3bff6f;
  position: absolute;
  top: 3px;
  right: 3px;
  transition: all 0.3s;
}

.busy-toggle.active .busy-knob {
  right: 23px;
  background: #ff3b3b;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.5rem 0 0 0;
}

.section-hint {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.35);
  margin: 0;
}

.meters-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.meter-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 1rem;
  padding: 1rem 1.25rem;
  transition: all 0.3s;
}

.meter-card.active {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

.meter-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.meter-icon { font-size: 1.2rem; }

.meter-name {
  font-weight: 600;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.85);
  flex: 1;
}

.meter-clear {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.25rem;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-family: inherit;
}

.meter-clear:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}

.meter-desc {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.3);
  margin: 0 0 0.75rem 0;
}

.meter-control {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Custom pointer-based slider (direction-independent) */
.custom-slider {
  position: relative;
  height: 28px;
  cursor: pointer;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  display: flex;
  align-items: center;
}

.slider-bg {
  position: absolute;
  left: 0;
  right: 0;
  height: 8px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
}

.slider-fill {
  position: absolute;
  left: 0;
  height: 8px;
  border-radius: 4px;
  transition: width 0.05s linear;
  pointer-events: none;
}

.slider-thumb {
  position: absolute;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  transform: translateX(-50%);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.4);
  pointer-events: none;
  transition: left 0.05s linear;
}

.meter-value {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.meter-value.empty {
  opacity: 0.4;
}

.value-number {
  font-size: 1.5rem;
  font-weight: 700;
}

.value-label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
}

.note-section {
  margin-top: 0.5rem;
}

.note-label {
  font-size: 1rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.note-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  color: rgba(255, 255, 255, 0.8);
  font-family: inherit;
  font-size: 0.9rem;
  resize: vertical;
  transition: border-color 0.2s;
  box-sizing: border-box;
  direction: rtl;
}

.note-input:focus {
  outline: none;
  border-color: v-bind('profileColor');
}

.note-input::placeholder {
  color: rgba(255, 255, 255, 0.2);
}

/* Activities */
.activities-category {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.category-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

.activities-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.activity-card {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 0.85rem;
  border-radius: 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  color: white;
  user-select: none;
  -webkit-user-select: none;
}

.activity-card:active {
  transform: scale(0.97);
}

.act-icon {
  font-size: 1.3rem;
  flex-shrink: 0;
}

.act-name {
  font-size: 0.8rem;
  font-weight: 500;
  flex: 1;
  text-align: right;
  color: rgba(255, 255, 255, 0.6);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.act-level {
  font-size: 1.1rem;
  flex-shrink: 0;
}

/* Level states */
.activity-card.level-unset {
  opacity: 0.5;
}

.activity-card.level-unset:hover {
  opacity: 0.7;
  background: rgba(255, 255, 255, 0.04);
}

.activity-card.level-no {
  background: rgba(255, 80, 80, 0.08);
  border-color: rgba(255, 80, 80, 0.15);
}

.activity-card.level-no .act-name {
  color: rgba(255, 150, 150, 0.7);
}

.activity-card.level-maybe {
  background: rgba(255, 200, 50, 0.08);
  border-color: rgba(255, 200, 50, 0.2);
}

.activity-card.level-maybe .act-name {
  color: rgba(255, 220, 120, 0.8);
}

.activity-card.level-yes {
  background: rgba(59, 255, 111, 0.08);
  border-color: rgba(59, 255, 111, 0.2);
}

.activity-card.level-yes .act-name {
  color: rgba(130, 255, 170, 0.85);
}

.activity-card.level-must {
  background: v-bind('profileColor + "22"');
  border-color: v-bind('profileColor + "55"');
  box-shadow: 0 0 15px v-bind('profileColor + "20"');
}

.activity-card.level-must .act-name {
  color: v-bind('profileColor');
  font-weight: 700;
}

@media (max-width: 400px) {
  .activities-grid {
    grid-template-columns: 1fr;
  }
}
</style>
