import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../lib/api";
import Layout from "../components/Layout";
import { Megaphone, Plus, Search, Edit2, Trash2, X, ChevronDown, AlertCircle, Target, DollarSign, Calendar, TrendingUp, Mail, Globe, MousePointer, BarChart2 } from "lucide-react";

const TYPES = ["email","social","ppc","content","event","webinar","referral","direct_mail","other"];
const STATUSES = ["draft","active","paused","completed","cancelled"];

function TypeIcon({ type }: { type: string }) {
  const map:Record<string,any>={email:Mail,social:Globe,ppc:MousePointer,content:BarChart2};
  const Icon=map[type]||Megaphone;
  return <Icon size={14}/>;
}

function StatusBadge({ status }: { status: string }) {
  const map:Record<string,{bg:string,color:string}>={
    draft:{bg:"rgba(107,114,128,0.12)",color:"#9ca3af"},
    active:{bg:"rgba(34,197,94,0.12)",color:"#4ade80"},
    paused:{bg:"rgba(245,158,11,0.12)",color:"#fbbf24"},
    completed:{bg:"rgba(99,102,241,0.12)",color:"#818cf8"},
    cancelled:{bg:"rgba(239,68,68,0.12)",color:"#f87171"},
  };
  const s=map[status]||map.draft;
  return <span style={{display:"inline-flex",padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:600,background:s.bg,color:s.color}}>{status}</span>;
}

const EMPTY={name:"",type:"email",status:"draft",startDate:"",endDate:"",budget:"",actualCost:"",targetAudience:"",goals:""};

export default function CampaignsPage() {
  const [search,setSearch]=useState("");
  const [tf,setTf]=useState("all");
  const [sf,setSf]=useState("all");
  const [modal,setModal]=useState(false);
  const [editing,setEditing]=useState<any>(null);
  const [form,setForm]=useState<typeof EMPTY>(EMPTY);
  const [del,setDel]=useState<string|null>(null);
  const [sel,setSel]=useState<any>(null);

  const { data:campaigns=[], isLoading } = useQuery<any[]>({ queryKey:["/api/campaigns"] });

  const create = useMutation({ mutationFn:(d:any)=>apiRequest("POST","/api/campaigns",d), onSuccess:()=>{ queryClient.invalidateQueries({queryKey:["/api/campaigns"]}); close(); }});
  const upd = useMutation({ mutationFn:({id,d}:any)=>apiRequest("PUT",`/api/campaigns/${id}`,d), onSuccess:()=>{ queryClient.invalidateQueries({queryKey:["/api/campaigns"]}); close(); }});
  const rm = useMutation({ mutationFn:(id:string)=>apiRequest("DELETE",`/api/campaigns/${id}`), onSuccess:()=>{ queryClient.invalidateQueries({queryKey:["/api/campaigns"]}); setDel(null); setSel(null); }});

  function open(c?:any){
    setEditing(c||null);
    setForm(c?{name:c.name||"",type:c.type||"email",status:c.status||"draft",startDate:c.startDate?c.startDate.split("T")[0]:"",endDate:c.endDate?c.endDate.split("T")[0]:"",budget:c.budget||"",actualCost:c.actualCost||"",targetAudience:c.targetAudience||"",goals:c.goals||""}:EMPTY);
    setModal(true);
  }
  function close(){ setModal(false); setEditing(null); setForm(EMPTY); }

  function submit(e:React.FormEvent){
    e.preventDefault();
    const p={...form,budget:form.budget?Number(form.budget):null,actualCost:form.actualCost?Number(form.actualCost):null,startDate:form.startDate||null,endDate:form.endDate||null};
    editing?upd.mutate({id:editing.id,d:p}):create.mutate(p);
  }

  const filtered=campaigns.filter((c:any)=>{
    const ms=!search||[c.name,c.targetAudience,c.goals].some((v:any)=>v?.toLowerCase().includes(search.toLowerCase()));
    return ms&&(tf==="all"||c.type===tf)&&(sf==="all"||c.status===sf);
  });

  const totalBudget=campaigns.reduce((s:number,c:any)=>s+(Number(c.budget)||0),0);
  const totalSpent=campaigns.reduce((s:number,c:any)=>s+(Number(c.actualCost)||0),0);
  const active=campaigns.filter((c:any)=>c.status==="active").length;

  const th={padding:"10px 14px",textAlign:"left" as const,fontSize:11,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:"0.05em",color:"var(--text-muted)",whiteSpace:"nowrap" as const};
  const L=(lbl:string,key:keyof typeof EMPTY,type="text",full=false,req=false)=>(
    <div style={full?{gridColumn:"1/-1"}:{}}>
      <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:5,color:"var(--text-secondary)"}}>{lbl}</label>
      <input data-testid={`input-${key}`} value={form[key]} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))} type={type} required={req} style={{width:"100%",padding:"9px 12px",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text-primary)",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
    </div>
  );

  return (
    <Layout title="Campaigns" subtitle={`${filtered.length} campaigns`} actions={
      <button data-testid="button-add-campaign" onClick={()=>open()} style={{display:"flex",alignItems:"center",gap:6,background:"var(--accent)",color:"#fff",border:"none",borderRadius:8,padding:"7px 14px",fontSize:13,fontWeight:600,cursor:"pointer"}}><Plus size={14}/>New Campaign</button>
    }>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {[{l:"Total Campaigns",v:campaigns.length,I:Megaphone,c:"#6366f1"},{l:"Active",v:active,I:TrendingUp,c:"#22c55e"},{l:"Total Budget",v:`$${totalBudget.toLocaleString()}`,I:DollarSign,c:"#f59e0b"},{l:"Total Spent",v:`$${totalSpent.toLocaleString()}`,I:Target,c:"#3b82f6"}].map(s=>(
          <div key={s.l} style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:10,padding:"14px 16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div><div style={{fontSize:11,color:"var(--text-muted)",marginBottom:4}}>{s.l}</div><div style={{fontSize:22,fontWeight:700}}>{s.v}</div></div><div style={{background:`${s.c}20`,borderRadius:8,padding:8}}><s.I size={16} style={{color:s.c}}/></div></div>
          </div>
        ))}
      </div>

      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:200,position:"relative"}}><Search size={14} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"var(--text-muted)"}}/><input data-testid="input-search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search campaigns…" style={{width:"100%",paddingLeft:32,paddingRight:12,paddingTop:8,paddingBottom:8,background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text-primary)",fontSize:13,outline:"none",boxSizing:"border-box"}}/></div>
        {[{v:tf,sv:setTf,opts:["all",...TYPES],label:"All Types"},{v:sf,sv:setSf,opts:["all",...STATUSES],label:"All Statuses"}].map((s,i)=>(
          <div key={i} style={{position:"relative"}}>
            <select value={s.v} onChange={e=>s.sv(e.target.value)} style={{paddingLeft:12,paddingRight:28,paddingTop:8,paddingBottom:8,background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text-primary)",fontSize:13,outline:"none",appearance:"none",cursor:"pointer"}}>
              {s.opts.map(o=><option key={o} value={o}>{o==="all"?s.label:o[0].toUpperCase()+o.slice(1).replace("_"," ")}</option>)}
            </select>
            <ChevronDown size={12} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",color:"var(--text-muted)",pointerEvents:"none"}}/>
          </div>
        ))}
      </div>

      <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:10,overflow:"hidden"}}>
        {isLoading?<div style={{padding:48,textAlign:"center",color:"var(--text-muted)"}}>Loading…</div>:filtered.length===0?(
          <div style={{padding:64,textAlign:"center"}}><Megaphone size={36} style={{color:"var(--text-muted)",marginBottom:12,opacity:0.4}}/><div style={{fontSize:15,fontWeight:600,marginBottom:6}}>No campaigns found</div><div style={{fontSize:13,color:"var(--text-muted)",marginBottom:16}}>{search?"Try a different search":"Launch your first campaign"}</div>{!search&&<button onClick={()=>open()} style={{background:"var(--accent)",color:"#fff",border:"none",borderRadius:8,padding:"8px 18px",fontSize:13,cursor:"pointer",fontWeight:600}}>New Campaign</button>}</div>
        ):(
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{borderBottom:"1px solid var(--border)",background:"var(--bg-overlay)"}}>{["Campaign","Type","Status","Budget","Spent","Dates",""].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((c:any,i:number)=>(
                <tr key={c.id} data-testid={`row-campaign-${c.id}`} style={{borderBottom:i<filtered.length-1?"1px solid var(--border)":"none",cursor:"pointer",transition:"background 0.15s"}} onMouseEnter={e=>(e.currentTarget.style.background="var(--bg-overlay)")} onMouseLeave={e=>(e.currentTarget.style.background="transparent")} onClick={()=>setSel(c)}>
                  <td style={{padding:"12px 14px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",flexShrink:0}}><TypeIcon type={c.type}/></div>
                      <div><div style={{fontWeight:600,fontSize:13}}>{c.name}</div>{c.targetAudience&&<div style={{fontSize:11,color:"var(--text-muted)"}}>{c.targetAudience}</div>}</div>
                    </div>
                  </td>
                  <td style={{padding:"12px 14px",fontSize:13,color:"var(--text-secondary)"}}>{c.type?.replace("_"," ")}</td>
                  <td style={{padding:"12px 14px"}}><StatusBadge status={c.status}/></td>
                  <td style={{padding:"12px 14px",fontSize:13,fontWeight:600}}>{c.budget?`$${Number(c.budget).toLocaleString()}`:"—"}</td>
                  <td style={{padding:"12px 14px",fontSize:13,color:"var(--text-secondary)"}}>{c.actualCost?`$${Number(c.actualCost).toLocaleString()}`:"—"}</td>
                  <td style={{padding:"12px 14px",fontSize:12,color:"var(--text-muted)"}}>{c.startDate?new Date(c.startDate).toLocaleDateString():"—"}{c.endDate&&<> → {new Date(c.endDate).toLocaleDateString()}</>}</td>
                  <td style={{padding:"12px 14px"}} onClick={e=>e.stopPropagation()}>
                    <div style={{display:"flex",gap:4}}>
                      <button data-testid={`button-edit-${c.id}`} onClick={()=>open(c)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",padding:5,borderRadius:6,display:"flex"}}><Edit2 size={13}/></button>
                      <button data-testid={`button-delete-${c.id}`} onClick={()=>setDel(c.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",padding:5,borderRadius:6,display:"flex"}}><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {sel&&(
        <div style={{position:"fixed",right:0,top:0,bottom:0,width:340,background:"var(--bg-card)",borderLeft:"1px solid var(--border)",zIndex:50,overflowY:"auto"}}>
          <div style={{padding:"16px 20px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontSize:15,fontWeight:700}}>Campaign Details</div><button onClick={()=>setSel(null)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",padding:4}}><X size={16}/></button></div>
          <div style={{padding:20}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
              <div style={{width:48,height:48,borderRadius:10,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}}><TypeIcon type={sel.type}/></div>
              <div><div style={{fontSize:17,fontWeight:700}}>{sel.name}</div><StatusBadge status={sel.status}/></div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {[{l:"Type",v:sel.type?.replace("_"," ")},{l:"Target Audience",v:sel.targetAudience},{l:"Goals",v:sel.goals},{l:"Budget",v:sel.budget?`$${Number(sel.budget).toLocaleString()}`:null},{l:"Actual Cost",v:sel.actualCost?`$${Number(sel.actualCost).toLocaleString()}`:null},{l:"Start Date",v:sel.startDate?new Date(sel.startDate).toLocaleDateString():null},{l:"End Date",v:sel.endDate?new Date(sel.endDate).toLocaleDateString():null}].filter(f=>f.v).map(f=>(
                <div key={f.l}><div style={{fontSize:10,color:"var(--text-muted)",marginBottom:2}}>{f.l}</div><div style={{fontSize:13}}>{f.v}</div></div>
              ))}
              {sel.budget&&sel.actualCost&&(
                <div style={{marginTop:8}}>
                  <div style={{fontSize:10,color:"var(--text-muted)",marginBottom:6}}>Budget Utilization</div>
                  <div style={{height:6,background:"var(--bg-overlay)",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",background:"var(--accent)",borderRadius:3,width:`${Math.min(100,Number(sel.actualCost)/Number(sel.budget)*100)}%`}}/></div>
                  <div style={{fontSize:11,color:"var(--text-muted)",marginTop:4}}>{Math.round(Number(sel.actualCost)/Number(sel.budget)*100)}% used</div>
                </div>
              )}
            </div>
            <div style={{display:"flex",gap:8,marginTop:20}}>
              <button onClick={()=>{open(sel);setSel(null);}} style={{flex:1,background:"var(--accent)",color:"#fff",border:"none",borderRadius:8,padding:"8px 0",fontSize:13,fontWeight:600,cursor:"pointer"}}>Edit</button>
              <button onClick={()=>setDel(sel.id)} style={{background:"rgba(239,68,68,0.1)",color:"#ef4444",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8,padding:"8px 14px",fontSize:13,cursor:"pointer"}}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {del&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:12,padding:28,maxWidth:380,width:"90%"}}>
            <div style={{display:"flex",gap:12,marginBottom:16}}><AlertCircle size={20} style={{color:"#ef4444",flexShrink:0,marginTop:2}}/><div><div style={{fontWeight:700,marginBottom:4}}>Delete Campaign?</div><div style={{fontSize:13,color:"var(--text-muted)"}}>This cannot be undone.</div></div></div>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setDel(null)} style={{background:"var(--bg-overlay)",border:"1px solid var(--border)",borderRadius:8,padding:"8px 16px",fontSize:13,cursor:"pointer"}}>Cancel</button><button onClick={()=>rm.mutate(del!)} disabled={rm.isPending} style={{background:"#ef4444",color:"#fff",border:"none",borderRadius:8,padding:"8px 16px",fontSize:13,fontWeight:600,cursor:"pointer"}}>{rm.isPending?"Deleting…":"Delete"}</button></div>
          </div>
        </div>
      )}

      {modal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:14,width:"100%",maxWidth:580,maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{padding:"18px 22px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontSize:16,fontWeight:700}}>{editing?"Edit Campaign":"New Campaign"}</div><button onClick={close} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",padding:4}}><X size={16}/></button></div>
            <form onSubmit={submit} style={{padding:"20px 22px"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                {L("Campaign Name *","name","text",true,true)}
                <div>
                  <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:5,color:"var(--text-secondary)"}}>Type</label>
                  <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} style={{width:"100%",padding:"9px 12px",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text-primary)",fontSize:13,outline:"none",appearance:"none"}}>
                    {TYPES.map(t=><option key={t} value={t}>{t[0].toUpperCase()+t.slice(1).replace("_"," ")}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:5,color:"var(--text-secondary)"}}>Status</label>
                  <select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))} style={{width:"100%",padding:"9px 12px",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text-primary)",fontSize:13,outline:"none",appearance:"none"}}>
                    {STATUSES.map(s=><option key={s} value={s}>{s[0].toUpperCase()+s.slice(1)}</option>)}
                  </select>
                </div>
                {L("Budget ($)","budget","number")}
                {L("Actual Cost ($)","actualCost","number")}
                {L("Start Date","startDate","date")}
                {L("End Date","endDate","date")}
                <div style={{gridColumn:"1/-1"}}><label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:5,color:"var(--text-secondary)"}}>Target Audience</label><input value={form.targetAudience} onChange={e=>setForm(p=>({...p,targetAudience:e.target.value}))} placeholder="e.g. SMB decision makers, 50-200 employees" style={{width:"100%",padding:"9px 12px",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text-primary)",fontSize:13,outline:"none",boxSizing:"border-box"}}/></div>
                <div style={{gridColumn:"1/-1"}}><label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:5,color:"var(--text-secondary)"}}>Goals</label><textarea value={form.goals} onChange={e=>setForm(p=>({...p,goals:e.target.value}))} rows={2} placeholder="e.g. Generate 50 qualified leads, increase brand awareness" style={{width:"100%",padding:"9px 12px",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text-primary)",fontSize:13,outline:"none",resize:"vertical",boxSizing:"border-box"}}/></div>
              </div>
              <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                <button type="button" onClick={close} style={{background:"var(--bg-overlay)",border:"1px solid var(--border)",borderRadius:8,padding:"9px 18px",fontSize:13,cursor:"pointer"}}>Cancel</button>
                <button data-testid="button-submit-campaign" type="submit" disabled={create.isPending||upd.isPending} style={{background:"var(--accent)",color:"#fff",border:"none",borderRadius:8,padding:"9px 20px",fontSize:13,fontWeight:600,cursor:"pointer"}}>{create.isPending||upd.isPending?"Saving…":editing?"Save Changes":"Launch Campaign"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
