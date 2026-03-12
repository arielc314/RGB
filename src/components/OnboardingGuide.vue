<template>
  <Transition name="guide-fade">
    <div v-if="visible" class="guide-overlay" @click.self="skip">
      <div class="guide-card">
        <!-- Progress -->
        <div class="guide-progress">
          <div
            v-for="(_, i) in slides"
            :key="i"
            class="progress-dot"
            :class="{ active: i === step, done: i < step }"
            @click="step = i"
          ></div>
        </div>

        <!-- Slide Content -->
        <Transition :name="slideDirection" mode="out-in">
          <div class="slide" :key="step">
            <div class="slide-illustration">{{ slides[step].illustration }}</div>
            <h2 class="slide-title">{{ slides[step].title }}</h2>
            <p class="slide-text" v-html="slides[step].text"></p>
            <div class="slide-tip" v-if="slides[step].tip">
              💡 {{ slides[step].tip }}
            </div>
          </div>
        </Transition>

        <!-- Actions -->
        <div class="guide-actions">
          <button v-if="step > 0" class="guide-btn secondary" @click="prev">הקודם</button>
          <div v-else class="spacer"></div>

          <button v-if="step < slides.length - 1" class="guide-btn primary" @click="next">
            הבא ←
          </button>
          <button v-else class="guide-btn primary finish" @click="finish">
            יאללה, בואו נתחיל!
          </button>
        </div>

        <button class="guide-skip" @click="skip" v-if="step < slides.length - 1">
          דלג על ההדרכה
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['close'])
const props = defineProps({
  visible: { type: Boolean, default: false },
  profileName: { type: String, default: '' }
})

const step = ref(0)
const slideDirection = ref('slide-next')

const slides = [
  {
    illustration: '👋',
    title: `הי ${props.profileName}!`,
    text: 'ברוכים הבאים ל-<strong>RGB</strong> — האפליקציה שעוזרת לכם לתאם מפגשים ולהבין מתי כולם פנויים ובמצב רוח מתאים.',
    tip: 'כל אחד מעדכן את הסטטוס שלו, והאפליקציה מחשבת את הזמנים הכי טובים.'
  },
  {
    illustration: '🟢',
    title: 'פנוי או עסוק?',
    text: 'הדבר הראשון — סמנו אם אתם <strong>פנויים</strong> או <strong>עסוקים</strong>.<br>אם עסוק, האפליקציה לא תחשב אתכם בתיאומים.',
    tip: 'זה הכפתור הגדול בראש מסך המדדים.'
  },
  {
    illustration: '📊',
    title: 'המדדים שלכם',
    text: 'גררו את הסליידרים כדי לעדכן: עייפות, נכונות לנסיעה, דלק, נכונות לאירוח...<br><strong>לא חובה למלא הכל</strong> — רק מה שרלוונטי.',
    tip: 'לחצו על הסליידר כדי להפעיל אותו, לחצו ✕ כדי לאפס.'
  },
  {
    illustration: '🎮',
    title: 'מה בא לכם?',
    text: 'לחצו על פעילות כדי לסמן רמת חשק.<br>כל לחיצה מעלה רמה:',
    tip: '😐 לא בא → 🤔 אולי → 😊 בא לי → 🤩 חייב! → חזרה להתחלה'
  },
  {
    illustration: '📅',
    title: 'מתי אתם פנויים?',
    text: 'בטאב <strong>זמינות</strong> — לחצו וגררו על שעות בלוח כדי לסמן מתי אתם פנויים.<br>אפשר לנווט בין שבועות.',
    tip: 'נקודות צבעוניות מראות מי עוד סימן שהוא פנוי באותה שעה.'
  },
  {
    illustration: '🎯',
    title: 'מוצאים זמן!',
    text: 'בטאב <strong>הקבוצה</strong> תראו את הסטטוס של כולם.<br>בטאב <strong>מפגשים</strong> האפליקציה מחשבת את הזמנים עם הסיכוי הכי גבוה — ואפילו ממליצה על פעילויות!',
    tip: null
  }
]

function next() {
  slideDirection.value = 'slide-next'
  step.value++
}

function prev() {
  slideDirection.value = 'slide-prev'
  step.value--
}

function finish() {
  localStorage.setItem('rgb-onboarding-done', 'true')
  emit('close')
}

function skip() {
  localStorage.setItem('rgb-onboarding-done', 'true')
  emit('close')
}
</script>

<style scoped>
.guide-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(5, 5, 12, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.guide-card {
  background: linear-gradient(145deg, rgba(25, 25, 40, 0.95), rgba(15, 15, 28, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1.5rem;
  padding: 2rem 1.75rem 1.5rem;
  max-width: 420px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

/* Progress dots */
.guide-progress {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.progress-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  cursor: pointer;
  transition: all 0.3s;
}

.progress-dot.active {
  background: white;
  transform: scale(1.3);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
}

.progress-dot.done {
  background: rgba(59, 255, 111, 0.5);
}

/* Slide content */
.slide {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  min-height: 220px;
}

.slide-illustration {
  font-size: 4rem;
  line-height: 1;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
}

.slide-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

.slide-text {
  font-size: 0.95rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.65);
  margin: 0;
  max-width: 340px;
}

.slide-text :deep(strong) {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
}

.slide-tip {
  font-size: 0.85rem;
  color: rgba(255, 187, 59, 0.8);
  background: rgba(255, 187, 59, 0.08);
  border: 1px solid rgba(255, 187, 59, 0.15);
  border-radius: 0.75rem;
  padding: 0.5rem 0.85rem;
  max-width: 340px;
  line-height: 1.5;
}

/* Actions */
.guide-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.spacer {
  flex: 1;
}

.guide-btn {
  padding: 0.7rem 1.5rem;
  border-radius: 0.85rem;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.guide-btn.primary {
  background: white;
  color: #111;
  flex: 1;
}

.guide-btn.primary:hover {
  background: #eee;
  transform: translateY(-1px);
}

.guide-btn.primary.finish {
  background: linear-gradient(135deg, #ff3b3b, #3bff6f, #3b8bff);
  background-size: 200% 200%;
  animation: rgbShift 3s ease infinite;
  color: white;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

@keyframes rgbShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.guide-btn.secondary {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.guide-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.guide-skip {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.25);
  font-family: inherit;
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0.5rem;
  text-align: center;
  transition: color 0.2s;
}

.guide-skip:hover {
  color: rgba(255, 255, 255, 0.5);
}

/* Slide transitions */
.slide-next-enter-active,
.slide-next-leave-active,
.slide-prev-enter-active,
.slide-prev-leave-active {
  transition: all 0.25s ease;
}

.slide-next-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}
.slide-next-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.slide-prev-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.slide-prev-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Overlay transition */
.guide-fade-enter-active,
.guide-fade-leave-active {
  transition: opacity 0.3s ease;
}
.guide-fade-enter-from,
.guide-fade-leave-to {
  opacity: 0;
}

@media (max-width: 480px) {
  .guide-card {
    padding: 1.5rem 1.25rem 1.25rem;
    border-radius: 1.25rem;
  }

  .slide-illustration {
    font-size: 3rem;
  }

  .slide-title {
    font-size: 1.2rem;
  }

  .slide-text {
    font-size: 0.88rem;
  }

  .slide {
    min-height: 200px;
  }
}
</style>
