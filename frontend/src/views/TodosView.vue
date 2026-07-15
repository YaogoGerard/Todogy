<script setup lang="ts">
import { ref, onMounted } from 'vue'
import NavBar from '../components/NavBar.vue'
import { useTodosStore } from '../stores/todos'

const todosStore = useTodosStore()
const newTitle = ref('')

const confettiColors = ['#4ade80', '#6df0c2', '#23c48c', '#ff7a5c', '#ffb648', '#4de3ff', '#9b7bff', '#f3f4fb']
const confettiPieces = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  color: confettiColors[i % confettiColors.length],
  left: Math.random() * 100,
  delay: Math.random() * 2,
  duration: 2 + Math.random() * 3,
  size: 6 + Math.random() * 6,
  rotation: Math.random() * 360,
}))

function addTodo() {
  const val = newTitle.value.trim()
  if (!val) return
  todosStore.addTodo(val)
  newTitle.value = ''
}

onMounted(() => {
  todosStore.fetchTodos()
})
</script>

<template>
  <NavBar :done="todosStore.done" :total="todosStore.total" />
  <div v-if="todosStore.progress === 1" class="confetti">
    <div
      v-for="p in confettiPieces"
      :key="p.id"
      class="confetti-piece"
      :style="{
        left: p.left + '%',
        width: p.size + 'px',
        height: p.size * 0.6 + 'px',
        background: p.color,
        animationDelay: p.delay + 's',
        animationDuration: p.duration + 's',
        transform: 'rotate(' + p.rotation + 'deg)',
      }"
    ></div>
  </div>
  <div class="pt-16">
  <div class="stage">
    <div class="card3d composer">
      <input v-model="newTitle" type="text" placeholder="Ajouter une tâche…" maxlength="80" @keydown.enter="addTodo" />
      <button class="add-btn" aria-label="Ajouter" @click="addTodo">+</button>
    </div>

    <div class="card3d filters">
      <button :class="{ active: todosStore.filter === 'all' }" @click="todosStore.filter = 'all'">Toutes</button>
      <button :class="{ active: todosStore.filter === 'active' }" @click="todosStore.filter = 'active'">En cours</button>
      <button :class="{ active: todosStore.filter === 'done' }" @click="todosStore.filter = 'done'">Terminées</button>
    </div>

    <div v-if="todosStore.filteredItems.length === 0 && !todosStore.loading" class="card3d empty">
      Rien ici. Ajoute une tâche pour commencer.
    </div>

    <div v-else-if="todosStore.loading" class="card3d empty">
      Chargement…
    </div>

    <div v-else class="list">
      <div
        v-for="(t, i) in todosStore.filteredItems"
        :key="t._id"
        :class="['item card3d', { done: t.completed }]"
        :style="{ animationDelay: i * 0.05 + 's' }"
      >
        <div class="check" @click="todosStore.toggleDone(t._id, !t.completed)">
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
            <path d="M1 5L4.5 8.5L11 1.5" stroke="#0a0d1f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="item-body">
          <div class="item-title">{{ t.title }}</div>
        </div>
        <button class="del" aria-label="Supprimer" @click="todosStore.remove(t._id)">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
  </div>
</template>

<style scoped>
.confetti {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 100;
  overflow: hidden;
}

.confetti-piece {
  position: absolute;
  top: -10px;
  border-radius: 2px;
  animation: confetti-fall linear infinite;
  opacity: 0.9;
}

@keyframes confetti-fall {
  0% {
    transform: translateY(-10px) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}
</style>
