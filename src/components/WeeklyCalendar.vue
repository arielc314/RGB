<template>
  <div class="weekly-calendar">
    <h2 class="section-title">
      <span class="icon">📅</span>
      זמינות שבועית
    </h2>

    <!-- Week Navigation -->
    <div class="week-nav">
      <button class="week-btn" @click="store.changeWeek(-1)">→</button>
      <button v-if="store.weekOffset !== 0" class="week-today-btn" @click="store.resetWeek()">היום</button>
      <span class="week-label">
        {{ store.currentWeek[0].dateDisplay }} – {{ store.currentWeek[6].dateDisplay }}
      </span>
      <button class="week-btn" @click="store.changeWeek(1)">←</button>
    </div>

    <p class="section-hint">לחצו וגררו על תאים כדי לסמן זמינות</p>

    <!-- Calendar Grid -->
    <div class="calendar-scroll">
      <div class="calendar-grid" @pointerleave="stopPaint">
        <!-- Header Row -->
        <div class="corner-cell"></div>
        <div
          v-for="day in store.currentWeek"
          :key="day.dateKey"
          class="day-header"
          :class="{ today: day.isToday }"
        >
          <span class="day-short">{{ day.short }}</span>
          <span class="day-date">{{ day.dateDisplay }}</span>
        </div>

        <!-- Hour Rows -->
        <template v-for="hour in store.HOURS" :key="hour.value">
          <div class="hour-label">{{ hour.label }}</div>
          <div
            v-for="day in store.currentWeek"
            :key="`${day.dateKey}-${hour.value}`"
            class="hour-cell"
            :class="{
              available: store.isHourAvailable(store.currentProfileId, day.dateKey, hour.value),
              today: day.isToday,
              selected: selectedCell?.dateKey === day.dateKey && selectedCell?.hour === hour.value,
              'has-override': hasOverride(day.dateKey, hour.value)
            }"
            :style="{
              '--pc': store.currentProfile.color,
              '--pd': store.currentProfile.colorDim
            }"
            @pointerdown.prevent="startPaint($event, day.dateKey, hour.value)"
            @pointerenter="paintCell(day.dateKey, hour.value)"
            @pointerup="stopPaint"
            @click.right.prevent="openCellMenu(day.dateKey, hour.value)"
          >
            <span class="cell-others">
              <span
                v-for="otherId in otherProfiles"
                :key="otherId"
                class="other-dot"
                :style="{ background: store.PROFILES[otherId].color }"
                v-show="store.isHourAvailable(otherId, day.dateKey, hour.value)"
              ></span>
            </span>
            <span class="override-dot" v-if="hasOverride(day.dateKey, hour.value)"></span>
          </div>
        </template>
      </div>
    </div>

    <!-- Scheduled Changes Section -->
    <div class="scheduled-section">
      <div class="scheduled-header" @click="showScheduled = !showScheduled">
        <h3 class="sub-title">⏰ שינויים מתוכננים במדדים</h3>
        <span class="toggle-arrow">{{ showScheduled ? '▲' : '▼' }}</span>
      </div>

      <Transition name="expand">
        <div v-if="showScheduled" class="scheduled-body">
          <p class="section-hint">
            קבעו שינוי עתידי למדד — למשל: ״מיום ד׳ ב-18:00, העייפות שלי תרד ל-30%״
          </p>

          <!-- Add Form -->
          <div class="add-change-form">
            <div class="form-row">
              <select v-model="newChange.dateKey" class="form-select">
                <option value="" disabled>יום</option>
                <option v-for="day in store.currentWeek" :key="day.dateKey" :value="day.dateKey">
                  {{ day.short }} {{ day.dateDisplay }}
                </option>
              </select>
              <select v-model="newChange.hour" class="form-select">
                <option :value="null" disabled>שעה</option>
                <option v-for="h in store.HOURS" :key="h.value" :value="h.value">
                  {{ h.label }}
                </option>
              </select>
            </div>
            <div class="form-row">
              <select v-model="newChange.meterId" class="form-select wide">
                <option value="" disabled>מדד</option>
                <option v-for="m in store.METERS" :key="m.id" :value="m.id">
                  {{ m.icon }} {{ m.name }}
                </option>
              </select>
              <div class="form-value">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  v-model.number="newChange.value"
                  class="form-range"
                />
                <span class="form-value-label">{{ newChange.value }}%</span>
              </div>
            </div>
            <button
              class="add-btn"
              :disabled="!canAddChange"
              @click="addChange"
            >
              הוסף שינוי
            </button>
          </div>

          <!-- Existing Changes List -->
          <div v-if="currentChanges.length > 0" class="changes-list">
            <div
              v-for="change in currentChanges"
              :key="change.id"
              class="change-item"
            >
              <span class="change-when">
                {{ formatChangeDate(change.dateKey) }} {{ padHour(change.hour) }}:00
              </span>
              <span class="change-arrow">←</span>
              <span class="change-what">
                {{ getMeterInfo(change.meterId).icon }}
                {{ getMeterInfo(change.meterId).name }}
              </span>
              <span class="change-value" :style="{ color: store.currentProfile.color }">
                {{ change.value }}%
              </span>
              <button class="change-delete" @click="store.removeScheduledChange(change.id)">✕</button>
            </div>
          </div>
          <div v-else class="empty-changes">
            אין שינויים מתוכננים
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useAppStore } from '../stores/appStore'

const store = useAppStore()

const showScheduled = ref(false)
const painting = ref(false)
const paintValue = ref(false)
const selectedCell = ref(null)

const otherProfiles = computed(() =>
  Object.keys(store.PROFILES).filter(id => id !== store.currentProfileId)
)

const newChange = reactive({
  dateKey: '',
  hour: null,
  meterId: '',
  value: 50
})

const canAddChange = computed(() =>
  newChange.dateKey && newChange.hour !== null && newChange.meterId
)

const currentChanges = computed(() => {
  if (!store.currentData) return []
  return [...(store.currentData.scheduledChanges || [])]
    .sort((a, b) => a.dateKey === b.dateKey ? a.hour - b.hour : a.dateKey.localeCompare(b.dateKey))
})

function startPaint(e, dateKey, hour) {
  painting.value = true
  const isAvail = store.isHourAvailable(store.currentProfileId, dateKey, hour)
  paintValue.value = !isAvail
  store.setHourAvailability(dateKey, hour, paintValue.value)

  const el = e.currentTarget
  if (el.setPointerCapture) {
    // We don't capture here — we let pointerenter on sibling cells handle painting
  }
}

function paintCell(dateKey, hour) {
  if (!painting.value) return
  store.setHourAvailability(dateKey, hour, paintValue.value)
}

function stopPaint() {
  painting.value = false
}

function hasOverride(dateKey, hour) {
  if (!store.currentData) return false
  return (store.currentData.scheduledChanges || []).some(
    c => c.dateKey === dateKey && c.hour === hour
  )
}

function openCellMenu(dateKey, hour) {
  selectedCell.value = { dateKey, hour }
  showScheduled.value = true
  newChange.dateKey = dateKey
  newChange.hour = hour
}

function addChange() {
  if (!canAddChange.value) return
  store.addScheduledChange(newChange.dateKey, newChange.hour, newChange.meterId, newChange.value)
  newChange.meterId = ''
  newChange.value = 50
}

function formatChangeDate(dateKey) {
  const day = store.currentWeek.find(d => d.dateKey === dateKey)
  return day ? `${day.short} ${day.dateDisplay}` : dateKey
}

function padHour(h) {
  return h.toString().padStart(2, '0')
}

function getMeterInfo(meterId) {
  return store.METERS.find(m => m.id === meterId) || { icon: '?', name: meterId }
}
</script>

<style scoped>
.weekly-calendar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

.section-hint {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.35);
  margin: 0;
}

/* Week Navigation */
.week-nav {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  justify-content: center;
}

.week-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
  width: 34px;
  height: 34px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-family: inherit;
}

.week-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.week-today-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.7);
  padding: 0.3rem 0.75rem;
  border-radius: 1rem;
  cursor: pointer;
  font-size: 0.75rem;
  font-family: inherit;
  transition: all 0.2s;
}

.week-today-btn:hover {
  background: rgba(255, 255, 255, 0.12);
}

.week-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  direction: ltr;
}

/* Calendar Grid */
.calendar-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.calendar-grid {
  display: grid;
  grid-template-columns: 54px repeat(7, 1fr);
  gap: 1px;
  background: rgba(255, 255, 255, 0.04);
  min-width: 500px;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.corner-cell {
  background: rgba(10, 10, 18, 0.9);
  position: sticky;
  right: 0;
  z-index: 2;
}

.day-header {
  background: rgba(10, 10, 18, 0.9);
  padding: 0.5rem 0.2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.day-header.today {
  background: rgba(255, 255, 255, 0.06);
}

.day-short {
  font-size: 0.85rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.65);
}

.day-header.today .day-short {
  color: white;
}

.day-date {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.35);
  direction: ltr;
}

.hour-label {
  background: rgba(10, 10, 18, 0.9);
  padding: 0 0.3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.35);
  direction: ltr;
  position: sticky;
  right: 0;
  z-index: 2;
}

.hour-cell {
  background: rgba(10, 10, 18, 0.6);
  min-height: 28px;
  cursor: pointer;
  transition: background 0.1s;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hour-cell:hover {
  background: rgba(255, 255, 255, 0.06);
}

.hour-cell.today {
  background: rgba(255, 255, 255, 0.03);
}

.hour-cell.available {
  background: var(--pd);
}

.hour-cell.available.today {
  background: var(--pd);
}

.hour-cell.selected {
  outline: 2px solid var(--pc);
  outline-offset: -2px;
  z-index: 1;
}

.cell-others {
  display: flex;
  gap: 2px;
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
}

.other-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  opacity: 0.8;
}

.override-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ffbb3b;
  position: absolute;
  top: 2px;
  left: 2px;
}

.hour-cell.has-override {
  border-top: 2px solid rgba(255, 187, 59, 0.4);
}

/* Scheduled Changes */
.scheduled-section {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 1rem;
  overflow: hidden;
}

.scheduled-header {
  display: flex;
  align-items: center;
  padding: 1rem 1.25rem;
  cursor: pointer;
  transition: background 0.2s;
}

.scheduled-header:hover {
  background: rgba(255, 255, 255, 0.03);
}

.sub-title {
  font-size: 1rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  flex: 1;
}

.toggle-arrow {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.3);
}

.scheduled-body {
  padding: 0 1.25rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.add-change-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-row {
  display: flex;
  gap: 0.5rem;
}

.form-select {
  flex: 1;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  color: rgba(255, 255, 255, 0.8);
  font-family: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  direction: rtl;
}

.form-select.wide {
  flex: 2;
}

.form-select option {
  background: #1a1a2e;
  color: white;
}

.form-value {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-range {
  flex: 1;
  accent-color: var(--pc, #3b8bff);
  height: 4px;
  cursor: pointer;
  direction: ltr;
}

.form-value-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  min-width: 36px;
  text-align: center;
  direction: ltr;
}

.add-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.5rem;
  padding: 0.6rem;
  color: rgba(255, 255, 255, 0.7);
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.add-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.12);
  color: white;
}

.add-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.changes-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.change-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 0.5rem;
  font-size: 0.85rem;
}

.change-when {
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
  direction: ltr;
  white-space: nowrap;
}

.change-arrow {
  color: rgba(255, 255, 255, 0.2);
}

.change-what {
  color: rgba(255, 255, 255, 0.65);
  flex: 1;
}

.change-value {
  font-weight: 700;
  direction: ltr;
}

.change-delete {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.2);
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0.2rem;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-family: inherit;
}

.change-delete:hover {
  background: rgba(255, 59, 59, 0.15);
  color: #ff3b3b;
}

.empty-changes {
  text-align: center;
  color: rgba(255, 255, 255, 0.2);
  font-size: 0.85rem;
  padding: 0.5rem;
}

/* Transitions */
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
  max-height: 600px;
}

@media (max-width: 600px) {
  .calendar-grid {
    grid-template-columns: 42px repeat(7, 1fr);
    min-width: 400px;
  }

  .hour-cell {
    min-height: 24px;
  }
}
</style>
