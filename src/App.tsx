import { useState, useEffect } from 'react';
import { NetworkCanvas, type RenderLink, type VerseRef } from './components/NetworkCanvas';
import { ReferenceCard } from './components/ReferenceCard';
import { Github, BookOpen, Layers, ShieldCheck, Search, RefreshCw, Sliders } from 'lucide-react';
import rawCrossReferences from './data/cross-references.json';
import books from './data/books.json';
import verseIndex from './data/verse-index.json';

function App() {
  const [activeLink, setActiveLink] = useState<RenderLink | null>(null);
  const [pinnedLink, setPinnedLink] = useState<RenderLink | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'OT_ONLY' | 'NT_ONLY' | 'OT_NT'>('ALL');

  // 프리미엄 기능 3종 관련 신규 상태 정의
  const [minWeight, setMinWeight] = useState<number>(0.1);
  const [searchVerse, setSearchVerse] = useState<VerseRef | null>(null);
  const [initialPinnedRefs, setInitialPinnedRefs] = useState<{ source: VerseRef; target: VerseRef } | null>(null);

  // 3단 검색 셀렉터 로컬 상태
  const [searchBookIdx, setSearchBookIdx] = useState<number>(-1);
  const [searchChapter, setSearchChapter] = useState<number>(-1);
  const [searchVerseNum, setSearchVerseNum] = useState<number>(-1);

  // 1. URL Hash 기반 공유 복원 (Deep Link 마운트 처리)
  useEffect(() => {
    const handleHashRestore = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#')) {
        const parts = hash.slice(1).split('-');
        if (parts.length === 2) {
          const parsePart = (part: string) => {
            const match = part.match(/^([A-Z0-9]+)\.(\d+)\.(\d+)$/);
            if (!match) return null;
            const [, bookId, chStr, vsStr] = match;
            const bookIdx = books.findIndex(b => b.id === bookId);
            if (bookIdx === -1) return null;
            return {
              bookIndex: bookIdx,
              chapter: parseInt(chStr, 10),
              verse: parseInt(vsStr, 10)
            };
          };
          const source = parsePart(parts[0]);
          const target = parsePart(parts[1]);
          if (source && target) {
            setInitialPinnedRefs({ source, target });
          }
        }
      }
    };

    handleHashRestore();

    window.addEventListener('hashchange', handleHashRestore);
    return () => window.removeEventListener('hashchange', handleHashRestore);
  }, []);

  // 2. pinnedLink 변경 시 URL Hash 동적 갱신
  useEffect(() => {
    if (pinnedLink) {
      const srcBook = books[pinnedLink.source.bookIndex].id;
      const srcCh = pinnedLink.source.chapter;
      const srcVs = pinnedLink.source.verse;
      const tgtBook = books[pinnedLink.target.bookIndex].id;
      const tgtCh = pinnedLink.target.chapter;
      const tgtVs = pinnedLink.target.verse;
      
      const newHash = `#${srcBook}.${srcCh}.${srcVs}-${tgtBook}.${tgtCh}.${tgtVs}`;
      if (window.location.hash !== newHash) {
        window.location.hash = newHash;
      }
    } else {
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  }, [pinnedLink]);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#0a0f1e] text-slate-200">
      
      {/* 1. 상단 글로벌 네비게이션 / 헤더 */}
      <header className="border-b border-slate-800/80 bg-slate-950/40 backdrop-blur-md sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-emerald-500 to-blue-500 text-[#0a0f1e] font-bold rounded-xl shadow-lg shadow-emerald-500/10">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5 m-0">
                ScriptureFlux
                <span className="text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-md">
                  v0.2.0 MVP
                </span>
              </h1>
            </div>
          </div>
          
          <a
            href="https://github.com/jeiel85/ScriptureFlux"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Github className="w-5 h-5" />
            <span className="hidden sm:inline">GitHub Repository</span>
          </a>
        </div>
      </header>

      {/* 2. 메인 컨텐츠 영역 */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        
        {/* 상단 안내 섹션 */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex-grow max-w-3xl">
            <h2 className="text-3xl font-black text-slate-100 mb-2 tracking-tight">
              성경 교차 참조 시각화 네트워크
            </h2>
            <p className="text-slate-400 leading-relaxed text-sm md:text-base">
              ScriptureFlux는 성경 66권 전체를 하나의 단일 유기적 축으로 배열하고, 구절 간의 긴밀한 상호 연관성을 수려한 2D 곡선 네트워크로 시각화합니다. 아래 곡선 위로 마우스 커서를 올려 실시간으로 구절을 확인하거나, <strong>클릭(Click)하여 정보를 고정</strong>해 읽어보세요.
            </p>
            <p className="text-slate-500 text-xs mt-2 leading-relaxed">
              🎨 본 프로젝트는 크리스 해리슨(Chris Harrison)의 전설적인 시각화 예술{' '}
              <a 
                href="https://www.chrisharrison.net/index.php/Visualizations/BibleVis" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-emerald-400/90 hover:text-emerald-400 hover:underline transition-all"
              >
                "Bible Cross-References"
              </a>
              와{' '}
              <a 
                href="https://www.openbible.info" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-emerald-400/90 hover:text-emerald-400 hover:underline transition-all"
              >
                OpenBible.info
              </a>
              의 오픈 데이터에 깊은 영감을 받아 제작된 경의적 헌사 웹 앱입니다.
            </p>
          </div>
          
          {/* 미니 통계 정보 패널 */}
          <div className="flex gap-4 shrink-0 glass-card px-4 py-3 rounded-xl border border-slate-800/40 text-xs">
            <div className="text-center border-r border-slate-800/60 pr-4">
              <span className="text-slate-400 block mb-0.5">총 성경 권수</span>
              <strong className="text-slate-100 text-lg font-bold">66권</strong>
            </div>
            <div className="text-center border-r border-slate-800/60 pr-4">
              <span className="text-slate-400 block mb-0.5">총 성경 구절</span>
              <strong className="text-slate-100 text-lg font-bold">31,139절</strong>
            </div>
            <div className="text-center">
              <span className="text-slate-400 block mb-0.5">로드된 참조 수</span>
              <strong className="text-emerald-400 text-lg font-bold">
                {rawCrossReferences.length}개
              </strong>
            </div>
          </div>
        </section>

        {/* 3. 통합 컨트롤 및 설정 대시보드 */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 glass-card p-4 rounded-2xl border border-slate-800/50 bg-slate-950/20">
          
          {/* A. 네트워크 필터 */}
          <div className="lg:col-span-5 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400 ml-1" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">신구약 도메인 필터</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'ALL', label: '전체' },
                { id: 'OT_ONLY', label: '구약 내부 (OT ↔ OT)' },
                { id: 'NT_ONLY', label: '신약 내부 (NT ↔ NT)' },
                { id: 'OT_NT', label: '교차 연결 (OT ↔ NT)' }
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => {
                    setFilterType(btn.id as 'ALL' | 'OT_ONLY' | 'NT_ONLY' | 'OT_NT');
                    setActiveLink(null);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                    filterType === btn.id
                      ? 'bg-emerald-500 text-[#0a0f1e] shadow-lg shadow-emerald-500/20 font-bold'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/40'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* B. Weight 가중치 슬라이더 */}
          <div className="lg:col-span-3 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400 ml-1" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">연관 강도(Weight) 필터</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5 rounded">
                min. {minWeight.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center h-full px-1">
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={minWeight}
                onChange={(e) => setMinWeight(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 bg-slate-900 h-1.5 rounded-lg appearance-none cursor-pointer border border-slate-800/60"
              />
            </div>
          </div>

          {/* C. 3단 구절 검색 집중 탐색기 */}
          <div className="lg:col-span-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-emerald-400 ml-1" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">구절 집중 탐색 (Dimming)</span>
            </div>
            <div className="flex items-center gap-1.5 w-full">
              <select
                value={searchBookIdx}
                onChange={(e) => {
                  const idx = parseInt(e.target.value, 10);
                  setSearchBookIdx(idx);
                  setSearchChapter(-1);
                  setSearchVerseNum(-1);
                  setSearchVerse(null);
                }}
                className="flex-grow bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500/70 transition-all"
              >
                <option value={-1} className="bg-[#0a0f1e]">책 선택</option>
                {books.map((b) => (
                  <option key={b.index} value={b.index} className="bg-[#0a0f1e]">
                    {b.ko}
                  </option>
                ))}
              </select>

              <select
                value={searchChapter}
                disabled={searchBookIdx === -1}
                onChange={(e) => {
                  const ch = parseInt(e.target.value, 10);
                  setSearchChapter(ch);
                  setSearchVerseNum(-1);
                  setSearchVerse(null);
                }}
                className="w-16 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500/70 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value={-1} className="bg-[#0a0f1e]">장</option>
                {searchBookIdx !== -1 &&
                  Array.from({ length: books[searchBookIdx].chapters }).map((_, i) => (
                    <option key={i} value={i + 1} className="bg-[#0a0f1e]">
                      {i + 1}
                    </option>
                  ))}
              </select>

              <select
                value={searchVerseNum}
                disabled={searchChapter === -1}
                onChange={(e) => {
                  const vs = parseInt(e.target.value, 10);
                  setSearchVerseNum(vs);
                  if (vs !== -1) {
                    setSearchVerse({
                      bookIndex: searchBookIdx,
                      chapter: searchChapter,
                      verse: vs
                    });
                  } else {
                    setSearchVerse(null);
                  }
                }}
                className="w-16 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500/70 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value={-1} className="bg-[#0a0f1e]">절</option>
                {searchBookIdx !== -1 && searchChapter !== -1 &&
                  Array.from({
                    length: verseIndex.books[searchBookIdx].chapterVerseCounts[searchChapter - 1] || 0
                  }).map((_, i) => (
                    <option key={i} value={i + 1} className="bg-[#0a0f1e]">
                      {i + 1}
                    </option>
                  ))}
              </select>

              {(searchBookIdx !== -1 || searchVerse) && (
                <button
                  onClick={() => {
                    setSearchBookIdx(-1);
                    setSearchChapter(-1);
                    setSearchVerseNum(-1);
                    setSearchVerse(null);
                  }}
                  className="p-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-rose-400 hover:text-rose-300 rounded-xl transition-all shadow-md"
                  title="집중 탐색 초기화"
                >
                  <RefreshCw className="w-4.5 h-4.5" />
                </button>
              )}
            </div>
          </div>

        </section>

        {/* 4. Canvas 시각화 보드 */}
        <section className="relative">
          <NetworkCanvas
            activeLink={activeLink}
            setActiveLink={setActiveLink}
            pinnedLink={pinnedLink}
            setPinnedLink={setPinnedLink}
            filterType={filterType}
            minWeight={minWeight}
            searchVerse={searchVerse}
            initialPinnedRefs={initialPinnedRefs}
            setInitialPinnedRefs={setInitialPinnedRefs}
          />
          
          {/* 마우스 가이드 헬퍼 */}
          {!activeLink && !pinnedLink && (
            <div className="absolute top-4 left-4 glass-card px-3 py-1.5 rounded-lg border border-slate-800/50 text-[11px] text-slate-400 pointer-events-none animate-pulse">
              💡 곡선 네트워크에 마우스 커서를 올리거나, 클릭(Click)하여 정보를 고정해 보세요.
            </div>
          )}
        </section>

        {/* 5. activeLink 또는 pinnedLink가 존재할 시 하단에 세부 구절 카드 정보 노출 */}
        <section className="min-h-[160px] flex items-center justify-center">
          {pinnedLink || activeLink ? (
            <ReferenceCard 
              activeLink={activeLink} 
              pinnedLink={pinnedLink} 
              onUnpin={() => {
                setPinnedLink(null);
                setActiveLink(null);
              }}
            />
          ) : (
            <div className="w-full text-center py-12 border border-dashed border-slate-800/50 rounded-2xl bg-slate-950/20 text-slate-500 text-sm">
              선택 또는 호버된 연결선이 없습니다. 캔버스 영역의 유기적 곡선에 마우스를 가져가거나 클릭하여 상세 정보를 고정하십시오.
            </div>
          )}
        </section>

      </main>

      {/* 6. 글로벌 푸터 */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>ScriptureFlux © 2026. Made with Open Source Integrity.</span>
            </div>
            <div className="text-[10px] text-slate-600">
              Inspired by Chris Harrison's pioneering "Bible Cross-References" visualization.
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <span>
              Data: <a href="https://www.openbible.info" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">OpenBible.info (TSK)</a>
            </span>
            <span>
              Text: <a href="https://www.gutenberg.org" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">KJV</a> &amp; 개역한글 (1961)
            </span>
            <span>License: MIT License</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
