import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory score storage for real-time leaderboards & fallback backup
export const DEFAULT_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxbFUdGc7KsarlD6SNzK34xA4gRehyFLfSZhgSUDC-i-C0J5Ll-J1g5vkaGg_et6SNZJA/exec';

interface ScoreRecord {
  id: string;
  studentName: string;
  studentId: string;
  quizScore: number;
  gameScore: number;
  totalScore: number;
  correctCount: number;
  totalQuestions: number;
  cleared: boolean;
  timeTaken: number;
  timestamp: string;
  syncedToGoogleSheet: boolean;
}

const scoreRecords: ScoreRecord[] = [
  {
    id: 'demo-1',
    studentName: '토끼반 김철수',
    studentId: '2026-01',
    quizScore: 2000,
    gameScore: 1850,
    totalScore: 3850,
    correctCount: 20,
    totalQuestions: 20,
    cleared: true,
    timeTaken: 145,
    timestamp: new Date(Date.now() - 3600000).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
    syncedToGoogleSheet: true,
  },
  {
    id: 'demo-2',
    studentName: '이영희',
    studentId: '2026-02',
    quizScore: 1800,
    gameScore: 1420,
    totalScore: 3220,
    correctCount: 18,
    totalQuestions: 20,
    cleared: true,
    timeTaken: 160,
    timestamp: new Date(Date.now() - 7200000).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
    syncedToGoogleSheet: true,
  }
];

// The Apps Script Template Code to provide to the teacher
const APPS_SCRIPT_TEMPLATE = `/**
 * 슈퍼토끼 노동권 퀴즈 & 게임 성적 자동 기록기 (Google Apps Script)
 * 
 * [배포 방법 4단계]
 * 1. 새 Google 스프레드시트를 만듭니다.
 * 2. 상단 메뉴 [확장 프로그램] > [Apps Script]를 클릭합니다.
 * 3. 기존 코드를 모두 지우고 이 코드를 그대로 붙여넣은 뒤 저장(Ctrl+S)합니다.
 * 4. 우측 상단 [배포] > [새 배포] 클릭:
 *    - 유형 선택: '웹 앱'
 *    - 설명: '슈퍼토끼 성적 기록기'
 *    - 다음 사용자로 실행: '나(내 계정)'
 *    - 액세스 권한이 있는 사용자: ★★★ '모든 사용자(Anyone)' ★★★ 로 설정!
 *    - [배포] 클릭 후 나오는 '웹 앱 URL'을 복사하여 게임의 [구글 시트 연동 설정]에 입력하세요.
 */

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    
    // 시트가 비어있는 경우 헤더 생성
    if (sheet.getLastRow() === 0) {
      var headers = [
        "기록 일시", 
        "학번", 
        "이름", 
        "퀴즈 점수", 
        "게임 점수", 
        "총점", 
        "맞힌 문제수", 
        "총 문제수", 
        "정답률(%)", 
        "클리어 여부", 
        "소요 시간(초)"
      ];
      sheet.appendRow(headers);
      
      // 헤더 스타일 지정
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#3B82F6")
                 .setFontColor("#FFFFFF")
                 .setFontWeight("bold")
                 .setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }
    
    // 데이터 파싱
    var data = JSON.parse(e.postData.contents);
    var timestamp = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");
    var quizScore = Number(data.quizScore) || 0;
    var gameScore = Number(data.gameScore) || 0;
    var totalScore = quizScore + gameScore;
    var correctCount = Number(data.correctCount) || 0;
    var totalQuestions = Number(data.totalQuestions) || 20;
    var accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    
    var newRow = [
      timestamp,
      data.studentId || "-",
      data.studentName || "익명",
      quizScore,
      gameScore,
      totalScore,
      correctCount,
      totalQuestions,
      accuracy + "%",
      data.cleared ? "완주 성공" : "진행중/게임오버",
      Number(data.timeTaken) || 0
    ];
    
    sheet.appendRow(newRow);
    
    // 마지막 행 정렬
    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1, 1, newRow.length).setHorizontalAlignment("center");
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "구글 시트에 성적이 성공적으로 저장되었습니다!",
      studentName: data.studentName,
      totalScore: totalScore
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "저장 중 오류 발생: " + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // 연결 테스트용
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    message: "슈퍼토끼 게임 구글 시트 연동 웹 앱이 정상 작동 중입니다!"
  })).setMimeType(ContentService.MimeType.JSON);
}
`;

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get Apps Script code for teacher deployment
app.get('/api/apps-script-code', (req, res) => {
  res.json({
    code: APPS_SCRIPT_TEMPLATE,
    instructions: [
      '1. Google 스프레드시트를 새로 생성합니다.',
      '2. 상단 메뉴 [확장 프로그램] > [Apps Script]를 클릭합니다.',
      '3. 에디터 내용을 비우고 제공된 코드를 붙여넣고 저장합니다.',
      '4. [배포] > [새 배포] > 유형: "웹 앱" 선택.',
      '5. 액세스 권한: "모든 사용자(Anyone)" 선택 후 배포합니다.',
      '6. 발급받은 웹 앱 URL을 게임의 [구글 시트 연동]에 등록하세요!'
    ]
  });
});

// Test connection to Google Apps Script Web App
app.post('/api/test-google-sheet', async (req, res) => {
  const { appsScriptUrl } = req.body;
  const targetUrl = (appsScriptUrl && typeof appsScriptUrl === 'string' && appsScriptUrl.trim()) 
    ? appsScriptUrl.trim() 
    : DEFAULT_APPS_SCRIPT_URL;

  try {
    if (!targetUrl.startsWith('https://script.google.com/macros/s/')) {
      return res.json({
        success: false,
        message: '유효한 Google Apps Script 배포 URL(https://script.google.com/macros/s/.../exec)이 아닙니다.'
      });
    }

    // Try GET request first (to test doGet)
    let response = await fetch(targetUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json, text/plain, */*' },
      redirect: 'follow'
    });

    let rawText = '';
    try {
      rawText = await response.text();
    } catch {
      rawText = '';
    }

    const isAccessDenied =
      response.status === 401 ||
      response.status === 403 ||
      rawText.includes('<html') ||
      rawText.includes('accounts.google.com') ||
      rawText.includes('アクセス権') ||
      rawText.includes('권한이 필요') ||
      rawText.includes('drive-logo') ||
      rawText.includes('Sign in') ||
      rawText.includes('로그인');

    if (isAccessDenied) {
      return res.json({
        success: false,
        needsAnyonePermission: true,
        httpStatus: response.status,
        message: "Google Apps Script 배포 설정에서 '액세스 권한이 있는 사용자'를 '모든 사용자(Anyone)'로 변경해야 합니다.",
        details: "현재 구글 로그인/접근 권한 제한(HTTP 403)으로 인해 웹 앱에 직접 접근할 수 없습니다.",
        fixSteps: [
          "1. 구글 시트 상단 메뉴 [확장 프로그램] > [Apps Script]를 엽니다.",
          "2. 우측 상단 [배포] 버튼 > [배포 관리]를 클릭합니다.",
          "3. 등록된 웹 앱 항목 우측의 연필 모양 [수정 ✏️] 아이콘을 누릅니다.",
          "4. '액세스 권한이 있는 사용자(Who has access)'를 반드시 '모든 사용자(Anyone)'로 변경합니다.",
          "5. 버전 드롭다운에서 [새 버전]을 선택하고 [배포]를 완료합니다."
        ]
      });
    }

    if (response.ok) {
      return res.json({
        success: true,
        message: 'Google Apps Script 웹 앱과 성공적으로 연결되었습니다!',
        responsePreview: rawText.slice(0, 150)
      });
    }

    // If GET returned other status, try testing with POST ping
    const postResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ping: true, test: true }),
      redirect: 'follow'
    });

    const postText = await postResponse.text();
    if (
      postResponse.status === 401 ||
      postResponse.status === 403 ||
      postText.includes('<html') ||
      postText.includes('accounts.google.com') ||
      postText.includes('アクセス権') ||
      postText.includes('권한이 필요') ||
      postText.includes('drive-logo')
    ) {
      return res.json({
        success: false,
        needsAnyonePermission: true,
        httpStatus: postResponse.status,
        message: "Google Apps Script 배포 설정에서 '액세스 권한이 있는 사용자'를 '모든 사용자(Anyone)'로 변경해야 합니다.",
        details: "현재 구글 로그인/접근 권한 제한(HTTP 403)으로 인해 웹 앱에 직접 접근할 수 없습니다.",
        fixSteps: [
          "1. 구글 시트 상단 메뉴 [확장 프로그램] > [Apps Script]를 엽니다.",
          "2. 우측 상단 [배포] 버튼 > [배포 관리]를 클릭합니다.",
          "3. 등록된 웹 앱 항목 우측의 연필 모양 [수정 ✏️] 아이콘을 누릅니다.",
          "4. '액세스 권한이 있는 사용자(Who has access)'를 반드시 '모든 사용자(Anyone)'로 변경합니다.",
          "5. 버전 드롭다운에서 [새 버전]을 선택하고 [배포]를 완료합니다."
        ]
      });
    }

    if (postResponse.ok) {
      return res.json({
        success: true,
        message: 'Google Apps Script 웹 앱과 성공적으로 연결되었습니다 (POST 테스트 성공)!',
        responsePreview: postText.slice(0, 150)
      });
    }

    return res.json({
      success: false,
      message: `구글 서버 응답 오류 (상태 코드: ${response.status}). 배포 상태를 다시 확인해주세요.`
    });
  } catch (error: any) {
    return res.json({
      success: false,
      message: `연결 테스트 실패: ${error?.message || '네트워크 오류'}`
    });
  }
});

// Record score endpoint (stores locally & proxies/forwards to Google Sheets Apps Script)
app.post('/api/record-score', async (req, res) => {
  try {
    const {
      studentName,
      studentId,
      quizScore = 0,
      gameScore = 0,
      correctCount = 0,
      totalQuestions = 20,
      cleared = false,
      timeTaken = 0,
      appsScriptUrl = ''
    } = req.body;

    const totalScore = Number(quizScore) + Number(gameScore);
    const newRecord: ScoreRecord = {
      id: 'score_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      studentName: (studentName || '토끼 대원').trim(),
      studentId: (studentId || '-').trim(),
      quizScore: Number(quizScore),
      gameScore: Number(gameScore),
      totalScore,
      correctCount: Number(correctCount),
      totalQuestions: Number(totalQuestions),
      cleared: Boolean(cleared),
      timeTaken: Number(timeTaken),
      timestamp: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
      syncedToGoogleSheet: false,
    };

    let googleSheetResponse: any = null;
    let googleSheetError: string | null = null;

    // Strict requirement: Only records of students who completed (cleared) the game are sent/saved to Google Sheets!
    const isCleared = Boolean(cleared);
    const targetUrl = appsScriptUrl?.trim() || process.env.GOOGLE_APPS_SCRIPT_URL?.trim() || DEFAULT_APPS_SCRIPT_URL;

    if (isCleared && targetUrl && targetUrl.startsWith('https://script.google.com/')) {
      try {
        const gsRes = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify({
            studentName: newRecord.studentName,
            studentId: newRecord.studentId,
            quizScore: newRecord.quizScore,
            gameScore: newRecord.gameScore,
            totalScore: newRecord.totalScore,
            correctCount: newRecord.correctCount,
            totalQuestions: newRecord.totalQuestions,
            cleared: newRecord.cleared,
            timeTaken: newRecord.timeTaken,
            timestamp: newRecord.timestamp
          }),
          redirect: 'follow'
        });

        if (gsRes.ok) {
          const text = await gsRes.text();
          // Check if Google returned an access/login HTML screen instead of JSON
          if (text.includes('<html') || text.includes('accounts.google.com') || text.includes('アクセス権') || text.includes('권한이 필요') || text.includes('drive-logo')) {
            googleSheetError = "Apps Script 배포 설정에서 '액세스 권한'을 '모든 사용자(Anyone)'로 설정해야 스프레드시트에 새 행으로 자동 기록됩니다.";
            newRecord.syncedToGoogleSheet = false;
          } else {
            try {
              googleSheetResponse = JSON.parse(text);
              if (googleSheetResponse && googleSheetResponse.status === 'error') {
                googleSheetError = googleSheetResponse.message || 'Apps Script 처리 오류';
                newRecord.syncedToGoogleSheet = false;
              } else {
                newRecord.syncedToGoogleSheet = true;
              }
            } catch {
              googleSheetResponse = { raw: text.slice(0, 200) };
              newRecord.syncedToGoogleSheet = true;
            }
          }
        } else {
          if (gsRes.status === 401 || gsRes.status === 403) {
            googleSheetError = "Google Apps Script 배포 설정에서 '액세스 권한'을 '모든 사용자(Anyone)'로 변경해주세요 (HTTP 403 차단됨). Apps Script 상단 [배포 관리]에서 권한을 '모든 사용자'로 설정해야 구글 시트에 자동 기록됩니다.";
          } else {
            googleSheetError = `Google Apps Script HTTP ${gsRes.status}`;
          }
        }
      } catch (err: any) {
        googleSheetError = err.message || 'Google Sheets 전송 중 통신 오류';
      }
    } else if (!isCleared) {
      newRecord.syncedToGoogleSheet = false;
    }

    // Save in server score records
    scoreRecords.unshift(newRecord);
    if (scoreRecords.length > 500) {
      scoreRecords.pop();
    }

    return res.json({
      success: true,
      record: newRecord,
      googleSheetSynced: newRecord.syncedToGoogleSheet,
      googleSheetResponse,
      googleSheetError,
      message: isCleared
        ? (newRecord.syncedToGoogleSheet
            ? '완주 성공! 구글 스프레드시트 및 실시간 랭킹에 자동 집계되었습니다!'
            : targetUrl
            ? `완주 성적이 로컬에 등록되었습니다. (${googleSheetError || '구글 시트 연동 확인 필요'})`
            : '완주 성적이 랭킹에 저장되었습니다.')
        : '완주(STAGE CLEAR)한 학생의 기록만 구글 시트에 집계됩니다. 다시 도전하여 끝까지 완주해보세요!'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: '성적 기록 실패: ' + (error?.message || '알 수 없는 서버 오류')
    });
  }
});

// Leaderboard / Recent scores (supports whole class up to 100 students)
app.get('/api/scores', (req, res) => {
  // Return up to 100 scores sorted by totalScore for whole class ranking
  const topScores = [...scoreRecords].sort((a, b) => b.totalScore - a.totalScore).slice(0, 100);
  const recentScores = scoreRecords.slice(0, 50);
  res.json({
    topScores,
    recentScores,
    totalRecords: scoreRecords.length
  });
});

// Start Server with Vite
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Super Rabbit Quiz Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
