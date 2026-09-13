import { createRouter, createWebHashHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHashHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', component: () => import('./views/Home.vue') },
    { path: '/lesson/:id/:tab?', component: () => import('./views/Lesson.vue'), props: true },
    { path: '/dictionary', component: () => import('./views/Dictionary.vue') },
    { path: '/grammar', component: () => import('./views/Grammar.vue') },
    { path: '/verbs',component: () => import('./views/Verbs.vue') },
    { path: '/review', component: () => import('./views/Review.vue') },
    { path: '/settings', component: () => import('./views/Settings.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
