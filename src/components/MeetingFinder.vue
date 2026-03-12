<template>
  <div class="meeting-finder">
    <h2 class="section-title">
      <span class="icon">🔍</span>
      חלונות מפגש
    </h2>
    <p class="section-hint">זמנים שבהם לפחות שניים זמינים, ממוינים לפי סיכוי</p>

    <!-- Week Nav (synced with calendar) -->
    <div class="week-nav">
      <button class="week-btn" @click="store.changeWeek(-1)">→</button>
      <button v-if="store.weekOffset !== 0" class="week-today-btn" @click="store.resetWeek()">היום</button>
      <span class="week-label">
        {{ store.currentWeek[0].dateDisplay }} – {{ store.currentWeek[6].dateDisplay }}
      </span>
      <button class="week-btn" @click="store.changeWeek(1)">←</button>
    </div>

    <div v-if="bestSlots.length === 0" class="empty-state">
      <div class="empty-icon">📭</div>
      <p>אין עדיין חלונות מפגש משותפים</p>
      <p class="empty-hint">עדכנו את הזמינות השבועית כדי למצוא זמנים</p>
    </div>

    <div v-else class="slots-list">
      <div
        v-for="(slot, i) in bestSlots"
        :key="`${slot.dateKey}-${slot.hour}`"
        class="slot-card"
        :class="{
          gold: slot.available === 3,
          silver: slot.available === 2
        }"
      >
        <div class="slot-rank">{{ i + 1 }}</div>
        <div class="slot-info">
          <div class="slot-when">
            <span v-if="slot.isToday" class="today-tag">היום</span>
            <span class="slot-day">{{ slot.dayName }} {{ slot.dateDisplay }}</span>
            <span class="slot-divider">·</span>
            <span class="slot-time">{{ slot.hourLabel }}</span>
          </div>
          <div class="slot-who">
            <span
              v-for="(profile, id) in store.PROFILES"
              :key="id"
              class="who-badge"
              :class="{
                available: store.isHourAvailable(id, slot.dateKey, slot.hour),
                busy: store.profileData[id].busy
              }"
              :style="{ '--color': profile.color }"
            >
              {{ profile.letter }}
            </span>
            <span class="slot-label">{{ slot.label }}</span>
          </div>
          <div class="slot-activities" v-if="slot.suggestedActivities?.length">
            <span
              v-for="act in slot.suggestedActivities"
              :key="act.id"
              class="suggested-act"
              :title="act.name"
            >{{ act.icon }}</span>
          </div>
        </div>
        <div class="slot-score">
          <div class="score-ring" :style="{ '--ring-color': scoreColor(slot.score) }">
            <svg viewBox="0 0 36 36" class="ring-svg">
              <path
                class="ring-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                class="ring-fill"
                :stroke-dasharray="`${slot.score}, 100`"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span class="ring-text">{{ Math.round(slot.score) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '../stores/appStore'

const store = useAppStore()

const bestSlots = computed(() => store.getBestMeetingSlots())

function scoreColor(score) {
  if (score >= 70) return '#3bff6f'
  if (score >= 40) return '#ffbb3b'
  return '#ff3b3b'
}
</script>

<style scoped>
.meeting-finder {
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

.week-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  direction: ltr;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: rgba(255, 255, 255, 0.4);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-hint {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.25);
}

.slots-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.slot-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 1rem;
  padding: 1rem 1.25rem;
  transition: all 0.2s;
}

.slot-card.gold {
  border-color: rgba(255, 187, 59, 0.3);
  background: rgba(255, 187, 59, 0.05);
}

.slot-card:hover {
  background: rgba(255, 255, 255, 0.06);
}

.slot-rank {
  font-size: 1.2rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.2);
  min-width: 28px;
  text-align: center;
}

.slot-card.gold .slot-rank {
  color: #ffbb3b;
}

.slot-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.slot-when {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.today-tag {
  font-size: 0.7rem;
  background: rgba(59, 255, 111, 0.15);
  color: #3bff6f;
  padding: 0.1rem 0.5rem;
  border-radius: 1rem;
  font-weight: 700;
}

.slot-day {
  font-weight: 600;
  font-size: 1rem;
}

.slot-divider {
  color: rgba(255, 255, 255, 0.2);
}

.slot-time {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  direction: ltr;
}

.slot-who {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.who-badge {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 800;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.2);
  transition: all 0.2s;
}

.who-badge.available {
  background: var(--color);
  color: #000;
}

.who-badge.busy {
  opacity: 0.3;
  text-decoration: line-through;
}

.slot-label {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.4);
}

.slot-score { flex-shrink: 0; }

.score-ring {
  width: 50px;
  height: 50px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ring-svg {
  position: absolute;
  inset: 0;
  transform: rotate(-90deg);
}

.ring-bg {
  fill: none;
  stroke: rgba(255, 255, 255, 0.08);
  stroke-width: 3;
}

.ring-fill {
  fill: none;
  stroke: var(--ring-color);
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dasharray 0.5s ease;
}

.ring-text {
  font-size: 0.85rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.8);
  position: relative;
  z-index: 1;
}

.slot-activities {
  display: flex;
  gap: 0.2rem;
  margin-top: 0.15rem;
}

.suggested-act {
  font-size: 0.85rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.1rem 0.3rem;
  border-radius: 0.3rem;
  cursor: default;
}

@media (max-width: 600px) {
  .slot-card {
    padding: 0.75rem 1rem;
  }
}
</style>
