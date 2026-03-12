<template>
  <div class="app" :style="profileStyles">
    <ProfileSelector v-if="!store.currentProfileId" />

    <template v-else>
      <OnboardingGuide
        :visible="showOnboarding"
        :profile-name="store.currentProfile.name"
        @close="showOnboarding = false"
      />

      <header class="app-header">
        <button class="back-btn" @click="store.logout()" title="החלף פרופיל">
          <span class="back-arrow">→</span>
        </button>
        <div class="header-profile">
          <span class="header-letter" :style="{ color: store.currentProfile.color }">
            {{ store.currentProfile.letter }}
          </span>
          <span class="header-name">{{ store.currentProfile.name }}</span>
        </div>
        <div class="header-status" v-if="store.useFirebase">
          <span
            class="status-dot"
            :class="store.isConnected ? 'online' : 'offline'"
            :title="store.isConnected ? 'מחובר — מסנכרן בזמן אמת' : 'לא מחובר — שומר מקומית'"
          ></span>
        </div>
        <button class="help-btn" @click="showOnboarding = true" title="מדריך שימוש">?</button>
        <div class="header-logo">
          <span class="hl-r">R</span><span class="hl-g">G</span><span class="hl-b">B</span>
        </div>
      </header>

      <nav class="tab-nav">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
        </button>
      </nav>

      <main class="app-main">
        <Transition name="fade" mode="out-in">
          <StatusPanel v-if="activeTab === 'status'" key="status" />
          <WeeklyCalendar v-else-if="activeTab === 'calendar'" key="calendar" />
          <GroupDashboard v-else-if="activeTab === 'group'" key="group" />
          <MeetingFinder v-else-if="activeTab === 'meeting'" key="meeting" />
        </Transition>
      </main>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAppStore } from './stores/appStore'
import ProfileSelector from './components/ProfileSelector.vue'
import StatusPanel from './components/StatusPanel.vue'
import WeeklyCalendar from './components/WeeklyCalendar.vue'
import GroupDashboard from './components/GroupDashboard.vue'
import MeetingFinder from './components/MeetingFinder.vue'
import OnboardingGuide from './components/OnboardingGuide.vue'

const store = useAppStore()
const activeTab = ref('status')

const showOnboarding = ref(false)

watch(() => store.currentProfileId, (id) => {
  if (id && !localStorage.getItem('rgb-onboarding-done')) {
    showOnboarding.value = true
  }
}, { immediate: true })

const tabs = [
  { id: 'status', icon: '📊', label: 'המדדים שלי' },
  { id: 'calendar', icon: '📅', label: 'זמינות' },
  { id: 'group', icon: '👥', label: 'הקבוצה' },
  { id: 'meeting', icon: '🔍', label: 'מפגשים' }
]

const profileStyles = computed(() => {
  if (!store.currentProfile) return {}
  return {
    '--active-color': store.currentProfile.color,
    '--active-dim': store.currentProfile.colorDim,
    '--active-mid': store.currentProfile.colorMid,
    '--active-glow': store.currentProfile.glow
  }
})
</script>

<style scoped>
.app {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.app-header {
  display: flex;
  align-items: center;
  padding: 0.75rem 1.25rem;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.back-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.4rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
  font-family: inherit;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: white;
}

.header-profile {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-right: 0.5rem;
}

.header-letter {
  font-size: 1.4rem;
  font-weight: 900;
}

.header-name {
  font-size: 1rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
}

.header-status {
  margin-right: 0.5rem;
}

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transition: all 0.3s;
}

.status-dot.online {
  background: #3bff6f;
  box-shadow: 0 0 8px rgba(59, 255, 111, 0.5);
}

.status-dot.offline {
  background: #ff3b3b;
  box-shadow: 0 0 8px rgba(255, 59, 59, 0.5);
  animation: blink 2s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.help-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.4);
  width: 26px;
  height: 26px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 700;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  margin-right: 0.5rem;
  flex-shrink: 0;
}

.help-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: white;
  border-color: rgba(255, 255, 255, 0.2);
}

.header-logo {
  margin-right: auto;
  font-weight: 800;
  font-size: 1rem;
  letter-spacing: 0.05em;
  opacity: 0.5;
}

.hl-r { color: #ff3b3b; }
.hl-g { color: #3bff6f; }
.hl-b { color: #3b8bff; }

.tab-nav {
  display: flex;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  position: sticky;
  top: 52px;
  z-index: 99;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.tab-btn {
  flex: 1;
  padding: 0.75rem 0.5rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  font-family: inherit;
}

.tab-btn:hover {
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.03);
}

.tab-btn.active {
  color: var(--active-color, white);
  border-bottom-color: var(--active-color, white);
}

.tab-icon {
  font-size: 1.2rem;
}

.tab-label {
  font-size: 0.7rem;
  font-weight: 600;
}

.app-main {
  flex: 1;
  padding: 1.5rem;
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

@media (max-width: 600px) {
  .app-main {
    padding: 1rem;
  }
}
</style>
