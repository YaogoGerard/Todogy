<template>
  <div class="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
    <!-- Radial Background -->
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-10%,#131a3a,#0a0d1f_60%)]"></div>

    <!-- Floor Grid (Synthwave Style) -->
    <div class="floor mask-linear-gradient absolute left-0 right-0 bottom-0 h-[46vh] transform-gpu opacity-70 will-change-transform
                bg-[linear-gradient(rgba(155,123,255,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(155,123,255,0.14)_1px,transparent_1px)] 
                bg-size-[60px_60px]
                transform-[perspective(600px)_rotateX(72deg)] origin-bottom"></div>

    <!-- Floating Orbs -->
    <div class="orb animate-driftA absolute w-65 h-65 top-[6%] -right-16 rounded-full transform-gpu blur-[2px] will-change-transform
                bg-[radial-gradient(circle_at_32%_28%,#ffe0c4,#ffb648_30%,#ff7a5c_62%,#7a2f2f_100%)]
                shadow-[0_30px_70px_-20px_rgb(255,122,92,0.5),inset_-14px_-14px_30px_rgb(0,0,0,0.35)]"></div>

    <div class="orb animate-driftB absolute w-37.5 h-37.5 top-[52%] -left-12 rounded-full transform-gpu blur-[1px] will-change-transform
                bg-[radial-gradient(circle_at_32%_28%,#d6f7ff,#4de3ff_35%,#1a7ea8_70%,#0a3a4d_100%)]
                shadow-[0_20px_50px_-15px_rgb(77,227,255,0.45),inset_-10px_-10px_22px_rgb(0,0,0,0.35)]"></div>

    <div class="orb animate-driftC absolute w-22.5 h-22.5 bottom-[8%] right-[14%] rounded-full transform-gpu will-change-transform
                bg-[radial-gradient(circle_at_32%_28%,#ece0ff,#9b7bff_40%,#4a2f8f_75%,#201347_100%)]
                shadow-[0_16px_34px_-10px_rgb(155,123,255,0.5),inset_-8px_-8px_18px_rgb(0,0,0,0.35)]"></div>
  </div>
</template>

<style scoped>
/* Masque linéaire pour estomper le quadrillage à l'horizon */
.mask-linear-gradient {
  -webkit-mask-image: linear-gradient(to top, rgba(0,0,0,1), rgba(0,0,0,0));
  mask-image: linear-gradient(to top, rgba(0,0,0,1), rgba(0,0,0,0));
}

/* Animations fluides utilisant le GPU */
@keyframes driftA {
  0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
  50% { transform: translate3d(-24px, 26px, 0) rotate(8deg); }
}

@keyframes driftB {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(20px, -18px, 0); }
}

@keyframes driftC {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(-16px, -20px, 0); }
}

.animate-driftA { animation: driftA 14s ease-in-out infinite; }
.animate-driftB { animation: driftB 11s ease-in-out infinite; }
.animate-driftC { animation: driftC 17s ease-in-out infinite; }

/* Respect des préférences d'accessibilité système */
@media (prefers-reduced-motion: reduce) {
  .orb, .floor {
    animation: none !important;
    transform: none !important;
  }
}
</style>
