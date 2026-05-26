# 🌌 ScriptureFlux

> 성경 66권 전체의 긴밀한 상호 연관성(31,106절)을 하나의 수려한 2D 곡선 네트워크로 시각화하는 정적 웹앱(SPA)입니다.

<p align="center">
  <a href="https://jeiel85.github.io/scripture-flux-web/"><img src="https://img.shields.io/badge/GitHub%20Pages-Live%20Demo-2ea44f?style=for-the-badge&logo=github" alt="GitHub Pages Live Demo" /></a>
  <a href="https://github.com/jeiel85/scripture-flux-web"><img src="https://img.shields.io/badge/Version-v0.9.0-0f766e?style=for-the-badge" alt="Version v0.9.0" /></a>
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62B" alt="Vite" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/HTML5_Canvas-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="Canvas 2D" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="MIT License" />
</p>

---

## 🎨 Preview & Landing

![ScriptureFlux Landing Image](./public/scriptureflux_landing.png)

*성경 전체를 가로축으로 배열하고 그 사이에 수려한 무지개 곡선을 그어 교차 참조의 아름다운 깊이를 시각적으로 구현한 정밀 랜딩 뷰어*

**Live Demo**: [https://jeiel85.github.io/scripture-flux-web/](https://jeiel85.github.io/scripture-flux-web/)

**Repository**: [https://github.com/jeiel85/scripture-flux-web](https://github.com/jeiel85/scripture-flux-web)

---

## ✨ 핵심 기능 (Features)

*   🌌 **HTML5 Canvas 2D 기반 고성능 렌더링**: 34만 개 이상의 실증 교차 참조 데이터를 SVG DOM 부하 없이 Canvas 중심으로 드로잉합니다.
*   🧭 **OpenBible.info 실증 데이터셋 기반 LOD 로딩**: 초기 화면은 상위 1,500개 랜드마크 연결선을 빠르게 보여주고, 책별 세부 데이터는 필요한 순간 66개 청크로 지연 로딩합니다.
*   📌 **클릭 고정 메커니즘 (Pinning)**: 교차 참조 곡선을 클릭하면 **골드 네온 라인(#f59e0b)**과 텍스트 라벨이 영구 고정되어 마우스 포인터가 벗어나도 카드 정보를 안정적으로 읽을 수 있습니다.
*   ⏱️ **120ms 호버 디바운스 (Stabilization)**: 마우스가 캔버스 위를 빠르게 움직일 때 하단 정보 카드가 파르르 떨리거나 수시로 교체되어 깜빡이는 시각적 피로를 완벽히 종식시켰습니다.
*   📖 **개역한글 & KJV 한/영 다국어 듀얼 레이아웃**: 완전한 퍼블릭 도메인 판본인 국문 **개역한글(1961년판)**과 영문 **KJV**를 로컬 탑재하여, 큰 한국어 구절 아래 보조 영어 구절이 점선 분리되어 수려하게 표시됩니다.
*   ♿ **강력한 웹 접근성(a11y) 지원**: Tab 키 및 키보드 방향키(`ArrowLeft/Right/Up/Down/Escape`)를 통한 네트워크 전체 탐색 조작 및 포커스 링을 제공합니다.
*   📱 **모바일 60FPS 최적화 & Reduced Motion**: 
    *   초고해상도 Retina/OLED 화면에서의 과부하를 막기 위해 **DPR 최대 1.5로 Clamping 제한**
    *   손가락 터치 제어 대응 및 터치 히트 반경 **18px로 확장 튜닝**
    *   OS 차원의 애니메이션 축소 설정(`prefers-reduced-motion`) 감지 시 Framer Motion 트랜지션 즉시 제거
*   🚀 **GitHub Actions 무중단 Pages 배포**: `main` 브랜치에 코드가 푸시되면 자동으로 Lint, Typecheck, Test, Build 검증을 거쳐 GitHub Pages([`https://jeiel85.github.io/scripture-flux-web/`](https://jeiel85.github.io/scripture-flux-web/))로 자동 배포됩니다.

---

## 🎨 Original Inspiration (영감을 준 프로젝트)

ScriptureFlux는 2008년 시각화 예술계에 위대한 발자취를 남긴 **크리스 해리슨(Chris Harrison)** 교수의 예술 작품인 **"Bible Cross-References"**와 **OpenBible.info**의 오픈 데이터로부터 영감을 얻어 제작된 헌사 애플리케이션입니다.

*   **시각화 오리지널 아이디어**: [Chris Harrison's Bible Visualization (CMU)](https://www.chrisharrison.net/index.php/Visualizations/BibleVis)
*   **교차 참조 데이터셋**: [OpenBible.info (Christoph Römhild 목사 & Sean Harrison)](https://www.openbible.info)

원작자들의 뛰어난 창의성과 데이터를 아낌없이 개방해 주신 헌신에 마음 깊이 존경과 감사를 표합니다. 자세한 출처와 라이선스 정보는 [ATTRIBUTION.md](./ATTRIBUTION.md) 문서에서 확인할 수 있습니다.

---

## 🛠️ 기술 스택 (Tech Stack)

| 영역 | 선택 기술 | 목적 |
|:---|:---|:---|
| **Build & Tooling** | Vite 8.x | 초고속 프로덕션 컴파일 및 HMR |
| **Framework** | React 19 + TypeScript | UI 선언형 상태 관리 및 정적 타입 안전성 확보 |
| **Styling** | Tailwind CSS 4.0 + Lucide React | Glassmorphism 및 유려한 다크 모드 뷰 설계 |
| **Visualization** | HTML5 Canvas 2D | 60FPS 하드웨어 가속 2D 네트워크 렌더링 |
| **Geometry** | D3 scale & D3 shape helpers | 도메인 변환 좌표 매핑 및 곡선 보간 |
| **Motion & A11y** | Framer Motion | 세부 오버레이 카드 뷰 미세 애니메이션 트랜지션 |
| **Test** | Vitest | 좌표 projection 정합성 단위 테스트 |

---

## 🧭 GitHub Repository Metadata

저장소 공개 설정은 아래 기준으로 맞춰 관리합니다.

*   **Description**: 성경 66권의 교차 참조를 Canvas 2D 곡선 네트워크로 시각화하는 정적 웹앱
*   **Homepage**: [https://jeiel85.github.io/scripture-flux-web/](https://jeiel85.github.io/scripture-flux-web/)
*   **Topics**: `bible`, `bible-study`, `bible-visualization`, `canvas`, `data-visualization`, `github-pages`, `react`, `scripture`, `static-site`, `typescript`, `vite`

---

## 🚀 빠른 시작 (Quick Start)

### 로컬 개발 서버 실행
```bash
npm install
npm run dev
```

### 프로덕션 빌드 및 정적 검증
```bash
npm run lint       # ESLint 스타일 정적 검사
npm run typecheck  # TypeScript 타입 안전성 검사
npm run test       # Vitest 단위 테스트 실행
npm run build      # dist/ 정적 SPA 빌드
```

---

## 📁 프로젝트 문서 구조

```text
AGENTS.md                         # 에이전트 공통 규칙 + ScriptureFlux 전용 구현 규칙
README.md                         # 본 프로젝트 명세와 소개 가이드 (이 문서)
TASKS.md                          # 개발 구현 작업 목록 체크리스트
DECISIONS.md                      # 주요 아키텍처 기술 결정 기록
HISTORY.md                        # 에이전트 작업 히스토리 로그
CHANGELOG.md                      # 사용자 공개용 버전 변경 이력
docs/00_DESIGN_INDEX.md           # 상세 설계 문서 인덱스 포털
docs/ScriptureFlux_Agent_Master_Spec.md  # ScriptureFlux 전용 마스터 기획 명세
```

---

## 📖 데이터 라이선스 및 저작권 준수 방침

본 프로젝트는 데이터셋과 성경 본문 저작권을 철저히 준수합니다.
*   **성경 본문**: 대한민국 저작권법상 저작재산권 보호기간(50년)이 만료된 공인 판본인 **개역한글(1961년판)**과 퍼블릭 도메인인 영문 **KJV**만을 로컬에 내장하여 법적 안전성을 100% 확보하고 있습니다.
*   **교차 참조**: OpenBible.info에 의해 크리에이티브 커먼즈 저작자표시-동일조건변경허락(CC BY-SA) 또는 퍼블릭 도메인으로 공개된 *The Treasury of Scripture Knowledge* 데이터셋을 활용합니다.

---

## ⚖️ 라이선스 (License)

본 프로젝트의 소스 코드는 **[MIT License](LICENSE)** 하에 배포됩니다.
데이터셋과 성경 번역본의 권리는 각 원작자 및 퍼블릭 도메인 약관을 따릅니다.
