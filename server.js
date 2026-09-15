import express from "express";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.disable("x-powered-by");
app.use(express.json({limit:"60kb"}));
app.use(express.static(path.join(__dirname,"public")));

const CHURCH = `
영도중앙교회 공식 안내 자료
- 표어: 예수님과 동행하는 111공동체
- 담임목사: 김세현 목사
- 주소: (49117) 부산 영도구 절영로 513-35
- 주차장: 부산광역시 영도구 동삼동 454-24
- 전화: 051-403-5544
- 새벽을 깨우는 기도회: 오전 5시 30분, 매일(토요일 제외)
- 수요기도회: 수요일 오후 7시 30분
- 주일 오전예배: 주일 오전 10시 40분
- 전교인 속회: 주일 오후 1시
- 금요기도회: 금요일 오후 9시
- 기도회: 주일 오후 10시
- 청년부: 주일 오후 1시
- 온라인 헌금: 농협 923-01-271153 / 영도중앙교회
`;

const RULES = `
당신은 영도중앙교회 공식 AI 안내 도우미입니다.
1. 반드시 공식 안내 자료를 우선하여 한국어 존댓말로 친절하고 간결하게 답합니다.
2. 교회에 관한 사실이 자료에 없으면 추측하지 말고 "현재 등록된 교회 안내 자료로는 확인하기 어렵습니다. 영도중앙교회(051-403-5544)로 문의해 주세요."라고 안내합니다.
3. 일반적인 성경·신앙 질문은 일반 기독교 정보임을 분명히 하고 답할 수 있으나 교회의 공식 입장인 것처럼 추측하지 않습니다.
4. 답변은 평문으로 작성합니다. 별표(**), 샵(#), 마크다운 표 같은 마크다운 기호를 사용하지 않습니다.
5. 개인정보, 상담 내용 등 민감한 정보는 입력하지 않도록 필요한 경우 안내합니다.
6. 최근 설교나 이번 주 행사처럼 실시간 정보가 필요한 질문은 현재 자동 동기화되지 않았음을 알리고 교회 홈페이지 또는 전화 확인을 안내합니다.
${CHURCH}
`;

app.post("/api/chat", async (req,res)=>{
 try{
   if(!process.env.OPENAI_API_KEY) return res.status(500).json({error:"API 키가 설정되지 않았습니다."});
   const raw = Array.isArray(req.body?.messages) ? req.body.messages : [];
   const messages = raw.slice(-10).map(x=>({
      role: x?.role === "assistant" ? "assistant" : "user",
      content: String(x?.content||"").slice(0,1200)
   })).filter(x=>x.content.trim());
   if(!messages.length) return res.status(400).json({error:"질문을 입력해 주세요."});

   const client = new OpenAI({apiKey:process.env.OPENAI_API_KEY});
   const response = await client.responses.create({
      model:"gpt-5.6-luna",
      instructions:RULES,
      input:messages,
      max_output_tokens:400,
      store:false
   });
   let answer=(response.output_text||"답변을 만들지 못했습니다.").replace(/\*\*/g,"").replace(/^#{1,6}\s*/gm,"");
   res.json({answer});
 }catch(e){
   console.error(e);
   res.status(500).json({error:"AI 연결 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."});
 }
});

app.get("/health",(req,res)=>res.json({ok:true}));
const port=process.env.PORT || 3000;
app.listen(port,()=>console.log(`READY: http://localhost:${port}`));
