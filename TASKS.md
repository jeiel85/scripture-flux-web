# TASKS.md

이 문서는 ScriptureFlux 구현 작업 목록입니다. 에이전트는 한 번의 작업 루프에서 가장 높은 우선순위 작업 하나만 선택합니다.

## P0 - 프로젝트 기반 구축

- [x] Vite + React + TypeScript 프로젝트 생성
- [x] Tailwind CSS 설정
- [x] ESLint, Prettier 또는 프로젝트 표준 포맷 설정
- [x] Vitest 테스트 환경 설정
- [x] 기본 라우트 없는 SPA 구조 정리
- [x] GitHub Pages 배포를 고려한 `base` 설정 검토

## P0 - 데이터 모델

- [x] 66권 성경 메타데이터 작성
- [x] 각 권의 장/절 수 기반 누적 verse offset 계산 유틸리티 작성
- [x] `CrossReferenceTuple` 타입 정의
- [x] 작은 샘플 교차 참조 JSON 작성
- [x] 데이터 로딩 실패/빈 데이터 상태 처리

## P0 - 시각화 MVP

- [x] `NetworkCanvas` 컴포넌트 구현
- [x] 성경 66권 축 렌더링
- [x] sample cross-reference curve 렌더링
- [x] cubic Bezier curve 계산 유틸리티 작성
- [x] resize 대응
- [x] high-DPI canvas scaling 처리

## P1 - 인터랙션

- [x] pointer move `requestAnimationFrame` throttle
- [x] hover hit-test 1차 구현
- [x] active link glow 렌더링 분리
- [x] source/target anchor point 표시
- [x] `ReferenceCard` 오버레이 구현
- [x] keyboard focus 대체 인터랙션 설계

## P1 - 데이터셋 파이프라인

- [x] 교차 참조 원본 데이터 후보 검토
- [x] 원본 데이터 라이선스 기록
- [x] 전처리 스크립트 설계
- [x] full dataset을 indexed tuple JSON으로 변환
- [x] large JSON lazy load 또는 gzip 배포 전략 검토
- [x] 성경 본문 데이터와 참조 데이터 분리

## P1 - 디자인 polish

- [x] deep navy/charcoal 배경 시스템 정리
- [x] 구약/신약 시각 구분
- [x] glassmorphism card 세부 스타일 보정
- [x] reduced motion 대응
- [x] 모바일/태블릿 레이아웃 대응
- [x] 범례와 데이터 출처 표시

## P2 - 품질 및 배포

- [x] `npm run lint` 성공
- [x] `npm run typecheck` 성공
- [x] `npm run test` 성공
- [x] `npm run build` 성공
- [x] GitHub Actions CI 추가
- [x] GitHub Pages deploy workflow 추가
- [x] README 실행 방법 최신화
- [x] CHANGELOG/HISTORY 갱신

## v0.4.0 - P1 & P2 고도화 및 헌사 반영 (완료)

- [x] 120ms 호버 디바운스로 마우스 무브 시 카드 뷰 파르르 떨림 완벽 해결
- [x] 캔버스 내 참조선 클릭 시 골드 네온 라인 고정(Pin) 및 ReferenceCard 닫기(X) / 빈 공간 클릭 핀 해제 구현
- [x] 퍼블릭 도메인 개역한글(1961) 30개 고유 구절 DB 생성 및 한/영 다국어 듀얼 레이아웃 개편
- [x] 모바일 너비(<768px) dpr 1.5 제한 및 터치 히트 반경 18px 확장 튜닝
- [x] UI 헤더/푸터, README.md, ATTRIBUTION.md 감사 헌사 보완

## v0.5.0 - 대용량 데이터 파이프라인 및 LOD 레이지 로딩 아키텍처 완벽 구현 (완료)

- [x] clientWidth/Height 기반 캔버스 논리/물리 정밀 매핑으로 크기 잘림 결함 완벽 해결
- [x] Node 데이터 전처리 파이프라인 스크립트 작성 (`scripts/prepare-data.js`)
- [x] 66권 책별 본문 텍스트(한/영) 및 12,000쌍급 교차 참조 JSON 청크 자동 빌드 완수
- [x] 1단계 글로벌 랜드마크(16쌍) 선패치 및 2단계 책 호버 시 세부 교차 참조 비동기 fetch/merge LOD 렌더러 완벽 이식
- [x] `ReferenceCard` 대용량 임포트 철폐, 구절 활성 시 책별 본문 비동기 fetch 및 메모리 캐싱, 스켈레톤 로딩 바 적용
- [x] `npm run build` 정적 번들 초고속 무오류 빌드 성공
## v0.6.0 - 3대 프리미엄 편의 기능 대통합 (완료)

- [x] 구절 검색 및 집중 탐색 (Dimming) 모드 구현: 책/장/절 3단 드롭다운 UI 지원 및 비매칭 선 투명도 0.015 수준 완화 dimming & 에메랄드 네온 하이라이트
- [x] Weight(연관 강도) 정밀 슬라이더(0.1 ~ 1.0) 제어기 추가: 실시간 캔버스 복잡도 및 가용 렌더링 성능 제어
- [x] URL Hash 기반 딥링크 공유 및 복원 시스템 구현: 핀(Pin) 고정 시 `#GEN.1.1-JHN.1.1` 자동 갱신 및 최초 진입 시 비동기 lazy load 후 자동 복원
- [x] `npm run build` 정적 번들 100% 무오류 통과 및 정적 SPA 릴리즈 준비 완료

## 후속 아이디어

- [ ] 성경 본문 번역 선택 구조 확장 (예: 쉬운성경, NIV 등)
- [ ] WebGL 또는 OffscreenCanvas 기반 수만 개 선 렌더링 실험
- [ ] 검색창 자동완성(Autocomplete) 지원 및 모바일 UI 터치 슬라이딩 최적화


