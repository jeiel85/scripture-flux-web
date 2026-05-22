import React, { useRef, useEffect, useState, useMemo } from 'react';
import { scaleLinear } from 'd3-scale';
import books from '../data/books.json';
import verseIndex from '../data/verse-index.json';
import rawCrossReferences from '../data/cross-references.json';
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
  filterType: 'ALL' | 'OT_ONLY' | 'NT_ONLY' | 'OT_NT';
}

const PADDING_X = 60;
const AXIS_Y_OFFSET = 80; // 하단 여백 (축 렌더링 공간)

export const NetworkCanvas: React.FC<NetworkCanvasProps> = ({
  activeLink,
  setActiveLink,
  filterType,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 600 });
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const rAFRef = useRef<number | null>(null);

  // 0. 접근성 및 키보드 상태 선언
  const [isFocused, setIsFocused] = useState(false);

  // 1. 창 크기 변화 대응 (Responsive Layout)
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: Math.max(320, width),
          height: width < 600 ? 400 : Math.max(400, height),
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

  // 3. raw 교차 참조 튜플 데이터를 렌더링에 적합한 좌표 링크 객체로 사전 가공 (useMemo)
  const allLinks = useMemo<RenderLink[]>(() => {
    const yCoord = dimensions.height - AXIS_Y_OFFSET;

    return rawCrossReferences.map((tuple, index) => {
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
  }, [dimensions.height, xScale]);

  // 4. 필터링된 링크만 추출
  const filteredLinks = useMemo(() => {
    return allLinks.filter((link) => {
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
  }, [allLinks, filterType]);

  // 4-1. 키보드 탐색용 정렬된 링크 리스트 (소스 구절 오프셋 순 오름차순)
  const sortedLinks = useMemo(() => {
    return [...filteredLinks].sort((a, b) => a.sourceOffset - b.sourceOffset);
  }, [filteredLinks]);

  // activeLink로부터 유도된 현재 포커스된 링크 인덱스
  const focusedLinkIndex = useMemo(() => {
    if (!activeLink) return null;
    return sortedLinks.findIndex((link) => link.id === activeLink.id);
  }, [activeLink, sortedLinks]);

  // 5. Canvas 고해상도 렌더링 & 애니메이션 루프
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

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

        // Hover 책 판단
        let isBookHovered = false;
        if (mouseRef.current) {
          const { x, y } = mouseRef.current;
          if (x >= startX && x <= endX && y >= axisY - 10 && y <= axisY + 30) {
            isBookHovered = true;
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
        const isMobile = dimensions.width < 768;
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
      ctx.lineWidth = 0.75;
      
      filteredLinks.forEach((link) => {
        // Active Link는 나중에 위에 덧그릴 것이므로 스킵
        if (activeLink && activeLink.id === link.id) return;

        // 구신약별 곡선 컬러
        const strokeColor =
          link.testamentClass === 'OT_TO_OT'
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

      // 5-3. 활성화된 단 하나의 링크(Active Link)만 강력하게 강조하여 덧그리기 (Glow 적용)
      if (activeLink) {
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
    };

    draw();
  }, [dimensions, filteredLinks, activeLink, xScale]);

  // 6. rAF 기반 pointermove 쓰로틀 좌표 감지 연산 (60FPS 인터랙션 최적화)
  const updateActiveLinkAtCoordinates = (x: number, y: number) => {
    mouseRef.current = { x, y };

    if (rAFRef.current) return;

    rAFRef.current = requestAnimationFrame(() => {
      rAFRef.current = null;
      if (!mouseRef.current) return;

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      let foundActiveLink: RenderLink | null = null;
      let minDistance = 10; // 10픽셀 이내만 호버로 판정

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
    });
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
    if (rAFRef.current) {
      cancelAnimationFrame(rAFRef.current);
      rAFRef.current = null;
    }
    setActiveLink(null);
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
      className="relative w-full h-[400px] sm:h-[500px] md:h-[600px] bg-[#070b16] rounded-2xl overflow-hidden border border-slate-800/50 focus-within:ring-2 focus-within:ring-emerald-500/80 focus-within:border-transparent transition-all duration-300 shadow-2xl shadow-black/80 outline-none"
    >
      {/* 캔버스 요소 */}
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseLeave}
        className="block cursor-pointer"
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
    </div>
  );
};
