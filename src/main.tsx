import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// 설치형 PWA: 배포 빌드에서만 서비스 워커를 등록한다(개발 서버의 HMR 요청을 가로채지 않도록).
// sw.js는 public/에 있어 base(`/scripture-flux-web/`) 바로 아래에 배포되므로 scope도 그 경로로 한정된다.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err: unknown) => {
      console.warn('서비스 워커 등록 실패:', err)
    })
  })
}
