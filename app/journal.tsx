"use client";
import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Sun, Moon, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { emptyDay, localDate, parseDay, validDay, type DayRecord } from "@/lib/journal";

type Props = { english: boolean; evening: boolean; onQuiet: () => void; active: boolean; selectedDate: string; onDateChange: (date: string) => void };
export function Journal({ english, evening, onQuiet, active, selectedDate, onDateChange }: Props) {
  const t = (zh: string, en: string) => english ? en : zh;
  const [date, setDate] = useState("");
  const [record, setRecord] = useState<DayRecord>(emptyDay);
  const [draft, setDraft] = useState("");
  const [saveState, setSaveState] = useState<"idle"|"saved"|"error">("idle");
  const [ready, setReady] = useState(false);
  const [readError, setReadError] = useState(false);
  const [deleted, setDeleted] = useState<{item:DayRecord["items"][number]; index:number}|null>(null);
  const recordRef = useRef(record);
  const dateRef = useRef(date);
  const key = (day: string) => `godwithme-journal-v1:${day}`;
  function load(day: string) {
    if (!validDay(day)) return;
    setReady(false); setReadError(false); setDeleted(null); setDraft("");
    try {
      const data = parseDay(localStorage.getItem(key(day)));
      recordRef.current = data; setRecord(data); setDate(day); dateRef.current = day; setSaveState("idle"); setReady(true); onDateChange(day);
    } catch { setReadError(true); }
  }
  useEffect(() => { if (active && saveState !== "error") load(selectedDate || localDate()); }, [active, selectedDate]);
  function persist(next: DayRecord) {
    recordRef.current = next; setRecord(next);
    try { localStorage.setItem(key(dateRef.current), JSON.stringify(next)); setSaveState("saved"); } catch { setSaveState("error"); }
  }
  useEffect(() => {
    const leave = (e: BeforeUnloadEvent) => { if (saveState === "error") e.preventDefault(); };
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, [saveState]);
  function navigate(day: string) { if (saveState === "error") return; load(day); }
  function shift(amount: number) { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate()+amount); navigate(localDate(d)); }
  function add() { const text = draft.trim(); if (!text || !ready) return; persist({...recordRef.current,items:[...recordRef.current.items,{id:crypto.randomUUID(),text,done:false}]}); setDraft(""); }
  const count = record.items.filter(i => i.done).length;
  return <div className="journal-content">
    <div className="section-kicker"><span>{evening?t("晚间 / 回望","EVENING / REFLECT"):t("早晨 / 行动","MORNING / INTENTION")}</span><span>{t("一小步，也算数","Small steps count")}</span></div>
    <div className="journal-title">{evening?<Moon size={23}/>:<Sun size={23}/>}<h2>{evening?t("看见今天走过的路。","Notice how far you came."):t("今天，踏实做哪几件事？","What matters today?")}</h2></div>
    <p className="muted">{evening?t("勾选已完成的事，也记下计划之外的付出。不用用完成率衡量自己的价值。","Check off what you did, and notice the effort beyond your plans. Your worth is more than a completed list."):t("从一到三件实际的小事开始，把今天交托给神，也尽好自己的责任。","Start with one to three realistic actions. Entrust the day to God, and care for what is yours to do.")}</p>
    <div className="journal-date"><button className="icon-button" disabled={!ready || saveState==='error'} onClick={()=>shift(-1)} aria-label={t("前一天","Previous day")}><ChevronLeft size={18}/></button><label><span className="sr-only">{t("记录日期","Journal date")}</span><input type="date" value={date} disabled={saveState==='error'} onChange={e=>navigate(e.target.value)}/></label><button className="icon-button" disabled={!ready || saveState==='error'} onClick={()=>shift(1)} aria-label={t("后一天","Next day")}><ChevronRight size={18}/></button><button className="text-button" disabled={saveState==='error'} onClick={()=>navigate(localDate())}>{t("今天","Today")}</button></div>
    {readError?<div role="alert" className="error">{t("暂时无法读取记录，原有内容未被覆盖。请允许浏览器存储后重试。","Your journal could not be read. Existing entries have not been overwritten. Enable browser storage and try again.")}<button className="text-button" onClick={()=>load(date || localDate())}>{t("重试","Retry")}</button></div>:<>
    <div className="list-heading"><h3>{t("行动清单","Action items")}</h3><span>{count} / {record.items.length} {t("已完成","done")}</span></div>
    <ul className="action-list">{record.items.map(item=><li key={item.id} className={item.done?"item-done":""}><Checkbox aria-label={`${t("完成","Complete")}: ${item.text}`} checked={item.done} onCheckedChange={checked=>persist({...recordRef.current,items:recordRef.current.items.map(i=>i.id===item.id?{...i,done:checked===true}:i)})}/><input aria-label={t("编辑行动事项","Edit action item")} value={item.text} maxLength={250} onChange={e=>persist({...recordRef.current,items:recordRef.current.items.map(i=>i.id===item.id?{...i,text:e.target.value}:i)})}/><button className="delete-action" aria-label={`${t("删除","Remove")}: ${item.text}`} onClick={()=>{setDeleted({item,index:record.items.findIndex(i=>i.id===item.id)});persist({...recordRef.current,items:recordRef.current.items.filter(i=>i.id!==item.id)});}}><Trash2 size={15}/></button></li>)}</ul>
    {record.items.length===0&&<div className="journal-empty">{evening?t("今天还没有清单。你仍然可以写下做过的事。","No list for this day yet. You can still record what you accomplished."):t("留一点空间，给今天真正重要的事。","Make room for what matters today.")}</div>}
    {deleted&&<p className="undo-row">{t("事项已移除。","Item removed.")} <button className="text-button" onClick={()=>{const items=[...recordRef.current.items];items.splice(deleted.index,0,deleted.item);persist({...recordRef.current,items});setDeleted(null);}}>{t("撤销","Undo")}</button></p>}
    <form className="add-action" onSubmit={e=>{e.preventDefault();add();}}><label htmlFor={`new-action-${evening}`} className="sr-only">{t("新的行动事项","New action item")}</label><input id={`new-action-${evening}`} value={draft} maxLength={250} disabled={!ready} onChange={e=>setDraft(e.target.value)} placeholder={t("例如：专心工作 20 分钟","e.g. Focus on one task for 20 minutes")}/><button className="primary" type="submit" disabled={!ready||!draft.trim()} aria-label={t("添加事项","Add action item")}><Plus size={18}/><span>{t("添加","Add")}</span></button></form>
    {evening&&<div className="evening-fields"><label htmlFor="accomplishments">{t("今天完成了什么？","What did you accomplish today?")}</label><textarea id="accomplishments" value={record.accomplishments} maxLength={10000} onChange={e=>persist({...recordRef.current,accomplishments:e.target.value})} placeholder={t("记下完成的事、付出的努力，或照顾好自己的一个瞬间……","Include finished tasks, effort you made, or a moment you cared for yourself…")}/><label htmlFor="gratitude">{t("今天的感恩与交托","Gratitude and what you entrust to God")}</label><textarea id="gratitude" value={record.gratitude} maxLength={10000} onChange={e=>persist({...recordRef.current,gratitude:e.target.value})} placeholder={t("哪里感受到被关心？还有什么愿意带到神面前？","Where did you feel cared for? What would you like to bring before God?")}/></div>}
    <div className="journal-status" role="status">{saveState==='saved'?<Check size={14}/>:null}{saveState==='error'?t("保存失败，内容暂留在当前页面。请先重试保存，再切换日期。","Save failed. Your edits are still on this page. Retry before changing dates."):saveState==='saved'?t("已自动保存在此设备 · 不会上传","Autosaved on this device · Not uploaded"):t("记录只保存在此浏览器；清除浏览器数据会删除记录。","Entries stay in this browser. Clearing browser data removes them.")}{saveState==='error'&&<button className="text-button" onClick={()=>persist(recordRef.current)}>{t("重试保存","Retry save")}</button>}</div>
    </>}
    <div className="journal-prayer"><p>{evening?t("神啊，谢谢你今天的恩典。求你赐我休息的平安，和明天实践爱的力量。","God, thank you for today’s grace. Grant me peace to rest, and strength to put love into practice tomorrow."):t("神啊，求你引导我的心，也帮助我忠心做好眼前的小事。","God, guide my heart, and help me faithfully attend to the small things before me.")}</p><button className="text-button" onClick={onQuiet}>{t("先安静一分钟","Take a quiet minute")}</button></div>
  </div>;
}
