import React, { useState, useRef } from "react";
import axios from "axios";
import katex from "katex";
import "katex/dist/katex.min.css";

// 라텍스 포함 텍스트를 KaTeX HTML로 변환하는 헬퍼 함수
function renderMathText(text) {
  if (!text) return '';
  // 블록 수식: $$ ... $$
  let html = text.replace(/\${2}([^$]+)\${2}/g, (_, expr) =>
    katex.renderToString(expr.trim(), { displayMode: true, throwOnError: false })
  );
  // 인라인 수식: \( ... \)
  html = html.replace(/\\\(([^)]+)\\\)/g, (_, expr) =>
    katex.renderToString(expr.trim(), { displayMode: false, throwOnError: false })
  );
  return html;
}

// 문제 데이터 정의
const QUESTION_BANK = [
  {
    id: 1,
    question: "\\lim_{x \\to \\infty} (3x+1)f(x) = 6, \\quad \\lim_{x \\to \\infty} (x-4)g(x)=2, \\quad \\lim_{x \\to \\infty} \\dfrac{(x+1)g(x)}{(2x+3)f(x)} = ?",
    answer: "1/3",
    solution: "(x+1)g(x) \\approx \\frac{2}{x-4}(x+1) \\text{… 예시 해설 내용}"
  },
];

export default function MathPracticeApp() {
  const [index] = useState(0);
  const question = QUESTION_BANK[index];

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hint, setHint] = useState(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [answerState, setAnswerState] = useState(null);

  const initCanvas = (ctx) => {
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  };

  const startDrawing = ({ nativeEvent }) => {
    const ctx = canvasRef.current.getContext('2d');
    initCanvas(ctx);
    ctx.beginPath();
    ctx.moveTo(nativeEvent.offsetX, nativeEvent.offsetY);
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(nativeEvent.offsetX, nativeEvent.offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.closePath();
    setIsDrawing(false);
  };

  const generateHint = async () => {
    setHintLoading(true);
    setHint(null);
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const mp = await axios.post('http://localhost:4000/api/ocr', { src: dataUrl });
      const studentLatex = mp.data.latex;
      const prompt = `당신은 학생들에게 수학을 가르쳐주는 창의적이고 열정적이며 친절한 수학 선생님입니다.
학생이 풀고있는 문제는 ${question.question} 입니다.
다음은 해당 문제 해설입니다:
${question.solution}

아래 수식은 학생이 해당 문제를 풀다가 막힌 풀이입니다
${studentLatex}

학생의 풀이와 문제 해설을 참고하여 학생이 작성한 풀이 직후에 시도해보면 좋은 문제풀이에 대한 힌트를 딱 한가지를 구체적으로 알려주세요.
힌트는 필요하면 계산식은 알려주되 계산 결과값에 대한 언급은 없어야합니다.
학생이 이미 풀이에서 시도한 내용은 무조건 힌트로 언급하지 말아주세요.
모든 수식은 \(...\) 또는 $$...$$ 형태로 감싸서 출력해 주세요.
`;
      const gpt = await axios.post('http://localhost:4000/api/generate-hint', { prompt });
      setHint(gpt.data.hint);
    } catch (e) {
      console.error(e);
      setHint('힌트 생성 중 오류가 발생했습니다.');
    } finally {
      setHintLoading(false);
    }
  };

  const checkAnswer = () => {
    const isCorrect = answer.trim().toLowerCase() === question.answer;
    setAnswerState(isCorrect ? 'correct' : 'wrong');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* 사이드바 */}
      <div style={{ width: 256, backgroundColor: '#000', color: '#fff', padding: 24 }}>
        <h2 style={{ marginBottom: 16 }}>수학 2</h2>
        <ul style={{ listStyle: 'none', paddingLeft: 0, fontSize: 14 }}>
          <li>1. 함수의 극한과 연속</li>
          <li style={{ marginLeft: 16, color: '#34D399' }}>a. 함수의 극한</li>
          <li style={{ marginLeft: 16 }}>b. 함수의 연속</li>
          <li style={{ marginTop: 8 }}>2. 미분</li>
          <li style={{ marginLeft: 16 }}>a. 미분계수</li>
          <li style={{ marginLeft: 16 }}>b. 도함수</li>
          <li style={{ marginLeft: 16 }}>c. 도함수의 활용</li>
          <li style={{ marginLeft: 16 }}>d. 도함수의 그래프</li>
          <li style={{ marginTop: 8 }}>3. 적분</li>
        </ul>
        <div style={{ marginTop: 24, textAlign: 'center' }}>48%</div>
        <div style={{ height: 8, backgroundColor: '#4B5563', borderRadius: 4, overflow: 'hidden', marginTop: 4 }}>
          <div style={{ width: '48%', height: '100%', backgroundColor: '#10B981' }}></div>
        </div>
        <button
          onClick={generateHint}
          disabled={hintLoading}
          style={{ marginTop: 16, width: '100%', padding: '8px', backgroundColor: '#10B981', color: '#fff', border: 'none' }}
        >
          {hintLoading ? '힌트 생성 중...' : '힌트보기'}
        </button>
      </div>

      {/* 메인 */}
      <div style={{ flex: 1, backgroundColor: '#F3F4F6', padding: 40 }}>
        <div style={{ maxWidth: 768, margin: '0 auto', backgroundColor: '#fff', borderRadius: 8, padding: 24 }}>
          <h1 style={{ marginBottom: 8 }}>문제학습</h1>
          <h2 style={{ marginBottom: 16 }}>문제 {question.id}.</h2>
          <div
            dangerouslySetInnerHTML={{ __html: katex.renderToString(question.question, { displayMode: true, throwOnError: false }) }}
            style={{ padding: 16, borderLeft: '4px solid #2563EB', marginBottom: 16 }}
          />
          <p style={{ marginBottom: 16, fontSize: 14 }}>풀이 작성 팁: 대충 쓴 글씨가 오답을 만든다!</p>
          <div style={{ backgroundColor: '#E5E7EB', borderRadius: 8, padding: 16, marginBottom: 24, height: 220 }}>            
            <canvas
              ref={canvasRef}
              width={600}
              height={200}
              style={{ backgroundColor: '#D1D5DB', cursor: 'crosshair', display: 'block', margin: '0 auto' }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
          </div>
          {hint && (
            <div
              dangerouslySetInnerHTML={{ __html: renderMathText(hint) }}
              style={{ backgroundColor: '#ECFDF5', border: '1px solid #34D399', borderRadius: 4, padding: 16, marginBottom: 24, fontSize: 14 }}
            />
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
            <label>답:</label>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              style={{ padding: '4px 8px', border: '1px solid #D1D5DB', borderRadius: 4 }}
            />
            <button
              onClick={checkAnswer}
              style={{ padding: '6px 12px', backgroundColor: answerState === 'correct' ? '#059669' : answerState === 'wrong' ? '#EF4444' : '#9CA3AF', color: '#fff', border: 'none' }}
            >
              {answerState === 'correct' ? '정답!' : answerState === 'wrong' ? '오답!' : '정답보기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
