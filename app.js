import { initializeApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, setPersistence, browserLocalPersistence, onAuthStateChanged, signInAnonymously, signOut } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-database.js";

const firebaseConfig = {
 apiKey:"AIzaSyAgMPJwCEbp-Wbw7cbzLOie05xSuzqZVo",
 authDomain:"rg-gamer-boy-ff-official-app.firebaseapp.com",
 databaseURL:"https://rg-gamer-boy-ff-official-app-default-rtdb.asia-southeast1.firebasedatabase.app",
 projectId:"rg-gamer-boy-ff-official-app",
 storageBucket:"rg-gamer-boy-ff-official-app.firebasestorage.app",
 messagingSenderId:"1041785173664",
 appId:"1:1041785173664:web:2c1398ff2727d6211f7bc5",
 measurementId:"G-QJMF0EMC6V"
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

const REGION_KEY="rg_user_region_country_v1";
const COUNTRY_DATA={
 "Asia":[["🇮🇳","India"],["🇵🇰","Pakistan"],["🇧🇩","Bangladesh"],["🇮🇩","Indonesia"],["🇸🇬","Singapore"],["🇻🇳","Vietnam"],["🇳🇵","Nepal"]],
 "Europe":[["🇦🇱","Albania"],["🇦🇩","Andorra"],["🇦🇹","Austria"],["🇧🇾","Belarus"],["🇧🇪","Belgium"],["🇧🇦","Bosnia and Herzegovina"],["🇧🇬","Bulgaria"],["🇭🇷","Croatia"],["🇨🇾","Cyprus"],["🇨🇿","Czechia"],["🇩🇰","Denmark"],["🇪🇪","Estonia"],["🇫🇮","Finland"],["🇫🇷","France"],["🇩🇪","Germany"],["🇬🇷","Greece"],["🇭🇺","Hungary"],["🇮🇸","Iceland"],["🇮🇪","Ireland"],["🇮🇹","Italy"],["🇱🇻","Latvia"],["🇱🇮","Liechtenstein"],["🇱🇹","Lithuania"],["🇱🇺","Luxembourg"],["🇲🇹","Malta"],["🇲🇩","Moldova"],["🇲🇨","Monaco"],["🇲🇪","Montenegro"],["🇳🇱","Netherlands"],["🇲🇰","North Macedonia"],["🇳🇴","Norway"],["🇵🇱","Poland"],["🇵🇹","Portugal"],["🇷🇴","Romania"],["🇷🇺","Russia"],["🇸🇲","San Marino"],["🇷🇸","Serbia"],["🇸🇰","Slovakia"],["🇸🇮","Slovenia"],["🇪🇸","Spain"],["🇸🇪","Sweden"],["🇨🇭","Switzerland"],["🇺🇦","Ukraine"],["🇬🇧","United Kingdom"],["🇻🇦","Vatican City"]],
 "South America":[["🇧🇷","Brazil"]]
};
let savedSelection=null;
try{savedSelection=JSON.parse(localStorage.getItem(REGION_KEY)||"null")}catch{savedSelection=null}
let selectedRegion=COUNTRY_DATA[savedSelection?.region]?savedSelection.region:"";
let selectedCountry=COUNTRY_DATA[selectedRegion]?.some(item=>item[1]===savedSelection?.country)?savedSelection.country:"";
let signedInUser=null;

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
  const symbol=name==="Asia"?"🌏":name==="Europe"?"🌍":"🌎";
  button.innerHTML=`<span class="region-symbol">${symbol}</span><span class="region-option-text"><strong>${name}</strong><small>${COUNTRY_DATA[name].length} ${COUNTRY_DATA[name].length===1?"country":"countries"}</small></span><span class="region-check" aria-hidden="true">✓</span>`;
  button.addEventListener("click",()=>{selectedRegion=name;selectedCountry="";renderRegions();renderCountries();});
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
  button.addEventListener("click",()=>{selectedCountry=name;renderCountries();$("regionContinueBtn").disabled=false;});
  host.append(button);
 });
 $("regionContinueBtn").disabled=!(selectedRegion&&selectedCountry);
}
async function saveBasicProfile(user,provider){
 if(!selectedRegion||!selectedCountry)throw new Error("REGION_REQUIRED");
 const profileRef=ref(db,"users/"+user.uid+"/profile");
 const snapshot=await get(profileRef);
 const previous=snapshot.exists()?snapshot.val():{};
 const data={...previous,uid:user.uid,provider,displayName:user.displayName||previous.displayName||"Guest",email:user.email||previous.email||null,photoURL:user.photoURL||previous.photoURL||null,region:selectedRegion,country:selectedCountry,lastSignInAt:Date.now()};
 await set(profileRef,data);
}
async function showAuthenticatedUser(user){
 if(!user)return;
 signedInUser=user;
 if(!selectedRegion||!selectedCountry){showRegionStage();return;}
 try{
  const provider=user.isAnonymous?"anonymous":(user.providerData[0]?.providerId||"google.com");
  await saveBasicProfile(user,provider);
  const isGoogleUser=user.providerData.some(item=>item.providerId==="google.com");
  $("welcomeTitle").textContent="Welcome Back";
  $("welcomeSubtitle").textContent="You are signed in successfully.";
  $("authOptions").hidden=true;$("signedIn").hidden=false;
  $("deleteAccountBtn").hidden=!isGoogleUser;$("guestLogoutBtn").hidden=!user.isAnonymous;
  showLoginStage();
 }catch(e){showError(e.message==="REGION_REQUIRED"?"Please select your region and country first.":"You are signed in, but profile data could not be saved. Check Realtime Database Rules.");showRegionStage();}
}
function friendlyError(e){
 const c=e?.code||"";
 if(c.includes("unauthorized-domain"))return "This website domain is not authorized for Firebase Authentication. Add rggamerboyff.github.io in Firebase Authentication → Settings → Authorized domains.";
 if(c.includes("popup-blocked"))return "Google sign-in popup was blocked. Please allow popups and try again.";
 if(c.includes("popup-closed"))return "Google sign-in was closed before completion. Please try again.";
 if(c.includes("network"))return "Network problem. Check your internet connection and try again.";
 return "Sign-in could not be completed ("+c+"). Please try again.";
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
if(selectedRegion&&selectedCountry)showLoginStage();else showRegionStage();

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
$("guestBtn").addEventListener("click",async()=>{
 clearStatus();$("guestBtn").disabled=true;
 try{await setPersistence(auth,browserLocalPersistence);await signInAnonymously(auth);}
 catch(e){showError(friendlyError(e));$("guestBtn").disabled=false;}
});
try{await getRedirectResult(auth)}catch(e){showError(friendlyError(e))}
onAuthStateChanged(auth,async user=>{
 if(!user){signedInUser=null;$("signedIn").hidden=true;$("authOptions").hidden=false;$("deleteAccountBtn").hidden=true;$("guestLogoutBtn").hidden=true;$("welcomeTitle").textContent="Welcome";$("welcomeSubtitle").textContent="Choose how you want to continue.";$("googleBtn").disabled=false;$("guestBtn").disabled=false;if(selectedRegion&&selectedCountry)showLoginStage();else showRegionStage();return;}
 await showAuthenticatedUser(user);
});
$("continueBtn").addEventListener("click",()=>safeNext());
$("deleteAccountBtn").addEventListener("click",()=>window.open("https://docs.google.com/forms/d/e/1FAIpQLScPdr838eNtKeTrt40nIlzS9w-Sz7Hvsotf1-MZAlXI5JWXEw/viewform?usp=dialog","_blank","noopener,noreferrer"));
$("guestLogoutBtn").addEventListener("click",async()=>{
 try{await signOut(auth);status.textContent="You have been logged out successfully.";}
 catch(e){showError("Logout could not be completed. Please try again.");}
});
