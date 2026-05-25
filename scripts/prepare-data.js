import fs from 'fs';
import path from 'path';

// HTML Entity 디코딩 헬퍼 함수
function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&#x60;/g, "`")
    .replace(/&nbsp;/g, " ");
}
// 66권 성경의 실제 장별 절 수 (KJV / 개신교 표준 31,102절)
const chapterVerseCountsData = {
  "GEN": [31, 25, 24, 26, 32, 22, 24, 22, 29, 32, 32, 20, 18, 24, 21, 16, 27, 33, 38, 18, 34, 24, 20, 67, 34, 35, 46, 22, 35, 43, 55, 32, 20, 31, 29, 43, 36, 30, 23, 23, 57, 38, 34, 31, 28, 34, 31, 22, 33, 26], // 50
  "EXO": [22, 25, 22, 31, 23, 30, 25, 32, 35, 29, 10, 51, 22, 31, 27, 36, 16, 27, 25, 26, 36, 31, 33, 18, 40, 37, 21, 43, 46, 38, 18, 35, 23, 35, 35, 38, 29, 31, 43, 38], // 40
  "LEV": [17, 16, 17, 35, 19, 30, 38, 36, 24, 20, 47, 8, 59, 57, 33, 34, 16, 30, 37, 27, 24, 33, 44, 23, 55, 46, 34], // 27
  "NUM": [54, 34, 51, 49, 31, 27, 89, 26, 23, 36, 35, 16, 33, 45, 41, 50, 13, 32, 22, 29, 35, 41, 30, 25, 18, 65, 23, 31, 40, 16, 54, 42, 56, 29, 34, 13], // 36
  "DEU": [46, 37, 29, 49, 33, 25, 26, 20, 29, 22, 32, 32, 18, 29, 23, 22, 20, 22, 21, 20, 23, 30, 25, 22, 19, 19, 26, 68, 29, 20, 30, 52, 29, 12], // 34
  "JOS": [18, 24, 17, 24, 15, 27, 26, 35, 27, 43, 23, 24, 33, 15, 63, 10, 18, 28, 51, 9, 45, 34, 16, 33], // 24
  "JDG": [36, 23, 31, 24, 31, 40, 25, 35, 57, 18, 40, 15, 25, 20, 20, 31, 13, 31, 30, 48, 25], // 21
  "RUT": [22, 23, 18, 22], // 4
  "1SA": [28, 36, 21, 22, 12, 21, 17, 22, 27, 27, 15, 25, 23, 52, 35, 23, 58, 30, 24, 42, 15, 23, 28, 22, 44, 25, 12, 25, 11, 31, 13], // 31
  "2SA": [27, 32, 39, 12, 25, 23, 29, 18, 13, 19, 27, 31, 39, 33, 37, 23, 29, 33, 43, 26, 22, 51, 39, 25], // 24
  "1KI": [53, 46, 28, 34, 18, 38, 51, 66, 28, 29, 43, 33, 34, 31, 34, 34, 24, 46, 21, 43, 29, 53], // 22
  "2KI": [18, 25, 27, 44, 27, 33, 20, 29, 37, 36, 21, 21, 25, 29, 38, 20, 41, 37, 37, 21, 26, 20, 37, 20, 30], // 25
  "1CH": [54, 55, 24, 43, 26, 81, 40, 40, 44, 14, 47, 40, 14, 17, 29, 43, 27, 17, 19, 8, 30, 19, 32, 31, 31, 32, 34, 21, 30], // 29
  "2CH": [17, 18, 17, 22, 14, 42, 22, 18, 31, 19, 23, 16, 22, 15, 19, 14, 19, 34, 11, 37, 20, 12, 21, 27, 28, 23, 36, 27, 36, 27, 21, 33, 25, 33, 27, 23], // 36
  "EZR": [11, 70, 13, 24, 17, 22, 28, 36, 15, 44], // 10
  "NEH": [11, 20, 32, 23, 19, 19, 73, 36, 38, 39, 36, 47, 31], // 13
  "EST": [22, 23, 15, 17, 14, 14, 10, 17, 32, 3], // 10
  "JOB": [22, 13, 26, 21, 27, 30, 21, 22, 35, 22, 20, 25, 28, 22, 35, 22, 16, 21, 29, 29, 34, 30, 17, 25, 6, 14, 23, 28, 25, 31, 40, 22, 33, 37, 16, 33, 24, 41, 30, 24, 34, 17], // 42
  "PSA": [
    6, 12, 8, 9, 12, 10, 17, 9, 20, 18, 7, 8, 6, 7, 5, 11, 15, 50, 14, 9, 13, 31, 6, 10, 22, 12, 14, 9, 11, 12, 24, 11, 22, 22, 28, 12, 40, 22, 13, 17, 13, 11, 5, 26, 17, 11, 9, 14, 20, 23, 19, 9, 6, 7, 23, 13, 11, 11, 17, 12, 8, 12, 11, 10, 13, 20, 7, 35, 36, 5, 24, 20, 28, 10, 12, 20, 72, 13, 19, 16, 8, 18, 12, 13, 17, 7, 18, 52, 17, 16, 15, 5, 23, 11, 13, 12, 9, 9, 5, 8, 28, 22, 35, 45, 48, 43, 14, 31, 7, 10, 10, 9, 8, 18, 19, 2, 29, 176, 7, 8, 9, 4, 8, 5, 6, 5, 6, 8, 8, 3, 18, 3, 3, 21, 26, 9, 8, 24, 13, 10, 7, 12, 15, 21, 10, 20, 14, 9, 6
  ], // 150
  "PRO": [33, 22, 35, 27, 23, 35, 27, 36, 18, 32, 31, 28, 25, 35, 33, 33, 28, 24, 29, 30, 31, 29, 35, 34, 28, 28, 27, 28, 27, 33, 31], // 31
  "ECC": [18, 26, 22, 16, 20, 12, 29, 17, 18, 20, 10, 14], // 12
  "SNG": [17, 17, 11, 16, 16, 13, 13, 14], // 8
  "ISA": [31, 22, 26, 6, 30, 13, 25, 22, 21, 34, 16, 6, 22, 32, 9, 14, 14, 7, 25, 6, 17, 25, 18, 23, 12, 21, 13, 29, 24, 33, 9, 20, 24, 17, 10, 22, 38, 22, 8, 31, 29, 25, 28, 28, 25, 13, 15, 22, 26, 11, 23, 15, 12, 17, 13, 12, 21, 14, 21, 22, 11, 12, 19, 12, 25, 24], // 66
  "JER": [19, 37, 25, 31, 31, 30, 34, 22, 26, 25, 23, 17, 27, 22, 21, 21, 27, 23, 15, 18, 14, 30, 40, 10, 38, 24, 22, 17, 32, 24, 40, 44, 26, 22, 19, 32, 21, 28, 18, 16, 18, 22, 13, 30, 5, 28, 7, 47, 39, 46, 64, 34], // 52
  "LAM": [22, 22, 66, 22, 22], // 5
  "EZK": [28, 10, 27, 17, 17, 14, 27, 18, 11, 22, 25, 28, 23, 23, 8, 63, 24, 32, 14, 49, 32, 31, 49, 27, 17, 21, 36, 26, 21, 26, 18, 32, 33, 31, 15, 38, 28, 23, 29, 49, 26, 20, 27, 31, 25, 24, 35, 35], // 48
  "DAN": [21, 49, 30, 37, 31, 28, 28, 27, 27, 21, 45, 13], // 12
  "HOS": [11, 23, 5, 19, 15, 11, 16, 14, 17, 15, 12, 14, 16, 9], // 14
  "JOL": [20, 32, 21], // 3
  "AMO": [15, 16, 15, 13, 27, 14, 17, 14, 15], // 9
  "OBA": [21], // 1
  "JON": [17, 10, 10, 11], // 4
  "MIC": [16, 13, 12, 13, 15, 16, 20], // 7
  "NAM": [15, 13, 19], // 3
  "HAB": [17, 20, 19], // 3
  "ZEP": [18, 15, 20], // 3
  "HAG": [15, 23], // 2
  "ZEC": [21, 13, 10, 14, 11, 15, 14, 23, 17, 12, 17, 14, 9, 21], // 14
  "MAL": [14, 17, 18, 6], // 4
  "MAT": [25, 23, 17, 25, 48, 34, 29, 34, 38, 42, 30, 50, 58, 36, 39, 28, 27, 35, 30, 34, 46, 46, 39, 51, 46, 75, 66, 20], // 28
  "MRK": [45, 28, 35, 41, 43, 56, 37, 38, 50, 52, 33, 44, 37, 72, 47, 20], // 16
  "LUK": [80, 52, 38, 44, 39, 49, 50, 56, 62, 42, 54, 59, 35, 35, 32, 31, 37, 43, 48, 47, 38, 71, 56, 53], // 24
  "JHN": [51, 25, 36, 54, 47, 71, 53, 59, 41, 42, 57, 50, 38, 31, 27, 33, 26, 40, 42, 31, 25], // 21
  "ACT": [26, 47, 26, 37, 42, 15, 60, 40, 43, 48, 30, 25, 52, 28, 41, 40, 34, 28, 41, 38, 40, 30, 35, 27, 27, 32, 44, 31], // 28
  "ROM": [32, 29, 31, 25, 21, 23, 25, 39, 33, 21, 36, 21, 14, 23, 33, 27], // 16
  "1CO": [31, 16, 23, 21, 13, 20, 40, 13, 27, 33, 34, 31, 13, 40, 58, 24], // 16
  "2CO": [24, 17, 18, 18, 21, 18, 16, 24, 15, 18, 33, 21, 14], // 13
  "GAL": [24, 21, 29, 31, 26, 18], // 6
  "EPH": [23, 22, 21, 32, 33, 24], // 6
  "PHP": [30, 30, 21, 23], // 4
  "COL": [29, 23, 25, 18], // 4
  "1TH": [10, 20, 13, 18, 28], // 5
  "2TH": [12, 17, 18], // 3
  "1TI": [20, 15, 16, 16, 25, 21], // 6
  "2TI": [18, 26, 17, 22], // 4
  "TIT": [16, 15, 15], // 3
  "PHM": [25], // 1
  "HEB": [14, 18, 19, 16, 14, 20, 28, 13, 28, 39, 40, 29, 25], // 13
  "JAS": [27, 26, 18, 17, 20], // 5
  "1PE": [25, 25, 22, 19, 14], // 5
  "2PE": [21, 22, 18], // 3
  "1JN": [10, 29, 24, 21, 21], // 5
  "2JN": [13], // 1
  "3JN": [14], // 1
  "JUD": [25], // 1
  "REV": [20, 29, 22, 11, 19, 17, 17, 13, 21, 11, 19, 17, 18, 20, 8, 21, 18, 24, 21, 15, 27, 21] // 22
};

const booksOrder = [
  "GEN", "EXO", "LEV", "NUM", "DEU", "JOS", "JDG", "RUT", "1SA", "2SA",
  "1KI", "2KI", "1CH", "2CH", "EZR", "NEH", "EST", "JOB", "PSA", "PRO",
  "ECC", "SNG", "ISA", "JER", "LAM", "EZK", "DAN", "HOS", "JOL", "AMO",
  "OBA", "JON", "MIC", "NAM", "HAB", "ZEP", "HAG", "ZEC", "MAL", "MAT",
  "MRK", "LUK", "JHN", "ACT", "ROM", "1CO", "2CO", "GAL", "EPH", "PHP",
  "COL", "1TH", "2TH", "1TI", "2TI", "TIT", "PHM", "HEB", "JAS", "1PE",
  "2PE", "1JN", "2JN", "3JN", "JUD", "REV"
];

// 한글 책 이름 매핑 정보
const booksKoNames = [
  "창세기", "출애굽기", "레위기", "민수기", "신명기", "여호수아", "사사기", "룻기", "사무엘상", "사무엘하",
  "열왕기상", "열왕기하", "역대기상", "역대기하", "에스라", "느헤미야", "에스더", "욥기", "시편", "잠언",
  "전도서", "아가", "이사야", "예레미야", "예레미야 애가", "에스겔", "다니엘", "호세아", "요엘", "아모스",
  "오바디아", "요나", "미가", "나훔", "하박국", "스바냐", "학개", "스가랴", "말라기", "마태복음",
  "마가복음", "누가복음", "요한복음", "사도행전", "로마서", "고린도전서", "고린도후서", "갈라디아서", "에베소서", "빌립보서",
  "골로새서", "데살로니가전서", "데살로니가후서", "디모데전서", "디모데후서", "디도서", "빌레몬서", "히브리서", "야고보서", "베드로전서",
  "베드로후서", "요한1서", "요한2서", "요한3서", "유다서", "요한계시록"
];

// 영문 책 이름 매핑 정보
const booksEnNames = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Rut", "1 Samuel", "2 Samuel",
  "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs",
  "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
  "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi", "Matthew",
  "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians",
  "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter",
  "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"
];

// 대형 샘플 데이터 맵 및 수동 랜드마크 맵이 삭제되었습니다.


function buildPipeline() {
  const publicDataDir = path.resolve('public/data');
  const bibleTextDirKo = path.join(publicDataDir, 'bible-text/ko');
  const bibleTextDirEn = path.join(publicDataDir, 'bible-text/en');
  const crossReferencesDir = path.join(publicDataDir, 'cross-references');

  // 디렉토리들 생성
  [bibleTextDirKo, bibleTextDirEn, crossReferencesDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  console.log('--- ScriptureFlux Data pre-processing pipeline start ---');

  // 원본 성경 데이터 로드
  const koRawPath = path.resolve('scripts/ko_ko.json');
  const enRawPath = path.resolve('scripts/en_kjv.json');
  
  if (!fs.existsSync(koRawPath) || !fs.existsSync(enRawPath)) {
    console.error('Error: Original Bible data files not found in scripts/ folder.');
    process.exit(1);
  }
  
  console.log('Loading raw Bible datasets...');
  const koContent = fs.readFileSync(koRawPath, 'utf-8').replace(/^\uFEFF/, '');
  const enContent = fs.readFileSync(enRawPath, 'utf-8').replace(/^\uFEFF/, '');
  const koRaw = JSON.parse(koContent);
  const enRaw = JSON.parse(enContent);

  // 1. 66권 책별 성경 본문 분할 생성 (KJV / 개역한글)
  let totalGeneratedVerses = 0;
  for (let b = 0; b < booksOrder.length; b++) {
    const bookId = booksOrder[b];
    const koBookName = booksKoNames[b];
    const enBookName = booksEnNames[b];

    const bookDataKo = koRaw[b];
    const bookDataEn = enRaw[b];

    const bookTextKo = {};
    const bookTextEn = {};

    const chaptersKo = bookDataKo ? bookDataKo.chapters : [];
    const chaptersEn = bookDataEn ? bookDataEn.chapters : [];
    const chaptersCount = Math.max(chaptersKo.length, chaptersEn.length);

    for (let c = 0; c < chaptersCount; c++) {
      const chapterNum = c + 1;
      const versesKo = chaptersKo[c] || [];
      const versesEn = chaptersEn[c] || [];
      const versesCount = Math.max(versesKo.length, versesEn.length);

      for (let v = 0; v < versesCount; v++) {
        const verseNum = v + 1;
        const key = `${b}.${chapterNum}.${verseNum}`;

        let textKo = versesKo[v] || "";
        let textEn = versesEn[v] || "";

        // HTML Entity 디코딩
        textKo = decodeHtmlEntities(textKo.trim());
        textEn = decodeHtmlEntities(textEn.trim());

        if (!textKo) {
          textKo = `(본 번역본에는 없는 구절입니다)`;
        }

        if (!textEn) {
          textEn = `(Verse omitted in this translation)`;
        }

        bookTextKo[key] = textKo;
        bookTextEn[key] = textEn;

        totalGeneratedVerses++;
      }
    }

    // 책별 JSON 파일 저장
    fs.writeFileSync(path.join(bibleTextDirKo, `${b}.json`), JSON.stringify(bookTextKo, null, 2), 'utf-8');
    fs.writeFileSync(path.join(bibleTextDirEn, `${b}.json`), JSON.stringify(bookTextEn, null, 2), 'utf-8');
  }
  console.log(`[Success] Split Bible Text: 66 Korean files, 66 English files successfully created. (Total verses: ${totalGeneratedVerses})`);

  // 2. 책별 교차 참조 데이터 분할 생성 (실제 34만개급 OpenBible.info TSV 파싱 및 2단계 LOD 레이지 로딩 구축)
  const tsvBookToId = {
    "Gen": "GEN", "Exod": "EXO", "Lev": "LEV", "Num": "NUM", "Deut": "DEU",
    "Josh": "JOS", "Judg": "JDG", "Ruth": "RUT", "1Sam": "1SA", "2Sam": "2SA",
    "1Kgs": "1KI", "2Kgs": "2KI", "1Chr": "1CH", "2Chr": "2CH", "Ezra": "EZR",
    "Neh": "NEH", "Esth": "EST", "Job": "JOB", "Ps": "PSA", "Prov": "PRO",
    "Eccl": "ECC", "Song": "SNG", "Isa": "ISA", "Jer": "JER", "Lam": "LAM",
    "Ezek": "EZK", "Dan": "DAN", "Hos": "HOS", "Joel": "JOL", "Amos": "AMO",
    "Obad": "OBA", "Jonah": "JON", "Mic": "MIC", "Nah": "NAM", "Hab": "HAB",
    "Zeph": "ZEP", "Hag": "HAG", "Zec": "ZEC", "Zech": "ZEC", "Mal": "MAL",
    "Matt": "MAT", "Mark": "MRK", "Luke": "LUK", "John": "JHN", "Acts": "ACT",
    "Rom": "ROM", "1Cor": "1CO", "2Cor": "2CO", "Gal": "GAL", "Eph": "EPH",
    "Phil": "PHP", "Col": "COL", "1Thess": "1TH", "2Thess": "2TH", "1Tim": "1TI",
    "2Tim": "2TI", "Titus": "TIT", "Phlm": "PHM", "Heb": "HEB", "Jas": "JAS",
    "1Pet": "1PE", "2Pet": "2PE", "1John": "1JN", "2John": "2JN", "3John": "3JN",
    "Jude": "JUD", "Rev": "REV"
  };

  function parseVerse(refStr) {
    if (!refStr) return null;
    // 범위 형태(예: John.1.1-John.1.3)는 첫 구절만 앵커로 처리
    const baseRef = refStr.split('-')[0];
    const parts = baseRef.split('.');
    if (parts.length < 3) return null;
    const tsvBook = parts[0];
    const chapter = parseInt(parts[1], 10);
    const verse = parseInt(parts[2], 10);
    
    const bookId = tsvBookToId[tsvBook];
    if (!bookId) return null;
    const bookIdx = booksOrder.indexOf(bookId);
    if (bookIdx === -1) return null;
    
    return { bookIdx, chapter, verse };
  }

  const tsvPath = path.resolve('scripts/cross-references-raw/cross_references.txt');
  if (!fs.existsSync(tsvPath)) {
    console.error('Error: scripts/cross-references-raw/cross_references.txt not found!');
    process.exit(1);
  }

  console.log('Loading and parsing raw TSV cross-references...');
  const tsvContent = fs.readFileSync(tsvPath, 'utf-8');
  const tsvLines = tsvContent.split('\n');
  const allParsedRefs = [];

  for (let i = 1; i < tsvLines.length; i++) {
    const line = tsvLines[i].trim();
    if (!line) continue;
    const parts = line.split('\t');
    if (parts.length < 3) continue;

    const votes = parseInt(parts[2], 10);
    if (isNaN(votes) || votes <= 0) continue; // 부적합 및 음수/0 투표수 필터링 배제

    const fromVerse = parseVerse(parts[0]);
    const toVerse = parseVerse(parts[1]);
    if (!fromVerse || !toVerse) continue;

    // 자기 참조 회피
    if (fromVerse.bookIdx === toVerse.bookIdx &&
        fromVerse.chapter === toVerse.chapter &&
        fromVerse.verse === toVerse.verse) {
      continue;
    }

    // 투표수 기반 연관 강도(Weight) 0.1~1.0 매핑 (50표 이상 시 1.0)
    const weight = parseFloat(Math.min(1.0, 0.1 + (votes / 50) * 0.9).toFixed(2));

    allParsedRefs.push({
      srcBook: fromVerse.bookIdx,
      srcCh: fromVerse.chapter,
      srcVs: fromVerse.verse,
      tgtBook: toVerse.bookIdx,
      tgtCh: toVerse.chapter,
      tgtVs: toVerse.verse,
      votes,
      weight
    });
  }

  console.log(`Successfully parsed ${allParsedRefs.length} valid positive cross-references.`);

  let totalCrossRefPairs = 0;
  const crossRefDistribution = {};

  // 66권 책별로 분할 적재
  for (let b = 0; b < booksOrder.length; b++) {
    const bookRefList = [];
    allParsedRefs.forEach(ref => {
      if (ref.srcBook === b || ref.tgtBook === b) {
        bookRefList.push([
          ref.srcBook, ref.srcCh, ref.srcVs,
          ref.tgtBook, ref.tgtCh, ref.tgtVs,
          ref.weight
        ]);
      }
    });

    fs.writeFileSync(
      path.join(crossReferencesDir, `${b}.json`), 
      JSON.stringify(bookRefList), 
      'utf-8'
    );
    crossRefDistribution[b] = bookRefList.length;
    totalCrossRefPairs += bookRefList.length;
  }

  // 3. 글로벌 대표 랜드마크 데이터 (최초 로딩 시 보여줄 최정예 상위 1,500선 추출)
  const sortedRefs = [...allParsedRefs].sort((a, b) => b.votes - a.votes);
  const globalRepRefs = sortedRefs.slice(0, 1500).map(ref => [
    ref.srcBook, ref.srcCh, ref.srcVs,
    ref.tgtBook, ref.tgtCh, ref.tgtVs,
    ref.weight
  ]);

  fs.writeFileSync(
    path.join(publicDataDir, 'cross-references.json'), 
    JSON.stringify(globalRepRefs), 
    'utf-8'
  );

  console.log(`[Success] Split Cross-References: 66 book-level JSON files successfully generated.`);
  console.log(`[Stats] Total simulated/loaded cross-reference links: ${totalCrossRefPairs} pairs (LOD active)`);

  // 4. 빌드 보고서 내보내기
  const dataReport = {
    version: "v0.8.0-dataset-lod-complete",
    totalVerses: totalGeneratedVerses,
    totalCrossReferences: allParsedRefs.length,
    representativePairs: globalRepRefs.length,
    crossRefDistribution,
    timestamp: new Date().toISOString(),
    attribution: {
      inspiration: "Chris Harrison (Bible Cross-References)",
      dataset: "OpenBible.info (Christoph Romhild, Sean Harrison)",
      koreanTranslation: "개역한글 (1961, Public Domain)",
      englishTranslation: "KJV (Project Gutenberg, Public Domain)"
    }
  };

  fs.writeFileSync(path.join(publicDataDir, 'data-report.json'), JSON.stringify(dataReport, null, 2), 'utf-8');
  console.log('[Success] data-report.json successfully created!');
  console.log('--- ScriptureFlux Data Pipeline completed successfully! ---');
}

buildPipeline();
