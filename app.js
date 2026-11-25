import { initializeApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, setPersistence, browserLocalPersistence, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";
import { getDatabase, ref, update } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-database.js";

const firebaseConfig = {
 apiKey:"AIzaSyCprt57TxPaKFEmyoDXyQp-FLeWQfCkw_8",
 authDomain:"rg-gamer-boy-ff-online.firebaseapp.com",
 databaseURL:"https://rg-gamer-boy-ff-online-default-rtdb.asia-southeast1.firebasedatabase.app",
 projectId:"rg-gamer-boy-ff-online",
 storageBucket:"rg-gamer-boy-ff-online.firebasestorage.app",
 messagingSenderId:"307878300787",
 appId:"1:307878300787:web:989fa88750b01b4cf5ae06",
 measurementId:"G-NWLKGQHZCV"
};
const app=initializeApp(firebaseConfig), auth=getAuth(app), db=getDatabase(app);
const $=id=>document.getElementById(id), status=$("status");
const POLICY_VERSION="2026-11-23-v1";
$("year").textContent=new Date().getFullYear();

// Keep the existing Privacy Policy / Terms consent behavior unchanged.
const consentKey="rg_policy_acceptance_"+POLICY_VERSION;
const modal=$("consentModal"), accept=$("acceptBox"), acceptBtn=$("acceptBtn");
function updateConsent(){acceptBtn.disabled=!accept.checked}
accept.addEventListener("change",updateConsent);
if(localStorage.getItem(consentKey)==="yes") modal.hidden=true;
acceptBtn.addEventListener("click",()=>{if(!accept.checked)return;localStorage.setItem(consentKey,"yes");modal.hidden=true});

// Version bump intentionally resets the previous saved region/country once.
const REGION_KEY="rg_user_region_country_v2";
localStorage.removeItem("rg_user_region_country_v1");
const COUNTRY_DATA={
 "Asia":[["🇮🇳","India"],["🇵🇰","Pakistan"],["🇧🇩","Bangladesh"],["🇮🇩","Indonesia"],["🇸🇬","Singapore"],["🇻🇳","Vietnam"],["🇳🇵","Nepal"]],
 "North America":[["🇺🇸","United States"],["🇨🇦","Canada"],["🇲🇽","Mexico"],["🇧🇿","Belize"],["🇨🇷","Costa Rica"],["🇸🇻","El Salvador"],["🇬🇹","Guatemala"],["🇭🇳","Honduras"],["🇳🇮","Nicaragua"],["🇵🇦","Panama"],["🇦🇬","Antigua and Barbuda"],["🇧🇸","Bahamas"],["🇧🇧","Barbados"],["🇨🇺","Cuba"],["🇩🇲","Dominica"],["🇩🇴","Dominican Republic"],["🇬🇩","Grenada"],["🇭🇹","Haiti"],["🇯🇲","Jamaica"],["🇰🇳","Saint Kitts and Nevis"],["🇱🇨","Saint Lucia"],["🇻🇨","Saint Vincent and the Grenadines"],["🇹🇹","Trinidad and Tobago"]],
 "South America":[["🇧🇷","Brazil"]]
};
let savedSelection=null;
try{savedSelection=JSON.parse(localStorage.getItem(REGION_KEY)||"null")}catch{savedSelection=null}
let selectedRegion=COUNTRY_DATA[savedSelection?.region]?savedSelection.region:"";
let selectedCountry=COUNTRY_DATA[selectedRegion]?.some(item=>item[1]===savedSelection?.country)?savedSelection.country:"";
let signedInUser=null;
let pingRequestId=0;
let pingInFlight=false;
const pingLabel=$("countryPing"), pingDot=$("pingDot");
function setPingLabel(message,state="idle"){
 if(pingLabel)pingLabel.textContent=message;
 if(pingDot)pingDot.dataset.state=state;
}
function selectedCountryFlag(){
 return (COUNTRY_DATA[selectedRegion]||[]).find(item=>item[1]===selectedCountry)?.[0]||"🌐";
}
async function measureDatabasePing(){
 const samples=[];
 for(let i=0;i<3;i++){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),5000);
  const started=performance.now();
  try{
   // The root read may be denied by the database rules; the HTTP response still
   // provides a safe round-trip measurement without reading user profile data.
   const url=firebaseConfig.databaseURL.replace(/\/$/,"")+"/.json?shallow=true&ping="+Date.now()+"_"+i;
   const response=await fetch(url,{method:"GET",mode:"cors",cache:"no-store",credentials:"omit",signal:controller.signal});
   const elapsed=Math.round(performance.now()-started);
   if(!response.ok&&response.status!==401&&response.status!==403)throw new Error("PING_HTTP_"+response.status);
   if(response.body)response.body.cancel().catch(()=>{});
   samples.push(elapsed);
  }catch(error){
   // Continue the remaining attempts; report failure only if none can reach RTDB.
  }finally{clearTimeout(timeout);}
 }
 if(!samples.length)throw new Error("PING_CONNECTION_FAILED");
 samples.sort((a,b)=>a-b);
 return samples[Math.floor(samples.length/2)];
}
async function updateCountryPing(){
 if(pingInFlight||document.visibilityState==="hidden")return;
 if(!selectedRegion||!selectedCountry){setPingLabel("Select country","idle");return;}
 pingInFlight=true;
 const requestId=++pingRequestId;
 const flag=selectedCountryFlag();
 setPingLabel(flag+" "+selectedCountry+" • Checking...","checking");
 try{
  const ms=await measureDatabasePing();
  if(requestId!==pingRequestId)return;
  setPingLabel(flag+" "+selectedCountry+" • "+(selectedCountry==="Brazil"?"Network ":"")+ms+" ms","ok");
 }catch(error){
  if(requestId===pingRequestId)setPingLabel(flag+" "+selectedCountry+" • Connection Failed","failed");
 }finally{pingInFlight=false;}
}

function showError(msg){status.textContent=msg}
function clearStatus(){status.textContent=""}
function showRegionStage(){
 $("regionStage").hidden=false;$("loginStage").hidden=true;
 renderRegions();
 if(selectedRegion)renderCountries();else{$("countryArea").hidden=true;$ ("regionContinueBtn").disabled=true;}
}
function showLoginStage(){ $("regionStage").hidden=true;$("loginStage").hidden=false; }
function renderRegions(){
 const host=$("regionChoices");host.replaceChildren();
 Object.keys(COUNTRY_DATA).forEach(name=>{
  const button=document.createElement("button");button.type="button";button.className="region-option"+(selectedRegion===name?" selected":"");
  const symbol=name==="Asia"?"🌏":"🌎";
  button.innerHTML=`<span class="region-symbol">${symbol}</span><span class="region-option-text"><strong>${name}</strong><small>${COUNTRY_DATA[name].length} ${COUNTRY_DATA[name].length===1?"country":"countries"}</small></span><span class="region-check" aria-hidden="true">✓</span>`;
  button.addEventListener("click",()=>{selectedRegion=name;selectedCountry="";renderRegions();renderCountries();updateCountryPing();});
  host.append(button);
 });
}
function renderCountries(){
 const countries=COUNTRY_DATA[selectedRegion]||[];
 $("countryArea").hidden=!selectedRegion;
 $("countryTitle").textContent=selectedRegion+" — Select Country";
 $("countryCount").textContent=countries.length+" available";
 const host=$("countryChoices");host.replaceChildren();
 countries.forEach(([flag,name])=>{
  const button=document.createElement("button");button.type="button";button.className="country-option"+(selectedCountry===name?" selected":"");
  button.innerHTML=`<span class="country-flag">${flag}</span><span>${name}</span><span class="country-check" aria-hidden="true">✓</span>`;
  button.addEventListener("click",()=>{selectedCountry=name;renderCountries();$("regionContinueBtn").disabled=false;updateCountryPing();});
  host.append(button);
 });
 $("regionContinueBtn").disabled=!(selectedRegion&&selectedCountry);
}
async function saveBasicProfile(user,provider){
 if(!selectedRegion||!selectedCountry)throw new Error("REGION_REQUIRED");
 const profileRef=ref(db,"users/"+user.uid+"/profile");
 // Update only fields owned by this sign-in page. This preserves any legacy
 // profile fields and avoids rewriting unknown children rejected by strict rules.
 const data={uid:user.uid,provider,displayName:user.displayName||"Guest",email:user.email||null,photoURL:user.photoURL||null,region:selectedRegion,country:selectedCountry,lastSignInAt:Date.now()};
 await update(profileRef,data);
}
async function showAuthenticatedUser(user){
 if(!user)return;
 signedInUser=user;
 if(!selectedRegion||!selectedCountry){showRegionStage();return;}
 const isGoogleUser=user.providerData.some(item=>item.providerId==="google.com");
 $("welcomeTitle").textContent="Welcome Back";
 $("welcomeSubtitle").textContent="You are signed in successfully.";
 $("authOptions").hidden=true;$("signedIn").hidden=false;
 $("deleteAccountBtn").hidden=!isGoogleUser;
 showLoginStage();
 try{
  const provider=user.providerData[0]?.providerId||"google.com";
  await saveBasicProfile(user,provider);
  clearStatus();
 }catch(e){
  // Authentication succeeded. Keep Continue available even if the optional
  // profile write is denied, and show the exact Firebase database error code.
  const code=e?.code||"unknown-error";
  showError("Sign-in succeeded, but profile saving failed ("+code+"). Check Realtime Database Rules.");
 }
}
function friendlyError(e){
 const c=e?.code||"";
 if(c==="auth/invalid-api-key"||c.includes("api-key-not-valid"))return "Firebase API Key is invalid or incomplete. Copy the complete Web API Key from this same Firebase project: Project Settings → General → Your apps.";
 if(c==="auth/operation-not-allowed")return "Google sign-in is disabled. Enable Google in Firebase Authentication → Sign-in method.";
 if(c.includes("unauthorized-domain"))return "This website domain is not authorized for Firebase Authentication. Add gamerboyff.github.io in Firebase Authentication → Settings → Authorized domains.";
 if(c.includes("popup-blocked"))return "Google sign-in popup was blocked. Please allow popups and try again.";
 if(c.includes("popup-closed"))return "Google sign-in was closed before completion. Please try again.";
 if(c.includes("network"))return "Network problem. Check your internet connection and try again.";
 if(c==="auth/invalid-credential"||c==="auth/operation-not-supported-in-this-environment")return "Firebase could not complete this sign-in in the current browser. Try the page in Chrome and check Firebase Authentication settings.";
 return "Sign-in could not be completed ("+c+"). Please check Firebase Authentication settings and try again.";
}
function safeNext(){location.href="https://rgsouravbasak-del.github.io/RG-GAMER-BOY-FF-APP/"}

$("regionContinueBtn").addEventListener("click",async()=>{
 if(!selectedRegion||!selectedCountry)return;
 const selection={region:selectedRegion,country:selectedCountry};
 localStorage.setItem(REGION_KEY,JSON.stringify(selection));
 clearStatus();showLoginStage();
 if(signedInUser)await showAuthenticatedUser(signedInUser);
});
$("changeRegionBtn").addEventListener("click",()=>{clearStatus();showRegionStage();});

// The region screen is mandatory after policy acceptance unless a valid choice was saved before.
if(selectedRegion&&selectedCountry){showLoginStage();updateCountryPing();}else showRegionStage();
// Refresh the measured RTDB round-trip automatically without reloading the page.
setInterval(()=>{if(document.visibilityState==="visible")updateCountryPing();},10000);
window.addEventListener("online",()=>updateCountryPing());
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")updateCountryPing();});

$("googleBtn").addEventListener("click",async()=>{
 clearStatus();$("googleBtn").disabled=true;
 try{
  await setPersistence(auth,browserLocalPersistence);
  const p=new GoogleAuthProvider();p.setCustomParameters({prompt:"select_account"});
  try{await signInWithPopup(auth,p);}catch(e){
   if(["auth/popup-blocked","auth/operation-not-supported-in-this-environment"].includes(e.code)){await signInWithRedirect(auth,p);return;}
   throw e;
  }
 }catch(e){showError(friendlyError(e));$("googleBtn").disabled=false;}
});
try{await getRedirectResult(auth)}catch(e){showError(friendlyError(e))}
onAuthStateChanged(auth,async user=>{
 if(!user){signedInUser=null;$("signedIn").hidden=true;$("authOptions").hidden=false;$("deleteAccountBtn").hidden=true;$("welcomeTitle").textContent="Welcome";$("welcomeSubtitle").textContent="Choose how you want to continue.";$("googleBtn").disabled=false;if(selectedRegion&&selectedCountry)showLoginStage();else showRegionStage();return;}
 await showAuthenticatedUser(user);
});
$("continueBtn").addEventListener("click",()=>safeNext());
$("deleteAccountBtn").addEventListener("click",()=>window.open("https://docs.google.com/forms/d/e/1FAIpQLScPdr838eNtKeTrt40nIlzS9w-Sz7Hvsotf1-MZAlXI5JWXEw/viewform?usp=dialog","_blank","noopener,noreferrer"));
