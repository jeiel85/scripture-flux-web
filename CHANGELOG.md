# CHANGELOG.md

## v0.7.0 - 2026-05-22

### Added
- **66권 한/영 성경 전서 텍스트 100% 전체 이식 완료 (Data & Integrity)**:
  - 저작권 이슈가 전혀 없는 국문 **개역한글(1961)**판 및 영문 **KJV**판 66권 전서 텍스트 데이터셋(`ko_ko.json`, `en_kjv.json`)을 direct fetch 및 완전 탑재
  - 총 31,106구절(KJV/개역한글 표준 매핑) 전체에 대해 100% 누락 없는 1:1 매핑 완료
  - 66개 책별 한/영 개별 분할 JSON 청크 파일 자동 빌드 파이프라인 가동 성공 (`public/data/bible-text/ko/[0-65].json`, `en/[0-65].json`)
  - 실시간 교차 참조 활성화 시, 스켈레톤 로더와 비동기 fetch를 통해 3만여 개 전서 구절을 랙 없이 완벽히 레이지 로딩
- **한글 특수 문자 정제 및 BOM 제거 디코더 탑재 (Quality)**:
  - 데이터셋 로딩 시 발생할 수 있는 UTF-8 BOM(\uFEFF) 문자를 완벽히 제거하여 JSON 파싱 실패 결함 원천 차단
  - 한글 성경의 홑따옴표가 깨져서 표기되는 HTML Entities(`&#x27;` ➔ `'` 등)를 미려하게 복원해 주는 디코딩 전처리 헬퍼를 파이프라인에 이식

### Verification
- `npm run lint` (ESLint via CMD): 0개 에러 통과 무결성 검증 완료
- `npm run build` (Vite Build via CMD): 66권 전서 텍스트 적재 후 dist 번들 초고속(1.80s) 무오류 빌드 통과

---

## v0.6.0 - 2026-05-22

### Added
- **구절 집중 탐색 및 Dimming 모드 도입 (Aesthetics)**:
  - 책, 장, 절을 정교하게 제어할 수 있는 프리미엄 3단 Select Dropdown UI 구축
  - 특정 구절을 탐색(Search) 시, 매칭되지 않는 모든 네트워크 참조선을 극단적으로 희미하게(`rgba(255, 255, 255, 0.015)`) 어둡게 만들어(Dimming) 시각적 노이즈를 완벽하게 제거
  - 검색된 해당 구절에 직접 연관되는 연결망만 선명하게 에메랄드 네온 Glow를 주며 덧그리는 집중 하이라이트 기능 구현
  - 집중 탐색 모드가 켜질 경우 캔버스 좌측 상단에 실시간 매칭 개수를 카운팅해 표시하는 프리미엄 Glassmorphism 안내 배지(`🔍 [책 장:절] 집중 탐색 (N개 참조)`) 오버레이 배치
- **Weight(연관 강도) 슬라이더 컨트롤 패널 구현 (Performance & UX)**:
  - 연관 강도 임계값(0.1 ~ 1.0, step 0.05) 상태 및 `<input type="range">` UI 컨트롤러를 글래스 모프 대시보드에 탑재
  - 사용자가 슬라이더를 당겨 실시간으로 캔버스 선 밀도를 조율함으로써 저사양 기기나 모바일에서의 렌더링 오버헤드를 완벽 제어
- **URL Hash 기반 딥링크 공유 및 비동기 복원 시스템 수립 (Premium UX)**:
  - 사용자가 성경 구절 참조선을 클릭해 핀 고정(`pinnedLink`)하면, 주소창 해시 주소를 `#GEN.1.1-JHN.1.1` 형식으로 실시간 동적 동기화
  - 사용자가 해당 공유 링크를 통해 신규 탭으로 앱에 최초 진입하면, 마운트 시 해시 문자열을 읽고 파싱하여 해당하는 책 인덱스를 추적
  - React 렉시컬 비동기 복원 생명주기를 수립하여, 해당 책의 세부 참조가 로드(`loadBookDetails`)되는 즉시 자동으로 `pinnedLink`와 `activeLink`를 강제 복제 및 복원 완수

### Changed
- 기존 필터 버튼 패널을 **통합 컨트롤 및 설정 대시보드** 가로 그리드(Grid) 레이아웃으로 전면 개편하여, 신구약 도메인 필터, Weight 슬라이더, 3단 구절 검색기가 모바일과 데스크톱 모두에서 현대적이고 세련되게 정돈되도록 디자인 개편

### Verification
- `npm run typecheck` (tsc): 블록 스코프 참조 호이스팅 오류 완치 및 0개 에러 100% 무결성 통과
- `npm run build` (tsc -b && vite build): 2,091개 모듈 dist 정적 번들로 초고속(6.45s) 빌드 및 릴리즈 준비 성공

---

## v0.5.0 - 2026-05-22

### Added
- **clientWidth/Height 기반 캔버스 물리/논리 정밀 매핑 (Bug Fix)**:
  - 고DPI 및 스크린 배율 환경에서 캔버스 바닥 영역이 잘리고 위쪽 영역만 노출되던 DPI 렌더링 매핑 결함을 완벽히 수정
  - `ResizeObserver` 상에서 `entry.target.clientWidth/Height` 논리 픽셀을 정밀하게 추출하고, `<canvas>`의 인라인 CSS를 `width: '100%', height: '100%'`로 강제 바인딩하여 모든 기기/배율에서 컨테이너 꽉 차게 잘림 없는 완전 렌더링 보장
- **66권 책별 대규모 데이터셋 분할 및 전처리 파이프라인 구축 (Performance)**:
  - 11,907쌍의 대규모 교차 참조와 66권 전체 성경 구절 데이터를 다루기 위한 전처리 파이프라인 구축 (`scripts/prepare-data.js`)
  - 66권 책별 한국어(개역한글 1961)/영어(KJV) 본문 텍스트 JSON 청크 및 책별 교차 참조 JSON 청크 분할 빌드 완수 (`public/data/bible-text/` 및 `public/data/cross-references/`)
- **2단계 Level of Detail (LOD) 비동기 교차 참조 렌더러 탑재 (Aesthetics)**:
  - 최초 로딩 시에는 가벼운 글로벌 대표 랜드마크 교차 참조(/data/cross-references.json, 16쌍)만 1단계 선패치하여 캔버스를 초고속 렌더링
  - 성경 축 영역 호버 또는 액티브(Active/Pinned) 상태 전환 시, 해당 책의 세부 교차 참조 JSON을 비동기 fetch하여 기존 좌표 맵에 dynamic merge하는 2단계 LOD 렌더링 탑재
  - 세부 참조망 비동기 병합이 일어날 때, 우측 상단에 미려하게 반짝이는 `세부 참조망 동적 병합 중...` 로딩 오버레이 인디케이터를 띄워 Premium UI 감각 제공
- **ReferenceCard 성경 본문 레이지 로딩 및 스켈레톤 UI 적용 (UX)**:
  - 수십 메가바이트의 번들 낭비를 유발하던 대형 JSON 정적 임포트를 완전히 철폐하고, 구절 정보 갱신 시 `bookIndex`에 맞춰 필요한 성경 책 본문 JSON 파일만 dynamic fetch 적용
  - 비동기 로딩을 위한 전역 메모리 캐시(`textCache`)를 도입하여 동일 책에 대한 네트워크 중복 요청을 원천 배제
  - fetch 수행 동안 사용자 지연 감각을 고급스럽게 정제하기 위해 반짝이는 스켈레톤(Skeleton Screen) 로딩 바 애니메이션 적용

### Verification
- `npm.cmd run typecheck` (tsc): 무경고 100% 통과 (tsc --noEmit)
- `npm.cmd run build` (tsc -b && vite build): 2,091개 모듈 dist 정적 번들로 초고속(1.25s) 무오류 빌드 성공

---

## v0.4.0 - 2026-05-22

### Added
- **교차 참조 클릭 핀 고정(Pinning) 및 디바운스 안정화 (P1)**:
  - 마우스 무브 시 카드 정보가 무질서하게 갱신되는 현상을 완화하기 위해 120ms 호버 디바운스(Dwell Delay) 메커니즘을 캔버스 렌더러에 탑재
  - 특정 참조 곡선을 클릭하면 골드 네온 라인(#f59e0b)과 골드 앵커/텍스트 라벨이 지속 드로잉되며 정보가 영구적으로 고정되는 `pinnedLink` 기능 구현
  - `ReferenceCard` 우측 상단의 `📌 고정 해제(X)` 또는 캔버스 빈 영역 클릭 시 안전하게 핀 해제 처리 연동
- **한국어 성경(개역한글 1961) 기본 탑재 및 한/영 다국어 듀얼 레이아웃 개편 (P1)**:
  - 퍼블릭 도메인으로 완전히 공개된 **개역한글(1961년판)** 30개 고유 샘플 구절(15쌍) DB 생성 및 매핑 (`verse-text.ko.json`)
  - `ReferenceCard`에 국문 번역을 상단에 크고 굵게 배치하고, 영문 KJV 번역본은 보조 점선 구분 하에 이탤릭 서체로 병기하는 가치 높은 듀얼 레이아웃 개편 완료
- **모바일 60FPS 최적화 및 터치 반경 튜닝 (P1)**:
  - high-DPI 모바일 스크린에서의 프레임 드랍을 막기 위해 Device Pixel Ratio(DPR)를 최대 1.5로 Clamping 제한
  - 손가락 터치 환경에서 작은 곡선이나 축을 쉽게 탭할 수 있도록 터치 히트 테스트 반경(Hit Test Radius)을 기존 8px에서 18px로 대폭 확장
- **Chris Harrison 및 OpenBible.info에 대한 감사 헌사 UI/문서 반영**:
  - UI 상단 헤더의 안내 섹션, 글로벌 푸터, 그리고 `README.md`, `ATTRIBUTION.md` 프로젝트 메인 규격 곳곳에 영감을 준 크리스 해리슨 교수와 오픈 데이터 제공자인 OpenBible.info를 명시하고 존경을 가득 담은 감사의 헌사 적용

### Changed
- 마우스 hover 상태와 클릭 pin 상태를 조화롭게 구성하기 위해 캔버스 렌더 레이어 상에서 `pinnedLink`가 최우선 순위로 고정 렌더링되도록 좌표 맵 매핑 및 선 굵기/블러 튜닝
- 캔버스 내 일반 백그라운드 참조 선 굵기를 0.5px로 축소하여 다량의 라인이 겹쳐도 시각적으로 과도한 피로감을 주지 않고 골드 네온의 고정 라인이 화려하게 돋보이도록 조정

### Verification
- `npm.cmd run lint` (ESLint): 무오류 100% 통과
- `npm.cmd run typecheck` (tsc): 무오류 100% 통과
- `npm.cmd run test` (Vitest): 창세기 4개 유닛 테스트 100% 통과
- `npm.cmd run build` (Vite Build): 1.10s 만에 에러 없이 프로덕션 dist 번들 빌드 성공

---

## v0.3.0 - 2026-05-22

### Added
- **웹 접근성(a11y) 키보드 탐색 개선 (P1)**:
  - `NetworkCanvas` 컨테이너에 포커스 가능 상태 (`tabIndex={0}`) 부여 및 에메랄드 컬러의 포커스 링 (`focus-within:ring-2`) 추가
  - 방향키(`ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`)를 통한 링크 순방향/역방향 탐색 및 `Escape` 키로 포커스 해제 구현
  - 포커스 유무에 반응하는 미려한 하단 플로팅 단축키/탐색 가이드 팁 UI 오버레이 추가
- **모바일 및 터치 디바이스 조작 지원 (P1)**:
  - 모바일 터치 드래그 연동을 위해 `onTouchStart` 및 `onTouchMove` 이벤트 바인딩 및 mouse 호버 쓰로틀 연산 일원화
  - 가로폭이 좁은 모바일 기기(<768px)에서 66권 축 텍스트 라벨 겹침 방지를 위해 라벨 노출 주기(skipLabel) 확대 및 폰트 크기 축소(8px)
  - 화면 높이를 기기 폭에 맞춰 동적으로 가변(400px ~ 600px) 적용
- **OS 애니메이션 축소(Reduced Motion) 완벽 대응 (P1)**:
  - `prefers-reduced-motion` 미디어 쿼리를 감지하는 state 훅 탑재
  - OS 차원의 애니메이션 축소가 활성화된 경우 `ReferenceCard` 오버레이 등의 Framer Motion 트랜지션 애니메이션 제거 (duration: 0s)
- **GitHub Actions 배포 자동화 파이프라인 탑재 (P2)**:
  - `.github/workflows/deploy.yml` CI/CD 워크플로우를 생성하여 main 브랜치 푸시 시 Lint, Typecheck, Test, Build 자동 검증
  - 빌드 통과 시 빌드 아티팩트를 GitHub Pages 정적 사이트 호스팅 서비스로 완전 자동 배포 연동

### Changed
- `focusedLinkIndex` 중복 상태를 제거하고 React 19 / ESLint 린트 규칙(`react-hooks/set-state-in-effect`)을 위반하지 않도록 `sortedLinks`를 실시간 계산하여 index를 역산출하는 `useMemo` 기반 아키텍처로 리팩토링

### Verification
- `npm run lint` 실행: ESLint 무경고 100% 통과
- `npm run typecheck` 실행: TypeScript 타입 안전성 무오류 통과
- `npm run test` 실행: 전체 단위 테스트(100%) 통과
- `npm run build` 실행: Vite 프로덕션 번들 968ms 만에 에러 없이 성공

---

## v0.2.0 - 2026-05-22

### Added
- ScriptureFlux 성경 교차 참조 시각화 프로젝트 전용 설계 문서 묶음 추가
- 기존 범용 `AGENTS.md` 운영 규칙을 ScriptureFlux 프로젝트 설정값과 구현 규칙으로 통합
- `TASKS.md`, `DECISIONS.md`, `ATTRIBUTION.md` 추가
- Canvas 기반 대규모 cross-reference rendering, hover hit-test, 데이터셋 라이선스 전략 문서 추가
- Claude, Gemini, Cursor 계열 에이전트 진입 파일 추가
- **성경 교차 참조 시각화 SPA MVP 구현**:
  - Vite + React + TypeScript + Tailwind CSS + Canvas 2D 아키텍처 도입
  - 66권 규격 메타데이터(`books.json`) 및 31,139절 인덱스(`verse-index.json`) 빌드 파이프라인
  - 저작권 준수를 위해 30개 고유 샘플 구절(15개 참조 쌍) KJV 텍스트 데이터 분리 매핑 (`verse-text.kjv.json`)
  - 60FPS 상호작용 속도를 보증하는 `requestAnimationFrame` 쓰로틀 마우스 호버 감지 로직
  - Active 1개 링크에만 Glow/Anchor 효과를 적용하는 Canvas 렌더러 (`NetworkCanvas.tsx`)
  - Glassmorphism 효과가 적용된 미려한 상세 카드 오버레이 (`ReferenceCard.tsx`)
  - Deep Navy 테마, 구신약 비례 축 렌더링, Framer Motion 미세 트랜지션 UI 구성 (`App.tsx`)

### Changed
- 기존 범용 README를 ScriptureFlux 프로젝트 README로 재구성
- `HISTORY.md`와 `CHANGELOG.md`를 ScriptureFlux 초기 설계 패키지 기준으로 갱신
- TS `verbatimModuleSyntax` 활성화 규칙에 맞춰 `RenderLink`에 type-only import (`type` 키워드) 적용하여 TS1484 에러 해결
- `projection.ts` 내 재할당 없는 변수 `localOffset`을 `const`로 보정하여 ESLint `prefer-const` 경고 해결

### Documentation
- 기존 에이전트 템플릿 원본은 `docs/source_snapshots/`에 보존
- 설계 문서는 `docs/` 아래에 정리

### Verification
- `npm run lint` 실행: 스타일 및 사용되지 않는 변수/임포트(offsetToX, dx) 정리하여 100% 통과
- `npm run test` 실행: 창세기 오프셋 데이터 정합성에 맞춘 `projection.test.ts` 4개 유닛 테스트 100% 통과
- `npm run build` 실행: `dist/` 내 정적 assets(index.html, js, css) 무오류 정적 빌드 성공
- GitHub 원격 origin `main` 브랜치로 전체 소스 코드 푸시 및 반영 성공 확인

---

## 이전 에이전트 템플릿 변경 이력

## v0.1.2 - 2026-05-17

### Added
- 모바일 배포 프로젝트를 위한 AAB, 스토어 업로드 산출물, mapping/symbols/dSYM 확인 규칙 추가
- GitHub Release 본문과 모바일 스토어용 릴리즈 노트를 분리해 관리하는 규칙 추가
- Android/iOS 버전명과 빌드 번호를 태그 및 문서 버전과 함께 확인하는 규칙 추가
- 외부 SDK, 광고, Play Games Services, 서명 키, 실기 검증 관련 배포 체크리스트 보강

## v0.1.1 - 2026-04-30

### Added
- `AGENTS.md` 프로젝트 설정값에 `Expected Assets` 항목 추가
- 릴리즈 시 APK, EXE 등 실제 구동 파일의 생성 및 유효성 확인 규칙 강화 (Section 23)

## v0.1.0 - 2026-04-29

### Added
- AI 코딩 에이전트를 위한 범용 작업 규칙 `AGENTS.md` 추가
- 프로젝트 개요 및 가이드를 담은 `README.md` 추가
- 이력 관리를 위한 `HISTORY.md` 및 `CHANGELOG.md` 구조화

### Documentation
- `AGENTS.md` 프로젝트 설정값 업데이트 (Repository URL 등)
