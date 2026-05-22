# HISTORY.md

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
