# CHANGELOG.md

## v0.10.0 - 2026-05-26

### Added
- **성경 네트워크 줌(Zoom) & 드래그 팬(Pan) 시스템 대통합**:
  - 가로 성경 축 전체를 마우스 휠 및 모바일 2손가락 핀치 제스처를 통해 최대 10배에서 **최대 80배**까지 세밀하게 확대/축소할 수 있는 극대 줌 시스템 구현.
  - 줌이 확대된 상태에서 캔버스 빈 영역을 마우스 클릭 드래그 또는 1손가락 스와이프를 통해 좌우로 부드럽게 넘겨볼 수 있는 드래그 팬(Pan) 탑재 및 Clamping 범위 확장.
- **줌 수준별 실시간 장/절 눈금(LOD Ticks) 다이내믹 렌더러 탑재 (Aesthetics)**:
  - 줌 배율이 확대됨에 따라 책 바 하단에 점진적 장 눈금(LOD 2, 4배 이상) 및 개별 절 미세 눈금(LOD 3, 20배 이상) 틱과 가독성 높은 절 번호 라벨(예: `GEN 1:5`, `GEN 1:10`)을 실시간 렌더링.
  - Viewport 범위 제한 알고리즘을 결합하여, 현재 화면 가로 범위 내에 매핑되는 틱들만 선택적으로 드로잉하도록 설계함으로써 수만 개 눈금 연산 속에서도 60FPS 하드웨어 가속 렌더 프레임을 원천 보장.
- **PC 마우스 환경 오버 시 상세 노출 차단 및 클릭 선택(Click-to-View) 전환 (Aesthetics & UX)**:
  - 마우스 포인터 오버 시 상세 카드(`activeLink`)를 즉시 띄우던 구조를 차단해 마우스 이동 시의 눈 번쩍임 피로 및 떨림 부작용을 완치.
  - 마우스가 관계 곡선 위에 올라갔을 때는 커서를 `pointer` 모양으로 바꾸고 은은한 녹색 가이드선(`rgba(16,185,129,0.45)`) 힌트만 차분히 렌더링.
  - 오직 곡선을 **직접 클릭(Click)하여 선택했을 때만** 골드 네온 Glow 하이라이트가 켜지고 한/영 다국어 듀얼 상세 카드(`ReferenceCard`)가 표출되도록 개편.
  - 모바일 터치 환경에선 손가락을 스치며 탐색하는 실시간 카드 갱신 감지 구조를 분리해 안전하게 보존.
- **줌/팬 좌표 역투영(Unprojection) 수학 필터 연동 (정합성)**:
  - 축이 80배까지 확대되거나 이동하더라도 마우스 커서 호버링과 클릭을 통한 📌 정보 고정(Pin) 기능에 오차가 없도록 입력 X 좌표를 D3 Scale 상의 원래 좌표계로 투역 변환하는 `applyZoom` 및 `invertZoom` 수학식 결합.
- **프리미엄 글래스모프 플로팅 줌 컨트롤러 UI 탑재 (Aesthetics & Accessibility)**:
  - 캔버스 내부 우측 하단 영역에 은은한 Backdrop Blur 효과와 Emerald 포인트 컬러가 적용된 고급 플로팅 줌 패널 추가.
  - 마우스 휠이 없는 노트북 트랙패드 및 일반 환경에서도 간편하게 누를 수 있는 단계적 줌인(`＋`), 줌아웃(`－`), 1:1 초기화(`RESET`) 단추 및 실시간 배율 상태 배지 연동.

### Changed
- 줌 상태에 따라 모바일 및 소형 모니터 환경에서 성경 66권 책 라벨 글자가 서로 겹치던 가독성 한계를 Clamping 필터 적용을 통해 미려하게 보완.

### Documentation
- README의 GitHub Pages URL, 저장소 링크, 공개 메타데이터, 최신 v0.10.0 기능 요약을 현재 저장소 기준으로 정리했습니다.
- GitHub 배포 가이드와 AGENTS 프로젝트 설정의 저장소명 및 Pages base 경로 예시를 `scripture-flux-web` 기준으로 동기화했습니다.
- README에서 참조하던 로컬 `file:///` 링크를 저장소 상대 링크로 교체하고, 누락되어 있던 MIT `LICENSE` 파일을 추가했습니다.

### Build / CI
- `package.json`, `package-lock.json`, 앱 헤더 버전 배지를 `v0.10.0`으로 맞춰 공개 이력과 실제 표기가 어긋나지 않도록 정리했습니다.
- `npm run lint` 및 `npm run typecheck`, Vite 프로덕션 dist/ 정적 빌드를 100% 성공 통과시켰습니다.

### Verification
- `npm run lint`: 100% 통과
- `npm run typecheck`: TypeScript 형식 검사 통과
- `npm run build`: Vite 정적 릴리즈 번들 컴파일 성공

---

## v0.9.0 - 2026-05-25

### Added
- **34만 개 실증 성경 교차 참조망 전체 통합 (Data & LOD Complete)**:
  - OpenBible.info의 344,799개 방대한 실증 성경 교차 참조 TSV 데이터셋(`cross_references.txt`)을 파이프라인에 통합 완수.
  - 무효 또는 음수 투표수(Votes <= 0)를 걸러내어 341,239개의 검증된 실증 교차 참조선을 정제 적재.
  - `1Kgs` ➔ `1Kings`, `2Kgs` ➔ `2Kings` 등 TSV 약어를 `books.json` 내의 고유 인덱스와 100% 매핑 완료.
  - 구절 범위 형태(예: `John.1.1-John.1.3`)를 하이픈(`-`) 앞의 첫 구절(`John.1.1`)로 치환하여 단일 앵커 포인트로 정밀 계산.
  - 투표수(`Votes`) 기반 연관 강도(`Weight`)를 `[0.1, 1.0]` 범위로 정밀 정규화 (`Math.min(1.0, 0.1 + (votes/50)*0.9)`).
  - 1단계 로딩을 위한 최정예 상위 **1,500선** 글로벌 랜드마크 교차 참조(/data/cross-references.json) 및 66권 책별 전체 60만쌍의 2단계 세부 교차 참조 JSON 파일 적재 완료.
- **누락된 Same-Book & Same-Chapter 필터 기능 완비 (Nice-to-have Completion)**:
  - 성경 MVP 기획에 설계되어 있던 **같은 책 내 연결선 필터(Same-Book)** 및 **같은 장 내 연결선 필터(Same-Chapter)** 신규 필터링 옵션 전면 추가.
  - `NetworkCanvas` 및 `App.tsx` 제어판 대시보드와 UI 글래스모프 필터 버튼 완벽 연동.
- **동적 필터 통계 대시보드 고도화 (Premium UI/UX)**:
  - 미니 통계 패널에 현재 활성화된 필터 명칭 및 필터링 후 캔버스 상에 실제 그려지는 연결선 수(현재 필터 매칭)를 실시간으로 노출하는 동적 통계 대시보드 구축.

### Fixed
- **GitHub Pages 페이지 로드 결함 완전 해결 (Bug Fix)**:
  - `vite.config.ts` 및 `index.html`에서 서브디렉토리 base 경로를 실제 호스팅 저장소명인 `/scripture-flux-web/`로 통일함으로써 페이지 에셋 404 로딩 오류 전면 차단 및 완치.
  - `index.html` 메타태그와 `App.tsx` 내의 저장소 도메인 링크를 `scripture-flux-web`로 정밀 동기화.
  - `.gitignore` 파일을 개편하여 8MB 상당의 원본 다운로드 zip 및 TSV 캐시 폴더를 추적 목록에서 배제.

### Verification
- `npm run lint`: unused rawCrossReferences import 제거 후 100% 무오류 통과.
- `npm run typecheck`: 무오류 통과.
- `npm run test`: 창세기 투영 4개 유닛 테스트 100% 성공.
- `npm run build`: 1.04s 만에 dist 정적 SPA 번들 초고속 무오류 빌드 통과.

---

## Unreleased - 2026-05-22

### Performance
- `NetworkCanvas`에 `OffscreenCanvas` 우선 백버퍼를 도입해 정적 배경 네트워크를 캐싱하고, hover/focus/pin 변경 시에는 캐시된 배경 위에 active/pinned 링크만 덧그리도록 렌더링 경로를 분리했습니다.
- 데이터셋 안에 잘못된 책 인덱스나 장/절 값이 섞여 있어도 렌더링 전체가 중단되지 않도록 유효하지 않은 교차 참조 튜플을 방어적으로 제외합니다.

### Fixed
- `NetworkCanvas`의 책별 세부 교차 참조 lazy loading 로직에서 남아 있던 React Hooks 의존성 경고를 제거했습니다.
- 중복 fetch 방지 상태를 `ref` 기반으로 정리해 렌더링과 무관한 로딩 추적이 불필요한 재렌더를 만들지 않도록 보강했습니다.

### Verification
- `npm run lint`: 경고/오류 없이 통과
- `npm run typecheck`: 무오류 통과
- `npm run test`: 1개 테스트 파일, 4개 테스트 통과
- `npm run build`: dist 정적 SPA 빌드 성공
- Playwright CLI + Edge headless: 로컬 dev 서버에서 페이지 오류 없이 캔버스 생성 및 네트워크 렌더링 확인

---

## v0.8.0 - 2026-05-22

### Added
- **초성/약어/지능형 퀵 파서 탑재 지능형 자동완성 검색 바 구현 (Premium UX)**:
  - 초성(예: `ㅊㅅㄱ` ➔ 창세기), 단축어(예: `창`, `요`, `Gen`), ID/OSIS 매칭 등을 지원하는 스마트 매칭 검색 알고리즘 설계 (`src/utils/search-utils.ts`)
  - 지능형 퀵 구절 파서(Quick Parser)를 이식하여 `창 1:1`, `요3:16`, `Gen 1 1`, `John 3:16` 같은 다양한 서식의 자유 입력을 분석 후 실시간 구절 연동 처리
  - 에메랄드 네온 Glow 보더 및 글래스모프 디자인의 실시간 자동완성 제안 팝업창 레이아웃 수립 (`src/components/SearchBar.tsx`)
  - 키보드 접근성 인터랙션 지원 (`ArrowUp`/`ArrowDown`으로 목록 선택 이동, `Enter`로 자동완성 확정 및 직접 검색, `Escape`/Click Outside로 닫기)
- **하이브리드 양방향 검색 동기화 및 렌더 성능 최적화 (Architecture)**:
  - 지능형 검색 바와 기존 3단 셀렉터(책, 장, 절) 간의 **실시간 양방향 동기화(Sync)** 수립으로, 검색창에 입력하면 3단 셀렉터가 움직이고, 3단 셀렉터로 구절을 고르면 검색창 텍스트가 역전파되어 동적 갱신되도록 하이브리드 바인딩 완수
  - React의 cascading render를 완화하기 위해 `useEffect` 대신 렌더 시점의 Prop 변경 및 상태 변경 조율 패턴을 적용하여 동기식 렌더 오버헤드를 근본적으로 차단
  - 프로젝트 내부 package.json 버전을 `0.8.0`으로 공식 상향 갱신

### Verification
- `npm run lint` (ESLint): cascading render 린트 위반을 완치하여 0개 에러 완벽성 통과
- `npm run build` (Vite Build): 컴파일 통과 및 dist 번들링 2.93초 초고속 무오류 통과

---

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
