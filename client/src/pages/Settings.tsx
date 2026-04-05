import React, { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import Layout from "../components/Layout";
import { useLanguage } from "../contexts/LanguageContext";
import { User, Building2, Lock, Bell, Shield, CheckCircle, AlertCircle, Eye, EyeOff, Globe, Mail, Phone, Paintbrush, ExternalLink, Wifi, WifiOff, Loader2, Brain, Key, Trash2 } from "lucide-react";

const TABS = [
  { id:"profile", label:"Profile", icon:User },
  { id:"organization", label:"Organization", icon:Building2 },
  { id:"security", label:"Security", icon:Lock },
  { id:"notifications", label:"Notifications", icon:Bell },
  { id:"branding", label:"White Label", icon:Paintbrush },
  { id:"email", label:"Email / SMTP", icon:Mail },
  { id:"ai", label:"AI Usage", icon:Brain },
];

function SaveButton({ loading, saved }: { loading: boolean; saved: boolean }) {
  return (
    <button type="submit" disabled={loading} data-testid="button-save" style={{display:"flex",alignItems:"center",gap:6,background:saved?"#22c55e":"var(--accent)",color:"#fff",border:"none",borderRadius:8,padding:"9px 20px",fontSize:13,fontWeight:600,cursor:"pointer",transition:"background 0.3s"}}>
      {loading?"Saving…":saved?<><CheckCircle size={14}/>Saved!</>:"Save Changes"}
    </button>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const search = useSearch();
  const VALID_TABS = ["profile","organization","security","notifications","branding","email","ai"];
  const tabFromUrl = new URLSearchParams(search).get("tab") || "";
  const [tab, setTab] = useState(() => VALID_TABS.includes(tabFromUrl) ? tabFromUrl : "profile");

  useEffect(() => {
    if (VALID_TABS.includes(tabFromUrl)) setTab(tabFromUrl);
  }, [tabFromUrl]);

  const [profile, setProfile] = useState({ firstName:"", lastName:"", email:"", preferredLanguage:"en" });
  const [org, setOrg] = useState({ name:"", domain:"" });
  const [pwd, setPwd] = useState({ current:"", next:"", confirm:"" });
  const [showPwd, setShowPwd] = useState({ current:false, next:false });
  const [pwdError, setPwdError] = useState("");
  const [pwdOk, setPwdOk] = useState(false);
  const [notif, setNotif] = useState({ emailAlerts:true, dealUpdates:true, taskReminders:true, weeklyReport:false, newLeads:true, systemAlerts:true });
  const [profileSaved, setProfileSaved] = useState(false);
  const [orgSaved, setOrgSaved] = useState(false);
  const [brandSaved, setBrandSaved] = useState(false);
  const [brand, setBrand] = useState({ companyName:"", logoUrl:"", faviconUrl:"", primaryColor:"#6366f1", secondaryColor:"#8b5cf6", customDomain:"", supportEmail:"" });
  const [smtp, setSmtp] = useState({ host:"", port:"587", secure:false, user:"", pass:"", senderName:"", senderEmail:"" });
  const [smtpSaved, setSmtpSaved] = useState(false);
  const [smtpTest, setSmtpTest] = useState<{status:"idle"|"loading"|"ok"|"fail", msg:string}>({ status:"idle", msg:"" });
  const [showSmtpPass, setShowSmtpPass] = useState(false);

  const { data: settings } = useQuery<any>({ queryKey:["/api/settings"] });
  const { data: wlData } = useQuery<any>({ queryKey:["/api/ops/whitelabel"] });
  const { data: smtpData } = useQuery<any>({ queryKey:["/api/settings/smtp"] });
  const { data: aiData, refetch: refetchAI } = useQuery<any>({ queryKey:["/api/settings/ai"] });
  const { data: usageData } = useQuery<any>({ queryKey:["/api/ai/usage"], refetchInterval: 30000 });
  const [aiKey, setAiKey] = useState("");
  const [aiProvider, setAiProvider] = useState("openai");
  const [aiSaved, setAiSaved] = useState(false);
  const [showAiKey, setShowAiKey] = useState(false);
  const [removingKey, setRemovingKey] = useState(false);

  useEffect(()=>{
    if(user){ setProfile({ firstName:user.firstName||"", lastName:user.lastName||"", email:user.email||"", preferredLanguage:user.preferredLanguage||"en" }); }
  },[user]);

  useEffect(()=>{
    if(settings){ setOrg({ name:settings.name||"", domain:settings.domain||"" }); }
  },[settings]);

  useEffect(()=>{
    if(wlData && wlData.id){ setBrand({ companyName:wlData.companyName||"", logoUrl:wlData.logoUrl||"", faviconUrl:wlData.faviconUrl||"", primaryColor:wlData.primaryColor||"#6366f1", secondaryColor:wlData.secondaryColor||"#8b5cf6", customDomain:wlData.customDomain||"", supportEmail:wlData.supportEmail||"" }); }
  },[wlData]);

  useEffect(()=>{
    if(smtpData){ setSmtp({ host:smtpData.host||"", port:String(smtpData.port||587), secure:Boolean(smtpData.secure), user:smtpData.user||"", pass:smtpData.pass||"", senderName:smtpData.senderName||"", senderEmail:smtpData.senderEmail||"" }); }
  },[smtpData]);

  const updateProfile = useMutation({
    mutationFn:(d:any)=>apiRequest("PUT","/api/profile",d),
    onSuccess:()=>{ queryClient.invalidateQueries({queryKey:["/api/me"]}); setProfileSaved(true); setTimeout(()=>setProfileSaved(false),3000); }
  });

  const updateOrg = useMutation({
    mutationFn:(d:any)=>apiRequest("PUT","/api/settings",d),
    onSuccess:()=>{ setOrgSaved(true); setTimeout(()=>setOrgSaved(false),3000); }
  });

  const updateBrand = useMutation({
    mutationFn:(d:any)=>apiRequest("PUT","/api/ops/whitelabel",d),
    onSuccess:()=>{ queryClient.invalidateQueries({queryKey:["/api/ops/whitelabel"]}); setBrandSaved(true); setTimeout(()=>setBrandSaved(false),3000); }
  });

  const updateSmtp = useMutation({
    mutationFn:(d:any)=>apiRequest("PUT","/api/settings/smtp",d),
    onSuccess:()=>{ queryClient.invalidateQueries({queryKey:["/api/settings/smtp"]}); setSmtpSaved(true); setTimeout(()=>setSmtpSaved(false),3000); }
  });

  async function testSmtp() {
    setSmtpTest({ status:"loading", msg:"" });
    try {
      const res = await apiRequest("POST","/api/settings/smtp/test",{});
      setSmtpTest({ status:"ok", msg:(res as any).message||"Connection successful!" });
    } catch(e:any) {
      setSmtpTest({ status:"fail", msg:e.message||"Connection failed" });
    }
  }

  function submitSmtp(e:React.FormEvent){ e.preventDefault(); updateSmtp.mutate({ ...smtp, port:Number(smtp.port) }); }

  const changePwd = useMutation({
    mutationFn:(d:any)=>apiRequest("POST","/api/auth/change-password",d),
    onSuccess:()=>{ setPwd({current:"",next:"",confirm:""}); setPwdOk(true); setPwdError(""); setTimeout(()=>setPwdOk(false),4000); },
    onError:(e:any)=>{ setPwdError(e.message||"Failed to change password"); }
  });

  function submitProfile(e:React.FormEvent){ e.preventDefault(); updateProfile.mutate({ firstName:profile.firstName, lastName:profile.lastName, preferredLanguage:profile.preferredLanguage }); }
  function submitOrg(e:React.FormEvent){ e.preventDefault(); updateOrg.mutate({ name:org.name }); }
  function submitBrand(e:React.FormEvent){ e.preventDefault(); updateBrand.mutate(brand); }
  function submitPwd(e:React.FormEvent){
    e.preventDefault(); setPwdError("");
    if(pwd.next.length<8){ setPwdError("New password must be at least 8 characters"); return; }
    if(pwd.next!==pwd.confirm){ setPwdError("Passwords do not match"); return; }
    changePwd.mutate({ currentPassword:pwd.current, newPassword:pwd.next });
  }

  const inp=(lbl:string,val:string,set:(v:string)=>void,type="text",disabled=false,ph="")=>(
    <div>
      <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:5,color:"var(--text-secondary)"}}>{lbl}</label>
      <input value={val} onChange={e=>set(e.target.value)} type={type} disabled={disabled} placeholder={ph} style={{width:"100%",padding:"9px 12px",background:disabled?"var(--bg-overlay)":"var(--bg)",border:"1px solid var(--border)",borderRadius:8,color:disabled?"var(--text-muted)":"var(--text-primary)",fontSize:13,outline:"none",boxSizing:"border-box",cursor:disabled?"not-allowed":"text"}}/>
    </div>
  );

  const planBadge:Record<string,{bg:string,color:string,label:string}>={
    free:{bg:"rgba(107,114,128,0.12)",color:"#9ca3af",label:"Free"},
    trial:{bg:"rgba(245,158,11,0.12)",color:"#fbbf24",label:"Trial"},
    pro:{bg:"rgba(99,102,241,0.12)",color:"#818cf8",label:"Pro"},
    enterprise:{bg:"rgba(34,197,94,0.12)",color:"#4ade80",label:"Enterprise"},
  };
  const plan=settings?.plan||"free";
  const pb=planBadge[plan]||planBadge.free;

  return (
    <Layout title={t("settings_title")} subtitle={t("settings_subtitle")}>
      <div style={{display:"flex",gap:20,maxWidth:900}}>
        {/* Sidebar nav */}
        <div style={{width:200,flexShrink:0}}>
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:10,overflow:"hidden"}}>
            {TABS.map(t=>{
              const Icon=t.icon;
              const active=tab===t.id;
              return (
                <button key={t.id} data-testid={`tab-${t.id}`} onClick={()=>setTab(t.id)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"11px 14px",background:active?"var(--accent-subtle,rgba(99,102,241,0.08))":"transparent",border:"none",borderLeft:active?"2px solid var(--accent)":"2px solid transparent",cursor:"pointer",color:active?"var(--accent)":"var(--text-secondary)",fontSize:13,fontWeight:active?600:400,textAlign:"left"}}>
                  <Icon size={14}/>{t.label}
                </button>
              );
            })}
          </div>

          {/* Plan info */}
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:10,padding:14,marginTop:12}}>
            <div style={{fontSize:11,color:"var(--text-muted)",marginBottom:6}}>Current Plan</div>
            <div style={{display:"inline-flex",padding:"3px 10px",borderRadius:6,fontSize:12,fontWeight:700,background:pb.bg,color:pb.color,marginBottom:8}}>{pb.label}</div>
            {settings?.trialEndsAt&&<div style={{fontSize:11,color:"var(--text-muted)"}}>Trial ends {new Date(settings.trialEndsAt).toLocaleDateString()}</div>}
          </div>
        </div>

        {/* Content */}
        <div style={{flex:1,minWidth:0}}>
          {tab==="profile"&&(
            <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:10,padding:"24px"}}>
              <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>Profile Settings</div>
              <div style={{fontSize:13,color:"var(--text-muted)",marginBottom:24}}>Update your personal information</div>
              <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:24}}>
                <div style={{width:64,height:64,borderRadius:"50%",background:"linear-gradient(135deg,#3b82f6,#6366f1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:700,color:"#fff",flexShrink:0}}>
                  {profile.firstName?.[0]?.toUpperCase()||profile.email?.[0]?.toUpperCase()||"?"}
                </div>
                <div><div style={{fontSize:16,fontWeight:700}}>{[profile.firstName,profile.lastName].filter(Boolean).join(" ")||profile.email}</div><div style={{fontSize:12,color:"var(--text-muted)"}}>{profile.email}</div></div>
              </div>
              <form onSubmit={submitProfile} style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  {inp("First Name",profile.firstName,v=>setProfile(p=>({...p,firstName:v})))}
                  {inp("Last Name",profile.lastName,v=>setProfile(p=>({...p,lastName:v})))}
                  {inp("Email Address",profile.email,()=>{},"email",true)}
                  <div>
                    <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:5,color:"var(--text-secondary)"}}>Language</label>
                    <select value={profile.preferredLanguage} onChange={e=>setProfile(p=>({...p,preferredLanguage:e.target.value}))} style={{width:"100%",padding:"9px 12px",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text-primary)",fontSize:13,outline:"none",appearance:"none"}}>
                      {[["en","English"],["fr","French"],["es","Spanish"],["de","German"],["pt","Portuguese"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{display:"flex",justifyContent:"flex-end"}}><SaveButton loading={updateProfile.isPending} saved={profileSaved}/></div>
              </form>
            </div>
          )}

          {tab==="organization"&&(
            <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:10,padding:"24px"}}>
              <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>Organization Settings</div>
              <div style={{fontSize:13,color:"var(--text-muted)",marginBottom:24}}>Manage your workspace configuration</div>
              <form onSubmit={submitOrg} style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  {inp("Workspace Name",org.name,v=>setOrg(p=>({...p,name:v})),"text",false,"My Company")}
                  {inp("Domain / Subdomain",org.domain,()=>{},"text",true)}
                </div>
                <div style={{background:"var(--bg-overlay)",border:"1px solid var(--border)",borderRadius:8,padding:"12px 16px",display:"flex",gap:10,alignItems:"flex-start"}}>
                  <Shield size={14} style={{color:"var(--text-muted)",marginTop:1,flexShrink:0}}/>
                  <div style={{fontSize:12,color:"var(--text-muted)"}}>To change your domain or plan, contact us at info@argilette.com</div>
                </div>
                <div style={{display:"flex",justifyContent:"flex-end"}}><SaveButton loading={updateOrg.isPending} saved={orgSaved}/></div>
              </form>
            </div>
          )}

          {tab==="security"&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:10,padding:"24px"}}>
                <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>Change Password</div>
                <div style={{fontSize:13,color:"var(--text-muted)",marginBottom:24}}>Use a strong, unique password</div>
                {pwdError&&<div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#f87171",marginBottom:16,display:"flex",gap:8,alignItems:"center"}}><AlertCircle size={14}/>{pwdError}</div>}
                {pwdOk&&<div style={{background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#4ade80",marginBottom:16,display:"flex",gap:8,alignItems:"center"}}><CheckCircle size={14}/>Password changed successfully!</div>}
                <form onSubmit={submitPwd} style={{display:"flex",flexDirection:"column",gap:14}}>
                  {[{l:"Current Password",k:"current" as const},{l:"New Password",k:"next" as const},{l:"Confirm New Password",k:"confirm" as const}].map(f=>(
                    <div key={f.k}>
                      <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:5,color:"var(--text-secondary)"}}>{f.l}</label>
                      <div style={{position:"relative"}}>
                        <input data-testid={`input-${f.k}-password`} value={pwd[f.k]} onChange={e=>setPwd(p=>({...p,[f.k]:e.target.value}))} type={(f.k!=="confirm"&&showPwd[f.k as "current"|"next"])?"text":"password"} required style={{width:"100%",padding:"9px 36px 9px 12px",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text-primary)",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
                        {f.k!=="confirm"&&<button type="button" onClick={()=>setShowPwd(p=>({...p,[f.k]:!p[f.k as "current"|"next"]}))} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",display:"flex"}}>{showPwd[f.k as "current"|"next"]?<EyeOff size={14}/>:<Eye size={14}/>}</button>}
                      </div>
                      {f.k==="next"&&pwd.next.length>0&&pwd.next.length<8&&<div style={{fontSize:11,color:"#f59e0b",marginTop:4}}>At least 8 characters required</div>}
                    </div>
                  ))}
                  <div style={{display:"flex",justifyContent:"flex-end"}}><button type="submit" disabled={changePwd.isPending} style={{display:"flex",alignItems:"center",gap:6,background:"var(--accent)",color:"#fff",border:"none",borderRadius:8,padding:"9px 20px",fontSize:13,fontWeight:600,cursor:"pointer"}}>{changePwd.isPending?"Updating…":"Update Password"}</button></div>
                </form>
              </div>

              <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:10,padding:"24px"}}>
                <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>Login Sessions</div>
                <div style={{fontSize:13,color:"var(--text-muted)",marginBottom:16}}>Your account security information</div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {[{l:"Last login",v:user?.lastLoginAt?new Date(user.lastLoginAt).toLocaleString():"Never"},{l:"Email verified",v:user?.emailVerified?"Yes":"No"},{l:"Account role",v:user?.role?.replace("_"," ")}].map(f=>(
                    <div key={f.l} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
                      <span style={{fontSize:13,color:"var(--text-secondary)"}}>{f.l}</span>
                      <span style={{fontSize:13,fontWeight:500}}>{f.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab==="notifications"&&(
            <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:10,padding:"24px"}}>
              <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>Notification Preferences</div>
              <div style={{fontSize:13,color:"var(--text-muted)",marginBottom:24}}>Choose which updates you receive</div>
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                {[
                  {k:"emailAlerts" as const,l:"Email Alerts",d:"Receive important account notifications via email"},
                  {k:"dealUpdates" as const,l:"Deal Updates",d:"Get notified when deals change stage"},
                  {k:"taskReminders" as const,l:"Task Reminders",d:"Receive reminders for upcoming and overdue tasks"},
                  {k:"newLeads" as const,l:"New Leads",d:"Notifications when new leads are added"},
                  {k:"weeklyReport" as const,l:"Weekly Summary Report",d:"Receive a weekly digest of your CRM activity"},
                  {k:"systemAlerts" as const,l:"System Alerts",d:"Platform maintenance and security notifications"},
                ].map(f=>(
                  <div key={f.k} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 0",borderBottom:"1px solid var(--border)"}}>
                    <div><div style={{fontSize:13,fontWeight:600}}>{f.l}</div><div style={{fontSize:12,color:"var(--text-muted)",marginTop:2}}>{f.d}</div></div>
                    <button data-testid={`toggle-${f.k}`} onClick={()=>setNotif(p=>({...p,[f.k]:!p[f.k]}))} style={{position:"relative",width:44,height:24,borderRadius:12,border:"none",background:notif[f.k]?"var(--accent)":"var(--border)",cursor:"pointer",transition:"background 0.2s",flexShrink:0}}>
                      <div style={{position:"absolute",top:3,left:notif[f.k]?20:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.3)"}}/>
                    </button>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",justifyContent:"flex-end",marginTop:20}}>
                <button onClick={()=>{}} style={{display:"flex",alignItems:"center",gap:6,background:"var(--accent)",color:"#fff",border:"none",borderRadius:8,padding:"9px 20px",fontSize:13,fontWeight:600,cursor:"pointer"}}><CheckCircle size={14}/>Save Preferences</button>
              </div>
            </div>
          )}

          {tab==="branding"&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>

              {/* Header Banner */}
              <div style={{background:"linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.08))",border:"1px solid rgba(99,102,241,0.25)",borderRadius:10,padding:"20px 24px",display:"flex",gap:16,alignItems:"center"}}>
                <div style={{width:44,height:44,borderRadius:10,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <Paintbrush size={20} color="#fff"/>
                </div>
                <div>
                  <div style={{fontSize:15,fontWeight:700,marginBottom:3}}>White Label Branding</div>
                  <div style={{fontSize:13,color:"var(--text-muted)"}}>Replace ARGILETTE branding with your own. Your clients will only see your logo, colors and company name.</div>
                </div>
              </div>

              {/* Identity */}
              <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:10,padding:"24px"}}>
                <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>Brand Identity</div>
                <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:20}}>These details replace all ARGILETTE references in the platform</div>
                <form onSubmit={submitBrand} style={{display:"flex",flexDirection:"column",gap:14}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                    {inp("Company Name",brand.companyName,v=>setBrand(p=>({...p,companyName:v})),"text",false,"Acme Corp")}
                    {inp("Support Email",brand.supportEmail,v=>setBrand(p=>({...p,supportEmail:v})),"email",false,"support@yourcompany.com")}
                    {inp("Logo URL",brand.logoUrl,v=>setBrand(p=>({...p,logoUrl:v})),"url",false,"https://yourcompany.com/logo.png")}
                    {inp("Favicon URL",brand.faviconUrl,v=>setBrand(p=>({...p,faviconUrl:v})),"url",false,"https://yourcompany.com/favicon.ico")}
                  </div>

                  {/* Logo preview */}
                  {brand.logoUrl&&(
                    <div style={{padding:"14px 16px",background:"var(--bg-overlay)",border:"1px solid var(--border)",borderRadius:8,display:"flex",alignItems:"center",gap:12}}>
                      <img src={brand.logoUrl} alt="Logo preview" style={{height:36,maxWidth:160,objectFit:"contain"}} onError={e=>(e.currentTarget.style.display="none")}/>
                      <span style={{fontSize:12,color:"var(--text-muted)"}}>Logo preview</span>
                    </div>
                  )}

                  {/* Colour pickers */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                    <div>
                      <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:8,color:"var(--text-secondary)"}}>Primary Colour</label>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <input type="color" value={brand.primaryColor} onChange={e=>setBrand(p=>({...p,primaryColor:e.target.value}))} data-testid="input-primary-color" style={{width:40,height:36,padding:2,border:"1px solid var(--border)",borderRadius:6,background:"var(--bg)",cursor:"pointer"}}/>
                        <input value={brand.primaryColor} onChange={e=>setBrand(p=>({...p,primaryColor:e.target.value}))} placeholder="#6366f1" style={{flex:1,padding:"8px 12px",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text-primary)",fontSize:13,outline:"none",fontFamily:"monospace"}}/>
                      </div>
                    </div>
                    <div>
                      <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:8,color:"var(--text-secondary)"}}>Secondary Colour</label>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <input type="color" value={brand.secondaryColor} onChange={e=>setBrand(p=>({...p,secondaryColor:e.target.value}))} data-testid="input-secondary-color" style={{width:40,height:36,padding:2,border:"1px solid var(--border)",borderRadius:6,background:"var(--bg)",cursor:"pointer"}}/>
                        <input value={brand.secondaryColor} onChange={e=>setBrand(p=>({...p,secondaryColor:e.target.value}))} placeholder="#8b5cf6" style={{flex:1,padding:"8px 12px",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text-primary)",fontSize:13,outline:"none",fontFamily:"monospace"}}/>
                      </div>
                    </div>
                  </div>

                  {/* Live colour preview */}
                  <div style={{display:"flex",gap:8,alignItems:"center",padding:"12px 16px",background:"var(--bg-overlay)",border:"1px solid var(--border)",borderRadius:8}}>
                    <div style={{width:32,height:32,borderRadius:8,background:`linear-gradient(135deg,${brand.primaryColor},${brand.secondaryColor})`}}/>
                    <div>
                      <div style={{fontSize:12,fontWeight:600,color:"var(--text-primary)"}}>Live preview</div>
                      <div style={{fontSize:11,color:"var(--text-muted)"}}>{brand.primaryColor} → {brand.secondaryColor}</div>
                    </div>
                    <div style={{marginLeft:"auto",display:"flex",gap:6}}>
                      <div style={{width:20,height:20,borderRadius:4,background:brand.primaryColor}}/>
                      <div style={{width:20,height:20,borderRadius:4,background:brand.secondaryColor}}/>
                    </div>
                  </div>

                  {/* Custom domain */}
                  <div>
                    <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:5,color:"var(--text-secondary)"}}>Custom Domain</label>
                    <div style={{position:"relative"}}>
                      <Globe size={14} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"var(--text-muted)"}}/>
                      <input value={brand.customDomain} onChange={e=>setBrand(p=>({...p,customDomain:e.target.value}))} placeholder="crm.yourcompany.com" style={{width:"100%",padding:"9px 12px 9px 30px",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text-primary)",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
                    </div>
                    <div style={{fontSize:11,color:"var(--text-muted)",marginTop:4}}>Point this CNAME to your Replit deployment URL, then enter it here</div>
                  </div>

                  <div style={{background:"rgba(99,102,241,0.06)",border:"1px solid rgba(99,102,241,0.15)",borderRadius:8,padding:"12px 16px",display:"flex",gap:10,alignItems:"flex-start"}}>
                    <ExternalLink size={13} style={{color:"#818cf8",marginTop:1,flexShrink:0}}/>
                    <div style={{fontSize:12,color:"var(--text-muted)"}}>Changes take effect immediately for all users in your workspace. Your clients will see your brand on every page, email, and report.</div>
                  </div>

                  <div style={{display:"flex",justifyContent:"flex-end"}}>
                    <SaveButton loading={updateBrand.isPending} saved={brandSaved}/>
                  </div>
                </form>
              </div>

              {/* What's included */}
              <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:10,padding:"24px"}}>
                <div style={{fontSize:14,fontWeight:700,marginBottom:16}}>What gets white-labelled</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {[
                    {label:"App logo & favicon",done:true},
                    {label:"Browser tab title",done:true},
                    {label:"Brand colours (buttons, highlights)",done:true},
                    {label:"Email templates (from name)",done:true},
                    {label:"Custom domain (CNAME)",done:true},
                    {label:"Support email address",done:true},
                    {label:"PDF reports & invoices",done:false},
                    {label:"Mobile app icons",done:false},
                  ].map(item=>(
                    <div key={item.label} style={{display:"flex",alignItems:"center",gap:8,fontSize:13}}>
                      <div style={{width:18,height:18,borderRadius:"50%",background:item.done?"rgba(34,197,94,0.15)":"rgba(107,114,128,0.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        {item.done
                          ? <CheckCircle size={11} color="#4ade80"/>
                          : <div style={{width:6,height:6,borderRadius:"50%",background:"var(--text-muted)"}}/>
                        }
                      </div>
                      <span style={{color:item.done?"var(--text-primary)":"var(--text-muted)"}}>{item.label}</span>
                      {!item.done&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:4,background:"rgba(245,158,11,0.1)",color:"#fbbf24",marginLeft:"auto"}}>Soon</span>}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {tab==="email"&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>

              {/* Header Banner */}
              <div style={{background:"linear-gradient(135deg,rgba(16,185,129,0.1),rgba(6,182,212,0.06))",border:"1px solid rgba(16,185,129,0.2)",borderRadius:10,padding:"20px 24px",display:"flex",gap:16,alignItems:"center"}}>
                <div style={{width:44,height:44,borderRadius:10,background:"linear-gradient(135deg,#10b981,#06b6d4)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <Mail size={20} color="#fff"/>
                </div>
                <div>
                  <div style={{fontSize:15,fontWeight:700,marginBottom:3}}>Email / SMTP Configuration</div>
                  <div style={{fontSize:13,color:"var(--text-muted)"}}>Connect your own email server. All campaign emails will be sent from your domain, not ARGILETTE's.</div>
                </div>
              </div>

              {/* SMTP Form */}
              <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:10,padding:"24px"}}>
                <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>SMTP Server</div>
                <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:20}}>Your email provider credentials. Works with Gmail, Outlook, Zoho, SendGrid, Mailgun, or any SMTP service.</div>

                <form onSubmit={submitSmtp} style={{display:"flex",flexDirection:"column",gap:14}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                    <div>
                      <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:5,color:"var(--text-secondary)"}}>SMTP Host</label>
                      <input data-testid="input-smtp-host" value={smtp.host} onChange={e=>setSmtp(p=>({...p,host:e.target.value}))} placeholder="smtp.gmail.com" required style={{width:"100%",padding:"9px 12px",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text-primary)",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
                    </div>
                    <div>
                      <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:5,color:"var(--text-secondary)"}}>Port</label>
                      <select data-testid="select-smtp-port" value={smtp.port} onChange={e=>setSmtp(p=>({...p,port:e.target.value,secure:e.target.value==="465"}))} style={{width:"100%",padding:"9px 12px",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text-primary)",fontSize:13,outline:"none",appearance:"none"}}>
                        <option value="587">587 (STARTTLS — recommended)</option>
                        <option value="465">465 (SSL)</option>
                        <option value="25">25 (Plain — not recommended)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:5,color:"var(--text-secondary)"}}>Username / Email</label>
                      <input data-testid="input-smtp-user" value={smtp.user} onChange={e=>setSmtp(p=>({...p,user:e.target.value}))} placeholder="you@yourdomain.com" type="email" required style={{width:"100%",padding:"9px 12px",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text-primary)",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
                    </div>
                    <div>
                      <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:5,color:"var(--text-secondary)"}}>Password / App Password</label>
                      <div style={{position:"relative"}}>
                        <input data-testid="input-smtp-pass" value={smtp.pass} onChange={e=>setSmtp(p=>({...p,pass:e.target.value}))} type={showSmtpPass?"text":"password"} placeholder="Enter password or app password" style={{width:"100%",padding:"9px 36px 9px 12px",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text-primary)",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
                        <button type="button" onClick={()=>setShowSmtpPass(p=>!p)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",display:"flex"}}>{showSmtpPass?<EyeOff size={14}/>:<Eye size={14}/>}</button>
                      </div>
                      <div style={{fontSize:11,color:"var(--text-muted)",marginTop:4}}>For Gmail, use an App Password (not your main password)</div>
                    </div>
                  </div>

                  <div style={{borderTop:"1px solid var(--border)",paddingTop:16,marginTop:4}}>
                    <div style={{fontSize:13,fontWeight:600,marginBottom:12,color:"var(--text-secondary)"}}>Sender Identity</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                      <div>
                        <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:5,color:"var(--text-secondary)"}}>Sender Name</label>
                        <input data-testid="input-smtp-sender-name" value={smtp.senderName} onChange={e=>setSmtp(p=>({...p,senderName:e.target.value}))} placeholder="Acme Corp" required style={{width:"100%",padding:"9px 12px",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text-primary)",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
                        <div style={{fontSize:11,color:"var(--text-muted)",marginTop:4}}>Appears as the "From" name in inboxes</div>
                      </div>
                      <div>
                        <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:5,color:"var(--text-secondary)"}}>Sender Email</label>
                        <input data-testid="input-smtp-sender-email" value={smtp.senderEmail} onChange={e=>setSmtp(p=>({...p,senderEmail:e.target.value}))} placeholder="campaigns@yourdomain.com" type="email" required style={{width:"100%",padding:"9px 12px",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text-primary)",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
                        <div style={{fontSize:11,color:"var(--text-muted)",marginTop:4}}>Must match or be authorised by your SMTP user</div>
                      </div>
                    </div>
                  </div>

                  {/* Test result */}
                  {smtpTest.status==="ok"&&(
                    <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:8,fontSize:13,color:"#4ade80"}}>
                      <Wifi size={14}/>{smtpTest.msg}
                    </div>
                  )}
                  {smtpTest.status==="fail"&&(
                    <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8,fontSize:13,color:"#f87171"}}>
                      <WifiOff size={14}/>{smtpTest.msg}
                    </div>
                  )}

                  <div style={{display:"flex",justifyContent:"flex-end",gap:10,flexWrap:"wrap"}}>
                    <button type="button" data-testid="button-test-smtp" onClick={testSmtp} disabled={smtpTest.status==="loading"} style={{display:"flex",alignItems:"center",gap:6,background:"transparent",color:"var(--text-secondary)",border:"1px solid var(--border)",borderRadius:8,padding:"9px 18px",fontSize:13,fontWeight:600,cursor:"pointer"}}>
                      {smtpTest.status==="loading"?<><Loader2 size={13} style={{animation:"spin 1s linear infinite"}}/>Testing…</>:<><Wifi size={13}/>Test Connection</>}
                    </button>
                    <SaveButton loading={updateSmtp.isPending} saved={smtpSaved}/>
                  </div>
                </form>
              </div>

              {/* Quick guides */}
              <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:10,padding:"24px"}}>
                <div style={{fontSize:14,fontWeight:700,marginBottom:16}}>Provider Quick Reference</div>
                <div style={{display:"flex",flexDirection:"column",gap:0}}>
                  {[
                    {name:"Gmail",host:"smtp.gmail.com",port:"587",note:"Requires App Password (2FA must be on)"},
                    {name:"Outlook / Microsoft 365",host:"smtp.office365.com",port:"587",note:"Use your Microsoft account credentials"},
                    {name:"Zoho Mail",host:"smtp.zoho.com",port:"465",note:"SSL — use your Zoho email & password"},
                    {name:"SendGrid",host:"smtp.sendgrid.net",port:"587",note:"Username is 'apikey', password is your API key"},
                    {name:"Mailgun",host:"smtp.mailgun.org",port:"587",note:"Use your Mailgun SMTP credentials from dashboard"},
                  ].map((p,i,arr)=>(
                    <div key={p.name} style={{display:"flex",gap:12,padding:"11px 0",borderBottom:i<arr.length-1?"1px solid var(--border)":"none",alignItems:"flex-start"}}>
                      <div style={{width:7,height:7,borderRadius:"50%",background:"var(--brand)",marginTop:5,flexShrink:0}}/>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"baseline"}}>
                          <span style={{fontSize:13,fontWeight:600}}>{p.name}</span>
                          <span style={{fontSize:12,color:"var(--text-muted)",fontFamily:"monospace"}}>{p.host}:{p.port}</span>
                        </div>
                        <div style={{fontSize:12,color:"var(--text-muted)",marginTop:2}}>{p.note}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {tab==="ai"&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>

              {/* ── USAGE DASHBOARD ─────────────────────────────── */}
              {(()=>{
                const ud = usageData;
                const limit = ud?.monthlyLimit ?? aiData?.usageLimit ?? 50;
                const remaining = ud?.creditsRemaining ?? (limit - (aiData?.usageCount||0));
                const used = ud?.creditsUsed ?? (aiData?.usageCount||0);
                const pct = limit === -1 ? 0 : Math.min(100, (used / Math.max(1, limit)) * 100);
                const barColor = pct >= 95 ? "#ef4444" : pct >= 80 ? "#f59e0b" : "var(--accent)";
                const isUnlimited = limit === -1 || ud?.hasOwnKey || aiData?.hasApiKey;
                const plan = (ud?.plan || aiData?.plan || "starter");

                return (
                <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:10,padding:"24px"}}>
                  {/* Header */}
                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:20}}>
                    <div>
                      <div style={{fontSize:16,fontWeight:700,marginBottom:2}}>AI Usage Dashboard</div>
                      <div style={{fontSize:13,color:"var(--text-muted)"}}>
                        {isUnlimited ? "Unlimited — your own API key is active." : `${plan.charAt(0).toUpperCase()+plan.slice(1)} plan · resets on the 1st of each month`}
                      </div>
                    </div>
                    {!isUnlimited && ud?.spendMtd && Number(ud.spendMtd) > 0 && (
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:11,color:"var(--text-muted)"}}>Platform cost MTD</div>
                        <div style={{fontSize:14,fontWeight:700}}>${Number(ud.spendMtd).toFixed(4)}</div>
                      </div>
                    )}
                  </div>

                  {/* Credits bar */}
                  {!isUnlimited && (
                    <>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                        <span style={{fontSize:13,fontWeight:600}}>Credits Used</span>
                        <span style={{fontSize:13,fontWeight:700,color:barColor}}>{used} / {limit}</span>
                      </div>
                      <div style={{height:10,background:"var(--border)",borderRadius:5,overflow:"hidden",marginBottom:6}}>
                        <div style={{height:"100%",width:`${pct}%`,background:barColor,borderRadius:5,transition:"width 0.5s ease"}}/>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                        <span style={{fontSize:12,color:"var(--text-muted)"}}>
                          {remaining > 0 ? `${remaining} credits remaining this month` : "Credits exhausted"}
                        </span>
                        <span style={{fontSize:12,color:barColor,fontWeight:600}}>{pct.toFixed(0)}% used</span>
                      </div>

                      {/* Warning / upgrade CTA */}
                      {pct >= 80 && (
                        <div style={{
                          display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap",
                          padding:"12px 16px",borderRadius:8,marginBottom:16,
                          background: pct >= 95 ? "rgba(239,68,68,0.08)" : "rgba(245,158,11,0.08)",
                          border: `1px solid ${pct >= 95 ? "rgba(239,68,68,0.25)" : "rgba(245,158,11,0.25)"}`,
                        }}>
                          <div>
                            <div style={{fontSize:13,fontWeight:600,color:pct>=95?"#ef4444":"#f59e0b"}}>
                              {pct >= 95 ? "Credits almost exhausted" : "Approaching credit limit"}
                            </div>
                            <div style={{fontSize:12,color:"var(--text-muted)"}}>
                              You have {remaining} credits left — upgrade to keep going.
                            </div>
                          </div>
                          <button
                            data-testid="button-upgrade-cta"
                            onClick={()=>window.open("https://argilette.org/pricing","_blank")}
                            style={{flexShrink:0,background:"var(--accent)",color:"#fff",border:"none",borderRadius:7,padding:"8px 18px",fontSize:12,fontWeight:600,cursor:"pointer"}}
                          >
                            Upgrade Plan
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Breakdown by feature */}
                  {ud?.byFeature?.length > 0 && (
                    <div>
                      <div style={{fontSize:12,fontWeight:600,color:"var(--text-muted)",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.05em"}}>Usage by Feature — This Month</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr auto auto auto",gap:"0 16px",alignItems:"center"}}>
                        {["Feature","Calls","Tokens","Cost"].map(h=>(
                          <div key={h} style={{fontSize:11,color:"var(--text-muted)",fontWeight:600,paddingBottom:6,borderBottom:"1px solid var(--border)"}}>{h}</div>
                        ))}
                        {ud.byFeature.map((row:any,i:number)=>[
                          <div key={`fn-${i}`} style={{fontSize:13,padding:"6px 0",borderBottom:"1px solid var(--border)",textTransform:"capitalize"}}>{row.feature}</div>,
                          <div key={`fc-${i}`} style={{fontSize:13,padding:"6px 0",borderBottom:"1px solid var(--border)",textAlign:"right",fontWeight:600}}>{row.calls}</div>,
                          <div key={`ft-${i}`} style={{fontSize:12,padding:"6px 0",borderBottom:"1px solid var(--border)",textAlign:"right",color:"var(--text-muted)"}}>{((row.input_tokens||0)+(row.output_tokens||0)).toLocaleString()}</div>,
                          <div key={`fd-${i}`} style={{fontSize:12,padding:"6px 0",borderBottom:"1px solid var(--border)",textAlign:"right",color:"var(--text-muted)"}}>
                            ${Number(row.cost_usd||0).toFixed(4)}
                          </div>,
                        ])}
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {(!ud?.byFeature || ud.byFeature.length === 0) && (
                    <div style={{textAlign:"center",padding:"24px 0",color:"var(--text-muted)",fontSize:13}}>
                      No AI usage yet this month. Start a conversation with ARIA to see your usage here.
                    </div>
                  )}
                </div>
                );
              })()}

              {/* Legacy quota card (kept for backward compat) */}
              <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:10,padding:"24px"}}>
                <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>AI Usage</div>
                <div style={{fontSize:13,color:"var(--text-muted)",marginBottom:20}}>
                  {aiData?.hasApiKey
                    ? "Using your own API key — unlimited requests."
                    : `Platform AI quota for your current plan.`}
                </div>

                {!aiData?.hasApiKey&&(
                  <div style={{marginBottom:20}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <span style={{fontSize:13,fontWeight:600}}>Monthly Requests</span>
                      <span style={{fontSize:13,color:"var(--text-muted)"}}>
                        {aiData?.usageCount ?? 0} / {aiData?.usageLimit === -1 ? "∞" : aiData?.usageLimit ?? 50}
                      </span>
                    </div>
                    {aiData?.usageLimit !== -1 && (
                      <div style={{height:8,background:"var(--border)",borderRadius:4,overflow:"hidden"}}>
                        <div style={{
                          height:"100%",
                          width:`${Math.min(100, ((aiData?.usageCount||0)/(aiData?.usageLimit||50))*100)}%`,
                          background: (aiData?.usageCount||0) >= (aiData?.usageLimit||50)*0.9 ? "#ef4444" : (aiData?.usageCount||0) >= (aiData?.usageLimit||50)*0.7 ? "#f59e0b" : "var(--accent)",
                          borderRadius:4,
                          transition:"width 0.4s ease",
                        }}/>
                      </div>
                    )}
                    <div style={{fontSize:12,color:"var(--text-muted)",marginTop:6}}>
                      Resets on the 1st of each month. Add your own API key below for unlimited access.
                    </div>
                  </div>
                )}

                {aiData?.hasApiKey&&(
                  <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:8,marginBottom:16}}>
                    <CheckCircle size={15} style={{color:"#22c55e",flexShrink:0}}/>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:"#22c55e"}}>Own API key active</div>
                      <div style={{fontSize:12,color:"var(--text-muted)"}}>Provider: {aiData.provider || "openai"} · All AI requests use your key</div>
                    </div>
                    <button
                      data-testid="button-remove-ai-key"
                      onClick={async()=>{
                        setRemovingKey(true);
                        try{ await apiRequest("DELETE","/api/settings/ai/key",{}); refetchAI(); setAiKey(""); }
                        finally{ setRemovingKey(false); }
                      }}
                      disabled={removingKey}
                      style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6,background:"transparent",color:"#ef4444",border:"1px solid rgba(239,68,68,0.3)",borderRadius:8,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                      {removingKey?<Loader2 size={12} style={{animation:"spin 1s linear infinite"}}/>:<Trash2 size={12}/>}
                      Remove
                    </button>
                  </div>
                )}

                {/* Plan limits reference */}
                <div style={{background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,padding:"14px 16px"}}>
                  <div style={{fontSize:12,fontWeight:600,color:"var(--text-muted)",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.05em"}}>Plan Quotas</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
                    {[["Trial / Free","50 req/mo"],["Starter","200 req/mo"],["Professional","500 req/mo"],["Business","1,000 req/mo"],["Enterprise","Unlimited"],["Own API Key","Unlimited"]].map(([plan,quota])=>(
                      <div key={plan} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid var(--border)"}}>
                        <span style={{fontSize:12,color:"var(--text-secondary)"}}>{plan}</span>
                        <span style={{fontSize:12,fontWeight:600}}>{quota}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Own API Key card — admin only */}
              {user?.role === "admin" && (
              <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:10,padding:"24px"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <Key size={16} style={{color:"var(--accent)"}}/>
                  <div style={{fontSize:16,fontWeight:700}}>Add Your Own API Key</div>
                </div>
                <div style={{fontSize:13,color:"var(--text-muted)",marginBottom:20}}>
                  Plug in your own key from any major provider for unlimited AI access. Your key is stored securely and never exposed.
                </div>
                <form onSubmit={async(e)=>{
                  e.preventDefault();
                  await apiRequest("PUT","/api/settings/ai",{ provider:aiProvider, apiKey:aiKey });
                  queryClient.invalidateQueries({queryKey:["/api/settings/ai"]});
                  setAiSaved(true); setAiKey(""); setTimeout(()=>setAiSaved(false),3000);
                }} style={{display:"flex",flexDirection:"column",gap:14}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                    <div>
                      <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:5,color:"var(--text-secondary)"}}>Provider</label>
                      <select data-testid="select-ai-provider" value={aiProvider} onChange={e=>setAiProvider(e.target.value)} style={{width:"100%",padding:"9px 12px",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text-primary)",fontSize:13,outline:"none",appearance:"none"}}>
                        <option value="openai">OpenAI (GPT-4o)</option>
                        <option value="anthropic">Anthropic (Claude)</option>
                        <option value="google">Google (Gemini)</option>
                        <option value="groq">Groq (Llama 3.3)</option>
                        <option value="mistral">Mistral</option>
                        <option value="cohere">Cohere</option>
                        <option value="together">Together AI</option>
                      </select>
                    </div>
                    <div>
                      <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:5,color:"var(--text-secondary)"}}>API Key</label>
                      <div style={{position:"relative"}}>
                        <input
                          data-testid="input-ai-key"
                          value={aiKey}
                          onChange={e=>setAiKey(e.target.value)}
                          type={showAiKey?"text":"password"}
                          placeholder={aiData?.hasApiKey?"Key saved (enter new to replace)":"sk-... or your provider key"}
                          style={{width:"100%",padding:"9px 36px 9px 12px",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text-primary)",fontSize:13,outline:"none",boxSizing:"border-box"}}
                        />
                        <button type="button" onClick={()=>setShowAiKey(p=>!p)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",display:"flex"}}>
                          {showAiKey?<EyeOff size={14}/>:<Eye size={14}/>}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div style={{display:"flex",justifyContent:"flex-end"}}>
                    <SaveButton loading={false} saved={aiSaved}/>
                  </div>
                </form>

                {/* Provider key links */}
                <div style={{marginTop:20,paddingTop:16,borderTop:"1px solid var(--border)"}}>
                  <div style={{fontSize:12,fontWeight:600,color:"var(--text-muted)",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.05em"}}>Get API Keys</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                    {[
                      {name:"OpenAI",url:"https://platform.openai.com/api-keys"},
                      {name:"Anthropic",url:"https://console.anthropic.com/keys"},
                      {name:"Google AI",url:"https://aistudio.google.com/app/apikey"},
                      {name:"Groq (free)",url:"https://console.groq.com/keys"},
                      {name:"Mistral",url:"https://console.mistral.ai/api-keys"},
                    ].map(p=>(
                      <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:12,color:"var(--accent)",background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:6,padding:"5px 10px",textDecoration:"none",fontWeight:500}}>
                        {p.name}<ExternalLink size={10}/>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
