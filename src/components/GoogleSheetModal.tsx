import React, { useState, useEffect } from 'react';
import { Sheet, Copy, Check, ExternalLink, AlertCircle, CheckCircle2, RefreshCw, X } from 'lucide-react';

interface GoogleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  appsScriptUrl: string;
  onSaveUrl: (url: string) => void;
}

const BAKED_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxbFUdGc7KsarlD6SNzK34xA4gRehyFLfSZhgSUDC-i-C0J5Ll-J1g5vkaGg_et6SNZJA/exec';

export const GoogleSheetModal: React.FC<GoogleSheetModalProps> = ({
  isOpen,
  onClose,
  appsScriptUrl,
  onSaveUrl,
}) => {
  const [inputUrl, setInputUrl] = useState(appsScriptUrl || BAKED_APPS_SCRIPT_URL);
  const [scriptCode, setScriptCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    needsAnyonePermission?: boolean;
    details?: string;
    fixSteps?: string[];
  } | null>(null);

  useEffect(() => {
    setInputUrl(appsScriptUrl || BAKED_APPS_SCRIPT_URL);
  }, [appsScriptUrl]);

  useEffect(() => {
    // Fetch apps script code template from backend
    fetch('/api/apps-script-code')
      .then(res => res.json())
      .then(data => {
        if (data.code) setScriptCode(data.code);
      })
      .catch(() => {
        // Fallback code if offline
        setScriptCode(`function doPost(e) { ... }`);
      });
  }, []);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    if (!scriptCode) return;
    navigator.clipboard.writeText(scriptCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleTestConnection = async () => {
    if (!inputUrl.trim()) {
      setTestResult({ success: false, message: 'Google Apps Script 웹 앱 URL을 입력해주세요.' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/test-google-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appsScriptUrl: inputUrl.trim() }),
      });

      const rawText = await res.text();
      let data: any;

      try {
        data = JSON.parse(rawText);
      } catch {
        // Proxy or intermediate network returned HTML error
        const isForbidden = rawText.includes('403') || rawText.includes('Forbidden') || rawText.includes('html');
        data = {
          success: false,
          needsAnyonePermission: isForbidden,
          message: isForbidden
            ? "Google Apps Script 배포 설정에서 '액세스 권한'을 '모든 사용자(Anyone)'로 변경해야 합니다."
            : "구글 시트 응답을 처리할 수 없습니다.",
          details: "구글 웹 앱 접근이 로그인/권한 제한(HTTP 403)으로 차단되었습니다.",
          fixSteps: [
            "1. 구글 시트 상단 메뉴 [확장 프로그램] > [Apps Script]를 엽니다.",
            "2. 우측 상단 [배포] 버튼 > [배포 관리]를 클릭합니다.",
            "3. 등록된 웹 앱 우측의 연필 모양 [수정 ✏️] 아이콘을 클릭합니다.",
            "4. '액세스 권한이 있는 사용자(Who has access)'를 '모든 사용자(Anyone)'로 변경합니다.",
            "5. 버전 드롭다운에서 [새 버전]을 선택하고 우측 하단 [배포]를 누릅니다."
          ]
        };
      }

      setTestResult({
        success: data.success,
        message: data.message || (data.success ? '연결 성공!' : '연결 실패'),
        needsAnyonePermission: data.needsAnyonePermission,
        details: data.details,
        fixSteps: data.fixSteps
      });

      if (data.success) {
        onSaveUrl(inputUrl.trim());
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: '연결 실패: ' + (err.message || '네트워크 응답 없음'),
        needsAnyonePermission: true,
        details: "Google Apps Script 배포 권한이 '모든 사용자(Anyone)'로 되어 있는지 확인해주세요.",
        fixSteps: [
          "1. 구글 시트 상단 메뉴 [확장 프로그램] > [Apps Script]를 엽니다.",
          "2. 우측 상단 [배포] 버튼 > [배포 관리]를 클릭합니다.",
          "3. 등록된 웹 앱 우측의 연필 모양 [수정 ✏️] 아이콘을 클릭합니다.",
          "4. '액세스 권한이 있는 사용자(Who has access)'를 '모든 사용자(Anyone)'로 변경합니다.",
          "5. 버전 드롭다운에서 [새 버전]을 선택하고 우측 하단 [배포]를 누릅니다."
        ]
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    onSaveUrl(inputUrl.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-2xl bg-white pixel-box rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-emerald-600 text-white px-6 py-4 border-b-4 border-gray-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sheet className="w-5 h-5 text-emerald-200" />
            <h2 className="font-bold text-lg sm:text-xl">구글 시트 연동 및 앱스 스크립트 배포</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-emerald-700 rounded-lg text-white/90 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-gray-800 text-sm">
          
          {/* Step-by-Step Guide */}
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 space-y-3">
            <h3 className="font-bold text-blue-950 flex items-center gap-2 text-base">
              <span>📋 구글 시트 연동 4단계 가이드</span>
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 text-blue-900 text-xs sm:text-sm pl-1 leading-relaxed">
              <li>
                새로운 <strong>Google 스프레드시트</strong>를 생성합니다.{' '}
                <a
                  href="https://sheets.new"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 underline font-semibold hover:text-blue-800"
                >
                  sheets.new 열기 <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>스프레드시트 상단 메뉴에서 <strong>[확장 프로그램] &gt; [Apps Script]</strong>를 클릭합니다.</li>
              <li>아래의 <strong>백엔드 스크립트 코드</strong>를 복사하여 에디터에 붙여넣고 저장(Ctrl+S)합니다.</li>
              <li>
                우측 상단 <strong>[배포] &gt; [새 배포]</strong> 클릭:
                <div className="mt-1 pl-4 text-xs text-blue-950 font-medium">
                  • 유형: <span className="bg-white px-1.5 py-0.5 rounded border border-blue-200">웹 앱</span><br />
                  • 다음 사용자로 실행: <span className="bg-white px-1.5 py-0.5 rounded border border-blue-200">나(내 계정)</span><br />
                  • 액세스 권한: <strong className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">모든 사용자(Anyone)</strong> (※ 필수)<br />
                </div>
              </li>
              <li>배포 완료 후 표시되는 <strong>웹 앱 URL</strong>을 아래 입력창에 넣고 [연결 확인 및 저장]을 누르면 완료!</li>
            </ol>
          </div>

          {/* Code Viewer with 1-Click Copy */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-gray-900 flex items-center gap-1.5">
                <span>Google Apps Script 백엔드 코드 (Code.gs)</span>
              </label>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-md border border-gray-700 cursor-pointer shadow-xs transition-colors"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>복사 완료!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>코드 전체 복사</span>
                  </>
                )}
              </button>
            </div>
            <pre className="bg-gray-950 text-gray-200 text-xs p-3.5 rounded-lg border-2 border-gray-800 font-mono h-48 overflow-y-auto whitespace-pre leading-relaxed select-all">
              {scriptCode}
            </pre>
          </div>

          {/* Web App URL Input & Connection Tester */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-gray-900 block text-xs sm:text-sm">
                배포된 Google Apps Script 웹 앱 URL:
              </label>
              <button
                type="button"
                onClick={() => setInputUrl(BAKED_APPS_SCRIPT_URL)}
                className="text-xs text-purple-700 hover:text-purple-900 font-bold underline cursor-pointer"
              >
                지정된 배포 URL로 재설정
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={inputUrl}
                onChange={e => setInputUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 px-3.5 py-2.5 border-2 border-gray-400 rounded-lg text-sm focus:border-emerald-600 focus:outline-hidden font-mono"
              />
              <button
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold text-xs rounded-lg border-2 border-gray-900 cursor-pointer flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shadow-[2px_2px_0px_#111827]"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>테스트 중...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-gray-600" />
                    <span>연결 테스트</span>
                  </>
                )}
              </button>
            </div>

            {/* Test Result Message */}
            {testResult && (
              <div
                className={`p-3.5 rounded-lg border text-xs flex flex-col gap-2 ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-950'
                }`}
              >
                <div className="flex items-start gap-2">
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-bold text-sm leading-snug">{testResult.message}</p>
                    {testResult.details && (
                      <p className="mt-1 text-xs text-gray-700">{testResult.details}</p>
                    )}
                  </div>
                </div>

                {/* Fix Steps if permission is needed */}
                {testResult.fixSteps && (
                  <div className="mt-2 pt-2 border-t border-rose-200 bg-white/70 rounded p-2.5 space-y-1.5 text-[11px] sm:text-xs">
                    <p className="font-bold text-rose-900 flex items-center gap-1">
                      <span>💡 1분 해결 방법 (스프레드시트에서 권한 변경):</span>
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-800 font-medium">
                      {testResult.fixSteps.map((step, idx) => (
                        <li key={idx} className="leading-relaxed">{step}</li>
                      ))}
                    </ol>
                    <p className="text-[11px] text-gray-600 pt-1">
                      * 배포 후 다시 위 <strong>[연결 테스트]</strong> 버튼을 누르면 즉시 초록색 성공으로 바뀝니다!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Record Format Preview */}
          <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3 text-xs text-emerald-950 space-y-1">
            <strong className="text-emerald-900 flex items-center gap-1.5 font-bold">
              <span>📊 구글 시트 실시간 자동 기록 안내 (코드 영구 내장)</span>
            </strong>
            <p className="text-emerald-800 font-medium">
              * 선생님의 Apps Script URL(<code>..._et6SNZJA/exec</code>)이 <strong>시스템 코드에 영구 고정</strong>되어 있습니다.
            </p>
            <p className="text-emerald-800 font-medium">
              * 학생이 게임을 마치는 즉시(완주 또는 게임 오버), <strong>학번, 이름, 점수, 정답 수가 실시간으로 스프레드시트에 새 행으로 자동 기록</strong>됩니다.
            </p>
            <p className="text-gray-600 text-[11px] pt-0.5">
              기록 컬럼: [기록 일시], [학번], [이름], [퀴즈 점수], [게임 점수], [총점], [맞힌 문제 수], [총 문제 수], [정답률], [클리어 여부], [소요 시간]
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-gray-100 border-t-3 border-gray-900 px-6 py-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border-2 border-gray-700 text-gray-700 font-bold rounded-lg hover:bg-gray-200 cursor-pointer text-xs"
          >
            닫기
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg border-2 border-gray-900 pixel-btn cursor-pointer text-xs flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>설정 저장하기</span>
          </button>
        </div>

      </div>
    </div>
  );
};
