<template>
  <div class="profile-selector">
    <div class="logo-section">
      <div class="logo">
        <span class="logo-r">R</span>
        <span class="logo-g">G</span>
        <span class="logo-b">B</span>
      </div>
      <h1 class="app-title">מד נכונות</h1>
      <p class="app-subtitle">בחרו את הפרופיל שלכם</p>
    </div>

    <div class="profiles-grid">
      <button
        v-for="(profile, id) in store.PROFILES"
        :key="id"
        class="profile-card"
        :style="{
          '--profile-color': profile.color,
          '--profile-dim': profile.colorDim,
          '--profile-glow': profile.glow
        }"
        @click="store.selectProfile(id)"
      >
        <div class="profile-letter">{{ profile.letter }}</div>
        <div class="profile-name">{{ profile.name }}</div>
        <div class="profile-indicator" v-if="store.profileData[id].lastUpdated">
          <span class="pulse-dot"></span>
          עודכן {{ formatTime(store.profileData[id].lastUpdated) }}
        </div>
        <div class="profile-indicator empty" v-else>
          טרם עודכן
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
import { useAppStore } from '../stores/appStore'

const store = useAppStore()

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
.profile-selector {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  gap: 3rem;
}

.logo-section {
  text-align: center;
}

.logo {
  font-size: 5rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  margin-bottom: 0.5rem;
}

.logo-r { color: #ff3b3b; text-shadow: 0 0 30px rgba(255, 59, 59, 0.5); }
.logo-g { color: #3bff6f; text-shadow: 0 0 30px rgba(59, 255, 111, 0.5); }
.logo-b { color: #3b8bff; text-shadow: 0 0 30px rgba(59, 139, 255, 0.5); }

.app-title {
  font-size: 1.5rem;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.app-subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 0.5rem;
}

.profiles-grid {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.profile-card {
  background: var(--profile-dim);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1.5rem;
  padding: 2.5rem 2rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  min-width: 160px;
  position: relative;
  overflow: hidden;
  font-family: inherit;
  color: white;
}

.profile-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 0%, var(--profile-color), transparent 70%);
  opacity: 0;
  transition: opacity 0.3s;
}

.profile-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--profile-glow);
  border-color: var(--profile-color);
}

.profile-card:hover::before {
  opacity: 0.15;
}

.profile-card:active {
  transform: translateY(-2px) scale(0.98);
}

.profile-letter {
  font-size: 3rem;
  font-weight: 900;
  color: var(--profile-color);
  text-shadow: 0 0 20px var(--profile-color);
  position: relative;
  z-index: 1;
}

.profile-name {
  font-size: 1.2rem;
  font-weight: 600;
  position: relative;
  z-index: 1;
}

.profile-indicator {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  gap: 0.4rem;
  position: relative;
  z-index: 1;
}

.profile-indicator.empty {
  color: rgba(255, 255, 255, 0.2);
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--profile-color);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.5); }
}

@media (max-width: 600px) {
  .profiles-grid {
    flex-direction: column;
    width: 100%;
  }
  .profile-card {
    min-width: unset;
    flex-direction: row;
    padding: 1.5rem;
    gap: 1rem;
  }
  .profile-letter {
    font-size: 2rem;
  }
  .profile-name {
    flex: 1;
    text-align: right;
  }
  .logo {
    font-size: 3.5rem;
  }
}
</style>
