import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../lib/api";
import Layout from "../components/Layout";
import { useLanguage } from "../contexts/LanguageContext";
import { Building2, Plus, Search, Edit2, Trash2, Globe, Phone, Mail, MapPin, Users, DollarSign, X, ChevronDown, Filter, TrendingUp, AlertCircle } from "lucide-react";

const INDUSTRIES = ["Technology","Healthcare","Finance","Retail","Manufacturing","Education","Real Estate","Media","Legal","Consulting","Other"];
const STATUSES = ["active","inactive","prospect","churned"];

function StatusBadge({ status }: { status: string }) {
  const c:Record<string,string>={active:"background:rgba(34,197,94,0.12);color:#4ade80;border:1px solid rgba(34,197,94,0.2)",inactive:"background:rgba(107,114,128,0.12);color:#9ca3af;border:1px solid rgba(107,114,128,0.2)",prospect:"background:rgba(59,130,246,0.12);color:#60a5fa;border:1px solid rgba(59,130,246,0.2)",churned:"background:rgba(239,68,68,0.12);color:#f87171;border:1px solid rgba(239,68,68,0.2)"};
  const s = c[status]||c.inactive;
  return <span style={{display:"inline-flex",alignItems:"center",padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:600,...Object.fromEntries(s.split(";").map((p:string)=>{const[k,v]=p.split(":");return[k.trim().replace(/-./g,m=>m[1].toUpperCase()),v?.trim()]}).filter(([k,v])=>k&&v))}}>{status}</span>;
}

const EMPTY = { name:"",industry:"",website:"",phone:"",email:"",city:"",state:"",country:"",annualRevenue:"",employeeCount:"",status:"active",notes:"" };

export default function AccountsPage() {
  const { t } = useLanguage();
  const [search,setSearch]=useState("");
  const [sf,setSf]=useState("all");
  const [modal,setModal]=useState(false);
  const [editing,setEditing]=useState<any>(null);
  const [form,setForm]=useState<typeof EMPTY>(EMPTY);
  const [del,setDel]=useState<string|null>(null);
  const [sel,setSel]=useState<any>(null);

  const { data:accountsResp, isLoading } = useQuery<{ data: any[]; total: number }>({ queryKey:["/api/accounts"] });
  const accounts = accountsResp?.data ?? [];

  const create = useMutation({ mutationFn:(d:any)=>apiRequest("POST","/api/accounts",d), onSuccess:()=>{ queryClient.invalidateQueries({queryKey:["/api/accounts"]}); close(); }});
  const upd = useMutation({ mutationFn:({id,d}:any)=>apiRequest("PUT",`/api/accounts/${id}`,d), onSuccess:()=>{ queryClient.invalidateQueries({queryKey:["/api/accounts"]}); close(); }});
  const rm = useMutation({ mutationFn:(id:string)=>apiRequest("DELETE",`/api/accounts/${id}`), onSuccess:()=>{ queryClient.invalidateQueries({queryKey:["/api/accounts"]}); setDel(null); setSel(null); }});

  function open(a?:any){ setEditing(a||null); setForm(a?{...EMPTY,...a,annualRevenue:a.annualRevenue||"",employeeCount:a.employeeCount||""}:EMPTY); setModal(true); }
  function close(){ setModal(false); setEditing(null); setForm(EMPTY); }
  function submit(e:React.FormEvent){ e.preventDefault(); const p={...form,annualRevenue:form.annualRevenue?Number(form.annualRevenue):null,employeeCount:form.employeeCount?Number(form.employeeCount):null}; editing?upd.mutate({id:editing.id,d:p}):create.mutate(p); }

  const filtered=accounts.filter((a:any)=>(!search||[a.name,a.industry,a.email].some((v:any)=>v?.toLowerCase().includes(search.toLowerCase())))&&(sf==="all"||a.status===sf));
  const stats={ total:accounts.length, active:accounts.filter((a:any)=>a.status==="active").length, revenue:accounts.reduce((s:number,a:any)=>s+(Number(a.annualRevenue)||0),0), employees:accounts.reduce((s:number,a:any)=>s+(Number(a.employeeCount)||0),0) };

  const F=(label:string,key:keyof typeof EMPTY,type="text",full=false,req=false,ph="")=>(
    <div style={full?{gridColumn:"1/-1"}:{}}>
      <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:5,color:"var(--text-secondary)"}}>{label}</label>
      <input data-testid={`input-${key}`} value={form[key]} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))} type={type} required={req} placeholder={ph} style={{width:"100%",padding:"9px 12px",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text-primary)",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
    </div>
  );

  const cardStyle={background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:10,padding:"14px 16px"};
  const th={padding:"10px 14px",textAlign:"left" as const,fontSize:11,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:"0.05em",color:"var(--text-muted)",whiteSpace:"nowrap" as const};

  return (
    <Layout title={t("accounts_title")} subtitle={`${filtered.length} ${t("accounts_subtitle")}`} actions={
      <button data-testid="button-add-account" onClick={()=>open()} style={{display:"flex",alignItems:"center",gap:6,background:"var(--accent)",color:"#fff",border:"none",borderRadius:8,padding:"7px 14px",fontSize:13,fontWeight:600,cursor:"pointer"}}><Plus size={14}/>{t("accounts_new","New Account")}</button>
    }>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {[
          {l:t("accounts_stat_total","Total Accounts"),v:stats.total,I:Building2,c:"#6366f1"},
          {l:t("active"),v:stats.active,I:TrendingUp,c:"#22c55e"},
          {l:t("accounts_stat_revenue","Annual Revenue"),v:`$${(stats.revenue/1e6).toFixed(1)}M`,I:DollarSign,c:"#f59e0b"},
          {l:t("employees"),v:stats.employees.toLocaleString(),I:Users,c:"#3b82f6"}
        ].map(s=>(
          <div key={s.l} style={cardStyle}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div><div style={{fontSize:11,color:"var(--text-muted)",marginBottom:4}}>{s.l}</div><div style={{fontSize:22,fontWeight:700}}>{s.v}</div></div><div style={{background:`${s.c}20`,borderRadius:8,padding:8}}><s.I size={16} style={{color:s.c}}/></div></div></div>
        ))}
      </div>

      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:200,position:"relative"}}>
          <Search size={14} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"var(--text-muted)"}}/>
          <input data-testid="input-search-accounts" value={search} onChange={e=>setSearch(e.target.value)} placeholder={t("accounts_search_ph","Search accounts…")} style={{width:"100%",paddingLeft:32,paddingRight:12,paddingTop:8,paddingBottom:8,background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text-primary)",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
        </div>
        <div style={{position:"relative"}}>
          <Filter size={12} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"var(--text-muted)",pointerEvents:"none"}}/>
          <select data-testid="select-status" value={sf} onChange={e=>setSf(e.target.value)} style={{paddingLeft:28,paddingRight:28,paddingTop:8,paddingBottom:8,background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text-primary)",fontSize:13,outline:"none",appearance:"none",cursor:"pointer"}}>
            <option value="all">{t("accounts_all_statuses","All Statuses")}</option>
            {STATUSES.map(s=><option key={s} value={s}>{s[0].toUpperCase()+s.slice(1)}</option>)}
          </select>
          <ChevronDown size={12} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",color:"var(--text-muted)",pointerEvents:"none"}}/>
        </div>
      </div>

      <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:10,overflow:"hidden"}}>
        {isLoading?<div style={{padding:48,textAlign:"center",color:"var(--text-muted)"}}>{t("loading")}</div>:filtered.length===0?(
          <div style={{padding:64,textAlign:"center"}}><Building2 size={36} style={{color:"var(--text-muted)",marginBottom:12,opacity:0.4}}/><div style={{fontSize:15,fontWeight:600,marginBottom:6}}>{t("accounts_empty_title","No accounts found")}</div><div style={{fontSize:13,color:"var(--text-muted)",marginBottom:16}}>{search?t("accounts_empty_search","Try a different search"):t("no_accounts_desc")}</div>{!search&&<button onClick={()=>open()} style={{background:"var(--accent)",color:"#fff",border:"none",borderRadius:8,padding:"8px 18px",fontSize:13,cursor:"pointer",fontWeight:600}}>{t("add_account_btn")}</button>}</div>
        ):(
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{borderBottom:"1px solid var(--border)",background:"var(--bg-overlay)"}}>
              {[t("company"),t("account_industry"),t("accounts_col_contact","Contact"),t("account_revenue"),t("employees"),t("status"),t("actions")].map(h=><th key={h} style={th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.map((a:any,i:number)=>(
                <tr key={a.id} data-testid={`row-account-${a.id}`} style={{borderBottom:i<filtered.length-1?"1px solid var(--border)":"none",cursor:"pointer",transition:"background 0.15s"}} onMouseEnter={e=>(e.currentTarget.style.background="var(--bg-overlay)")} onMouseLeave={e=>(e.currentTarget.style.background="transparent")} onClick={()=>setSel(a)}>
                  <td style={{padding:"12px 14px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:34,height:34,borderRadius:8,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff",flexShrink:0}}>{a.name?.[0]?.toUpperCase()||"?"}</div>
                      <div><div style={{fontWeight:600,fontSize:13}}>{a.name}</div>{a.website&&<div style={{fontSize:11,color:"var(--text-muted)",display:"flex",alignItems:"center",gap:3}}><Globe size={10}/>{a.website}</div>}</div>
                    </div>
                  </td>
                  <td style={{padding:"12px 14px",fontSize:13,color:"var(--text-secondary)"}}>{a.industry||"—"}</td>
                  <td style={{padding:"12px 14px",fontSize:13}}>{a.email&&<div style={{display:"flex",alignItems:"center",gap:4,color:"var(--text-secondary)"}}><Mail size={11}/>{a.email}</div>}{a.phone&&<div style={{display:"flex",alignItems:"center",gap:4,color:"var(--text-muted)",fontSize:11}}><Phone size={10}/>{a.phone}</div>}</td>
                  <td style={{padding:"12px 14px",fontSize:13,fontWeight:600}}>{a.annualRevenue?`$${Number(a.annualRevenue).toLocaleString()}`:"—"}</td>
                  <td style={{padding:"12px 14px",fontSize:13,color:"var(--text-secondary)"}}>{a.employeeCount?Number(a.employeeCount).toLocaleString():"—"}</td>
                  <td style={{padding:"12px 14px"}}><StatusBadge status={a.status||"active"}/></td>
                  <td style={{padding:"12px 14px"}} onClick={e=>e.stopPropagation()}>
                    <div style={{display:"flex",gap:4}}>
                      <button data-testid={`button-edit-${a.id}`} onClick={()=>open(a)} title={t("edit_account")} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",padding:5,borderRadius:6,display:"flex"}}><Edit2 size={13}/></button>
                      <button data-testid={`button-delete-${a.id}`} onClick={()=>setDel(a.id)} title={t("delete")} style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",padding:5,borderRadius:6,display:"flex"}}><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {sel&&(
        <div style={{position:"fixed",right:0,top:0,bottom:0,width:360,background:"var(--bg-card)",borderLeft:"1px solid var(--border)",zIndex:50,overflowY:"auto"}}>
          <div style={{padding:"16px 20px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontSize:15,fontWeight:700}}>{t("accounts_details_title","Account Details")}</div><button onClick={()=>setSel(null)} aria-label={t("close")} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",padding:4}}><X size={16}/></button></div>
          <div style={{padding:20}}>
            <div style={{width:56,height:56,borderRadius:12,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:700,color:"#fff",marginBottom:12}}>{sel.name?.[0]?.toUpperCase()||"?"}</div>
            <div style={{fontSize:18,fontWeight:700,marginBottom:8}}>{sel.name}</div>
            <StatusBadge status={sel.status||"active"}/>
            <div style={{marginTop:20,display:"flex",flexDirection:"column",gap:12}}>
              {[
                {I:Building2,l:t("account_industry"),v:sel.industry},
                {I:Globe,l:t("account_website"),v:sel.website},
                {I:Mail,l:t("email"),v:sel.email},
                {I:Phone,l:t("phone"),v:sel.phone},
                {I:MapPin,l:t("location"),v:[sel.city,sel.state,sel.country].filter(Boolean).join(", ")},
                {I:DollarSign,l:t("account_revenue"),v:sel.annualRevenue?`$${Number(sel.annualRevenue).toLocaleString()}`:null},
                {I:Users,l:t("employees"),v:sel.employeeCount?Number(sel.employeeCount).toLocaleString():null}
              ].filter(f=>f.v).map(f=>(
                <div key={f.l} style={{display:"flex",gap:10}}><f.I size={14} style={{color:"var(--text-muted)",flexShrink:0,marginTop:2}}/><div><div style={{fontSize:10,color:"var(--text-muted)",marginBottom:1}}>{f.l}</div><div style={{fontSize:13}}>{f.v}</div></div></div>
              ))}
              {sel.notes&&<div style={{background:"var(--bg-overlay)",borderRadius:8,padding:12,fontSize:13,color:"var(--text-secondary)",lineHeight:1.6}}>{sel.notes}</div>}
            </div>
            <div style={{display:"flex",gap:8,marginTop:20}}>
              <button onClick={()=>{open(sel);setSel(null);}} style={{flex:1,background:"var(--accent)",color:"#fff",border:"none",borderRadius:8,padding:"8px 0",fontSize:13,fontWeight:600,cursor:"pointer"}}>{t("edit")}</button>
              <button onClick={()=>setDel(sel.id)} style={{background:"rgba(239,68,68,0.1)",color:"#ef4444",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8,padding:"8px 14px",fontSize:13,cursor:"pointer"}}>{t("delete")}</button>
            </div>
          </div>
        </div>
      )}

      {del&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:12,padding:28,maxWidth:380,width:"90%"}}>
            <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:16}}><AlertCircle size={20} style={{color:"#ef4444",flexShrink:0,marginTop:2}}/><div><div style={{fontWeight:700,marginBottom:4}}>{t("accounts_delete_confirm_title")}</div><div style={{fontSize:13,color:"var(--text-muted)"}}>{t("cannot_be_undone")}</div></div></div>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button onClick={()=>setDel(null)} style={{background:"var(--bg-overlay)",border:"1px solid var(--border)",borderRadius:8,padding:"8px 16px",fontSize:13,cursor:"pointer"}}>{t("cancel")}</button>
              <button data-testid="button-confirm-delete" onClick={()=>rm.mutate(del!)} disabled={rm.isPending} style={{background:"#ef4444",color:"#fff",border:"none",borderRadius:8,padding:"8px 16px",fontSize:13,fontWeight:600,cursor:"pointer"}}>{rm.isPending?t("accounts_deleting","Deleting…"):t("delete")}</button>
            </div>
          </div>
        </div>
      )}

      {modal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:14,width:"100%",maxWidth:560,maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{padding:"18px 22px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontSize:16,fontWeight:700}}>{editing?t("edit_account"):t("accounts_new","New Account")}</div><button onClick={close} aria-label={t("close")} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",padding:4}}><X size={16}/></button></div>
            <form onSubmit={submit} style={{padding:"20px 22px",display:"flex",flexDirection:"column",gap:14}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {F(`${t("account_name")} *`,"name","text",true,true)}
                <div><label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:5,color:"var(--text-secondary)"}}>{t("account_industry")}</label><select value={form.industry} onChange={e=>setForm(p=>({...p,industry:e.target.value}))} style={{width:"100%",padding:"9px 12px",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text-primary)",fontSize:13,outline:"none",appearance:"none"}}><option value="">{t("accounts_select_industry")}</option>{INDUSTRIES.map(i=><option key={i} value={i}>{i}</option>)}</select></div>
                <div><label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:5,color:"var(--text-secondary)"}}>{t("status")}</label><select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))} style={{width:"100%",padding:"9px 12px",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text-primary)",fontSize:13,outline:"none",appearance:"none"}}>{STATUSES.map(s=><option key={s} value={s}>{s[0].toUpperCase()+s.slice(1)}</option>)}</select></div>
                {F(t("email"),"email","email")}
                {F(t("phone"),"phone")}
                {F(t("account_website"),"website","text",true,false,"https://...")}
                {F(t("accounts_annual_revenue_label","Annual Revenue ($)"),"annualRevenue","number")}
                {F(t("accounts_employee_count_label","Employee Count"),"employeeCount","number")}
                {F(t("city","City"),"city")}
                {F(t("country","Country"),"country")}
                <div style={{gridColumn:"1/-1"}}><label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:5,color:"var(--text-secondary)"}}>{t("notes")}</label><textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} rows={3} style={{width:"100%",padding:"9px 12px",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text-primary)",fontSize:13,outline:"none",resize:"vertical",boxSizing:"border-box"}}/></div>
              </div>
              <div style={{display:"flex",gap:8,justifyContent:"flex-end",paddingTop:4}}>
                <button type="button" onClick={close} style={{background:"var(--bg-overlay)",border:"1px solid var(--border)",borderRadius:8,padding:"9px 18px",fontSize:13,cursor:"pointer"}}>{t("cancel")}</button>
                <button data-testid="button-submit-account" type="submit" disabled={create.isPending||upd.isPending} style={{background:"var(--accent)",color:"#fff",border:"none",borderRadius:8,padding:"9px 20px",fontSize:13,fontWeight:600,cursor:"pointer"}}>
                  {create.isPending||upd.isPending ? t("accounts_saving","Saving…") : editing ? t("save_changes") : t("accounts_new","New Account")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
