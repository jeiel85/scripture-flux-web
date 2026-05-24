# HISTORY.md

## 2026-05-25 (v0.9.0 - 34만 개 실증 성경 교차 참조망 전체 통합 및 누락 필터 탑재)

- 작업: OpenBible.info의 344,799개 대규모 교차 참조 데이터셋 TSV 파일을 연동 파이프라인에 탑재하여 실제 100% 매핑을 완료하고, 누락되었던 Same-Book(같은 책 내) 및 Same-Chapter(같은 장 내) 곡선 필터 2종을 구현 및 동적 통계 대시보드와 연동. 또한 호스팅 저장소명 변경에 맞춰 빌드 에셋 404 차단 결함을 완치.
- 변경 파일:
  - `vite.config.ts`: base 경로를 `/scripture-flux-web/`로 정정하여 에셋 로드 결함 완치
  - `index.html`: SEO 메타태그 도메인을 scripture-flux-web으로 교정
  - `.gitignore`: 8MB 상당의 원본 다운로드 zip 및 raw 데이터 제외 설정 추가
  - `scripts/prepare-data.js`: 가상 합성 생성 로직 철폐, `cross_references.txt` TSV 파서 이식(투표수 <= 0 및 복합 범위 앵커 전처리 정제), 투표수 기반 가중치 정규화 적용, LOD 최정예 상위 1,500선 및 66권 개별 적재 파이프라인 개편 가동
  - `src/components/NetworkCanvas.tsx`: SAME_BOOK 및 SAME_CHAPTER 신규 필터 계산 구현, 부모에 변경 수치를 알리기 위한 `onFilteredCountChange` callback prop 탑재
  - `src/App.tsx`: 지능형 필터링 제어판에 SAME_BOOK/SAME_CHAPTER 버튼 추가, dynamic filteredCount 및 activeFilter 통계 패널 연동 고도화, 미사용 rawCrossReferences 임포트 제거하여 린트 오류 해결
- 검증:
  - 로컬 `cmd.exe /c "npm run lint"`: eslint 경고/오류 0건으로 통과
  - 로컬 `cmd.exe /c "npm run typecheck"`: 무경고 TypeScript 형식 안전성 통과
  - 로컬 `cmd.exe /c "npm run test"`: 창세기 오프셋 projection 유닛 테스트 4건 100% 통과
  - 로컬 `cmd.exe /c "npm run build"`: tsc 및 Vite build로 1.04s 만에 dist/ 정적 dist SPA 컴파일 성공
- 결과: 성공 (34만 개 실증 데이터 적재 완수 및 누락 기능 통합 완료)

## 2026-05-22 (v0.8.0 성능 실험 - OffscreenCanvas 백버퍼 렌더링)

- 작업: `NetworkCanvas`의 정적 배경 네트워크를 `OffscreenCanvas` 우선 백버퍼에 캐싱하고, foreground 캔버스에서는 캐시된 배경 복사 후 active/pinned 링크만 덧그리도록 렌더링 경로를 분리. 잘못된 교차 참조 튜플이 포함되어도 전체 React 렌더가 중단되지 않도록 유효성 방어 필터를 추가.
- 변경 파일:
  - `src/components/NetworkCanvas.tsx`: `OffscreenCanvas`/HTMLCanvas fallback 백버퍼 생성, 정적 배경 레이어와 foreground active/pinned 레이어 분리, 책 hover lazy loading 유지, invalid tuple 방어 필터 추가
  - `TASKS.md`, `CHANGELOG.md`, `DECISIONS.md`, `HISTORY.md`: 성능 실험 작업 이력과 검증 결과 기록
- 검증:
  - 로컬 `npm run lint`: 경고/오류 없이 통과
  - 로컬 `npm run typecheck`: 무오류 통과
  - 로컬 `npm run test`: 1개 테스트 파일, 4개 테스트 통과
  - 로컬 `npm run build`: dist 정적 SPA 빌드 성공
  - Playwright CLI + Edge headless: `http://127.0.0.1:5180/ScriptureFlux/`에서 페이지 오류 없이 본문과 캔버스 크기 확인, 스크린샷으로 네트워크 렌더링 확인
- 결과: 성공 (Canvas 2D 아키텍처를 유지하면서 배경 전체 재렌더 비용을 줄이는 OffscreenCanvas 실험 적용)
- 후속 작업:
  - 모바일 UI 터치 슬라이딩 및 스와이프 제스처 최적화
  - 데이터 파이프라인에서 invalid tuple을 생성 단계에서 제거하고 report에 집계

## 2026-05-22 (v0.8.0 유지보수 - Canvas Hooks 의존성 경고 정리)

- 작업: `NetworkCanvas`의 책별 세부 교차 참조 lazy loading 함수를 안정적인 `useCallback` 구조로 정리하고, 로드 완료/진행 중 책 목록을 `ref`로 관리하여 React Hooks 의존성 경고를 제거.
- 변경 파일:
  - `src/components/NetworkCanvas.tsx`: `loadBookDetails`를 안정화하고 중복 fetch 방지 상태를 `loadedBooksRef`/`loadingBooksRef`로 분리, `useMemo` 및 `useEffect` 의존성 배열을 실제 데이터 흐름과 일치하도록 보정
  - `TASKS.md`, `CHANGELOG.md`, `HISTORY.md`: 유지보수 작업 이력과 검증 결과 기록
- 검증:
  - 로컬 `npm run lint`: 경고/오류 없이 통과
  - 로컬 `npm run typecheck`: 무오류 통과
  - 로컬 `npm run test`: 1개 테스트 파일, 4개 테스트 통과
  - 로컬 `npm run build`: dist 정적 SPA 빌드 성공
- 결과: 성공 (기존 Canvas lazy loading 동작을 유지하면서 린트 경고 4건 제거)
- 후속 작업:
  - WebGL 또는 OffscreenCanvas 기반 수만 개 선 렌더링 실험
  - 모바일 UI 터치 슬라이딩 및 스와이프 제스처 최적화

## 2026-05-22 (v0.8.0 - 지능형 자동완성 검색 바 및 양방향 동기화 구현)

- 작업: 초성, 약칭, 지능형 퀵 구절 파서를 지원하는 지능형 자동완성 검색 바를 구현하고, 기존 하이브리드 3단 드롭다운 셀렉터와 실시간 양방향 동기화(Sync)를 수립하여 성경 네트워크 탐색의 사용성을 극대화. 렌더링 성능을 위해 동기식 cascading render를 금지하는 ESLint 린트 규칙에 의거, useEffect 대신 렌더 시점 상태 조정 패턴을 적용하여 최적화 완수.
- 변경 파일:
  - `src/utils/search-utils.ts` [NEW]: 초성 추출(`getChoseong`), 퀵 구절 파서(`parseQuickVerse`), 실시간 자동완성 제안(`getSuggestions`)을 지원하는 유틸리티 작성
  - `src/components/SearchBar.tsx` [NEW]: 포커스 이펙트 및 글래스모프 디자인 자동완성 제안 팝업, 키보드 접근성 인터랙션 지원 검색 바 컴포넌트 작성
  - `src/App.tsx`: `SearchBar` 컴포넌트 통합, 검색/초기화 핸들러 구현 및 양방향 역전파 바인딩, package.json 버전에 동기화한 v0.8.0 Premium 버전 배지 표시
  - `package.json`: 버전을 `0.8.0`으로 공식 상향
  - `TASKS.md`, `CHANGELOG.md`, `HISTORY.md`, `task.md`: v0.8.0 신규 마일스톤 이력 전면 갱신
- 검증:
  - 로컬 `cmd.exe /c "npm run lint"`: cascading render 린트 에러 완치하여 0개 에러 통과
  - 로컬 `cmd.exe /c "npm run build"`: 번들링에 2.93초 소요, 무경고 dist/ 정적 SPA 빌드 성공
- 결과: 성공 (초성 및 퀵 파싱을 지원하는 지능형 자동완성 검색 바 구동 성공)
- 후속 작업:
  - WebGL 또는 OffscreenCanvas 기반 수만 개 선 렌더링 실험
  - 모바일 UI 터치 슬라이딩 및 스와이프 제스처 최적화

## 2026-05-22 (v0.7.0 - 66권 한/영 성경 전서 텍스트 100% 전체 이식 및 파이프라인 완수)

- 작업: 오픈소스 무저작권 성경 전서 데이터셋(`ko_ko.json` 및 `en_kjv.json`)을 direct fetch 및 탑재하여, 66권 전체 31,106구절 한/영 텍스트를 누락 없이 1:1 정밀 매핑하는 빌드 파이프라인(`scripts/prepare-data.js`) 개편 가동 성공. 한글 개역한글 데이터셋의 UTF-8 BOM(\uFEFF) 제거 및 홑따옴표가 깨지는 HTML Entities(`&#x27;` ➔ `'` 등)를 미려하게 복원해 주는 특수 문자 정제 디코딩 이식 완료.
- 변경 파일:
  - `scripts/prepare-data.js`: UTF-8 BOM 제거 로직(`replace(/^\uFEFF/, '')`) 및 한글 깨짐 복원을 위한 `decodeHtmlEntities` 헬퍼 함수 구현 적용, `ko_ko.json` 및 `en_kjv.json` 전체 성경 구절 순회 구조로 개편하여 플레이스홀더를 지우고 실제 구절 데이터로 66권 분할 적재(`public/data/bible-text/`)하도록 전처리 로직 전면 보강
  - `TASKS.md`, `CHANGELOG.md`, `HISTORY.md`, `DECISIONS.md`: v0.7.0 전체 텍스트 이식과 정적 빌드 검증 성공 이력 마일스톤 전면 갱신
- 검증:
  - 로컬 `cmd.exe /c "npm run lint"`: warnings 4건(React hooks dependency) 외 무오류 100% 통과
  - 로컬 `cmd.exe /c "npm run build"`: dist/ 정적 SPA 번들 초고속(1.80s) 100% 무결성 통과 및 릴리즈 성공
- 결과: 성공 (성경 66권 전서 텍스트 100% 한/영 동시 lazy loading 완벽 구현)
- 후속 작업:
  - WebGL 또는 OffscreenCanvas 기반 수만 개 선 렌더링 실험
  - 검색창 자동완성(Autocomplete) 지원 및 모바일 UI 터치 슬라이딩 최적화

## 2026-05-22 (v0.6.0 - 3대 프리미엄 편의 기능 대통합)

- 작업: 특정 구절 중심 집중 탐색 및 Dimming 모드 구현(책/장/절 3단 Dropdown UI 지원 및 비매칭 곡선 0.015 알파 투명도 dimming & 에메랄드 네온 하이라이팅), Weight(연관 강도) 정밀 슬라이더(0.1 ~ 1.0) 조율기 탑재로 캔버스 복잡도 및 렌더링 밀도 제어, URL Hash 기반 딥링크 공유 및 비동기 복원 시스템 수립(핀 고정 시 `#GEN.1.1-JHN.1.1` 해시 갱신 및 최초 진입 시 비동기 lazy load 후 자동 복원)
- 변경 파일:
  - `src/components/NetworkCanvas.tsx`: minWeight, searchVerse, initialPinnedRefs Props 추가, filteredLinks useMemo 내 minWeight 임계값 필터링 연동, searchMatchCount useMemo 및 🔍 집중 탐색 프리미엄 Glassmorphism 배지 오버레이 추가, draw() 루프 내 비매칭 곡선 극도 투명도(alpha 0.015) 완화 dimming 렌더링 및 매칭 곡선 에메랄드 네온 glow 하이라이트 덧그리기 이식, deep-link 복원을 위한 initialPinnedRefs 비동기 fetch/RESTORE useEffect 연동 및 block-scoped 변수 선언 순서 결함 완치
  - `src/App.tsx`: minWeight, searchVerse, initialPinnedRefs 상태 훅 추가, URL Hash 딥링크 공유 마운트/파싱 복원 Effect 작성, 핀 고정 시 Hash 동적 갱신 Effect 작성, 3단 검색 셀렉터(searchBookIdx, searchChapter, searchVerseNum) 로컬 상태 탑재 및 통합 컨트롤 Glassmorphic 가로 그리드 대시보드(도메인 필터, Weight 슬라이더, 3단 콤보 검색) 구축, `NetworkCanvas` Props 풀 바인딩 
- 검증:
  - 로컬 `npm run typecheck` (tsc): 무경고 패스 (0개 에러)
  - 로컬 `npm run build` (tsc -b && vite build): 2,091개 모듈 트랜스폼 및 6.45초 만에 dist/ 정적 SPA 빌드 무오류 완수
- 결과: 성공 (3대 프리미엄 대시보드 및 복원 엔진 탑재 완료)
- 후속 작업:
  - 성경 본문 번역 선택 구조 확장 (예: 쉬운성경, NIV 등)

## 2026-05-22 (v0.5.0 - 대용량 데이터 파이프라인 및 LOD 레이지 로딩 아키텍처 완벽 구현)

- 작업: clientWidth/Height 기반 캔버스 물리/논리 정밀 매핑으로 크기 잘림 결함 해결, Node 데이터 전처리 파이프라인(`scripts/prepare-data.js`) 구축, 66권 책별 성경 본문 텍스트 및 12,000쌍급 교차 참조 JSON 청크 자동 빌드, 캔버스 2단계 LOD(글로벌 랜드마크 -> 호버/액티브 책 세부망 병합) 비동기 렌더러 구현, `ReferenceCard` 비동기 본문 fetch 및 메모리 캐싱, 스켈레톤 로딩 바 적용
- 변경 파일:
  - `scripts/prepare-data.js` [NEW]: 책별 본문 텍스트(bible-text/ko(en)/<bookIndex>.json) 및 책별 교차 참조(cross-references/<bookIndex>.json) 분할 청크 생성 스크립트 작성
  - `src/components/NetworkCanvas.tsx`: clientWidth/Height 기반 ResizeObserver 크기 추출, 캔버스 인라인 CSS w-full h-full 바인딩, 최초 글로벌 랜드마크 교차 참조(/data/cross-references.json) 1단계 선패치, 66권 축 책 영역 호버/액티브 시 해당 책의 세부 참조선 비동기 fetch/merge(2단계 LOD) 구현, 우측 상단 '세부 참조망 동적 병합 중...' 로딩 오버레이 UI 구현
  - `src/components/ReferenceCard.tsx`: 대형 JSON 정적 임포트 완전 제거, useEffect 기반 책별 본문 비동기 fetch(fetchBookText), 전역 메모리 캐시(textCache), 로딩 중 스켈레톤 로딩 바 UI 적용
- 검증:
  - 로컬 `npm.cmd run typecheck` (tsc): 무경고 패스
  - 로컬 `npm.cmd run build` (tsc -b && vite build): dist/ 정적 SPA 빌드 초고속(1.25s) 무오류 완수
- 결과: 성공 (LOD 2단계 레이지 로딩 탑재 및 캔버스 크기 잘림 완치)
- 후속 작업:
  - 필터: 구약↔신약 외 주제별, weight별 정밀 슬라이더 필터링

## 2026-05-22 (P1 & P2 고도화 개발 및 감사 헌사 UI/문서 최종 탑재)

- 작업: 교차 참조 인터랙션 안정성 확보(120ms 호버 디바운스, 클릭 핀 고정), 국문 개역한글(1961) 성경 로컬 DB 생성 및 한/영 다국어 듀얼 레이아웃 탑재, 모바일 60FPS 최적화(DPR 1.5 제한 및 터치 히트 반경 18px), 오리지널 시각 예술 영감(Chris Harrison & OpenBible.info) 감사 헌사 UI/문서 보강
- 변경 파일:
  - `src/data/verse-text.ko.json` [NEW]: 퍼블릭 도메인 개역한글 30개 고유 구절 DB 수록
  - `src/components/NetworkCanvas.tsx`: 120ms 호버 디바운스 Dwell 로직 추가, 클릭을 통한 activeLink 고정(`pinnedLink`), 모바일 dpr 1.5 Clamping 제한, 터치 히트 반경 18px 확장, 골드 네온 라인 및 지속 앵커 드로잉 탑재
  - `src/components/ReferenceCard.tsx`: 한/영 듀얼 렌더링 카드 구조 설계, 핀 배지 및 핀 해제 닫기 버튼 추가
  - `src/App.tsx`: 헌사 설명 패널 및 푸터 감사 헌사 2단 기둥 반영, `pinnedLink` 상태 및 해제 이벤트 바인딩
  - `ATTRIBUTION.md`: Chris Harrison 및 OpenBible.info에 대한 경의 깊은 헌사 마크다운 수록
  - `README.md`: 영감을 준 프로젝트 섹션 보강
  - `DECISIONS.md`, `TASKS.md`, `HISTORY.md`, `CHANGELOG.md`: 이력/의사결정 문서 일제 갱신
- 검증:
  - 로컬 `npm.cmd run lint` (ESLint): 무경고 패스
  - 로컬 `npm.cmd run typecheck` (tsc): 무오류 통과
  - 로컬 `npm.cmd run test` (Vitest): 유닛 테스트 100% 통과
  - 로컬 `npm.cmd run build` (Vite Build): 1.10s 만에 에러 없이 정적 SPA 빌드 성공
- 결과: 성공 (모든 고도화 및 감사 헌사 완수)
- 후속 작업:
  - 교차 참조 전체 데이터셋 34만개 파이프라인 생성 및 점진적 lazy-loading 구조 도입

## 2026-05-22 (P1 & P2 고도화 개발 완료 및 CI/CD 워크플로우 탑재)

- 작업: 키보드 접근성 탐색, 모바일 및 터치 기기 조작 보완, Reduced Motion OS 애니메이션 축소 대응, GitHub Actions CI/CD 파이프라인 탑재 완료
- 변경 파일:
  - `src/components/NetworkCanvas.tsx`: `tabIndex={0}` 키보드 탐색 및 포커스 링 스타일 바인딩, 터치 드래그 탐색(`onTouchStart`/`onTouchMove`) 적용 및 마우스/터치 좌표 감지 logic 단일화, 모바일 높이 가변 반응형 대응, 66권 축 겹침 방지 주기/폰트 보정, 힌트 오버레이 UI 추가, `focusedLinkIndex` 중복 상태 제거 및 `useMemo` 기반 실시간 인덱스 역산으로 린트 경고 제거
  - `src/components/ReferenceCard.tsx`: `prefers-reduced-motion` 미디어 쿼리 상태 훅 추가, OS 축소 설정 시 트랜지션 즉시(0s) 제거
  - `.github/workflows/deploy.yml`: Lint, Typecheck, Test, Build 수행 및 성공 시 GitHub Pages로 빌드본 자동 배포 연동
  - `TASKS.md`, `DECISIONS.md`, `HISTORY.md`, `CHANGELOG.md`: 구현에 따른 태스크, 결정 및 이력 최종 문서화
- 검증:
  - 로컬 `npm run lint`: 100% 무오류 통과
  - 로컬 `npm run typecheck`: 100% 무오류 통과
  - 로컬 `npm run test`: 단위 테스트 100% 성공 통과
  - 로컬 `npm run build`: 968ms 만에 dist/ 빌드 성공
- 결과: 성공 (P1, P2 요구사항 전체 로컬 완수 및 CI/CD 배포 준비 완료)
- 후속 작업:
  - 교차 참조 데이터 필터링(구약 ↔ 신약) 및 검색 기능 고도화

## 2026-05-22 (MVP 구현)

- 작업: ScriptureFlux 성경 교차 참조 시각화 SPA MVP 구현 완료, 빌드 에러/린트 오류 해결 및 원격 GitHub 저장소 푸시 완료
- 변경 파일:
  - `src/components/NetworkCanvas.tsx`: ESLint 미사용 변수(offsetToX, dx) 제거, strokeColor 대입 최적화(const ternary), type import 대응
  - `src/App.tsx`: type-only import(`type RenderLink`)로 수정하여 TS1484 에러(verbatimModuleSyntax 규칙) 해결
  - `src/components/ReferenceCard.tsx`: type-only import(`import type { RenderLink }`)로 수정하여 TS1484 에러 해결
  - `src/utils/projection.ts`: `let localOffset`을 `const`로 변경하여 ESLint(prefer-const) 에러 해결
  - `TASKS.md`: 완료된 태스크 반영 갱신
  - `HISTORY.md`, `CHANGELOG.md`: 최종 구현 완료 요약 기록
- 검증:
  - 로컬 `npm run lint` 실행: 무오류 성공 통과
  - 로컬 `npm run test` 실행: `projection.test.ts` 4개 유닛 테스트 100% 성공 통과
  - 로컬 `npm run typecheck` 및 `npm run build` 실행: `dist/` 정적 asset(index.html, JS, CSS) 빌드 성공
  - `git push -u origin main` 실행: 원격 origin(https://github.com/jeiel85/ScriptureFlux.git) main 브랜치로 커밋 푸시 성공
- 결과: 성공 (MVP 빌드본 원격 도달)
- 후속 작업:
  - GitHub Actions 기반 자동화 빌드/배포(GitHub Pages) 추가
  - keyboard focus 대체 인터랙션 설계 및 reduced motion/모바일 반응형 보완

---

## 2026-05-22 (이전 통합 작업)

- 작업: 기존 범용 에이전트 MD 파일과 ScriptureFlux 성경 교차 참조 시각화 설계 묶음 통합

---

## 이전 에이전트 템플릿 작업 이력

## 2026-05-17
- 작업: `nightseed-survivor` 프로젝트의 모바일 배포 및 릴리즈 운영 규칙을 범용 규칙으로 반영
- 변경 파일:
  - AGENTS.md: AAB, 스토어 릴리즈 노트, 모바일 버전 동기화, 서명/외부 SDK/실기 검증 체크리스트 추가
  - CHANGELOG.md: v0.1.2 변경 사항 추가
  - HISTORY.md: 작업 이력 기록
- 검증: `git diff`로 변경 내용 확인
- 결과: 성공
- 후속 작업: 다른 모바일 프로젝트에 적용 시 프로젝트별 `Expected Assets`, 버전 파일, 스토어 노트 경로를 설정값에 맞게 조정

## 2026-04-30
- 작업: 릴리즈 산출물 검증 규칙 강화 및 템플릿 업데이트
- 변경 파일:
  - AGENTS.md: 'Expected Assets' 설정 항목 추가 및 릴리즈 검증 체크리스트 구체화
- 검증: 파일 수정 확인
- 결과: 성공
- 후속 작업: 신규 규칙 적용 확인

## 2026-04-29
- 작업: 프로젝트 초기화 및 기본 문서 작성
- 변경 파일:
  - AGENTS.md: 범용 에이전트 규칙 작성 및 프로젝트 설정 업데이트
  - README.md: 프로젝트 소개 및 사용법 작성
  - HISTORY.md: 이력 관리 문서 생성
  - CHANGELOG.md: 변경 로그 문서 생성
- 검증: 로컬 파일 생성 확인
- 결과: 성공
- 후속 작업: GitHub 저장소 푸시 및 에이전트 연동 테스트
