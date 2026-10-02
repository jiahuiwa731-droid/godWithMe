"use client";
import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, Send, Sparkles, Leaf, RotateCcw, Sun, Moon, Heart, Music2, Languages } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Journal } from "./journal";
import { localDate } from "@/lib/journal";

type Message = { role: "user" | "assistant"; content: string };
const readings = [
  { zh: "你们要休息，要知道我是神。", en: "Be still, and know that I am God.", sourceZh: "诗篇 46:10 · 和合本", sourceEn: "Psalm 46:10 · KJV", promptZh: "把此刻放不下的事带到神面前。你不必马上解决一切。", promptEn: "Bring what weighs on you before God. You do not have to resolve everything right now." },
  { zh: "你的话是我脚前的灯，是我路上的光。", en: "Thy word is a lamp unto my feet, and a light unto my path.", sourceZh: "诗篇 119:105 · 和合本", sourceEn: "Psalm 119:105 · KJV", promptZh: "不必看清整条路。今天，哪一步是你已经知道该做的？", promptEn: "You do not need to see the entire path. What is one step you already know you can take?" },
  { zh: "你们所做的，都要凭爱心而做。", en: "Let all your things be done with charity.", sourceZh: "哥林多前书 16:14 · 和合本", sourceEn: "1 Corinthians 16:14 · KJV", promptZh: "今天，试着用一个具体行动关心身边的人，也照顾自己。", promptEn: "Let one small action care for someone today. Remember to care for yourself, too." },
];

export default function Home() {
  const [english, setEnglish] = useState(false);
  const t = (zh: string, en: string) => english ? en : zh;
  const [tab, setTab] = useState("morning");
  const [duration, setDuration] = useState(3);
  const [remaining, setRemaining] = useState(180);
  const [running, setRunning] = useState(false);
  const deadline = useRef(0);
  const [finished, setFinished] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(30);
  const audio = useRef<AudioContext | null>(null);
  const gain = useRef<GainNode | null>(null);
  const sequence = useRef<ReturnType<typeof setInterval> | null>(null);
  const [audioError, setAudioError] = useState(false);
  const [date, setDate] = useState<Date | null>(null);
  const [reading, setReading] = useState(readings[0]);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [chatError, setChatError] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [remind, setRemind] = useState(false);
  const [reminder, setReminder] = useState(false);
  const chatEnd = useRef<HTMLDivElement>(null);
  const sending = useRef(false);
  const [journalDate, setJournalDate] = useState("");

  useEffect(() => {
    function refreshDay() { const d = new Date(); setDate(d); setReading(readings[Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/86400000)%readings.length]); }
    refreshDay(); const dayTimer = setInterval(refreshDay, 60000);
    try { setEnglish(localStorage.getItem("godwithme-language")==="en"); } catch { /* preferences are optional */ }
    fetch("/api/chat").then(r=>r.json() as Promise<{configured?:boolean}>).then(d=>setConnected(d.configured===true)).catch(()=>setConnected(false));
    return ()=>{ clearInterval(dayTimer); if(sequence.current) clearInterval(sequence.current); void audio.current?.close(); };
  }, []);
  useEffect(() => { document.documentElement.lang = english ? "en" : "zh-CN"; document.title = t("与神同行 · 每日信仰陪伴","God With Me · Your daily sanctuary"); }, [english]);
  useEffect(() => {
    if (!running) return;
    const tick = ()=>{ const left=Math.max(0,Math.ceil((deadline.current-Date.now())/1000)); setRemaining(left); if(left===0){setRunning(false);setFinished(true);} };
    tick(); const timer=setInterval(tick,250); return ()=>clearInterval(timer);
  }, [running]);
  useEffect(() => { if(gain.current&&audio.current) gain.current.gain.setTargetAtTime(volume/100*.25,audio.current.currentTime,.2); }, [volume]);
  useEffect(() => {
    if(!remind) return;
    const next=Date.now()+20*60*1000;
    const check=()=>{if(Date.now()>=next){setReminder(true);setRemind(false);}};
    const timer=setInterval(check,1000);document.addEventListener("visibilitychange",check);
    return ()=>{clearInterval(timer);document.removeEventListener("visibilitychange",check);};
  }, [remind]);
  useEffect(() => { chatEnd.current?.scrollIntoView({behavior:"smooth",block:"nearest"}); }, [messages,busy]);
  function startQuiet(minutes=duration) {setDuration(minutes);setRemaining(minutes*60);deadline.current=Date.now()+minutes*60000;setRunning(true);setFinished(false);setTab("quiet");}
  function toggleTimer() {if(running)setRunning(false);else if(remaining===0)startQuiet();else{deadline.current=Date.now()+remaining*1000;setRunning(true);setFinished(false);}}
  function changeLanguage() {setEnglish(!english);try{localStorage.setItem("godwithme-language",english?"zh":"en");}catch{/* language remains in memory */}}
  async function toggleMusic() {
    setAudioError(false);
    try {
      if(playing){await audio.current?.suspend();setPlaying(false);return;}
      if(!audio.current){
        const context=new AudioContext();audio.current=context;gain.current=context.createGain();gain.current.gain.value=volume/100*.25;gain.current.connect(context.destination);
        let index=0;const notes=[261.63,329.63,392,523.25,392,329.63,293.66,349.23,440,523.25,440,349.23];
        const note=()=>{if(context.state!=="running")return;const now=context.currentTime;const oscillator=context.createOscillator();const envelope=context.createGain();oscillator.type="sine";oscillator.frequency.value=notes[index++%notes.length];envelope.gain.setValueAtTime(0,now);envelope.gain.linearRampToValueAtTime(.65,now+.05);envelope.gain.exponentialRampToValueAtTime(.001,now+3.5);oscillator.connect(envelope);envelope.connect(gain.current!);oscillator.start(now);oscillator.stop(now+3.6);oscillator.onended=()=>{oscillator.disconnect();envelope.disconnect();};};
        await context.resume();note();sequence.current=setInterval(note,1100);
      }else await audio.current.resume();
      setPlaying(true);
    }catch{setAudioError(true);setPlaying(false);}
  }
  async function send() {
    if(!input.trim()||sending.current||!connected)return;
    sending.current=true;
    const next:Message[]=[...messages,{role:"user",content:input.trim()}];setMessages(next);setInput("");setBusy(true);setChatError(false);
    try{const response=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:next.slice(-16),language:english?"en":"zh"}),signal:AbortSignal.timeout(45000)});const data=await response.json() as {reply?:string};if(!response.ok||!data.reply)throw new Error("Unavailable");setMessages([...next,{role:"assistant",content:data.reply}]);}
    catch{setMessages(messages);setInput(next[next.length-1].content);setChatError(true);}finally{setBusy(false);sending.current=false;}
  }
  useEffect(()=>{
    const context=(document as Document&{modelContext?:{registerTool:(tool:unknown,options:unknown)=>unknown}}).modelContext;if(!context)return;
    const lifecycle=new AbortController();
    try { Promise.resolve(context.registerTool({name:"start_quiet_time",title:"Start quiet time",description:"Start 1, 3 or 5 minutes of quiet prayer and open the quiet view.",inputSchema:{type:"object",properties:{minutes:{type:"integer",enum:[1,3,5]}},required:["minutes"],additionalProperties:false},annotations:{readOnlyHint:false},execute:async(input:unknown)=>{const m=(input as {minutes?:number})?.minutes;if(!m||![1,3,5].includes(m))throw new Error("Choose 1, 3 or 5 minutes");startQuiet(m);return{started:true,minutes:m};}},{signal:lifecycle.signal})).catch(()=>{}); } catch { /* optional browser capability */ }
    return()=>lifecycle.abort();
  },[]);
  const dayLabel=date?date.toLocaleDateString(english?"en-US":"zh-CN",{month:"long",day:"numeric",weekday:"long"}):t("今天","Today");

  return <main>
    <header className="topbar"><a className="brand" href="/" aria-label={t("与神同行首页","God With Me home")}><span className="brand-mark">✦</span><span>{t("与神同行","God With Me")}<small>{t("GOD WITH ME","与神同行")}</small></span></a><span className="date">{dayLabel}</span><button className="language-button" onClick={changeLanguage} aria-label={t("Switch to English","切换到中文")}><Languages size={17}/>{english?"中文":"English"}</button></header>
    <div className="workspace">
      <div className="intro"><p className="eyebrow">{t("每天一点安静 · YOUR DAILY SANCTUARY","YOUR DAILY SANCTUARY")}</p><h1>{t("心里有平安，脚下有行动。","A quiet heart. A faithful step.")}</h1><p>{t("早晨带着盼望出发，晚上带着恩典回望。","Begin with intention. Return with gratitude.")}</p></div>
      <div className="columns"><section className="main-panel">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mode-tabs"><TabsTrigger value="morning"><Sun size={16}/>{t("早晨计划","Morning")}</TabsTrigger><TabsTrigger value="evening"><Moon size={16}/>{t("晚间回望","Evening")}</TabsTrigger><TabsTrigger value="quiet"><Leaf size={16}/>{t("安静时刻","Be still")}</TabsTrigger><TabsTrigger value="talk"><Heart size={16}/>{t("心里话","Talk")}</TabsTrigger></TabsList>
          <TabsContent value="morning" forceMount hidden={tab!=="morning"}><Journal english={english} evening={false} active={tab==="morning"} selectedDate={journalDate} onDateChange={setJournalDate} onQuiet={()=>startQuiet(1)}/></TabsContent>
          <TabsContent value="evening" forceMount hidden={tab!=="evening"}><Journal english={english} evening={true} active={tab==="evening"} selectedDate={journalDate} onDateChange={setJournalDate} onQuiet={()=>startQuiet(1)}/></TabsContent>
          <TabsContent value="quiet"><div className="quiet-content"><div className="section-kicker"><span>{t("静心 / 祷告","STILLNESS / PRAYER")}</span><span>{t("不必急着找到答案","No need to rush an answer")}</span></div><div className={`breathing-circle ${running?"breathing":""}`}><span className="circle-symbol">✦</span><span className="timer">{String(Math.floor(remaining/60)).padStart(2,"0")}<span>:</span>{String(remaining%60).padStart(2,"0")}</span><span>{running?t("轻轻呼吸，让心安静","Breathe gently. Be present."):finished?t("带着平安，回到今天","Return to your day in peace."):t("给心留一点空间","Make a little room for stillness.")}</span></div><div className="duration" aria-label={t("安静时长","Quiet time duration")}>{[1,3,5].map(m=><button key={m} aria-pressed={duration===m} disabled={running} className={duration===m?"selected":""} onClick={()=>{setDuration(m);setRemaining(m*60);setFinished(false);}}>{m} {t("分钟","min")}</button>)}</div><div className="timer-actions"><button className="primary" onClick={toggleTimer}>{running?<Pause size={17}/>:<Play size={17}/>} {running?t("暂停片刻","Pause"):remaining===duration*60?t("开始安静","Begin quiet time"):finished?t("再安静一会儿","Begin again"):t("继续安静","Continue")}</button><button className="icon-button" aria-label={t("重置计时","Reset timer")} onClick={()=>{setRunning(false);setRemaining(duration*60);setFinished(false);}}><RotateCcw size={18}/></button></div><p className="quiet-prayer" aria-live="polite">{finished?t("安静时间结束。此刻，有什么是你可以忠心去做的小事？","Your quiet time is complete. What small thing can you faithfully do next?"):t("「神啊，求你帮助我安静，明白今天该尽的责任。」","“God, help me be still and see what is mine to do today.”")}</p></div></TabsContent>
          <TabsContent value="talk"><div className="talk-content"><div className="section-kicker"><span>{t("倾诉 / 陪伴","SHARE / REFLECT")}</span><span>{connected===null?t("正在检查连接","Checking connection"):connected?t("AI 陪伴已连接","AI companion connected"):t("AI 陪伴尚未连接","AI companion not connected")}</span></div><h2>{t("今天，心里装着什么？","What is on your heart?")}</h2><p className="muted">{t("可以是感恩，也可以是说不清的疲惫。我们一起祷告、分辨，再找到一个实际的下一步。","Gratitude, uncertainty, or a tiredness you cannot name. Reflect, pray, and find one practical next step.")}</p><div className="conversation" role="log" aria-label={t("陪伴对话","Companion conversation")}>{messages.length===0&&<div className="welcome"><Sparkles size={22}/><p>{t("你不需要把话整理好才开口。","You do not need to find perfect words.")}</p><p className="muted">{connected?t("从此刻最真实的感受开始吧。","Start with how you really feel."):t("连接 AI 服务后，即可获得针对你心事的回应。现在也可以使用安静祷告与早晚记录。","Connect the AI service for personal responses. Quiet prayer and your daily journal are ready to use now.")}</p></div>}{messages.map((m,i)=><div key={i} className={`message ${m.role}`}><small>{m.role==="user"?t("我","You"):t("同行陪伴","Companion")}</small><p>{m.content}</p></div>)}{busy&&<p className="muted" role="status">{t("正在认真读你的心事…","Taking a moment with your words…")}</p>}<div ref={chatEnd}/></div><form onSubmit={e=>{e.preventDefault();void send();}}><label className="sr-only" htmlFor="message">{t("写下你的心事","Write what is on your heart")}</label><textarea id="message" maxLength={3000} value={input} onChange={e=>setInput(e.target.value)} placeholder={t("我今天感觉……","Today I feel…")}/><div className="composer-footer"><small>{t("对话不在此设备保存；发送后交由 AI 处理。","Chats are not saved here. Sent messages are processed by AI.")}</small><button className="primary" disabled={!input.trim()||busy||!connected} type="submit"><Send size={16}/>{t("发送","Send")}</button></div></form>{chatError&&<p role="alert" className="error">{t("暂时无法回应。你的文字还在，请稍后重新发送。","The companion could not respond. Your words are still here; please try again.")}</p>}<p className="fineprint">{t("这是信仰陪伴工具，不代表神发言。内心的感受可以结合经文、现实与可信任的属灵同伴一起分辨。","This companion does not speak for God. Consider your impressions alongside Scripture, everyday reality, and trusted spiritual counsel.")}</p></div></TabsContent>
        </Tabs>
      </section><aside>
        <section className="verse-card"><p className="eyebrow">{t("今日经文","TODAY’S SCRIPTURE")}</p><span className="quote-mark">“</span><blockquote>{t(reading.zh,reading.en)}</blockquote><p className="verse-source">{t(reading.sourceZh,reading.sourceEn)}</p><div className="divider"/><p className="verse-prompt">{t(reading.promptZh,reading.promptEn)}</p></section>
        <section className="step-card"><div className="card-heading"><span className="small-icon"><Leaf size={18}/></span><h2>{t("信仰，落在小事里","Faith in the everyday")}</h2></div><p>{t("先做好眼前这一件，就很好。","One thing, done with care, is enough for this moment.")}</p><div className="grounding-note">{t("放松肩膀，喝口水。把注意力带回今天能尽的责任。","Relax your shoulders. Drink some water. Return to one thing you can take care of today.")}</div><button className="text-button" onClick={()=>{setJournalDate(localDate());setTab("morning");}}>{t("回到今天的行动清单","Return to today’s actions")}</button><div className="reminder-row"><button onClick={()=>{setRemind(!remind);setReminder(false);}} aria-pressed={remind}>{remind?t("取消提醒","Cancel reminder"):t("20 分钟后提醒我回到当下","Remind me in 20 minutes")}</button><small>{remind?t("已开启 · 请保持页面打开","Reminder on · Keep this page open"):t("页面打开时提醒，不发送推送","In-page reminder · No push notifications")}</small></div></section>
      </aside></div>
      <footer className="music-bar"><div className="music-description"><span className="music-icon"><Music2 size={22}/></span><div><strong>{t("柔和旋律","Gentle tones")}</strong><small>{playing?t("正在播放 · 轻柔的循环旋律","Playing · A gentle, repeating melody"):t("背景音乐 · 让心慢慢安静","Background music · A little room to breathe")}</small></div></div><button className="music-play" aria-label={playing?t("暂停背景音乐","Pause music"):t("播放背景音乐","Play music")} onClick={()=>void toggleMusic()}>{playing?<Pause size={19}/>:<Play size={19}/>}</button><div className="volume"><Volume2 size={18}/><Slider aria-label={t("背景音乐音量","Music volume")} min={0} max={100} value={[volume]} onValueChange={v=>setVolume(v[0])}/><span>{volume}%</span></div><span className="music-caption">{t("无需言语，也可以停留。","There is room for silence.")}</span>{audioError&&<p role="alert" className="error">{t("暂时无法播放，请再试一次。","Music could not start. Please try again.")}</p>}</footer>
      <p className="bottom-note">{t("安静聆听 · 谨慎分辨 · 踏实生活","BE STILL · DISCERN WITH CARE · LIVE FAITHFULLY")}</p>
    </div>{reminder&&<div className="reminder-banner" role="alert"><div><strong>{t("先回到眼前的一小步。","Return to one small step.")}</strong><p>{t("放松肩膀，喝口水。此刻你能踏实完成什么？","Relax your shoulders. Drink some water. What can you practically do right now?")}</p></div><button className="primary" onClick={()=>setReminder(false)}>{t("我知道了","I’m here")}</button></div>}
  </main>;
}
