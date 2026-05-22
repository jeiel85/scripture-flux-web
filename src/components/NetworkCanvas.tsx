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
  filterType: 'ALL' | 'OT_ONLY' | 'NT_ONLY' | 'OT_NT';
  minWeight: number;
  searchVerse: VerseRef | null;
  initialPinnedRefs: { source: VerseRef; target: VerseRef } | null;
  setInitialPinnedRefs: (refs: { source: VerseRef; target: VerseRef } | null) => void;
}

const PADDING_X = 60;
const AXIS_Y_OFFSET = 80; // 하단 여백 (축 렌더링 공간)

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
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 600 });
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const rAFRef = useRef<number | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 0. 접근성 및 키보드 상태 선언
  const [isFocused, setIsFocused] = useState(false);

  // LOD(Level of Detail) 2단계 레이지 로딩 상태
  const [initialLinks, setInitialLinks] = useState<number[][]>([]);
  const [detailedLinks, setDetailedLinks] = useState<number[][]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const loadedBooksRef = useRef<Set<number>>(new Set());
  const loadingBooksRef = useRef<Set<number>>(new Set());

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

    return combinedReferences.map((tuple, index) => {
      const [srcBook, srcCh, srcVs, tgtBook, tgtCh, tgtVs, weight] = tuple;
      
      const sourceRef = { bookIndex: srcBook, chapter: srcCh, verse: srcVs };
      const targetRef = { bookIndex: tgtBook, chapter: tgtCh, verse: tgtVs };

      const sourceOffset = toGlobalVerseOffset(sourceRef, verseIndex);
      const targetOffset = toGlobalVerseOffset(targetRef, verseIndex);

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

      return {
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
      };
    });
  }, [combinedReferences, dimensions.height, xScale]);

  // 4. 필터링된 링크만 추출 (Weight 필터 및 testamentClass 필터 적용)
  const filteredLinks = useMemo(() => {
    return allLinks.filter((link) => {
      // 1) Weight 필터
      if (link.weight < minWeight) return false;

      // 2) 신구약 타입 필터
      if (filterType === 'OT_ONLY') {
        return link.testamentClass === 'OT_TO_OT';
      }
      if (filterType === 'NT_ONLY') {
        return link.testamentClass === 'NT_TO_NT';
      }
      if (filterType === 'OT_NT') {
        return link.testamentClass === 'OT_TO_NT' || link.testamentClass === 'NT_TO_OT';
      }
      return true;
    });
  }, [allLinks, filterType, minWeight]);

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

  // 5. Canvas 고해상도 렌더링 & 애니메이션 루프
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const isMobile = dimensions.width < 768;
    const targetDpr = isMobile ? Math.min(1.5, dpr) : dpr;

    canvas.width = dimensions.width * targetDpr;
    canvas.height = dimensions.height * targetDpr;
    ctx.scale(targetDpr, targetDpr);

    const draw = () => {
      // 캔버스 초기화
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      const axisY = dimensions.height - AXIS_Y_OFFSET;

      // 5-1. 성경 66권 축 및 경계 렌더링
      books.forEach((book, i) => {
        const bookMeta = verseIndex.books[i];
        const startX = xScale(bookMeta.startVerseOffset);
        const endX = xScale(bookMeta.startVerseOffset + bookMeta.verseCount);
        const width = endX - startX;

        // 구약과 신약의 테마 컬러 설정 (Tailwind 브랜드 색상과 매핑)
        const isOT = book.testament === 'OT';
        const color = isOT ? 'rgba(59, 130, 246, 0.4)' : 'rgba(236, 72, 153, 0.4)';
        const hoverColor = isOT ? 'rgba(59, 130, 246, 0.7)' : 'rgba(236, 72, 153, 0.7)';

        // Hover 책 판단 및 동적 레이지 로드 트리거
        let isBookHovered = false;
        if (mouseRef.current) {
          const { x, y } = mouseRef.current;
          if (x >= startX && x <= endX && y >= axisY - 10 && y <= axisY + 30) {
            isBookHovered = true;
            // 캔버스 내 책 영역에 마우스가 호버되면 즉시 해당 책의 세부 참조 페치
            loadBookDetails(i);
          }
        }

        // 바(Bar) 렌더링
        ctx.fillStyle = isBookHovered ? hoverColor : color;
        ctx.fillRect(startX, axisY, width, 12);

        // 경계 수직선
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(startX, axisY);
        ctx.lineTo(startX, axisY + 25);
        ctx.stroke();

        // 텍스트 라벨 (간격을 두고 겹치지 않게 표시하거나 크기에 맞춰 렌더링)
        const textWidth = ctx.measureText(book.ko).width;
        const skipLabel = isMobile ? (i % 6 === 0) : (i % 3 === 0);

        if (width > textWidth + 4 || (skipLabel && width > 10)) {
          ctx.fillStyle = isBookHovered ? '#ffffff' : 'rgba(156, 163, 175, 0.7)';
          ctx.font = isMobile ? '8px sans-serif' : '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(book.ko, startX + width / 2, axisY + 26);
        }
      });

      // 5-2. 기본 백그라운드 네트워크 곡선 그리기 (faint alpha, no glow)
      ctx.shadowBlur = 0; // 최적화: glow 제거
      ctx.lineWidth = isMobile ? 0.5 : 0.75;
      
      const hasSearch = !!searchVerse;

      filteredLinks.forEach((link) => {
        // Active Link 및 Pinned Link는 나중에 위에 덧그릴 것이므로 스킵
        if (activeLink && activeLink.id === link.id) return;
        if (pinnedLink && pinnedLink.id === link.id) return;

        // 검색 상태일 때 해당 링크가 검색 구절에 매칭되는지 확인
        const isSourceMatch = hasSearch && 
          link.source.bookIndex === searchVerse.bookIndex && 
          link.source.chapter === searchVerse.chapter && 
          link.source.verse === searchVerse.verse;
        const isTargetMatch = hasSearch && 
          link.target.bookIndex === searchVerse.bookIndex && 
          link.target.chapter === searchVerse.chapter && 
          link.target.verse === searchVerse.verse;
        
        if (isSourceMatch || isTargetMatch) {
          // 매칭된 검색 결과 링크는 나중에 하이라이트로 덧그리기 위해 패스
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

        const h = getBezierHeight(link.x0, link.x1);
        const cp1x = link.x0;
        const cp1y = link.y0 - h;
        const cp2x = link.x1;
        const cp2y = link.y1 - h;

        ctx.beginPath();
        ctx.moveTo(link.x0, link.y0);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, link.x1, link.y1);
        ctx.stroke();
      });

      // 5-2-2. 검색 매칭 링크 하이라이트 덧그리기 (Glow 적용)
      if (hasSearch) {
        filteredLinks.forEach((link) => {
          if (activeLink && activeLink.id === link.id) return;
          if (pinnedLink && pinnedLink.id === link.id) return;

          const isSourceMatch = 
            link.source.bookIndex === searchVerse.bookIndex && 
            link.source.chapter === searchVerse.chapter && 
            link.source.verse === searchVerse.verse;
          const isTargetMatch = 
            link.target.bookIndex === searchVerse.bookIndex && 
            link.target.chapter === searchVerse.chapter && 
            link.target.verse === searchVerse.verse;
          
          if (!isSourceMatch && !isTargetMatch) return;

          const h = getBezierHeight(link.x0, link.x1);
          const cp1x = link.x0;
          const cp1y = link.y0 - h;
          const cp2x = link.x1;
          const cp2y = link.y1 - h;

          ctx.save();
          // Glow 효과와 선명한 에메랄드 그린선
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#10b981';
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = isMobile ? 1.2 : 1.8;

          ctx.beginPath();
          ctx.moveTo(link.x0, link.y0);
          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, link.x1, link.y1);
          ctx.stroke();

          // 양 앵커에 작은 점 표시
          ctx.fillStyle = '#10b981';
          ctx.shadowBlur = 5;
          ctx.beginPath();
          ctx.arc(link.x0, link.y0, 2.5, 0, Math.PI * 2);
          ctx.arc(link.x1, link.y1, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }

      // 5-3. 활성화된 단 하나의 링크(Active Link)만 강력하게 강조하여 덧그리기 (Glow 적용)
      if (activeLink && (!pinnedLink || pinnedLink.id !== activeLink.id)) {
        const h = getBezierHeight(activeLink.x0, activeLink.x1);
        const cp1x = activeLink.x0;
        const cp1y = activeLink.y0 - h;
        const cp2x = activeLink.x1;
        const cp2y = activeLink.y1 - h;

        // 1) Glow 효과를 위한 굵은 섀도우선
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#10b981';
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(activeLink.x0, activeLink.y0);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, activeLink.x1, activeLink.y1);
        ctx.stroke();

        // 2) 소스 및 타겟 앵커 서클 렌더링
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(activeLink.x0, activeLink.y0, 6, 0, Math.PI * 2);
        ctx.arc(activeLink.x1, activeLink.y1, 6, 0, Math.PI * 2);
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
          activeLink.x0,
          activeLink.y0 - 12
        );
        ctx.fillText(
          `${tgtBookName} ${activeLink.target.chapter}:${activeLink.target.verse}`,
          activeLink.x1,
          activeLink.y1 - 12
        );
      }

      // 5-4. 고정된 링크(Pinned Link) 렌더링 (골드/오렌지 네온 하이라이트)
      if (pinnedLink) {
        const h = getBezierHeight(pinnedLink.x0, pinnedLink.x1);
        const cp1x = pinnedLink.x0;
        const cp1y = pinnedLink.y0 - h;
        const cp2x = pinnedLink.x1;
        const cp2y = pinnedLink.y1 - h;

        // 1) 골드 Glow 효과를 위한 굵은 섀도우선
        ctx.save();
        ctx.shadowBlur = 18;
        ctx.shadowColor = '#f59e0b';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(pinnedLink.x0, pinnedLink.y0);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, pinnedLink.x1, pinnedLink.y1);
        ctx.stroke();

        // 2) 소스 및 타겟 앵커 서클 렌더링
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(pinnedLink.x0, pinnedLink.y0, 7, 0, Math.PI * 2);
        ctx.arc(pinnedLink.x1, pinnedLink.y1, 7, 0, Math.PI * 2);
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
          pinnedLink.x0,
          pinnedLink.y0 - 15
        );
        ctx.fillText(
          `📌 ${tgtBookName} ${pinnedLink.target.chapter}:${pinnedLink.target.verse}`,
          pinnedLink.x1,
          pinnedLink.y1 - 15
        );
      }
    };

    draw();
  }, [activeLink, dimensions, filteredLinks, loadBookDetails, pinnedLink, searchVerse, xScale]);

  // 6. 120ms 호버 디바운스 기반 pointermove 좌표 감지 연산 (인터랙션 요동 떨림 방지)
  const updateActiveLinkAtCoordinates = (x: number, y: number) => {
    mouseRef.current = { x, y };

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (!mouseRef.current) return;

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      let foundActiveLink: RenderLink | null = null;
      const isMobile = dimensions.width < 768;
      let minDistance = isMobile ? 18 : 10; // 모바일 터치 히트 반경 18px 확장

      filteredLinks.forEach((link) => {
        const h = getBezierHeight(link.x0, link.x1);
        const cp1x = link.x0;
        const cp1y = link.y0 - h;
        const cp2x = link.x1;
        const cp2y = link.y1 - h;

        // 마우스 포인트와 곡선 최단거리 계산
        const dist = distanceToBezier(
          mx,
          my,
          link.x0,
          link.y0,
          cp1x,
          cp1y,
          cp2x,
          cp2y,
          link.x1,
          link.y1
        );

        if (dist < minDistance) {
          minDistance = dist;
          foundActiveLink = link;
        }
      });

      if (foundActiveLink !== activeLink) {
        setActiveLink(foundActiveLink);
      }
    }, 120); // 120ms 디바운스 타임
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    updateActiveLinkAtCoordinates(x, y);
  };

  // 7. 모바일 터치 이벤트 감지 구현
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || e.touches.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;

    updateActiveLinkAtCoordinates(x, y);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    // 터치 스크롤 방지하여 캔버스 내 조작에 우선권 부여
    if (e.cancelable) {
      e.preventDefault();
    }
    handleTouchMove(e);
  };

  const handleMouseLeave = () => {
    mouseRef.current = null;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (rAFRef.current) {
      cancelAnimationFrame(rAFRef.current);
      rAFRef.current = null;
    }
    setActiveLink(null);
  };

  // 7-1. 클릭(Click/Tap) 기반 고정(Pin) 상태 바인딩
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let foundLink: RenderLink | null = null;
    const isMobile = dimensions.width < 768;
    let minDistance = isMobile ? 18 : 10;

    filteredLinks.forEach((link) => {
      const h = getBezierHeight(link.x0, link.x1);
      const cp1x = link.x0;
      const cp1y = link.y0 - h;
      const cp2x = link.x1;
      const cp2y = link.y1 - h;

      const dist = distanceToBezier(
        x,
        y,
        link.x0,
        link.y0,
        cp1x,
        cp1y,
        cp2x,
        cp2y,
        link.x1,
        link.y1
      );

      if (dist < minDistance) {
        minDistance = dist;
        foundLink = link;
      }
    });

    if (foundLink) {
      setPinnedLink(foundLink);
      setActiveLink(foundLink);
    } else {
      setPinnedLink(null);
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
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseLeave}
        onClick={handleCanvasClick}
        style={{ width: '100%', height: '100%' }}
        className="block cursor-pointer w-full h-full"
      />

      {/* 키보드 탐색 팁 오버레이 (Premium UI 힌트) */}
      <div className={`absolute bottom-3 left-4 text-[10px] sm:text-xs px-2.5 py-1 rounded-md transition-all duration-300 font-medium ${
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
        <div className="absolute top-3 left-4 flex items-center gap-2 bg-[#070b16]/85 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-bold shadow-lg backdrop-blur-md transition-all">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
          🔍 {books[searchVerse.bookIndex].ko} {searchVerse.chapter}:{searchVerse.verse} 집중 탐색 ({searchMatchCount}개 참조)
        </div>
      )}

      {/* LOD 비동기 데이터 로딩 인디케이터 (Premium UI 요소) */}
      {isLoadingDetails && (
        <div className="absolute top-3 right-4 flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/35 px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-semibold animate-pulse shadow-lg backdrop-blur-md">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
          세부 참조망 동적 병합 중...
        </div>
      )}
    </div>
  );
};
