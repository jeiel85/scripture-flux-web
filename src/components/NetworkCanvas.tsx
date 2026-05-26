import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { scaleLinear } from 'd3-scale';
import books from '../data/books.json';
import verseIndex from '../data/verse-index.json';
import { toGlobalVerseOffset } from '../utils/projection';
import { getBezierHeight, distanceToBezier } from '../utils/geometry';

export interface VerseRef {
  bookIndex: number;
  chapter: number;
  verse: number;
}

export interface RenderLink {
  id: number;
  source: VerseRef;
  target: VerseRef;
  sourceOffset: number;
  targetOffset: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  weight: number;
  testamentClass: 'OT_TO_OT' | 'OT_TO_NT' | 'NT_TO_NT' | 'NT_TO_OT';
}

interface NetworkCanvasProps {
  activeLink: RenderLink | null;
  setActiveLink: (link: RenderLink | null) => void;
  pinnedLink: RenderLink | null;
  setPinnedLink: (link: RenderLink | null) => void;
  filterType: 'ALL' | 'OT_ONLY' | 'NT_ONLY' | 'OT_NT' | 'SAME_BOOK' | 'SAME_CHAPTER';
  minWeight: number;
  searchVerse: VerseRef | null;
  initialPinnedRefs: { source: VerseRef; target: VerseRef } | null;
  setInitialPinnedRefs: (refs: { source: VerseRef; target: VerseRef } | null) => void;
  onFilteredCountChange?: (count: number) => void;
}

const PADDING_X = 60;
const AXIS_Y_OFFSET = 80; // 하단 여백 (축 렌더링 공간)

type CanvasBuffer = OffscreenCanvas | HTMLCanvasElement;
type CanvasContext2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

function createCanvasBuffer(width: number, height: number): CanvasBuffer {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function drawBezierPath(ctx: CanvasContext2D, link: RenderLink, applyZoom: (x: number) => number) {
  const zx0 = applyZoom(link.x0);
  const zx1 = applyZoom(link.x1);
  const h = getBezierHeight(zx0, zx1);
  ctx.beginPath();
  ctx.moveTo(zx0, link.y0);
  ctx.bezierCurveTo(zx0, link.y0 - h, zx1, link.y1 - h, zx1, link.y1);
  ctx.stroke();
}

export const NetworkCanvas: React.FC<NetworkCanvasProps> = ({
  activeLink,
  setActiveLink,
  pinnedLink,
  setPinnedLink,
  filterType,
  minWeight,
  searchVerse,
  initialPinnedRefs,
  setInitialPinnedRefs,
  onFilteredCountChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 600 });
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const rAFRef = useRef<number | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backgroundLayerRef = useRef<CanvasBuffer | null>(null);
  const [backgroundVersion, setBackgroundVersion] = useState(0);

  // 0. 접근성 및 키보드 상태 선언
  const [isFocused, setIsFocused] = useState(false);
  const [hoveredBookIndex, setHoveredBookIndex] = useState<number | null>(null);

  // LOD(Level of Detail) 2단계 레이지 로딩 상태
  const [initialLinks, setInitialLinks] = useState<number[][]>([]);
  const [detailedLinks, setDetailedLinks] = useState<number[][]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const loadedBooksRef = useRef<Set<number>>(new Set());
  const loadingBooksRef = useRef<Set<number>>(new Set());

  // 줌 및 팬 제어 상태 추가
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [offsetX, setOffsetX] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [tempHoveredLink, setTempHoveredLink] = useState<RenderLink | null>(null);

  // 드래그 및 터치/핀치 줌 추적용 refs
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastOffsetXRef = useRef<number>(0);
  const lastTouchDistanceRef = useRef<number | null>(null);

  // 최초 1회: 글로벌 대표 교차 참조 데이터 페치 (LOD Level 1)
  useEffect(() => {
    const loadInitialReferences = async () => {
      try {
        const response = await fetch('./data/cross-references.json');
        if (!response.ok) throw new Error('Failed to load initial references');
        const data = await response.json();
        setInitialLinks(data);
      } catch (err) {
        console.error('Failed to load initial references:', err);
      }
    };
    loadInitialReferences();
  }, []);

  // 책별 세부 교차 참조 비동기 패치 함수 (LOD Level 2)
  const loadBookDetails = useCallback(async (bookIdx: number) => {
    if (loadedBooksRef.current.has(bookIdx) || loadingBooksRef.current.has(bookIdx)) return;

    loadingBooksRef.current.add(bookIdx);
    setIsLoadingDetails(true);

    try {
      const response = await fetch(`./data/cross-references/${bookIdx}.json`);
      if (!response.ok) throw new Error(`Failed to load cross-references for book ${bookIdx}`);
      const data = await response.json();
      
      setDetailedLinks((prev) => {
        const merged = [...prev];
        const existingKeys = new Set(merged.map(item => `${item[0]}-${item[1]}-${item[2]}-${item[3]}-${item[4]}-${item[5]}`));
        
        data.forEach((item: number[]) => {
          const key = `${item[0]}-${item[1]}-${item[2]}-${item[3]}-${item[4]}-${item[5]}`;
          if (!existingKeys.has(key)) {
            merged.push(item);
            existingKeys.add(key);
          }
        });
        return merged;
      });
      loadedBooksRef.current.add(bookIdx);
    } catch (err) {
      console.error(`Failed to load cross-references for book ${bookIdx}:`, err);
    } finally {
      loadingBooksRef.current.delete(bookIdx);
      setIsLoadingDetails(loadingBooksRef.current.size > 0);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  // activeLink, pinnedLink, searchVerse 활성화 시 관련 구절의 세부 교차 참조도 백그라운드 선패치 수행
  useEffect(() => {
    if (activeLink) {
      loadBookDetails(activeLink.source.bookIndex);
      loadBookDetails(activeLink.target.bookIndex);
    }
    if (pinnedLink) {
      loadBookDetails(pinnedLink.source.bookIndex);
      loadBookDetails(pinnedLink.target.bookIndex);
    }
    if (searchVerse) {
      loadBookDetails(searchVerse.bookIndex);
    }
  }, [activeLink, loadBookDetails, pinnedLink, searchVerse]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // 1. 창 크기 변화 대응 (Responsive Layout) - clientWidth/Height 기반 정밀 보정
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.target.clientWidth;
        const height = entry.target.clientHeight;
        setDimensions({
          width: Math.max(320, width),
          height: Math.max(300, height),
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // 2. 가로 투영용 D3 Scale 선언
  const xScale = useMemo(() => {
    return scaleLinear()
      .domain([0, verseIndex.totalVerses - 1])
      .range([PADDING_X, dimensions.width - PADDING_X]);
  }, [dimensions.width]);

  // 드래그 한계(Clamping) 제한
  const clampOffsetX = useCallback((offset: number, currentZoom: number) => {
    const maxOffset = (dimensions.width / 2 - PADDING_X) * (currentZoom - 1);
    return Math.max(-maxOffset, Math.min(maxOffset, offset));
  }, [dimensions.width]);

  // 가로축 줌 좌표 투영 및 역투영 함수
  const applyZoom = useCallback((x: number) => {
    const centerX = dimensions.width / 2;
    return (x - centerX) * zoomLevel + centerX + offsetX;
  }, [dimensions.width, zoomLevel, offsetX]);

  const invertZoom = useCallback((x: number) => {
    const centerX = dimensions.width / 2;
    return (x - offsetX - centerX) / zoomLevel + centerX;
  }, [dimensions.width, zoomLevel, offsetX]);

  // 마우스 휠 줌 연동 (Passive Event Listener 우회, 최대 줌 80.0배 확장)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = 1.15;
      let nextZoom = zoomLevel;

      if (e.deltaY < 0) {
        nextZoom = Math.min(80.0, zoomLevel * zoomFactor);
      } else {
        nextZoom = Math.max(1.0, zoomLevel / zoomFactor);
      }

      if (nextZoom !== zoomLevel) {
        setZoomLevel(nextZoom);
        setOffsetX((prev) => clampOffsetX(prev, nextZoom));
      }
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [zoomLevel, clampOffsetX]);

  // 병합된 교차 참조 튜플 (initial + detailed)
  const combinedReferences = useMemo(() => {
    const merged = [...initialLinks];
    const existingKeys = new Set(merged.map(item => `${item[0]}-${item[1]}-${item[2]}-${item[3]}-${item[4]}-${item[5]}`));
    
    detailedLinks.forEach(item => {
      const key = `${item[0]}-${item[1]}-${item[2]}-${item[3]}-${item[4]}-${item[5]}`;
      if (!existingKeys.has(key)) {
        merged.push(item);
        existingKeys.add(key);
      }
    });
    return merged;
  }, [initialLinks, detailedLinks]);

  // 3. 병합된 교차 참조 데이터를 렌더링에 적합한 좌표 링크 객체로 사전 가공 (useMemo)
  const allLinks = useMemo<RenderLink[]>(() => {
    const yCoord = dimensions.height - AXIS_Y_OFFSET;

    return combinedReferences.flatMap((tuple, index) => {
      const [srcBook, srcCh, srcVs, tgtBook, tgtCh, tgtVs, weight] = tuple;

      if (
        srcBook < 0 ||
        srcBook >= books.length ||
        tgtBook < 0 ||
        tgtBook >= books.length ||
        !verseIndex.books[srcBook] ||
        !verseIndex.books[tgtBook]
      ) {
        return [];
      }
      
      const sourceRef = { bookIndex: srcBook, chapter: srcCh, verse: srcVs };
      const targetRef = { bookIndex: tgtBook, chapter: tgtCh, verse: tgtVs };

      let sourceOffset: number;
      let targetOffset: number;

      try {
        sourceOffset = toGlobalVerseOffset(sourceRef, verseIndex);
        targetOffset = toGlobalVerseOffset(targetRef, verseIndex);
      } catch {
        return [];
      }

      const x0 = xScale(sourceOffset);
      const x1 = xScale(targetOffset);

      // 구약/신약 교차 분류
      const srcTestament = books[srcBook].testament;
      const tgtTestament = books[tgtBook].testament;
      let testamentClass: RenderLink['testamentClass'] = 'OT_TO_OT';

      if (srcTestament === 'OT' && tgtTestament === 'OT') testamentClass = 'OT_TO_OT';
      else if (srcTestament === 'NT' && tgtTestament === 'NT') testamentClass = 'NT_TO_NT';
      else if (srcTestament === 'OT' && tgtTestament === 'NT') testamentClass = 'OT_TO_NT';
      else if (srcTestament === 'NT' && tgtTestament === 'OT') testamentClass = 'NT_TO_OT';

      return [{
        id: index,
        source: sourceRef,
        target: targetRef,
        sourceOffset,
        targetOffset,
        x0,
        y0: yCoord,
        x1,
        y1: yCoord,
        weight,
        testamentClass,
      }];
    });
  }, [combinedReferences, dimensions.height, xScale]);

  // 4. 필터링된 링크만 추출 (Weight 필터 및 testamentClass 필터 적용)
  const filteredLinks = useMemo(() => {
    return allLinks.filter((link) => {
      // 1) Weight 필터
      if (link.weight < minWeight) return false;

      // 2) 신구약 타입 및 동일 책/장 필터
      if (filterType === 'OT_ONLY') {
        return link.testamentClass === 'OT_TO_OT';
      }
      if (filterType === 'NT_ONLY') {
        return link.testamentClass === 'NT_TO_NT';
      }
      if (filterType === 'OT_NT') {
        return link.testamentClass === 'OT_TO_NT' || link.testamentClass === 'NT_TO_OT';
      }
      if (filterType === 'SAME_BOOK') {
        return link.source.bookIndex === link.target.bookIndex;
      }
      if (filterType === 'SAME_CHAPTER') {
        return link.source.bookIndex === link.target.bookIndex && link.source.chapter === link.target.chapter;
      }
      return true;
    });
  }, [allLinks, filterType, minWeight]);

  // 필터링된 연결선 수 변경을 부모 컴포넌트에 통보
  useEffect(() => {
    if (onFilteredCountChange) {
      onFilteredCountChange(filteredLinks.length);
    }
  }, [filteredLinks.length, onFilteredCountChange]);

  // 4-1. 키보드 탐색용 정렬된 링크 리스트 (소스 구절 오프셋 순 오름차순)
  const sortedLinks = useMemo(() => {
    return [...filteredLinks].sort((a, b) => a.sourceOffset - b.sourceOffset);
  }, [filteredLinks]);

  // activeLink로부터 유도된 현재 포커스된 링크 인덱스
  const focusedLinkIndex = useMemo(() => {
    if (!activeLink) return null;
    return sortedLinks.findIndex((link) => link.id === activeLink.id);
  }, [activeLink, sortedLinks]);

  // 검색에 매칭되는 링크 개수 계산
  const searchMatchCount = useMemo(() => {
    if (!searchVerse) return 0;
    return filteredLinks.filter((link) => {
      const isSourceMatch =
        link.source.bookIndex === searchVerse.bookIndex &&
        link.source.chapter === searchVerse.chapter &&
        link.source.verse === searchVerse.verse;
      const isTargetMatch =
        link.target.bookIndex === searchVerse.bookIndex &&
        link.target.chapter === searchVerse.chapter &&
        link.target.verse === searchVerse.verse;
      return isSourceMatch || isTargetMatch;
    }).length;
  }, [filteredLinks, searchVerse]);

  /* eslint-disable react-hooks/set-state-in-effect */
  // 딥링크 복원 (initialPinnedRefs 파싱 후 매칭 링크 복원)
  useEffect(() => {
    if (!initialPinnedRefs) return;

    const { source, target } = initialPinnedRefs;

    // 해당 책들의 세부 정보 비동기 로딩 강제 트리거
    loadBookDetails(source.bookIndex);
    loadBookDetails(target.bookIndex);

    // 병합된 링크 목록에서 매칭되는 구절 링크 탐색
    const foundLink = allLinks.find(link => 
      (link.source.bookIndex === source.bookIndex && link.source.chapter === source.chapter && link.source.verse === source.verse &&
       link.target.bookIndex === target.bookIndex && link.target.chapter === target.chapter && link.target.verse === target.verse) ||
      (link.source.bookIndex === target.bookIndex && link.source.chapter === target.chapter && link.target.verse === target.verse &&
       link.target.bookIndex === source.bookIndex && link.target.chapter === source.chapter && link.target.verse === source.verse)
    );

    if (foundLink) {
      setPinnedLink(foundLink);
      setActiveLink(foundLink);
      setInitialPinnedRefs(null); // 복원 성공했으므로 초기화
    }
  }, [allLinks, initialPinnedRefs, loadBookDetails, setActiveLink, setInitialPinnedRefs, setPinnedLink]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const getTargetDpr = useCallback(() => {
    const dpr = window.devicePixelRatio || 1;
    const isMobile = dimensions.width < 768;
    return isMobile ? Math.min(1.5, dpr) : dpr;
  }, [dimensions.width]);

  const getBookIndexAtCoordinates = useCallback((x: number, y: number) => {
    const axisY = dimensions.height - AXIS_Y_OFFSET;
    if (y < axisY - 10 || y > axisY + 30) return null;

    const invX = invertZoom(x);

    return verseIndex.books.findIndex((bookMeta) => {
      const startX = xScale(bookMeta.startVerseOffset);
      const endX = xScale(bookMeta.startVerseOffset + bookMeta.verseCount);
      return invX >= startX && invX <= endX;
    });
  }, [dimensions.height, xScale, invertZoom]);

  const drawStaticLayer = useCallback((ctx: CanvasContext2D, isMobile: boolean) => {
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    const axisY = dimensions.height - AXIS_Y_OFFSET;
    const currentSearchVerse = searchVerse;
    const hasSearch = currentSearchVerse !== null;

    // 5-1. 성경 66권 축 및 경계 렌더링 (줌 좌표계 반영)
    books.forEach((book, i) => {
      const bookMeta = verseIndex.books[i];
      const startX = xScale(bookMeta.startVerseOffset);
      const endX = xScale(bookMeta.startVerseOffset + bookMeta.verseCount);
      
      const zoomedStartX = applyZoom(startX);
      const zoomedEndX = applyZoom(endX);
      const width = zoomedEndX - zoomedStartX;

      // 구약과 신약의 테마 컬러 설정 (Tailwind 브랜드 색상과 매핑)
      const isOT = book.testament === 'OT';
      const color = isOT ? 'rgba(59, 130, 246, 0.4)' : 'rgba(236, 72, 153, 0.4)';
      const hoverColor = isOT ? 'rgba(59, 130, 246, 0.7)' : 'rgba(236, 72, 153, 0.7)';
      const isBookHovered = hoveredBookIndex === i;

      // 바(Bar) 렌더링
      ctx.fillStyle = isBookHovered ? hoverColor : color;
      ctx.fillRect(zoomedStartX, axisY, width, 12);

      // 경계 수직선
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(zoomedStartX, axisY);
      ctx.lineTo(zoomedStartX, axisY + 25);
      ctx.stroke();

      // 텍스트 라벨 (간격을 두고 겹치지 않게 표시하되, 줌 상태에선 겹침 해제)
      const textWidth = ctx.measureText(book.ko).width;
      const skipLabel = zoomLevel > 1.5 
        ? false 
        : isMobile 
        ? (i % 6 !== 0) 
        : (i % 3 !== 0);

      if (width > textWidth + 4 || (!skipLabel && width > 10)) {
        ctx.fillStyle = isBookHovered ? '#ffffff' : 'rgba(156, 163, 175, 0.7)';
        ctx.font = isMobile ? '8px sans-serif' : '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(book.ko, zoomedStartX + width / 2, axisY + 26);
      }
    });

    // 5-1-2. 줌 수준별 다이내믹 세부 눈금(LOD Ticks) 렌더링
    if (zoomLevel >= 4.0) {
      books.forEach((book, i) => {
        const bookMeta = verseIndex.books[i];
        
        // 현재 화면 범위(Viewport) 계산
        const bookStartX = applyZoom(xScale(bookMeta.startVerseOffset));
        const bookEndX = applyZoom(xScale(bookMeta.startVerseOffset + bookMeta.verseCount));
        
        // 책 전체가 화면 밖에 있으면 연산 스킵
        if (bookEndX < -50 || bookStartX > dimensions.width + 50) return;

        let accumOffset = bookMeta.startVerseOffset;

        bookMeta.chapterVerseCounts.forEach((verseCount, c) => {
          const chX = applyZoom(xScale(accumOffset));
          
          // 1) 장(Chapter) 구분선 및 라벨 그리기
          if (chX >= -50 && chX <= dimensions.width + 50) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(chX, axisY + 12);
            ctx.lineTo(chX, axisY + 20);
            ctx.stroke();

            // 장 라벨 (줌 수준에 따라 노출 간격 조율)
            const chapterInterval = zoomLevel >= 25.0 ? 1 : zoomLevel >= 12.0 ? 2 : 5;
            const isLabelTick = (c + 1) === 1 || (c + 1) % chapterInterval === 0;

            if (isLabelTick && zoomLevel < 20.0) {
              ctx.fillStyle = 'rgba(203, 213, 225, 0.6)';
              ctx.font = 'bold 8px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText(`${c + 1}장`, chX, axisY + 30);
            }
          }

          // 2) 극대 줌 상태(zoomLevel >= 20.0)에서의 절(Verse) 눈금 및 상세 라벨 그리기
          if (zoomLevel >= 20.0) {
            const step = zoomLevel >= 45.0 ? 1 : zoomLevel >= 30.0 ? 2 : 5;

            for (let v = 0; v < verseCount; v++) {
              if (v === 0) continue; // 장 눈금과 겹치므로 통과

              const vsOffset = accumOffset + v;
              const vsX = applyZoom(xScale(vsOffset));

              if (vsX >= -50 && vsX <= dimensions.width + 50) {
                // 절 미세 눈금 틱
                ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(vsX, axisY + 12);
                ctx.lineTo(vsX, axisY + 18);
                ctx.stroke();

                // 절 라벨 렌더링
                if ((v + 1) % step === 0) {
                  ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
                  ctx.font = '7px monospace';
                  ctx.textAlign = 'center';
                  ctx.fillText(`${book.id} ${c + 1}:${v + 1}`, vsX, axisY + 28);
                }
              }
            }
          }

          accumOffset += verseCount;
        });
      });
    }

    // 5-2. 기본 백그라운드 네트워크 곡선 그리기 (faint alpha, no glow)
    ctx.shadowBlur = 0; // 최적화: glow 제거
    ctx.lineWidth = isMobile ? 0.5 : 0.75;

    filteredLinks.forEach((link) => {
      // 검색 상태일 때 해당 링크가 검색 구절에 매칭되는지 확인
      const isSourceMatch = hasSearch &&
        link.source.bookIndex === currentSearchVerse.bookIndex &&
        link.source.chapter === currentSearchVerse.chapter &&
        link.source.verse === currentSearchVerse.verse;
      const isTargetMatch = hasSearch &&
        link.target.bookIndex === currentSearchVerse.bookIndex &&
        link.target.chapter === currentSearchVerse.chapter &&
        link.target.verse === currentSearchVerse.verse;

      if (isSourceMatch || isTargetMatch) {
        // 매칭된 검색 결과 링크는 아래 하이라이트 패스에서 덧그림
        return;
      }

      // 구신약별 곡선 컬러 (검색 활성화 상태라면 비매칭 선들을 어둡게 Dimming)
      const strokeColor = hasSearch
        ? 'rgba(255, 255, 255, 0.015)' // 극도의 Dimming
        : link.testamentClass === 'OT_TO_OT'
        ? 'rgba(59, 130, 246, 0.08)'
        : link.testamentClass === 'NT_TO_NT'
        ? 'rgba(236, 72, 153, 0.08)'
        : 'rgba(16, 185, 129, 0.12)';

      ctx.strokeStyle = strokeColor;
      drawBezierPath(ctx, link, applyZoom);
    });

    // 5-2-2. 검색 매칭 링크 하이라이트 덧그리기 (Glow 적용)
    if (hasSearch) {
      filteredLinks.forEach((link) => {
        const isSourceMatch =
          link.source.bookIndex === currentSearchVerse.bookIndex &&
          link.source.chapter === currentSearchVerse.chapter &&
          link.source.verse === currentSearchVerse.verse;
        const isTargetMatch =
          link.target.bookIndex === currentSearchVerse.bookIndex &&
          link.target.chapter === currentSearchVerse.chapter &&
          link.target.verse === currentSearchVerse.verse;

        if (!isSourceMatch && !isTargetMatch) return;

        ctx.save();
        // Glow 효과와 선명한 에메랄드 그린선
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#10b981';
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = isMobile ? 1.2 : 1.8;
        drawBezierPath(ctx, link, applyZoom);

        // 양 앵커에 작은 점 표시
        ctx.fillStyle = '#10b981';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(applyZoom(link.x0), link.y0, 2.5, 0, Math.PI * 2);
        ctx.arc(applyZoom(link.x1), link.y1, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }
  }, [dimensions.height, dimensions.width, filteredLinks, hoveredBookIndex, searchVerse, xScale, applyZoom, zoomLevel]);

  /* eslint-disable react-hooks/set-state-in-effect */
  // 5. OffscreenCanvas 우선 백버퍼에 정적 배경 네트워크를 캐싱한다.
  useEffect(() => {
    const targetDpr = getTargetDpr();
    const physicalWidth = Math.floor(dimensions.width * targetDpr);
    const physicalHeight = Math.floor(dimensions.height * targetDpr);
    const backgroundLayer = createCanvasBuffer(physicalWidth, physicalHeight);
    const backgroundCtx = backgroundLayer.getContext('2d') as CanvasContext2D | null;

    if (!backgroundCtx) return;

    backgroundCtx.setTransform(targetDpr, 0, 0, targetDpr, 0, 0);
    drawStaticLayer(backgroundCtx, dimensions.width < 768);
    backgroundLayerRef.current = backgroundLayer;
    setBackgroundVersion((version) => version + 1);
  }, [dimensions, drawStaticLayer, getTargetDpr, zoomLevel, offsetX]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // 5-1. foreground 캔버스는 캐시된 배경을 복사하고 active/pinned 링크만 덧그린다.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const targetDpr = getTargetDpr();
    canvas.width = Math.floor(dimensions.width * targetDpr);
    canvas.height = Math.floor(dimensions.height * targetDpr);
    ctx.setTransform(targetDpr, 0, 0, targetDpr, 0, 0);
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    if (backgroundLayerRef.current) {
      ctx.drawImage(
        backgroundLayerRef.current as CanvasImageSource,
        0,
        0,
        dimensions.width,
        dimensions.height
      );
    }

    // 5-2. 임시 호버선(tempHoveredLink) 은은하고 투명한 녹색 가이드선 렌더링 (PC 마우스 오버 힌트)
    if (tempHoveredLink && (!pinnedLink || pinnedLink.id !== tempHoveredLink.id)) {
      ctx.save();
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)'; // 은은하고 투명한 에메랄드 그린
      ctx.lineWidth = 1.5;
      drawBezierPath(ctx, tempHoveredLink, applyZoom);

      // 소스 및 타겟에 작고 귀여운 앵커 점
      ctx.fillStyle = 'rgba(16, 185, 129, 0.6)';
      ctx.beginPath();
      ctx.arc(applyZoom(tempHoveredLink.x0), tempHoveredLink.y0, 3.5, 0, Math.PI * 2);
      ctx.arc(applyZoom(tempHoveredLink.x1), tempHoveredLink.y1, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 5-3. 활성화된 단 하나의 링크(Active Link)만 강력하게 강조하여 덧그리기 (Glow 적용)
    if (activeLink && (!pinnedLink || pinnedLink.id !== activeLink.id)) {
      // 1) Glow 효과를 위한 굵은 섀도우선
      ctx.save();
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#10b981';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      drawBezierPath(ctx, activeLink, applyZoom);

      // 2) 소스 및 타겟 앵커 서클 렌더링
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(applyZoom(activeLink.x0), activeLink.y0, 6, 0, Math.PI * 2);
      ctx.arc(applyZoom(activeLink.x1), activeLink.y1, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 앵커 텍스트 표시
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      
      const srcBookName = books[activeLink.source.bookIndex].ko;
      const tgtBookName = books[activeLink.target.bookIndex].ko;
      
      ctx.fillText(
        `${srcBookName} ${activeLink.source.chapter}:${activeLink.source.verse}`,
        applyZoom(activeLink.x0),
        activeLink.y0 - 12
      );
      ctx.fillText(
        `${tgtBookName} ${activeLink.target.chapter}:${activeLink.target.verse}`,
        applyZoom(activeLink.x1),
        activeLink.y1 - 12
      );
    }

    // 5-4. 고정된 링크(Pinned Link) 렌더링 (골드/오렌지 네온 하이라이트)
    if (pinnedLink) {
      // 1) 골드 Glow 효과를 위한 굵은 섀도우선
      ctx.save();
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#f59e0b';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3.5;
      drawBezierPath(ctx, pinnedLink, applyZoom);

      // 2) 소스 및 타겟 앵커 서클 렌더링
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(applyZoom(pinnedLink.x0), pinnedLink.y0, 7, 0, Math.PI * 2);
      ctx.arc(applyZoom(pinnedLink.x1), pinnedLink.y1, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 3) 앵커 텍스트 표시
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      
      const srcBookName = books[pinnedLink.source.bookIndex].ko;
      const tgtBookName = books[pinnedLink.target.bookIndex].ko;
      
      ctx.fillText(
        `📌 ${srcBookName} ${pinnedLink.source.chapter}:${pinnedLink.source.verse}`,
        applyZoom(pinnedLink.x0),
        pinnedLink.y0 - 15
      );
      ctx.fillText(
        `📌 ${tgtBookName} ${pinnedLink.target.chapter}:${pinnedLink.target.verse}`,
        applyZoom(pinnedLink.x1),
        pinnedLink.y1 - 15
      );
    }
  }, [activeLink, backgroundVersion, dimensions, getTargetDpr, pinnedLink, applyZoom, tempHoveredLink]);

  // 6. 120ms 호버 디바운스 기반 pointermove 좌표 감지 연산 (인터랙션 요동 떨림 방지)
  const updateActiveLinkAtCoordinates = (x: number, y: number, isTouchEvent: boolean = false) => {
    mouseRef.current = { x, y };

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (!mouseRef.current) return;

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const hoveredBook = getBookIndexAtCoordinates(mx, my);
      const nextHoveredBookIndex = hoveredBook === -1 ? null : hoveredBook;

      setHoveredBookIndex(nextHoveredBookIndex);
      if (nextHoveredBookIndex !== null) {
        loadBookDetails(nextHoveredBookIndex);
      }

      let foundActiveLink: RenderLink | null = null;
      const isMobile = dimensions.width < 768;
      let minDistance = isMobile ? 18 : 10; // 모바일 터치 히트 반경 18px 확장

      filteredLinks.forEach((link) => {
        const zx0 = applyZoom(link.x0);
        const zx1 = applyZoom(link.x1);
        const h = getBezierHeight(zx0, zx1);
        const cp1x = zx0;
        const cp1y = link.y0 - h;
        const cp2x = zx1;
        const cp2y = link.y1 - h;

        // 마우스 포인트와 곡선 최단거리 계산
        const dist = distanceToBezier(
          mx,
          my,
          zx0,
          link.y0,
          cp1x,
          cp1y,
          cp2x,
          cp2y,
          zx1,
          link.y1
        );

        if (dist < minDistance) {
          minDistance = dist;
          foundActiveLink = link;
        }
      });

      // 마우스 무브(isTouchEvent = false) 시에는 activeLink를 직접 세팅하지 않고,
      // 오직 아주 은은한 tempHoveredLink 가이드 상태만 노출하여 텍스트 번쩍임 피로를 제거합니다.
      // 터치 무브(isTouchEvent = true) 시에만 실시간으로 상세 카드를 띄워 모바일 접근성을 수호합니다.
      if (isTouchEvent) {
        if (foundActiveLink !== activeLink) {
          setActiveLink(foundActiveLink);
        }
      } else {
        if (foundActiveLink !== tempHoveredLink) {
          setTempHoveredLink(foundActiveLink);
        }
      }
    }, 120); // 120ms 디바운스 타임
  };

  // 마우스 드래그 팬(Pan) 조작 결합
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (zoomLevel > 1.0) {
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      lastOffsetXRef.current = offsetX;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDragging && dragStartRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const newOffset = lastOffsetXRef.current + dx;
      setOffsetX(clampOffsetX(newOffset, zoomLevel));
    } else {
      updateActiveLinkAtCoordinates(x, y, false);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    dragStartRef.current = null;

    mouseRef.current = null;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (rAFRef.current) {
      cancelAnimationFrame(rAFRef.current);
      rAFRef.current = null;
    }
    setHoveredBookIndex(null);
    setTempHoveredLink(null);
    setActiveLink(null);
  };

  // 7. 모바일 터치 이벤트 감지 구현 (드래그 스와이프 팬 및 핀치 줌)
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastTouchDistanceRef.current = dist;
    } else if (e.touches.length === 1 && zoomLevel > 1.0) {
      if (e.cancelable) e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      lastOffsetXRef.current = offsetX;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (e.touches.length === 2 && lastTouchDistanceRef.current !== null) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / lastTouchDistanceRef.current;
      lastTouchDistanceRef.current = dist;

      const nextZoom = Math.max(1.0, Math.min(80.0, zoomLevel * ratio));
      if (nextZoom !== zoomLevel) {
        setZoomLevel(nextZoom);
        setOffsetX((prev) => clampOffsetX(prev, nextZoom));
      }
    } else if (e.touches.length === 1 && isDragging && dragStartRef.current) {
      if (e.cancelable) e.preventDefault();
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const newOffset = lastOffsetXRef.current + dx;
      setOffsetX(clampOffsetX(newOffset, zoomLevel));
    } else if (e.touches.length === 1 && !isDragging) {
      const rect = canvas.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;
      updateActiveLinkAtCoordinates(x, y, true);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    dragStartRef.current = null;
    lastTouchDistanceRef.current = null;
  };

  // 7-1. 클릭(Click/Tap) 기반 고정(Pin) 상태 바인딩 (PC 마우스에선 오직 클릭 시에만 카드를 띄움)
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 만약 드래그가 방금 끝났다면 핀 클릭을 무시해 오작동 방지
    if (dragStartRef.current && Math.abs(e.clientX - dragStartRef.current.x) > 3) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let foundLink: RenderLink | null = null;
    const isMobile = dimensions.width < 768;
    let minDistance = isMobile ? 18 : 10;

    filteredLinks.forEach((link) => {
      const zx0 = applyZoom(link.x0);
      const zx1 = applyZoom(link.x1);
      const h = getBezierHeight(zx0, zx1);
      const cp1x = zx0;
      const cp1y = link.y0 - h;
      const cp2x = zx1;
      const cp2y = link.y1 - h;

      const dist = distanceToBezier(
        x,
        y,
        zx0,
        link.y0,
        cp1x,
        cp1y,
        cp2x,
        cp2y,
        zx1,
        link.y1
      );

      if (dist < minDistance) {
        minDistance = dist;
        foundLink = link;
      }
    });

    if (foundLink) {
      setPinnedLink(foundLink);
      setActiveLink(foundLink); // 클릭 시 activeLink도 확실히 동시 설정하여 상세 카드 강제 노출
    } else {
      setPinnedLink(null);
      setActiveLink(null); // 빈 영역 클릭 시 카드도 강제 초기화
    }
  };

  // 8. 키보드 탐색(Accessibility)을 위한 KeyDown 핸들러
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (sortedLinks.length === 0) return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = focusedLinkIndex === null ? 0 : (focusedLinkIndex + 1) % sortedLinks.length;
      setActiveLink(sortedLinks[nextIdx]);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIdx = focusedLinkIndex === null ? sortedLinks.length - 1 : (focusedLinkIndex - 1 + sortedLinks.length) % sortedLinks.length;
      setActiveLink(sortedLinks[prevIdx]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setActiveLink(null);
      if (containerRef.current) {
        containerRef.current.blur();
      }
    }
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onKeyDown={handleKeyDown}
      className="relative w-full h-[320px] sm:h-[400px] md:h-[460px] bg-[#070b16] rounded-2xl overflow-hidden border border-slate-800/50 focus-within:ring-2 focus-within:ring-emerald-500/80 focus-within:border-transparent transition-all duration-300 shadow-2xl shadow-black/80 outline-none"
    >
      {/* 캔버스 요소 */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleCanvasClick}
        style={{ 
          width: '100%', 
          height: '100%',
          cursor: isDragging ? 'grabbing' : zoomLevel > 1.0 ? 'grab' : tempHoveredLink ? 'pointer' : 'default'
        }}
        className="block w-full h-full"
      />

      {/* 키보드 탐색 팁 오버레이 (Premium UI 힌트) */}
      <div className={`absolute bottom-3 left-4 text-[10px] sm:text-xs px-2.5 py-1 rounded-md transition-all duration-300 font-medium select-none pointer-events-none ${
        isFocused 
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
          : 'bg-slate-900/40 text-slate-400 border border-slate-800/40'
      }`}>
        {isFocused 
          ? '방향키(← →) 또는 Tab으로 교차 참조를 순회할 수 있습니다.' 
          : 'Canvas를 클릭하거나 Tab 키를 누르면 키보드로 탐색할 수 있습니다.'
        }
      </div>

      {/* 검색 집중 탐색 모드 프리미엄 배지 */}
      {searchVerse && (
        <div className="absolute top-3 left-4 flex items-center gap-2 bg-[#070b16]/85 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-bold shadow-lg backdrop-blur-md transition-all select-none">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
          🔍 {books[searchVerse.bookIndex].ko} {searchVerse.chapter}:{searchVerse.verse} 집중 탐색 ({searchMatchCount}개 참조)
        </div>
      )}

      {/* LOD 비동기 데이터 로딩 인디케이터 (Premium UI 요소) */}
      {isLoadingDetails && (
        <div className="absolute top-3 right-4 flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/35 px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-semibold animate-pulse shadow-lg backdrop-blur-md select-none">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
          세부 참조망 동적 병합 중...
        </div>
      )}

      {/* 프리미엄 플로팅 줌 컨트롤러 패널 */}
      <div className="absolute bottom-3 right-4 flex items-center gap-1.5 bg-[#070b16]/75 border border-slate-850/80 rounded-xl p-1 px-2 shadow-2xl backdrop-blur-md transition-all select-none">
        <button
          onClick={() => {
            const nextZoom = Math.min(80.0, zoomLevel * 1.25);
            setZoomLevel(nextZoom);
            setOffsetX(clampOffsetX(offsetX, nextZoom));
          }}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-900/80 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 border border-slate-800/80 transition-all font-bold text-sm shadow hover:scale-105 active:scale-95"
          title="확대"
        >
          ＋
        </button>
        <button
          onClick={() => {
            const nextZoom = Math.max(1.0, zoomLevel / 1.25);
            setZoomLevel(nextZoom);
            setOffsetX(clampOffsetX(offsetX, nextZoom));
          }}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-900/80 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 border border-slate-800/80 transition-all font-bold text-sm shadow hover:scale-105 active:scale-95"
          title="축소"
        >
          －
        </button>
        <button
          onClick={() => {
            setZoomLevel(1.0);
            setOffsetX(0);
          }}
          className="px-2 h-7 flex items-center justify-center rounded-lg bg-slate-900/80 hover:bg-emerald-500/20 text-[10px] text-slate-400 hover:text-emerald-400 border border-slate-800/80 transition-all font-bold tracking-tighter shadow hover:scale-105 active:scale-95"
          title="1:1 비율 리셋"
        >
          RESET
        </button>
        {zoomLevel > 1.0 && (
          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded ml-1 transition-all">
            {zoomLevel.toFixed(1)}x
          </span>
        )}
      </div>
    </div>
  );
};

