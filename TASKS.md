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

## 후속 아이디어

- [ ] 필터: 구약↔신약, 동일 권 내부, 주제별, weight별
- [ ] 검색: 특정 구절 입력 시 관련 링크 집중 표시
- [ ] 공유 링크: 활성 링크 또는 구절 위치 URL hash 저장
- [ ] 성경 본문 번역 선택 구조
- [ ] WebGL 또는 OffscreenCanvas 실험

