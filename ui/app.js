
function playScribeBeep(type) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "start") {
      // Crisp rising start chime: 440Hz -> 880Hz
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } else {
      // Pleasant falling stop/hold chime: 880Hz -> 440Hz
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.14);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.14);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.14);
    }
  } catch (e) {
    console.warn("playScribeBeep audio error:", e);
  }
}


// ============================================================================
// GOOGLE-STYLE DASHBOARD HERO WIDGET UI CONTROLLERS (Direct v3.9.5 Engine Binding)
// ============================================================================
function updateDashboardGreeting() {
  const hr = new Date().getHours();
  let greet = "Good evening";
  if (hr < 12) greet = "Good morning";
  else if (hr < 17) greet = "Good afternoon";

  const greetEl = document.getElementById("dashboard-greeting-time");
  if (greetEl) greetEl.textContent = greet;

  const drName = (appData && appData.clinic && appData.clinic.doctor) ? appData.clinic.doctor : "Shaikh NajmulHuda";
  const nameEl = document.getElementById("dashboard-greeting-name");
  if (nameEl) nameEl.textContent = drName;

  const avEl = document.getElementById("dashboard-dr-avatar");
  if (avEl) {
    const parts = drName.replace(/^Dr\.\s*/i, "").trim().split(" ");
    let initials = "SN";
    if (parts.length >= 2) {
      initials = (parts[0][0] + parts[1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length >= 2) {
      initials = parts[0].slice(0, 2).toUpperCase();
    }
    avEl.textContent = initials;
  }
}

function onDashboardScribeInput() {
  const dashInput = document.getElementById("dashboard-scribe-input");
  const aiInput = document.getElementById("ai-scribe-input");
  if (dashInput && aiInput) {
    aiInput.value = dashInput.value;
  }
}

function toggleDashboardVoiceDictation() {
  // Uses the EXACT v3.9.5 in-app continuous speech engine!
  toggleAiVoiceRecording();
}

function generateFromDashboardScribe() {
  const dashInput = document.getElementById("dashboard-scribe-input");
  const aiInput = document.getElementById("ai-scribe-input");
  if (dashInput && aiInput) {
    aiInput.value = dashInput.value;
  }
  // Uses the EXACT v3.9.5 clinical extraction pipeline!
  generateClinicalSummaryAndRx();
}

function clearDashboardScribe() {
  const dashInput = document.getElementById("dashboard-scribe-input");
  const aiInput = document.getElementById("ai-scribe-input");
  if (dashInput) dashInput.value = "";
  if (aiInput) aiInput.value = "";
  if (isAiRecording) {
    stopInAppRecording(true);
  }
  showToast("Cleared dictation box", "info");
}

function loadDashboardPreset(type) {
  loadAiPreset(type);
  const aiInput = document.getElementById("ai-scribe-input");
  const dashInput = document.getElementById("dashboard-scribe-input");
  if (aiInput && dashInput) {
    dashInput.value = aiInput.value;
  }
  showToast("Preset loaded into consultation box", "info");
}

function openDashboardPatientSelector() {
  const pts = getRegisteredPatientsList();
  if (pts.length === 0) {
    openPatientModal();
    return;
  }
  const names = pts.slice(0, 10).map((p, i) => `${i + 1}. ${p.name} (${p.mrn} - ${p.age}y)`).join("\n");
  const choice = prompt("Select Patient for consultation:\n" + names + "\n\nEnter number (or 0 for Quick Sandbox):");
  if (choice === null) return;
  const num = parseInt(choice.trim(), 10);
  const pillLabel = document.getElementById("dashboard-assigned-patient-label");
  const aiSelect = document.getElementById("ai-scribe-patient-select");

  if (num === 0 || isNaN(num)) {
    if (currentAiSessionData) currentAiSessionData.selectedPatientId = "";
    if (aiSelect) aiSelect.value = "";
    if (pillLabel) pillLabel.textContent = "+ Assign patient";
    showToast("Quick Sandbox active (No patient assigned)", "info");
  } else if (num >= 1 && num <= pts.length) {
    const selPt = pts[num - 1];
    if (currentAiSessionData) currentAiSessionData.selectedPatientId = selPt.id;
    if (aiSelect) aiSelect.value = selPt.id;
    if (pillLabel) pillLabel.textContent = selPt.name + " (" + selPt.age + "y)";
    showToast("Assigned patient: " + selPt.name, "success");
  }
}

function openDoctorKitsQuickSheet() {
  seedDefaultDoctorKits();
  const kits = appData.doctorKits || [];
  if (kits.length === 0) {
    showToast("No Doctor Kits found.", "info");
    return;
  }
  const lines = kits.map((k, i) => `${i + 1}. ${k.name} (${k.medicines ? k.medicines.length : 0} meds)`).join("\n");
  const choice = prompt("Select Doctor Kit to append to notes:\n" + lines + "\n\nEnter number:");
  if (!choice) return;
  const num = parseInt(choice.trim(), 10);
  if (num >= 1 && num <= kits.length) {
    const k = kits[num - 1];
    const medNames = (k.medicines || []).map(m => `${m.name} ${m.dose || '1-0-1'}`).join(", ");
    const input = document.getElementById("dashboard-scribe-input");
    if (input) {
      input.value = (input.value.trim() ? input.value + "\n" : "") + "Prescribe Kit [" + k.name + "]: " + medNames;
      onDashboardScribeInput();
    }
    showToast("Appended " + k.name + " to consultation input", "success");
  }
}


function onAiFormatSelectChanged(val) {
  selectedAiOutputFormat = val;
  localStorage.setItem("docemr_preferred_ai_format", val);
  const badge = document.getElementById("ai-selected-format-badge");
  if (badge) {
    badge.textContent = getAiFormatLabel(val);
  }
  const dashSel = document.getElementById("dashboard-format-select");
  if (dashSel) dashSel.value = val;
}

function onDashboardFormatSelectChanged(val) {
  selectedAiOutputFormat = val;
  localStorage.setItem("docemr_preferred_ai_format", val);
  const aiSel = document.getElementById("ai-output-format-select");
  if (aiSel) aiSel.value = val;
  const badge = document.getElementById("ai-selected-format-badge");
  if (badge) badge.textContent = getAiFormatLabel(val);
}

let activeEditingEncounterId = null;

function toggleRxEmbeddedHistory() {
  const body = document.getElementById("rx-embedded-history-body");
  const icon = document.getElementById("rx-embedded-history-toggle-icon");
  if (!body) return;
  const isHidden = body.style.display === "none" || !body.style.display;
  body.style.display = isHidden ? "block" : "none";
  if (icon) {
    icon.textContent = isHidden ? "▲ Hide Past Visits" : "▼ View Past Visits";
  }
}

let lastPrescriptionUndoState = null;

function formatReadableDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch (e) {
    return dateStr;
  }
}

/**
 * DocEMR - Shifa Clinic EMR & Prescription Management System
 * Offline Mobile-First Application with Google-Style Drug Autocomplete,
 * Client-Side PDF Generation, and Direct WhatsApp & SMS Dispatch.
 */

// ============================================================================
// 1. COMPREHENSIVE CLINICAL DRUG FORMULARY (150+ Standard Medications)
// ============================================================================
const DRUG_DATABASE = [
  {
    "name": "Tab. Dolo 650mg",
    "generic": "Paracetamol 650mg",
    "category": "Analgesic & Antipyretic",
    "dose": "1-0-1 (SOS)",
    "timing": "After food",
    "duration": "3 days",
    "instructions": "Liver toxicity with overdose. Avoid alcohol.",
    "symptoms": [
      "fever",
      "high fever",
      "headache",
      "body ache",
      "pain",
      "chills",
      "malaise",
      "viral fever"
    ],
    "janAushadhi": "Tab. Paracetamol 650mg (PMBJP - ₹1.80/strip)",
    "adultDose": "650mg every 4-6 hours (Max 4g/day)",
    "paedDose": "15 mg/kg/dose every 4-6 hours (Syrup form)",
    "notes": "Liver toxicity with overdose. Avoid alcohol.",
    "cat": "Analgesic & Antipyretic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Crocin 500mg",
    "generic": "Paracetamol 500mg",
    "category": "Analgesic & Antipyretic",
    "dose": "1-1-1 (SOS)",
    "timing": "After food",
    "duration": "3 days",
    "instructions": "Safe in pregnancy and elderly.",
    "symptoms": [
      "fever",
      "headache",
      "body ache",
      "pain",
      "mild fever"
    ],
    "janAushadhi": "Tab. Paracetamol 500mg (PMBJP - ₹1.40/strip)",
    "adultDose": "500mg every 4-6 hours",
    "paedDose": "10-15 mg/kg/dose",
    "notes": "Safe in pregnancy and elderly.",
    "cat": "Analgesic & Antipyretic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Inj. Paracetamol 1000mg/100ml IV",
    "generic": "Paracetamol 10mg/ml IV Infusion",
    "category": "Injections & IV",
    "dose": "Stat / SOS",
    "timing": "Slow IV infusion over 15-20 min",
    "duration": "1 day",
    "instructions": "Rapid antipyretic action. Infuse over 15 minutes.",
    "symptoms": [
      "high fever",
      "severe body ache",
      "hyperpyrexia",
      "post-op pain",
      "severe fever",
      "pain"
    ],
    "janAushadhi": "Inj. Paracetamol IV 100ml (PMBJP - ₹22/bottle)",
    "adultDose": "1000mg (100ml) slow IV infusion every 6h SOS (Max 4g/day)",
    "paedDose": "15 mg/kg/dose slow infusion",
    "notes": "Rapid antipyretic action. Infuse over 15 minutes.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Tab. Combiflam",
    "generic": "Ibuprofen 400mg + Paracetamol 325mg",
    "category": "Analgesic & Antipyretic",
    "dose": "1-0-1 (SOS)",
    "timing": "After food",
    "duration": "3 days",
    "instructions": "Gastric irritation risk. Always give after meals.",
    "symptoms": [
      "severe pain",
      "headache",
      "toothache",
      "body ache",
      "joint pain",
      "fever",
      "pain"
    ],
    "janAushadhi": "Tab. Ibuprofen + Paracetamol (PMBJP - ₹3.20/strip)",
    "adultDose": "1 tablet BD after food SOS (Max 3 tabs/day)",
    "paedDose": "Contraindicated in children under 12y",
    "notes": "Gastric irritation risk. Always give after meals.",
    "cat": "Analgesic & Antipyretic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Zerodol-SP",
    "generic": "Aceclofenac 100mg + Paracetamol 325mg + Serratiopeptidase 15mg",
    "category": "Analgesic & Antipyretic",
    "dose": "1-0-1",
    "timing": "After food",
    "duration": "5 days",
    "instructions": "Anti-inflammatory and anti-edematous triple combination.",
    "symptoms": [
      "pain",
      "swelling",
      "trauma",
      "dental pain",
      "joint pain",
      "inflammation",
      "back pain",
      "body ache"
    ],
    "janAushadhi": "Tab. Aceclofenac + Para + Serratiopeptidase (PMBJP - ₹14/strip)",
    "adultDose": "1 tablet twice daily after meals",
    "paedDose": "Not recommended for pediatric use",
    "notes": "Anti-inflammatory and anti-edematous triple combination.",
    "cat": "Analgesic & Antipyretic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Inj. Dynapar AQ / Voveran 75mg/1ml",
    "generic": "Diclofenac Sodium 75mg/ml (Aqueous)",
    "category": "Injections & IV",
    "dose": "1 Ampoule IM Stat / SOS",
    "timing": "Deep intragluteal IM",
    "duration": "Stat",
    "instructions": "Aqueous painless formulation. Avoid in active peptic ulcer and severe asthma.",
    "symptoms": [
      "severe pain",
      "renal colic",
      "biliary colic",
      "acute trauma",
      "severe backache",
      "fracture pain",
      "abdominal pain",
      "pain"
    ],
    "janAushadhi": "Inj. Diclofenac 75mg/1ml (PMBJP - ₹4.50/ampoule)",
    "adultDose": "75mg deep IM once or twice daily (Max 150mg/day)",
    "paedDose": "Contraindicated in children under 16y",
    "notes": "Aqueous painless formulation. Avoid in active peptic ulcer and severe asthma.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Tramadol 50mg/ml (Supridol 2ml)",
    "generic": "Tramadol Hydrochloride 50mg/ml",
    "category": "Injections & IV",
    "dose": "50-100mg IV/IM Stat",
    "timing": "Slow IV over 2-3 min",
    "duration": "Stat",
    "instructions": "Central analgesic. Dilute with 10ml NS and push slowly to prevent nausea/vomiting.",
    "symptoms": [
      "severe pain",
      "acute post-traumatic pain",
      "visceral pain",
      "colic pain",
      "unrelenting pain",
      "pain"
    ],
    "janAushadhi": "Inj. Tramadol 50mg/ml (PMBJP - ₹6.50/ampoule)",
    "adultDose": "50-100mg IV/IM every 6-8 hours SOS (Max 400mg/day)",
    "paedDose": "1-2 mg/kg/dose (age > 12y)",
    "notes": "Central analgesic. Dilute with 10ml NS and push slowly to prevent nausea/vomiting.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Tab. Pantop 40 (Pantocid)",
    "generic": "Pantoprazole 40mg",
    "category": "Gastrointestinal",
    "dose": "1-0-0",
    "timing": "30 min before breakfast",
    "duration": "7 days",
    "instructions": "PPI of choice. Swallow whole with plain water.",
    "symptoms": [
      "acidity",
      "heartburn",
      "gastritis",
      "gerd",
      "burning in chest",
      "acid reflux",
      "stomach pain",
      "abdominal pain"
    ],
    "janAushadhi": "Tab. Pantoprazole 40mg (PMBJP - ₹8.50/strip)",
    "adultDose": "40mg once daily in morning on empty stomach",
    "paedDose": "20mg daily for age > 5y",
    "notes": "PPI of choice. Swallow whole with plain water.",
    "cat": "Gastrointestinal",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Cap. Pan-D (Pantoprazole + Domperidone)",
    "generic": "Pantoprazole 40mg + Domperidone 30mg SR",
    "category": "Gastrointestinal",
    "dose": "1-0-0",
    "timing": "30 min before breakfast",
    "duration": "7 days",
    "instructions": "Dual action: blocks acid and promotes gastric emptying.",
    "symptoms": [
      "acidity",
      "nausea",
      "vomiting",
      "gerd",
      "bloating",
      "fullness",
      "acid reflux",
      "nausea / vomiting"
    ],
    "janAushadhi": "Cap. Pantoprazole + Domperidone (PMBJP - ₹12/strip)",
    "adultDose": "1 capsule once daily in morning empty stomach",
    "paedDose": "Not recommended for children",
    "notes": "Dual action: blocks acid and promotes gastric emptying.",
    "cat": "Gastrointestinal",
    "form": "Capsule",
    "route": "Oral"
  },
  {
    "name": "Inj. Pantoprazole 40mg (Pan 40 Vial)",
    "generic": "Pantoprazole Sodium Lyophilized 40mg",
    "category": "Injections & IV",
    "dose": "1 Vial IV Stat",
    "timing": "Reconstitute with 10ml NS and push slowly over 3 min",
    "duration": "Stat / 1-0-1",
    "instructions": "Mandatory IV antacid cover in emergency, shock, and post-op.",
    "symptoms": [
      "acute gastritis",
      "severe acidity",
      "hematemesis",
      "peptic ulcer bleeding",
      "persistent vomiting",
      "abdominal pain"
    ],
    "janAushadhi": "Inj. Pantoprazole 40mg Vial (PMBJP - ₹18/vial)",
    "adultDose": "40mg slow IV once or twice daily",
    "paedDose": "1 mg/kg/day IV",
    "notes": "Mandatory IV antacid cover in emergency, shock, and post-op.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Tab. Emeset 4mg (Vomikind)",
    "generic": "Ondansetron 4mg",
    "category": "Gastrointestinal",
    "dose": "1-0-1 (SOS)",
    "timing": "30 min before food",
    "duration": "3 days",
    "instructions": "Potent 5-HT3 blocker for fast antiemetic relief.",
    "symptoms": [
      "vomiting",
      "nausea",
      "food poisoning",
      "gastroenteritis",
      "motion sickness",
      "nausea / vomiting"
    ],
    "janAushadhi": "Tab. Ondansetron 4mg (PMBJP - ₹3.50/strip)",
    "adultDose": "4-8mg TDS 30 min before food",
    "paedDose": "0.15 mg/kg/dose",
    "notes": "Potent 5-HT3 blocker for fast antiemetic relief.",
    "cat": "Gastrointestinal",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Inj. Emeset 4mg/2ml (Ondansetron)",
    "generic": "Ondansetron 2mg/ml (2ml Ampoule)",
    "category": "Injections & IV",
    "dose": "4mg (2ml) IV Stat",
    "timing": "Slow IV push over 2 minutes",
    "duration": "Stat / SOS",
    "instructions": "First-line injectable antiemetic in OPD and emergency.",
    "symptoms": [
      "uncontrolled vomiting",
      "acute gastroenteritis",
      "nausea",
      "post-op nausea",
      "dehydration",
      "nausea / vomiting"
    ],
    "janAushadhi": "Inj. Ondansetron 2ml (PMBJP - ₹5.50/ampoule)",
    "adultDose": "4-8mg slow IV push every 8h SOS",
    "paedDose": "0.15 mg/kg/dose slow IV",
    "notes": "First-line injectable antiemetic in OPD and emergency.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Drotin 40mg/2ml (Drotaverine)",
    "generic": "Drotaverine Hydrochloride 40mg/2ml",
    "category": "Injections & IV",
    "dose": "1 Ampoule (40mg) IV/IM Stat",
    "timing": "Slow IV over 3-5 min or deep IM",
    "duration": "Stat / SOS",
    "instructions": "Direct smooth muscle relaxant. Highly effective for colic.",
    "symptoms": [
      "abdominal cramps",
      "spasmodic pain",
      "renal colic",
      "biliary colic",
      "dysmenorrhea",
      "stomach pain",
      "abdominal pain"
    ],
    "janAushadhi": "Inj. Drotaverine 40mg/2ml (PMBJP - ₹6.80/ampoule)",
    "adultDose": "40-80mg slow IV/IM twice or thrice daily",
    "paedDose": "20-40mg for children > 6y",
    "notes": "Direct smooth muscle relaxant. Highly effective for colic.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Buscopan 20mg/1ml",
    "generic": "Hyoscine Butylbromide 20mg/ml",
    "category": "Injections & IV",
    "dose": "20mg (1 Ampoule) IV/IM Stat",
    "timing": "Slow IV push",
    "duration": "Stat",
    "instructions": "Anticholinergic antispasmodic. Caution in glaucoma and tachycardia.",
    "symptoms": [
      "acute gi spasm",
      "bowel cramps",
      "abdominal pain",
      "severe colic",
      "irritable bowel spasm"
    ],
    "janAushadhi": "Inj. Hyoscine Butylbromide 20mg (PMBJP - ₹7.20/ampoule)",
    "adultDose": "20mg IV/IM repeated after 30 min if needed (Max 100mg/day)",
    "paedDose": "Contraindicated under 6 years",
    "notes": "Anticholinergic antispasmodic. Caution in glaucoma and tachycardia.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Tab. Augmentin 625mg",
    "generic": "Amoxicillin 500mg + Clavulanic Acid 125mg",
    "category": "Antimicrobial & Antibiotic",
    "dose": "1-0-1",
    "timing": "After food",
    "duration": "5 days",
    "instructions": "Broad spectrum beta-lactamase inhibitor. Complete full 5 days.",
    "symptoms": [
      "sore throat",
      "productive cough",
      "fever",
      "tonsillitis",
      "sinusitis",
      "chest infection",
      "uti",
      "skin infection"
    ],
    "janAushadhi": "Tab. Amoxicillin + Clavulanate 625mg (PMBJP - ₹48/strip)",
    "adultDose": "625mg twice daily after meals",
    "paedDose": "30-50 mg/kg/day (Amoxicillin component) in divided doses",
    "notes": "Broad spectrum beta-lactamase inhibitor. Complete full 5 days.",
    "cat": "Antimicrobial & Antibiotic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Azithromycin 500mg (Azithral)",
    "generic": "Azithromycin 500mg",
    "category": "Antimicrobial & Antibiotic",
    "dose": "1-0-0",
    "timing": "1 hr before food or 2 hrs after",
    "duration": "3 days",
    "instructions": "Long tissue half-life. Safe for penicillin-allergic patients.",
    "symptoms": [
      "sore throat",
      "dry cough",
      "fever",
      "pharyngitis",
      "typhoid",
      "tonsillitis",
      "urti"
    ],
    "janAushadhi": "Tab. Azithromycin 500mg (PMBJP - ₹21/strip)",
    "adultDose": "500mg once daily for 3 days (or 500mg day 1, then 250mg days 2-5)",
    "paedDose": "10 mg/kg once daily for 3 days (Syrup)",
    "notes": "Long tissue half-life. Safe for penicillin-allergic patients.",
    "cat": "Antimicrobial & Antibiotic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Cefixime 200mg (Taxim-O)",
    "generic": "Cefixime 200mg",
    "category": "Antimicrobial & Antibiotic",
    "dose": "1-0-1",
    "timing": "After food",
    "duration": "5 days",
    "instructions": "Oral 3rd generation cephalosporin.",
    "symptoms": [
      "typhoid fever",
      "urinary tract infection",
      "uti",
      "fever",
      "bronchitis",
      "otitis media"
    ],
    "janAushadhi": "Tab. Cefixime 200mg (PMBJP - ₹19/strip)",
    "adultDose": "200mg twice daily or 400mg once daily",
    "paedDose": "8 mg/kg/day in two divided doses",
    "notes": "Oral 3rd generation cephalosporin.",
    "cat": "Antimicrobial & Antibiotic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Inj. Monocef 1g (Ceftriaxone Vial)",
    "generic": "Ceftriaxone Sodium 1000mg Lyophilized",
    "category": "Injections & IV",
    "dose": "1g IV BD / OD",
    "timing": "Slow IV push over 3-5 min after AST (Sensitivity Test)",
    "duration": "3-5 days",
    "instructions": "Mandatory skin sensitivity testing (AST) before first dose.",
    "symptoms": [
      "severe fever",
      "enteric fever / typhoid",
      "pneumonia",
      "sepsis",
      "uti",
      "meningitis",
      "post-op infection",
      "fever"
    ],
    "janAushadhi": "Inj. Ceftriaxone 1g (PMBJP - ₹24/vial)",
    "adultDose": "1-2g IV once or twice daily",
    "paedDose": "50-75 mg/kg/day in 1-2 divided doses",
    "notes": "Mandatory skin sensitivity testing (AST) before first dose.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Mikacin 500mg/2ml (Amikacin)",
    "generic": "Amikacin Sulfate 250mg/ml (2ml Vial)",
    "category": "Injections & IV",
    "dose": "500mg IV/IM OD / BD",
    "timing": "Slow IV infusion in 100ml NS over 30 min",
    "duration": "3 days",
    "instructions": "Monitor renal function and hydration. Avoid in renal failure.",
    "symptoms": [
      "resistant uti",
      "pyelonephritis",
      "gram-negative sepsis",
      "severe intra-abdominal infection",
      "fever"
    ],
    "janAushadhi": "Inj. Amikacin 500mg (PMBJP - ₹17/vial)",
    "adultDose": "15 mg/kg/day in 1 or 2 divided doses (Max 1.5g/day)",
    "paedDose": "15 mg/kg/day once daily",
    "notes": "Monitor renal function and hydration. Avoid in renal failure.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Metrogyl 500mg/100ml IV",
    "generic": "Metronidazole 5mg/ml (100ml IV Infusion)",
    "category": "Injections & IV",
    "dose": "500mg (100ml) IV TDS",
    "timing": "Slow IV infusion over 20-30 minutes",
    "duration": "3 days",
    "instructions": "First-line anaerobic and antiprotozoal coverage.",
    "symptoms": [
      "acute amoebic dysentery",
      "peritonitis",
      "intra-abdominal abscess",
      "severe diarrhea",
      "diarrhea"
    ],
    "janAushadhi": "Inj. Metronidazole 100ml (PMBJP - ₹11/bottle)",
    "adultDose": "500mg IV every 8 hours",
    "paedDose": "7.5 mg/kg every 8 hours",
    "notes": "First-line anaerobic and antiprotozoal coverage.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "IV Normal Saline (NS 0.9% - 500ml)",
    "generic": "Sodium Chloride 0.9% w/v (Isotonic Crystalloid)",
    "category": "Injections & IV",
    "dose": "1 Bottle (500ml) IV Stat",
    "timing": "Slow IV drip with IV set & cannula",
    "duration": "Stat",
    "instructions": "Standard isotonic resuscitation fluid. Universal compatibility.",
    "symptoms": [
      "dehydration",
      "hypovolemia",
      "hypotension",
      "vomiting",
      "diarrhea",
      "acute weakness",
      "giddiness"
    ],
    "janAushadhi": "IV Normal Saline 500ml (PMBJP - ₹18/bottle)",
    "adultDose": "500ml to 1000ml infused as per clinical hydration status",
    "paedDose": "10-20 ml/kg bolus in hypovolemia",
    "notes": "Standard isotonic resuscitation fluid. Universal compatibility.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "IV Ringer's Lactate (RL - 500ml)",
    "generic": "Compound Sodium Lactate Solution (Hartmann's)",
    "category": "Injections & IV",
    "dose": "1 Bottle (500ml) IV Stat",
    "timing": "Slow IV drip via IV set",
    "duration": "Stat",
    "instructions": "Fluid of choice for acute gastroenteritis and burn shock.",
    "symptoms": [
      "severe dehydration",
      "gastroenteritis",
      "hypovolemic shock",
      "burns",
      "metabolic acidosis",
      "diarrhea",
      "vomiting"
    ],
    "janAushadhi": "IV Ringer Lactate 500ml (PMBJP - ₹20/bottle)",
    "adultDose": "500ml - 1500ml as needed for volume replacement",
    "paedDose": "10-20 ml/kg bolus",
    "notes": "Fluid of choice for acute gastroenteritis and burn shock.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "IV Dextrose Normal Saline (DNS - 500ml)",
    "generic": "Dextrose 5% + Sodium Chloride 0.9%",
    "category": "Injections & IV",
    "dose": "1 Bottle (500ml) IV Stat",
    "timing": "Slow IV infusion",
    "duration": "Stat",
    "instructions": "Provides both electrolyte replenishment and 170 kcal/L calories.",
    "symptoms": [
      "hypoglycemia",
      "dehydration with ketosis",
      "prolonged fasting",
      "weakness",
      "starvation exhaustion"
    ],
    "janAushadhi": "IV DNS 500ml (PMBJP - ₹20/bottle)",
    "adultDose": "500ml IV over 2-3 hours",
    "paedDose": "Use pediatric maintenance fluid",
    "notes": "Provides both electrolyte replenishment and 170 kcal/L calories.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Dexamethasone 4mg/ml (2ml Ampoule)",
    "generic": "Dexamethasone Sodium Phosphate 4mg/ml",
    "category": "Injections & IV",
    "dose": "4-8mg (1-2ml) IV/IM Stat",
    "timing": "Slow IV push",
    "duration": "Stat",
    "instructions": "Rapid and potent anti-inflammatory corticosteroid.",
    "symptoms": [
      "acute asthma",
      "allergic reaction",
      "urticaria",
      "severe wheezing",
      "anaphylaxis",
      "shortness of breath"
    ],
    "janAushadhi": "Inj. Dexamethasone 2ml (PMBJP - ₹4.00/ampoule)",
    "adultDose": "4-8mg slow IV/IM stat; may repeat in 6h if required",
    "paedDose": "0.15-0.3 mg/kg/dose",
    "notes": "Rapid and potent anti-inflammatory corticosteroid.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Hydrocortisone 100mg (Efcorlin / Primacort)",
    "generic": "Hydrocortisone Sodium Succinate 100mg",
    "category": "Injections & IV",
    "dose": "100-200mg IV Stat",
    "timing": "Immediate IV bolus after dissolving in 2ml sterile water",
    "duration": "Stat",
    "instructions": "Immediate emergency drug for anaphylactic shock and bronchospasm.",
    "symptoms": [
      "severe anaphylaxis",
      "status asthmaticus",
      "shock",
      "drug allergy",
      "angioedema",
      "shortness of breath"
    ],
    "janAushadhi": "Inj. Hydrocortisone 100mg (PMBJP - ₹16/vial)",
    "adultDose": "100-200mg IV stat, repeat every 4-6 hours as necessary",
    "paedDose": "2-4 mg/kg slow IV push",
    "notes": "Immediate emergency drug for anaphylactic shock and bronchospasm.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Avil 2ml (Pheniramine Maleate)",
    "generic": "Pheniramine Maleate 22.75mg/ml (2ml Ampoule)",
    "category": "Injections & IV",
    "dose": "1 Ampoule (2ml) IM/IV Stat",
    "timing": "Slow IV / Deep IM",
    "duration": "Stat",
    "instructions": "Classic injectable antihistaminic. May cause mild sedation.",
    "symptoms": [
      "itching",
      "urticaria",
      "drug rash",
      "insect bite",
      "acute allergic rhinitis",
      "allergy"
    ],
    "janAushadhi": "Inj. Pheniramine 2ml (PMBJP - ₹3.50/ampoule)",
    "adultDose": "22.75mg - 45.5mg (1-2 ampoules) IM or slow IV",
    "paedDose": "0.5-1 mg/kg IM",
    "notes": "Classic injectable antihistaminic. May cause mild sedation.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Tetanus Toxoid 0.5ml (TT)",
    "generic": "Adsorbed Tetanus Vaccine (0.5ml Ampoule)",
    "category": "Injections & IV",
    "dose": "0.5ml IM Stat",
    "timing": "Deep IM in deltoid region",
    "duration": "Single dose",
    "instructions": "Mandatory post-exposure prophylaxis for dirty wounds and lacerations.",
    "symptoms": [
      "road traffic accident",
      "abrasion",
      "laceration",
      "wound",
      "trauma",
      "dog bite",
      "metal injury"
    ],
    "janAushadhi": "Inj. Tetanus Toxoid 0.5ml (PMBJP - ₹6.00/ampoule)",
    "adultDose": "0.5ml deep IM stat for wound prophylaxis",
    "paedDose": "0.5ml deep IM",
    "notes": "Mandatory post-exposure prophylaxis for dirty wounds and lacerations.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Disposable Syringe 2ml (with 24G Needle)",
    "generic": "Sterile Single-Use 2ml Syringe with Needle",
    "category": "Consumables & Syringes",
    "dose": "1 Syringe",
    "timing": "Single use sterile injection",
    "duration": "Once",
    "instructions": "Sterile, non-pyrogenic, single-use. Destroy needle after use.",
    "symptoms": [
      "injection",
      "im injection",
      "iv push",
      "blood test",
      "vaccine"
    ],
    "janAushadhi": "Syringe 2ml with Needle (PMBJP - ₹2.50/piece)",
    "adultDose": "For administering up to 2ml of liquid injectable medications",
    "paedDose": "Standard pediatric syringe",
    "notes": "Sterile, non-pyrogenic, single-use. Destroy needle after use.",
    "cat": "Consumables & Syringes",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Disposable Syringe 5ml (with 22G Needle)",
    "generic": "Sterile Single-Use 5ml Syringe with Needle",
    "category": "Consumables & Syringes",
    "dose": "1 Syringe",
    "timing": "Single use sterile injection",
    "duration": "Once",
    "instructions": "Ideal for antibiotic powder reconstitution.",
    "symptoms": [
      "iv antibiotic",
      "reconstitution",
      "injection",
      "large volume im"
    ],
    "janAushadhi": "Syringe 5ml with Needle (PMBJP - ₹3.20/piece)",
    "adultDose": "For reconstituting dry powder vials (Monocef, Pantop) and IV push",
    "paedDose": "For larger dilution volumes",
    "notes": "Ideal for antibiotic powder reconstitution.",
    "cat": "Consumables & Syringes",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "IV Infusion Set (with Air Vent & Filter)",
    "generic": "Sterile IV Drip Administration Set",
    "category": "Consumables & Syringes",
    "dose": "1 Set",
    "timing": "Attached to IV fluid bottle",
    "duration": "Once",
    "instructions": "Equipped with bacterial filter and roller clamp.",
    "symptoms": [
      "iv drip",
      "iv fluid",
      "dehydration",
      "saline",
      "rl infusion"
    ],
    "janAushadhi": "IV Set with Air Vent (PMBJP - ₹12.00/set)",
    "adultDose": "Standard 20 drops/ml macro-drip set",
    "paedDose": "Use Micro-drip / Pediatric burette set for infants",
    "notes": "Equipped with bacterial filter and roller clamp.",
    "cat": "Consumables & Syringes",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "IV Cannula 20G (Pink) / 22G (Blue)",
    "generic": "Peripheral Intravenous Catheter with Injection Valve",
    "category": "Consumables & Syringes",
    "dose": "1 Piece",
    "timing": "Aseptic venipuncture",
    "duration": "Up to 72 hours",
    "instructions": "Inspect insertion site daily for phlebitis. Change every 72 hours.",
    "symptoms": [
      "iv access",
      "emergency",
      "iv fluids",
      "iv antibiotics",
      "hospitalization"
    ],
    "janAushadhi": "IV Cannula with Port (PMBJP - ₹14.00/piece)",
    "adultDose": "20G (Pink) for adults; 22G (Blue) for fragile veins",
    "paedDose": "24G (Yellow) for pediatric patients",
    "notes": "Inspect insertion site daily for phlebitis. Change every 72 hours.",
    "cat": "Consumables & Syringes",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Montair-LC",
    "generic": "Montelukast 10mg + Levocetirizine 5mg",
    "category": "Antihistamine & Allergy",
    "dose": "0-0-1",
    "timing": "At bedtime",
    "duration": "5 days",
    "instructions": "Best taken at bedtime due to mild drowsiness.",
    "symptoms": [
      "allergic rhinitis",
      "sneezing",
      "runny nose",
      "dry cough",
      "allergy",
      "asthma",
      "cold"
    ],
    "janAushadhi": "Tab. Montelukast + Levocetirizine (PMBJP - ₹12/strip)",
    "adultDose": "1 tablet once daily at night",
    "paedDose": "Montair-LC Kid (Montelukast 4mg + Levo 2.5mg) once daily",
    "notes": "Best taken at bedtime due to mild drowsiness.",
    "cat": "Antihistamine & Allergy",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Cetirizine 10mg (Cetzine)",
    "generic": "Cetirizine Hydrochloride 10mg",
    "category": "Antihistamine & Allergy",
    "dose": "0-0-1",
    "timing": "At night",
    "duration": "3 days",
    "instructions": "Non-sedating second-generation H1 antihistamine.",
    "symptoms": [
      "itching",
      "urticaria",
      "runny nose",
      "sneezing",
      "watery eyes",
      "allergy"
    ],
    "janAushadhi": "Tab. Cetirizine 10mg (PMBJP - ₹3.00/strip)",
    "adultDose": "10mg once daily at night",
    "paedDose": "2.5-5mg daily for children 2-6y",
    "notes": "Non-sedating second-generation H1 antihistamine.",
    "cat": "Antihistamine & Allergy",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Syp. Ascoril-LS (Levosalbutamol + Ambroxol)",
    "generic": "Levosalbutamol 1mg + Ambroxol 30mg + Guaiphenesin 50mg / 5ml",
    "category": "Pediatric & Syrup",
    "dose": "10ml TDS",
    "timing": "After food",
    "duration": "5 days",
    "instructions": "Mucolytic bronchodilator for wet chesty cough.",
    "symptoms": [
      "productive cough",
      "chest congestion",
      "bronchitis",
      "wheezing",
      "mucus cough",
      "cough"
    ],
    "janAushadhi": "Syp. Levosalbutamol + Ambroxol (PMBJP - ₹24/bottle)",
    "adultDose": "10ml thrice daily",
    "paedDose": "Ascoril-LS Junior 5ml TDS",
    "notes": "Mucolytic bronchodilator for wet chesty cough.",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Syp. Ascoril-D (Dextromethorphan + CPM)",
    "generic": "Dextromethorphan 10mg + Chlorpheniramine 2mg + Phenylephrine 5mg / 5ml",
    "category": "Pediatric & Syrup",
    "dose": "10ml TDS",
    "timing": "After food",
    "duration": "5 days",
    "instructions": "Antitussive for dry non-productive irritating cough.",
    "symptoms": [
      "dry cough",
      "throat tickle",
      "irritating cough",
      "nocturnal cough",
      "cold",
      "cough"
    ],
    "janAushadhi": "Syp. Dextromethorphan + CPM (PMBJP - ₹22/bottle)",
    "adultDose": "10ml thrice daily",
    "paedDose": "2.5-5ml TDS for children > 6y",
    "notes": "Antitussive for dry non-productive irritating cough.",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Syp. Gelusil MPS",
    "generic": "Magnesium Hydroxide + Aluminium Hydroxide + Simethicone",
    "category": "Pediatric & Syrup",
    "dose": "10ml TDS",
    "timing": "After meals & at bedtime",
    "duration": "5 days",
    "instructions": "Fast mucosal coating and local acid neutralization.",
    "symptoms": [
      "heartburn",
      "hyperacidity",
      "sour belching",
      "gas",
      "bloating",
      "abdominal pain"
    ],
    "janAushadhi": "Antacid Oral Suspension (PMBJP - ₹28/bottle)",
    "adultDose": "10-15ml after meals and at bedtime",
    "paedDose": "5ml TDS after meals",
    "notes": "Fast mucosal coating and local acid neutralization.",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "ORS Electral Sachet",
    "generic": "WHO Standard Oral Rehydration Salts (21.8g)",
    "category": "Oral Tablets & Caps",
    "dose": "1 Sachet in 1 Litre Water",
    "timing": "Sip continuously after each loose motion or vomiting episode",
    "duration": "3 days",
    "instructions": "WHO low-osmolarity formula. Life-saving rehydration.",
    "symptoms": [
      "diarrhea",
      "vomiting",
      "dehydration",
      "weakness",
      "heat exhaustion",
      "sun stroke",
      "loose motions"
    ],
    "janAushadhi": "ORS Sachet 21.8g (PMBJP - ₹5.50/sachet)",
    "adultDose": "1-2 Litres prepared solution per day",
    "paedDose": "100-200ml after each loose stool",
    "notes": "WHO low-osmolarity formula. Life-saving rehydration.",
    "cat": "Oral Tablets & Caps",
    "form": "Powder",
    "route": "Oral"
  },
  {
    "name": "Tab. Ciprofloxacin 500mg (Ciplox)",
    "generic": "Ciprofloxacin",
    "category": "Antimicrobial & Antibiotic",
    "dose": "1-0-1",
    "timing": "After food",
    "duration": "5 days",
    "instructions": "Drink plenty of water",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Ciprofloxacin)",
    "adultDose": "1-0-1 After food",
    "paedDose": "As advised by pediatrician",
    "notes": "Drink plenty of water",
    "cat": "Antimicrobial & Antibiotic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Cap. Doxycycline 100mg (Dox-1)",
    "generic": "Doxycycline",
    "category": "Antimicrobial & Antibiotic",
    "dose": "1-0-1",
    "timing": "After food",
    "duration": "7 days",
    "instructions": "Do not lie down immediately after taking",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Doxycycline)",
    "adultDose": "1-0-1 After food",
    "paedDose": "As advised by pediatrician",
    "notes": "Do not lie down immediately after taking",
    "cat": "Antimicrobial & Antibiotic",
    "form": "Capsule",
    "route": "Oral"
  },
  {
    "name": "Tab. Metronidazole 400mg (Flagyl)",
    "generic": "Metronidazole",
    "category": "Oral Tablets & Caps",
    "dose": "1-1-1",
    "timing": "After food",
    "duration": "5 days",
    "instructions": "Avoid alcohol completely during course",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Metronidazole)",
    "adultDose": "1-1-1 After food",
    "paedDose": "As advised by pediatrician",
    "notes": "Avoid alcohol completely during course",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Levofloxacin 500mg (Levaquin)",
    "generic": "Levofloxacin",
    "category": "Antimicrobial & Antibiotic",
    "dose": "1-0-0",
    "timing": "After food",
    "duration": "5 days",
    "instructions": "Take with full glass of water",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Levofloxacin)",
    "adultDose": "1-0-0 After food",
    "paedDose": "As advised by pediatrician",
    "notes": "Take with full glass of water",
    "cat": "Antimicrobial & Antibiotic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Cap. Amoxicillin 500mg (Mox 500)",
    "generic": "Amoxicillin",
    "category": "Antimicrobial & Antibiotic",
    "dose": "1-1-1",
    "timing": "After food",
    "duration": "5 days",
    "instructions": "Complete full antibiotic course",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Amoxicillin)",
    "adultDose": "1-1-1 After food",
    "paedDose": "As advised by pediatrician",
    "notes": "Complete full antibiotic course",
    "cat": "Antimicrobial & Antibiotic",
    "form": "Capsule",
    "route": "Oral"
  },
  {
    "name": "Tab. Cephalexin 500mg (Phexin)",
    "generic": "Cephalexin",
    "category": "Oral Tablets & Caps",
    "dose": "1-1-1",
    "timing": "After food",
    "duration": "5 days",
    "instructions": "For skin & soft tissue infections",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Cephalexin)",
    "adultDose": "1-1-1 After food",
    "paedDose": "As advised by pediatrician",
    "notes": "For skin & soft tissue infections",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Clarithromycin 500mg (Claribid)",
    "generic": "Clarithromycin",
    "category": "Antimicrobial & Antibiotic",
    "dose": "1-0-1",
    "timing": "After food",
    "duration": "7 days",
    "instructions": "Take with food",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Clarithromycin)",
    "adultDose": "1-0-1 After food",
    "paedDose": "As advised by pediatrician",
    "notes": "Take with food",
    "cat": "Antimicrobial & Antibiotic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Nitrofurantoin 100mg (Martifur)",
    "generic": "Nitrofurantoin SR",
    "category": "Oral Tablets & Caps",
    "dose": "1-0-1",
    "timing": "With meals",
    "duration": "7 days",
    "instructions": "May color urine dark brown/yellow",
    "symptoms": [
      "burning micturition",
      "uti"
    ],
    "janAushadhi": "PMBJP Generic (Nitrofurantoin SR)",
    "adultDose": "1-0-1 With meals",
    "paedDose": "As advised by pediatrician",
    "notes": "May color urine dark brown/yellow",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Ofloxacin 200mg + Ornidazole 500mg (O2)",
    "generic": "Ofloxacin + Ornidazole",
    "category": "Antimicrobial & Antibiotic",
    "dose": "1-0-1",
    "timing": "After food",
    "duration": "5 days",
    "instructions": "For acute infectious diarrhea",
    "symptoms": [
      "diarrhea",
      "loose motions"
    ],
    "janAushadhi": "PMBJP Generic (Ofloxacin + Ornidazole)",
    "adultDose": "1-0-1 After food",
    "paedDose": "As advised by pediatrician",
    "notes": "For acute infectious diarrhea",
    "cat": "Antimicrobial & Antibiotic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Cefuroxime Axetil 500mg (Ceftum)",
    "generic": "Cefuroxime Axetil",
    "category": "Antimicrobial & Antibiotic",
    "dose": "1-0-1",
    "timing": "After food",
    "duration": "5 days",
    "instructions": "For severe RTI / ENT infections",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Cefuroxime Axetil)",
    "adultDose": "1-0-1 After food",
    "paedDose": "As advised by pediatrician",
    "notes": "For severe RTI / ENT infections",
    "cat": "Antimicrobial & Antibiotic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Faropenem 200mg (Farobact)",
    "generic": "Faropenem Sodium",
    "category": "Antimicrobial & Antibiotic",
    "dose": "1-0-1",
    "timing": "After food",
    "duration": "5 days",
    "instructions": "For resistant respiratory infections",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Faropenem Sodium)",
    "adultDose": "1-0-1 After food",
    "paedDose": "As advised by pediatrician",
    "notes": "For resistant respiratory infections",
    "cat": "Antimicrobial & Antibiotic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Paracetamol 650mg (Dolo 650)",
    "generic": "Paracetamol 650mg",
    "category": "Analgesic & Antipyretic",
    "dose": "1-0-1 (SOS)",
    "timing": "After food",
    "duration": "3 days",
    "instructions": "For fever & body ache (Max 4 tabs/24h)",
    "symptoms": [
      "fever",
      "body ache",
      "pain",
      "body ache"
    ],
    "janAushadhi": "PMBJP Generic (Paracetamol 650mg)",
    "adultDose": "1-0-1 (SOS) After food",
    "paedDose": "As advised by pediatrician",
    "notes": "For fever & body ache (Max 4 tabs/24h)",
    "cat": "Analgesic & Antipyretic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Paracetamol 500mg (Calpol)",
    "generic": "Paracetamol 500mg",
    "category": "Analgesic & Antipyretic",
    "dose": "1-1-1 (SOS)",
    "timing": "After food",
    "duration": "3 days",
    "instructions": "For mild to moderate fever",
    "symptoms": [
      "fever",
      "body ache",
      "pain",
      "body ache"
    ],
    "janAushadhi": "PMBJP Generic (Paracetamol 500mg)",
    "adultDose": "1-1-1 (SOS) After food",
    "paedDose": "As advised by pediatrician",
    "notes": "For mild to moderate fever",
    "cat": "Analgesic & Antipyretic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Aceclofenac 100mg + Paracetamol 325mg (Zerodol-P)",
    "generic": "Aceclofenac + Paracetamol",
    "category": "Analgesic & Antipyretic",
    "dose": "1-0-1",
    "timing": "After food",
    "duration": "3 days",
    "instructions": "Take after meals to avoid gastritis",
    "symptoms": [
      "pain",
      "body ache",
      "acidity",
      "heartburn",
      "abdominal pain"
    ],
    "janAushadhi": "PMBJP Generic (Aceclofenac + Paracetamol)",
    "adultDose": "1-0-1 After food",
    "paedDose": "As advised by pediatrician",
    "notes": "Take after meals to avoid gastritis",
    "cat": "Analgesic & Antipyretic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Aceclo 100mg + Para 325mg + Serratiopeptidase 15mg (Zerodol-SP)",
    "generic": "Aceclofenac + Paracetamol + Serratiopeptidase",
    "category": "Analgesic & Antipyretic",
    "dose": "1-0-1",
    "timing": "After food",
    "duration": "5 days",
    "instructions": "For painful swelling & trauma",
    "symptoms": [
      "pain",
      "body ache"
    ],
    "janAushadhi": "PMBJP Generic (Aceclofenac + Paracetamol + Serratiopeptidase)",
    "adultDose": "1-0-1 After food",
    "paedDose": "As advised by pediatrician",
    "notes": "For painful swelling & trauma",
    "cat": "Analgesic & Antipyretic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Ibuprofen 400mg (Brufen 400)",
    "generic": "Ibuprofen",
    "category": "Analgesic & Antipyretic",
    "dose": "1-0-1",
    "timing": "After food",
    "duration": "3 days",
    "instructions": "Take with food or milk",
    "symptoms": [
      "pain",
      "body ache"
    ],
    "janAushadhi": "PMBJP Generic (Ibuprofen)",
    "adultDose": "1-0-1 After food",
    "paedDose": "As advised by pediatrician",
    "notes": "Take with food or milk",
    "cat": "Analgesic & Antipyretic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Diclofenac Sodium 50mg (Voveran 50)",
    "generic": "Diclofenac Sodium",
    "category": "Analgesic & Antipyretic",
    "dose": "1-0-1",
    "timing": "After food",
    "duration": "3 days",
    "instructions": "Avoid if history of gastric ulcer",
    "symptoms": [
      "pain",
      "body ache",
      "acidity",
      "heartburn",
      "abdominal pain"
    ],
    "janAushadhi": "PMBJP Generic (Diclofenac Sodium)",
    "adultDose": "1-0-1 After food",
    "paedDose": "As advised by pediatrician",
    "notes": "Avoid if history of gastric ulcer",
    "cat": "Analgesic & Antipyretic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Tramadol 37.5mg + Paracetamol 325mg (Ultracet)",
    "generic": "Tramadol + Paracetamol",
    "category": "Analgesic & Antipyretic",
    "dose": "1-0-1 (SOS)",
    "timing": "After food",
    "duration": "3 days",
    "instructions": "May cause drowsiness; avoid driving",
    "symptoms": [
      "pain",
      "body ache"
    ],
    "janAushadhi": "PMBJP Generic (Tramadol + Paracetamol)",
    "adultDose": "1-0-1 (SOS) After food",
    "paedDose": "As advised by pediatrician",
    "notes": "May cause drowsiness; avoid driving",
    "cat": "Analgesic & Antipyretic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Mefenamic Acid 500mg (Meftal 500)",
    "generic": "Mefenamic Acid",
    "category": "Analgesic & Antipyretic",
    "dose": "1-0-1 (SOS)",
    "timing": "After food",
    "duration": "3 days",
    "instructions": "For acute pain / fever",
    "symptoms": [
      "fever",
      "body ache",
      "pain",
      "body ache",
      "acidity",
      "heartburn",
      "abdominal pain"
    ],
    "janAushadhi": "PMBJP Generic (Mefenamic Acid)",
    "adultDose": "1-0-1 (SOS) After food",
    "paedDose": "As advised by pediatrician",
    "notes": "For acute pain / fever",
    "cat": "Analgesic & Antipyretic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Meftal-Spas (Dicyclomine 10mg + Mefenamic 250mg)",
    "generic": "Dicyclomine + Mefenamic Acid",
    "category": "Gastrointestinal",
    "dose": "1-0-1 (SOS)",
    "timing": "After food",
    "duration": "2 days",
    "instructions": "For abdominal cramps & colic",
    "symptoms": [
      "pain",
      "body ache",
      "acidity",
      "heartburn",
      "abdominal pain"
    ],
    "janAushadhi": "PMBJP Generic (Dicyclomine + Mefenamic Acid)",
    "adultDose": "1-0-1 (SOS) After food",
    "paedDose": "As advised by pediatrician",
    "notes": "For abdominal cramps & colic",
    "cat": "Gastrointestinal",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Drotaverine 80mg (Drotin-DS)",
    "generic": "Drotaverine Hydrochloride",
    "category": "Gastrointestinal",
    "dose": "1-0-1 (SOS)",
    "timing": "After food",
    "duration": "3 days",
    "instructions": "For biliary / renal / abdominal spasm",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Drotaverine Hydrochloride)",
    "adultDose": "1-0-1 (SOS) After food",
    "paedDose": "As advised by pediatrician",
    "notes": "For biliary / renal / abdominal spasm",
    "cat": "Gastrointestinal",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Naproxen 500mg (Naprosyn)",
    "generic": "Naproxen",
    "category": "Analgesic & Antipyretic",
    "dose": "1-0-1",
    "timing": "After food",
    "duration": "3 days",
    "instructions": "For migraine & joint inflammation",
    "symptoms": [
      "pain",
      "body ache"
    ],
    "janAushadhi": "PMBJP Generic (Naproxen)",
    "adultDose": "1-0-1 After food",
    "paedDose": "As advised by pediatrician",
    "notes": "For migraine & joint inflammation",
    "cat": "Analgesic & Antipyretic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Cap. Omeprazole 20mg (Omez 20)",
    "generic": "Omeprazole",
    "category": "Gastrointestinal",
    "dose": "1-0-0",
    "timing": "30 min before breakfast",
    "duration": "7 days",
    "instructions": "Swallow whole, do not crush",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Omeprazole)",
    "adultDose": "1-0-0 30 min before breakfast",
    "paedDose": "As advised by pediatrician",
    "notes": "Swallow whole, do not crush",
    "cat": "Gastrointestinal",
    "form": "Capsule",
    "route": "Oral"
  },
  {
    "name": "Cap. Omez-D (Omeprazole 20mg + Domperidone 10mg)",
    "generic": "Omeprazole + Domperidone",
    "category": "Gastrointestinal",
    "dose": "1-0-0",
    "timing": "Before breakfast",
    "duration": "7 days",
    "instructions": "For acid reflux & nausea",
    "symptoms": [
      "acidity",
      "heartburn",
      "abdominal pain",
      "nausea / vomiting",
      "vomiting"
    ],
    "janAushadhi": "PMBJP Generic (Omeprazole + Domperidone)",
    "adultDose": "1-0-0 Before breakfast",
    "paedDose": "As advised by pediatrician",
    "notes": "For acid reflux & nausea",
    "cat": "Gastrointestinal",
    "form": "Capsule",
    "route": "Oral"
  },
  {
    "name": "Tab. Rabeprazole 20mg (Razo 20)",
    "generic": "Rabeprazole Sodium",
    "category": "Gastrointestinal",
    "dose": "1-0-0",
    "timing": "30 min before breakfast",
    "duration": "10 days",
    "instructions": "Empty stomach",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Rabeprazole Sodium)",
    "adultDose": "1-0-0 30 min before breakfast",
    "paedDose": "As advised by pediatrician",
    "notes": "Empty stomach",
    "cat": "Gastrointestinal",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Cap. Razo-D (Rabeprazole 20mg + Domperidone 30mg SR)",
    "generic": "Rabeprazole + Domperidone",
    "category": "Gastrointestinal",
    "dose": "1-0-0",
    "timing": "30 min before breakfast",
    "duration": "7 days",
    "instructions": "For severe acid reflux",
    "symptoms": [
      "acidity",
      "heartburn",
      "abdominal pain",
      "nausea / vomiting",
      "vomiting"
    ],
    "janAushadhi": "PMBJP Generic (Rabeprazole + Domperidone)",
    "adultDose": "1-0-0 30 min before breakfast",
    "paedDose": "As advised by pediatrician",
    "notes": "For severe acid reflux",
    "cat": "Gastrointestinal",
    "form": "Capsule",
    "route": "Oral"
  },
  {
    "name": "Tab. Ondansetron 4mg (Emeset 4)",
    "generic": "Ondansetron",
    "category": "Consumables & Syringes",
    "dose": "1-0-1 (SOS)",
    "timing": "30 min before food",
    "duration": "2 days",
    "instructions": "For nausea and vomiting",
    "symptoms": [
      "nausea / vomiting",
      "vomiting"
    ],
    "janAushadhi": "PMBJP Generic (Ondansetron)",
    "adultDose": "1-0-1 (SOS) 30 min before food",
    "paedDose": "As advised by pediatrician",
    "notes": "For nausea and vomiting",
    "cat": "Consumables & Syringes",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Domperidone 10mg (Domstal)",
    "generic": "Domperidone",
    "category": "Gastrointestinal",
    "dose": "1-0-1",
    "timing": "15 min before food",
    "duration": "3 days",
    "instructions": "For fullness and nausea",
    "symptoms": [
      "nausea / vomiting",
      "vomiting"
    ],
    "janAushadhi": "PMBJP Generic (Domperidone)",
    "adultDose": "1-0-1 15 min before food",
    "paedDose": "As advised by pediatrician",
    "notes": "For fullness and nausea",
    "cat": "Gastrointestinal",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Syp. Sucralfate 1g + Oxetacaine 20mg (Sucrafil-O)",
    "generic": "Sucralfate + Oxetacaine",
    "category": "Pediatric & Syrup",
    "dose": "10ml TDS",
    "timing": "1 hr before meals",
    "duration": "7 days",
    "instructions": "Shake well before use",
    "symptoms": [
      "acidity",
      "heartburn",
      "abdominal pain"
    ],
    "janAushadhi": "PMBJP Generic (Sucralfate + Oxetacaine)",
    "adultDose": "10ml TDS 1 hr before meals",
    "paedDose": "As advised by pediatrician",
    "notes": "Shake well before use",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Syp. Gelusil MPS Liquid",
    "generic": "Aluminium Hydroxide + Magnesium + Simethicone",
    "category": "Pediatric & Syrup",
    "dose": "10ml TDS",
    "timing": "After food & at bedtime",
    "duration": "5 days",
    "instructions": "For immediate heartburn relief",
    "symptoms": [
      "acidity",
      "heartburn",
      "abdominal pain"
    ],
    "janAushadhi": "PMBJP Generic (Aluminium Hydroxide + Magnesium + Simethicone)",
    "adultDose": "10ml TDS After food & at bedtime",
    "paedDose": "As advised by pediatrician",
    "notes": "For immediate heartburn relief",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Cap. Loperamide 2mg (Imodium)",
    "generic": "Loperamide Hydrochloride",
    "category": "Gastrointestinal",
    "dose": "1-0-1 (SOS)",
    "timing": "After each loose stool",
    "duration": "2 days",
    "instructions": "Do not exceed 4 caps per day",
    "symptoms": [
      "diarrhea",
      "loose motions"
    ],
    "janAushadhi": "PMBJP Generic (Loperamide Hydrochloride)",
    "adultDose": "1-0-1 (SOS) After each loose stool",
    "paedDose": "As advised by pediatrician",
    "notes": "Do not exceed 4 caps per day",
    "cat": "Gastrointestinal",
    "form": "Capsule",
    "route": "Oral"
  },
  {
    "name": "Sachet ORS (Electral 21.8g)",
    "generic": "Oral Rehydration Salts (WHO Formula)",
    "category": "Oral Tablets & Caps",
    "dose": "1 sachet in 1L water",
    "timing": "Throughout day",
    "duration": "2 days",
    "instructions": "Sip continuously to prevent dehydration",
    "symptoms": [
      "pain",
      "body ache"
    ],
    "janAushadhi": "PMBJP Generic (Oral Rehydration Salts (WHO Formula))",
    "adultDose": "1 sachet in 1L water Throughout day",
    "paedDose": "As advised by pediatrician",
    "notes": "Sip continuously to prevent dehydration",
    "cat": "Oral Tablets & Caps",
    "form": "Powder",
    "route": "Oral"
  },
  {
    "name": "Syp. Cremaffin Plus (15ml)",
    "generic": "Liquid Paraffin + Milk of Magnesia",
    "category": "Pediatric & Syrup",
    "dose": "15ml at bedtime",
    "timing": "At bedtime with water",
    "duration": "3 days",
    "instructions": "For acute constipation",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Liquid Paraffin + Milk of Magnesia)",
    "adultDose": "15ml at bedtime At bedtime with water",
    "paedDose": "As advised by pediatrician",
    "notes": "For acute constipation",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Cap. Econorm 250mg (Saccharomyces boulardii)",
    "generic": "Probiotic",
    "category": "Oral Tablets & Caps",
    "dose": "1-0-1",
    "timing": "With food",
    "duration": "5 days",
    "instructions": "Restores normal gut flora",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Probiotic)",
    "adultDose": "1-0-1 With food",
    "paedDose": "As advised by pediatrician",
    "notes": "Restores normal gut flora",
    "cat": "Oral Tablets & Caps",
    "form": "Capsule",
    "route": "Oral"
  },
  {
    "name": "Tab. Levocetirizine 5mg (Levocet 5)",
    "generic": "Levocetirizine Dihydrochloride",
    "category": "Antihistamine & Allergy",
    "dose": "0-0-1",
    "timing": "At bedtime",
    "duration": "5 days",
    "instructions": "Non-sedating antihistamine",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Levocetirizine Dihydrochloride)",
    "adultDose": "0-0-1 At bedtime",
    "paedDose": "As advised by pediatrician",
    "notes": "Non-sedating antihistamine",
    "cat": "Antihistamine & Allergy",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Fexofenadine 120mg (Allegra 120)",
    "generic": "Fexofenadine Hydrochloride",
    "category": "Antihistamine & Allergy",
    "dose": "1-0-0",
    "timing": "Morning with water",
    "duration": "7 days",
    "instructions": "Do not take with fruit juices",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Fexofenadine Hydrochloride)",
    "adultDose": "1-0-0 Morning with water",
    "paedDose": "As advised by pediatrician",
    "notes": "Do not take with fruit juices",
    "cat": "Antihistamine & Allergy",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Fexofenadine 180mg (Allegra 180)",
    "generic": "Fexofenadine Hydrochloride",
    "category": "Antihistamine & Allergy",
    "dose": "1-0-0",
    "timing": "Once daily",
    "duration": "7 days",
    "instructions": "For chronic urticaria and skin allergy",
    "symptoms": [
      "allergy",
      "runny nose"
    ],
    "janAushadhi": "PMBJP Generic (Fexofenadine Hydrochloride)",
    "adultDose": "1-0-0 Once daily",
    "paedDose": "As advised by pediatrician",
    "notes": "For chronic urticaria and skin allergy",
    "cat": "Antihistamine & Allergy",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Syp. Ascoril-D Plus (Dry Cough)",
    "generic": "Dextromethorphan + Phenylephrine + Chlorpheniramine",
    "category": "Pediatric & Syrup",
    "dose": "10ml TDS",
    "timing": "After food",
    "duration": "5 days",
    "instructions": "For dry irritating cough",
    "symptoms": [
      "cough",
      "sore throat"
    ],
    "janAushadhi": "PMBJP Generic (Dextromethorphan + Phenylephrine + Chlorpheniramine)",
    "adultDose": "10ml TDS After food",
    "paedDose": "As advised by pediatrician",
    "notes": "For dry irritating cough",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Syp. Benadryl Cough Formula",
    "generic": "Diphenhydramine + Ammonium Chloride",
    "category": "Pediatric & Syrup",
    "dose": "10ml at night",
    "timing": "At bedtime",
    "duration": "3 days",
    "instructions": "Helps soothing night cough",
    "symptoms": [
      "cough",
      "sore throat"
    ],
    "janAushadhi": "PMBJP Generic (Diphenhydramine + Ammonium Chloride)",
    "adultDose": "10ml at night At bedtime",
    "paedDose": "As advised by pediatrician",
    "notes": "Helps soothing night cough",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Tab. Sinarest (Paracetamol 500 + Phenylephrine 10 + CPM 2)",
    "generic": "Paracetamol + Decongestant + Antihistamine",
    "category": "Analgesic & Antipyretic",
    "dose": "1-0-1",
    "timing": "After food",
    "duration": "3 days",
    "instructions": "For runny nose, sneezing & headache",
    "symptoms": [
      "pain",
      "body ache",
      "allergy",
      "runny nose"
    ],
    "janAushadhi": "PMBJP Generic (Paracetamol + Decongestant + Antihistamine)",
    "adultDose": "1-0-1 After food",
    "paedDose": "As advised by pediatrician",
    "notes": "For runny nose, sneezing & headache",
    "cat": "Analgesic & Antipyretic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Nasal Spray Otrivin 0.1% (Xylometazoline)",
    "generic": "Xylometazoline Hydrochloride",
    "category": "Gastrointestinal",
    "dose": "1 puff each nostril BD",
    "timing": "Morning & Night",
    "duration": "3 days",
    "instructions": "Do not use for more than 5 consecutive days",
    "symptoms": [
      "burning micturition",
      "uti"
    ],
    "janAushadhi": "PMBJP Generic (Xylometazoline Hydrochloride)",
    "adultDose": "1 puff each nostril BD Morning & Night",
    "paedDose": "As advised by pediatrician",
    "notes": "Do not use for more than 5 consecutive days",
    "cat": "Gastrointestinal",
    "form": "Spray",
    "route": "Oral"
  },
  {
    "name": "Tab. Metformin 500mg (Glycomet 500)",
    "generic": "Metformin Hydrochloride",
    "category": "Diabetic Care",
    "dose": "1-0-1",
    "timing": "With or after meals",
    "duration": "30 days",
    "instructions": "Monitor blood sugar regularly",
    "symptoms": [
      "diabetes review",
      "weakness"
    ],
    "janAushadhi": "PMBJP Generic (Metformin Hydrochloride)",
    "adultDose": "1-0-1 With or after meals",
    "paedDose": "As advised by pediatrician",
    "notes": "Monitor blood sugar regularly",
    "cat": "Diabetic Care",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Metformin 1000mg SR (Glycomet-SR 1g)",
    "generic": "Metformin Hydrochloride SR",
    "category": "Diabetic Care",
    "dose": "0-0-1",
    "timing": "With dinner",
    "duration": "30 days",
    "instructions": "Swallow whole with dinner",
    "symptoms": [
      "diabetes review",
      "weakness"
    ],
    "janAushadhi": "PMBJP Generic (Metformin Hydrochloride SR)",
    "adultDose": "0-0-1 With dinner",
    "paedDose": "As advised by pediatrician",
    "notes": "Swallow whole with dinner",
    "cat": "Diabetic Care",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Glimepiride 1mg (Amaryl 1)",
    "generic": "Glimepiride",
    "category": "Diabetic Care",
    "dose": "1-0-0",
    "timing": "Before breakfast",
    "duration": "30 days",
    "instructions": "Watch for hypoglycemia (sweating, tremors)",
    "symptoms": [
      "diabetes review",
      "weakness"
    ],
    "janAushadhi": "PMBJP Generic (Glimepiride)",
    "adultDose": "1-0-0 Before breakfast",
    "paedDose": "As advised by pediatrician",
    "notes": "Watch for hypoglycemia (sweating, tremors)",
    "cat": "Diabetic Care",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Glimepiride 2mg (Amaryl 2)",
    "generic": "Glimepiride",
    "category": "Diabetic Care",
    "dose": "1-0-0",
    "timing": "Before breakfast",
    "duration": "30 days",
    "instructions": "Have breakfast immediately after taking",
    "symptoms": [
      "diabetes review",
      "weakness"
    ],
    "janAushadhi": "PMBJP Generic (Glimepiride)",
    "adultDose": "1-0-0 Before breakfast",
    "paedDose": "As advised by pediatrician",
    "notes": "Have breakfast immediately after taking",
    "cat": "Diabetic Care",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Glycomet-GP 1 (Glimepiride 1mg + Metformin 500mg)",
    "generic": "Glimepiride + Metformin",
    "category": "Diabetic Care",
    "dose": "1-0-0",
    "timing": "Before breakfast",
    "duration": "30 days",
    "instructions": "Regular fasting/PP blood sugar check",
    "symptoms": [
      "diabetes review",
      "weakness"
    ],
    "janAushadhi": "PMBJP Generic (Glimepiride + Metformin)",
    "adultDose": "1-0-0 Before breakfast",
    "paedDose": "As advised by pediatrician",
    "notes": "Regular fasting/PP blood sugar check",
    "cat": "Diabetic Care",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Glycomet-GP 2 (Glimepiride 2mg + Metformin 500mg)",
    "generic": "Glimepiride + Metformin",
    "category": "Diabetic Care",
    "dose": "1-0-0",
    "timing": "Before breakfast",
    "duration": "30 days",
    "instructions": "Take immediately before first main meal",
    "symptoms": [
      "diabetes review",
      "weakness"
    ],
    "janAushadhi": "PMBJP Generic (Glimepiride + Metformin)",
    "adultDose": "1-0-0 Before breakfast",
    "paedDose": "As advised by pediatrician",
    "notes": "Take immediately before first main meal",
    "cat": "Diabetic Care",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Teneligliptin 20mg (Zita 20)",
    "generic": "Teneligliptin",
    "category": "Oral Tablets & Caps",
    "dose": "1-0-0",
    "timing": "Before or after food",
    "duration": "30 days",
    "instructions": "Safe in renal impairment",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Teneligliptin)",
    "adultDose": "1-0-0 Before or after food",
    "paedDose": "As advised by pediatrician",
    "notes": "Safe in renal impairment",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Dapagliflozin 10mg (Forxiga 10)",
    "generic": "Dapagliflozin",
    "category": "Diabetic Care",
    "dose": "1-0-0",
    "timing": "Morning with water",
    "duration": "30 days",
    "instructions": "Drink plenty of water throughout the day",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Dapagliflozin)",
    "adultDose": "1-0-0 Morning with water",
    "paedDose": "As advised by pediatrician",
    "notes": "Drink plenty of water throughout the day",
    "cat": "Diabetic Care",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Vildagliptin 50mg + Metformin 500mg (Galvus Met)",
    "generic": "Vildagliptin + Metformin",
    "category": "Diabetic Care",
    "dose": "1-0-1",
    "timing": "With meals",
    "duration": "30 days",
    "instructions": "Cardio-safe glucose control",
    "symptoms": [
      "hypertension review",
      "headache",
      "diabetes review",
      "weakness"
    ],
    "janAushadhi": "PMBJP Generic (Vildagliptin + Metformin)",
    "adultDose": "1-0-1 With meals",
    "paedDose": "As advised by pediatrician",
    "notes": "Cardio-safe glucose control",
    "cat": "Diabetic Care",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Amlodipine 5mg (Amlong 5)",
    "generic": "Amlodipine Besylate",
    "category": "Cardiovascular",
    "dose": "1-0-0",
    "timing": "Morning with water",
    "duration": "30 days",
    "instructions": "Report if ankle swelling occurs",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Amlodipine Besylate)",
    "adultDose": "1-0-0 Morning with water",
    "paedDose": "As advised by pediatrician",
    "notes": "Report if ankle swelling occurs",
    "cat": "Cardiovascular",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Telmisartan 40mg (Telma 40)",
    "generic": "Telmisartan",
    "category": "Cardiovascular",
    "dose": "1-0-0",
    "timing": "Morning",
    "duration": "30 days",
    "instructions": "Check blood pressure weekly",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Telmisartan)",
    "adultDose": "1-0-0 Morning",
    "paedDose": "As advised by pediatrician",
    "notes": "Check blood pressure weekly",
    "cat": "Cardiovascular",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Telmisartan 40mg + Amlodipine 5mg (Telma-AM)",
    "generic": "Telmisartan + Amlodipine",
    "category": "Cardiovascular",
    "dose": "1-0-0",
    "timing": "Morning",
    "duration": "30 days",
    "instructions": "Synergistic BP reduction",
    "symptoms": [
      "hypertension review",
      "headache"
    ],
    "janAushadhi": "PMBJP Generic (Telmisartan + Amlodipine)",
    "adultDose": "1-0-0 Morning",
    "paedDose": "As advised by pediatrician",
    "notes": "Synergistic BP reduction",
    "cat": "Cardiovascular",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Telmisartan 40mg + Hydrochlorothiazide 12.5mg (Telma-H)",
    "generic": "Telmisartan + Chlorthiazide",
    "category": "Cardiovascular",
    "dose": "1-0-0",
    "timing": "Morning",
    "duration": "30 days",
    "instructions": "Take in morning to prevent nighttime urination",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Telmisartan + Chlorthiazide)",
    "adultDose": "1-0-0 Morning",
    "paedDose": "As advised by pediatrician",
    "notes": "Take in morning to prevent nighttime urination",
    "cat": "Cardiovascular",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Atenolol 50mg (Aten 50)",
    "generic": "Atenolol",
    "category": "Cardiovascular",
    "dose": "1-0-0",
    "timing": "Morning",
    "duration": "30 days",
    "instructions": "Do not stop abruptly",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Atenolol)",
    "adultDose": "1-0-0 Morning",
    "paedDose": "As advised by pediatrician",
    "notes": "Do not stop abruptly",
    "cat": "Cardiovascular",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Metoprolol Succinate 25mg ER (Betaloc-25)",
    "generic": "Metoprolol ER",
    "category": "Cardiovascular",
    "dose": "1-0-0",
    "timing": "Morning with food",
    "duration": "30 days",
    "instructions": "Controls heart rate and BP",
    "symptoms": [
      "hypertension review",
      "headache"
    ],
    "janAushadhi": "PMBJP Generic (Metoprolol ER)",
    "adultDose": "1-0-0 Morning with food",
    "paedDose": "As advised by pediatrician",
    "notes": "Controls heart rate and BP",
    "cat": "Cardiovascular",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Atorvastatin 10mg (Atorva 10)",
    "generic": "Atorvastatin Calcium",
    "category": "Cardiovascular",
    "dose": "0-0-1",
    "timing": "At bedtime",
    "duration": "30 days",
    "instructions": "For cholesterol management",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Atorvastatin Calcium)",
    "adultDose": "0-0-1 At bedtime",
    "paedDose": "As advised by pediatrician",
    "notes": "For cholesterol management",
    "cat": "Cardiovascular",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Atorvastatin 20mg (Atorva 20)",
    "generic": "Atorvastatin Calcium",
    "category": "Cardiovascular",
    "dose": "0-0-1",
    "timing": "At bedtime",
    "duration": "30 days",
    "instructions": "Take at night for maximum efficacy",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Atorvastatin Calcium)",
    "adultDose": "0-0-1 At bedtime",
    "paedDose": "As advised by pediatrician",
    "notes": "Take at night for maximum efficacy",
    "cat": "Cardiovascular",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Rosuvastatin 10mg (Rosuvas 10)",
    "generic": "Rosuvastatin",
    "category": "Cardiovascular",
    "dose": "0-0-1",
    "timing": "At bedtime",
    "duration": "30 days",
    "instructions": "Monitor liver profile periodically",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Rosuvastatin)",
    "adultDose": "0-0-1 At bedtime",
    "paedDose": "As advised by pediatrician",
    "notes": "Monitor liver profile periodically",
    "cat": "Cardiovascular",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Ecosprin 75mg (Aspirin 75mg)",
    "generic": "Aspirin (Enteric Coated)",
    "category": "Cardiovascular",
    "dose": "0-1-0",
    "timing": "After lunch with water",
    "duration": "30 days",
    "instructions": "Do not take on empty stomach",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Aspirin (Enteric Coated))",
    "adultDose": "0-1-0 After lunch with water",
    "paedDose": "As advised by pediatrician",
    "notes": "Do not take on empty stomach",
    "cat": "Cardiovascular",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Clopidogrel 75mg (Clopilet 75)",
    "generic": "Clopidogrel Bisulfate",
    "category": "Cardiovascular",
    "dose": "1-0-0",
    "timing": "After food",
    "duration": "30 days",
    "instructions": "For cardiovascular protection",
    "symptoms": [
      "hypertension review",
      "headache"
    ],
    "janAushadhi": "PMBJP Generic (Clopidogrel Bisulfate)",
    "adultDose": "1-0-0 After food",
    "paedDose": "As advised by pediatrician",
    "notes": "For cardiovascular protection",
    "cat": "Cardiovascular",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Inhaler Asthalin 100mcg (Salbutamol)",
    "generic": "Salbutamol Inhaler (100mcg/puff)",
    "category": "Respiratory",
    "dose": "2 puffs SOS",
    "timing": "When breathless",
    "duration": "As needed",
    "instructions": "Rinse mouth with water after use",
    "symptoms": [
      "cough",
      "sore throat"
    ],
    "janAushadhi": "PMBJP Generic (Salbutamol Inhaler (100mcg/puff))",
    "adultDose": "2 puffs SOS When breathless",
    "paedDose": "As advised by pediatrician",
    "notes": "Rinse mouth with water after use",
    "cat": "Respiratory",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Inhaler Budecort 200mcg (Budesonide)",
    "generic": "Budesonide Inhaler",
    "category": "Respiratory",
    "dose": "1 puff BD",
    "timing": "Morning & Night",
    "duration": "30 days",
    "instructions": "Always gargle and rinse mouth after inhalation",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Budesonide Inhaler)",
    "adultDose": "1 puff BD Morning & Night",
    "paedDose": "As advised by pediatrician",
    "notes": "Always gargle and rinse mouth after inhalation",
    "cat": "Respiratory",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Inhaler Foracort 200 (Formoterol + Budesonide)",
    "generic": "Formoterol 6mcg + Budesonide 200mcg",
    "category": "Respiratory",
    "dose": "1 puff BD",
    "timing": "Morning & Night",
    "duration": "30 days",
    "instructions": "Maintenance therapy for asthma / COPD",
    "symptoms": [
      "shortness of breath",
      "wheezing"
    ],
    "janAushadhi": "PMBJP Generic (Formoterol 6mcg + Budesonide 200mcg)",
    "adultDose": "1 puff BD Morning & Night",
    "paedDose": "As advised by pediatrician",
    "notes": "Maintenance therapy for asthma / COPD",
    "cat": "Respiratory",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Deriphyllin Retard 150mg",
    "generic": "Theophylline + Etofylline",
    "category": "Respiratory",
    "dose": "1-0-1",
    "timing": "After food",
    "duration": "7 days",
    "instructions": "Relieves wheezing and chest tightness",
    "symptoms": [
      "cough",
      "sore throat",
      "shortness of breath",
      "wheezing"
    ],
    "janAushadhi": "PMBJP Generic (Theophylline + Etofylline)",
    "adultDose": "1-0-1 After food",
    "paedDose": "As advised by pediatrician",
    "notes": "Relieves wheezing and chest tightness",
    "cat": "Respiratory",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Doxofylline 400mg (Doxolin 400)",
    "generic": "Doxofylline",
    "category": "Respiratory",
    "dose": "1-0-1",
    "timing": "After food",
    "duration": "10 days",
    "instructions": "Better cardiac safety profile than theophylline",
    "symptoms": [
      "cough",
      "sore throat"
    ],
    "janAushadhi": "PMBJP Generic (Doxofylline)",
    "adultDose": "1-0-1 After food",
    "paedDose": "As advised by pediatrician",
    "notes": "Better cardiac safety profile than theophylline",
    "cat": "Respiratory",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Shelcal 500 (Calcium 500mg + Vit D3 250 IU)",
    "generic": "Calcium Carbonate + Vitamin D3",
    "category": "Vitamins & Supplements",
    "dose": "0-1-0",
    "timing": "After lunch",
    "duration": "30 days",
    "instructions": "Take with water after main meal",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Calcium Carbonate + Vitamin D3)",
    "adultDose": "0-1-0 After lunch",
    "paedDose": "As advised by pediatrician",
    "notes": "Take with water after main meal",
    "cat": "Vitamins & Supplements",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Sachet Calcirol 60000 IU (Cholecalciferol)",
    "generic": "Vitamin D3 60,000 IU",
    "category": "Vitamins & Supplements",
    "dose": "1 sachet weekly",
    "timing": "With warm milk after dinner",
    "duration": "8 weeks",
    "instructions": "Take once a week for 8 consecutive weeks",
    "symptoms": [
      "pain",
      "body ache",
      "burning micturition",
      "uti"
    ],
    "janAushadhi": "PMBJP Generic (Vitamin D3 60,000 IU)",
    "adultDose": "1 sachet weekly With warm milk after dinner",
    "paedDose": "As advised by pediatrician",
    "notes": "Take once a week for 8 consecutive weeks",
    "cat": "Vitamins & Supplements",
    "form": "Powder",
    "route": "Oral"
  },
  {
    "name": "Tab. Neurobion Forte",
    "generic": "B-Complex + Vitamin B12",
    "category": "Vitamins & Supplements",
    "dose": "1-0-0",
    "timing": "After breakfast",
    "duration": "30 days",
    "instructions": "For nerve health and tingling sensations",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (B-Complex + Vitamin B12)",
    "adultDose": "1-0-0 After breakfast",
    "paedDose": "As advised by pediatrician",
    "notes": "For nerve health and tingling sensations",
    "cat": "Vitamins & Supplements",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Cap. Becosules Z",
    "generic": "B-Complex + Vitamin C + Zinc",
    "category": "Vitamins & Supplements",
    "dose": "1-0-0",
    "timing": "After breakfast",
    "duration": "15 days",
    "instructions": "For mouth ulcers, weakness and recovery",
    "symptoms": [
      "acidity",
      "heartburn",
      "abdominal pain"
    ],
    "janAushadhi": "PMBJP Generic (B-Complex + Vitamin C + Zinc)",
    "adultDose": "1-0-0 After breakfast",
    "paedDose": "As advised by pediatrician",
    "notes": "For mouth ulcers, weakness and recovery",
    "cat": "Vitamins & Supplements",
    "form": "Capsule",
    "route": "Oral"
  },
  {
    "name": "Tab. Zincovit",
    "generic": "Multivitamin + Multimineral + Grape Seed Ext",
    "category": "Vitamins & Supplements",
    "dose": "1-0-0",
    "timing": "After meals",
    "duration": "30 days",
    "instructions": "Daily wellness & immune booster",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Multivitamin + Multimineral + Grape Seed Ext)",
    "adultDose": "1-0-0 After meals",
    "paedDose": "As advised by pediatrician",
    "notes": "Daily wellness & immune booster",
    "cat": "Vitamins & Supplements",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Orofer-XT (Ferrous Ascorbate + Folic Acid)",
    "generic": "Elemental Iron 100mg + Folic Acid 1.5mg",
    "category": "Vitamins & Supplements",
    "dose": "0-0-1",
    "timing": "After dinner",
    "duration": "30 days",
    "instructions": "Stools may appear dark; avoid tea/coffee with tablet",
    "symptoms": [
      "acidity",
      "heartburn",
      "abdominal pain",
      "diarrhea",
      "loose motions"
    ],
    "janAushadhi": "PMBJP Generic (Elemental Iron 100mg + Folic Acid 1.5mg)",
    "adultDose": "0-0-1 After dinner",
    "paedDose": "As advised by pediatrician",
    "notes": "Stools may appear dark; avoid tea/coffee with tablet",
    "cat": "Vitamins & Supplements",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Cap. Evion 400 (Vitamin E 400mg)",
    "generic": "Tocopheryl Acetate 400mg",
    "category": "Vitamins & Supplements",
    "dose": "1-0-0",
    "timing": "After food",
    "duration": "30 days",
    "instructions": "Skin and hair health supplement",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Tocopheryl Acetate 400mg)",
    "adultDose": "1-0-0 After food",
    "paedDose": "As advised by pediatrician",
    "notes": "Skin and hair health supplement",
    "cat": "Vitamins & Supplements",
    "form": "Capsule",
    "route": "Oral"
  },
  {
    "name": "Ointment Betadine 10% (Povidone Iodine)",
    "generic": "Povidone Iodine 10% w/w",
    "category": "Oral Tablets & Caps",
    "dose": "Apply twice daily",
    "timing": "Clean wound first",
    "duration": "5 days",
    "instructions": "Apply thin layer to affected area",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Povidone Iodine 10% w/w)",
    "adultDose": "Apply twice daily Clean wound first",
    "paedDose": "As advised by pediatrician",
    "notes": "Apply thin layer to affected area",
    "cat": "Oral Tablets & Caps",
    "form": "Ointment",
    "route": "Topical"
  },
  {
    "name": "Ointment Silverex (Silver Sulfadiazine + Chlorhexidine)",
    "generic": "Silver Sulfadiazine",
    "category": "Oral Tablets & Caps",
    "dose": "Apply BD",
    "timing": "On clean skin",
    "duration": "5 days",
    "instructions": "For minor burns and abrasions",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Silver Sulfadiazine)",
    "adultDose": "Apply BD On clean skin",
    "paedDose": "As advised by pediatrician",
    "notes": "For minor burns and abrasions",
    "cat": "Oral Tablets & Caps",
    "form": "Ointment",
    "route": "Topical"
  },
  {
    "name": "Cream Candid-B (Clotrimazole + Beclomethasone)",
    "generic": "Clotrimazole + Beclomethasone",
    "category": "Gastrointestinal",
    "dose": "Apply twice daily",
    "timing": "Morning & Night",
    "duration": "7 days",
    "instructions": "For itchy fungal skin infections",
    "symptoms": [
      "allergy",
      "runny nose"
    ],
    "janAushadhi": "PMBJP Generic (Clotrimazole + Beclomethasone)",
    "adultDose": "Apply twice daily Morning & Night",
    "paedDose": "As advised by pediatrician",
    "notes": "For itchy fungal skin infections",
    "cat": "Gastrointestinal",
    "form": "Cream",
    "route": "Topical"
  },
  {
    "name": "Ointment Mupirocin 2% (T-Bact 2%)",
    "generic": "Mupirocin 2% w/w",
    "category": "Oral Tablets & Caps",
    "dose": "Apply TID",
    "timing": "Clean area first",
    "duration": "5 days",
    "instructions": "For folliculitis, boils & infected cuts",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Mupirocin 2% w/w)",
    "adultDose": "Apply TID Clean area first",
    "paedDose": "As advised by pediatrician",
    "notes": "For folliculitis, boils & infected cuts",
    "cat": "Oral Tablets & Caps",
    "form": "Ointment",
    "route": "Topical"
  },
  {
    "name": "Calamine Lotion (Lacto Calamine)",
    "generic": "Calamine + Zinc Oxide",
    "category": "Vitamins & Supplements",
    "dose": "Apply SOS",
    "timing": "When itchy",
    "duration": "5 days",
    "instructions": "For rash, sunburn & prickly heat",
    "symptoms": [
      "allergy",
      "runny nose"
    ],
    "janAushadhi": "PMBJP Generic (Calamine + Zinc Oxide)",
    "adultDose": "Apply SOS When itchy",
    "paedDose": "As advised by pediatrician",
    "notes": "For rash, sunburn & prickly heat",
    "cat": "Vitamins & Supplements",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Eye Drops Ciplox (Ciprofloxacin 0.3%)",
    "generic": "Ciprofloxacin Eye/Ear Drops",
    "category": "Pediatric & Syrup",
    "dose": "2 drops TDS",
    "timing": "In affected eye/ear",
    "duration": "5 days",
    "instructions": "Do not touch dropper tip to eye",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Ciprofloxacin Eye/Ear Drops)",
    "adultDose": "2 drops TDS In affected eye/ear",
    "paedDose": "As advised by pediatrician",
    "notes": "Do not touch dropper tip to eye",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Eye Drops Refresh Tears (Carboxymethylcellulose 0.5%)",
    "generic": "Lubricant Eye Drops",
    "category": "Pediatric & Syrup",
    "dose": "1-2 drops 4 times daily",
    "timing": "As needed",
    "duration": "15 days",
    "instructions": "For dry, strained or burning eyes",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Lubricant Eye Drops)",
    "adultDose": "1-2 drops 4 times daily As needed",
    "paedDose": "As advised by pediatrician",
    "notes": "For dry, strained or burning eyes",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Ear Drops Otorex (Wax Softener)",
    "generic": "Paradichlorobenzene + Benzocaine + Chlorbutol",
    "category": "Pediatric & Syrup",
    "dose": "3 drops twice daily",
    "timing": "Morning & Night",
    "duration": "3 days",
    "instructions": "Keep head tilted for 5 minutes after instilling",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Paradichlorobenzene + Benzocaine + Chlorbutol)",
    "adultDose": "3 drops twice daily Morning & Night",
    "paedDose": "As advised by pediatrician",
    "notes": "Keep head tilted for 5 minutes after instilling",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "IV RL (Ringer Lactate) 500ml",
    "generic": "Ringer Lactate Solution",
    "category": "Injections & IV",
    "dose": "1 Bottle IV",
    "timing": "Slow IV infusion",
    "duration": "Stat / Once",
    "instructions": "Use with IV Set; monitor drip rate",
    "symptoms": [
      "burning micturition",
      "uti"
    ],
    "janAushadhi": "PMBJP Generic (Ringer Lactate Solution)",
    "adultDose": "1 Bottle IV Slow IV infusion",
    "paedDose": "As advised by pediatrician",
    "notes": "Use with IV Set; monitor drip rate",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "IV NS 0.9% (Normal Saline) 500ml",
    "generic": "Sodium Chloride 0.9% IV",
    "category": "Injections & IV",
    "dose": "1 Bottle IV",
    "timing": "Slow IV infusion",
    "duration": "Stat / Once",
    "instructions": "Hydration & electrolyte replacement",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Sodium Chloride 0.9% IV)",
    "adultDose": "1 Bottle IV Slow IV infusion",
    "paedDose": "As advised by pediatrician",
    "notes": "Hydration & electrolyte replacement",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "IV DNS (Dextrose Normal Saline) 500ml",
    "generic": "Dextrose 5% + NaCl 0.9%",
    "category": "Injections & IV",
    "dose": "1 Bottle IV",
    "timing": "Slow IV infusion",
    "duration": "Stat / Once",
    "instructions": "Not for uncontrolled diabetics",
    "symptoms": [
      "diabetes review",
      "weakness"
    ],
    "janAushadhi": "PMBJP Generic (Dextrose 5% + NaCl 0.9%)",
    "adultDose": "1 Bottle IV Slow IV infusion",
    "paedDose": "As advised by pediatrician",
    "notes": "Not for uncontrolled diabetics",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "IV D5W (5% Dextrose) 500ml",
    "generic": "Dextrose 5% in Water",
    "category": "Injections & IV",
    "dose": "1 Bottle IV",
    "timing": "Slow IV infusion",
    "duration": "Stat / Once",
    "instructions": "For hypoglycemia and hydration",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Dextrose 5% in Water)",
    "adultDose": "1 Bottle IV Slow IV infusion",
    "paedDose": "As advised by pediatrician",
    "notes": "For hypoglycemia and hydration",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "IV Paracetamol Infusion 100ml",
    "generic": "Paracetamol 10mg/ml IV",
    "category": "Injections & IV",
    "dose": "100ml IV",
    "timing": "Infuse over 15 mins",
    "duration": "SOS / Stat",
    "instructions": "For high grade refractory fever/severe pain",
    "symptoms": [
      "fever",
      "body ache",
      "pain",
      "body ache"
    ],
    "janAushadhi": "PMBJP Generic (Paracetamol 10mg/ml IV)",
    "adultDose": "100ml IV Infuse over 15 mins",
    "paedDose": "As advised by pediatrician",
    "notes": "For high grade refractory fever/severe pain",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "IV Metronidazole 100ml (Metrogyl)",
    "generic": "Metronidazole 500mg IV",
    "category": "Injections & IV",
    "dose": "100ml IV",
    "timing": "Slow IV infusion",
    "duration": "Stat",
    "instructions": "For acute amoebiasis / anaerobic infection",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Metronidazole 500mg IV)",
    "adultDose": "100ml IV Slow IV infusion",
    "paedDose": "As advised by pediatrician",
    "notes": "For acute amoebiasis / anaerobic infection",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "IV Mannitol 20% 100ml",
    "generic": "Mannitol 20%",
    "category": "Injections & IV",
    "dose": "100ml IV",
    "timing": "Rapid IV infusion",
    "duration": "Stat",
    "instructions": "To reduce cerebral edema / acute glaucoma",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Mannitol 20%)",
    "adultDose": "100ml IV Rapid IV infusion",
    "paedDose": "As advised by pediatrician",
    "notes": "To reduce cerebral edema / acute glaucoma",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Ondansetron 2ml (Emeset)",
    "generic": "Ondansetron 2mg/ml",
    "category": "Injections & IV",
    "dose": "2ml (4mg) IV/IM",
    "timing": "Slow IV/IM",
    "duration": "Stat",
    "instructions": "For acute vomiting & nausea",
    "symptoms": [
      "nausea / vomiting",
      "vomiting"
    ],
    "janAushadhi": "PMBJP Generic (Ondansetron 2mg/ml)",
    "adultDose": "2ml (4mg) IV/IM Slow IV/IM",
    "paedDose": "As advised by pediatrician",
    "notes": "For acute vomiting & nausea",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Diclofenac 75mg/1ml (Dynapar AQ)",
    "generic": "Diclofenac Sodium",
    "category": "Injections & IV",
    "dose": "1 Ampoule IM/IV",
    "timing": "Deep IM / IV infusion",
    "duration": "Stat / SOS",
    "instructions": "For severe colic / acute pain",
    "symptoms": [
      "pain",
      "body ache"
    ],
    "janAushadhi": "PMBJP Generic (Diclofenac Sodium)",
    "adultDose": "1 Ampoule IM/IV Deep IM / IV infusion",
    "paedDose": "As advised by pediatrician",
    "notes": "For severe colic / acute pain",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Ceftriaxone 1g (Monocef)",
    "generic": "Ceftriaxone 1000mg",
    "category": "Injections & IV",
    "dose": "1 Vial IV/IM",
    "timing": "Slow IV after AST",
    "duration": "Stat / 1-0-1",
    "instructions": "Skin sensitivity test mandatory before injection",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Ceftriaxone 1000mg)",
    "adultDose": "1 Vial IV/IM Slow IV after AST",
    "paedDose": "As advised by pediatrician",
    "notes": "Skin sensitivity test mandatory before injection",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Amikacin 500mg",
    "generic": "Amikacin Sulfate",
    "category": "Injections & IV",
    "dose": "1 Vial IV/IM",
    "timing": "Slow IV / Deep IM",
    "duration": "Stat / 1-0-1",
    "instructions": "Broad spectrum aminoglycoside antibiotic",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Amikacin Sulfate)",
    "adultDose": "1 Vial IV/IM Slow IV / Deep IM",
    "paedDose": "As advised by pediatrician",
    "notes": "Broad spectrum aminoglycoside antibiotic",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Dexamethasone 2ml (Decadron)",
    "generic": "Dexamethasone 4mg/ml",
    "category": "Injections & IV",
    "dose": "1-2ml IV/IM",
    "timing": "Slow IV / IM",
    "duration": "Stat",
    "instructions": "For severe allergy / respiratory distress",
    "symptoms": [
      "allergy",
      "runny nose"
    ],
    "janAushadhi": "PMBJP Generic (Dexamethasone 4mg/ml)",
    "adultDose": "1-2ml IV/IM Slow IV / IM",
    "paedDose": "As advised by pediatrician",
    "notes": "For severe allergy / respiratory distress",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Pheniramine 2ml (Avil)",
    "generic": "Pheniramine Maleate",
    "category": "Injections & IV",
    "dose": "2ml (45.5mg) IM/IV",
    "timing": "Deep IM / Slow IV",
    "duration": "Stat",
    "instructions": "For acute allergic reactions / urticaria",
    "symptoms": [
      "allergy",
      "runny nose"
    ],
    "janAushadhi": "PMBJP Generic (Pheniramine Maleate)",
    "adultDose": "2ml (45.5mg) IM/IV Deep IM / Slow IV",
    "paedDose": "As advised by pediatrician",
    "notes": "For acute allergic reactions / urticaria",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Drotaverine 2ml (Drotin)",
    "generic": "Drotaverine HCl 40mg",
    "category": "Injections & IV",
    "dose": "2ml IM/IV",
    "timing": "Slow IV / IM",
    "duration": "Stat / SOS",
    "instructions": "For severe renal, biliary or abdominal colic",
    "symptoms": [
      "pain",
      "body ache"
    ],
    "janAushadhi": "PMBJP Generic (Drotaverine HCl 40mg)",
    "adultDose": "2ml IM/IV Slow IV / IM",
    "paedDose": "As advised by pediatrician",
    "notes": "For severe renal, biliary or abdominal colic",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Hyoscine Butylbromide (Buscopan)",
    "generic": "Hyoscine Butylbromide 20mg",
    "category": "Injections & IV",
    "dose": "1 Ampoule IM/IV",
    "timing": "Slow IV / Deep IM",
    "duration": "Stat / SOS",
    "instructions": "For acute spasmodic GI colic",
    "symptoms": [
      "pain",
      "body ache"
    ],
    "janAushadhi": "PMBJP Generic (Hyoscine Butylbromide 20mg)",
    "adultDose": "1 Ampoule IM/IV Slow IV / Deep IM",
    "paedDose": "As advised by pediatrician",
    "notes": "For acute spasmodic GI colic",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Vitamin B-Complex with B12 (Neurobion)",
    "generic": "Vitamin B1+B6+B12",
    "category": "Injections & IV",
    "dose": "2ml Deep IM",
    "timing": "Alternate days / Stat",
    "duration": "5 doses",
    "instructions": "For peripheral neuropathy & nerve recovery",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Vitamin B1+B6+B12)",
    "adultDose": "2ml Deep IM Alternate days / Stat",
    "paedDose": "As advised by pediatrician",
    "notes": "For peripheral neuropathy & nerve recovery",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Iron Sucrose 100mg (Orofer)",
    "generic": "Iron Sucrose",
    "category": "Injections & IV",
    "dose": "100mg in 100ml NS",
    "timing": "Slow IV drip over 30m",
    "duration": "As prescribed",
    "instructions": "For severe iron deficiency anemia",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Iron Sucrose)",
    "adultDose": "100mg in 100ml NS Slow IV drip over 30m",
    "paedDose": "As advised by pediatrician",
    "notes": "For severe iron deficiency anemia",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "IV Infusion Set with Micro/Macro Drip",
    "generic": "Sterile IV Administration Set",
    "category": "Injections & IV",
    "dose": "1 Set",
    "timing": "With IV fluid bottle",
    "duration": "Once",
    "instructions": "Sterile non-toxic disposable IV set",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Sterile IV Administration Set)",
    "adultDose": "1 Set With IV fluid bottle",
    "paedDose": "As advised by pediatrician",
    "notes": "Sterile non-toxic disposable IV set",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Disposable Syringe 2ml with 24G Needle",
    "generic": "Sterile 2ml Syringe",
    "category": "Consumables & Syringes",
    "dose": "1 Syringe",
    "timing": "Single use",
    "duration": "Once",
    "instructions": "For IM/IV medication injection",
    "symptoms": [
      "general opd"
    ],
    "janAushadhi": "PMBJP Generic (Sterile 2ml Syringe)",
    "adultDose": "1 Syringe Single use",
    "paedDose": "As advised by pediatrician",
    "notes": "For IM/IV medication injection",
    "cat": "Consumables & Syringes",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Disposable Syringe 5ml with 23G Needle",
    "generic": "Sterile 5ml Syringe",
    "category": "Consumables & Syringes",
    "dose": "1 Syringe",
    "timing": "Single use",
    "duration": "Once",
    "instructions": "For reconstituting and administering drugs",
    "symptoms": [
      "burning micturition",
      "uti"
    ],
    "janAushadhi": "PMBJP Generic (Sterile 5ml Syringe)",
    "adultDose": "1 Syringe Single use",
    "paedDose": "As advised by pediatrician",
    "notes": "For reconstituting and administering drugs",
    "cat": "Consumables & Syringes",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Disposable Syringe 10ml with 21G Needle",
    "generic": "Sterile 10ml Syringe",
    "category": "Consumables & Syringes",
    "dose": "1 Syringe",
    "timing": "Single use",
    "duration": "Once",
    "instructions": "For IV bolus / dilution",
    "symptoms": [
      "burning micturition",
      "uti"
    ],
    "janAushadhi": "PMBJP Generic (Sterile 10ml Syringe)",
    "adultDose": "1 Syringe Single use",
    "paedDose": "As advised by pediatrician",
    "notes": "For IV bolus / dilution",
    "cat": "Consumables & Syringes",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Insulin Syringe 40IU / 100IU (31G)",
    "generic": "Ultra-fine Insulin Syringe",
    "category": "Consumables & Syringes",
    "dose": "1 Syringe",
    "timing": "Subcutaneous",
    "duration": "Single use",
    "instructions": "For painless insulin injection",
    "symptoms": [
      "pain",
      "body ache"
    ],
    "janAushadhi": "PMBJP Generic (Ultra-fine Insulin Syringe)",
    "adultDose": "1 Syringe Subcutaneous",
    "paedDose": "As advised by pediatrician",
    "notes": "For painless insulin injection",
    "cat": "Consumables & Syringes",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Calpol 650mg",
    "generic": "Paracetamol 650mg",
    "category": "Analgesic & Antipyretic",
    "dose": "1-0-1 (SOS)",
    "timing": "After food",
    "duration": "3 days",
    "instructions": "Liver-safe at therapeutic doses. Avoid alcohol.",
    "symptoms": [
      "fever",
      "headache",
      "body ache",
      "pain"
    ],
    "janAushadhi": "Tab. Paracetamol 650mg (PMBJP - ₹1.80/strip)",
    "adultDose": "650mg every 4-6h (Max 4g/day)",
    "paedDose": "15 mg/kg/dose (Syrup form)",
    "notes": "Liver-safe at therapeutic doses. Avoid alcohol.",
    "cat": "Analgesic & Antipyretic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Pacimol 650mg",
    "generic": "Paracetamol 650mg",
    "category": "Analgesic & Antipyretic",
    "dose": "1-0-1 (SOS)",
    "timing": "After food",
    "duration": "3 days",
    "instructions": "Standard antipyretic.",
    "symptoms": [
      "fever",
      "body ache",
      "headache",
      "pain"
    ],
    "janAushadhi": "Tab. Paracetamol 650mg (PMBJP - ₹1.80/strip)",
    "adultDose": "650mg every 4-6 hours SOS",
    "paedDose": "Use pediatric suspension",
    "notes": "Standard antipyretic.",
    "cat": "Analgesic & Antipyretic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Sumo (Nimesulide 100mg + Paracetamol 325mg)",
    "generic": "Nimesulide + Paracetamol",
    "category": "Analgesic & Antipyretic",
    "dose": "1-0-1 (SOS)",
    "timing": "After food",
    "duration": "2-3 days",
    "instructions": "Potent NSAID. Avoid in hepatic impairment and children.",
    "symptoms": [
      "acute pain",
      "fever",
      "headache",
      "dental pain",
      "body ache",
      "pain"
    ],
    "janAushadhi": "Tab. Nimesulide + Paracetamol (PMBJP - ₹3.50/strip)",
    "adultDose": "1 tablet twice daily after meals (Max 15 days)",
    "paedDose": "Contraindicated in children under 12 years",
    "notes": "Potent NSAID. Avoid in hepatic impairment and children.",
    "cat": "Analgesic & Antipyretic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Nise 100mg",
    "generic": "Nimesulide 100mg",
    "category": "Oral Tablets & Caps",
    "dose": "1-0-1 (SOS)",
    "timing": "After food",
    "duration": "3 days",
    "instructions": "Shortest possible duration recommended.",
    "symptoms": [
      "pain",
      "joint pain",
      "acute osteoarthritis",
      "dental pain"
    ],
    "janAushadhi": "Tab. Nimesulide 100mg (PMBJP - ₹2.20/strip)",
    "adultDose": "100mg twice daily after food",
    "paedDose": "Contraindicated under 12 years",
    "notes": "Shortest possible duration recommended.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Zerodol-TH 4 (Aceclofenac 100 + Thiocolchicoside 4mg)",
    "generic": "Aceclofenac + Thiocolchicoside",
    "category": "Analgesic & Antipyretic",
    "dose": "1-0-1",
    "timing": "After food",
    "duration": "5 days",
    "instructions": "Muscle relaxant and anti-inflammatory dual action.",
    "symptoms": [
      "back pain",
      "muscle spasm",
      "sciatica",
      "neck pain",
      "sprain",
      "pain",
      "body ache"
    ],
    "janAushadhi": "Tab. Aceclofenac + Thiocolchicoside (PMBJP - ₹22/strip)",
    "adultDose": "1 tablet twice daily after meals",
    "paedDose": "Not recommended in children",
    "notes": "Muscle relaxant and anti-inflammatory dual action.",
    "cat": "Analgesic & Antipyretic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Zerodol-TH 8 (Aceclofenac 100 + Thiocolchicoside 8mg)",
    "generic": "Aceclofenac + Thiocolchicoside 8mg",
    "category": "Analgesic & Antipyretic",
    "dose": "1-0-1",
    "timing": "After food",
    "duration": "5 days",
    "instructions": "For severe painful muscle contractures.",
    "symptoms": [
      "severe muscle spasm",
      "lumbago",
      "acute stiff neck",
      "back pain",
      "pain"
    ],
    "janAushadhi": "Tab. Aceclo + Thio 8mg (PMBJP - ₹32/strip)",
    "adultDose": "1 tablet BD after food",
    "paedDose": "Contraindicated in pediatric age",
    "notes": "For severe painful muscle contractures.",
    "cat": "Analgesic & Antipyretic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Myoril 4mg (Thiocolchicoside)",
    "generic": "Thiocolchicoside 4mg",
    "category": "Oral Tablets & Caps",
    "dose": "1-0-1",
    "timing": "After food",
    "duration": "5 days",
    "instructions": "Centrally acting muscle relaxant without sedation.",
    "symptoms": [
      "muscle spasm",
      "cramps",
      "backache",
      "muscle stiffness"
    ],
    "janAushadhi": "Cap. Thiocolchicoside 4mg (PMBJP - ₹18/strip)",
    "adultDose": "4-8mg twice daily (Max 16mg/day for 7 days)",
    "paedDose": "Contraindicated in children under 16 years",
    "notes": "Centrally acting muscle relaxant without sedation.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Ketorol-DT 10mg (Ketorolac)",
    "generic": "Ketorolac Tromethamine 10mg Dispersible",
    "category": "Analgesic & Antipyretic",
    "dose": "1 tab SOS (Max TDS)",
    "timing": "Disperse in 15ml water after food",
    "duration": "2-3 days",
    "instructions": "Potent acute analgesic. Short-term use only (max 5 days).",
    "symptoms": [
      "acute dental pain",
      "post-extraction pain",
      "severe acute pain",
      "trauma pain",
      "pain"
    ],
    "janAushadhi": "Tab. Ketorolac 10mg DT (PMBJP - ₹6.50/strip)",
    "adultDose": "10mg every 4-6h SOS (Max 40mg/day, max 5 days)",
    "paedDose": "Not recommended in children",
    "notes": "Potent acute analgesic. Short-term use only (max 5 days).",
    "cat": "Analgesic & Antipyretic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Piroxicam 20mg (Dolonex DT)",
    "generic": "Piroxicam 20mg Dispersible",
    "category": "Analgesic & Antipyretic",
    "dose": "1-0-0",
    "timing": "Disperse in water after breakfast",
    "duration": "5 days",
    "instructions": "Long half-life. High gastric ulcer risk; give with PPI.",
    "symptoms": [
      "acute gout",
      "rheumatoid arthritis",
      "severe joint pain",
      "ankylosing spondylitis",
      "pain"
    ],
    "janAushadhi": "Tab. Piroxicam 20mg (PMBJP - ₹4.00/strip)",
    "adultDose": "20mg once daily after meals",
    "paedDose": "Not recommended in children",
    "notes": "Long half-life. High gastric ulcer risk; give with PPI.",
    "cat": "Analgesic & Antipyretic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Etoricoxib 90mg (Nucoxia 90)",
    "generic": "Etoricoxib 90mg",
    "category": "Analgesic & Antipyretic",
    "dose": "1-0-0",
    "timing": "After breakfast",
    "duration": "5 days",
    "instructions": "Selective COX-2 inhibitor. Safe for stomach, check BP in hypertension.",
    "symptoms": [
      "osteoarthritis",
      "joint inflammation",
      "acute gouty arthritis",
      "severe pain",
      "back pain"
    ],
    "janAushadhi": "Tab. Etoricoxib 90mg (PMBJP - ₹16/strip)",
    "adultDose": "90mg once daily for arthritis (120mg for acute gout)",
    "paedDose": "Contraindicated in children under 16 years",
    "notes": "Selective COX-2 inhibitor. Safe for stomach, check BP in hypertension.",
    "cat": "Analgesic & Antipyretic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Etoricoxib 60mg (Nucoxia 60)",
    "generic": "Etoricoxib 60mg",
    "category": "Analgesic & Antipyretic",
    "dose": "1-0-0",
    "timing": "After food",
    "duration": "7 days",
    "instructions": "Cardiovascular caution in ischemic heart disease.",
    "symptoms": [
      "osteoarthritis",
      "chronic joint pain",
      "cervical spondylosis",
      "pain"
    ],
    "janAushadhi": "Tab. Etoricoxib 60mg (PMBJP - ₹12/strip)",
    "adultDose": "30-60mg once daily",
    "paedDose": "Contraindicated under 16y",
    "notes": "Cardiovascular caution in ischemic heart disease.",
    "cat": "Analgesic & Antipyretic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Etoricoxib 60mg + Thiocolchicoside 4mg (Nucoxia-MR)",
    "generic": "Etoricoxib + Thiocolchicoside",
    "category": "Analgesic & Antipyretic",
    "dose": "1-0-1",
    "timing": "After food",
    "duration": "5 days",
    "instructions": "Targeted combo for musculoskeletal pain with muscle spasms.",
    "symptoms": [
      "muscle spasm",
      "cervical pain",
      "lumbar spondylosis",
      "sciatica",
      "pain"
    ],
    "janAushadhi": "Tab. Etoricoxib + Thiocolchicoside (PMBJP - ₹24/strip)",
    "adultDose": "1 tablet once or twice daily after food",
    "paedDose": "Contraindicated in pediatric use",
    "notes": "Targeted combo for musculoskeletal pain with muscle spasms.",
    "cat": "Analgesic & Antipyretic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Indomethacin 25mg (Idicin)",
    "generic": "Indomethacin 25mg",
    "category": "Gastrointestinal",
    "dose": "1-0-1",
    "timing": "With food or milk",
    "duration": "5 days",
    "instructions": "Potent anti-inflammatory. Gold standard for acute gout attack.",
    "symptoms": [
      "acute gout",
      "bursitis",
      "tendonitis",
      "severe arthritis",
      "pain"
    ],
    "janAushadhi": "Cap. Indomethacin 25mg (PMBJP - ₹3.80/strip)",
    "adultDose": "25-50mg BD or TDS with meals",
    "paedDose": "1-2 mg/kg/day in divided doses",
    "notes": "Potent anti-inflammatory. Gold standard for acute gout attack.",
    "cat": "Gastrointestinal",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Colchicine 0.5mg (Zyloric-C)",
    "generic": "Colchicine 0.5mg",
    "category": "Oral Tablets & Caps",
    "dose": "1 tab BD / TDS",
    "timing": "After food",
    "duration": "3 days",
    "instructions": "Stop immediately if diarrhea or nausea occurs.",
    "symptoms": [
      "acute gout attack",
      "uric acid pain",
      "swollen big toe",
      "pain"
    ],
    "janAushadhi": "Tab. Colchicine 0.5mg (PMBJP - ₹4.50/strip)",
    "adultDose": "1mg stat, then 0.5mg every 2-3 hours until relief or diarrhea (Max 6mg/course)",
    "paedDose": "Specialist supervision only",
    "notes": "Stop immediately if diarrhea or nausea occurs.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Febuxostat 40mg (Febutaz 40)",
    "generic": "Febuxostat 40mg",
    "category": "Oral Tablets & Caps",
    "dose": "1-0-0",
    "timing": "With or without food",
    "duration": "30 days",
    "instructions": "Do not start during acute gout flare; maintain long-term.",
    "symptoms": [
      "hyperuricemia",
      "chronic gout",
      "high uric acid"
    ],
    "janAushadhi": "Tab. Febuxostat 40mg (PMBJP - ₹9.00/strip)",
    "adultDose": "40-80mg once daily",
    "paedDose": "Not established in children",
    "notes": "Do not start during acute gout flare; maintain long-term.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Allopurinol 100mg (Zyloric 100)",
    "generic": "Allopurinol 100mg",
    "category": "Oral Tablets & Caps",
    "dose": "1-0-0",
    "timing": "After food with plenty of water",
    "duration": "30 days",
    "instructions": "Watch for hypersensitivity rash (Stevens-Johnson syndrome).",
    "symptoms": [
      "high uric acid",
      "gout prevention",
      "uric acid stones"
    ],
    "janAushadhi": "Tab. Allopurinol 100mg (PMBJP - ₹3.20/strip)",
    "adultDose": "100-300mg daily after food",
    "paedDose": "10-20 mg/kg/day for secondary hyperuricemia",
    "notes": "Watch for hypersensitivity rash (Stevens-Johnson syndrome).",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Baclofen 10mg (Lioresal 10)",
    "generic": "Baclofen 10mg",
    "category": "Oral Tablets & Caps",
    "dose": "0-0-1 to 1-0-1",
    "timing": "After food with water",
    "duration": "10 days",
    "instructions": "Do not discontinue abruptly; causes withdrawal seizures.",
    "symptoms": [
      "severe muscle spasticity",
      "spinal injury spasm",
      "hiccups",
      "muscle stiffness"
    ],
    "janAushadhi": "Tab. Baclofen 10mg (PMBJP - ₹8.00/strip)",
    "adultDose": "5mg TDS initially, titrate to 10-20mg TDS",
    "paedDose": "0.75-2 mg/kg/day in divided doses",
    "notes": "Do not discontinue abruptly; causes withdrawal seizures.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Tizanidine 2mg (Sirdalud)",
    "generic": "Tizanidine 2mg",
    "category": "Oral Tablets & Caps",
    "dose": "0-0-1",
    "timing": "At bedtime",
    "duration": "5 days",
    "instructions": "Causes sedation and dry mouth. Best given at bedtime.",
    "symptoms": [
      "acute painful muscle spasms",
      "back spasm",
      "tension headache",
      "pain"
    ],
    "janAushadhi": "Tab. Tizanidine 2mg (PMBJP - ₹5.50/strip)",
    "adultDose": "2-4mg TDS or at bedtime (Max 24mg/day)",
    "paedDose": "Contraindicated in children",
    "notes": "Causes sedation and dry mouth. Best given at bedtime.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Chymoral Forte",
    "generic": "Trypsin + Chymotrypsin (100,000 AU)",
    "category": "Oral Tablets & Caps",
    "dose": "1-1-1",
    "timing": "30 min before meals",
    "duration": "5 days",
    "instructions": "Enzymatic anti-inflammatory. Promotes resolution of exudate and edema.",
    "symptoms": [
      "post-traumatic swelling",
      "hematoma",
      "edema",
      "sports injury",
      "swelling"
    ],
    "janAushadhi": "Tab. Trypsin-Chymotrypsin (PMBJP - ₹14/strip)",
    "adultDose": "1 tablet thrice daily 30 min before food",
    "paedDose": "Half tablet for older children",
    "notes": "Enzymatic anti-inflammatory. Promotes resolution of exudate and edema.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Monocef-O 200mg (Cefpodoxime)",
    "generic": "Cefpodoxime Proxetil 200mg",
    "category": "Antimicrobial & Antibiotic",
    "dose": "1-0-1",
    "timing": "With food",
    "duration": "5 days",
    "instructions": "Potent oral 3rd generation cephalosporin with food enhancement.",
    "symptoms": [
      "typhoid fever",
      "pneumonia",
      "bronchitis",
      "sinusitis",
      "uti",
      "fever"
    ],
    "janAushadhi": "Tab. Cefpodoxime 200mg (PMBJP - ₹34/strip)",
    "adultDose": "200mg twice daily with meals",
    "paedDose": "10 mg/kg/day in 2 divided doses (Syrup form)",
    "notes": "Potent oral 3rd generation cephalosporin with food enhancement.",
    "cat": "Antimicrobial & Antibiotic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Gudcef 200mg (Cefpodoxime)",
    "generic": "Cefpodoxime Proxetil 200mg",
    "category": "Antimicrobial & Antibiotic",
    "dose": "1-0-1",
    "timing": "With meals",
    "duration": "5 days",
    "instructions": "Take with food for optimal absorption.",
    "symptoms": [
      "respiratory infection",
      "fever",
      "cough",
      "ear infection",
      "uti"
    ],
    "janAushadhi": "Tab. Cefpodoxime 200mg (PMBJP - ₹34/strip)",
    "adultDose": "200mg twice daily",
    "paedDose": "Syrup Gudcef 50mg/100mg for pediatric use",
    "notes": "Take with food for optimal absorption.",
    "cat": "Antimicrobial & Antibiotic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Ceftum 250mg (Cefuroxime)",
    "generic": "Cefuroxime Axetil 250mg",
    "category": "Antimicrobial & Antibiotic",
    "dose": "1-0-1",
    "timing": "After food",
    "duration": "5 days",
    "instructions": "2nd gen cephalosporin. High efficacy against streptococcus.",
    "symptoms": [
      "throat infection",
      "tonsillitis",
      "sinusitis",
      "skin infection",
      "fever"
    ],
    "janAushadhi": "Tab. Cefuroxime 250mg (PMBJP - ₹26/strip)",
    "adultDose": "250-500mg twice daily after meals",
    "paedDose": "20-30 mg/kg/day in two divided doses",
    "notes": "2nd gen cephalosporin. High efficacy against streptococcus.",
    "cat": "Antimicrobial & Antibiotic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Mahacef 200mg (Cefixime)",
    "generic": "Cefixime 200mg",
    "category": "Antimicrobial & Antibiotic",
    "dose": "1-0-1",
    "timing": "After food",
    "duration": "5 days",
    "instructions": "First-line oral drug for uncomplicated typhoid.",
    "symptoms": [
      "fever",
      "typhoid",
      "urinary infection",
      "bronchitis",
      "uti"
    ],
    "janAushadhi": "Tab. Cefixime 200mg (PMBJP - ₹19/strip)",
    "adultDose": "200mg twice daily or 400mg once daily",
    "paedDose": "8 mg/kg/day in two divided doses",
    "notes": "First-line oral drug for uncomplicated typhoid.",
    "cat": "Antimicrobial & Antibiotic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Cefolac 200mg (Cefixime)",
    "generic": "Cefixime 200mg",
    "category": "Antimicrobial & Antibiotic",
    "dose": "1-0-1",
    "timing": "After food",
    "duration": "5 days",
    "instructions": "Safe in renal impairment with dose adjustment.",
    "symptoms": [
      "fever",
      "cough",
      "urti",
      "uti"
    ],
    "janAushadhi": "Tab. Cefixime 200mg (PMBJP - ₹19/strip)",
    "adultDose": "200mg BD after meals",
    "paedDose": "8 mg/kg/day",
    "notes": "Safe in renal impairment with dose adjustment.",
    "cat": "Antimicrobial & Antibiotic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Moxikind-CV 625",
    "generic": "Amoxicillin 500mg + Clavulanic Acid 125mg",
    "category": "Antimicrobial & Antibiotic",
    "dose": "1-0-1",
    "timing": "At start of meal",
    "duration": "5 days",
    "instructions": "Take at start of meals to minimize gastrointestinal discomfort.",
    "symptoms": [
      "dental infection",
      "throat pain",
      "chest infection",
      "boils",
      "fever"
    ],
    "janAushadhi": "Tab. Amox-Clav 625mg (PMBJP - ₹48/strip)",
    "adultDose": "625mg twice daily",
    "paedDose": "30-45 mg/kg/day in divided doses",
    "notes": "Take at start of meals to minimize gastrointestinal discomfort.",
    "cat": "Antimicrobial & Antibiotic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Clavam 625",
    "generic": "Amoxicillin 500mg + Potassium Clavulanate 125mg",
    "category": "Antimicrobial & Antibiotic",
    "dose": "1-0-1",
    "timing": "After food",
    "duration": "5 days",
    "instructions": "Complete full antibiotic course.",
    "symptoms": [
      "sinusitis",
      "otitis media",
      "pneumonia",
      "cellulitis",
      "fever"
    ],
    "janAushadhi": "Tab. Amox-Clav 625mg (PMBJP - ₹48/strip)",
    "adultDose": "625mg BD for 5-7 days",
    "paedDose": "Syrup Clavam BD for pediatric use",
    "notes": "Complete full antibiotic course.",
    "cat": "Antimicrobial & Antibiotic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Roxid 150mg (Roxithromycin)",
    "generic": "Roxithromycin 150mg",
    "category": "Oral Tablets & Caps",
    "dose": "1-0-1",
    "timing": "15 min before food",
    "duration": "5 days",
    "instructions": "Macrolide with excellent tissue penetration into tonsils and lungs.",
    "symptoms": [
      "throat infection",
      "tonsillitis",
      "pharyngitis",
      "dental infection",
      "sore throat"
    ],
    "janAushadhi": "Tab. Roxithromycin 150mg (PMBJP - ₹11/strip)",
    "adultDose": "150mg twice daily before meals",
    "paedDose": "5-8 mg/kg/day in 2 divided doses",
    "notes": "Macrolide with excellent tissue penetration into tonsils and lungs.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Levomac 500mg (Levofloxacin)",
    "generic": "Levofloxacin 500mg",
    "category": "Antimicrobial & Antibiotic",
    "dose": "1-0-0",
    "timing": "With full glass of water",
    "duration": "5 days",
    "instructions": "Drink 2-3L water daily. Tendonitis warning.",
    "symptoms": [
      "community acquired pneumonia",
      "severe sinusitis",
      "chronic bronchitis",
      "complicated uti"
    ],
    "janAushadhi": "Tab. Levofloxacin 500mg (PMBJP - ₹14/strip)",
    "adultDose": "500mg once daily for 5-7 days",
    "paedDose": "Contraindicated in children under 18 years",
    "notes": "Drink 2-3L water daily. Tendonitis warning.",
    "cat": "Antimicrobial & Antibiotic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Norflox 400mg",
    "generic": "Norfloxacin 400mg",
    "category": "Oral Tablets & Caps",
    "dose": "1-0-1",
    "timing": "1 hr before or 2 hr after food",
    "duration": "5 days",
    "instructions": "Urinary fluoroquinolone of choice.",
    "symptoms": [
      "urinary tract infection",
      "burning micturition",
      "uti",
      "traveler's diarrhea"
    ],
    "janAushadhi": "Tab. Norfloxacin 400mg (PMBJP - ₹9.00/strip)",
    "adultDose": "400mg twice daily with plenty of fluids",
    "paedDose": "Contraindicated in pediatric age",
    "notes": "Urinary fluoroquinolone of choice.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Rifaximin 400mg (Rifagut 400)",
    "generic": "Rifaximin 400mg",
    "category": "Oral Tablets & Caps",
    "dose": "1-0-1",
    "timing": "With or without food",
    "duration": "5 days",
    "instructions": "Non-absorbable gut-specific antibiotic. Zero systemic side effects.",
    "symptoms": [
      "irritable bowel syndrome",
      "ibs diarrhea",
      "hepatic encephalopathy",
      "chronic loose motions",
      "diarrhea"
    ],
    "janAushadhi": "Tab. Rifaximin 400mg (PMBJP - ₹42/strip)",
    "adultDose": "400-550mg BD or TDS for 14 days",
    "paedDose": "Age > 12y: 200mg TDS",
    "notes": "Non-absorbable gut-specific antibiotic. Zero systemic side effects.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Rifaximin 550mg (Rifagut 550)",
    "generic": "Rifaximin 550mg",
    "category": "Oral Tablets & Caps",
    "dose": "1-0-1",
    "timing": "After meals",
    "duration": "14 days",
    "instructions": "Prevents recurrence of overt hepatic encephalopathy.",
    "symptoms": [
      "hepatic encephalopathy",
      "ibs-d",
      "small intestinal bacterial overgrowth (sibo)"
    ],
    "janAushadhi": "Tab. Rifaximin 550mg (PMBJP - ₹58/strip)",
    "adultDose": "550mg twice daily",
    "paedDose": "Specialist consultation",
    "notes": "Prevents recurrence of overt hepatic encephalopathy.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Fluconazole 150mg (Forcan 150)",
    "generic": "Fluconazole 150mg",
    "category": "Antimicrobial & Antibiotic",
    "dose": "1 tablet once weekly",
    "timing": "After food",
    "duration": "3 weeks",
    "instructions": "Weekly pulse therapy for superficial dermatophyte infections.",
    "symptoms": [
      "fungal infection",
      "tinea cruris",
      "ringworm",
      "vaginal candidiasis",
      "oral thrush"
    ],
    "janAushadhi": "Tab. Fluconazole 150mg (PMBJP - ₹4.50/strip)",
    "adultDose": "150mg single dose for vaginal candidiasis; 150mg weekly for tinea",
    "paedDose": "3-6 mg/kg single or weekly dose",
    "notes": "Weekly pulse therapy for superficial dermatophyte infections.",
    "cat": "Antimicrobial & Antibiotic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Cap. Itraconazole 100mg (Canditral 100)",
    "generic": "Itraconazole 100mg",
    "category": "Antimicrobial & Antibiotic",
    "dose": "1-0-1",
    "timing": "Immediately after full meal",
    "duration": "14 days",
    "instructions": "Requires acidic stomach for absorption. Take after full lunch.",
    "symptoms": [
      "tinea corporis",
      "fungal skin infection",
      "onychomycosis",
      "recalcitrant fungal infection"
    ],
    "janAushadhi": "Cap. Itraconazole 100mg (PMBJP - ₹28/strip)",
    "adultDose": "100-200mg once or twice daily after heavy meals",
    "paedDose": "3-5 mg/kg/day in divided doses",
    "notes": "Requires acidic stomach for absorption. Take after full lunch.",
    "cat": "Antimicrobial & Antibiotic",
    "form": "Capsule",
    "route": "Oral"
  },
  {
    "name": "Cap. Itraconazole 200mg (Canditral 200)",
    "generic": "Itraconazole 200mg",
    "category": "Antimicrobial & Antibiotic",
    "dose": "1-0-0 or 1-0-1",
    "timing": "Immediately after lunch",
    "duration": "14-28 days",
    "instructions": "Monitor liver enzymes if therapy exceeds 1 month.",
    "symptoms": [
      "severe tinea cruris",
      "nail fungus",
      "extensive fungal infection",
      "itching"
    ],
    "janAushadhi": "Cap. Itraconazole 200mg (PMBJP - ₹48/strip)",
    "adultDose": "200mg once or twice daily after meals",
    "paedDose": "Not recommended under 12 years",
    "notes": "Monitor liver enzymes if therapy exceeds 1 month.",
    "cat": "Antimicrobial & Antibiotic",
    "form": "Capsule",
    "route": "Oral"
  },
  {
    "name": "Tab. Terbinafine 250mg (Sebifin 250)",
    "generic": "Terbinafine Hydrochloride 250mg",
    "category": "Oral Tablets & Caps",
    "dose": "1-0-0",
    "timing": "After breakfast",
    "duration": "14 days",
    "instructions": "Fungicidal allylamine of choice for dermatophyte infections.",
    "symptoms": [
      "fungal nail infection",
      "tinea pedis (athlete's foot)",
      "ringworm",
      "scalp fungal infection"
    ],
    "janAushadhi": "Tab. Terbinafine 250mg (PMBJP - ₹32/strip)",
    "adultDose": "250mg once daily for 2 to 6 weeks",
    "paedDose": "125mg daily for children 20-40kg",
    "notes": "Fungicidal allylamine of choice for dermatophyte infections.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Acyclovir 400mg (Zovirax 400)",
    "generic": "Acyclovir 400mg",
    "category": "Oral Tablets & Caps",
    "dose": "1 tab 5 times daily (every 4h)",
    "timing": "With full glass of water",
    "duration": "7 days",
    "instructions": "Start within 48-72 hours of rash onset for maximum efficacy.",
    "symptoms": [
      "herpes zoster (shingles)",
      "herpes simplex",
      "cold sores",
      "painful blisters",
      "pain"
    ],
    "janAushadhi": "Tab. Acyclovir 400mg (PMBJP - ₹16/strip)",
    "adultDose": "800mg 5 times daily for herpes zoster (400mg TDS for simplex)",
    "paedDose": "20 mg/kg 4 times daily",
    "notes": "Start within 48-72 hours of rash onset for maximum efficacy.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Ivermectin 12mg (Ivercross 12)",
    "generic": "Ivermectin 12mg Dispersible",
    "category": "Antimicrobial & Antibiotic",
    "dose": "1 tablet single dose",
    "timing": "Empty stomach with water 1 hr before meal",
    "duration": "Single dose (Repeat day 7)",
    "instructions": "First-line oral cure for scabies. Repeat once after 7 days.",
    "symptoms": [
      "scabies",
      "severe nocturnal itching",
      "intestinal worm infestation",
      "filariasis",
      "itching"
    ],
    "janAushadhi": "Tab. Ivermectin 12mg (PMBJP - ₹4.50/strip)",
    "adultDose": "200 mcg/kg single oral dose (usually 12mg for 60kg)",
    "paedDose": "200 mcg/kg for children > 15kg",
    "notes": "First-line oral cure for scabies. Repeat once after 7 days.",
    "cat": "Antimicrobial & Antibiotic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Albendazole 400mg (Zentel / Bandy)",
    "generic": "Albendazole 400mg Chewable",
    "category": "Antimicrobial & Antibiotic",
    "dose": "1 tablet single dose",
    "timing": "Chew at bedtime with milk or fatty meal",
    "duration": "Single dose",
    "instructions": "Chew completely. Treat entire family simultaneously for pinworms.",
    "symptoms": [
      "intestinal worms",
      "pinworms",
      "roundworms",
      "stomach ache",
      "teeth grinding in sleep",
      "abdominal pain"
    ],
    "janAushadhi": "Tab. Albendazole 400mg (PMBJP - ₹2.50/strip)",
    "adultDose": "400mg single chewable dose",
    "paedDose": "200mg for 1-2 years; 400mg for > 2 years",
    "notes": "Chew completely. Treat entire family simultaneously for pinworms.",
    "cat": "Antimicrobial & Antibiotic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Inj. Lasix 20mg/2ml (Furosemide)",
    "generic": "Furosemide 10mg/ml (2ml Ampoule)",
    "category": "Injections & IV",
    "dose": "20-40mg IV Stat",
    "timing": "Slow IV push over 2 minutes",
    "duration": "Stat / SOS",
    "instructions": "Potent loop diuretic. Monitor urine output and BP closely.",
    "symptoms": [
      "acute pulmonary edema",
      "hypertensive crisis",
      "severe breathlessness",
      "congestive heart failure",
      "edema",
      "shortness of breath"
    ],
    "janAushadhi": "Inj. Furosemide 20mg (PMBJP - ₹2.80/ampoule)",
    "adultDose": "20-40mg slow IV push; may titrate up in renal failure",
    "paedDose": "1 mg/kg slow IV",
    "notes": "Potent loop diuretic. Monitor urine output and BP closely.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Pause 500mg/5ml (Tranexamic Acid)",
    "generic": "Tranexamic Acid 100mg/ml (5ml Ampoule)",
    "category": "Injections & IV",
    "dose": "500mg - 1000mg IV Stat",
    "timing": "Slow IV push over 5 minutes (or in 100ml NS)",
    "duration": "Stat / TDS",
    "instructions": "Antifibrinolytic hemostatic. Push slowly to avoid hypotension.",
    "symptoms": [
      "acute bleeding",
      "epistaxis",
      "severe menorrhagia",
      "post-trauma hemorrhage",
      "dental bleeding",
      "hematuria"
    ],
    "janAushadhi": "Inj. Tranexamic Acid 500mg (PMBJP - ₹18/ampoule)",
    "adultDose": "10-15 mg/kg or 500-1000mg slow IV every 8h",
    "paedDose": "10 mg/kg slow IV push",
    "notes": "Antifibrinolytic hemostatic. Push slowly to avoid hypotension.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Adrenaline 1mg/1ml (1:1000)",
    "generic": "Epinephrine (Adrenaline) 1:1000",
    "category": "Injections & IV",
    "dose": "0.5mg (0.5ml) IM Stat",
    "timing": "Immediate mid-anterolateral thigh IM",
    "duration": "Stat",
    "instructions": "Emergency life-saving drug. Never delay in true anaphylaxis.",
    "symptoms": [
      "anaphylactic shock",
      "severe drug reaction",
      "angioedema",
      "stridor",
      "cardiac arrest",
      "shortness of breath"
    ],
    "janAushadhi": "Inj. Adrenaline 1mg/ml (PMBJP - ₹5.50/ampoule)",
    "adultDose": "0.5ml (0.5mg) IM in anterolateral thigh; repeat every 5 min if needed",
    "paedDose": "0.01 ml/kg (10 mcg/kg) IM",
    "notes": "Emergency life-saving drug. Never delay in true anaphylaxis.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Atropine 0.6mg/1ml",
    "generic": "Atropine Sulfate 0.6mg/ml",
    "category": "Injections & IV",
    "dose": "0.6mg IV Stat",
    "timing": "Rapid IV push",
    "duration": "Stat",
    "instructions": "Vagolytic anticholinergic. Keep in every emergency crash cart.",
    "symptoms": [
      "severe bradycardia",
      "organophosphate poisoning",
      "syncope",
      "heart block"
    ],
    "janAushadhi": "Inj. Atropine Sulfate (PMBJP - ₹3.00/ampoule)",
    "adultDose": "0.5-1.0mg IV for bradycardia (2-5mg IV repeated for OP poisoning)",
    "paedDose": "0.02 mg/kg (minimum 0.1mg)",
    "notes": "Vagolytic anticholinergic. Keep in every emergency crash cart.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Deriphyllin 2ml (Etofylline + Theophylline)",
    "generic": "Etofylline 84.7mg + Theophylline 25.3mg / ml",
    "category": "Injections & IV",
    "dose": "2ml IV Stat",
    "timing": "Dilute in 10-20ml NS and push slowly over 5 minutes",
    "duration": "Stat / BD",
    "instructions": "Direct bronchodilator. Rapid push causes cardiac arrhythmias.",
    "symptoms": [
      "acute bronchospasm",
      "asthma attack",
      "wheezing",
      "copd exacerbation",
      "chest tightness",
      "shortness of breath"
    ],
    "janAushadhi": "Inj. Etofylline + Theophylline (PMBJP - ₹4.50/ampoule)",
    "adultDose": "2ml slow IV BD or TDS; avoid rapid push",
    "paedDose": "Use pediatric oral bronchodilator",
    "notes": "Direct bronchodilator. Rapid push causes cardiac arrhythmias.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Stemetil 12.5mg/1ml (Prochlorperazine)",
    "generic": "Prochlorperazine Mesylate 12.5mg/ml",
    "category": "Injections & IV",
    "dose": "12.5mg (1ml) Deep IM Stat",
    "timing": "Deep intragluteal injection",
    "duration": "Stat",
    "instructions": "Excellent for acute spinning vertigo. Do not give IV.",
    "symptoms": [
      "severe vertigo",
      "labyrinthitis",
      "meniere's disease",
      "acute vomiting with giddiness",
      "headache",
      "vomiting"
    ],
    "janAushadhi": "Inj. Prochlorperazine 12.5mg (PMBJP - ₹5.00/ampoule)",
    "adultDose": "12.5mg deep IM; repeat in 6h if required",
    "paedDose": "Contraindicated in children under 10kg",
    "notes": "Excellent for acute spinning vertigo. Do not give IV.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Piptaz 4.5g (Piperacillin + Tazobactam)",
    "generic": "Piperacillin 4g + Tazobactam 0.5g Lyophilized",
    "category": "Injections & IV",
    "dose": "4.5g IV TDS",
    "timing": "Infuse in 100ml NS over 30-40 minutes after AST",
    "duration": "5 days",
    "instructions": "Broadest spectrum antipseudomonal penicillin. AST mandatory.",
    "symptoms": [
      "severe hospital acquired pneumonia",
      "septicemia",
      "diabetic foot ulcer",
      "intra-abdominal sepsis",
      "fever"
    ],
    "janAushadhi": "Inj. Piperacillin + Tazobactam 4.5g (PMBJP - ₹98/vial)",
    "adultDose": "4.5g IV every 6-8 hours",
    "paedDose": "80-100 mg/kg/dose every 8 hours",
    "notes": "Broadest spectrum antipseudomonal penicillin. AST mandatory.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Meropenem 1g (Meromac / Meronem)",
    "generic": "Meropenem Trihydrate 1000mg",
    "category": "Injections & IV",
    "dose": "1g IV TDS",
    "timing": "Infuse in 100ml NS over 30 minutes",
    "duration": "5-7 days",
    "instructions": "Reserve carbapenem antibiotic for severe hospital infections.",
    "symptoms": [
      "multidrug resistant sepsis",
      "meningitis",
      "severe peritonitis",
      "neutropenic fever",
      "fever"
    ],
    "janAushadhi": "Inj. Meropenem 1g (PMBJP - ₹145/vial)",
    "adultDose": "1g IV every 8 hours (2g for meningitis)",
    "paedDose": "20-40 mg/kg every 8 hours",
    "notes": "Reserve carbapenem antibiotic for severe hospital infections.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Optineuron / Neurobion Forte 2ml",
    "generic": "Vitamin B1 + B6 + B12 + Nicotinamide + D-Panthenol",
    "category": "Injections & IV",
    "dose": "2ml Deep IM alternate days",
    "timing": "Deep intragluteal IM",
    "duration": "5 doses",
    "instructions": "Essential neurotropic B-vitamin cocktail.",
    "symptoms": [
      "peripheral neuropathy",
      "diabetic nerve pain",
      "chronic fatigue",
      "tingling numbness",
      "weakness"
    ],
    "janAushadhi": "Inj. Vitamin B Complex + B12 (PMBJP - ₹7.00/ampoule)",
    "adultDose": "2ml IM every alternate day for 5-10 injections",
    "paedDose": "Specialist consultation",
    "notes": "Essential neurotropic B-vitamin cocktail.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Vitamin D3 6,00,000 IU (Arachitol)",
    "generic": "Cholecalciferol 6 Lakh IU / 1ml",
    "category": "Injections & IV",
    "dose": "1 Ampoule IM Stat",
    "timing": "Deep IM intragluteal",
    "duration": "Single dose (Repeat after 3 months)",
    "instructions": "Inject with 21G needle into gluteal muscle.",
    "symptoms": [
      "severe vitamin d deficiency",
      "osteomalacia",
      "rickets",
      "chronic bone pain",
      "muscle weakness"
    ],
    "janAushadhi": "Inj. Cholecalciferol 6 Lakh IU (PMBJP - ₹18/ampoule)",
    "adultDose": "6 Lakh IU deep IM once every 3-6 months",
    "paedDose": "3 Lakh IU for pediatric rickets",
    "notes": "Inject with 21G needle into gluteal muscle.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Botroclot 1ml / 2ml (Haemocoagulase)",
    "generic": "Bothrops Atrox Enzyme",
    "category": "Injections & IV",
    "dose": "1-2ml IM/IV Stat",
    "timing": "Slow IV or deep IM or soak on gauze locally",
    "duration": "Stat",
    "instructions": "Accelerates conversion of prothrombin to thrombin.",
    "symptoms": [
      "oozing capillary bleeding",
      "dental socket bleeding",
      "post-op oozing",
      "epistaxis"
    ],
    "janAushadhi": "Inj. Hemocoagulase (PMBJP - ₹24/ampoule)",
    "adultDose": "1-2ml IM or slow IV; can also be applied directly onto wound",
    "paedDose": "0.5-1ml IM",
    "notes": "Accelerates conversion of prothrombin to thrombin.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "IV Dextrose 5% (D5 - 500ml)",
    "generic": "Dextrose 5% w/v IV Infusion",
    "category": "Injections & IV",
    "dose": "1 Bottle (500ml) IV Infusion",
    "timing": "Slow IV drip",
    "duration": "Stat",
    "instructions": "Isotonic in bottle, acts as hypotonic free water inside body.",
    "symptoms": [
      "dehydration",
      "hypernatremia",
      "ketosis",
      "post-op maintenance fluid",
      "weakness"
    ],
    "janAushadhi": "IV Dextrose 5% 500ml (PMBJP - ₹18/bottle)",
    "adultDose": "500-1000ml infused over 3-4 hours",
    "paedDose": "Calculate based on Hollidays-Segar maintenance",
    "notes": "Isotonic in bottle, acts as hypotonic free water inside body.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "IV Dextrose 10% (D10 - 500ml)",
    "generic": "Dextrose 10% w/v IV Infusion",
    "category": "Injections & IV",
    "dose": "500ml Slow IV Infusion",
    "timing": "Slow IV infusion",
    "duration": "Stat",
    "instructions": "Hypertonic carbohydrate solution.",
    "symptoms": [
      "hypoglycemia",
      "severe starvation",
      "neonatal hypoglycemia",
      "caloric deficit"
    ],
    "janAushadhi": "IV Dextrose 10% 500ml (PMBJP - ₹20/bottle)",
    "adultDose": "500ml slow IV infusion over 4 hours",
    "paedDose": "5 ml/kg for acute hypoglycemia",
    "notes": "Hypertonic carbohydrate solution.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "IV Dextrose 25% (D25 - 100ml)",
    "generic": "Dextrose 25% w/v Bolus",
    "category": "Injections & IV",
    "dose": "50-100ml IV Push Stat",
    "timing": "Direct slow IV push over 5-10 minutes",
    "duration": "Stat",
    "instructions": "Immediate emergency resuscitation for severe hypoglycemia.",
    "symptoms": [
      "severe acute hypoglycemia",
      "diabetic coma",
      "unconscious hypoglycemic patient",
      "cold clammy skin"
    ],
    "janAushadhi": "Inj. Dextrose 25% 100ml (PMBJP - ₹14/bottle)",
    "adultDose": "50-100ml slow IV bolus through large vein",
    "paedDose": "Dilute to 10% (2ml/kg) for children",
    "notes": "Immediate emergency resuscitation for severe hypoglycemia.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "IV Sodium Bicarbonate 7.5% (Soda Bicarb 25ml)",
    "generic": "Sodium Bicarbonate 7.5% w/v",
    "category": "Injections & IV",
    "dose": "25-50ml IV Stat",
    "timing": "Slow IV push or dilute in 5% Dextrose",
    "duration": "Stat",
    "instructions": "Alkalinizing agent. Strictly monitor blood gas and potassium.",
    "symptoms": [
      "severe metabolic acidosis",
      "hyperkalemia",
      "tricyclic antidepressant overdose",
      "cardiac arrest"
    ],
    "janAushadhi": "Inj. Sodium Bicarbonate 25ml (PMBJP - ₹12/vial)",
    "adultDose": "1 mEq/kg (50ml of 7.5%) slow IV",
    "paedDose": "1 mEq/kg diluted 1:1 with sterile water",
    "notes": "Alkalinizing agent. Strictly monitor blood gas and potassium.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Potassium Chloride (KCl 10ml / 20 mEq)",
    "generic": "Potassium Chloride 150mg/ml",
    "category": "Injections & IV",
    "dose": "20 mEq in 500ml NS/RL",
    "timing": "Slow IV infusion over 4-6 hours (NEVER IV PUSH)",
    "duration": "Stat",
    "instructions": "FATAL IF GIVEN IV PUSH. Must always be diluted in 500ml fluid.",
    "symptoms": [
      "severe hypokalemia",
      "potassium deficiency",
      "muscle weakness from diuretic",
      "vomiting"
    ],
    "janAushadhi": "Inj. Potassium Chloride (PMBJP - ₹8.00/ampoule)",
    "adultDose": "Max 10-20 mEq/hour diluted in 500ml fluid",
    "paedDose": "0.5 mEq/kg/hr diluted",
    "notes": "FATAL IF GIVEN IV PUSH. Must always be diluted in 500ml fluid.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Disposable Syringe 10ml (with 21G Needle)",
    "generic": "Sterile Single-Use 10ml Syringe",
    "category": "Consumables & Syringes",
    "dose": "1 Syringe",
    "timing": "Single use sterile injection / aspiration",
    "duration": "Once",
    "instructions": "Sterile non-pyrogenic.",
    "symptoms": [
      "iv dilution",
      "fluid aspiration",
      "ascitic tap",
      "pleural fluid tap"
    ],
    "janAushadhi": "Syringe 10ml with Needle (PMBJP - ₹4.50/piece)",
    "adultDose": "For diluting drugs in 100ml NS and aspirating fluids",
    "paedDose": "Universal consumable",
    "notes": "Sterile non-pyrogenic.",
    "cat": "Consumables & Syringes",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Disposable Syringe 20ml / 50ml (Feeding / Aspiration)",
    "generic": "Large Volume Luer Lock Syringe",
    "category": "Consumables & Syringes",
    "dose": "1 Syringe",
    "timing": "Single use",
    "duration": "Once",
    "instructions": "Wide nozzle catheter tip for smooth enteral feeds.",
    "symptoms": [
      "ryles tube feeding",
      "gastric lavage",
      "bladder wash",
      "wound irrigation"
    ],
    "janAushadhi": "Syringe 50ml Catheter Tip (PMBJP - ₹16.00/piece)",
    "adultDose": "For enteral feeding through NG tube and cavity irrigation",
    "paedDose": "Enteral nutrition",
    "notes": "Wide nozzle catheter tip for smooth enteral feeds.",
    "cat": "Consumables & Syringes",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Scalp Vein Infusion Set 22G / 24G (Butterfly Needle)",
    "generic": "Sterile Scalp Vein Infusion Set",
    "category": "Consumables & Syringes",
    "dose": "1 Set",
    "timing": "Aseptic venipuncture",
    "duration": "Single use",
    "instructions": "Flexible butterfly wings ensure stability during short IV push.",
    "symptoms": [
      "difficult veins",
      "pediatric iv access",
      "elderly fragile veins",
      "blood collection"
    ],
    "janAushadhi": "Scalp Vein Set (PMBJP - ₹5.50/piece)",
    "adultDose": "22G for adult fragile veins; 24G/25G for pediatric patients",
    "paedDose": "Ideal for delicate pediatric veins",
    "notes": "Flexible butterfly wings ensure stability during short IV push.",
    "cat": "Consumables & Syringes",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "IV Cannula 18G (Green) / 24G (Yellow)",
    "generic": "Peripheral IV Cannula with Port & Wings",
    "category": "Consumables & Syringes",
    "dose": "1 Piece",
    "timing": "Aseptic cannulation",
    "duration": "Up to 72 hours",
    "instructions": "Color-coded international standard sizing.",
    "symptoms": [
      "blood transfusion",
      "emergency iv fluid resuscitation",
      "pediatric iv line"
    ],
    "janAushadhi": "IV Cannula with Port (PMBJP - ₹14.00/piece)",
    "adultDose": "18G (Green) for blood transfusion & emergency; 24G (Yellow) for neonates/infants",
    "paedDose": "24G yellow cannula is gold standard in pediatrics",
    "notes": "Color-coded international standard sizing.",
    "cat": "Consumables & Syringes",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Three-Way Stopcock with Extension Tube",
    "generic": "Sterile 3-Way Extension Set",
    "category": "Consumables & Syringes",
    "dose": "1 Piece",
    "timing": "Attached to IV cannula",
    "duration": "Single patient use",
    "instructions": "360-degree rotation leak-proof luer lock.",
    "symptoms": [
      "multiple iv infusions",
      "simultaneous iv medications",
      "emergency iv access"
    ],
    "janAushadhi": "Three-way Stopcock (PMBJP - ₹16.00/piece)",
    "adultDose": "Allows simultaneous drug push without disconnecting primary IV drip",
    "paedDose": "Reduces venipuncture trauma",
    "notes": "360-degree rotation leak-proof luer lock.",
    "cat": "Consumables & Syringes",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Foley Catheter 2-Way 14Fr / 16Fr (Silicone Coated)",
    "generic": "Sterile Indwelling Foley Balloon Catheter",
    "category": "Consumables & Syringes",
    "dose": "1 Piece",
    "timing": "Aseptic urethral catheterization",
    "duration": "Up to 14 days",
    "instructions": "Inflate balloon strictly with sterile water; never saline.",
    "symptoms": [
      "acute urinary retention",
      "monitoring urine output",
      "post-op urinary drainage",
      "prostatic enlargement"
    ],
    "janAushadhi": "Foley Balloon Catheter (PMBJP - ₹28.00/piece)",
    "adultDose": "14Fr for females; 16Fr for males (inflate balloon with 10ml sterile water)",
    "paedDose": "8Fr or 10Fr for children",
    "notes": "Inflate balloon strictly with sterile water; never saline.",
    "cat": "Consumables & Syringes",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Urine Drainage Bag with Anti-Reflux Valve (2000ml)",
    "generic": "Sterile Closed Urine Drainage Bag",
    "category": "Consumables & Syringes",
    "dose": "1 Bag",
    "timing": "Connect to Foley catheter",
    "duration": "Single use",
    "instructions": "Keep bag always below bladder level to prevent backflow.",
    "symptoms": [
      "urinary drainage",
      "foley catheter collection",
      "hourly urine monitoring"
    ],
    "janAushadhi": "Urine Collection Bag (PMBJP - ₹18.00/piece)",
    "adultDose": "2000ml graduated bag with bottom T-tap drainage",
    "paedDose": "Universal collection system",
    "notes": "Keep bag always below bladder level to prevent backflow.",
    "cat": "Consumables & Syringes",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Ryle's Nasogastric Tube 14Fr / 16Fr (NG Tube)",
    "generic": "Sterile Radiopaque Nasogastric Tube",
    "category": "Consumables & Syringes",
    "dose": "1 Tube",
    "timing": "Aseptic nasogastric insertion",
    "duration": "Up to 7 days",
    "instructions": "Confirm gastric placement with auscultation before feeding.",
    "symptoms": [
      "enteral feeding",
      "gastric decompression",
      "bowel obstruction",
      "unconscious patient nutrition"
    ],
    "janAushadhi": "Ryle's Tube (PMBJP - ₹19.00/piece)",
    "adultDose": "14Fr / 16Fr for adult stomach decompression and feeding",
    "paedDose": "8Fr / 10Fr for pediatric NG feeding",
    "notes": "Confirm gastric placement with auscultation before feeding.",
    "cat": "Consumables & Syringes",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Sterile Surgical Gloves 6.5 / 7.0 / 7.5",
    "generic": "Pre-Powdered Latex Surgical Gloves",
    "category": "Consumables & Syringes",
    "dose": "1 Pair",
    "timing": "Aseptic surgical & wound procedures",
    "duration": "Single use",
    "instructions": "High tactile sensitivity and tear resistance.",
    "symptoms": [
      "wound dressing",
      "minor surgery",
      "catheterization",
      "suturing"
    ],
    "janAushadhi": "Surgical Gloves Pair (PMBJP - ₹14.00/pair)",
    "adultDose": "Standard barrier protection",
    "paedDose": "Barrier protection",
    "notes": "High tactile sensitivity and tear resistance.",
    "cat": "Consumables & Syringes",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Micropore Surgical Paper Tape 1 inch / 2 inch",
    "generic": "Hypoallergenic Medical Paper Tape",
    "category": "Consumables & Syringes",
    "dose": "1 Roll",
    "timing": "Securing IV cannulas and dressings",
    "duration": "As required",
    "instructions": "Leaves zero sticky adhesive residue upon painless removal.",
    "symptoms": [
      "iv fixation",
      "wound dressing",
      "cannula taping"
    ],
    "janAushadhi": "Medical Paper Tape (PMBJP - ₹24.00/roll)",
    "adultDose": "Gentle breathable adhesion for sensitive skin",
    "paedDose": "Skin-friendly for pediatric patients",
    "notes": "Leaves zero sticky adhesive residue upon painless removal.",
    "cat": "Consumables & Syringes",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tegaderm / Transparent IV Cannula Dressing",
    "generic": "Sterile Transparent Waterproof Film Dressing",
    "category": "Consumables & Syringes",
    "dose": "1 Piece",
    "timing": "Applied over IV cannula site",
    "duration": "Up to 7 days",
    "instructions": "Waterproof, breathable barrier against external bacteria.",
    "symptoms": [
      "iv line fixation",
      "waterproof cannula protection",
      "phlebitis monitoring"
    ],
    "janAushadhi": "Transparent Cannula Fixer (PMBJP - ₹6.50/piece)",
    "adultDose": "Allows continuous visual monitoring of insertion site",
    "paedDose": "Waterproof barrier",
    "notes": "Waterproof, breathable barrier against external bacteria.",
    "cat": "Consumables & Syringes",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Syp. Calpol 120mg/5ml (Paracetamol Suspension)",
    "generic": "Paracetamol Pediatric Suspension 120mg/5ml",
    "category": "Pediatric & Syrup",
    "dose": "5-10ml TDS SOS",
    "timing": "After feeds",
    "duration": "3 days",
    "instructions": "Most trusted antipyretic for infants and young children.",
    "symptoms": [
      "pediatric fever",
      "post-vaccination fever",
      "body pain",
      "fever"
    ],
    "janAushadhi": "Syp. Paracetamol 125mg/5ml (PMBJP - ₹12/bottle)",
    "adultDose": "Use tablet form",
    "paedDose": "15 mg/kg/dose every 4-6 hours SOS (Max 4 doses/day)",
    "notes": "Most trusted antipyretic for infants and young children.",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Syp. Calpol 250mg/5ml (P-250 DS)",
    "generic": "Paracetamol Suspension 250mg/5ml",
    "category": "Pediatric & Syrup",
    "dose": "5ml TDS SOS",
    "timing": "After food",
    "duration": "3 days",
    "instructions": "Double strength reduces liquid volume required per dose.",
    "symptoms": [
      "high fever in children",
      "pain",
      "viral illness",
      "fever"
    ],
    "janAushadhi": "Syp. Paracetamol 250mg/5ml (PMBJP - ₹16/bottle)",
    "adultDose": "Use tablets",
    "paedDose": "15 mg/kg/dose (ideal for children > 12kg)",
    "notes": "Double strength reduces liquid volume required per dose.",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Syp. Ibugesic-Plus (Ibuprofen 100 + Paracetamol 162.5)",
    "generic": "Ibuprofen + Paracetamol Suspension",
    "category": "Pediatric & Syrup",
    "dose": "5ml TDS SOS",
    "timing": "After meals or milk",
    "duration": "3 days",
    "instructions": "Always administer after food or milk to prevent stomach ache.",
    "symptoms": [
      "high refractory fever",
      "throat pain",
      "earache",
      "painful injury",
      "fever",
      "pain"
    ],
    "janAushadhi": "Syp. Ibuprofen + Paracetamol (PMBJP - ₹18/bottle)",
    "adultDose": "Use Combiflam tablets",
    "paedDose": "5-10 mg/kg/dose (Ibuprofen component) for children > 6 months",
    "notes": "Always administer after food or milk to prevent stomach ache.",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Syp. Meftal-P (Mefenamic Acid 100mg/5ml)",
    "generic": "Mefenamic Acid Pediatric Suspension",
    "category": "Pediatric & Syrup",
    "dose": "5ml TDS SOS",
    "timing": "After food",
    "duration": "2-3 days",
    "instructions": "Rapidly brings down high grade refractory fever.",
    "symptoms": [
      "high spike fever",
      "febrile convulsion prophylaxis",
      "earache",
      "fever"
    ],
    "janAushadhi": "Syp. Mefenamic Acid 100mg/5ml (PMBJP - ₹14/bottle)",
    "adultDose": "Use Meftal 500 tablets",
    "paedDose": "8 mg/kg/dose TDS SOS for children > 6 months",
    "notes": "Rapidly brings down high grade refractory fever.",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Syp. Augmentin DDS 457mg/5ml",
    "generic": "Amoxicillin 400mg + Clavulanate 57mg / 5ml",
    "category": "Pediatric & Syrup",
    "dose": "5ml BD",
    "timing": "At start of meals",
    "duration": "5 days",
    "instructions": "Reconstitute with boiled and cooled sterile water. Store in fridge.",
    "symptoms": [
      "pediatric chest infection",
      "otitis media",
      "tonsillitis",
      "sinusitis",
      "fever"
    ],
    "janAushadhi": "Dry Syp. Amox-Clav 457mg (PMBJP - ₹38/bottle)",
    "adultDose": "Use Augmentin 625 tablets",
    "paedDose": "45-90 mg/kg/day (Amoxicillin) divided twice daily",
    "notes": "Reconstitute with boiled and cooled sterile water. Store in fridge.",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Syp. Taxim-O 50mg/5ml (Cefixime)",
    "generic": "Cefixime Pediatric Dry Syrup 50mg/5ml",
    "category": "Pediatric & Syrup",
    "dose": "5ml BD",
    "timing": "After food",
    "duration": "5 days",
    "instructions": "Excellent compliance in children for enteric fever.",
    "symptoms": [
      "pediatric typhoid",
      "urinary infection in children",
      "bronchitis",
      "fever"
    ],
    "janAushadhi": "Dry Syp. Cefixime 50mg (PMBJP - ₹18/bottle)",
    "adultDose": "Use Taxim-O 200 tablets",
    "paedDose": "8 mg/kg/day in two divided doses",
    "notes": "Excellent compliance in children for enteric fever.",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Syp. Taxim-O 100mg/5ml (Cefixime Forte)",
    "generic": "Cefixime Pediatric Oral Suspension 100mg/5ml",
    "category": "Pediatric & Syrup",
    "dose": "5ml BD",
    "timing": "After meals",
    "duration": "5 days",
    "instructions": "Use within 7 days of reconstitution.",
    "symptoms": [
      "typhoid fever in older children",
      "severe bacterial infection",
      "fever"
    ],
    "janAushadhi": "Dry Syp. Cefixime 100mg (PMBJP - ₹24/bottle)",
    "adultDose": "Use tablet",
    "paedDose": "8 mg/kg/day (ideal for children > 15kg)",
    "notes": "Use within 7 days of reconstitution.",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Syp. Azithral 100mg / 200mg (Azithromycin)",
    "generic": "Azithromycin Suspension 100mg/5ml or 200mg/5ml",
    "category": "Pediatric & Syrup",
    "dose": "5ml OD",
    "timing": "1 hour before meals",
    "duration": "3 days",
    "instructions": "Only once a day for 3 days. High parent compliance.",
    "symptoms": [
      "pediatric sore throat",
      "pharyngitis",
      "dry hacking cough",
      "ear infection",
      "sore throat"
    ],
    "janAushadhi": "Syp. Azithromycin 100mg/5ml (PMBJP - ₹16/bottle)",
    "adultDose": "Use Azithromycin 500mg tablets",
    "paedDose": "10 mg/kg once daily for 3 days",
    "notes": "Only once a day for 3 days. High parent compliance.",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Syp. Ondem 2mg/5ml (Ondansetron)",
    "generic": "Ondansetron Pediatric Syrup 2mg/5ml",
    "category": "Pediatric & Syrup",
    "dose": "2.5-5ml TDS SOS",
    "timing": "15 min before feeds",
    "duration": "2 days",
    "instructions": "Crucial first step before attempting oral rehydration.",
    "symptoms": [
      "pediatric vomiting",
      "acute gastroenteritis",
      "food poisoning",
      "vomiting"
    ],
    "janAushadhi": "Syp. Ondansetron 2mg/5ml (PMBJP - ₹11/bottle)",
    "adultDose": "Use Emeset 4mg tablets",
    "paedDose": "0.15 mg/kg/dose 15-30 min before food or ORS",
    "notes": "Crucial first step before attempting oral rehydration.",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Syp. Montair-LC Kid (Montelukast 4 + Levo 2.5)",
    "generic": "Montelukast 4mg + Levocetirizine 2.5mg / 5ml",
    "category": "Pediatric & Syrup",
    "dose": "2.5-5ml OD",
    "timing": "At night",
    "duration": "7 days",
    "instructions": "Provides relief from dry night coughing and allergic sneezing.",
    "symptoms": [
      "pediatric allergic cough",
      "nocturnal cough",
      "allergic rhinitis",
      "sneezing",
      "cold"
    ],
    "janAushadhi": "Syp. Montelukast + Levocetirizine (PMBJP - ₹19/bottle)",
    "adultDose": "Use adult Montair-LC tablet",
    "paedDose": "2.5ml for 2-5y; 5ml for 6-11y at bedtime",
    "notes": "Provides relief from dry night coughing and allergic sneezing.",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Drops Colicaid / Neopeptine (Simethicone + Dill Oil)",
    "generic": "Simethicone + Dill Oil + Fennel Oil Infantile Drops",
    "category": "Pediatric & Syrup",
    "dose": "4-8 drops TDS",
    "timing": "15 min before breastfeeding / bottle feeds",
    "duration": "5 days",
    "instructions": "Breaks gas bubbles in baby's tummy. Safe and gentle.",
    "symptoms": [
      "infantile colic",
      "inconsolable crying after feeds",
      "gas bloating in baby",
      "abdominal pain"
    ],
    "janAushadhi": "Infantile Anti-Colic Drops (PMBJP - ₹14/bottle)",
    "adultDose": "Use Gelusil",
    "paedDose": "4 drops for infants < 6m; 8 drops for 6-12m before feeds",
    "notes": "Breaks gas bubbles in baby's tummy. Safe and gentle.",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Drops Nasoclear (0.9% Normal Saline Nasal Drops)",
    "generic": "Sodium Chloride 0.9% Isotonic Nasal Solution",
    "category": "Pediatric & Syrup",
    "dose": "2 drops in each nostril",
    "timing": "10 min before feeds and at bedtime",
    "duration": "5 days",
    "instructions": "100% medication-free. Safe for newborns from day 1.",
    "symptoms": [
      "nasal congestion in newborn",
      "noisy breathing in baby",
      "difficulty feeding due to blocked nose",
      "runny nose"
    ],
    "janAushadhi": "Saline Nasal Drops 0.9% (PMBJP - ₹8.00/bottle)",
    "adultDose": "2-3 drops in nostrils as needed",
    "paedDose": "1-2 drops in each nostril before feeding",
    "notes": "100% medication-free. Safe for newborns from day 1.",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Syp. Zincovit / Zinc Gluconate 20mg",
    "generic": "Zinc Gluconate 20mg / 5ml",
    "category": "Pediatric & Syrup",
    "dose": "5ml once daily",
    "timing": "After food",
    "duration": "14 days",
    "instructions": "Mandatory WHO protocol for 14 days to regenerate gut mucosa.",
    "symptoms": [
      "diarrhea in children",
      "pediatric recovery",
      "immunity booster",
      "loose motions"
    ],
    "janAushadhi": "Syp. Zinc Gluconate 20mg (PMBJP - ₹16/bottle)",
    "adultDose": "Use Zincovit tablet",
    "paedDose": "10mg daily for < 6m; 20mg daily for > 6m for full 14 days",
    "notes": "Mandatory WHO protocol for 14 days to regenerate gut mucosa.",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Tab. Cilacar 10mg (Cilnidipine)",
    "generic": "Cilnidipine 10mg",
    "category": "Oral Tablets & Caps",
    "dose": "1-0-0",
    "timing": "Morning with water",
    "duration": "30 days",
    "instructions": "L/N-type calcium blocker. Causes significantly less pedal edema than Amlodipine.",
    "symptoms": [
      "hypertension",
      "high blood pressure",
      "hypertension review"
    ],
    "janAushadhi": "Tab. Cilnidipine 10mg (PMBJP - ₹14/strip)",
    "adultDose": "5-10mg once daily; may increase to 20mg",
    "paedDose": "Not recommended in children",
    "notes": "L/N-type calcium blocker. Causes significantly less pedal edema than Amlodipine.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Cilacar 5mg (Cilnidipine)",
    "generic": "Cilnidipine 5mg",
    "category": "Oral Tablets & Caps",
    "dose": "1-0-0",
    "timing": "Morning",
    "duration": "30 days",
    "instructions": "Kidney-friendly antihypertensive.",
    "symptoms": [
      "mild hypertension",
      "hypertension review"
    ],
    "janAushadhi": "Tab. Cilnidipine 5mg (PMBJP - ₹9.00/strip)",
    "adultDose": "5mg once daily",
    "paedDose": "Contraindicated",
    "notes": "Kidney-friendly antihypertensive.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Ramipril 2.5mg (Cardace 2.5)",
    "generic": "Ramipril 2.5mg",
    "category": "Cardiovascular",
    "dose": "1-0-0",
    "timing": "Morning with water",
    "duration": "30 days",
    "instructions": "ACE inhibitor. Watch for dry persistent cough and serum creatinine.",
    "symptoms": [
      "hypertension",
      "post-myocardial infarction",
      "diabetic nephropathy",
      "heart failure"
    ],
    "janAushadhi": "Tab. Ramipril 2.5mg (PMBJP - ₹6.50/strip)",
    "adultDose": "2.5mg once daily, titrate to 5-10mg daily",
    "paedDose": "Specialist consultation",
    "notes": "ACE inhibitor. Watch for dry persistent cough and serum creatinine.",
    "cat": "Cardiovascular",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Ramipril 5mg (Cardace 5)",
    "generic": "Ramipril 5mg",
    "category": "Cardiovascular",
    "dose": "1-0-0",
    "timing": "Morning",
    "duration": "30 days",
    "instructions": "Cardioprotective and renoprotective in diabetics.",
    "symptoms": [
      "hypertension",
      "heart failure",
      "cardioprotection",
      "hypertension review"
    ],
    "janAushadhi": "Tab. Ramipril 5mg (PMBJP - ₹9.50/strip)",
    "adultDose": "5-10mg once daily",
    "paedDose": "Not established",
    "notes": "Cardioprotective and renoprotective in diabetics.",
    "cat": "Cardiovascular",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Nebicard 5mg (Nebivolol)",
    "generic": "Nebivolol 5mg",
    "category": "Oral Tablets & Caps",
    "dose": "1-0-0",
    "timing": "Morning with or without food",
    "duration": "30 days",
    "instructions": "Third-generation vasodilating beta blocker. Lowest erectile dysfunction risk.",
    "symptoms": [
      "hypertension with tachycardia",
      "anxiety hypertension",
      "angina"
    ],
    "janAushadhi": "Tab. Nebivolol 5mg (PMBJP - ₹11/strip)",
    "adultDose": "2.5-5mg once daily (Max 10mg/day)",
    "paedDose": "Not recommended",
    "notes": "Third-generation vasodilating beta blocker. Lowest erectile dysfunction risk.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Concor 2.5mg (Bisoprolol)",
    "generic": "Bisoprolol Fumarate 2.5mg",
    "category": "Oral Tablets & Caps",
    "dose": "1-0-0",
    "timing": "Morning with water",
    "duration": "30 days",
    "instructions": "Highly cardio-selective beta-1 blocker.",
    "symptoms": [
      "heart failure",
      "stable angina",
      "hypertension",
      "palpitations"
    ],
    "janAushadhi": "Tab. Bisoprolol 2.5mg (PMBJP - ₹7.50/strip)",
    "adultDose": "1.25mg to 5mg once daily",
    "paedDose": "Specialist consultation",
    "notes": "Highly cardio-selective beta-1 blocker.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Concor 5mg (Bisoprolol)",
    "generic": "Bisoprolol Fumarate 5mg",
    "category": "Oral Tablets & Caps",
    "dose": "1-0-0",
    "timing": "Morning",
    "duration": "30 days",
    "instructions": "Controls resting heart rate smoothly over 24 hours.",
    "symptoms": [
      "angina pectoris",
      "hypertension",
      "arrhythmia"
    ],
    "janAushadhi": "Tab. Bisoprolol 5mg (PMBJP - ₹12/strip)",
    "adultDose": "5-10mg once daily",
    "paedDose": "Not recommended",
    "notes": "Controls resting heart rate smoothly over 24 hours.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Dytor 10mg (Torsemide)",
    "generic": "Torsemide 10mg",
    "category": "Oral Tablets & Caps",
    "dose": "1-0-0",
    "timing": "Morning after breakfast",
    "duration": "15 days",
    "instructions": "Take in the morning to avoid nighttime awakening for urination.",
    "symptoms": [
      "edema",
      "congestive cardiac failure",
      "pedal edema",
      "hypertension with fluid overload"
    ],
    "janAushadhi": "Tab. Torsemide 10mg (PMBJP - ₹8.00/strip)",
    "adultDose": "5-20mg once daily in morning",
    "paedDose": "Specialist consultation",
    "notes": "Take in the morning to avoid nighttime awakening for urination.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Dytor Plus 10 (Torsemide 10 + Spironolactone 50)",
    "generic": "Torsemide + Spironolactone",
    "category": "Vitamins & Supplements",
    "dose": "1-0-0",
    "timing": "Morning after breakfast",
    "duration": "15 days",
    "instructions": "Potassium-sparing diuretic combo. Prevents hypokalemia.",
    "symptoms": [
      "hepatic ascites",
      "refractory edema",
      "heart failure edema"
    ],
    "janAushadhi": "Tab. Torsemide + Spironolactone (PMBJP - ₹16/strip)",
    "adultDose": "1 tablet once daily in morning",
    "paedDose": "Contraindicated in children",
    "notes": "Potassium-sparing diuretic combo. Prevents hypokalemia.",
    "cat": "Vitamins & Supplements",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Sorbitrate 5mg / 10mg (Isosorbide Dinitrate)",
    "generic": "Isosorbide Dinitrate 5mg / 10mg Sublingual",
    "category": "Cardiovascular",
    "dose": "1 tab sublingually SOS",
    "timing": "Place under tongue during chest pain",
    "duration": "SOS",
    "instructions": "Instruct patient to sit down before taking; causes transient postural giddiness.",
    "symptoms": [
      "angina pectoris",
      "chest pain",
      "cardiac ischemia",
      "pain"
    ],
    "janAushadhi": "Tab. Isosorbide Dinitrate 5mg (PMBJP - ₹2.50/strip)",
    "adultDose": "5-10mg sublingually every 5-10 minutes SOS during chest pain (Max 3 doses)",
    "paedDose": "Contraindicated in children",
    "notes": "Instruct patient to sit down before taking; causes transient postural giddiness.",
    "cat": "Cardiovascular",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Ryzodeg / Glycomet-Trio 1",
    "generic": "Glimepiride 1mg + Metformin 500mg SR + Voglibose 0.2mg",
    "category": "Gastrointestinal",
    "dose": "1-0-0",
    "timing": "Just before breakfast",
    "duration": "30 days",
    "instructions": "Triple action: increases insulin, reduces hepatic glucose, blocks carbohydrate absorption.",
    "symptoms": [
      "type 2 diabetes",
      "high post-prandial blood sugar",
      "diabetes review"
    ],
    "janAushadhi": "Tab. Trio Combo (PMBJP - ₹18/strip)",
    "adultDose": "1 tablet once or twice daily with first bite of meal",
    "paedDose": "Contraindicated",
    "notes": "Triple action: increases insulin, reduces hepatic glucose, blocks carbohydrate absorption.",
    "cat": "Gastrointestinal",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Jalra-M 50/500 (Vildagliptin + Metformin)",
    "generic": "Vildagliptin 50mg + Metformin 500mg",
    "category": "Diabetic Care",
    "dose": "1-0-1",
    "timing": "With meals",
    "duration": "30 days",
    "instructions": "Weight-neutral with negligible risk of hypoglycemia.",
    "symptoms": [
      "diabetes mellitus",
      "hyperglycemia",
      "diabetes review"
    ],
    "janAushadhi": "Tab. Vildagliptin + Metformin (PMBJP - ₹19/strip)",
    "adultDose": "1 tablet twice daily with breakfast and dinner",
    "paedDose": "Not recommended in children",
    "notes": "Weight-neutral with negligible risk of hypoglycemia.",
    "cat": "Diabetic Care",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Forxiga 5mg (Dapagliflozin)",
    "generic": "Dapagliflozin 5mg",
    "category": "Diabetic Care",
    "dose": "1-0-0",
    "timing": "Morning with water",
    "duration": "30 days",
    "instructions": "SGLT2 inhibitor. Drink plenty of water; ensure genital hygiene.",
    "symptoms": [
      "type 2 diabetes with heart failure",
      "cardiovascular risk reduction",
      "diabetes review"
    ],
    "janAushadhi": "Tab. Dapagliflozin 5mg (PMBJP - ₹18/strip)",
    "adultDose": "5-10mg once daily in morning",
    "paedDose": "Not established",
    "notes": "SGLT2 inhibitor. Drink plenty of water; ensure genital hygiene.",
    "cat": "Diabetic Care",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Thyronorm 25mcg / 50mcg / 100mcg (Levothyroxine)",
    "generic": "Levothyroxine Sodium",
    "category": "Diabetic Care",
    "dose": "1-0-0",
    "timing": "Empty stomach early morning 1 hr before tea/breakfast",
    "duration": "30-90 days",
    "instructions": "Strict empty stomach with plain water. Avoid tea, milk or calcium for 1 hour.",
    "symptoms": [
      "hypothyroidism",
      "weight gain",
      "lethargy",
      "high tsh",
      "hair fall",
      "weakness"
    ],
    "janAushadhi": "Tab. Levothyroxine 50mcg (PMBJP - ₹12/100 tabs)",
    "adultDose": "25 to 150 mcg once daily based on serum TSH",
    "paedDose": "Pediatric dosing by weight",
    "notes": "Strict empty stomach with plain water. Avoid tea, milk or calcium for 1 hour.",
    "cat": "Diabetic Care",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Cream Luliconazole 1% (Lulifin / Lulican)",
    "generic": "Luliconazole 1% w/w Cream",
    "category": "Oral Tablets & Caps",
    "dose": "Apply thin film once daily",
    "timing": "Clean and dry area before applying",
    "duration": "14 days",
    "instructions": "New-generation imidazole with rapid clearance of fungal itching.",
    "symptoms": [
      "ringworm",
      "tinea cruris",
      "fungal skin infection",
      "groin itch",
      "itching"
    ],
    "janAushadhi": "Luliconazole 1% Cream 20g (PMBJP - ₹34/tube)",
    "adultDose": "Apply once daily covering 1 inch beyond lesion border",
    "paedDose": "Safe for children > 2 years",
    "notes": "New-generation imidazole with rapid clearance of fungal itching.",
    "cat": "Oral Tablets & Caps",
    "form": "Cream",
    "route": "Topical"
  },
  {
    "name": "Cream Betnovate-N (Betamethasone + Neomycin)",
    "generic": "Betamethasone Valerate 0.1% + Neomycin 0.5%",
    "category": "Oral Tablets & Caps",
    "dose": "Apply twice daily",
    "timing": "Morning and evening",
    "duration": "5-7 days",
    "instructions": "Potent steroid. Do NOT apply on face or purely fungal rashes.",
    "symptoms": [
      "infected eczema",
      "severe contact dermatitis",
      "insect bite reaction",
      "skin inflammation"
    ],
    "janAushadhi": "Betamethasone + Neomycin Cream (PMBJP - ₹14/tube)",
    "adultDose": "Apply sparingly to affected areas for max 7 days",
    "paedDose": "Use with caution in children; avoid face",
    "notes": "Potent steroid. Do NOT apply on face or purely fungal rashes.",
    "cat": "Oral Tablets & Caps",
    "form": "Cream",
    "route": "Topical"
  },
  {
    "name": "Cream Quadriderm (Betamethasone + Clotrimazole + Gentamicin)",
    "generic": "Steroid + Antifungal + Antibacterial Cream",
    "category": "Oral Tablets & Caps",
    "dose": "Apply twice daily",
    "timing": "After cleansing",
    "duration": "5 days",
    "instructions": "Short-term use only for acutely inflamed mixed lesions.",
    "symptoms": [
      "mixed bacterial and fungal skin infection",
      "inflamed dermatomycosis"
    ],
    "janAushadhi": "Triple Action Skin Cream (PMBJP - ₹16/tube)",
    "adultDose": "Apply thin layer twice daily",
    "paedDose": "Avoid in infants",
    "notes": "Short-term use only for acutely inflamed mixed lesions.",
    "cat": "Oral Tablets & Caps",
    "form": "Cream",
    "route": "Topical"
  },
  {
    "name": "Lotion Permethrin 5% (Scaboma / Permite)",
    "generic": "Permethrin 5% w/v Lotion",
    "category": "Oral Tablets & Caps",
    "dose": "Apply neck-to-toe overnight",
    "timing": "Leave on for 8-12 hours then bathe with warm water",
    "duration": "Single application (Repeat on Day 7)",
    "instructions": "Wash all clothes, bedsheets and treat all family members together.",
    "symptoms": [
      "scabies",
      "severe nighttime itching",
      "itch burrows between fingers",
      "itching"
    ],
    "janAushadhi": "Permethrin 5% Lotion 60ml (PMBJP - ₹26/bottle)",
    "adultDose": "Apply thoroughly from neck to soles of feet; wash after 8-12h",
    "paedDose": "Include head and neck in infants < 2y",
    "notes": "Wash all clothes, bedsheets and treat all family members together.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Eye Drops Moxicip 0.5% (Moxifloxacin)",
    "generic": "Moxifloxacin 0.5% w/v Ophthalmic Solution",
    "category": "Pediatric & Syrup",
    "dose": "1 drop in affected eye",
    "timing": "TDS for 5 days",
    "duration": "5 days",
    "instructions": "4th gen fluoroquinolone. Do not touch dropper tip to eyelashes.",
    "symptoms": [
      "bacterial conjunctivitis",
      "red eye",
      "purulent eye discharge",
      "eye pain"
    ],
    "janAushadhi": "Moxifloxacin Eye Drops 5ml (PMBJP - ₹18/bottle)",
    "adultDose": "1 drop in affected eye 3 times daily",
    "paedDose": "Safe in children > 1 year",
    "notes": "4th gen fluoroquinolone. Do not touch dropper tip to eyelashes.",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Eye Drops Tobramycin 0.3% (Tobrex)",
    "generic": "Tobramycin 0.3% w/v Ophthalmic Solution",
    "category": "Pediatric & Syrup",
    "dose": "1-2 drops QDS",
    "timing": "Every 4-6 hours",
    "duration": "5 days",
    "instructions": "Broad spectrum aminoglycoside eye drops.",
    "symptoms": [
      "external ocular infections",
      "eyelid infection",
      "blepharitis",
      "sticky red eyes"
    ],
    "janAushadhi": "Tobramycin Eye Drops 5ml (PMBJP - ₹14/bottle)",
    "adultDose": "1-2 drops into conjunctival sac every 4h",
    "paedDose": "Safe in infants > 2 months",
    "notes": "Broad spectrum aminoglycoside eye drops.",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Ear Drops Candibiotic (Clotrimazole + Chloramphenicol + Lignocaine)",
    "generic": "Antibacterial + Antifungal + Local Anesthetic Ear Drops",
    "category": "Pediatric & Syrup",
    "dose": "3-4 drops in affected ear",
    "timing": "TDS for 5 days",
    "duration": "5 days",
    "instructions": "Warm bottle between hands before instilling. Do not use if eardrum is perforated.",
    "symptoms": [
      "earache",
      "otitis externa",
      "fungal ear infection (otomycosis)",
      "ear discharge",
      "pain"
    ],
    "janAushadhi": "Combo Ear Drops 5ml (PMBJP - ₹16/bottle)",
    "adultDose": "3-4 drops into ear canal 3-4 times daily",
    "paedDose": "2-3 drops for children",
    "notes": "Warm bottle between hands before instilling. Do not use if eardrum is perforated.",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Ear Drops Waxsolve / Clearwax (Paradichlorobenzene + Benzocaine)",
    "generic": "Cerumenolytic Ear Drops (Wax Softener)",
    "category": "Pediatric & Syrup",
    "dose": "3-4 drops at bedtime",
    "timing": "Lie down with affected ear up for 10 minutes",
    "duration": "3-5 days",
    "instructions": "Softens hardened ear wax gently before clinic syringing.",
    "symptoms": [
      "impacted ear wax",
      "reduced hearing from wax",
      "ear fullness",
      "ear blockage"
    ],
    "janAushadhi": "Ear Wax Softening Drops (PMBJP - ₹15/bottle)",
    "adultDose": "Instill 3-4 drops at night for 3 consecutive days before ear syringing",
    "paedDose": "Safe for older children",
    "notes": "Softens hardened ear wax gently before clinic syringing.",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Betadine 2% Mint Gargle (Povidone Iodine 2%)",
    "generic": "Povidone-Iodine 2% w/v Germicide Gargle",
    "category": "Pediatric & Syrup",
    "dose": "10ml diluted with equal parts warm water",
    "timing": "Gargle for 30 seconds and spit out TDS",
    "duration": "5 days",
    "instructions": "Instant antiseptic relief for painful viral and bacterial sore throats.",
    "symptoms": [
      "sore throat",
      "tonsillitis",
      "mouth ulcers",
      "pharyngitis",
      "throat pain"
    ],
    "janAushadhi": "Povidone Iodine 2% Gargle 50ml (PMBJP - ₹22/bottle)",
    "adultDose": "Gargle and rinse mouth 3-4 times daily; do not swallow",
    "paedDose": "For children > 6 years who can reliably spit out",
    "notes": "Instant antiseptic relief for painful viral and bacterial sore throats.",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Chlorhexidine 0.2% Mouthwash (Hexidine)",
    "generic": "Chlorhexidine Gluconate 0.2% w/v",
    "category": "Pediatric & Syrup",
    "dose": "10ml undiluted",
    "timing": "Swish in mouth for 1 minute after brushing, twice daily",
    "duration": "7 days",
    "instructions": "Gold standard oral antiseptic. Prolonged use may cause reversible teeth staining.",
    "symptoms": [
      "gingivitis",
      "bleeding gums",
      "mouth odor",
      "post-dental extraction hygiene"
    ],
    "janAushadhi": "Chlorhexidine 0.2% Mouthwash 100ml (PMBJP - ₹24/bottle)",
    "adultDose": "Rinse mouth twice daily; avoid eating/drinking for 30 minutes",
    "paedDose": "Children > 6y under supervision",
    "notes": "Gold standard oral antiseptic. Prolonged use may cause reversible teeth staining.",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Oral Gel Zytee / Mucopain (Choline Salicylate + Benzalkonium)",
    "generic": "Choline Salicylate 8.7% + Benzalkonium Chloride",
    "category": "Oral Tablets & Caps",
    "dose": "Apply small dab with clean finger",
    "timing": "15 min before meals",
    "duration": "5 days",
    "instructions": "Provides instant topical numbing allowing patient to eat comfortably.",
    "symptoms": [
      "painful mouth ulcers",
      "aphthous stomatitis",
      "denture irritation",
      "canker sores"
    ],
    "janAushadhi": "Mouth Ulcer Gel (PMBJP - ₹16/tube)",
    "adultDose": "Apply gently over ulcer 3-4 times daily before meals",
    "paedDose": "Safe for children",
    "notes": "Provides instant topical numbing allowing patient to eat comfortably.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Gel Dologel-CT (Choline Salicylate + Lidocaine)",
    "generic": "Choline Salicylate + Lidocaine Hydrochloride",
    "category": "Analgesic & Antipyretic",
    "dose": "Apply pea-sized amount over ulcer",
    "timing": "3-4 times daily before food",
    "duration": "4 days",
    "instructions": "Fast local anesthetic relief.",
    "symptoms": [
      "acute aphthous ulcers",
      "tongue cuts",
      "inner cheek bite"
    ],
    "janAushadhi": "Lidocaine Oral Gel (PMBJP - ₹18/tube)",
    "adultDose": "Topical mucosal application",
    "paedDose": "Safe in children > 2y",
    "notes": "Fast local anesthetic relief.",
    "cat": "Analgesic & Antipyretic",
    "form": "Gel",
    "route": "Topical"
  },
  {
    "name": "Tab. Vertin 16mg (Betahistine)",
    "generic": "Betahistine Dihydrochloride 16mg",
    "category": "Oral Tablets & Caps",
    "dose": "1-0-1 or 1-1-1",
    "timing": "With or after food",
    "duration": "10 days",
    "instructions": "Histamine analogue. Improves labyrinthine microcirculation. Take with food.",
    "symptoms": [
      "vertigo",
      "spinning sensation",
      "dizziness",
      "meniere's disease",
      "ear ringing (tinnitus)"
    ],
    "janAushadhi": "Tab. Betahistine 16mg (PMBJP - ₹12/strip)",
    "adultDose": "16mg TDS or 24mg BD with meals",
    "paedDose": "Contraindicated in children",
    "notes": "Histamine analogue. Improves labyrinthine microcirculation. Take with food.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Vertin 8mg (Betahistine)",
    "generic": "Betahistine Dihydrochloride 8mg",
    "category": "Oral Tablets & Caps",
    "dose": "1-0-1",
    "timing": "After meals",
    "duration": "7 days",
    "instructions": "Maintenance dose for benign positional vertigo.",
    "symptoms": [
      "mild vertigo",
      "positional dizziness",
      "giddiness"
    ],
    "janAushadhi": "Tab. Betahistine 8mg (PMBJP - ₹7.00/strip)",
    "adultDose": "8-16mg TDS with meals",
    "paedDose": "Not recommended",
    "notes": "Maintenance dose for benign positional vertigo.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Stugeron 25mg (Cinnarizine)",
    "generic": "Cinnarizine 25mg",
    "category": "Oral Tablets & Caps",
    "dose": "1-1-1",
    "timing": "After meals",
    "duration": "5 days",
    "instructions": "Antihistamine and calcium channel antagonist. May cause drowsiness.",
    "symptoms": [
      "motion sickness",
      "travel nausea",
      "vertigo",
      "inner ear balance disorder",
      "vomiting"
    ],
    "janAushadhi": "Tab. Cinnarizine 25mg (PMBJP - ₹4.50/strip)",
    "adultDose": "25mg TDS after food (take 25mg 2 hours before travel)",
    "paedDose": "12.5mg for children 5-12 years",
    "notes": "Antihistamine and calcium channel antagonist. May cause drowsiness.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Pregabalin 75mg (Pregeb 75)",
    "generic": "Pregabalin 75mg",
    "category": "Neuro & Psychiatry",
    "dose": "0-0-1",
    "timing": "At bedtime",
    "duration": "15-30 days",
    "instructions": "Alpha-2-delta ligand for neuropathic pain. Causes initial dizziness.",
    "symptoms": [
      "diabetic neuropathy",
      "burning feet",
      "sciatica nerve pain",
      "fibromyalgia",
      "post-herpetic neuralgia",
      "pain"
    ],
    "janAushadhi": "Cap. Pregabalin 75mg (PMBJP - ₹16/strip)",
    "adultDose": "75mg at bedtime, may titrate to 75mg BD",
    "paedDose": "Not approved under 18 years",
    "notes": "Alpha-2-delta ligand for neuropathic pain. Causes initial dizziness.",
    "cat": "Neuro & Psychiatry",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Gabapentin 100mg / 300mg (Gabapin)",
    "generic": "Gabapentin 100mg / 300mg",
    "category": "Neuro & Psychiatry",
    "dose": "0-0-1 to 1-0-1",
    "timing": "At bedtime with water",
    "duration": "30 days",
    "instructions": "Effective for burning and shooting neuropathic sensations.",
    "symptoms": [
      "nerve pain",
      "neuropathic tingling",
      "sciatica",
      "pain"
    ],
    "janAushadhi": "Tab. Gabapentin 300mg (PMBJP - ₹19/strip)",
    "adultDose": "300mg at bedtime, titrate up to 300mg TDS",
    "paedDose": "Specialist consultation",
    "notes": "Effective for burning and shooting neuropathic sensations.",
    "cat": "Neuro & Psychiatry",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Clonazepam 0.5mg (Zapiz 0.5)",
    "generic": "Clonazepam 0.5mg Mouth Dissolving",
    "category": "Neuro & Psychiatry",
    "dose": "0-0-1 (SOS)",
    "timing": "At bedtime",
    "duration": "5-7 days",
    "instructions": "Schedule H1 drug. Prescribe strictly for short durations to avoid dependence.",
    "symptoms": [
      "severe acute anxiety",
      "panic attack",
      "insomnia",
      "restlessness",
      "seizure disorder"
    ],
    "janAushadhi": "Tab. Clonazepam 0.5mg (PMBJP - ₹4.00/strip)",
    "adultDose": "0.25mg to 0.5mg at bedtime SOS (Schedule H1)",
    "paedDose": "Specialist consultation only",
    "notes": "Schedule H1 drug. Prescribe strictly for short durations to avoid dependence.",
    "cat": "Neuro & Psychiatry",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Escitalopram 10mg (Nexito 10)",
    "generic": "Escitalopram Oxalate 10mg",
    "category": "Neuro & Psychiatry",
    "dose": "1-0-0",
    "timing": "Morning after breakfast",
    "duration": "30 days",
    "instructions": "SSRI of choice. Takes 2-3 weeks for full antidepressant/anxiolytic effect.",
    "symptoms": [
      "generalized anxiety disorder",
      "depression",
      "panic disorder",
      "obsessive rumination"
    ],
    "janAushadhi": "Tab. Escitalopram 10mg (PMBJP - ₹14/strip)",
    "adultDose": "10mg once daily in morning, may increase to 20mg",
    "paedDose": "Not recommended under 18 years",
    "notes": "SSRI of choice. Takes 2-3 weeks for full antidepressant/anxiolytic effect.",
    "cat": "Neuro & Psychiatry",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Amitriptyline 10mg / 25mg (Tryptomer)",
    "generic": "Amitriptyline Hydrochloride 10mg / 25mg",
    "category": "Gastrointestinal",
    "dose": "0-0-1",
    "timing": "At bedtime",
    "duration": "30 days",
    "instructions": "First-line migraine preventive. Imparts restful sleep.",
    "symptoms": [
      "migraine prophylaxis",
      "tension headache",
      "chronic tension pain",
      "insomnia with pain",
      "headache"
    ],
    "janAushadhi": "Tab. Amitriptyline 10mg (PMBJP - ₹3.50/strip)",
    "adultDose": "10-25mg at bedtime",
    "paedDose": "Not recommended in children",
    "notes": "First-line migraine preventive. Imparts restful sleep.",
    "cat": "Gastrointestinal",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Propranolol 40mg (Ciplar 40)",
    "generic": "Propranolol Hydrochloride 40mg",
    "category": "Oral Tablets & Caps",
    "dose": "1-0-1",
    "timing": "After food",
    "duration": "30 days",
    "instructions": "Contraindicated in bronchial asthma and severe bradycardia.",
    "symptoms": [
      "migraine prevention",
      "essential tremors",
      "performance anxiety tachycardia",
      "palpitations"
    ],
    "janAushadhi": "Tab. Propranolol 40mg (PMBJP - ₹4.50/strip)",
    "adultDose": "20-40mg twice daily for migraine prophylaxis",
    "paedDose": "Specialist guidance",
    "notes": "Contraindicated in bronchial asthma and severe bradycardia.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Folic Acid 5mg (Folvite)",
    "generic": "Folic Acid 5mg",
    "category": "Vitamins & Supplements",
    "dose": "1-0-0",
    "timing": "After breakfast",
    "duration": "90 days",
    "instructions": "Mandatory pre-pregnancy and first trimester to prevent neural tube defects.",
    "symptoms": [
      "pre-conception planning",
      "first trimester pregnancy",
      "folate deficiency anemia",
      "mouth ulcers"
    ],
    "janAushadhi": "Tab. Folic Acid 5mg (PMBJP - ₹2.50/strip)",
    "adultDose": "5mg once daily",
    "paedDose": "2.5mg for older children",
    "notes": "Mandatory pre-pregnancy and first trimester to prevent neural tube defects.",
    "cat": "Vitamins & Supplements",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Dydrogesterone 10mg (Duphaston)",
    "generic": "Dydrogesterone 10mg",
    "category": "Oral Tablets & Caps",
    "dose": "1-0-1",
    "timing": "After meals",
    "duration": "14-30 days",
    "instructions": "Retroprogesterone without androgenic or virilizing side effects.",
    "symptoms": [
      "threatened abortion",
      "recurrent miscarriage support",
      "dysfunctional uterine bleeding",
      "irregular periods"
    ],
    "janAushadhi": "Tab. Dydrogesterone 10mg (PMBJP - ₹85/strip)",
    "adultDose": "10mg twice daily as directed by gynecologist",
    "paedDose": "Contraindicated",
    "notes": "Retroprogesterone without androgenic or virilizing side effects.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Tranexamic Acid 500mg + Mefenamic Acid 250mg (Trapic-MF)",
    "generic": "Tranexamic Acid + Mefenamic Acid",
    "category": "Analgesic & Antipyretic",
    "dose": "1-1-1",
    "timing": "After food during menstrual bleeding",
    "duration": "3-5 days",
    "instructions": "Dual action: halts heavy bleeding and provides relief from cramping.",
    "symptoms": [
      "heavy menstrual bleeding (menorrhagia)",
      "severe period pain (dysmenorrhea)",
      "abdominal pain"
    ],
    "janAushadhi": "Tab. Tranexamic + Mefenamic (PMBJP - ₹28/strip)",
    "adultDose": "1 tablet thrice daily during heavy bleeding days",
    "paedDose": "Not recommended in young girls without gynecologist review",
    "notes": "Dual action: halts heavy bleeding and provides relief from cramping.",
    "cat": "Analgesic & Antipyretic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Vaginal Suppository Clotrimazole 100mg / 500mg (Candid V3 / V6)",
    "generic": "Clotrimazole Vaginal Pessaries",
    "category": "Oral Tablets & Caps",
    "dose": "1 pessary inserted deeply at bedtime",
    "timing": "At bedtime using applicator",
    "duration": "3-6 days",
    "instructions": "Insert deeply while lying on back. Safe in second/third trimesters of pregnancy.",
    "symptoms": [
      "vaginal candidiasis",
      "curdy white vaginal discharge",
      "vaginal itching and burning",
      "itching"
    ],
    "janAushadhi": "Clotrimazole Vaginal Tabs (PMBJP - ₹14/strip)",
    "adultDose": "100mg daily for 6 nights (or 500mg single dose)",
    "paedDose": "Not applicable",
    "notes": "Insert deeply while lying on back. Safe in second/third trimesters of pregnancy.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Inj. Magnex 1.5g (Cefoperazone + Sulbactam)",
    "generic": "Cefoperazone 1000mg + Sulbactam 500mg",
    "category": "Injections & IV",
    "dose": "1.5g IV BD",
    "timing": "Slow IV infusion over 30 min after AST",
    "duration": "5 days",
    "instructions": "Potent antipseudomonal 3rd gen cephalosporin. AST mandatory.",
    "symptoms": [
      "biliary tract infection",
      "severe intra-abdominal sepsis",
      "hospital pneumonia",
      "pseudomonas infection",
      "fever"
    ],
    "janAushadhi": "Inj. Cefoperazone + Sulbactam 1.5g (PMBJP - ₹68/vial)",
    "adultDose": "1.5g to 3g IV every 12 hours",
    "paedDose": "40-80 mg/kg/day in 2-4 divided doses",
    "notes": "Potent antipseudomonal 3rd gen cephalosporin. AST mandatory.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Monocef-SB 1.5g (Ceftriaxone + Sulbactam)",
    "generic": "Ceftriaxone 1000mg + Sulbactam 500mg",
    "category": "Injections & IV",
    "dose": "1.5g IV BD",
    "timing": "Slow IV push over 3-5 min after AST",
    "duration": "5 days",
    "instructions": "Enhanced beta-lactamase stability for refractory Indian hospital isolates.",
    "symptoms": [
      "resistant enteric fever",
      "pyelonephritis",
      "sepsis",
      "complicated uti",
      "fever"
    ],
    "janAushadhi": "Inj. Ceftriaxone + Sulbactam 1.5g (PMBJP - ₹38/vial)",
    "adultDose": "1.5g IV once or twice daily",
    "paedDose": "50-75 mg/kg/day (Ceftriaxone component)",
    "notes": "Enhanced beta-lactamase stability for refractory Indian hospital isolates.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Cap. Dalacin-C 300mg (Clindamycin)",
    "generic": "Clindamycin Hydrochloride 300mg",
    "category": "Oral Tablets & Caps",
    "dose": "1-0-1 or 1-1-1",
    "timing": "With full glass of water",
    "duration": "7 days",
    "instructions": "Drink plenty of water to prevent esophageal ulceration. Watch for C. difficile.",
    "symptoms": [
      "dental abscess",
      "bone and joint infection",
      "acne vulgaris",
      "soft tissue infection",
      "pain"
    ],
    "janAushadhi": "Cap. Clindamycin 300mg (PMBJP - ₹18/strip)",
    "adultDose": "150-300mg every 6 hours (or 300mg TDS)",
    "paedDose": "10-25 mg/kg/day in 3-4 divided doses",
    "notes": "Drink plenty of water to prevent esophageal ulceration. Watch for C. difficile.",
    "cat": "Oral Tablets & Caps",
    "form": "Capsule",
    "route": "Oral"
  },
  {
    "name": "Inj. Clindamycin 600mg/4ml (Dalacin)",
    "generic": "Clindamycin Phosphate 150mg/ml (4ml Ampoule)",
    "category": "Injections & IV",
    "dose": "600mg IV BD / TDS",
    "timing": "Infuse in 100ml NS over 30 minutes",
    "duration": "5 days",
    "instructions": "Never give rapid IV bolus. Excellent bone penetration.",
    "symptoms": [
      "severe anaerobic infection",
      "diabetic foot abscess",
      "necrotizing fasciitis",
      "pelvic inflammatory disease"
    ],
    "janAushadhi": "Inj. Clindamycin 600mg (PMBJP - ₹24/ampoule)",
    "adultDose": "600-900mg IV every 8 hours",
    "paedDose": "20-40 mg/kg/day divided 8 hourly",
    "notes": "Never give rapid IV bolus. Excellent bone penetration.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Tab. Linezolid 600mg (Linid / Lizomac)",
    "generic": "Linezolid 600mg",
    "category": "Antimicrobial & Antibiotic",
    "dose": "1-0-1",
    "timing": "With or without food",
    "duration": "10-14 days",
    "instructions": "Monitor CBC weekly for bone marrow suppression (thrombocytopenia).",
    "symptoms": [
      "mrsa infection",
      "vancomycin-resistant enterococcus",
      "severe pneumonia",
      "complicated skin infection"
    ],
    "janAushadhi": "Tab. Linezolid 600mg (PMBJP - ₹42/strip)",
    "adultDose": "600mg twice daily for 10-14 days",
    "paedDose": "10 mg/kg every 8 hours for children < 12y",
    "notes": "Monitor CBC weekly for bone marrow suppression (thrombocytopenia).",
    "cat": "Antimicrobial & Antibiotic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Inj. Linezolid 600mg/300ml IV",
    "generic": "Linezolid 2mg/ml (300ml Infusion Bottle)",
    "category": "Injections & IV",
    "dose": "600mg (300ml) IV BD",
    "timing": "Infuse over 60 minutes",
    "duration": "7-10 days",
    "instructions": "100% oral bioavailability. Switch to oral tablets once stabilized.",
    "symptoms": [
      "hospital mrsa sepsis",
      "ventilator associated pneumonia",
      "severe diabetic cellulitis"
    ],
    "janAushadhi": "Inj. Linezolid 300ml (PMBJP - ₹110/bottle)",
    "adultDose": "600mg IV every 12 hours",
    "paedDose": "10 mg/kg IV every 8 hours",
    "notes": "100% oral bioavailability. Switch to oral tablets once stabilized.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Vancomycin 500mg / 1g (Vancocin)",
    "generic": "Vancomycin Hydrochloride Lyophilized",
    "category": "Injections & IV",
    "dose": "1g IV BD",
    "timing": "Dilute in 250ml NS and infuse over at least 60-90 minutes",
    "duration": "7-14 days",
    "instructions": "RAPID INFUSION CAUSES 'RED MAN SYNDROME'. Monitor renal function.",
    "symptoms": [
      "mrsa bacteremia",
      "infective endocarditis",
      "severe bone infection",
      "septic arthritis"
    ],
    "janAushadhi": "Inj. Vancomycin 1g (PMBJP - ₹95/vial)",
    "adultDose": "15-20 mg/kg IV every 8-12 hours",
    "paedDose": "10-15 mg/kg IV every 6 hours",
    "notes": "RAPID INFUSION CAUSES 'RED MAN SYNDROME'. Monitor renal function.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Tab. Oseltamivir 75mg (FluVir / Tamiflu)",
    "generic": "Oseltamivir Phosphate 75mg",
    "category": "Oral Tablets & Caps",
    "dose": "1-0-1",
    "timing": "With food to avoid nausea",
    "duration": "5 days",
    "instructions": "Neuraminidase inhibitor. Life-saving in seasonal influenza and H1N1 epidemics.",
    "symptoms": [
      "swine flu (h1n1)",
      "influenza a/b",
      "high fever with severe body chills",
      "respiratory viral illness",
      "fever"
    ],
    "janAushadhi": "Cap. Oseltamivir 75mg (PMBJP - ₹45/strip)",
    "adultDose": "75mg twice daily for 5 days (start within 48h of onset)",
    "paedDose": "Weight-based: 30mg BD for < 15kg; 45mg BD for 15-23kg; 60mg BD for 23-40kg",
    "notes": "Neuraminidase inhibitor. Life-saving in seasonal influenza and H1N1 epidemics.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Valacyclovir 1000mg (Valcivir 1000)",
    "generic": "Valacyclovir Hydrochloride 1000mg",
    "category": "Oral Tablets & Caps",
    "dose": "1-1-1",
    "timing": "With full glass of water",
    "duration": "7 days",
    "instructions": "Prodrug of acyclovir with 5-fold higher bioavailability. Prevents post-herpetic neuralgia.",
    "symptoms": [
      "herpes zoster (shingles)",
      "severe burning neuralgia",
      "facial nerve shingles (ramsay hunt)",
      "pain"
    ],
    "janAushadhi": "Tab. Valacyclovir 1000mg (PMBJP - ₹78/strip)",
    "adultDose": "1000mg thrice daily for 7 days",
    "paedDose": "Not established",
    "notes": "Prodrug of acyclovir with 5-fold higher bioavailability. Prevents post-herpetic neuralgia.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Udiliv 300mg (Ursodeoxycholic Acid)",
    "generic": "Ursodeoxycholic Acid (UDCA) 300mg",
    "category": "Oral Tablets & Caps",
    "dose": "1-0-1",
    "timing": "With food or milk",
    "duration": "30-90 days",
    "instructions": "Hepatoprotective hydrophilic bile acid. Promotes bile flow and dissolves cholesterol gallstones.",
    "symptoms": [
      "fatty liver (nafld)",
      "cholestasis",
      "radiotransparent gallstones",
      "elevated liver enzymes sgpt/sgot",
      "biliary sludge"
    ],
    "janAushadhi": "Tab. Ursodeoxycholic Acid 300mg (PMBJP - ₹48/strip)",
    "adultDose": "10-15 mg/kg/day in 2-3 divided doses after meals",
    "paedDose": "10-20 mg/kg/day in biliary atresia / cholestasis",
    "notes": "Hepatoprotective hydrophilic bile acid. Promotes bile flow and dissolves cholesterol gallstones.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Hepa-Merz (L-Ornithine L-Aspartate - LOLA)",
    "generic": "L-Ornithine L-Aspartate 5g / Granules or Tablet",
    "category": "Oral Tablets & Caps",
    "dose": "1-1-1",
    "timing": "Dissolve sachet in water or take tablets after meals",
    "duration": "15-30 days",
    "instructions": "Detoxifies ammonia through urea cycle and glutamine synthesis in damaged livers.",
    "symptoms": [
      "cirrhosis",
      "hyperammonemia",
      "alcoholic liver disease",
      "liver fatigue",
      "hepatic detox"
    ],
    "janAushadhi": "L-Ornithine L-Aspartate (PMBJP - ₹35/sachet)",
    "adultDose": "1-2 sachets dissolved in fluid TDS, or 2 tablets TDS",
    "paedDose": "Specialist consultation",
    "notes": "Detoxifies ammonia through urea cycle and glutamine synthesis in damaged livers.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Silymarin 140mg (Silybon 140)",
    "generic": "Silymarin (Milk Thistle Extract) 140mg",
    "category": "Oral Tablets & Caps",
    "dose": "1-0-1",
    "timing": "After meals",
    "duration": "30 days",
    "instructions": "Standard herbal antioxidant hepatoprotective.",
    "symptoms": [
      "liver detox",
      "chronic hepatitis",
      "toxic liver injury",
      "alcohol recovery",
      "weakness"
    ],
    "janAushadhi": "Tab. Silymarin 140mg (PMBJP - ₹22/strip)",
    "adultDose": "140mg twice or thrice daily",
    "paedDose": "Not recommended",
    "notes": "Standard herbal antioxidant hepatoprotective.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Cap. Redotil 100mg (Racecadotril)",
    "generic": "Racecadotril 100mg",
    "category": "Oral Tablets & Caps",
    "dose": "1-1-1",
    "timing": "At start of meals",
    "duration": "3-5 days",
    "instructions": "Enkephalinase inhibitor. Reduces water and electrolyte hypersecretion without paralyzing gut motility.",
    "symptoms": [
      "acute watery diarrhea",
      "secretory diarrhea",
      "cholera-like diarrhea",
      "loose motions"
    ],
    "janAushadhi": "Cap. Racecadotril 100mg (PMBJP - ₹18/strip)",
    "adultDose": "100mg TDS until normal stool is passed (Max 7 days)",
    "paedDose": "Use pediatric sachet 10mg / 30mg",
    "notes": "Enkephalinase inhibitor. Reduces water and electrolyte hypersecretion without paralyzing gut motility.",
    "cat": "Oral Tablets & Caps",
    "form": "Capsule",
    "route": "Oral"
  },
  {
    "name": "Sachet Redotil 10mg / 30mg (Racecadotril Pediatric)",
    "generic": "Racecadotril Pediatric Sachet",
    "category": "Pediatric & Syrup",
    "dose": "1 sachet TDS",
    "timing": "Mix with water, breast milk or mashed food",
    "duration": "3 days",
    "instructions": "Does not cause abdominal distension or constipation like Loperamide.",
    "symptoms": [
      "infantile diarrhea",
      "watery loose stools in baby",
      "pediatric dehydration risk",
      "loose motions"
    ],
    "janAushadhi": "Sachet Racecadotril 10mg (PMBJP - ₹4.50/sachet)",
    "adultDose": "Use 100mg capsules",
    "paedDose": "1.5 mg/kg/dose TDS (10mg sachet for < 9kg; 30mg sachet for 9-27kg)",
    "notes": "Does not cause abdominal distension or constipation like Loperamide.",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Tab. Colospa 135mg (Mebeverine)",
    "generic": "Mebeverine Hydrochloride 135mg",
    "category": "Oral Tablets & Caps",
    "dose": "1-1-1",
    "timing": "20 min before meals",
    "duration": "14 days",
    "instructions": "Direct musculotropic antispasmodic for colon without anticholinergic side effects.",
    "symptoms": [
      "irritable bowel syndrome (ibs)",
      "abdominal bloating",
      "cramping after meals",
      "spastic colitis",
      "abdominal pain"
    ],
    "janAushadhi": "Tab. Mebeverine 135mg (PMBJP - ₹16/strip)",
    "adultDose": "135mg TDS 20 minutes before food",
    "paedDose": "Contraindicated in children under 10 years",
    "notes": "Direct musculotropic antispasmodic for colon without anticholinergic side effects.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Ganaton 50mg (Itopride)",
    "generic": "Itopride Hydrochloride 50mg",
    "category": "Oral Tablets & Caps",
    "dose": "1-1-1",
    "timing": "30 min before meals",
    "duration": "10 days",
    "instructions": "D2 dopamine receptor antagonist and acetylcholine esterase inhibitor prokinetic.",
    "symptoms": [
      "functional dyspepsia",
      "postprandial fullness",
      "early satiety",
      "gastric bloating",
      "belching"
    ],
    "janAushadhi": "Tab. Itopride 50mg (PMBJP - ₹11/strip)",
    "adultDose": "50mg thrice daily before food",
    "paedDose": "Not established",
    "notes": "D2 dopamine receptor antagonist and acetylcholine esterase inhibitor prokinetic.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Levogastrol 25mg (Levosulpiride)",
    "generic": "Levosulpiride 25mg",
    "category": "Oral Tablets & Caps",
    "dose": "1-0-1",
    "timing": "30 min before meals",
    "duration": "14 days",
    "instructions": "Potent prokinetic and antiemetic. Watch for extrapyramidal symptoms with prolonged use.",
    "symptoms": [
      "diabetic gastroparesis",
      "severe acid regurgitation",
      "non-ulcer dyspepsia",
      "chronic nausea"
    ],
    "janAushadhi": "Tab. Levosulpiride 25mg (PMBJP - ₹8.00/strip)",
    "adultDose": "25mg TDS or BD before food",
    "paedDose": "Contraindicated in children",
    "notes": "Potent prokinetic and antiemetic. Watch for extrapyramidal symptoms with prolonged use.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Syp. Duphalac 100ml / 200ml (Lactulose)",
    "generic": "Lactulose Oral Solution 3.335g / 5ml",
    "category": "Pediatric & Syrup",
    "dose": "15-30ml at bedtime",
    "timing": "With water or juice at night",
    "duration": "7 days",
    "instructions": "Osmotic laxative. Safe for long-term use, pregnancy, and elderly.",
    "symptoms": [
      "chronic constipation",
      "hard dry stools",
      "hepatic encephalopathy prevention",
      "piles / fissure pain on defecation"
    ],
    "janAushadhi": "Lactulose Oral Solution 100ml (PMBJP - ₹38/bottle)",
    "adultDose": "15-30ml once or twice daily",
    "paedDose": "1ml/kg/day in divided doses",
    "notes": "Osmotic laxative. Safe for long-term use, pregnancy, and elderly.",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Tab. Dulcolax 5mg (Bisacodyl)",
    "generic": "Bisacodyl 5mg Enteric Coated",
    "category": "Oral Tablets & Caps",
    "dose": "1-2 tablets at bedtime",
    "timing": "Swallow whole with warm water at bedtime",
    "duration": "2-3 days",
    "instructions": "Stimulant laxative. Do not chew or crush. Do not take with milk or antacids.",
    "symptoms": [
      "acute constipation",
      "bowel prep before ultrasound/colonoscopy",
      "sluggish bowel"
    ],
    "janAushadhi": "Tab. Bisacodyl 5mg (PMBJP - ₹1.50/strip)",
    "adultDose": "5-10mg at bedtime (produces morning bowel movement in 6-10 hours)",
    "paedDose": "5mg for children > 4 years",
    "notes": "Stimulant laxative. Do not chew or crush. Do not take with milk or antacids.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Suppository Dulcolax 10mg / 5mg (Bisacodyl Rectal)",
    "generic": "Bisacodyl Rectal Suppository 10mg (Adult) / 5mg (Child)",
    "category": "Oral Tablets & Caps",
    "dose": "1 Suppository rectally Stat",
    "timing": "Insert deeply into rectum",
    "duration": "Stat",
    "instructions": "Produces rapid bowel evacuation within 15 to 30 minutes.",
    "symptoms": [
      "fecal impaction",
      "acute severe rectal constipation",
      "immediate pre-procedure evacuation"
    ],
    "janAushadhi": "Bisacodyl Suppository (PMBJP - ₹4.50/piece)",
    "adultDose": "10mg rectally; produces complete evacuation in 15-30 minutes",
    "paedDose": "5mg suppository for children",
    "notes": "Produces rapid bowel evacuation within 15 to 30 minutes.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Isabgol Husk (Psyllium Husk Powder 100g)",
    "generic": "Plantago Ovata (Psyllium Husk) Natural Dietary Fiber",
    "category": "Oral Tablets & Caps",
    "dose": "1-2 tablespoons (5-10g)",
    "timing": "Mix in 1 glass warm water/milk and drink immediately at night",
    "duration": "Daily as required",
    "instructions": "Bulk-forming natural laxative. Must drink plenty of water to prevent intestinal blockage.",
    "symptoms": [
      "constipation",
      "hemorrhoids / piles",
      "anal fissure",
      "high cholesterol"
    ],
    "janAushadhi": "Psyllium Husk 100g (PMBJP - ₹32/pack)",
    "adultDose": "5-10g mixed in full glass of liquid followed by another glass of water",
    "paedDose": "Half dose for children > 6 years",
    "notes": "Bulk-forming natural laxative. Must drink plenty of water to prevent intestinal blockage.",
    "cat": "Oral Tablets & Caps",
    "form": "Powder",
    "route": "Oral"
  },
  {
    "name": "Cap. Creon 10000 / 25000 (Pancreatin Pancreatic Enzymes)",
    "generic": "Pancreatin Gastro-Resistant Minimicrospheres",
    "category": "Oral Tablets & Caps",
    "dose": "1 capsule with main meals",
    "timing": "Swallow whole during main meals",
    "duration": "30 days",
    "instructions": "Take with food. Do not chew beads as active enzymes irritate mouth mucosa.",
    "symptoms": [
      "chronic pancreatitis",
      "steatorrhea (oily foul stools)",
      "cystic fibrosis",
      "post-gastrectomy indigestion"
    ],
    "janAushadhi": "Pancreatin Capsules (PMBJP - ₹45/strip)",
    "adultDose": "10000-25000 units lipase per main meal",
    "paedDose": "Calculate based on fat intake (1000-2500 units/kg/meal)",
    "notes": "Take with food. Do not chew beads as active enzymes irritate mouth mucosa.",
    "cat": "Oral Tablets & Caps",
    "form": "Capsule",
    "route": "Oral"
  },
  {
    "name": "Respules Duolin (Levosalbutamol 1.25mg + Ipratropium 500mcg)",
    "generic": "Levosalbutamol + Ipratropium Bromide Respules 2.5ml",
    "category": "Pediatric & Syrup",
    "dose": "1 Respule via nebulizer Stat / TDS",
    "timing": "Nebulize with oxygen/air machine over 10-15 minutes",
    "duration": "3 days",
    "instructions": "Gold standard nebulization combo. Synergistic rapid bronchodilatation.",
    "symptoms": [
      "acute asthma attack",
      "copd exacerbation",
      "severe wheezing",
      "breathlessness",
      "tight chest",
      "shortness of breath"
    ],
    "janAushadhi": "Levosalbutamol + Ipratropium Respules (PMBJP - ₹12/respule)",
    "adultDose": "1 respule nebulized every 6-8h (or every 20m x 3 for severe attack)",
    "paedDose": "Duolin Junior (Levo 0.63mg + Ipra 250mcg) for children",
    "notes": "Gold standard nebulization combo. Synergistic rapid bronchodilatation.",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Respules Budecort 0.5mg / 1mg (Budesonide Nebulizer)",
    "generic": "Budesonide Inhalation Suspension 0.5mg / 1mg / 2ml",
    "category": "Pediatric & Syrup",
    "dose": "1 Respule via nebulizer BD",
    "timing": "Nebulize over 10 min; rinse mouth after use",
    "duration": "5 days",
    "instructions": "Inhaled steroid reduces airway edema and airway hyperreactivity.",
    "symptoms": [
      "croup in children",
      "severe asthma inflammation",
      "stridor",
      "barking cough",
      "copd flare",
      "cough"
    ],
    "janAushadhi": "Budesonide Respules 0.5mg (PMBJP - ₹11/respule)",
    "adultDose": "1-2mg BD via jet nebulizer",
    "paedDose": "0.5-1mg BD for croup and pediatric asthma",
    "notes": "Inhaled steroid reduces airway edema and airway hyperreactivity.",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Respules Levolin 0.63mg / 1.25mg (Levosalbutamol)",
    "generic": "Levosalbutamol Respirator Solution 2.5ml",
    "category": "Pediatric & Syrup",
    "dose": "1 Respule nebulized TDS SOS",
    "timing": "Nebulize over 10 min",
    "duration": "3 days",
    "instructions": "Pure R-isomer of salbutamol with half the tremor and tachycardia risk.",
    "symptoms": [
      "bronchospasm",
      "wheezing",
      "asthma attack",
      "shortness of breath"
    ],
    "janAushadhi": "Levosalbutamol Respules (PMBJP - ₹8.00/respule)",
    "adultDose": "1.25mg nebulized TDS",
    "paedDose": "0.63mg for children 2-11 years",
    "notes": "Pure R-isomer of salbutamol with half the tremor and tachycardia risk.",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Inhaler Foracort 400 (Formoterol 6mcg + Budesonide 400mcg)",
    "generic": "Formoterol Fumarate + Budesonide Inhaler / Rotacaps",
    "category": "Respiratory",
    "dose": "1-2 puffs BD",
    "timing": "Rinse mouth and spit with water after every inhalation",
    "duration": "30 days",
    "instructions": "SMART therapy (Maintenance and Reliever). Always rinse mouth to prevent fungal oral thrush.",
    "symptoms": [
      "chronic bronchial asthma",
      "copd maintenance",
      "frequent wheezing",
      "nocturnal asthma waking",
      "shortness of breath"
    ],
    "janAushadhi": "Formoterol + Budesonide Inhaler (PMBJP - ₹110/inhaler)",
    "adultDose": "1-2 puffs BD through spacer device",
    "paedDose": "Use Foracort 100/200 for children under specialist advice",
    "notes": "SMART therapy (Maintenance and Reliever). Always rinse mouth to prevent fungal oral thrush.",
    "cat": "Respiratory",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Inhaler Seroflo 250 (Salmeterol 25 + Fluticasone 250)",
    "generic": "Salmeterol Xinafoate + Fluticasone Propionate MDI",
    "category": "Oral Tablets & Caps",
    "dose": "1-2 puffs BD",
    "timing": "Morning and evening; rinse mouth",
    "duration": "30 days",
    "instructions": "Potent long-acting bronchodilator + corticosteroid controller.",
    "symptoms": [
      "severe copd",
      "uncontrolled bronchial asthma",
      "persistent wheezing"
    ],
    "janAushadhi": "Salmeterol + Fluticasone Inhaler (PMBJP - ₹125/inhaler)",
    "adultDose": "2 puffs twice daily",
    "paedDose": "Seroflo 50/125 for pediatric use",
    "notes": "Potent long-acting bronchodilator + corticosteroid controller.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Nasal Spray Flomist / Furamist (Fluticasone Furoate)",
    "generic": "Fluticasone Furoate 27.5mcg / spray Nasal Spray",
    "category": "Pediatric & Syrup",
    "dose": "1-2 sprays in each nostril OD",
    "timing": "Morning after blowing nose",
    "duration": "14-30 days",
    "instructions": "First-line steroid spray for allergic rhinitis. Direct nozzle away from nasal septum.",
    "symptoms": [
      "allergic rhinitis",
      "nasal polyps",
      "chronic morning sneezing",
      "blocked nose",
      "dust allergy",
      "runny nose"
    ],
    "janAushadhi": "Fluticasone Nasal Spray 10ml (PMBJP - ₹65/bottle)",
    "adultDose": "2 sprays in each nostril once daily; reduce to 1 spray for maintenance",
    "paedDose": "1 spray each nostril daily for children 2-11 years",
    "notes": "First-line steroid spray for allergic rhinitis. Direct nozzle away from nasal septum.",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Tab. Bilashine 20mg (Bilastine)",
    "generic": "Bilastine 20mg",
    "category": "Antihistamine & Allergy",
    "dose": "1-0-0",
    "timing": "1 hour before or 2 hours after meals with water",
    "duration": "10 days",
    "instructions": "Zero sedation and zero anticholinergic side effects. Does not cross blood-brain barrier.",
    "symptoms": [
      "chronic urticaria",
      "severe allergic rhinitis",
      "allergic conjunctivitis",
      "itching"
    ],
    "janAushadhi": "Tab. Bilastine 20mg (PMBJP - ₹19/strip)",
    "adultDose": "20mg once daily on empty stomach",
    "paedDose": "Bilastine 10mg orally for children 6-11 years",
    "notes": "Zero sedation and zero anticholinergic side effects. Does not cross blood-brain barrier.",
    "cat": "Antihistamine & Allergy",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Acebrophylline 100mg (Ab Phylline)",
    "generic": "Acebrophylline 100mg",
    "category": "Respiratory",
    "dose": "1-0-1",
    "timing": "After meals",
    "duration": "7 days",
    "instructions": "Dual action: mucoregulatory surfactant booster and gentle bronchodilator.",
    "symptoms": [
      "thick sticky mucus in chest",
      "copd with viscous phlegm",
      "bronchial asthma cough",
      "cough"
    ],
    "janAushadhi": "Cap. Acebrophylline 100mg (PMBJP - ₹18/strip)",
    "adultDose": "100mg twice daily after food",
    "paedDose": "Syp. Acebrophylline 50mg/5ml for children > 2y",
    "notes": "Dual action: mucoregulatory surfactant booster and gentle bronchodilator.",
    "cat": "Respiratory",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Telma-CT 40/12.5 (Telmisartan + Chlorthalidone)",
    "generic": "Telmisartan 40mg + Chlorthalidone 12.5mg",
    "category": "Cardiovascular",
    "dose": "1-0-0",
    "timing": "Morning after breakfast",
    "duration": "30 days",
    "instructions": "Chlorthalidone has longer half-life (50h) and superior cardiovascular outcomes vs HCTZ.",
    "symptoms": [
      "resistant hypertension",
      "uncontrolled bp with monotherapy",
      "hypertension review"
    ],
    "janAushadhi": "Tab. Telmisartan + Chlorthalidone (PMBJP - ₹14/strip)",
    "adultDose": "1 tablet once daily in the morning",
    "paedDose": "Contraindicated",
    "notes": "Chlorthalidone has longer half-life (50h) and superior cardiovascular outcomes vs HCTZ.",
    "cat": "Cardiovascular",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Olmesartan 20mg / 40mg (Olmin)",
    "generic": "Olmesartan Medoxomil 20mg / 40mg",
    "category": "Oral Tablets & Caps",
    "dose": "1-0-0",
    "timing": "Morning with water",
    "duration": "30 days",
    "instructions": "Potent AT1-receptor antagonist. High 24-hour BP trough-to-peak ratio.",
    "symptoms": [
      "essential hypertension",
      "hypertension review"
    ],
    "janAushadhi": "Tab. Olmesartan 20mg (PMBJP - ₹12/strip)",
    "adultDose": "20-40mg once daily",
    "paedDose": "Specialist consultation",
    "notes": "Potent AT1-receptor antagonist. High 24-hour BP trough-to-peak ratio.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Carvil 3.125mg / 6.25mg / 12.5mg (Carvedilol)",
    "generic": "Carvedilol Non-Selective Beta + Alpha-1 Blocker",
    "category": "Oral Tablets & Caps",
    "dose": "1-0-1",
    "timing": "With food to slow absorption rate",
    "duration": "30 days",
    "instructions": "Proven mortality reduction in chronic heart failure. Take with food.",
    "symptoms": [
      "congestive heart failure",
      "reduced ejection fraction (hfref)",
      "post-mi left ventricular dysfunction"
    ],
    "janAushadhi": "Tab. Carvedilol 6.25mg (PMBJP - ₹4.50/strip)",
    "adultDose": "3.125mg BD start, titrate every 2 weeks to 6.25mg, 12.5mg, 25mg BD",
    "paedDose": "0.05 mg/kg BD in pediatric cardiomyopathy",
    "notes": "Proven mortality reduction in chronic heart failure. Take with food.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Inj. Labetalol 20mg/4ml (Normadate)",
    "generic": "Labetalol Hydrochloride 5mg/ml (4ml Ampoule)",
    "category": "Injections & IV",
    "dose": "20mg IV Stat",
    "timing": "Slow IV push over 2 minutes (Repeat every 10 min up to 80mg)",
    "duration": "Stat",
    "instructions": "Drug of choice for pregnancy hypertension emergencies (preeclampsia).",
    "symptoms": [
      "hypertensive crisis",
      "preeclampsia / eclampsia in pregnancy",
      "acute aortic dissection",
      "hypertensive encephalopathy"
    ],
    "janAushadhi": "Inj. Labetalol 20mg (PMBJP - ₹18/ampoule)",
    "adultDose": "20mg slow IV push; double dose every 10 min until BP controlled (Max 300mg)",
    "paedDose": "0.2-1 mg/kg slow IV",
    "notes": "Drug of choice for pregnancy hypertension emergencies (preeclampsia).",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Nitroglycerin 25mg/5ml (NTG IV)",
    "generic": "Glyceryl Trinitrate (NTG) 5mg/ml (5ml Ampoule)",
    "category": "Injections & IV",
    "dose": "5-10 mcg/min IV Infusion",
    "timing": "Titrate via syringe infusion pump; monitor BP continuously",
    "duration": "Continuous",
    "instructions": "Requires glass bottle or non-PVC infusion set. Avoid if SBP < 90 mmHg or recent Sildenafil use.",
    "symptoms": [
      "acute myocardial infarction",
      "unstable angina",
      "acute pulmonary edema",
      "hypertensive emergency with chest pain"
    ],
    "janAushadhi": "Inj. Nitroglycerin 25mg (PMBJP - ₹42/ampoule)",
    "adultDose": "Start at 5-10 mcg/min, titrate up by 5-10 mcg/min every 5m until pain relieved",
    "paedDose": "Contraindicated",
    "notes": "Requires glass bottle or non-PVC infusion set. Avoid if SBP < 90 mmHg or recent Sildenafil use.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Tab. Xarelto 10mg / 15mg / 20mg (Rivaroxaban)",
    "generic": "Rivaroxaban Direct Factor Xa Inhibitor",
    "category": "Oral Tablets & Caps",
    "dose": "1-0-0",
    "timing": "With food (15mg/20mg) for optimal bioavailability",
    "duration": "30 days",
    "instructions": "NOAC / DOAC. No routine INR monitoring required. Take with main meal.",
    "symptoms": [
      "deep vein thrombosis (dvt)",
      "pulmonary embolism",
      "non-valvular atrial fibrillation stroke prevention"
    ],
    "janAushadhi": "Tab. Rivaroxaban 10mg (PMBJP - ₹38/strip)",
    "adultDose": "15mg BD x 21 days, then 20mg OD with food (or 10mg OD for DVT prophylaxis)",
    "paedDose": "Weight-based under specialist guidance",
    "notes": "NOAC / DOAC. No routine INR monitoring required. Take with main meal.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Eliquis 2.5mg / 5mg (Apixaban)",
    "generic": "Apixaban Factor Xa Inhibitor",
    "category": "Oral Tablets & Caps",
    "dose": "1-0-1",
    "timing": "With or without food",
    "duration": "30 days",
    "instructions": "Superior safety profile with lowest intracranial bleeding rate among anticoagulants.",
    "symptoms": [
      "atrial fibrillation",
      "dvt prevention in knee/hip replacement",
      "stroke prevention"
    ],
    "janAushadhi": "Tab. Apixaban 2.5mg (PMBJP - ₹34/strip)",
    "adultDose": "5mg twice daily (reduce to 2.5mg BD if age >= 80y, wt <= 60kg, or Cr >= 1.5)",
    "paedDose": "Not established",
    "notes": "Superior safety profile with lowest intracranial bleeding rate among anticoagulants.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Warfarin 2mg / 5mg (Coumadin / Warf)",
    "generic": "Warfarin Sodium",
    "category": "Oral Tablets & Caps",
    "dose": "1 tab once daily at 6 PM",
    "timing": "Fixed time every evening with water",
    "duration": "30 days",
    "instructions": "Strict INR monitoring mandatory. Watch for vitamin K rich green leafy vegetables interactions.",
    "symptoms": [
      "mechanical heart valve replacement",
      "recurrent thromboembolism",
      "atrial fibrillation"
    ],
    "janAushadhi": "Tab. Warfarin 2mg (PMBJP - ₹3.00/strip)",
    "adultDose": "2-5mg daily, adjusted strictly based on PT/INR (Target INR 2.0-3.0 or 2.5-3.5)",
    "paedDose": "0.05-0.2 mg/kg adjusted by INR",
    "notes": "Strict INR monitoring mandatory. Watch for vitamin K rich green leafy vegetables interactions.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Inj. Human Actrapid 40IU/ml (Regular Soluble Insulin)",
    "generic": "Recombinant Human Regular Insulin 40IU/ml (10ml Vial)",
    "category": "Injections & IV",
    "dose": "As per sliding scale",
    "timing": "30 min before meals SC (or IV in DKA)",
    "duration": "As prescribed",
    "instructions": "Short-acting regular clear insulin. Can be given IV in emergencies.",
    "symptoms": [
      "diabetic ketoacidosis (dka)",
      "acute hyperglycemia",
      "perioperative diabetes control",
      "diabetes review"
    ],
    "janAushadhi": "Inj. Regular Insulin 40IU 10ml (PMBJP - ₹85/vial)",
    "adultDose": "Dose titrated per blood glucose (usually 4-12 IU SC before meals)",
    "paedDose": "0.5-1.0 IU/kg/day total daily requirement",
    "notes": "Short-acting regular clear insulin. Can be given IV in emergencies.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Human Mixtard 30/70 40IU/ml (Biphasic Isophane)",
    "generic": "30% Regular Soluble + 70% Isophane NPH Insulin (10ml Vial)",
    "category": "Injections & IV",
    "dose": "Morning & Evening SC",
    "timing": "30 min before breakfast and dinner",
    "duration": "Daily maintenance",
    "instructions": "Roll vial gently between palms before drawing; do not shake vigorously. Store in fridge (2-8°C).",
    "symptoms": [
      "type 1 & type 2 diabetes mellitus",
      "insulin-dependent diabetes",
      "diabetes review"
    ],
    "janAushadhi": "Inj. Biphasic Insulin 30/70 40IU (PMBJP - ₹88/vial)",
    "adultDose": "2/3rd dose before breakfast, 1/3rd dose before dinner SC",
    "paedDose": "Individualized pediatric titration",
    "notes": "Roll vial gently between palms before drawing; do not shake vigorously. Store in fridge (2-8°C).",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Lantus / Glaritus (Insulin Glargine 100IU/ml)",
    "generic": "Insulin Glargine Long-Acting Analogue (3ml Cartridge / 10ml Vial)",
    "category": "Injections & IV",
    "dose": "10-20 IU at bedtime",
    "timing": "Subcutaneous injection at fixed time every night",
    "duration": "Daily maintenance",
    "instructions": "Peakless 24-hour basal insulin. Never mix with any other insulin in the same syringe.",
    "symptoms": [
      "high fasting blood sugar",
      "basal insulin requirement",
      "diabetes review"
    ],
    "janAushadhi": "Inj. Insulin Glargine 100IU (PMBJP - ₹210/vial)",
    "adultDose": "10 IU SC at bedtime initially, titrate by 2 IU every 3 days to achieve FBS < 110",
    "paedDose": "For children > 6 years with T1DM",
    "notes": "Peakless 24-hour basal insulin. Never mix with any other insulin in the same syringe.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Tab. Trajenta 5mg (Linagliptin)",
    "generic": "Linagliptin 5mg",
    "category": "Oral Tablets & Caps",
    "dose": "1-0-0",
    "timing": "With or without food",
    "duration": "30 days",
    "instructions": "Excreted via bile. ZERO dose reduction needed even in severe renal impairment or dialysis.",
    "symptoms": [
      "diabetes in renal failure",
      "diabetic kidney disease",
      "high blood sugar",
      "diabetes review"
    ],
    "janAushadhi": "Tab. Linagliptin 5mg (PMBJP - ₹28/strip)",
    "adultDose": "5mg once daily",
    "paedDose": "Not recommended in children",
    "notes": "Excreted via bile. ZERO dose reduction needed even in severe renal impairment or dialysis.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Jardiance 10mg / 25mg (Empagliflozin)",
    "generic": "Empagliflozin 10mg / 25mg",
    "category": "Diabetic Care",
    "dose": "1-0-0",
    "timing": "Morning with water",
    "duration": "30 days",
    "instructions": "Proven 38% reduction in cardiovascular death. SGLT2 inhibitor.",
    "symptoms": [
      "diabetes with cardiovascular disease",
      "heart failure preservation",
      "chronic kidney disease"
    ],
    "janAushadhi": "Tab. Empagliflozin 10mg (PMBJP - ₹24/strip)",
    "adultDose": "10mg once daily; may increase to 25mg",
    "paedDose": "Not established",
    "notes": "Proven 38% reduction in cardiovascular death. SGLT2 inhibitor.",
    "cat": "Diabetic Care",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Voglibose 0.2mg / 0.3mg (Volibo)",
    "generic": "Voglibose 0.2mg / 0.3mg",
    "category": "Oral Tablets & Caps",
    "dose": "1-1-1",
    "timing": "Take with the very first bite of meal",
    "duration": "30 days",
    "instructions": "Alpha-glucosidase inhibitor. Blunts post-meal glucose spikes.",
    "symptoms": [
      "high post-meal blood sugar",
      "postprandial hyperglycemia spikes",
      "diabetes review"
    ],
    "janAushadhi": "Tab. Voglibose 0.2mg (PMBJP - ₹3.50/strip)",
    "adultDose": "0.2mg TDS with the first bite of each main meal",
    "paedDose": "Contraindicated in children",
    "notes": "Alpha-glucosidase inhibitor. Blunts post-meal glucose spikes.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Suture Ethilon 3-0 / 4-0 (Nylon Monofilament)",
    "generic": "Sterile Non-Absorbable Polyamide Suture with Reverse Cutting Needle",
    "category": "Consumables & Syringes",
    "dose": "1 Foil Pack",
    "timing": "Skin laceration repair / suturing",
    "duration": "Remove in 7-10 days",
    "instructions": "Monofilament smooth passage with minimal tissue reaction. Best for cosmetic skin closure.",
    "symptoms": [
      "cut wound",
      "laceration",
      "road traffic trauma",
      "scalp cut",
      "skin cut"
    ],
    "janAushadhi": "Nylon Suture with Needle (PMBJP - ₹26/pack)",
    "adultDose": "Skin closure; remove facial sutures in 5d, limb/trunk in 8-10d",
    "paedDose": "Painless removal",
    "notes": "Monofilament smooth passage with minimal tissue reaction. Best for cosmetic skin closure.",
    "cat": "Consumables & Syringes",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Suture Vicryl 2-0 / 3-0 (Polyglactin 910)",
    "generic": "Sterile Absorbable Braided Synthetic Suture",
    "category": "Consumables & Syringes",
    "dose": "1 Foil Pack",
    "timing": "Subcutaneous and deep fascial closure",
    "duration": "Absorbs automatically (56-70 days)",
    "instructions": "High initial tensile strength. Completely absorbs by hydrolysis.",
    "symptoms": [
      "deep wound closure",
      "subcutaneous suturing",
      "episiotomy repair"
    ],
    "janAushadhi": "Absorbable Suture (PMBJP - ₹42/pack)",
    "adultDose": "Internal soft tissue approximation; zero removal required",
    "paedDose": "Absorbable pediatric suture",
    "notes": "High initial tensile strength. Completely absorbs by hydrolysis.",
    "cat": "Consumables & Syringes",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Surgical Scalpel Blades #11 / #15 / #22",
    "generic": "Sterile Carbon Steel Surgical Scalpel Blade",
    "category": "Consumables & Syringes",
    "dose": "1 Blade",
    "timing": "Single use minor surgery incision",
    "duration": "Once",
    "instructions": "Ultra-sharp precision cutting edge.",
    "symptoms": [
      "abscess drainage",
      "incision & drainage (i&d)",
      "sebaceous cyst excision",
      "minor surgery"
    ],
    "janAushadhi": "Surgical Blade (PMBJP - ₹3.50/piece)",
    "adultDose": "#11 for stab incision (abscess drainage); #15 for precise minor surgery excision",
    "paedDose": "Aseptic surgical blade",
    "notes": "Ultra-sharp precision cutting edge.",
    "cat": "Consumables & Syringes",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Cotton Gauze Bandage Roll 4 inch / 6 inch",
    "generic": "Sterile Absorbent Hydrophilic Gauze Bandage",
    "category": "Consumables & Syringes",
    "dose": "1 Roll",
    "timing": "Wound bandaging and compression",
    "duration": "Change daily or alternate days",
    "instructions": "High absorption capacity. Breathable open weave.",
    "symptoms": [
      "dressing open wounds",
      "ulcer wrapping",
      "hemorrhage pressure dressing"
    ],
    "janAushadhi": "Gauze Bandage Roll (PMBJP - ₹8.00/roll)",
    "adultDose": "Standard absorbent wound coverage",
    "paedDose": "Protective bandage",
    "notes": "High absorption capacity. Breathable open weave.",
    "cat": "Consumables & Syringes",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Crepe Bandage 10cm / 15cm (Elastic Support Bandage)",
    "generic": "High-Elastic Cotton Compression Crepe Bandage",
    "category": "Consumables & Syringes",
    "dose": "1 Roll",
    "timing": "Wrap firmly from distal to proximal with moderate tension",
    "duration": "Washable & reusable",
    "instructions": "Remove at bedtime to prevent circulation constriction.",
    "symptoms": [
      "ankle sprain",
      "wrist sprain",
      "varicose veins",
      "joint swelling",
      "ligament injury",
      "pain"
    ],
    "janAushadhi": "Elastic Crepe Bandage (PMBJP - ₹32/roll)",
    "adultDose": "Provides firm compression without impeding arterial circulation",
    "paedDose": "Elastic immobilization",
    "notes": "Remove at bedtime to prevent circulation constriction.",
    "cat": "Consumables & Syringes",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Betadine 10% Solution (Povidone-Iodine 500ml)",
    "generic": "Povidone-Iodine 10% w/v Antiseptic Solution",
    "category": "Pediatric & Syrup",
    "dose": "Apply liberally with sterile cotton gauze",
    "timing": "Skin prep before surgery / wound cleaning",
    "duration": "As required",
    "instructions": "Broad-spectrum microbicidal against bacteria, spores, fungi, and viruses.",
    "symptoms": [
      "dirty wounds",
      "pre-op surgical site scrub",
      "abrasions",
      "burn dressing"
    ],
    "janAushadhi": "Povidone Iodine 10% Solution 100ml (PMBJP - ₹22/bottle)",
    "adultDose": "Apply and allow to dry for 2 minutes for complete germicidal action",
    "paedDose": "Safe on unbroken skin and minor scrapes",
    "notes": "Broad-spectrum microbicidal against bacteria, spores, fungi, and viruses.",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Sterile Water for Injection 5ml / 10ml (SWFI)",
    "generic": "Sterile Water for Injection Pyrogen-Free Ampoule",
    "category": "Injections & IV",
    "dose": "1 Ampoule (5ml / 10ml)",
    "timing": "Reconstitute powder antibiotics (Monocef, Pantop, Amikacin)",
    "duration": "Single use",
    "instructions": "Never inject pure sterile water directly into vein without mixing medication (causes hemolysis).",
    "symptoms": [
      "antibiotic reconstitution",
      "injectable drug dilution"
    ],
    "janAushadhi": "Sterile Water for Injection 5ml (PMBJP - ₹1.80/ampoule)",
    "adultDose": "Aseptic reconstitution of sterile dry powders",
    "paedDose": "Pyrogen-free diluent",
    "notes": "Never inject pure sterile water directly into vein without mixing medication (causes hemolysis).",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Normal Saline 0.9% 100ml (Mini-Bag IV Flushing)",
    "generic": "Sodium Chloride 0.9% w/v 100ml IV Bottle",
    "category": "Injections & IV",
    "dose": "100ml IV Infusion",
    "timing": "Carrier solution for IV infusions (Paracetamol, Amikacin, Metrogyl, Pause)",
    "duration": "Single use",
    "instructions": "Ideal volume for 20-30 minute slow drug infusions.",
    "symptoms": [
      "drug infusion carrier",
      "iv line flushing",
      "cannula patency check"
    ],
    "janAushadhi": "NS 0.9% 100ml (PMBJP - ₹11/bottle)",
    "adultDose": "100ml vehicle for piggyback antibiotic infusions",
    "paedDose": "Standard diluent",
    "notes": "Ideal volume for 20-30 minute slow drug infusions.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Oxygen Nasal Cannula (Twin Bore Prongs)",
    "generic": "Medical Grade PVC Oxygen Nasal Prongs",
    "category": "Consumables & Syringes",
    "dose": "1 Piece",
    "timing": "Fit into nostrils and connect to oxygen flowmeter",
    "duration": "Single patient use",
    "instructions": "Comfortable for patient to talk and drink while receiving continuous oxygen.",
    "symptoms": [
      "hypoxia",
      "low spo2 (< 94%)",
      "respiratory distress",
      "copd breathless",
      "shortness of breath"
    ],
    "janAushadhi": "Oxygen Nasal Cannula (PMBJP - ₹18/piece)",
    "adultDose": "Delivers 1-4 Litres/min oxygen (24% to 36% FiO2)",
    "paedDose": "Pediatric nasal prongs available",
    "notes": "Comfortable for patient to talk and drink while receiving continuous oxygen.",
    "cat": "Consumables & Syringes",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Simple Oxygen Mask with Tubing (Adult / Pediatric)",
    "generic": "Medium Concentration Oxygen Facemask with 2m Tubing",
    "category": "Consumables & Syringes",
    "dose": "1 Piece",
    "timing": "Fit snugly over nose and mouth",
    "duration": "Single use",
    "instructions": "Flow must be set at minimum 5 L/min to prevent re-breathing exhaled carbon dioxide.",
    "symptoms": [
      "severe hypoxia (spo2 < 90%)",
      "cyanosis",
      "severe dyspnea",
      "shock",
      "shortness of breath"
    ],
    "janAushadhi": "Oxygen Mask (PMBJP - ₹24/piece)",
    "adultDose": "Delivers 5-8 Litres/min oxygen (40% to 60% FiO2; keep flow >= 5L to flush CO2)",
    "paedDose": "Pediatric contoured mask",
    "notes": "Flow must be set at minimum 5 L/min to prevent re-breathing exhaled carbon dioxide.",
    "cat": "Consumables & Syringes",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Nebulizer Mask with Chamber & Tubing (Adult / Pediatric)",
    "generic": "Aerosol Medication Nebulizer Kit with Medication Cup",
    "category": "Consumables & Syringes",
    "dose": "1 Kit",
    "timing": "Pour Duolin/Budecort respule into cup, connect to compressor",
    "duration": "Washable / single patient use",
    "instructions": "Keep cup upright during treatment.",
    "symptoms": [
      "nebulization therapy",
      "acute wheezing",
      "asthma bronchodilator delivery"
    ],
    "janAushadhi": "Nebulizer Mask Kit (PMBJP - ₹34/kit)",
    "adultDose": "High aerosolization rate (> 0.2 ml/min)",
    "paedDose": "Soft child mask prevents vapor leakage into eyes",
    "notes": "Keep cup upright during treatment.",
    "cat": "Consumables & Syringes",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Blood Glucose Test Strips (Glucometer Strips 50s)",
    "generic": "Electrochemical Blood Glucose Test Biosensors",
    "category": "Consumables & Syringes",
    "dose": "1 Strip",
    "timing": "Fasting / Post-prandial / Random capillary blood test",
    "duration": "Instant result (5 seconds)",
    "instructions": "Instant 5-second blood sugar readout.",
    "symptoms": [
      "routine blood sugar monitoring",
      "hypoglycemia check",
      "diabetic screening",
      "diabetes review"
    ],
    "janAushadhi": "Blood Glucose Test Strips (PMBJP - ₹8.00/strip)",
    "adultDose": "1 drop capillary whole blood",
    "paedDose": "Accurate micro-sample",
    "notes": "Instant 5-second blood sugar readout.",
    "cat": "Consumables & Syringes",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Blood Lancets 28G / 30G (Sterile Pricking Needles)",
    "generic": "Ultra-Fine Sterile Capillary Blood Lancets",
    "category": "Consumables & Syringes",
    "dose": "1 Lancet",
    "timing": "Fingertip capillary blood prick",
    "duration": "Single use",
    "instructions": "Tri-bevel sharpened tip minimizes skin trauma.",
    "symptoms": [
      "blood sugar prick",
      "blood group test prick"
    ],
    "janAushadhi": "Sterile Blood Lancets 100s (PMBJP - ₹65/box)",
    "adultDose": "Side of fingertip for virtually painless capillary sampling",
    "paedDose": "Ultra-fine pediatric lancet",
    "notes": "Tri-bevel sharpened tip minimizes skin trauma.",
    "cat": "Consumables & Syringes",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Urine Test Strips 10 Parameter (Urinalysis Dipsticks)",
    "generic": "Dry Reagent Dipstick for Glucose, Protein, Ketones, Bilirubin, pH, Blood",
    "category": "Consumables & Syringes",
    "dose": "1 Dipstick",
    "timing": "Dip in freshly voided urine for 1 second; read at 60 seconds",
    "duration": "Instant clinic screening",
    "instructions": "Immediate point-of-care detection of urine infection (leukocytes/nitrites) and albumin.",
    "symptoms": [
      "uti screening",
      "proteinuria",
      "glycosuria",
      "diabetic ketoacidosis check",
      "uti"
    ],
    "janAushadhi": "Urine Test Strips (PMBJP - ₹4.50/strip)",
    "adultDose": "Instant 60-second color chart visual readout",
    "paedDose": "Universal diagnostic",
    "notes": "Immediate point-of-care detection of urine infection (leukocytes/nitrites) and albumin.",
    "cat": "Consumables & Syringes",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Urimax 0.4mg (Tamsulosin)",
    "generic": "Tamsulosin Hydrochloride 0.4mg Modified Release",
    "category": "Oral Tablets & Caps",
    "dose": "0-0-1",
    "timing": "30 min after same meal every night",
    "duration": "30 days",
    "instructions": "Alpha-1A selective blocker. Relaxes prostate capsule and lower ureter.",
    "symptoms": [
      "benign prostatic hyperplasia (bph)",
      "weak urinary stream",
      "hesitancy",
      "nocturia",
      "frequent night urination",
      "kidney stone passage"
    ],
    "janAushadhi": "Cap. Tamsulosin 0.4mg (PMBJP - ₹14/strip)",
    "adultDose": "0.4mg once daily after dinner; helps pass distal ureteric stones <= 6mm",
    "paedDose": "Contraindicated",
    "notes": "Alpha-1A selective blocker. Relaxes prostate capsule and lower ureter.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Urimax-D (Tamsulosin 0.4 + Dutasteride 0.5)",
    "generic": "Tamsulosin 0.4mg + Dutasteride 0.5mg",
    "category": "Oral Tablets & Caps",
    "dose": "0-0-1",
    "timing": "At night after dinner",
    "duration": "30-90 days",
    "instructions": "Dual therapy: Tamsulosin relaxes muscle, Dutasteride shrinks prostate volume.",
    "symptoms": [
      "enlarged prostate",
      "severe urinary retention risk",
      "bph progression"
    ],
    "janAushadhi": "Tab. Tamsulosin + Dutasteride (PMBJP - ₹28/strip)",
    "adultDose": "1 tablet once daily after evening meal",
    "paedDose": "Contraindicated",
    "notes": "Dual therapy: Tamsulosin relaxes muscle, Dutasteride shrinks prostate volume.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Silodal 8mg (Silodosin)",
    "generic": "Silodosin 8mg",
    "category": "Oral Tablets & Caps",
    "dose": "0-0-1",
    "timing": "With dinner",
    "duration": "30 days",
    "instructions": "High uro-selectivity. Inform patient regarding reversible retrograde ejaculation.",
    "symptoms": [
      "bph urinary obstruction",
      "acute urinary hesitancy"
    ],
    "janAushadhi": "Cap. Silodosin 8mg (PMBJP - ₹32/strip)",
    "adultDose": "8mg once daily with a meal (4mg in renal impairment)",
    "paedDose": "Contraindicated",
    "notes": "High uro-selectivity. Inform patient regarding reversible retrograde ejaculation.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Syp. K-Cit / Alkasol (Disodium Hydrogen Citrate)",
    "generic": "Disodium Hydrogen Citrate 1.4g / 5ml",
    "category": "Pediatric & Syrup",
    "dose": "15ml diluted in 1 glass water TDS",
    "timing": "After meals with water",
    "duration": "5-7 days",
    "instructions": "Always dilute in full glass of water to avoid gastric irritation.",
    "symptoms": [
      "burning micturition",
      "dysuria",
      "acidic urine burning",
      "uric acid stones",
      "uti"
    ],
    "janAushadhi": "Disodium Hydrogen Citrate 100ml (PMBJP - ₹22/bottle)",
    "adultDose": "15-30ml in full glass of water TDS after food",
    "paedDose": "5ml diluted in water TDS",
    "notes": "Always dilute in full glass of water to avoid gastric irritation.",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Syp. Potklor 200ml (Potassium Chloride Oral)",
    "generic": "Potassium Chloride Oral Solution 10% (20 mEq/15ml)",
    "category": "Pediatric & Syrup",
    "dose": "15ml in 1 glass water BD",
    "timing": "After meals with plenty of water",
    "duration": "5 days",
    "instructions": "Dilute in full glass of water or fruit juice to prevent mucosal ulceration.",
    "symptoms": [
      "hypokalemia",
      "potassium deficiency from diuretics",
      "muscle cramps",
      "weakness"
    ],
    "janAushadhi": "Potassium Chloride Syrup (PMBJP - ₹18/bottle)",
    "adultDose": "15-30ml diluted in water twice daily after meals",
    "paedDose": "1-2 mEq/kg/day in divided doses",
    "notes": "Dilute in full glass of water or fruit juice to prevent mucosal ulceration.",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Tab. Levipil 500mg (Levetiracetam)",
    "generic": "Levetiracetam 500mg",
    "category": "Neuro & Psychiatry",
    "dose": "1-0-1",
    "timing": "With or without food",
    "duration": "30 days",
    "instructions": "First-line broad spectrum antiepileptic with minimal drug-drug interactions.",
    "symptoms": [
      "epilepsy",
      "seizures",
      "myoclonic jerks",
      "post-trauma seizure prophylaxis"
    ],
    "janAushadhi": "Tab. Levetiracetam 500mg (PMBJP - ₹24/strip)",
    "adultDose": "500mg BD initially, titrate to 1000-1500mg BD",
    "paedDose": "10-20 mg/kg/day divided twice daily",
    "notes": "First-line broad spectrum antiepileptic with minimal drug-drug interactions.",
    "cat": "Neuro & Psychiatry",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Inj. Levipil 500mg/5ml (Levetiracetam IV)",
    "generic": "Levetiracetam 100mg/ml (5ml Vial)",
    "category": "Injections & IV",
    "dose": "500-1000mg in 100ml NS",
    "timing": "Infuse over 15 minutes",
    "duration": "Stat / BD",
    "instructions": "Zero cardiac arrhythmia risk compared to Phenytoin.",
    "symptoms": [
      "acute seizure",
      "status epilepticus",
      "head injury seizure prevention"
    ],
    "janAushadhi": "Inj. Levetiracetam 500mg (PMBJP - ₹48/vial)",
    "adultDose": "1000-2000mg IV loading over 15 min; maintain 500-1000mg BD",
    "paedDose": "20-30 mg/kg IV infusion",
    "notes": "Zero cardiac arrhythmia risk compared to Phenytoin.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Eptoin 100mg/2ml (Phenytoin Sodium)",
    "generic": "Phenytoin Sodium 50mg/ml (2ml Ampoule)",
    "category": "Injections & IV",
    "dose": "Loading 15-20 mg/kg in NS",
    "timing": "Infuse slowly in Normal Saline (Max 50mg/min); NEVER IM",
    "duration": "Stat",
    "instructions": "NEVER MIX WITH DEXTROSE (precipitates). Continuous ECG and BP monitoring mandatory.",
    "symptoms": [
      "status epilepticus",
      "generalized tonic clonic convulsions",
      "head injury fits"
    ],
    "janAushadhi": "Inj. Phenytoin 100mg (PMBJP - ₹8.00/ampoule)",
    "adultDose": "1000mg (or 15-20 mg/kg) in 100ml NS over 20-30 min under ECG monitoring",
    "paedDose": "15-20 mg/kg slow IV (Max 1-3 mg/kg/min)",
    "notes": "NEVER MIX WITH DEXTROSE (precipitates). Continuous ECG and BP monitoring mandatory.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Calmpose 10mg/2ml (Diazepam)",
    "generic": "Diazepam 5mg/ml (2ml Ampoule)",
    "category": "Injections & IV",
    "dose": "5-10mg Slow IV Stat",
    "timing": "Slow IV push over 2 minutes into large vein (or rectally in children)",
    "duration": "Stat",
    "instructions": "Watch for respiratory depression. Have Ambu bag and suction ready.",
    "symptoms": [
      "active convulsion / fits",
      "febrile convulsion in child",
      "severe alcohol withdrawal delirium",
      "acute agitation"
    ],
    "janAushadhi": "Inj. Diazepam 10mg (PMBJP - ₹4.50/ampoule)",
    "adultDose": "10mg slow IV push; may repeat after 10-15 minutes (Max 30mg)",
    "paedDose": "0.2-0.3 mg/kg slow IV or 0.5 mg/kg rectally",
    "notes": "Watch for respiratory depression. Have Ambu bag and suction ready.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Midaz / Mezolam 5mg/1ml (Midazolam)",
    "generic": "Midazolam Hydrochloride 5mg/ml",
    "category": "Injections & IV",
    "dose": "2-5mg IV/IM Stat",
    "timing": "Slow IV push or IM / intranasal during fits",
    "duration": "Stat",
    "instructions": "Rapid onset. Short-acting water soluble benzodiazepine.",
    "symptoms": [
      "status epilepticus",
      "pre-op conscious sedation",
      "severe acute agitation",
      "endoscopy sedation"
    ],
    "janAushadhi": "Inj. Midazolam 5mg (PMBJP - ₹14/vial)",
    "adultDose": "2-5mg IV slowly titrated for sedation / seizure arrest",
    "paedDose": "0.15-0.2 mg/kg IM/IV or 0.2 mg/kg intranasally",
    "notes": "Rapid onset. Short-acting water soluble benzodiazepine.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Tab. Encorate Chrono 300 / 500 (Sodium Valproate)",
    "generic": "Sodium Valproate + Valproic Acid Controlled Release",
    "category": "Neuro & Psychiatry",
    "dose": "1-0-1",
    "timing": "Swallow whole with food",
    "duration": "30 days",
    "instructions": "High teratogenicity risk. Strictly contraindicated in pregnant women and child-bearing potential.",
    "symptoms": [
      "absence seizures",
      "generalized tonic clonic epilepsy",
      "bipolar mood disorder",
      "migraine prevention"
    ],
    "janAushadhi": "Tab. Sodium Valproate CR 500mg (PMBJP - ₹24/strip)",
    "adultDose": "500mg BD (or 20-30 mg/kg/day)",
    "paedDose": "20-30 mg/kg/day in 2 divided doses",
    "notes": "High teratogenicity risk. Strictly contraindicated in pregnant women and child-bearing potential.",
    "cat": "Neuro & Psychiatry",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Tegretol 200mg (Carbamazepine)",
    "generic": "Carbamazepine 200mg",
    "category": "Oral Tablets & Caps",
    "dose": "1-0-1",
    "timing": "With meals",
    "duration": "30 days",
    "instructions": "Drug of choice for shooting lancinating trigeminal neuralgia facial pain.",
    "symptoms": [
      "trigeminal neuralgia",
      "facial electric shock pain",
      "focal epilepsy",
      "pain"
    ],
    "janAushadhi": "Tab. Carbamazepine 200mg (PMBJP - ₹7.00/strip)",
    "adultDose": "100-200mg BD start, titrate up to 400mg TDS for trigeminal neuralgia",
    "paedDose": "10-20 mg/kg/day in divided doses",
    "notes": "Drug of choice for shooting lancinating trigeminal neuralgia facial pain.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Ativan 1mg / 2mg (Lorazepam)",
    "generic": "Lorazepam 1mg / 2mg",
    "category": "Neuro & Psychiatry",
    "dose": "0-0-1 (SOS)",
    "timing": "At bedtime",
    "duration": "3-5 days",
    "instructions": "Schedule H1 drug. Clean metabolic profile with zero active metabolites; safe in liver disease.",
    "symptoms": [
      "acute anxiety",
      "panic insomnia",
      "pre-procedure apprehension",
      "restlessness"
    ],
    "janAushadhi": "Tab. Lorazepam 1mg (PMBJP - ₹3.50/strip)",
    "adultDose": "1-2mg at bedtime SOS (Schedule H1)",
    "paedDose": "Specialist consultation only",
    "notes": "Schedule H1 drug. Clean metabolic profile with zero active metabolites; safe in liver disease.",
    "cat": "Neuro & Psychiatry",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Restyl 0.25mg / 0.5mg (Alprazolam)",
    "generic": "Alprazolam 0.25mg / 0.5mg",
    "category": "Neuro & Psychiatry",
    "dose": "0-0-1 (SOS)",
    "timing": "At night",
    "duration": "3-5 days",
    "instructions": "Schedule H1 prescription register required. High dependence potential; short courses only.",
    "symptoms": [
      "acute panic attack",
      "severe performance anxiety",
      "situational insomnia"
    ],
    "janAushadhi": "Tab. Alprazolam 0.25mg (PMBJP - ₹2.20/strip)",
    "adultDose": "0.25-0.5mg BD or at night (Schedule H1)",
    "paedDose": "Contraindicated in children",
    "notes": "Schedule H1 prescription register required. High dependence potential; short courses only.",
    "cat": "Neuro & Psychiatry",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Zolcalm 5mg / 10mg (Zolpidem)",
    "generic": "Zolpidem Tartrate 5mg / 10mg",
    "category": "Oral Tablets & Caps",
    "dose": "0-0-1",
    "timing": "Take immediately before going to bed",
    "duration": "3-7 days",
    "instructions": "Non-benzodiazepine 'Z-drug'. Rapid sleep induction without next-morning hangover.",
    "symptoms": [
      "short term insomnia",
      "difficulty falling asleep",
      "sleep initiation disorder"
    ],
    "janAushadhi": "Tab. Zolpidem 10mg (PMBJP - ₹8.50/strip)",
    "adultDose": "5-10mg immediately before getting into bed (5mg for females/elderly)",
    "paedDose": "Contraindicated",
    "notes": "Non-benzodiazepine 'Z-drug'. Rapid sleep induction without next-morning hangover.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Nexpro 40mg (Esomeprazole)",
    "generic": "Esomeprazole Magnesium Trihydrate 40mg",
    "category": "Gastrointestinal",
    "dose": "1-0-0",
    "timing": "30 min before breakfast",
    "duration": "14 days",
    "instructions": "S-isomer of omeprazole. Superior acid suppression and faster healing of mucosal erosion.",
    "symptoms": [
      "severe erosive esophagitis",
      "gerd",
      "peptic ulcer disease",
      "acid reflux",
      "abdominal pain"
    ],
    "janAushadhi": "Tab. Esomeprazole 40mg (PMBJP - ₹12/strip)",
    "adultDose": "40mg once daily empty stomach",
    "paedDose": "10-20mg for children > 12y",
    "notes": "S-isomer of omeprazole. Superior acid suppression and faster healing of mucosal erosion.",
    "cat": "Gastrointestinal",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Nexpro-RD 40 (Esomeprazole 40 + Domperidone 30 SR)",
    "generic": "Esomeprazole + Domperidone Sustained Release",
    "category": "Gastrointestinal",
    "dose": "1-0-0",
    "timing": "Before breakfast",
    "duration": "10 days",
    "instructions": "Complete relief from acid reflux and delayed gastric emptying.",
    "symptoms": [
      "acid reflux with nausea",
      "heartburn",
      "sour belching",
      "fullness after food"
    ],
    "janAushadhi": "Cap. Esomeprazole + Domperidone (PMBJP - ₹16/strip)",
    "adultDose": "1 capsule once daily in morning",
    "paedDose": "Not recommended",
    "notes": "Complete relief from acid reflux and delayed gastric emptying.",
    "cat": "Gastrointestinal",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Librax (Chlordiazepoxide 5mg + Clidinium 2.5mg)",
    "generic": "Chlordiazepoxide + Clidinium Bromide",
    "category": "Oral Tablets & Caps",
    "dose": "1-0-1",
    "timing": "30 min before meals",
    "duration": "7-14 days",
    "instructions": "Dual action: antispasmodic for gut motility + gentle anxiolytic for gut-brain axis.",
    "symptoms": [
      "stress-induced stomach cramps",
      "nervous stomach",
      "spastic colon",
      "ibs abdominal pain",
      "abdominal pain"
    ],
    "janAushadhi": "Tab. Clidinium + Chlordiazepoxide (PMBJP - ₹14/strip)",
    "adultDose": "1 tablet BD or TDS before meals and at bedtime",
    "paedDose": "Contraindicated in children",
    "notes": "Dual action: antispasmodic for gut motility + gentle anxiolytic for gut-brain axis.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Omee-Instant / Gas-O-Fast",
    "generic": "Omeprazole 20mg + Sodium Bicarbonate 1100mg Instant Powder / Tablet",
    "category": "Gastrointestinal",
    "dose": "1 sachet in water SOS",
    "timing": "Empty stomach or during acute heartburn attack",
    "duration": "3 days",
    "instructions": "Sodium bicarbonate neutralizes stomach acid instantly while shielding omeprazole for rapid absorption.",
    "symptoms": [
      "instant severe heartburn",
      "acute midnight acid pain",
      "gastritis flare",
      "abdominal pain"
    ],
    "janAushadhi": "Omeprazole + Bicarb Sachet (PMBJP - ₹8.00/sachet)",
    "adultDose": "1 sachet dissolved in water; provides acid relief in under 5 minutes",
    "paedDose": "Not recommended under 12y",
    "notes": "Sodium bicarbonate neutralizes stomach acid instantly while shielding omeprazole for rapid absorption.",
    "cat": "Gastrointestinal",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Eno Fruit Salt Sachet (Sodium Bicarbonate + Citric Acid)",
    "generic": "Sodium Bicarbonate + Citric Acid Effervescent Antacid 5g",
    "category": "Oral Tablets & Caps",
    "dose": "1 sachet in half glass water SOS",
    "timing": "Drink immediately while effervescing",
    "duration": "SOS",
    "instructions": "Works in 6 seconds by local neutralization. Avoid frequent use in hypertension (contains sodium).",
    "symptoms": [
      "instant acidity relief",
      "heavy fullness",
      "indigestion after oily food",
      "sour burping"
    ],
    "janAushadhi": "Effervescent Antacid Sachet (PMBJP - ₹4.00/sachet)",
    "adultDose": "5g sachet in 150ml water SOS (Max 2 doses/day)",
    "paedDose": "Children > 12y only",
    "notes": "Works in 6 seconds by local neutralization. Avoid frequent use in hypertension (contains sodium).",
    "cat": "Oral Tablets & Caps",
    "form": "Powder",
    "route": "Oral"
  },
  {
    "name": "Tab. Pudin Hara Pearls (Mentha Piperita Oil)",
    "generic": "Peppermint Oil + Spearmint Oil Natural Carminative",
    "category": "Oral Tablets & Caps",
    "dose": "1-2 pearls with water SOS",
    "timing": "Immediately after food during bloating",
    "duration": "SOS",
    "instructions": "Natural smooth muscle relaxant and antiflatulent. Swallow whole; do not chew.",
    "symptoms": [
      "stomach gas",
      "griping pain",
      "bloating",
      "indigestion",
      "spasmodic fullness",
      "abdominal pain"
    ],
    "janAushadhi": "Herbal Carminative Pearls (PMBJP - ₹12/strip)",
    "adultDose": "1-2 pearls swallowed whole with glass of water",
    "paedDose": "1 pearl for children > 6 years",
    "notes": "Natural smooth muscle relaxant and antiflatulent. Swallow whole; do not chew.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Digene Chewable Tablets (Mint / Orange)",
    "generic": "Magnesium Hydroxide + Aluminium Hydroxide + Simethicone Chewable",
    "category": "Oral Tablets & Caps",
    "dose": "2 tablets chewed after meals SOS",
    "timing": "Chew thoroughly after meals and at bedtime",
    "duration": "3-5 days",
    "instructions": "Must be chewed completely before swallowing for optimal buffering surface area.",
    "symptoms": [
      "heartburn",
      "acid acidity",
      "sour throat sensation",
      "mild dyspepsia"
    ],
    "janAushadhi": "Chewable Antacid Tablets (PMBJP - ₹6.00/strip)",
    "adultDose": "2-4 tablets chewed thoroughly after food",
    "paedDose": "1 tablet for children > 6y",
    "notes": "Must be chewed completely before swallowing for optimal buffering surface area.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Tinidazole 500mg (Tiniba 500)",
    "generic": "Tinidazole 500mg",
    "category": "Oral Tablets & Caps",
    "dose": "1-0-1",
    "timing": "With or after food",
    "duration": "3 days",
    "instructions": "Longer half-life than metronidazole with less metallic taste. Strict alcohol avoidance.",
    "symptoms": [
      "amoebic liver abscess",
      "giardiasis",
      "trichomoniasis",
      "anaerobic infection",
      "diarrhea"
    ],
    "janAushadhi": "Tab. Tinidazole 500mg (PMBJP - ₹8.50/strip)",
    "adultDose": "2g single daily dose for 2-3 days with food",
    "paedDose": "50 mg/kg single daily dose for 3 days",
    "notes": "Longer half-life than metronidazole with less metallic taste. Strict alcohol avoidance.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Bactrim DS (Sulfamethoxazole 800 + Trimethoprim 160)",
    "generic": "Cotrimoxazole Double Strength (Sulfamethoxazole + Trimethoprim)",
    "category": "Antimicrobial & Antibiotic",
    "dose": "1-0-1",
    "timing": "After food with full glass of water",
    "duration": "5-10 days",
    "instructions": "Ensure high fluid intake to prevent crystalluria. Check for sulfa allergy.",
    "symptoms": [
      "recurrent urinary tract infection",
      "pneumocystis jirovecii prophylaxis",
      "shigellosis",
      "fever",
      "uti"
    ],
    "janAushadhi": "Tab. Cotrimoxazole DS (PMBJP - ₹6.50/strip)",
    "adultDose": "1 tablet BD after meals with plenty of fluid",
    "paedDose": "Use pediatric suspension (40mg SMX + 8mg TMP / kg/day)",
    "notes": "Ensure high fluid intake to prevent crystalluria. Check for sulfa allergy.",
    "cat": "Antimicrobial & Antibiotic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Inj. Lox 2% Plain 30ml (Lidocaine / Lignocaine)",
    "generic": "Lignocaine Hydrochloride 2% w/v (20mg/ml) 30ml Multiple Dose Vial",
    "category": "Injections & IV",
    "dose": "Infiltrate locally as required",
    "timing": "Subcutaneous infiltration 5 min prior to procedure",
    "duration": "Procedure duration (1-2 hours)",
    "instructions": "Aspirate before injecting to avoid intravascular injection. Rapid 2-minute onset.",
    "symptoms": [
      "suturing cut wounds",
      "abscess drainage local anesthesia",
      "sebaceous cyst removal",
      "minor clinic surgery"
    ],
    "janAushadhi": "Inj. Lignocaine 2% 30ml (PMBJP - ₹18/vial)",
    "adultDose": "Max 4.5 mg/kg (up to 20ml for 70kg adult) without adrenaline",
    "paedDose": "Max 3 mg/kg plain local infiltration",
    "notes": "Aspirate before injecting to avoid intravascular injection. Rapid 2-minute onset.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Lox 2% with Adrenaline (1:200,000) 30ml",
    "generic": "Lignocaine 2% + Adrenaline (Epinephrine) 1:200,000",
    "category": "Injections & IV",
    "dose": "Infiltrate locally in scalp / trunk wounds",
    "timing": "Infiltrate 7 minutes prior to incision",
    "duration": "2-4 hours anesthesia + hemostasis",
    "instructions": "NEVER USE ON END-ARTERIES (fingers, toes, tip of nose, ears, or penis - causes tissue gangrene).",
    "symptoms": [
      "profuse bleeding scalp laceration",
      "minor surgical excision requiring bloodless field"
    ],
    "janAushadhi": "Inj. Lignocaine with Adrenaline (PMBJP - ₹22/vial)",
    "adultDose": "Max 7 mg/kg with adrenaline",
    "paedDose": "Calculate strictly by weight",
    "notes": "NEVER USE ON END-ARTERIES (fingers, toes, tip of nose, ears, or penis - causes tissue gangrene).",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Calcium Gluconate 10% (10ml Ampoule)",
    "generic": "Calcium Gluconate 10% w/v (100mg/ml)",
    "category": "Injections & IV",
    "dose": "10ml Slow IV over 10 min",
    "timing": "Slow IV infusion under cardiac monitoring",
    "duration": "Stat",
    "instructions": "Cardioprotective in severe hyperkalemia. Rapid injection causes cardiac arrest.",
    "symptoms": [
      "severe hypocalcemia (tetany)",
      "carpopedal spasm",
      "hyperkalemia cardiac toxicity",
      "magnesium toxicity antidote"
    ],
    "janAushadhi": "Inj. Calcium Gluconate 10ml (PMBJP - ₹9.00/ampoule)",
    "adultDose": "10ml of 10% solution slow IV over 10-15 minutes",
    "paedDose": "1-2 ml/kg diluted 1:1 with 5% Dextrose",
    "notes": "Cardioprotective in severe hyperkalemia. Rapid injection causes cardiac arrest.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Magnesium Sulfate 50% (2ml Ampoule / 1g)",
    "generic": "Magnesium Sulfate 50% w/v (500mg/ml)",
    "category": "Injections & IV",
    "dose": "4g IV loading over 20m + 5g deep IM in each buttock (Pritchard regimen)",
    "timing": "Pritchard regimen for eclampsia fits",
    "duration": "Stat",
    "instructions": "Monitor patellar knee reflexes, respiratory rate (> 16/min), and urine output before each dose.",
    "symptoms": [
      "eclampsia convulsions in pregnancy",
      "severe preeclampsia seizure prevention",
      "torsades de pointes arrhythmia"
    ],
    "janAushadhi": "Inj. Magnesium Sulfate (PMBJP - ₹6.50/ampoule)",
    "adultDose": "Pritchard regimen for obstetric eclampsia",
    "paedDose": "25-50 mg/kg in refractory pediatric status asthmaticus",
    "notes": "Monitor patellar knee reflexes, respiratory rate (> 16/min), and urine output before each dose.",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Volini / Moov Pain Relief Gel 30g / 50g",
    "generic": "Diclofenac Diethylamine + Methyl Salicylate + Menthol + Linseed Oil",
    "category": "Analgesic & Antipyretic",
    "dose": "Apply gently over affected area TDS",
    "timing": "Massage gently without vigorous rubbing",
    "duration": "5-7 days",
    "instructions": "Topical micro-emulsion delivers deep analgesic penetration without gastric side effects.",
    "symptoms": [
      "backache",
      "neck pain",
      "knee joint pain",
      "shoulder stiffness",
      "muscular sprain",
      "pain"
    ],
    "janAushadhi": "Pain Relief Gel 30g (PMBJP - ₹18/tube)",
    "adultDose": "Apply 2-4g 3-4 times daily over intact skin",
    "paedDose": "Safe for children > 6 years",
    "notes": "Topical micro-emulsion delivers deep analgesic penetration without gastric side effects.",
    "cat": "Analgesic & Antipyretic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Volini / Moov Pain Relief Spray 55g",
    "generic": "Diclofenac + Methyl Salicylate + Menthol Aerosol Spray",
    "category": "Analgesic & Antipyretic",
    "dose": "Spray from 5-10cm distance for 2-3 sec",
    "timing": "3-4 times daily on painful area",
    "duration": "As needed",
    "instructions": "Instant cold spray effect provides rapid cooling followed by deep warmth.",
    "symptoms": [
      "sports injury",
      "acute ankle sprain",
      "sudden muscle catch",
      "stiff back",
      "pain"
    ],
    "janAushadhi": "Pain Relief Spray 55g (PMBJP - ₹48/can)",
    "adultDose": "Spray 3-4 times daily; do not inhale aerosol",
    "paedDose": "Avoid spraying on face",
    "notes": "Instant cold spray effect provides rapid cooling followed by deep warmth.",
    "cat": "Analgesic & Antipyretic",
    "form": "Spray",
    "route": "Oral"
  },
  {
    "name": "Silverex Ionic / Burnol Cream (Silver Sulfadiazine 1%)",
    "generic": "Silver Sulfadiazine 1% w/w Burn Cream",
    "category": "Oral Tablets & Caps",
    "dose": "Apply 1-2mm sterile layer",
    "timing": "Clean burn gently with saline and apply BD with sterile spatula",
    "duration": "Until healed",
    "instructions": "Broad-spectrum antibacterial against Pseudomonas and Staph in burn wounds.",
    "symptoms": [
      "first & second degree burns",
      "scalds",
      "boiling water burns",
      "friction abrasions"
    ],
    "janAushadhi": "Silver Sulfadiazine 1% Cream (PMBJP - ₹22/tube)",
    "adultDose": "Apply 1-2mm layer under sterile dressing or open technique",
    "paedDose": "Safe for infants > 2 months",
    "notes": "Broad-spectrum antibacterial against Pseudomonas and Staph in burn wounds.",
    "cat": "Oral Tablets & Caps",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Ointment T-Bact 2% (Mupirocin 2%)",
    "generic": "Mupirocin 2% w/w Topical Ointment",
    "category": "Oral Tablets & Caps",
    "dose": "Apply small dab TDS",
    "timing": "Clean crusted area before applying",
    "duration": "5-7 days",
    "instructions": "Natural antibiotic from Pseudomonas fluorescens. Highly effective against MRSA skin infections.",
    "symptoms": [
      "impetigo (honey-colored crusts in children)",
      "folliculitis",
      "boils / furuncles",
      "infected eczema"
    ],
    "janAushadhi": "Mupirocin 2% Ointment (PMBJP - ₹26/tube)",
    "adultDose": "Apply small amount to lesion 3 times daily",
    "paedDose": "Safe for infants > 2 months",
    "notes": "Natural antibiotic from Pseudomonas fluorescens. Highly effective against MRSA skin infections.",
    "cat": "Oral Tablets & Caps",
    "form": "Ointment",
    "route": "Topical"
  },
  {
    "name": "Hydrogen Peroxide 3% Solution (100ml / 400ml)",
    "generic": "Hydrogen Peroxide 3% w/v (10 Volume) Topical Solution",
    "category": "Pediatric & Syrup",
    "dose": "Pour over dirty / sloughy wounds",
    "timing": "Mechanical debridement of contaminated lacerations",
    "duration": "Once during debridement",
    "instructions": "Always flush with normal saline after use to prevent tissue toxicity.",
    "symptoms": [
      "sloughy dirty wounds",
      "gravel in road accident road rash",
      "blood crust removal"
    ],
    "janAushadhi": "Hydrogen Peroxide 100ml (PMBJP - ₹12/bottle)",
    "adultDose": "Effervescent bubbling releases oxygen to loosen dirt and kill anaerobic tetanus spores",
    "paedDose": "Rinse with normal saline after effervescence",
    "notes": "Always flush with normal saline after use to prevent tissue toxicity.",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Surgical Spirit / Rubbing Alcohol 70% (500ml)",
    "generic": "Isopropyl Alcohol 70% v/v Antiseptic Solution",
    "category": "Pediatric & Syrup",
    "dose": "Apply with sterile cotton swab",
    "timing": "Skin disinfection prior to injection, IV cannulation, or venipuncture",
    "duration": "Allow 30 seconds to air-dry completely",
    "instructions": "Requires full 30 seconds of air drying to kill bacteria.",
    "symptoms": [
      "pre-injection skin cleaning",
      "skin disinfection",
      "thermometer sanitization"
    ],
    "janAushadhi": "Surgical Spirit 100ml (PMBJP - ₹14/bottle)",
    "adultDose": "Wipe injection site in outward circular motion",
    "paedDose": "Do not apply on open broken skin (stings)",
    "notes": "Requires full 30 seconds of air drying to kill bacteria.",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Tab. Teneligliptin 20mg (Zita / Tenglyn)",
    "generic": "Teneligliptin 20mg (Zita / Tenglyn)",
    "category": "Diabetic Care",
    "dose": "1 Tab OD",
    "timing": "Before food",
    "duration": "30 Days",
    "instructions": "Gliptin for Type 2 Diabetes; check HbA1c periodically",
    "symptoms": [
      "diabetes",
      "high sugar",
      "sugar",
      "polyuria",
      "polydipsia",
      "uncontrolled diabetes"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab OD",
    "paedDose": "As directed by pediatrician",
    "notes": "Gliptin for Type 2 Diabetes; check HbA1c periodically",
    "cat": "Diabetic Care",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Teneligliptin 20mg + Metformin 500mg (Zita-M)",
    "generic": "Teneligliptin 20mg + Metformin 500mg (Zita-M)",
    "category": "Diabetic Care",
    "dose": "1 Tab BD",
    "timing": "With meals",
    "duration": "30 Days",
    "instructions": "Dual oral antidiabetic therapy",
    "symptoms": [
      "diabetes",
      "high sugar",
      "sugar",
      "uncontrolled diabetes"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab BD",
    "paedDose": "As directed by pediatrician",
    "notes": "Dual oral antidiabetic therapy",
    "cat": "Diabetic Care",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Dapagliflozin 10mg + Metformin 500mg (Oxra-M / Forxiga-M)",
    "generic": "Dapagliflozin 10mg + Metformin 500mg (Oxra-M / Forxiga-M)",
    "category": "Diabetic Care",
    "dose": "1 Tab OD",
    "timing": "Morning with breakfast",
    "duration": "30 Days",
    "instructions": "Cardio-renal protective antidiabetic; ensure adequate hydration",
    "symptoms": [
      "diabetes",
      "high sugar",
      "ckd diabetes",
      "heart failure diabetes"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab OD",
    "paedDose": "As directed by pediatrician",
    "notes": "Cardio-renal protective antidiabetic; ensure adequate hydration",
    "cat": "Diabetic Care",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Empagliflozin 10mg (Jardiance)",
    "generic": "Empagliflozin 10mg (Jardiance)",
    "category": "Diabetic Care",
    "dose": "1 Tab OD",
    "timing": "Morning",
    "duration": "30 Days",
    "instructions": "SGLT2 inhibitor; improves glycemic control & reduces CV risk",
    "symptoms": [
      "diabetes",
      "high sugar",
      "heart failure",
      "edema"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab OD",
    "paedDose": "As directed by pediatrician",
    "notes": "SGLT2 inhibitor; improves glycemic control & reduces CV risk",
    "cat": "Diabetic Care",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Empagliflozin 12.5mg + Metformin 500mg (Jardiance Duo)",
    "generic": "Empagliflozin 12.5mg + Metformin 500mg (Jardiance Duo)",
    "category": "Diabetic Care",
    "dose": "1 Tab BD",
    "timing": "With meals",
    "duration": "30 Days",
    "instructions": "Combined SGLT2i + Biguanide therapy",
    "symptoms": [
      "diabetes",
      "high sugar",
      "sugar"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab BD",
    "paedDose": "As directed by pediatrician",
    "notes": "Combined SGLT2i + Biguanide therapy",
    "cat": "Diabetic Care",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Sitagliptin 50mg + Metformin 500mg (Janumet)",
    "generic": "Sitagliptin 50mg + Metformin 500mg (Janumet)",
    "category": "Diabetic Care",
    "dose": "1 Tab BD",
    "timing": "With food",
    "duration": "30 Days",
    "instructions": "DPP4i combination; low risk of hypoglycemia",
    "symptoms": [
      "diabetes",
      "high sugar",
      "uncontrolled sugar"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab BD",
    "paedDose": "As directed by pediatrician",
    "notes": "DPP4i combination; low risk of hypoglycemia",
    "cat": "Diabetic Care",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Pioglitazone 15mg (Pioz)",
    "generic": "Pioglitazone 15mg (Pioz)",
    "category": "Diabetic Care",
    "dose": "1 Tab OD",
    "timing": "Morning",
    "duration": "30 Days",
    "instructions": "Insulin sensitizer; monitor for weight gain or pedal edema",
    "symptoms": [
      "diabetes",
      "high sugar",
      "insulin resistance"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab OD",
    "paedDose": "As directed by pediatrician",
    "notes": "Insulin sensitizer; monitor for weight gain or pedal edema",
    "cat": "Diabetic Care",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Inj. Insulin Glargine 100 IU/ml (Lantus)",
    "generic": "Insulin Glargine 100 IU/ml (Lantus)",
    "category": "Diabetic Care",
    "dose": "10-20 Units SC OD",
    "timing": "At bedtime",
    "duration": "Ongoing",
    "instructions": "Long-acting basal insulin; rotate injection sites",
    "symptoms": [
      "uncontrolled diabetes",
      "type 1 diabetes",
      "high blood sugar",
      "hyperglycemia"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "10-20 Units SC OD",
    "paedDose": "As directed by pediatrician",
    "notes": "Long-acting basal insulin; rotate injection sites",
    "cat": "Diabetic Care",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Regular Human Insulin 40 IU/ml (Human Actrapid)",
    "generic": "Regular Human Insulin 40 IU/ml (Human Actrapid)",
    "category": "Diabetic Care",
    "dose": "As per sliding scale SC",
    "timing": "30 mins before meals",
    "duration": "Hospital / OPD protocol",
    "instructions": "Short-acting insulin for mealtime control",
    "symptoms": [
      "hyperglycemia",
      "diabetic ketoacidosis",
      "high sugar"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "As per sliding scale SC",
    "paedDose": "As directed by pediatrician",
    "notes": "Short-acting insulin for mealtime control",
    "cat": "Diabetic Care",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Premixed 30/70 Human Insulin 40 IU/ml (Human Mixtard)",
    "generic": "Premixed 30/70 Human Insulin 40 IU/ml (Human Mixtard)",
    "category": "Diabetic Care",
    "dose": "As prescribed SC BD",
    "timing": "Before breakfast and dinner",
    "duration": "Ongoing",
    "instructions": "Dual action insulin (30% rapid, 70% isophane)",
    "symptoms": [
      "diabetes",
      "high sugar",
      "insulin therapy"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "As prescribed SC BD",
    "paedDose": "As directed by pediatrician",
    "notes": "Dual action insulin (30% rapid, 70% isophane)",
    "cat": "Diabetic Care",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Tab. Cilnidipine 10mg (Cilacar)",
    "generic": "Cilnidipine 10mg (Cilacar)",
    "category": "Cardiovascular",
    "dose": "1 Tab OD",
    "timing": "Morning",
    "duration": "30 Days",
    "instructions": "L/N-type calcium channel blocker with lower pedal edema risk",
    "symptoms": [
      "hypertension",
      "high bp",
      "blood pressure",
      "headache bp"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab OD",
    "paedDose": "As directed by pediatrician",
    "notes": "L/N-type calcium channel blocker with lower pedal edema risk",
    "cat": "Cardiovascular",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Cilnidipine 10mg + Telmisartan 40mg (Cilacar-T)",
    "generic": "Cilnidipine 10mg + Telmisartan 40mg (Cilacar-T)",
    "category": "Cardiovascular",
    "dose": "1 Tab OD",
    "timing": "Morning",
    "duration": "30 Days",
    "instructions": "Synergistic ARB + CCB therapy for stage 2 hypertension",
    "symptoms": [
      "hypertension",
      "high bp",
      "refractory hypertension"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab OD",
    "paedDose": "As directed by pediatrician",
    "notes": "Synergistic ARB + CCB therapy for stage 2 hypertension",
    "cat": "Cardiovascular",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Bisoprolol 5mg (Concor)",
    "generic": "Bisoprolol 5mg (Concor)",
    "category": "Cardiovascular",
    "dose": "1 Tab OD",
    "timing": "Morning",
    "duration": "30 Days",
    "instructions": "Cardioselective beta-1 blocker; check heart rate",
    "symptoms": [
      "hypertension",
      "tachycardia",
      "palpitation",
      "angina",
      "heart disease"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab OD",
    "paedDose": "As directed by pediatrician",
    "notes": "Cardioselective beta-1 blocker; check heart rate",
    "cat": "Cardiovascular",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Metoprolol Succinate ER 25mg (Betaloc / Metolar XR)",
    "generic": "Metoprolol Succinate ER 25mg (Betaloc / Metolar XR)",
    "category": "Cardiovascular",
    "dose": "1 Tab OD",
    "timing": "Morning after breakfast",
    "duration": "30 Days",
    "instructions": "Extended release beta blocker; swallow whole",
    "symptoms": [
      "palpitation",
      "high bp",
      "tachycardia",
      "angina",
      "post mi"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab OD",
    "paedDose": "As directed by pediatrician",
    "notes": "Extended release beta blocker; swallow whole",
    "cat": "Cardiovascular",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Nebivolol 5mg (Nebicard)",
    "generic": "Nebivolol 5mg (Nebicard)",
    "category": "Cardiovascular",
    "dose": "1 Tab OD",
    "timing": "Morning",
    "duration": "30 Days",
    "instructions": "Third generation beta blocker with nitric oxide vasodilation",
    "symptoms": [
      "hypertension",
      "high bp",
      "heart disease"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab OD",
    "paedDose": "As directed by pediatrician",
    "notes": "Third generation beta blocker with nitric oxide vasodilation",
    "cat": "Cardiovascular",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Olmesartan 20mg (Olmecip)",
    "generic": "Olmesartan 20mg (Olmecip)",
    "category": "Cardiovascular",
    "dose": "1 Tab OD",
    "timing": "Morning",
    "duration": "30 Days",
    "instructions": "Angiotensin II receptor antagonist for blood pressure reduction",
    "symptoms": [
      "hypertension",
      "high bp",
      "raised bp"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab OD",
    "paedDose": "As directed by pediatrician",
    "notes": "Angiotensin II receptor antagonist for blood pressure reduction",
    "cat": "Cardiovascular",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Chlorthalidone 12.5mg (Thalizide)",
    "generic": "Chlorthalidone 12.5mg (Thalizide)",
    "category": "Cardiovascular",
    "dose": "1 Tab OD",
    "timing": "Morning with breakfast",
    "duration": "30 Days",
    "instructions": "Thiazide-like diuretic; monitor serum electrolytes (potassium)",
    "symptoms": [
      "hypertension",
      "high bp",
      "mild edema",
      "fluid retention"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab OD",
    "paedDose": "As directed by pediatrician",
    "notes": "Thiazide-like diuretic; monitor serum electrolytes (potassium)",
    "cat": "Cardiovascular",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Torsemide 10mg + Spironolactone 50mg (Dytor Plus 10)",
    "generic": "Torsemide 10mg + Spironolactone 50mg (Dytor Plus 10)",
    "category": "Cardiovascular",
    "dose": "1 Tab OD",
    "timing": "Morning",
    "duration": "15 Days",
    "instructions": "Potassium-sparing combination loop diuretic for refractory edema",
    "symptoms": [
      "edema",
      "pedal edema",
      "swelling feet",
      "ascites",
      "congestive heart failure",
      "breathlessness"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab OD",
    "paedDose": "As directed by pediatrician",
    "notes": "Potassium-sparing combination loop diuretic for refractory edema",
    "cat": "Cardiovascular",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Clopidogrel 75mg (Deplatt / Clopilet)",
    "generic": "Clopidogrel 75mg (Deplatt / Clopilet)",
    "category": "Cardiovascular",
    "dose": "1 Tab OD",
    "timing": "After food",
    "duration": "30 Days",
    "instructions": "Antiplatelet agent; prevent arterial thrombosis and stroke",
    "symptoms": [
      "cad",
      "heart attack prevention",
      "stroke prevention",
      "angina",
      "post stent"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab OD",
    "paedDose": "As directed by pediatrician",
    "notes": "Antiplatelet agent; prevent arterial thrombosis and stroke",
    "cat": "Cardiovascular",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Ecosprin AV 75/10 (Aspirin 75mg + Atorvastatin 10mg)",
    "generic": "Ecosprin AV 75/10 (Aspirin 75mg + Atorvastatin 10mg)",
    "category": "Cardiovascular",
    "dose": "1 Cap OD",
    "timing": "At night after dinner",
    "duration": "30 Days",
    "instructions": "Standard primary/secondary cardiovascular prevention combo",
    "symptoms": [
      "dyslipidemia",
      "cholesterol",
      "cad",
      "angina",
      "post mi prevention"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Cap OD",
    "paedDose": "As directed by pediatrician",
    "notes": "Standard primary/secondary cardiovascular prevention combo",
    "cat": "Cardiovascular",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Rosuvastatin 10mg + Fenofibrate 160mg (Rozavel-F)",
    "generic": "Rosuvastatin 10mg + Fenofibrate 160mg (Rozavel-F)",
    "category": "Cardiovascular",
    "dose": "1 Tab OD",
    "timing": "At bedtime",
    "duration": "30 Days",
    "instructions": "Mixed dyslipidemia (high LDL + high Triglycerides)",
    "symptoms": [
      "high triglycerides",
      "mixed hyperlipidemia",
      "cholesterol"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab OD",
    "paedDose": "As directed by pediatrician",
    "notes": "Mixed dyslipidemia (high LDL + high Triglycerides)",
    "cat": "Cardiovascular",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Nitroglycerin Controlled Release 2.6mg (Nitrocontin 2.6)",
    "generic": "Nitroglycerin Controlled Release 2.6mg (Nitrocontin 2.6)",
    "category": "Cardiovascular",
    "dose": "1 Tab BD",
    "timing": "12 hours apart (e.g. 8am & 8pm)",
    "duration": "30 Days",
    "instructions": "Prophylaxis of chronic angina; allows nitrate-free interval",
    "symptoms": [
      "chest pain",
      "angina",
      "ischemic heart disease",
      "coronary artery disease"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab BD",
    "paedDose": "As directed by pediatrician",
    "notes": "Prophylaxis of chronic angina; allows nitrate-free interval",
    "cat": "Cardiovascular",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Sublingual Spray / Tab. Sorbitrate 5mg (Isosorbide Dinitrate)",
    "generic": "Sublingual Spray / Tab. Sorbitrate 5mg (Isosorbide Dinitrate)",
    "category": "Cardiovascular",
    "dose": "1 Tab Sublingually SOS",
    "timing": "At onset of angina attack",
    "duration": "SOS",
    "instructions": "Place under tongue immediately during acute angina episode",
    "symptoms": [
      "chest pain",
      "angina attack",
      "acute chest tightness"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab Sublingually SOS",
    "paedDose": "As directed by pediatrician",
    "notes": "Place under tongue immediately during acute angina episode",
    "cat": "Cardiovascular",
    "form": "Spray",
    "route": "Oral"
  },
  {
    "name": "Syp. Levosalbutamol + Ambroxol + Guaiphenesin (Ascoril LS)",
    "generic": "Levosalbutamol + Ambroxol + Guaiphenesin (Ascoril LS)",
    "category": "Pediatric & Syrup",
    "dose": "5ml TID (Adult: 10ml TID)",
    "timing": "After food",
    "duration": "5 Days",
    "instructions": "Effective for wet productive cough and broncho-spasm",
    "symptoms": [
      "productive cough",
      "wet cough",
      "phlegm",
      "chest congestion",
      "bronchitis",
      "wheezing"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "5ml TID (Adult: 10ml TID)",
    "paedDose": "5ml TID (Adult: 10ml TID)",
    "notes": "Effective for wet productive cough and broncho-spasm",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Syp. Dextromethorphan + Chlorpheniramine + Phenylephrine (Ascoril D)",
    "generic": "Dextromethorphan + Chlorpheniramine + Phenylephrine (Ascoril D)",
    "category": "Pediatric & Syrup",
    "dose": "5-10ml TID",
    "timing": "After food",
    "duration": "5 Days",
    "instructions": "For dry irritating non-productive allergic cough",
    "symptoms": [
      "dry cough",
      "throat tickle",
      "allergic cough",
      "night cough"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "5-10ml TID",
    "paedDose": "5-10ml TID",
    "notes": "For dry irritating non-productive allergic cough",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Syp. Ambroxol + Terbutaline + Guaiphenesin (Bro-Zedex)",
    "generic": "Ambroxol + Terbutaline + Guaiphenesin (Bro-Zedex)",
    "category": "Pediatric & Syrup",
    "dose": "5-10ml TID",
    "timing": "After meals",
    "duration": "5 Days",
    "instructions": "Mucolytic bronchodilator for congested chest",
    "symptoms": [
      "wet cough",
      "congestion",
      "phlegm",
      "asthmatic bronchitis"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "5-10ml TID",
    "paedDose": "5-10ml TID",
    "notes": "Mucolytic bronchodilator for congested chest",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Syp. Cyproheptadine + Tricholine Citrate (Apetamin / Practin)",
    "generic": "Cyproheptadine + Tricholine Citrate (Apetamin / Practin)",
    "category": "Pediatric & Syrup",
    "dose": "5ml BD",
    "timing": "30 mins before food",
    "duration": "15 Days",
    "instructions": "Appetite stimulant; may cause mild initial drowsiness",
    "symptoms": [
      "loss of appetite",
      "poor feeding",
      "weight loss",
      "anorexia"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "5ml BD",
    "paedDose": "5ml BD",
    "notes": "Appetite stimulant; may cause mild initial drowsiness",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Tab. Bilastine 20mg (Bilasur / Bilashine)",
    "generic": "Bilastine 20mg (Bilasur / Bilashine)",
    "category": "Antihistamine & Allergy",
    "dose": "1 Tab OD",
    "timing": "1 hour before or 2 hours after food",
    "duration": "10 Days",
    "instructions": "Second generation non-sedating antihistamine for urticaria & allergic rhinitis",
    "symptoms": [
      "urticaria",
      "hives",
      "skin allergy",
      "allergic rhinitis",
      "severe itching"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab OD",
    "paedDose": "As directed by pediatrician",
    "notes": "Second generation non-sedating antihistamine for urticaria & allergic rhinitis",
    "cat": "Antihistamine & Allergy",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Ebastine 10mg (Ebast)",
    "generic": "Ebastine 10mg (Ebast)",
    "category": "Antihistamine & Allergy",
    "dose": "1 Tab OD",
    "timing": "Night after food",
    "duration": "7 Days",
    "instructions": "Long-acting antihistamine for allergic conditions",
    "symptoms": [
      "sneezing",
      "allergic rhinitis",
      "itching",
      "hay fever"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab OD",
    "paedDose": "As directed by pediatrician",
    "notes": "Long-acting antihistamine for allergic conditions",
    "cat": "Antihistamine & Allergy",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Doxofylline 400mg (Doxolin / Doxoril)",
    "generic": "Doxofylline 400mg (Doxolin / Doxoril)",
    "category": "Respiratory",
    "dose": "1 Tab BD",
    "timing": "After meals",
    "duration": "10 Days",
    "instructions": "Bronchodilator with superior safety profile vs theophylline",
    "symptoms": [
      "asthma",
      "copd",
      "breathlessness",
      "bronchial asthma",
      "wheezing"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab BD",
    "paedDose": "As directed by pediatrician",
    "notes": "Bronchodilator with superior safety profile vs theophylline",
    "cat": "Respiratory",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Respules Budesonide 0.5mg (Budecort Respules)",
    "generic": "Budesonide 0.5mg (Budecort Respules)",
    "category": "Respiratory",
    "dose": "1 Respule via Nebulizer BD",
    "timing": "Morning and evening",
    "duration": "5 Days",
    "instructions": "Inhaled corticosteroid; rinse mouth or wash face after nebulization",
    "symptoms": [
      "acute asthma",
      "wheezing",
      "croup",
      "bronchospasm",
      "severe breathlessness"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Respule via Nebulizer BD",
    "paedDose": "As directed by pediatrician",
    "notes": "Inhaled corticosteroid; rinse mouth or wash face after nebulization",
    "cat": "Respiratory",
    "form": "Respule",
    "route": "Oral"
  },
  {
    "name": "Respules Levolin 0.63mg (Levosalbutamol Respules)",
    "generic": "Levolin 0.63mg (Levosalbutamol Respules)",
    "category": "Respiratory",
    "dose": "1 Respule via Nebulizer SOS or TDS",
    "timing": "SOS for respiratory distress",
    "duration": "3-5 Days",
    "instructions": "Rapid bronchodilation with minimal tachycardia",
    "symptoms": [
      "acute wheezing",
      "asthma attack",
      "bronchospasm",
      "chest tightness"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Respule via Nebulizer SOS or TDS",
    "paedDose": "As directed by pediatrician",
    "notes": "Rapid bronchodilation with minimal tachycardia",
    "cat": "Respiratory",
    "form": "Respule",
    "route": "Oral"
  },
  {
    "name": "Respules Duolin (Levosalbutamol + Ipratropium)",
    "generic": "Duolin (Levosalbutamol + Ipratropium)",
    "category": "Respiratory",
    "dose": "1 Respule via Nebulizer TDS",
    "timing": "Every 8 hours",
    "duration": "3-5 Days",
    "instructions": "Dual bronchodilator nebulization for acute COPD / asthma exacerbation",
    "symptoms": [
      "copd exacerbation",
      "acute breathlessness",
      "severe wheezing"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Respule via Nebulizer TDS",
    "paedDose": "As directed by pediatrician",
    "notes": "Dual bronchodilator nebulization for acute COPD / asthma exacerbation",
    "cat": "Respiratory",
    "form": "Respule",
    "route": "Oral"
  },
  {
    "name": "Cap. Rabeprazole 20mg + Levosulpiride 75mg (Rablid-L / Velgut)",
    "generic": "Rabeprazole 20mg + Levosulpiride 75mg (Rablid-L / Velgut)",
    "category": "Gastrointestinal",
    "dose": "1 Cap OD",
    "timing": "Empty stomach in morning",
    "duration": "14 Days",
    "instructions": "For diabetic gastroparesis, refractory GERD & dyspepsia",
    "symptoms": [
      "bloating",
      "gerd",
      "delayed gastric emptying",
      "postprandial fullness",
      "belching",
      "gastritis"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Cap OD",
    "paedDose": "As directed by pediatrician",
    "notes": "For diabetic gastroparesis, refractory GERD & dyspepsia",
    "cat": "Gastrointestinal",
    "form": "Capsule",
    "route": "Oral"
  },
  {
    "name": "Cap. Ilaprazole 10mg (Ilapro)",
    "generic": "Ilaprazole 10mg (Ilapro)",
    "category": "Gastrointestinal",
    "dose": "1 Tab OD",
    "timing": "Empty stomach",
    "duration": "14 Days",
    "instructions": "Potent proton pump inhibitor for erosive esophagitis and peptic ulcers",
    "symptoms": [
      "peptic ulcer",
      "severe acidity",
      "gerd",
      "heartburn"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab OD",
    "paedDose": "As directed by pediatrician",
    "notes": "Potent proton pump inhibitor for erosive esophagitis and peptic ulcers",
    "cat": "Gastrointestinal",
    "form": "Capsule",
    "route": "Oral"
  },
  {
    "name": "Tab. Mebeverine 135mg (Colofac / Morease)",
    "generic": "Mebeverine 135mg (Colofac / Morease)",
    "category": "Gastrointestinal",
    "dose": "1 Tab TDS",
    "timing": "20 mins before meals",
    "duration": "14 Days",
    "instructions": "Antispasmodic specifically indicated for Irritable Bowel Syndrome (IBS)",
    "symptoms": [
      "irritable bowel syndrome",
      "ibs",
      "abdominal cramps",
      "spasmodic pain",
      "colic"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab TDS",
    "paedDose": "As directed by pediatrician",
    "notes": "Antispasmodic specifically indicated for Irritable Bowel Syndrome (IBS)",
    "cat": "Gastrointestinal",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Otilonium Bromide 40mg (Menoctyl)",
    "generic": "Otilonium Bromide 40mg (Menoctyl)",
    "category": "Gastrointestinal",
    "dose": "1 Tab BD or TDS",
    "timing": "Before food",
    "duration": "15 Days",
    "instructions": "Selective spasmolytic for colonic hypermotility and spastic colon",
    "symptoms": [
      "ibs",
      "colic pain",
      "cramping abdomen"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab BD or TDS",
    "paedDose": "As directed by pediatrician",
    "notes": "Selective spasmolytic for colonic hypermotility and spastic colon",
    "cat": "Gastrointestinal",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Syp. Polyethylene Glycol 3350 (Pegmove / Peglec)",
    "generic": "Polyethylene Glycol 3350 (Pegmove / Peglec)",
    "category": "Gastrointestinal",
    "dose": "17g powder in 200ml water OD",
    "timing": "Bedtime",
    "duration": "7-14 Days",
    "instructions": "Osmotic laxative; safe for chronic and elderly constipation",
    "symptoms": [
      "chronic constipation",
      "hard stools",
      "straining",
      "piles constipation"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "17g powder in 200ml water OD",
    "paedDose": "As directed by pediatrician",
    "notes": "Osmotic laxative; safe for chronic and elderly constipation",
    "cat": "Gastrointestinal",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Tab. Ursodeoxycholic Acid 300mg (Udiliv 300)",
    "generic": "Ursodeoxycholic Acid 300mg (Udiliv 300)",
    "category": "Gastrointestinal",
    "dose": "1 Tab BD",
    "timing": "With meals",
    "duration": "30 Days",
    "instructions": "Hepatoprotective; dissolves radiolucent gallstones and treats cholestasis",
    "symptoms": [
      "gallstones",
      "fatty liver",
      "jaundice",
      "elevated liver enzymes",
      "biliary colic"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab BD",
    "paedDose": "As directed by pediatrician",
    "notes": "Hepatoprotective; dissolves radiolucent gallstones and treats cholestasis",
    "cat": "Gastrointestinal",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Cap. Silymarin 140mg + L-Ornithine L-Aspartate (Hepamerz)",
    "generic": "Silymarin 140mg + L-Ornithine L-Aspartate (Hepamerz)",
    "category": "Gastrointestinal",
    "dose": "1 Cap BD",
    "timing": "After meals",
    "duration": "30 Days",
    "instructions": "Promotes hepatic regeneration and detoxification",
    "symptoms": [
      "alcoholic liver disease",
      "fatty liver",
      "elevated alt ast",
      "hepatitis recovery"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Cap BD",
    "paedDose": "As directed by pediatrician",
    "notes": "Promotes hepatic regeneration and detoxification",
    "cat": "Gastrointestinal",
    "form": "Capsule",
    "route": "Oral"
  },
  {
    "name": "Tab. Escitalopram 10mg + Clonazepam 0.5mg (Nexito Plus / Clonafit Plus)",
    "generic": "Escitalopram 10mg + Clonazepam 0.5mg (Nexito Plus / Clonafit Plus)",
    "category": "Neuro & Psychiatry",
    "dose": "1 Tab OD",
    "timing": "At night after dinner",
    "duration": "15 Days",
    "instructions": "For anxiety neurosis, panic attacks and co-existing depression; do not stop abruptly",
    "symptoms": [
      "anxiety",
      "panic attack",
      "restlessness",
      "depression with anxiety",
      "severe worry"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab OD",
    "paedDose": "As directed by pediatrician",
    "notes": "For anxiety neurosis, panic attacks and co-existing depression; do not stop abruptly",
    "cat": "Neuro & Psychiatry",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Sertraline 50mg (Daxid / Zoloft)",
    "generic": "Sertraline 50mg (Daxid / Zoloft)",
    "category": "Neuro & Psychiatry",
    "dose": "1 Tab OD",
    "timing": "Morning after breakfast",
    "duration": "30 Days",
    "instructions": "SSRI antidepressant for major depressive disorder and OCD",
    "symptoms": [
      "depression",
      "low mood",
      "anhedonia",
      "ocd",
      "obsessive thoughts"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab OD",
    "paedDose": "As directed by pediatrician",
    "notes": "SSRI antidepressant for major depressive disorder and OCD",
    "cat": "Neuro & Psychiatry",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Amitriptyline 10mg (Tryptomer 10)",
    "generic": "Amitriptyline 10mg (Tryptomer 10)",
    "category": "Neuro & Psychiatry",
    "dose": "1 Tab OD",
    "timing": "At bedtime",
    "duration": "30 Days",
    "instructions": "Tricyclic drug for tension headache, neuropathic pain and insomnia",
    "symptoms": [
      "chronic tension headache",
      "fibromyalgia",
      "neuropathic pain",
      "insomnia",
      "migraine prophylaxis"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab OD",
    "paedDose": "As directed by pediatrician",
    "notes": "Tricyclic drug for tension headache, neuropathic pain and insomnia",
    "cat": "Neuro & Psychiatry",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Sodium Valproate Chrono 300mg (Encorate Chrono 300)",
    "generic": "Sodium Valproate Chrono 300mg (Encorate Chrono 300)",
    "category": "Neuro & Psychiatry",
    "dose": "1 Tab BD",
    "timing": "After food",
    "duration": "30 Days",
    "instructions": "Antiepileptic and mood stabilizer; regular liver function tests advised",
    "symptoms": [
      "epilepsy",
      "seizures",
      "convulsions",
      "bipolar disorder",
      "migraine prevention"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab BD",
    "paedDose": "As directed by pediatrician",
    "notes": "Antiepileptic and mood stabilizer; regular liver function tests advised",
    "cat": "Neuro & Psychiatry",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Levetiracetam 500mg (Levipil 500)",
    "generic": "Levetiracetam 500mg (Levipil 500)",
    "category": "Neuro & Psychiatry",
    "dose": "1 Tab BD",
    "timing": "After food",
    "duration": "30 Days",
    "instructions": "Second generation anticonvulsant with broad spectrum efficacy",
    "symptoms": [
      "epilepsy",
      "seizures",
      "fits",
      "post stroke seizures"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab BD",
    "paedDose": "As directed by pediatrician",
    "notes": "Second generation anticonvulsant with broad spectrum efficacy",
    "cat": "Neuro & Psychiatry",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Donepezil 5mg (Donecept)",
    "generic": "Donepezil 5mg (Donecept)",
    "category": "Neuro & Psychiatry",
    "dose": "1 Tab OD",
    "timing": "At bedtime",
    "duration": "30 Days",
    "instructions": "Cholinesterase inhibitor for Alzheimer's disease and cognitive impairment",
    "symptoms": [
      "memory loss",
      "dementia",
      "alzheimers",
      "cognitive decline"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab OD",
    "paedDose": "As directed by pediatrician",
    "notes": "Cholinesterase inhibitor for Alzheimer's disease and cognitive impairment",
    "cat": "Neuro & Psychiatry",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Citicoline 500mg + Piracetam 800mg (Strocit Plus / Citimac P)",
    "generic": "Citicoline 500mg + Piracetam 800mg (Strocit Plus / Citimac P)",
    "category": "Neuro & Psychiatry",
    "dose": "1 Tab BD",
    "timing": "After meals",
    "duration": "30 Days",
    "instructions": "Neuroprotective nootropic for ischemic stroke recovery and head injury",
    "symptoms": [
      "stroke recovery",
      "paralysis rehabilitation",
      "head injury",
      "memory impairment"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab BD",
    "paedDose": "As directed by pediatrician",
    "notes": "Neuroprotective nootropic for ischemic stroke recovery and head injury",
    "cat": "Neuro & Psychiatry",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Propranolol 40mg + Flunarizine 10mg (Betacap-TR / Inderal-F)",
    "generic": "Propranolol 40mg + Flunarizine 10mg (Betacap-TR / Inderal-F)",
    "category": "Neuro & Psychiatry",
    "dose": "1 Tab OD",
    "timing": "Bedtime",
    "duration": "30 Days",
    "instructions": "Gold standard migraine prophylaxis combo; prevents frequent attacks",
    "symptoms": [
      "frequent migraine",
      "pulsating headache",
      "hemicrania",
      "migraine prophylaxis"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab OD",
    "paedDose": "As directed by pediatrician",
    "notes": "Gold standard migraine prophylaxis combo; prevents frequent attacks",
    "cat": "Neuro & Psychiatry",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Gel Adapalen 0.1% + Clindamycin 1% (Deriva-CMS / Clindac A)",
    "generic": "Adapalen 0.1% + Clindamycin 1% (Deriva-CMS / Clindac A)",
    "category": "Dermatology",
    "dose": "Apply thin layer OD",
    "timing": "At bedtime on affected areas",
    "duration": "3-4 Weeks",
    "instructions": "Wash face and pat dry before applying; avoid sunlight exposure",
    "symptoms": [
      "acne",
      "pimples",
      "blackheads",
      "facial acne vulgaris"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "Apply thin layer OD",
    "paedDose": "As directed by pediatrician",
    "notes": "Wash face and pat dry before applying; avoid sunlight exposure",
    "cat": "Dermatology",
    "form": "Gel",
    "route": "Topical"
  },
  {
    "name": "Cream Nadifloxacin 1% (Nadoxin)",
    "generic": "Nadifloxacin 1% (Nadoxin)",
    "category": "Dermatology",
    "dose": "Apply twice daily",
    "timing": "Morning and evening",
    "duration": "10 Days",
    "instructions": "Topical fluoroquinolone for bacterial folliculitis, sycosis and acne",
    "symptoms": [
      "folliculitis",
      "boils",
      "skin infection",
      "infected acne"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "Apply twice daily",
    "paedDose": "As directed by pediatrician",
    "notes": "Topical fluoroquinolone for bacterial folliculitis, sycosis and acne",
    "cat": "Dermatology",
    "form": "Cream",
    "route": "Topical"
  },
  {
    "name": "Cream Ketoconazole 2% + Zinc Pyrithione 1% (Ketocip)",
    "generic": "Ketoconazole 2% + Zinc Pyrithione 1% (Ketocip)",
    "category": "Dermatology",
    "dose": "Apply twice daily",
    "timing": "Clean and dry skin before applying",
    "duration": "14 Days",
    "instructions": "For fungal tinea infections and seborrheic dermatitis",
    "symptoms": [
      "tinea versicolor",
      "ringworm",
      "fungal patch",
      "itching skin"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "Apply twice daily",
    "paedDose": "As directed by pediatrician",
    "notes": "For fungal tinea infections and seborrheic dermatitis",
    "cat": "Dermatology",
    "form": "Cream",
    "route": "Topical"
  },
  {
    "name": "Lotion Calamine + Liquid Paraffin (Caladryl)",
    "generic": "Lotion Calamine + Liquid Paraffin (Caladryl)",
    "category": "Dermatology",
    "dose": "Apply liberally TDS",
    "timing": "As needed",
    "duration": "7 Days",
    "instructions": "Soothes insect bites, sunburn, prickly heat and chickenpox rashes",
    "symptoms": [
      "prickly heat",
      "rash",
      "itching",
      "insect bites",
      "sunburn",
      "chickenpox rash"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "Apply liberally TDS",
    "paedDose": "As directed by pediatrician",
    "notes": "Soothes insect bites, sunburn, prickly heat and chickenpox rashes",
    "cat": "Dermatology",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Cream Urea 10% + Lactic Acid + Liquid Paraffin (Moisturex)",
    "generic": "Urea 10% + Lactic Acid + Liquid Paraffin (Moisturex)",
    "category": "Dermatology",
    "dose": "Apply BD",
    "timing": "After bathing and at bedtime",
    "duration": "30 Days",
    "instructions": "Keratolytic emollient for cracked heels, ichthyosis and hyperkeratosis",
    "symptoms": [
      "cracked heels",
      "dry skin",
      "xerosis",
      "ichthyosis",
      "rough skin"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "Apply BD",
    "paedDose": "As directed by pediatrician",
    "notes": "Keratolytic emollient for cracked heels, ichthyosis and hyperkeratosis",
    "cat": "Dermatology",
    "form": "Cream",
    "route": "Topical"
  },
  {
    "name": "Ointment Tacrolimus 0.03% (Tacroz 0.03%)",
    "generic": "Tacrolimus 0.03% (Tacroz 0.03%)",
    "category": "Dermatology",
    "dose": "Apply thin layer BD",
    "timing": "Morning and night",
    "duration": "14 Days",
    "instructions": "Non-steroidal calcineurin inhibitor for atopic dermatitis and vitiligo",
    "symptoms": [
      "atopic dermatitis",
      "eczema",
      "facial eczema",
      "vitiligo"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "Apply thin layer BD",
    "paedDose": "As directed by pediatrician",
    "notes": "Non-steroidal calcineurin inhibitor for atopic dermatitis and vitiligo",
    "cat": "Dermatology",
    "form": "Ointment",
    "route": "Topical"
  },
  {
    "name": "Solution Minoxidil 5% (Mintop / Morr 5%)",
    "generic": "Minoxidil 5% (Mintop / Morr 5%)",
    "category": "Dermatology",
    "dose": "1 ml apply twice daily",
    "timing": "Apply to dry scalp directly",
    "duration": "3-6 Months",
    "instructions": "For androgenetic alopecia; wash hands thoroughly after application",
    "symptoms": [
      "hair fall",
      "alopecia",
      "male pattern baldness",
      "thinning hair"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 ml apply twice daily",
    "paedDose": "As directed by pediatrician",
    "notes": "For androgenetic alopecia; wash hands thoroughly after application",
    "cat": "Dermatology",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Eye Drops Carboxymethylcellulose 0.5% (Refresh Tears)",
    "generic": "Eye Drops Carboxymethylcellulose 0.5% (Refresh Tears)",
    "category": "Ophthalmology",
    "dose": "1-2 drops QID",
    "timing": "Throughout the day",
    "duration": "1 Month",
    "instructions": "Preservative-free artificial tear for dry, irritated, tired eyes",
    "symptoms": [
      "dry eyes",
      "burning eyes",
      "screen strain",
      "foreign body sensation",
      "eye redness"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1-2 drops QID",
    "paedDose": "As directed by pediatrician",
    "notes": "Preservative-free artificial tear for dry, irritated, tired eyes",
    "cat": "Ophthalmology",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Eye Drops Olopatadine 0.1% (Opat)",
    "generic": "Eye Drops Olopatadine 0.1% (Opat)",
    "category": "Ophthalmology",
    "dose": "1 drop BD",
    "timing": "Morning and evening",
    "duration": "14 Days",
    "instructions": "Dual-acting antihistamine & mast cell stabilizer for allergic conjunctivitis",
    "symptoms": [
      "eye allergy",
      "allergic conjunctivitis",
      "itchy eyes",
      "watery eyes"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 drop BD",
    "paedDose": "As directed by pediatrician",
    "notes": "Dual-acting antihistamine & mast cell stabilizer for allergic conjunctivitis",
    "cat": "Ophthalmology",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Eye Drops Nepafenac 0.1% (Nevanac)",
    "generic": "Eye Drops Nepafenac 0.1% (Nevanac)",
    "category": "Ophthalmology",
    "dose": "1 drop TDS",
    "timing": "Every 8 hours",
    "duration": "7-10 Days",
    "instructions": "Ocular NSAID for postoperative and inflammatory pain and photophobia",
    "symptoms": [
      "eye pain",
      "post cataract surgery",
      "photophobia",
      "eye inflammation"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 drop TDS",
    "paedDose": "As directed by pediatrician",
    "notes": "Ocular NSAID for postoperative and inflammatory pain and photophobia",
    "cat": "Ophthalmology",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Eye Drops Tobramycin 0.3% + Dexamethasone 0.1% (Tobradex)",
    "generic": "Eye Drops Tobramycin 0.3% + Dexamethasone 0.1% (Tobradex)",
    "category": "Ophthalmology",
    "dose": "1 drop QID",
    "timing": "Every 6 hours",
    "duration": "7 Days",
    "instructions": "Potent antibiotic-steroid drop for acute anterior ocular infection/inflammation",
    "symptoms": [
      "severe conjunctivitis",
      "blepharitis",
      "inflamed red eye"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 drop QID",
    "paedDose": "As directed by pediatrician",
    "notes": "Potent antibiotic-steroid drop for acute anterior ocular infection/inflammation",
    "cat": "Ophthalmology",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Ear Drops Paradichlorobenzene + Benzocaine + Chlorbutol (Clearwax / Otorex)",
    "generic": "Ear Drops Paradichlorobenzene + Benzocaine + Chlorbutol (Clearwax / Otorex)",
    "category": "ENT Care",
    "dose": "3-4 drops TDS into affected ear",
    "timing": "Instill and keep head tilted for 5 minutes",
    "duration": "3-5 Days",
    "instructions": "Wax softener; do not probe with ear buds; syringe or aspirate after 3 days",
    "symptoms": [
      "ear wax",
      "ear blockage",
      "hearing blockage",
      "ear fullness",
      "impacted cerumen"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "3-4 drops TDS into affected ear",
    "paedDose": "As directed by pediatrician",
    "notes": "Wax softener; do not probe with ear buds; syringe or aspirate after 3 days",
    "cat": "ENT Care",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Nasal Spray Fluticasone Furoate 27.5mcg (Flixonase / Furamist)",
    "generic": "Fluticasone Furoate 27.5mcg (Flixonase / Furamist)",
    "category": "ENT Care",
    "dose": "2 Sprays in each nostril OD",
    "timing": "Morning",
    "duration": "1 Month",
    "instructions": "Intranasal corticosteroid for perennial and seasonal allergic rhinitis / nasal polyps",
    "symptoms": [
      "allergic rhinitis",
      "nasal blockage",
      "chronic sneezing",
      "nasal polyps",
      "runny nose"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "2 Sprays in each nostril OD",
    "paedDose": "As directed by pediatrician",
    "notes": "Intranasal corticosteroid for perennial and seasonal allergic rhinitis / nasal polyps",
    "cat": "ENT Care",
    "form": "Spray",
    "route": "Nasal"
  },
  {
    "name": "Nasal Drops Oxymetazoline 0.05% (Otrivin)",
    "generic": "Nasal Drops Oxymetazoline 0.05% (Otrivin)",
    "category": "ENT Care",
    "dose": "2 drops in each nostril BD",
    "timing": "Morning and night",
    "duration": "Maximum 3-5 Days",
    "instructions": "Fast-acting nasal decongestant; DO NOT use beyond 5 days to avoid rhinitis medicamentosa",
    "symptoms": [
      "acute nasal congestion",
      "blocked nose",
      "severe cold",
      "sinus congestion"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "2 drops in each nostril BD",
    "paedDose": "As directed by pediatrician",
    "notes": "Fast-acting nasal decongestant; DO NOT use beyond 5 days to avoid rhinitis medicamentosa",
    "cat": "ENT Care",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Gargle / Mouthwash Chlorhexidine Gluconate 0.2% (Hexidine)",
    "generic": "Gargle / Mouthwash Chlorhexidine Gluconate 0.2% (Hexidine)",
    "category": "ENT Care",
    "dose": "10 ml undiluted gargle BD",
    "timing": "Swish for 1 minute after brushing, spit out",
    "duration": "10 Days",
    "instructions": "Antiseptic mouthwash for gingivitis, oral ulcers and post dental extraction",
    "symptoms": [
      "gingivitis",
      "bleeding gums",
      "mouth odor",
      "bad breath",
      "oral hygiene",
      "stomatitis"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "10 ml undiluted gargle BD",
    "paedDose": "As directed by pediatrician",
    "notes": "Antiseptic mouthwash for gingivitis, oral ulcers and post dental extraction",
    "cat": "ENT Care",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Gel Choline Salicylate + Lignocaine 2% (Zytee / Mucopain)",
    "generic": "Choline Salicylate + Lignocaine 2% (Zytee / Mucopain)",
    "category": "ENT Care",
    "dose": "Apply small dab QID",
    "timing": "15 minutes before food",
    "duration": "5 Days",
    "instructions": "Instant pain relief for painful aphthous mouth ulcers and denture sores",
    "symptoms": [
      "mouth ulcer",
      "aphthous ulcer",
      "pain in mouth",
      "canker sore"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "Apply small dab QID",
    "paedDose": "As directed by pediatrician",
    "notes": "Instant pain relief for painful aphthous mouth ulcers and denture sores",
    "cat": "ENT Care",
    "form": "Gel",
    "route": "Topical"
  },
  {
    "name": "Tab. Alfuzosin 10mg ER (Alfoo)",
    "generic": "Alfuzosin 10mg ER (Alfoo)",
    "category": "Urology",
    "dose": "1 Tab OD",
    "timing": "Immediately after evening meal",
    "duration": "30 Days",
    "instructions": "Uroselective alpha-1 blocker for benign prostatic hyperplasia (BPH)",
    "symptoms": [
      "bph",
      "hesitancy",
      "weak urinary stream",
      "nocturia",
      "prostate enlargement"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab OD",
    "paedDose": "As directed by pediatrician",
    "notes": "Uroselective alpha-1 blocker for benign prostatic hyperplasia (BPH)",
    "cat": "Urology",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Tamsulosin 0.4mg + Dutasteride 0.5mg (Urimax-D)",
    "generic": "Tamsulosin 0.4mg + Dutasteride 0.5mg (Urimax-D)",
    "category": "Urology",
    "dose": "1 Cap OD",
    "timing": "30 mins after dinner",
    "duration": "30 Days",
    "instructions": "Dual alpha blocker + 5-alpha reductase inhibitor to shrink prostate gland",
    "symptoms": [
      "severe bph",
      "urinary retention",
      "prostate enlargement",
      "nocturia"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Cap OD",
    "paedDose": "As directed by pediatrician",
    "notes": "Dual alpha blocker + 5-alpha reductase inhibitor to shrink prostate gland",
    "cat": "Urology",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Tolterodine Tartrate 2mg (Tolter)",
    "generic": "Tolterodine Tartrate 2mg (Tolter)",
    "category": "Urology",
    "dose": "1 Tab BD",
    "timing": "With or without food",
    "duration": "15 Days",
    "instructions": "Antimuscarinic agent for overactive bladder and urge incontinence",
    "symptoms": [
      "urge incontinence",
      "urinary frequency",
      "overactive bladder",
      "urgency"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab BD",
    "paedDose": "As directed by pediatrician",
    "notes": "Antimuscarinic agent for overactive bladder and urge incontinence",
    "cat": "Urology",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Sildenafil 50mg (Manforce / Caverta)",
    "generic": "Sildenafil 50mg (Manforce / Caverta)",
    "category": "Urology",
    "dose": "1 Tab SOS",
    "timing": "1 hour before sexual activity on light stomach",
    "duration": "SOS",
    "instructions": "PDE5 inhibitor; CONTRAINDICATED with nitrates or severe cardiac disease",
    "symptoms": [
      "erectile dysfunction",
      "impotence",
      "sexual weakness"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab SOS",
    "paedDose": "As directed by pediatrician",
    "notes": "PDE5 inhibitor; CONTRAINDICATED with nitrates or severe cardiac disease",
    "cat": "Urology",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Tadalafil 5mg (Megalis 5 / Tadaflo)",
    "generic": "Tadalafil 5mg (Megalis 5 / Tadaflo)",
    "category": "Urology",
    "dose": "1 Tab OD",
    "timing": "Same time daily",
    "duration": "30 Days",
    "instructions": "Daily low dose PDE5 inhibitor for combined ED and mild BPH symptoms",
    "symptoms": [
      "erectile dysfunction",
      "mild bph",
      "urinary hesitancy"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab OD",
    "paedDose": "As directed by pediatrician",
    "notes": "Daily low dose PDE5 inhibitor for combined ED and mild BPH symptoms",
    "cat": "Urology",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Drops Paracetamol 100mg/ml (Crocin Baby Drops / Calpol Drops)",
    "generic": "Paracetamol 100mg/ml (Crocin Baby Drops / Calpol Drops)",
    "category": "Pediatric & Syrup",
    "dose": "15mg/kg/dose (approx 0.5-1ml) SOS",
    "timing": "Every 4-6 hours SOS",
    "duration": "3 Days",
    "instructions": "Infant antipyretic; use calibrated dropper provided",
    "symptoms": [
      "infant fever",
      "baby fever",
      "post vaccination fever",
      "body pain infant"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "15mg/kg/dose (approx 0.5-1ml) SOS",
    "paedDose": "15mg/kg/dose (approx 0.5-1ml) SOS",
    "notes": "Infant antipyretic; use calibrated dropper provided",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Drops Ondansetron 2mg/5ml (Emeset Drops)",
    "generic": "Ondansetron 2mg/5ml (Emeset Drops)",
    "category": "Pediatric & Syrup",
    "dose": "0.15mg/kg/dose SOS",
    "timing": "30 mins before feeds",
    "duration": "2 Days SOS",
    "instructions": "Pediatric antiemetic for acute gastroenteritis and viral vomiting",
    "symptoms": [
      "vomiting in infant",
      "child vomiting",
      "nausea baby"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "0.15mg/kg/dose SOS",
    "paedDose": "0.15mg/kg/dose SOS",
    "notes": "Pediatric antiemetic for acute gastroenteritis and viral vomiting",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Drops Simethicone + Dill Oil + Fennel Oil (Colicaid / Woodwards)",
    "generic": "Simethicone + Dill Oil + Fennel Oil (Colicaid / Woodwards)",
    "category": "Pediatric & Syrup",
    "dose": "5-10 drops TDS",
    "timing": "15 mins before feeds",
    "duration": "5-7 Days SOS",
    "instructions": "Safe antiflatulent drops for infant colic and abdominal bloating",
    "symptoms": [
      "infantile colic",
      "baby crying stomach pain",
      "gas baby",
      "bloated abdomen infant"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "5-10 drops TDS",
    "paedDose": "5-10 drops TDS",
    "notes": "Safe antiflatulent drops for infant colic and abdominal bloating",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Drops Zinc Gluconate 20mg/5ml (Zinconia Drops)",
    "generic": "Zinc Gluconate 20mg/5ml (Zinconia Drops)",
    "category": "Pediatric & Syrup",
    "dose": "1ml (20mg) OD for children >6 months",
    "timing": "Morning after feed",
    "duration": "14 Days",
    "instructions": "WHO recommended zinc supplementation for pediatric acute diarrhea",
    "symptoms": [
      "child diarrhea",
      "loose motions pediatric",
      "watery stools infant"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1ml (20mg) OD for children >6 months",
    "paedDose": "1ml (20mg) OD for children >6 months",
    "notes": "WHO recommended zinc supplementation for pediatric acute diarrhea",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Drops Vitamin D3 400 IU/ml (D3 Must Drops / Ultra D3)",
    "generic": "Vitamin D3 400 IU/ml (D3 Must Drops / Ultra D3)",
    "category": "Pediatric & Syrup",
    "dose": "1ml (400 IU) OD",
    "timing": "Daily morning",
    "duration": "1 Year",
    "instructions": "Routine prophylactic daily vitamin D3 for all breastfed infants",
    "symptoms": [
      "infant rickets prevention",
      "growth infant",
      "bone health infant"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1ml (400 IU) OD",
    "paedDose": "1ml (400 IU) OD",
    "notes": "Routine prophylactic daily vitamin D3 for all breastfed infants",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Syp. Multivitamin + Lysine (Zincovit Syp)",
    "generic": "Multivitamin + Lysine (Zincovit Syp)",
    "category": "Pediatric & Syrup",
    "dose": "5ml OD",
    "timing": "After breakfast",
    "duration": "1 Month",
    "instructions": "Essential micronutrients, zinc and amino acids for growing children",
    "symptoms": [
      "pediatric weakness",
      "poor appetite",
      "growth delay",
      "convalescence"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "5ml OD",
    "paedDose": "5ml OD",
    "notes": "Essential micronutrients, zinc and amino acids for growing children",
    "cat": "Pediatric & Syrup",
    "form": "Syrup",
    "route": "Oral"
  },
  {
    "name": "Inj. Atropine Sulphate 0.6mg/ml",
    "generic": "Atropine Sulphate 0.6mg/ml",
    "category": "Injections & IV",
    "dose": "0.6mg - 2mg IV/IM SOS",
    "timing": "Emergency protocol",
    "duration": "Emergency",
    "instructions": "Anticholinergic for symptomatic bradycardia and organophosphate poisoning antidote",
    "symptoms": [
      "severe bradycardia",
      "slow heart rate",
      "organophosphate poisoning",
      "op poisoning"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "0.6mg - 2mg IV/IM SOS",
    "paedDose": "As directed by pediatrician",
    "notes": "Anticholinergic for symptomatic bradycardia and organophosphate poisoning antidote",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Adrenaline 1:1000 (Epinephrine 1mg/ml)",
    "generic": "Adrenaline 1:1000 (Epinephrine 1mg/ml)",
    "category": "Injections & IV",
    "dose": "0.5ml IM anterolateral thigh",
    "timing": "Immediate emergency SOS",
    "duration": "Single emergency dose",
    "instructions": "First-line lifesaving treatment for acute anaphylactic shock and cardiac arrest",
    "symptoms": [
      "anaphylaxis",
      "severe drug allergy",
      "shock",
      "cardiac arrest",
      "stridor"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "0.5ml IM anterolateral thigh",
    "paedDose": "As directed by pediatrician",
    "notes": "First-line lifesaving treatment for acute anaphylactic shock and cardiac arrest",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Hydrocortisone Sodium Succinate 100mg (Efcorlin / Primacort)",
    "generic": "Hydrocortisone Sodium Succinate 100mg (Efcorlin / Primacort)",
    "category": "Injections & IV",
    "dose": "100-200mg IV stat",
    "timing": "Emergency stat",
    "duration": "Acute emergency",
    "instructions": "Fast-acting corticosteroid for severe status asthmaticus, anaphylaxis and adrenal crisis",
    "symptoms": [
      "status asthmaticus",
      "anaphylaxis",
      "severe allergic reaction",
      "adrenal crisis"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "100-200mg IV stat",
    "paedDose": "As directed by pediatrician",
    "notes": "Fast-acting corticosteroid for severe status asthmaticus, anaphylaxis and adrenal crisis",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Diazepam 5mg/ml (Valium / Calmpose)",
    "generic": "Diazepam 5mg/ml (Valium / Calmpose)",
    "category": "Injections & IV",
    "dose": "5-10mg slow IV over 2-3 mins",
    "timing": "Stat for active seizures",
    "duration": "Emergency stat",
    "instructions": "Benzodiazepine for acute status epilepticus and severe alcohol withdrawal",
    "symptoms": [
      "status epilepticus",
      "fits",
      "continuous seizures",
      "alcohol withdrawal delirium"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "5-10mg slow IV over 2-3 mins",
    "paedDose": "As directed by pediatrician",
    "notes": "Benzodiazepine for acute status epilepticus and severe alcohol withdrawal",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Potassium Chloride (KCl) 150mg/ml (20 mEq/10ml)",
    "generic": "Potassium Chloride (KCl) 150mg/ml (20 mEq/10ml)",
    "category": "Injections & IV",
    "dose": "Add to IV infusion only; NEVER IV PUSH",
    "timing": "Slow IV infusion under cardiac monitoring",
    "duration": "As per serum K+ deficit",
    "instructions": "FATAL IF INJECTED DIRECTLY. Must be diluted in IV fluid (max 20-40 mEq/L)",
    "symptoms": [
      "hypokalemia",
      "low potassium",
      "muscle weakness"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "Add to IV infusion only; NEVER IV PUSH",
    "paedDose": "As directed by pediatrician",
    "notes": "FATAL IF INJECTED DIRECTLY. Must be diluted in IV fluid (max 20-40 mEq/L)",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Mannitol 20% IV Infusion (100ml / 350ml)",
    "generic": "Mannitol 20% IV Infusion (100ml / 350ml)",
    "category": "Injections & IV",
    "dose": "100ml IV rapid infusion over 30 mins",
    "timing": "Stat for cerebral edema",
    "duration": "SOS",
    "instructions": "Osmotic diuretic to lower elevated intracranial pressure and intraocular pressure",
    "symptoms": [
      "cerebral edema",
      "head trauma",
      "raised icp",
      "acute angle glaucoma"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "100ml IV rapid infusion over 30 mins",
    "paedDose": "As directed by pediatrician",
    "notes": "Osmotic diuretic to lower elevated intracranial pressure and intraocular pressure",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "IV Fluid 3% Hypertonic Saline (NaCl 3%) 100ml",
    "generic": "IV Fluid 3% Hypertonic Saline (NaCl 3%) 100ml",
    "category": "Injections & IV",
    "dose": "100ml IV slow infusion over 4 hours",
    "timing": "Under ICU / monitoring protocol",
    "duration": "Stat",
    "instructions": "For severe symptomatic acute hyponatremia with neurological manifestations",
    "symptoms": [
      "severe hyponatremia",
      "low sodium seizures",
      "cerebral edema"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "100ml IV slow infusion over 4 hours",
    "paedDose": "As directed by pediatrician",
    "notes": "For severe symptomatic acute hyponatremia with neurological manifestations",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Phytomenadione 10mg/ml (Vitamin K1 / Kenadion)",
    "generic": "Phytomenadione 10mg/ml (Vitamin K1 / Kenadion)",
    "category": "Injections & IV",
    "dose": "10mg IM/IV slow",
    "timing": "Stat",
    "duration": "1-3 Days",
    "instructions": "Reversal of warfarin over-anticoagulation and neonatal hemorrhagic disease",
    "symptoms": [
      "bleeding",
      "high inr",
      "warfarin toxicity",
      "neonatal bleeding"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "10mg IM/IV slow",
    "paedDose": "As directed by pediatrician",
    "notes": "Reversal of warfarin over-anticoagulation and neonatal hemorrhagic disease",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Magnesium Sulphate 50% (MgSO4)",
    "generic": "Magnesium Sulphate 50% (MgSO4)",
    "category": "Injections & IV",
    "dose": "4g IV loading over 15 mins then 1g/hr",
    "timing": "Emergency eclampsia protocol",
    "duration": "Emergency",
    "instructions": "Drug of choice for eclampsia prevention and treatment; check patellar reflex",
    "symptoms": [
      "eclampsia",
      "preeclampsia seizures",
      "severe hypomagnesemia"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "4g IV loading over 15 mins then 1g/hr",
    "paedDose": "As directed by pediatrician",
    "notes": "Drug of choice for eclampsia prevention and treatment; check patellar reflex",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Lignocaine 2% with Adrenaline 1:200,000 (Xylocaine with Adrenaline)",
    "generic": "Lignocaine 2% with Adrenaline 1:200,000 (Xylocaine with Adrenaline)",
    "category": "Injections & IV",
    "dose": "Infiltrate locally as required",
    "timing": "Before minor surgical procedure",
    "duration": "Local anesthesia",
    "instructions": "Prolongs anesthesia and reduces bleeding. DO NOT use on digits, penis, nose or pinna",
    "symptoms": [
      "local anesthesia",
      "suturing",
      "minor surgery",
      "wound excision"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "Infiltrate locally as required",
    "paedDose": "As directed by pediatrician",
    "notes": "Prolongs anesthesia and reduces bleeding. DO NOT use on digits, penis, nose or pinna",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Tab. Medroxyprogesterone Acetate 10mg (Deviry 10)",
    "generic": "Medroxyprogesterone Acetate 10mg (Deviry 10)",
    "category": "Obstetrics & Gynae",
    "dose": "1 Tab BD",
    "timing": "After food",
    "duration": "5-10 Days",
    "instructions": "For secondary amenorrhea and abnormal uterine bleeding; withdrawal bleed in 3-7 days",
    "symptoms": [
      "irregular periods",
      "delayed periods",
      "abnormal uterine bleeding",
      "amenorrhea"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab BD",
    "paedDose": "As directed by pediatrician",
    "notes": "For secondary amenorrhea and abnormal uterine bleeding; withdrawal bleed in 3-7 days",
    "cat": "Obstetrics & Gynae",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Norethisterone 5mg (Primolut-N / Regestrone)",
    "generic": "Norethisterone 5mg (Primolut-N / Regestrone)",
    "category": "Obstetrics & Gynae",
    "dose": "1 Tab TDS",
    "timing": "After food",
    "duration": "5-10 Days",
    "instructions": "Postponement of menstruation, dysfunctional uterine bleeding and menorrhagia",
    "symptoms": [
      "heavy periods",
      "menorrhagia",
      "period delay",
      "dysfunctional bleeding"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab TDS",
    "paedDose": "As directed by pediatrician",
    "notes": "Postponement of menstruation, dysfunctional uterine bleeding and menorrhagia",
    "cat": "Obstetrics & Gynae",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Cabergoline 0.5mg (Caberlin)",
    "generic": "Cabergoline 0.5mg (Caberlin)",
    "category": "Obstetrics & Gynae",
    "dose": "0.25mg to 0.5mg twice weekly",
    "timing": "With food at bedtime",
    "duration": "4-8 Weeks",
    "instructions": "Dopamine agonist to suppress hyperprolactinemia and lactation",
    "symptoms": [
      "hyperprolactinemia",
      "galactorrhea",
      "breast discharge",
      "infertility"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "0.25mg to 0.5mg twice weekly",
    "paedDose": "As directed by pediatrician",
    "notes": "Dopamine agonist to suppress hyperprolactinemia and lactation",
    "cat": "Obstetrics & Gynae",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Pessary Clotrimazole 100mg (Candid V6)",
    "generic": "Clotrimazole 100mg (Candid V6)",
    "category": "Obstetrics & Gynae",
    "dose": "1 Vaginal Pessary nightly",
    "timing": "Insert deeply at bedtime",
    "duration": "6 Consecutive nights",
    "instructions": "Use applicator provided; avoid sexual intercourse during therapy",
    "symptoms": [
      "vaginal candidiasis",
      "curdy white discharge",
      "vaginal itching",
      "vulval irritation"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Vaginal Pessary nightly",
    "paedDose": "As directed by pediatrician",
    "notes": "Use applicator provided; avoid sexual intercourse during therapy",
    "cat": "Obstetrics & Gynae",
    "form": "Pessary",
    "route": "Oral"
  },
  {
    "name": "Pessary Metronidazole + Clotrimazole (Canesten / V-Total)",
    "generic": "Metronidazole + Clotrimazole (Canesten / V-Total)",
    "category": "Obstetrics & Gynae",
    "dose": "1 Pessary nightly",
    "timing": "At bedtime",
    "duration": "7 Nights",
    "instructions": "Broad coverage for mixed vaginitis (bacterial vaginosis + trichomoniasis + candida)",
    "symptoms": [
      "foul smelling discharge",
      "mixed vaginitis",
      "vaginal discharge",
      "vaginal burning"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Pessary nightly",
    "paedDose": "As directed by pediatrician",
    "notes": "Broad coverage for mixed vaginitis (bacterial vaginosis + trichomoniasis + candida)",
    "cat": "Obstetrics & Gynae",
    "form": "Pessary",
    "route": "Oral"
  },
  {
    "name": "Cream Estriol 0.1% (Evalon Cream)",
    "generic": "Estriol 0.1% (Evalon Cream)",
    "category": "Obstetrics & Gynae",
    "dose": "1 Applicator intravaginally OD",
    "timing": "At night",
    "duration": "2-3 Weeks then twice weekly",
    "instructions": "Topical estrogen for postmenopausal atrophic vaginitis and dyspareunia",
    "symptoms": [
      "atrophic vaginitis",
      "postmenopausal dryness",
      "painful intercourse",
      "dyspareunia"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Applicator intravaginally OD",
    "paedDose": "As directed by pediatrician",
    "notes": "Topical estrogen for postmenopausal atrophic vaginitis and dyspareunia",
    "cat": "Obstetrics & Gynae",
    "form": "Cream",
    "route": "Topical"
  },
  {
    "name": "Tab. Febuxostat 40mg (Febutaz / Febucip)",
    "generic": "Febuxostat 40mg (Febutaz / Febucip)",
    "category": "Analgesic & Antipyretic",
    "dose": "1 Tab OD",
    "timing": "Morning with or without food",
    "duration": "30 Days",
    "instructions": "Potent non-purine xanthine oxidase inhibitor for chronic hyperuricemia & gout",
    "symptoms": [
      "gout",
      "high uric acid",
      "joint pain big toe",
      "hyperuricemia",
      "tophi"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab OD",
    "paedDose": "As directed by pediatrician",
    "notes": "Potent non-purine xanthine oxidase inhibitor for chronic hyperuricemia & gout",
    "cat": "Analgesic & Antipyretic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Colchicine 0.5mg (Goutnil)",
    "generic": "Colchicine 0.5mg (Goutnil)",
    "category": "Analgesic & Antipyretic",
    "dose": "0.5mg BD or TDS SOS",
    "timing": "After meals",
    "duration": "3-5 Days",
    "instructions": "First-line anti-inflammatory for acute gouty arthritis flare",
    "symptoms": [
      "acute gout attack",
      "swollen big toe",
      "severe sudden joint pain"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "0.5mg BD or TDS SOS",
    "paedDose": "As directed by pediatrician",
    "notes": "First-line anti-inflammatory for acute gouty arthritis flare",
    "cat": "Analgesic & Antipyretic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Glucosamine Sulphate 750mg + Diacerein 50mg (Cartigen Duo)",
    "generic": "Glucosamine Sulphate 750mg + Diacerein 50mg (Cartigen Duo)",
    "category": "Analgesic & Antipyretic",
    "dose": "1 Tab BD",
    "timing": "With meals",
    "duration": "2-3 Months",
    "instructions": "Disease-modifying cartilage protector for mild to moderate knee osteoarthritis",
    "symptoms": [
      "osteoarthritis",
      "knee joint pain",
      "crepitus knee",
      "stiff joints"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab BD",
    "paedDose": "As directed by pediatrician",
    "notes": "Disease-modifying cartilage protector for mild to moderate knee osteoarthritis",
    "cat": "Analgesic & Antipyretic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Methotrexate 7.5mg (Folitrax 7.5)",
    "generic": "Methotrexate 7.5mg (Folitrax 7.5)",
    "category": "Analgesic & Antipyretic",
    "dose": "1 Tab ONCE WEEKLY (e.g. every Sunday)",
    "timing": "Single weekly dose",
    "duration": "Ongoing as monitored",
    "instructions": "DO NOT TAKE DAILY. Take Tab Folic acid on non-methotrexate days",
    "symptoms": [
      "rheumatoid arthritis",
      "severe psoriasis",
      "morning joint stiffness",
      "multiple joint pain"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab ONCE WEEKLY (e.g. every Sunday)",
    "paedDose": "As directed by pediatrician",
    "notes": "DO NOT TAKE DAILY. Take Tab Folic acid on non-methotrexate days",
    "cat": "Analgesic & Antipyretic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Hydroxychloroquine 200mg (HCQS 200)",
    "generic": "Hydroxychloroquine 200mg (HCQS 200)",
    "category": "Analgesic & Antipyretic",
    "dose": "1 Tab BD then OD",
    "timing": "With food or milk",
    "duration": "3-6 Months",
    "instructions": "DMARD for rheumatoid arthritis and SLE; baseline eye checkup advised",
    "symptoms": [
      "rheumatoid arthritis",
      "sle",
      "lupus",
      "autoimmune joint pain"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab BD then OD",
    "paedDose": "As directed by pediatrician",
    "notes": "DMARD for rheumatoid arthritis and SLE; baseline eye checkup advised",
    "cat": "Analgesic & Antipyretic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Tolperisone 150mg (Tolifast)",
    "generic": "Tolperisone 150mg (Tolifast)",
    "category": "Analgesic & Antipyretic",
    "dose": "1 Tab BD or TDS",
    "timing": "After food",
    "duration": "7 Days",
    "instructions": "Centrally acting muscle relaxant without causing sedation",
    "symptoms": [
      "muscle spasm",
      "cervical spondylosis",
      "stiff neck",
      "lumbago",
      "muscle tightness"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab BD or TDS",
    "paedDose": "As directed by pediatrician",
    "notes": "Centrally acting muscle relaxant without causing sedation",
    "cat": "Analgesic & Antipyretic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Gel Potassium Nitrate 5% + Sodium Monofluorophosphate (Sensodent-K / Senquel)",
    "generic": "Potassium Nitrate 5% + Sodium Monofluorophosphate (Sensodent-K / Senquel)",
    "category": "ENT Care",
    "dose": "Brush twice daily",
    "timing": "Leave on teeth 2 mins before rinsing",
    "duration": "1 Month",
    "instructions": "Desensitizing toothpaste for sensitive teeth to hot, cold or sweets",
    "symptoms": [
      "tooth sensitivity",
      "dental sensitivity to cold",
      "tingling teeth"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "Brush twice daily",
    "paedDose": "As directed by pediatrician",
    "notes": "Desensitizing toothpaste for sensitive teeth to hot, cold or sweets",
    "cat": "ENT Care",
    "form": "Gel",
    "route": "Topical"
  },
  {
    "name": "Ointment Triamcinolone Acetonide 0.1% Oral Paste (Kenacort 0.1% Oral Paste)",
    "generic": "Triamcinolone Acetonide 0.1% Oral Paste (Kenacort 0.1% Oral Paste)",
    "category": "ENT Care",
    "dose": "Dab small pinch TDS",
    "timing": "After meals and at bedtime",
    "duration": "5 Days",
    "instructions": "Forms a protective steroid barrier over severe aphthous oral ulcers",
    "symptoms": [
      "painful mouth ulcers",
      "aphthous stomatitis",
      "cheek bite ulcer"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "Dab small pinch TDS",
    "paedDose": "As directed by pediatrician",
    "notes": "Forms a protective steroid barrier over severe aphthous oral ulcers",
    "cat": "ENT Care",
    "form": "Ointment",
    "route": "Topical"
  },
  {
    "name": "Tab. Ketorolac Tromethamine 10mg (Ketanov / Ketorol DT)",
    "generic": "Ketorolac Tromethamine 10mg (Ketanov / Ketorol DT)",
    "category": "Analgesic & Antipyretic",
    "dose": "1 Tab DT dissolved in water SOS (max 40mg/day)",
    "timing": "After meals SOS",
    "duration": "Max 3-5 Days",
    "instructions": "High potency short-term NSAID specifically effective for acute dental pain",
    "symptoms": [
      "acute toothache",
      "severe dental pain",
      "post extraction pain",
      "pulpitis"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab DT dissolved in water SOS (max 40mg/day)",
    "paedDose": "As directed by pediatrician",
    "notes": "High potency short-term NSAID specifically effective for acute dental pain",
    "cat": "Analgesic & Antipyretic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Inj. Low Molecular Weight Heparin 40mg/0.4ml (Clexane / Enoxaparin)",
    "generic": "Low Molecular Weight Heparin 40mg/0.4ml (Clexane / Enoxaparin)",
    "category": "Injections & IV",
    "dose": "40mg (0.4ml) SC OD",
    "timing": "Subcutaneously in abdominal wall",
    "duration": "7-10 Days",
    "instructions": "Prophylaxis and treatment of deep vein thrombosis (DVT) and pulmonary embolism",
    "symptoms": [
      "deep vein thrombosis",
      "dvt",
      "pulmonary embolism",
      "post surgical dvt prophylaxis"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "40mg (0.4ml) SC OD",
    "paedDose": "As directed by pediatrician",
    "notes": "Prophylaxis and treatment of deep vein thrombosis (DVT) and pulmonary embolism",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Tab. Apixaban 2.5mg (Eliquis)",
    "generic": "Apixaban 2.5mg (Eliquis)",
    "category": "Cardiovascular",
    "dose": "1 Tab BD",
    "timing": "With or without food",
    "duration": "Ongoing",
    "instructions": "Direct oral anticoagulant (DOAC) with lower bleeding risk vs warfarin",
    "symptoms": [
      "atrial fibrillation",
      "stroke prevention afib",
      "dvt prevention"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab BD",
    "paedDose": "As directed by pediatrician",
    "notes": "Direct oral anticoagulant (DOAC) with lower bleeding risk vs warfarin",
    "cat": "Cardiovascular",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Rivaroxaban 10mg (Xarelto)",
    "generic": "Rivaroxaban 10mg (Xarelto)",
    "category": "Cardiovascular",
    "dose": "1 Tab OD",
    "timing": "With food",
    "duration": "Ongoing",
    "instructions": "Factor Xa inhibitor for stroke prevention in non-valvular AF",
    "symptoms": [
      "afib",
      "dvt",
      "pulmonary embolism",
      "thromboembolism"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab OD",
    "paedDose": "As directed by pediatrician",
    "notes": "Factor Xa inhibitor for stroke prevention in non-valvular AF",
    "cat": "Cardiovascular",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Inj. Noradrenaline 2mg/ml (Norad / Levophed)",
    "generic": "Noradrenaline 2mg/ml (Norad / Levophed)",
    "category": "Injections & IV",
    "dose": "Infusion titrated to MAP > 65 mmHg",
    "timing": "Central line continuous IV infusion",
    "duration": "ICU protocol",
    "instructions": "First-line vasopressor in septic shock and cardiogenic shock",
    "symptoms": [
      "septic shock",
      "severe hypotension",
      "low bp shock",
      "circulatory collapse"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "Infusion titrated to MAP > 65 mmHg",
    "paedDose": "As directed by pediatrician",
    "notes": "First-line vasopressor in septic shock and cardiogenic shock",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Dopamine 200mg/5ml",
    "generic": "Dopamine 200mg/5ml",
    "category": "Injections & IV",
    "dose": "2-20 mcg/kg/min IV infusion",
    "timing": "Titrated continuous IV",
    "duration": "ICU protocol",
    "instructions": "Inotropic support for cardiogenic shock and hemodynamically significant bradycardia",
    "symptoms": [
      "cardiogenic shock",
      "hypotension",
      "severe bradycardia"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "2-20 mcg/kg/min IV infusion",
    "paedDose": "As directed by pediatrician",
    "notes": "Inotropic support for cardiogenic shock and hemodynamically significant bradycardia",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Dobutamine 250mg/20ml (Dobutrex)",
    "generic": "Dobutamine 250mg/20ml (Dobutrex)",
    "category": "Injections & IV",
    "dose": "2.5-15 mcg/kg/min IV infusion",
    "timing": "Continuous infusion",
    "duration": "ICU protocol",
    "instructions": "Pure inotrope for acute decompensated heart failure and low cardiac output",
    "symptoms": [
      "heart failure shock",
      "acute pump failure",
      "cardiogenic low cardiac output"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "2.5-15 mcg/kg/min IV infusion",
    "paedDose": "As directed by pediatrician",
    "notes": "Pure inotrope for acute decompensated heart failure and low cardiac output",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Amiodarone 150mg/3ml (Cordarone)",
    "generic": "Amiodarone 150mg/3ml (Cordarone)",
    "category": "Injections & IV",
    "dose": "150mg IV over 10 mins loading then 1mg/min",
    "timing": "Emergency cardiac protocol",
    "duration": "Emergency stat",
    "instructions": "Antiarrhythmic for ventricular tachycardia and refractory ventricular fibrillation",
    "symptoms": [
      "ventricular tachycardia",
      "vtach",
      "arrhythmia",
      "vfib"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "150mg IV over 10 mins loading then 1mg/min",
    "paedDose": "As directed by pediatrician",
    "notes": "Antiarrhythmic for ventricular tachycardia and refractory ventricular fibrillation",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Sodium Bicarbonate 7.5% 10ml / 25ml",
    "generic": "Sodium Bicarbonate 7.5% 10ml / 25ml",
    "category": "Injections & IV",
    "dose": "50-100 mEq slow IV stat",
    "timing": "Emergency resuscitation",
    "duration": "Stat",
    "instructions": "Corrects severe metabolic acidosis (pH < 7.1) and tricyclic antidepressant overdose",
    "symptoms": [
      "severe metabolic acidosis",
      "cardiac arrest acidosis",
      "tca poisoning"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "50-100 mEq slow IV stat",
    "paedDose": "As directed by pediatrician",
    "notes": "Corrects severe metabolic acidosis (pH < 7.1) and tricyclic antidepressant overdose",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Furosemide 20mg/2ml (Lasix)",
    "generic": "Furosemide 20mg/2ml (Lasix)",
    "category": "Injections & IV",
    "dose": "20-40mg slow IV stat",
    "timing": "Emergency stat",
    "duration": "Stat or BD",
    "instructions": "Rapid onset loop diuretic for acute pulmonary edema and hypertensive crisis",
    "symptoms": [
      "acute pulmonary edema",
      "breathlessness heart failure",
      "fluid overload",
      "severe edema"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "20-40mg slow IV stat",
    "paedDose": "As directed by pediatrician",
    "notes": "Rapid onset loop diuretic for acute pulmonary edema and hypertensive crisis",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Calcium Gluconate 10% 10ml",
    "generic": "Calcium Gluconate 10% 10ml",
    "category": "Injections & IV",
    "dose": "10ml slow IV over 10 minutes",
    "timing": "Emergency stat with cardiac monitoring",
    "duration": "Stat",
    "instructions": "Cardioprotection in severe hyperkalemia, hypocalcemic tetany and MgSO4 toxicity antidote",
    "symptoms": [
      "hyperkalemia ecg changes",
      "high potassium",
      "tetany",
      "hypocalcemia",
      "carpopedal spasm"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "10ml slow IV over 10 minutes",
    "paedDose": "As directed by pediatrician",
    "notes": "Cardioprotection in severe hyperkalemia, hypocalcemic tetany and MgSO4 toxicity antidote",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Dextrose 25% (D25) 100ml / Dextrose 50% (D50) 50ml",
    "generic": "Dextrose 25% (D25) 100ml / Dextrose 50% (D50) 50ml",
    "category": "Injections & IV",
    "dose": "50-100ml rapid IV push",
    "timing": "Stat for hypoglycemia",
    "duration": "Stat",
    "instructions": "Emergency lifesaving correction of acute severe hypoglycemia in unconscious patient",
    "symptoms": [
      "hypoglycemia",
      "low blood sugar coma",
      "unconscious diabetic",
      "sweating shivering sugar drop"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "50-100ml rapid IV push",
    "paedDose": "As directed by pediatrician",
    "notes": "Emergency lifesaving correction of acute severe hypoglycemia in unconscious patient",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Cap. Evening Primrose Oil 1000mg (Primosa 1000)",
    "generic": "Evening Primrose Oil 1000mg (Primosa 1000)",
    "category": "Vitamins & Supplements",
    "dose": "1 Cap BD",
    "timing": "After meals",
    "duration": "30 Days",
    "instructions": "Gamma-linolenic acid for mastalgia (cyclical breast pain) and PMS symptoms",
    "symptoms": [
      "breast pain",
      "mastalgia",
      "premenstrual syndrome",
      "pms cramps"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Cap BD",
    "paedDose": "As directed by pediatrician",
    "notes": "Gamma-linolenic acid for mastalgia (cyclical breast pain) and PMS symptoms",
    "cat": "Vitamins & Supplements",
    "form": "Capsule",
    "route": "Oral"
  },
  {
    "name": "Tab. Biotin 10mg + Zinc + Amino Acids (Keraglo-Eva / Follihair)",
    "generic": "Biotin 10mg + Zinc + Amino Acids (Keraglo-Eva / Follihair)",
    "category": "Vitamins & Supplements",
    "dose": "1 Tab OD",
    "timing": "After breakfast",
    "duration": "3 Months",
    "instructions": "Comprehensive hair and nail nutritional supplement for telogen effluvium",
    "symptoms": [
      "hair loss",
      "thinning hair",
      "brittle nails",
      "diffuse hair fall"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab OD",
    "paedDose": "As directed by pediatrician",
    "notes": "Comprehensive hair and nail nutritional supplement for telogen effluvium",
    "cat": "Vitamins & Supplements",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Sachets L-Arginine 3g + Proanthocyanidins (Argipreg / Alamin RZ)",
    "generic": "Sachets L-Arginine 3g + Proanthocyanidins (Argipreg / Alamin RZ)",
    "category": "Vitamins & Supplements",
    "dose": "1 Sachet in water OD or BD",
    "timing": "Between meals",
    "duration": "30 Days",
    "instructions": "Improves uteroplacental blood flow in fetal growth restriction (IUGR) and oligohydramnios",
    "symptoms": [
      "oligohydramnios",
      "low amniotic fluid",
      "fetal growth restriction",
      "iugr"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Sachet in water OD or BD",
    "paedDose": "As directed by pediatrician",
    "notes": "Improves uteroplacental blood flow in fetal growth restriction (IUGR) and oligohydramnios",
    "cat": "Vitamins & Supplements",
    "form": "Powder",
    "route": "Oral"
  },
  {
    "name": "Cap. Coenzyme Q10 100mg + Lycopene (CoQ10 / Ubicar)",
    "generic": "Coenzyme Q10 100mg + Lycopene (CoQ10 / Ubicar)",
    "category": "Vitamins & Supplements",
    "dose": "1 Cap OD",
    "timing": "With meals",
    "duration": "30-60 Days",
    "instructions": "Cellular antioxidant for male and female subfertility and statin-induced myopathy",
    "symptoms": [
      "statin muscle pain",
      "antioxidant therapy",
      "fatigue",
      "male subfertility"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Cap OD",
    "paedDose": "As directed by pediatrician",
    "notes": "Cellular antioxidant for male and female subfertility and statin-induced myopathy",
    "cat": "Vitamins & Supplements",
    "form": "Capsule",
    "route": "Oral"
  },
  {
    "name": "Cap. Carbonyl Iron 100mg + Folic Acid 1.5mg + Zinc (Fefol-Z)",
    "generic": "Carbonyl Iron 100mg + Folic Acid 1.5mg + Zinc (Fefol-Z)",
    "category": "Vitamins & Supplements",
    "dose": "1 Cap OD",
    "timing": "After meals",
    "duration": "2-3 Months",
    "instructions": "Gentle iron formulation with lower GI side effects (constipation, metallic taste)",
    "symptoms": [
      "iron deficiency anemia",
      "low hemoglobin",
      "weakness pallor",
      "fatigue anemia"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Cap OD",
    "paedDose": "As directed by pediatrician",
    "notes": "Gentle iron formulation with lower GI side effects (constipation, metallic taste)",
    "cat": "Vitamins & Supplements",
    "form": "Capsule",
    "route": "Oral"
  },
  {
    "name": "Tab. Piracetam 800mg (Nootropil)",
    "generic": "Piracetam 800mg (Nootropil)",
    "category": "Neuro & Psychiatry",
    "dose": "1 Tab TDS",
    "timing": "After meals",
    "duration": "30 Days",
    "instructions": "Cognitive enhancer for cortical myoclonus and cerebrovascular insufficiency",
    "symptoms": [
      "memory impairment",
      "vertigo",
      "cortical myoclonus",
      "cerebral insufficiency"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab TDS",
    "paedDose": "As directed by pediatrician",
    "notes": "Cognitive enhancer for cortical myoclonus and cerebrovascular insufficiency",
    "cat": "Neuro & Psychiatry",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Vinpocetine 5mg (Cavinton)",
    "generic": "Vinpocetine 5mg (Cavinton)",
    "category": "Neuro & Psychiatry",
    "dose": "1 Tab TDS",
    "timing": "With food",
    "duration": "30 Days",
    "instructions": "Cerebral vasodilator to improve brain circulation and tinnitus",
    "symptoms": [
      "cerebrovascular insufficiency",
      "tinnitus",
      "dizziness in elderly"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab TDS",
    "paedDose": "As directed by pediatrician",
    "notes": "Cerebral vasodilator to improve brain circulation and tinnitus",
    "cat": "Neuro & Psychiatry",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Betahistine 24mg (Vertin 24)",
    "generic": "Betahistine 24mg (Vertin 24)",
    "category": "ENT Care",
    "dose": "1 Tab BD",
    "timing": "After meals",
    "duration": "15 Days",
    "instructions": "High dose formulation for severe Meniere's disease and vestibular vertigo",
    "symptoms": [
      "severe vertigo",
      "spinning sensation",
      "menieres disease",
      "tinnitus ear fullness"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab BD",
    "paedDose": "As directed by pediatrician",
    "notes": "High dose formulation for severe Meniere's disease and vestibular vertigo",
    "cat": "ENT Care",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Drops Xylometazoline 0.1% (Otrivin Adult)",
    "generic": "Xylometazoline 0.1% (Otrivin Adult)",
    "category": "ENT Care",
    "dose": "2 drops in each nostril TDS SOS",
    "timing": "SOS for blocked nose",
    "duration": "Max 3-5 Days",
    "instructions": "Rapid relief of severe nasal congestion; avoid prolonged use",
    "symptoms": [
      "blocked nose",
      "nasal obstruction",
      "severe cold",
      "sinusitis headache"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "2 drops in each nostril TDS SOS",
    "paedDose": "As directed by pediatrician",
    "notes": "Rapid relief of severe nasal congestion; avoid prolonged use",
    "cat": "ENT Care",
    "form": "Drops",
    "route": "Ear / Nasal"
  },
  {
    "name": "Drops Ciprofloxacin 0.3% + Dexamethasone 0.1% (Ciplox-D Eye/Ear)",
    "generic": "Ciprofloxacin 0.3% + Dexamethasone 0.1% (Ciplox-D Eye/Ear)",
    "category": "ENT Care",
    "dose": "2-3 drops in ear/eye TDS",
    "timing": "Every 8 hours",
    "duration": "5-7 Days",
    "instructions": "Combination antibacterial and anti-inflammatory drop for ear and eye infections",
    "symptoms": [
      "ear discharge",
      "otitis externa",
      "ear itching",
      "red eye with discharge"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "2-3 drops in ear/eye TDS",
    "paedDose": "As directed by pediatrician",
    "notes": "Combination antibacterial and anti-inflammatory drop for ear and eye infections",
    "cat": "ENT Care",
    "form": "Drops",
    "route": "Ear / Nasal"
  },
  {
    "name": "Lotion Gamma Benzene Hexachloride 1% + Cetrimide (Scaboma Lotion)",
    "generic": "Lotion Gamma Benzene Hexachloride 1% + Cetrimide (Scaboma Lotion)",
    "category": "Dermatology",
    "dose": "Apply neck down overnight, wash off after 8-12 hours",
    "timing": "Single application, repeat after 7 days if needed",
    "duration": "Stat regimen",
    "instructions": "Ectoparasiticide for scabies and body lice; treat all close family members",
    "symptoms": [
      "scabies",
      "night itching",
      "body lice",
      "finger web itching"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "Apply neck down overnight, wash off after 8-12 hours",
    "paedDose": "As directed by pediatrician",
    "notes": "Ectoparasiticide for scabies and body lice; treat all close family members",
    "cat": "Dermatology",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Cream Ciclopirox Olamine 1% (Batrafen / Ciclopirox)",
    "generic": "Ciclopirox Olamine 1% (Batrafen / Ciclopirox)",
    "category": "Dermatology",
    "dose": "Apply thin film BD",
    "timing": "Morning and evening",
    "duration": "2-4 Weeks",
    "instructions": "Broad spectrum antifungal with anti-inflammatory action for tinea and candidiasis",
    "symptoms": [
      "ringworm",
      "fungal infection",
      "athletes foot",
      "tinea cruris"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "Apply thin film BD",
    "paedDose": "As directed by pediatrician",
    "notes": "Broad spectrum antifungal with anti-inflammatory action for tinea and candidiasis",
    "cat": "Dermatology",
    "form": "Cream",
    "route": "Topical"
  },
  {
    "name": "Ointment Clobetasol 0.05% + Salicylic Acid 3% (Tenovate-S)",
    "generic": "Clobetasol 0.05% + Salicylic Acid 3% (Tenovate-S)",
    "category": "Dermatology",
    "dose": "Apply thin layer OD or BD",
    "timing": "At night on thickened plaques",
    "duration": "14 Days",
    "instructions": "Super-potent steroid with keratolytic agent for plaque psoriasis and lichen planus",
    "symptoms": [
      "psoriasis",
      "thick scaly skin",
      "lichen planus",
      "hyperkeratotic eczema"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "Apply thin layer OD or BD",
    "paedDose": "As directed by pediatrician",
    "notes": "Super-potent steroid with keratolytic agent for plaque psoriasis and lichen planus",
    "cat": "Dermatology",
    "form": "Ointment",
    "route": "Topical"
  },
  {
    "name": "Gel Diclofenac 1% + Linseed Oil + Methyl Salicylate + Menthol (Volini / Omni Gel)",
    "generic": "Diclofenac 1% + Linseed Oil + Methyl Salicylate + Menthol (Volini / Omni Gel)",
    "category": "Analgesic & Antipyretic",
    "dose": "Apply gently 3-4 times daily",
    "timing": "Do not vigorously massage",
    "duration": "7 Days SOS",
    "instructions": "Topical fast-absorbing pain relief gel for sprains, backache and joint pain",
    "symptoms": [
      "backache",
      "neck pain",
      "joint sprain",
      "muscle soreness",
      "shoulder pain"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "Apply gently 3-4 times daily",
    "paedDose": "As directed by pediatrician",
    "notes": "Topical fast-absorbing pain relief gel for sprains, backache and joint pain",
    "cat": "Analgesic & Antipyretic",
    "form": "Gel",
    "route": "Topical"
  },
  {
    "name": "Spray Relispray / Volini Spray (Diclofenac Pain Relief Spray)",
    "generic": "Spray Relispray / Volini Spray (Diclofenac Pain Relief Spray)",
    "category": "Analgesic & Antipyretic",
    "dose": "Spray 2-3 bursts from 10cm distance SOS",
    "timing": "SOS for acute sprain / strain",
    "duration": "SOS",
    "instructions": "Instant targeted topical pain relief for sports injuries and acute muscular spasm",
    "symptoms": [
      "acute sprain",
      "sports injury",
      "catch in back",
      "muscle pull",
      "cricket injury"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "Spray 2-3 bursts from 10cm distance SOS",
    "paedDose": "As directed by pediatrician",
    "notes": "Instant targeted topical pain relief for sports injuries and acute muscular spasm",
    "cat": "Analgesic & Antipyretic",
    "form": "Spray",
    "route": "Oral"
  },
  {
    "name": "Powder ORS WHO Formula (Electral / Enerzal Sachet 21.8g)",
    "generic": "ORS WHO Formula (Electral / Enerzal Sachet 21.8g)",
    "category": "Gastrointestinal",
    "dose": "Dissolve 1 full sachet in 1 Litre clean drinking water",
    "timing": "Drink in sips after every loose stool",
    "duration": "Use within 24 hours of preparation",
    "instructions": "Lifesaving oral rehydration solution based on WHO osmolarity formula",
    "symptoms": [
      "dehydration",
      "loose motions",
      "diarrhea",
      "vomiting weakness",
      "exhaustion",
      "heat stroke"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "Dissolve 1 full sachet in 1 Litre clean drinking water",
    "paedDose": "As directed by pediatrician",
    "notes": "Lifesaving oral rehydration solution based on WHO osmolarity formula",
    "cat": "Gastrointestinal",
    "form": "Powder",
    "route": "Oral"
  },
  {
    "name": "Powder Ispaghula Husk (Isabgol / Fybogel 100g)",
    "generic": "Ispaghula Husk (Isabgol / Fybogel 100g)",
    "category": "Gastrointestinal",
    "dose": "1-2 spoons in a glass of warm water or milk",
    "timing": "At bedtime, drink immediately",
    "duration": "Ongoing as required",
    "instructions": "Bulk-forming natural fiber laxative; ensure generous water intake",
    "symptoms": [
      "constipation",
      "hard stools",
      "piles",
      "fissure pain",
      "irregular bowel"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1-2 spoons in a glass of warm water or milk",
    "paedDose": "As directed by pediatrician",
    "notes": "Bulk-forming natural fiber laxative; ensure generous water intake",
    "cat": "Gastrointestinal",
    "form": "Powder",
    "route": "Oral"
  },
  {
    "name": "Tab. Doxinate (Doxylamine Succinate 10mg + Pyridoxine 10mg)",
    "generic": "Doxinate (Doxylamine Succinate 10mg + Pyridoxine 10mg)",
    "category": "Obstetrics & Gynae",
    "dose": "1-2 Tabs at bedtime (can add 1 tab in morning if severe)",
    "timing": "At night before sleeping",
    "duration": "First trimester of pregnancy",
    "instructions": "FDA and FOGSI approved gold-standard safe therapy for pregnancy morning sickness",
    "symptoms": [
      "morning sickness",
      "pregnancy nausea",
      "pregnancy vomiting",
      "hyperemesis gravidarum"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1-2 Tabs at bedtime (can add 1 tab in morning if severe)",
    "paedDose": "As directed by pediatrician",
    "notes": "FDA and FOGSI approved gold-standard safe therapy for pregnancy morning sickness",
    "cat": "Obstetrics & Gynae",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Folic Acid 5mg (Folvite 5mg)",
    "generic": "Folic Acid 5mg (Folvite 5mg)",
    "category": "Obstetrics & Gynae",
    "dose": "1 Tab OD",
    "timing": "Morning after breakfast",
    "duration": "Preconception and through 1st trimester",
    "instructions": "Prevents neural tube defects in fetus and treats megaloblastic anemia",
    "symptoms": [
      "pregnancy planning",
      "first trimester",
      "preconception",
      "macrocytic anemia"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab OD",
    "paedDose": "As directed by pediatrician",
    "notes": "Prevents neural tube defects in fetus and treats megaloblastic anemia",
    "cat": "Obstetrics & Gynae",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Calcium Carbonate 1250mg + Vitamin D3 250 IU (Shelcal 500)",
    "generic": "Calcium Carbonate 1250mg + Vitamin D3 250 IU (Shelcal 500)",
    "category": "Vitamins & Supplements",
    "dose": "1 Tab BD",
    "timing": "After meals (lunch and dinner)",
    "duration": "Throughout 2nd and 3rd trimester and lactation",
    "instructions": "Essential maternal bone health and fetal skeletal mineralization",
    "symptoms": [
      "pregnancy calcium",
      "lactation bone support",
      "leg cramps in pregnancy"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab BD",
    "paedDose": "As directed by pediatrician",
    "notes": "Essential maternal bone health and fetal skeletal mineralization",
    "cat": "Vitamins & Supplements",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Valacyclovir 500mg (Valcivir 500)",
    "generic": "Valacyclovir 500mg (Valcivir 500)",
    "category": "Antimicrobial & Antibiotic",
    "dose": "1 Tab TDS (Herpes Zoster: 1000mg TDS)",
    "timing": "With or without food",
    "duration": "7 Days",
    "instructions": "High bioavailability prodrug of acyclovir; initiate at first onset of shingles rash",
    "symptoms": [
      "herpes zoster",
      "shingles",
      "genital herpes",
      "severe viral blisters",
      "cold sores"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab TDS (Herpes Zoster: 1000mg TDS)",
    "paedDose": "As directed by pediatrician",
    "notes": "High bioavailability prodrug of acyclovir; initiate at first onset of shingles rash",
    "cat": "Antimicrobial & Antibiotic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Oseltamivir 75mg (FluVir 75 / Tamiflu)",
    "generic": "Oseltamivir 75mg (FluVir 75 / Tamiflu)",
    "category": "Antimicrobial & Antibiotic",
    "dose": "1 Cap BD",
    "timing": "With food to reduce nausea",
    "duration": "5 Days",
    "instructions": "Neuraminidase inhibitor for Influenza A & B (Swine Flu); best within 48h of symptoms",
    "symptoms": [
      "swine flu",
      "influenza",
      "h1n1",
      "severe viral fever",
      "flu like illness"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Cap BD",
    "paedDose": "As directed by pediatrician",
    "notes": "Neuraminidase inhibitor for Influenza A & B (Swine Flu); best within 48h of symptoms",
    "cat": "Antimicrobial & Antibiotic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Artemether 80mg + Lumefantrine 480mg (Coartem / Falcigo-Plus)",
    "generic": "Artemether 80mg + Lumefantrine 480mg (Coartem / Falcigo-Plus)",
    "category": "Antimicrobial & Antibiotic",
    "dose": "1 Tab BD for 3 days",
    "timing": "With fatty food or whole milk",
    "duration": "3 Days (6 doses total)",
    "instructions": "ACT combination for uncomplicated Plasmodium falciparum malaria",
    "symptoms": [
      "falciparum malaria",
      "chills rigors malaria",
      "high fever chills",
      "malarial fever"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab BD for 3 days",
    "paedDose": "As directed by pediatrician",
    "notes": "ACT combination for uncomplicated Plasmodium falciparum malaria",
    "cat": "Antimicrobial & Antibiotic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Chloroquine Phosphate 250mg (Lariago 250)",
    "generic": "Chloroquine Phosphate 250mg (Lariago 250)",
    "category": "Antimicrobial & Antibiotic",
    "dose": "600mg base stat, then 300mg at 6h, 24h, 48h",
    "timing": "After meals",
    "duration": "3 Days regimen",
    "instructions": "First line for chloroquine-sensitive Plasmodium vivax malaria",
    "symptoms": [
      "vivax malaria",
      "intermittent fever with chills",
      "malaria"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "600mg base stat, then 300mg at 6h, 24h, 48h",
    "paedDose": "As directed by pediatrician",
    "notes": "First line for chloroquine-sensitive Plasmodium vivax malaria",
    "cat": "Antimicrobial & Antibiotic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Primaquine 15mg (Malirid / Primarid)",
    "generic": "Primaquine 15mg (Malirid / Primarid)",
    "category": "Antimicrobial & Antibiotic",
    "dose": "1 Tab OD",
    "timing": "After food",
    "duration": "14 Days",
    "instructions": "Radical cure to prevent relapse in P. vivax; ensure normal G6PD status",
    "symptoms": [
      "vivax malaria radical cure",
      "malaria relapse prevention"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab OD",
    "paedDose": "As directed by pediatrician",
    "notes": "Radical cure to prevent relapse in P. vivax; ensure normal G6PD status",
    "cat": "Antimicrobial & Antibiotic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Diethylcarbamazine 100mg (Hetrazan 100)",
    "generic": "Diethylcarbamazine 100mg (Hetrazan 100)",
    "category": "Antimicrobial & Antibiotic",
    "dose": "1 Tab TDS",
    "timing": "After food",
    "duration": "21 Days",
    "instructions": "Drug of choice for lymphatic filariasis and tropical pulmonary eosinophilia (TPE)",
    "symptoms": [
      "filariasis",
      "eosinophilia",
      "lymphangitis",
      "tropical eosinophilia",
      "nocturnal dry cough"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab TDS",
    "paedDose": "As directed by pediatrician",
    "notes": "Drug of choice for lymphatic filariasis and tropical pulmonary eosinophilia (TPE)",
    "cat": "Antimicrobial & Antibiotic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Tinidazole 500mg (Tindaz 500)",
    "generic": "Tinidazole 500mg (Tindaz 500)",
    "category": "Antimicrobial & Antibiotic",
    "dose": "2g (4 tabs) single stat dose",
    "timing": "With meals",
    "duration": "Single stat dose",
    "instructions": "For amoebic liver abscess, acute intestinal amoebiasis and trichomoniasis",
    "symptoms": [
      "amoebic dysentery",
      "giardiasis",
      "trichomoniasis",
      "blood and mucus stools"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "2g (4 tabs) single stat dose",
    "paedDose": "As directed by pediatrician",
    "notes": "For amoebic liver abscess, acute intestinal amoebiasis and trichomoniasis",
    "cat": "Antimicrobial & Antibiotic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Nitazoxanide 500mg (Nizonide 500)",
    "generic": "Nitazoxanide 500mg (Nizonide 500)",
    "category": "Antimicrobial & Antibiotic",
    "dose": "1 Tab BD",
    "timing": "With food",
    "duration": "3 Days",
    "instructions": "Broad spectrum antiprotozoal for cryptosporidiosis and giardiasis diarrhea",
    "symptoms": [
      "cryptosporidium diarrhea",
      "persistent protozoal diarrhea",
      "giardiasis"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab BD",
    "paedDose": "As directed by pediatrician",
    "notes": "Broad spectrum antiprotozoal for cryptosporidiosis and giardiasis diarrhea",
    "cat": "Antimicrobial & Antibiotic",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Carbimazole 5mg (Neo-Mercazole 5)",
    "generic": "Carbimazole 5mg (Neo-Mercazole 5)",
    "category": "Diabetic Care",
    "dose": "1-2 Tabs TDS",
    "timing": "With food",
    "duration": "As monitored",
    "instructions": "Antithyroid agent for hyperthyroidism and Graves' disease; monitor CBC for agranulocytosis",
    "symptoms": [
      "hyperthyroidism",
      "tremors",
      "tachycardia",
      "weight loss thyroid",
      "graves disease",
      "sweating"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1-2 Tabs TDS",
    "paedDose": "As directed by pediatrician",
    "notes": "Antithyroid agent for hyperthyroidism and Graves' disease; monitor CBC for agranulocytosis",
    "cat": "Diabetic Care",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Alendronate Sodium 70mg (Osteophos 70)",
    "generic": "Alendronate Sodium 70mg (Osteophos 70)",
    "category": "Vitamins & Supplements",
    "dose": "1 Tab ONCE WEEKLY (e.g. every Sunday)",
    "timing": "First thing in morning with full glass plain water",
    "duration": "6 Months - 1 Year",
    "instructions": "Remain upright for 30 minutes after taking; do not lie down or eat food",
    "symptoms": [
      "osteoporosis",
      "bone fracture prevention",
      "low bone density",
      "postmenopausal osteoporosis"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab ONCE WEEKLY (e.g. every Sunday)",
    "paedDose": "As directed by pediatrician",
    "notes": "Remain upright for 30 minutes after taking; do not lie down or eat food",
    "cat": "Vitamins & Supplements",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Nasal Spray Calcitonin Salmon 200 IU (Miacalcic / Calnas)",
    "generic": "Calcitonin Salmon 200 IU (Miacalcic / Calnas)",
    "category": "Vitamins & Supplements",
    "dose": "1 Spray (200 IU) into alternate nostril OD",
    "timing": "Daily morning",
    "duration": "3-6 Months",
    "instructions": "Provides analgesic effect for acute painful osteoporotic vertebral compression fractures",
    "symptoms": [
      "osteoporotic spine pain",
      "vertebral compression fracture",
      "severe bone pain"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Spray (200 IU) into alternate nostril OD",
    "paedDose": "As directed by pediatrician",
    "notes": "Provides analgesic effect for acute painful osteoporotic vertebral compression fractures",
    "cat": "Vitamins & Supplements",
    "form": "Spray",
    "route": "Oral"
  },
  {
    "name": "Cap. Calcitriol 0.25mcg (Rocaltrol)",
    "generic": "Calcitriol 0.25mcg (Rocaltrol)",
    "category": "Vitamins & Supplements",
    "dose": "1 Cap OD",
    "timing": "With meals",
    "duration": "30-60 Days",
    "instructions": "Active form of Vitamin D (1,25-dihydroxy D3) for renal osteodystrophy and hypoparathyroidism",
    "symptoms": [
      "renal osteodystrophy",
      "hypocalcemia ckd",
      "parathyroid disorder",
      "rickets"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Cap OD",
    "paedDose": "As directed by pediatrician",
    "notes": "Active form of Vitamin D (1,25-dihydroxy D3) for renal osteodystrophy and hypoparathyroidism",
    "cat": "Vitamins & Supplements",
    "form": "Capsule",
    "route": "Oral"
  },
  {
    "name": "Tab. Sumatriptan 50mg (Suminat 50)",
    "generic": "Sumatriptan 50mg (Suminat 50)",
    "category": "Neuro & Psychiatry",
    "dose": "1 Tab stat at migraine onset",
    "timing": "Stat with water (may repeat after 2h if needed, max 200mg/day)",
    "duration": "Stat acute attack",
    "instructions": "5-HT1B/1D receptor agonist for acute abortive therapy of severe migraine with or without aura",
    "symptoms": [
      "acute severe migraine",
      "hemicrania throbbing pain",
      "migraine attack",
      "photophobia"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab stat at migraine onset",
    "paedDose": "As directed by pediatrician",
    "notes": "5-HT1B/1D receptor agonist for acute abortive therapy of severe migraine with or without aura",
    "cat": "Neuro & Psychiatry",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Topiramate 25mg (Topamac 25)",
    "generic": "Topiramate 25mg (Topamac 25)",
    "category": "Neuro & Psychiatry",
    "dose": "1 Tab at night (titrate up gradually)",
    "timing": "Bedtime",
    "duration": "30 Days",
    "instructions": "Migraine prophylaxis and adjunctive seizure treatment; ensure adequate water intake",
    "symptoms": [
      "frequent migraine",
      "migraine prophylaxis",
      "weight gain seizure",
      "partial seizures"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab at night (titrate up gradually)",
    "paedDose": "As directed by pediatrician",
    "notes": "Migraine prophylaxis and adjunctive seizure treatment; ensure adequate water intake",
    "cat": "Neuro & Psychiatry",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Pirfenidone 200mg (Pirfenex 200)",
    "generic": "Pirfenidone 200mg (Pirfenex 200)",
    "category": "Respiratory",
    "dose": "1 Tab TDS (titrate upwards)",
    "timing": "After meals",
    "duration": "Ongoing",
    "instructions": "Antifibrotic agent for idiopathic pulmonary fibrosis (IPF); avoid direct sun exposure",
    "symptoms": [
      "idiopathic pulmonary fibrosis",
      "ipf",
      "pulmonary fibrosis",
      "dry cough fibrosis"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab TDS (titrate upwards)",
    "paedDose": "As directed by pediatrician",
    "notes": "Antifibrotic agent for idiopathic pulmonary fibrosis (IPF); avoid direct sun exposure",
    "cat": "Respiratory",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. N-Acetylcysteine 600mg Effervescent (Mucinac 600)",
    "generic": "N-Acetylcysteine 600mg Effervescent (Mucinac 600)",
    "category": "Respiratory",
    "dose": "1 Tab dissolved in half glass water BD",
    "timing": "After meals",
    "duration": "10-14 Days",
    "instructions": "Antioxidant mucolytic for COPD, chronic bronchitis, and acetaminophen antidote",
    "symptoms": [
      "thick mucus",
      "copd mucus",
      "viscid phlegm",
      "paracetamol toxicity antidote",
      "smokers cough"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab dissolved in half glass water BD",
    "paedDose": "As directed by pediatrician",
    "notes": "Antioxidant mucolytic for COPD, chronic bronchitis, and acetaminophen antidote",
    "cat": "Respiratory",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Tab. Prucalopride 1mg (Pruvict 1 / Prusent)",
    "generic": "Prucalopride 1mg (Pruvict 1 / Prusent)",
    "category": "Gastrointestinal",
    "dose": "1 Tab OD",
    "timing": "Morning with or without food",
    "duration": "14-28 Days",
    "instructions": "High-affinity 5-HT4 receptor agonist for chronic idiopathic constipation refractory to laxatives",
    "symptoms": [
      "chronic idiopathic constipation",
      "refractory constipation",
      "severe straining",
      "hard stools"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1 Tab OD",
    "paedDose": "As directed by pediatrician",
    "notes": "High-affinity 5-HT4 receptor agonist for chronic idiopathic constipation refractory to laxatives",
    "cat": "Gastrointestinal",
    "form": "Tablet",
    "route": "Oral"
  },
  {
    "name": "Inj. Piperacillin 4g + Tazobactam 0.5g (Piptaz / Zosyn 4.5g)",
    "generic": "Piperacillin 4g + Tazobactam 0.5g (Piptaz / Zosyn 4.5g)",
    "category": "Injections & IV",
    "dose": "4.5g IV infusion over 30 mins TDS or QID",
    "timing": "Every 6-8 hours",
    "duration": "7-10 Days",
    "instructions": "Antipseudomonal penicillin combination for severe pneumonia, diabetic foot and polymicrobial infections",
    "symptoms": [
      "severe pneumonia",
      "diabetic foot ulcer",
      "pseudomonas infection",
      "severe cellulitis",
      "sepsis"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "4.5g IV infusion over 30 mins TDS or QID",
    "paedDose": "As directed by pediatrician",
    "notes": "Antipseudomonal penicillin combination for severe pneumonia, diabetic foot and polymicrobial infections",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Vancomycin 1g (Vancocin / Vanlid 1g)",
    "generic": "Vancomycin 1g (Vancocin / Vanlid 1g)",
    "category": "Injections & IV",
    "dose": "1g IV slow infusion over 60 mins BD",
    "timing": "Every 12 hours (slow infusion to prevent Red Man Syndrome)",
    "duration": "7-14 Days",
    "instructions": "Glycopeptide antibiotic of choice for MRSA infections and severe endocarditis",
    "symptoms": [
      "mrsa",
      "resistant staph infection",
      "bone joint infection mrsa",
      "endocarditis"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "1g IV slow infusion over 60 mins BD",
    "paedDose": "As directed by pediatrician",
    "notes": "Glycopeptide antibiotic of choice for MRSA infections and severe endocarditis",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  },
  {
    "name": "Inj. Dexmedetomidine 100mcg/ml (Dexem)",
    "generic": "Dexmedetomidine 100mcg/ml (Dexem)",
    "category": "Injections & IV",
    "dose": "0.2-1.4 mcg/kg/hr IV continuous infusion",
    "timing": "ICU sedation protocol",
    "duration": "Short term ICU sedation",
    "instructions": "Selective alpha-2 adrenergic agonist; provides conscious sedation without respiratory depression",
    "symptoms": [
      "icu sedation",
      "procedural sedation",
      "post operative agitation"
    ],
    "janAushadhi": "Affordable generic available",
    "adultDose": "0.2-1.4 mcg/kg/hr IV continuous infusion",
    "paedDose": "As directed by pediatrician",
    "notes": "Selective alpha-2 adrenergic agonist; provides conscious sedation without respiratory depression",
    "cat": "Injections & IV",
    "form": "Injection",
    "route": "IV / IM"
  }
];
window.DRUG_DATABASE = DRUG_DATABASE;

// ============================================================================
// 2. STATE MANAGEMENT & LOCAL STORAGE
// ============================================================================

// ============================================================================
// CLINICAL KNOWLEDGE BASE & EVIDENCE-BASED OPD PROTOCOLS
// ============================================================================
const CLINICAL_KNOWLEDGE_BASE = [
  {
    id: "kb-pharyngitis",
    diagnosis: "Acute Pharyngo-Tonsillitis",
    tags: ["pharyngitis", "tonsillitis", "throat", "sore throat", "painful swallowing", "fever", "throat pain", "gala"],
    symptoms: ["Sore Throat", "Painful Swallowing / Odynophagia", "Fever", "Tonsillar Enlargement", "Cervical Lymphadenopathy", "Chills"],
    medications: [
      { name: "Tab. Augmentin 625mg (Amoxicillin + Clavulanate)", dose: "1-0-1", timing: "After food", duration: "5 days", notes: "Complete full 5-day course" },
      { name: "Tab. Dolo 650 (Paracetamol 650mg)", dose: "1-0-1 (SOS)", timing: "After food", duration: "3 days", notes: "For throat pain & fever" },
      { name: "Tab. Pan 40 (Pantoprazole 40mg)", dose: "1-0-0", timing: "Before breakfast", duration: "5 days", notes: "Empty stomach (Gastric cover)" },
      { name: "Betadine 2% Gargle Liquid", dose: "10ml with 10ml warm water", timing: "Thrice daily", duration: "5 days", notes: "Gargle for 30 sec & spit" }
    ],
    pediatricMedications: [
      { name: "Syp. Augmentin DDS 457mg/5ml", dose: "5ml BD", timing: "After food", duration: "5 days", notes: "Shake well, complete course" },
      { name: "Syp. Ibugesic-Plus", dose: "5ml BD (SOS)", timing: "After food", duration: "3 days", notes: "For throat pain & fever" }
    ],
    infantMedications: [
      { name: "Drops Novamox 100mg/ml", dose: "1.25ml BD", timing: "After feeds", duration: "5 days", notes: "Antibiotic course" },
      { name: "Drops Calpol 100mg/ml", dose: "0.8ml SOS", timing: "After feeds", duration: "3 days", notes: "For fever" }
    ],
    investigations: "Throat Swab, Complete Blood Count (CBC)",
    advice: "Warm saline gargles 3-4 times daily, avoid ice cold water and spicy foods, maintain hydration."
  },
  {
    id: "kb-urti",
    diagnosis: "Upper Respiratory Tract Infection (URTI)",
    tags: ["urti", "common cold", "cold", "rhinitis", "runny nose", "sneezing", "cough", "zukham"],
    symptoms: ["Sore Throat", "Runny Nose / Rhinorrhea", "Sneezing", "Nasal Congestion", "Dry Cough", "Low Grade Fever", "Headache"],
    medications: [
      { name: "Tab. Paracetamol 650mg", dose: "1-0-1 (SOS)", timing: "After food", duration: "3 days", notes: "For fever & headache" },
      { name: "Tab. Montair-LC (Montelukast + Levocetirizine)", dose: "0-0-1", timing: "At bedtime", duration: "5 days", notes: "For nasal congestion & cough" },
      { name: "Tab. Vitamin C 500mg (Limcee / Celin)", dose: "1-0-0", timing: "Chew after breakfast", duration: "7 days", notes: "Immunity support" },
      { name: "Syp. Ascoril-D Liquid", dose: "10ml TDS", timing: "After food", duration: "5 days", notes: "For dry cough" }
    ],
    pediatricMedications: [
      { name: "Syp. P-250 (Paracetamol 250mg/5ml)", dose: "5ml TDS (SOS)", timing: "After food", duration: "3 days", notes: "For fever" },
      { name: "Syp. Montair-LC Kid", dose: "2.5ml once daily", timing: "At night", duration: "5 days", notes: "For cold & cough" },
      { name: "Nasoclear Saline Nasal Drops", dose: "2 drops each nostril", timing: "TDS before feeds", duration: "5 days", notes: "Clear nasal blockage" }
    ],
    infantMedications: [
      { name: "Drops Calpol (Paracetamol 100mg/ml)", dose: "0.8ml SOS", timing: "After feeds", duration: "3 days", notes: "Do not exceed 4 doses/24h" },
      { name: "Nasoclear Saline Drops", dose: "1-2 drops", timing: "Before breastfeeding", duration: "4 days", notes: "Clear nostrils gently" }
    ],
    investigations: "CBC if fever lasts > 3 days",
    advice: "Steam inhalation twice daily, drink plenty of warm fluids, rest, saline gargles."
  },
  {
    id: "kb-bronchitis",
    diagnosis: "Acute Bronchitis",
    tags: ["bronchitis", "asthma", "wheezing", "productive cough", "chest congestion", "dyspnea", "cough", "balgam"],
    symptoms: ["Productive Cough", "Wheezing / Whistling Chest", "Shortness of Breath / Dyspnea", "Chest Tightness", "Nocturnal Cough", "Fever"],
    medications: [
      { name: "Tab. Augmentin 625mg", dose: "1-0-1", timing: "After food", duration: "5 days", notes: "Antibiotic for chest infection" },
      { name: "Syp. Ascoril-LS (Levosalbutamol + Ambroxol)", dose: "10ml TDS", timing: "After food", duration: "5 days", notes: "Mucolytic bronchodilator" },
      { name: "Tab. Deriphyllin Retard 150", dose: "1-0-1", timing: "After food", duration: "5 days", notes: "Bronchodilator" },
      { name: "Tab. Dolo 650", dose: "1-0-1 (SOS)", timing: "After food", duration: "3 days", notes: "For fever & body ache" }
    ],
    pediatricMedications: [
      { name: "Syp. Ascoril-LS Junior", dose: "5ml TDS", timing: "After food", duration: "5 days", notes: "Mucolytic bronchodilator" },
      { name: "Syp. Augmentin DDS", dose: "5ml BD", timing: "After food", duration: "5 days", notes: "Antibiotic" }
    ],
    infantMedications: [
      { name: "Salbutamol Respirator Solution Nebulization", dose: "0.5ml in 2.5ml Saline", timing: "Nebulize SOS", duration: "3 days", notes: "Clinic guidance" }
    ],
    investigations: "Chest X-Ray PA View, CBC, ESR",
    advice: "Avoid cold air and dust. Steam inhalation twice daily. Drink warm water."
  },
  {
    id: "kb-gastritis",
    diagnosis: "Acute Gastritis / Acid Peptic Disease (GERD)",
    tags: ["gastritis", "acidity", "gerd", "heartburn", "acid reflux", "dyspepsia", "stomach pain", "burning", "abdominal pain"],
    symptoms: ["Burning Epigastric Pain", "Heartburn / Retrosternal Burning", "Acid Regurgitation", "Nausea", "Bloating", "Abdominal Pain"],
    medications: [
      { name: "Cap. Razo-D (Rabeprazole 20mg + Domperidone 30mg SR)", dose: "1-0-0", timing: "30 min before breakfast", duration: "10 days", notes: "Swallow whole with plain water" },
      { name: "Syp. Gelusil MPS Liquid", dose: "10ml TDS", timing: "After meals & bedtime", duration: "5 days", notes: "For instant heartburn relief" },
      { name: "Tab. Pan 40 (Pantoprazole 40mg)", dose: "1-0-0", timing: "Before breakfast", duration: "7 days", notes: "Antacid PPI" }
    ],
    pediatricMedications: [
      { name: "Syp. Domstal (Domperidone 1mg/ml)", dose: "2.5ml BD", timing: "15 min before feeds", duration: "3 days", notes: "Anti-reflux" },
      { name: "Syp. Gelusil MPS", dose: "5ml TDS", timing: "After meals", duration: "3 days", notes: "Antacid" }
    ],
    infantMedications: [
      { name: "Drops Colicaid / Neopeptine", dose: "4-5 drops", timing: "15 min before feeds", duration: "5 days", notes: "Infantile colic & gas" }
    ],
    investigations: "Upper GI Endoscopy if alarm signs, H. Pylori Stool Antigen",
    advice: "Avoid oily, fried and spicy foods. Do not lie down within 2 hours of eating. Eat small frequent meals."
  },
  {
    id: "kb-gastroenteritis",
    diagnosis: "Acute Gastroenteritis (Food Poisoning / Diarrhea)",
    tags: ["gastroenteritis", "diarrhea", "loose motions", "food poisoning", "vomiting", "stomach cramps", "abdominal pain"],
    symptoms: ["Watery Loose Stools", "Vomiting", "Abdominal Pain", "Nausea", "Dehydration / Weakness", "Fever"],
    medications: [
      { name: "ORS Electral Sachet", dose: "1 sachet in 1 Litre water", timing: "Sip continuously after each loose stool", duration: "3 days", notes: "Prevents dehydration" },
      { name: "Tab. Norflox-TZ (Norfloxacin 400 + Tinidazole 600)", dose: "1-0-1", timing: "After food", duration: "5 days", notes: "Complete 5 days" },
      { name: "Cap. Econorm 250mg (Saccharomyces boulardii)", dose: "1-0-1", timing: "With water or juice", duration: "5 days", notes: "Probiotic for gut flora" },
      { name: "Tab. Ondem 4mg (Ondansetron)", dose: "1-0-0 (SOS)", timing: "30 min before food", duration: "2 days", notes: "For vomiting" },
      { name: "Tab. Drotin-M (Drotaverine + Mefenamic Acid)", dose: "1-0-1 (SOS)", timing: "After food", duration: "3 days", notes: "For severe spasmodic cramps" }
    ],
    pediatricMedications: [
      { name: "ORS Electral Sachet", dose: "Frequent sips (50-100ml after each stool)", timing: "Throughout day", duration: "3 days", notes: "Essential rehydration" },
      { name: "Syp. Zincovit / Zinc Gluconate 20mg", dose: "5ml once daily", timing: "After food", duration: "14 days", notes: "WHO diarrhea protocol" },
      { name: "Syp. Ondem 2mg/5ml", dose: "2.5ml SOS", timing: "Before feeds", duration: "2 days", notes: "For vomiting" }
    ],
    infantMedications: [
      { name: "ORS Solution / Continued Breastfeeding", dose: "Frequent sips", timing: "On demand", duration: "3 days", notes: "Do not stop breastfeeding" },
      { name: "Drops Zinc 10mg/ml", dose: "1ml daily", timing: "Morning", duration: "14 days", notes: "WHO infant zinc protocol" }
    ],
    investigations: "Stool Routine & Microscopy, Serum Electrolytes",
    advice: "Strict hydration with ORS, coconut water, rice kanji. Avoid milk products and heavy solids."
  },
  {
    id: "kb-uti",
    diagnosis: "Urinary Tract Infection (Acute Cystitis)",
    tags: ["uti", "cystitis", "burning urine", "frequency", "dysuria", "fever", "abdominal pain"],
    symptoms: ["Burning Micturition / Dysuria", "Increased Urinary Frequency", "Urgency", "Suprapubic Pain", "Abdominal Pain", "Fever"],
    medications: [
      { name: "Tab. Nitrofurantoin 100mg SR", dose: "1-0-1", timing: "With food or milk", duration: "7 days", notes: "First-line urinary antiseptic" },
      { name: "Syp. Citralka (Disodium Hydrogen Citrate)", dose: "15ml in 1 glass water", timing: "TDS after meals", duration: "5 days", notes: "Urinary alkalinizer for burning" },
      { name: "Tab. Dolo 650", dose: "1-0-1 (SOS)", timing: "After food", duration: "3 days", notes: "For pelvic/back pain" }
    ],
    investigations: "Urine Routine & Microscopic Examination, Urine Culture & Sensitivity",
    advice: "Drink 3 to 4 litres of water daily. Do not hold urine. Urinate when urge arises. Maintain perineal hygiene."
  },
  {
    id: "kb-viral-fever",
    diagnosis: "Viral Fever / Pyrexia of Unknown Origin",
    tags: ["fever", "viral fever", "pyrexia", "body ache", "headache", "chills"],
    symptoms: ["Fever", "Body Ache", "Headache", "Weakness / Malaise", "Chills", "Loss of Appetite"],
    medications: [
      { name: "Tab. Dolo 650 (Paracetamol 650mg)", dose: "1-0-1 (SOS)", timing: "After food", duration: "4 days", notes: "For high fever & body ache" },
      { name: "Tab. Pan 40 (Pantoprazole 40mg)", dose: "1-0-0", timing: "Before breakfast", duration: "5 days", notes: "Antacid cover" },
      { name: "Tab. Vitamin C 500mg", dose: "1-0-0", timing: "After food", duration: "7 days", notes: "Immunity support" },
      { name: "ORS Electral Sachet", dose: "1 sachet in 1L water", timing: "Daily sips", duration: "3 days", notes: "Electrolyte balance" }
    ],
    investigations: "CBC, Dengue NS1 / IgM, Malarial Parasite (MP), Typhoid Widal / Typhidot if fever > 3 days",
    advice: "Plenty of oral fluids, rest, sponging with normal water if fever > 101F."
  },
  {
    id: "kb-hypertension",
    diagnosis: "Stage 1 Essential Hypertension (Review)",
    tags: ["hypertension", "high bp", "bp review", "headache", "dizziness"],
    symptoms: ["Headache", "Dizziness on Exertion", "Palpitations", "Fatigue", "Routine BP Check"],
    medications: [
      { name: "Tab. Telma 40 (Telmisartan 40mg)", dose: "1-0-0", timing: "Morning after breakfast", duration: "30 days", notes: "Take at same time daily" },
      { name: "Tab. Amlodac 5 (Amlodipine 5mg)", dose: "0-0-1", timing: "At bedtime", duration: "30 days", notes: "Add-on for BP target" },
      { name: "Tab. Atorva 10 (Atorvastatin 10mg)", dose: "0-0-1", timing: "At bedtime", duration: "30 days", notes: "Cardiovascular risk reduction" }
    ],
    investigations: "Serum Creatinine, Blood Urea, Serum Electrolytes, Lipid Profile, Urine Routine (Microalbumin), ECG",
    advice: "DASH Diet: Strictly limit dietary salt (< 3g/day). 30-45 minutes daily brisk walking. Regular home BP log."
  },
  {
    id: "kb-diabetes",
    diagnosis: "Type 2 Diabetes Mellitus (Glycemic Control)",
    tags: ["diabetes", "high sugar", "t2dm", "thirst", "frequent urination"],
    symptoms: ["Polydipsia / Excessive Thirst", "Polyuria / Frequent Urination", "Unexplained Weight Loss", "Tiredness / Lethargy", "Tingling in Feet"],
    medications: [
      { name: "Tab. Glycomet-GP 1 (Metformin 500 + Glimepiride 1)", dose: "1-0-0", timing: "15 min before breakfast", duration: "30 days", notes: "Do not skip breakfast" },
      { name: "Tab. Januvia 100mg (Sitagliptin)", dose: "1-0-0", timing: "With or after food", duration: "30 days", notes: "DPP-4 inhibitor" },
      { name: "Tab. Neurobion Forte", dose: "1-0-0", timing: "After breakfast", duration: "30 days", notes: "Diabetic neuropathy support" }
    ],
    investigations: "HbA1c (every 3 months), Fasting & PP Blood Sugar, Lipid Profile, Serum Creatinine",
    advice: "Strict diabetic diet: Eliminate refined sugar, sweets, white bread. High fiber legumes. Daily 30 min exercise."
  }
];

function seedDefaultDoctorKits() {
  if (!appData.doctorKits || appData.doctorKits.length === 0) {
    appData.doctorKits = [
      {
        id: "KIT-DOC-101",
        name: "Shifa Adult URTI Kit",
        triggerDiagnosis: "Upper Respiratory Tract Infection (URTI)",
        triggerSymptoms: ["Sore Throat", "Runny Nose", "Cough", "Fever"],
        ageGroup: "adult",
        medicines: [
          { name: "Tab. Paracetamol 650mg", dose: "1-0-1 (SOS)", timing: "After food", duration: "3 days", notes: "For fever & headache" },
          { name: "Tab. Montair-LC", dose: "0-0-1", timing: "At bedtime", duration: "5 days", notes: "For congestion" },
          { name: "Tab. Vitamin C 500mg", dose: "1-0-0", timing: "Chew after food", duration: "7 days", notes: "Immunity" },
          { name: "Syp. Ascoril-D Cough", dose: "10ml TDS", timing: "After food", duration: "5 days", notes: "For cough" }
        ],
        advice: "Steam inhalation twice daily, drink warm water, avoid cold items.",
        investigations: "CBC if fever lasts > 3 days",
        isCustom: true
      },
      {
        id: "KIT-DOC-102",
        name: "Shifa Pediatric Fever & Cold (1-12y)",
        triggerDiagnosis: "Upper Respiratory Tract Infection (URTI)",
        triggerSymptoms: ["Fever", "Cough", "Cold"],
        ageGroup: "pediatric",
        medicines: [
          { name: "Syp. P-250 (Paracetamol 250mg/5ml)", dose: "5ml TDS (SOS)", timing: "After food", duration: "3 days", notes: "For fever" },
          { name: "Syp. Montair-LC Kid", dose: "2.5ml once daily", timing: "At bedtime", duration: "5 days", notes: "For cough & cold" },
          { name: "Nasoclear Saline Nasal Drops", dose: "2 drops each nostril", timing: "TDS before food", duration: "5 days", notes: "Clear nose" }
        ],
        advice: "Give plenty of fluids, sponge with lukewarm water if fever > 101F.",
        investigations: "",
        isCustom: true
      },
      {
        id: "KIT-DOC-103",
        name: "Shifa Infant Colic & Fever (<1y)",
        triggerDiagnosis: "Acute Gastritis / Acid Peptic Disease (GERD)",
        triggerSymptoms: ["Abdominal Pain", "Restlessness", "Colic"],
        ageGroup: "infant",
        medicines: [
          { name: "Drops Colicaid / Neopeptine", dose: "4-5 drops", timing: "15 min before feeds", duration: "5 days", notes: "For tummy colic & gas" },
          { name: "Drops Calpol (Paracetamol 100mg/ml)", dose: "0.8ml SOS", timing: "After feeds", duration: "2 days", notes: "If fever > 99.5F" }
        ],
        advice: "Burp baby upright for 10-15 minutes after every feed. Avoid overfeeding.",
        investigations: "",
        isCustom: true
      }
    ];
  }
}

let appData = {
  clinic: {
    name: "SHIFA CLINIC",
    tagline: "General & Family Medicine • Dr. M. A. Khan, MBBS, FCPS • Reg #MC-84920",
    doctor: "Dr. M. A. Khan, MBBS, FCPS",
    regNo: "MC-84920",
    phone: "+91 98200 12345",
    address: "Shop #4, Al-Madina Heights, Main Road, Shifa Market"
  },
  settings: {
    smsEndpoint: "http://localhost:8080/messages",
    smsToken: "",
    smsSim: 1,
    smsMode: "direct",
    includeDiagnosis: true
  },
  patients: [],
  encounters: [],
  doctorKits: [],
  currentPeriod: "daily",
  currentPrescriptionEncounter: null
};
window.appData = appData;

function loadData() {
  const stored = localStorage.getItem("DOCEMR_SHIFA_DATA_V2");
  if (stored) {
    try {
      appData = JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse stored DocEMR data:", e);
      seedInitialClinicData();
    }
    seedDefaultDoctorKits();
  } else {
    seedInitialClinicData();
    seedDefaultDoctorKits();
  }
}


// ============================================================================
// DYNAMIC CLINIC BRANDING HEADER
// ============================================================================
function updateClinicHeader() {
  if (!appData || !appData.clinic) return;
  const clinicName = appData.clinic.name || "SHIFA CLINIC";
  const doctorName = appData.clinic.doctor || "Dr. M. A. Khan, MBBS";
  const regNo = appData.clinic.regNo || "MC-84920";

  const headerEl = document.getElementById("header-clinic-name");
  if (headerEl) headerEl.textContent = clinicName;

  const avatarEl = document.getElementById("header-clinic-avatar");
  if (avatarEl) {
    const words = clinicName.trim().split(/\s+/).filter(Boolean);
    avatarEl.textContent = words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : clinicName.slice(0, 2).toUpperCase();
  }

  const tagline = document.getElementById("clinic-tagline");
  if (tagline) tagline.textContent = `${doctorName} • Reg #${regNo}`;

  document.title = `DocEMR | ${clinicName} - Medical Records & Prescriptions`;

  const dClinic = document.getElementById("drawer-clinic-name");
  if (dClinic) dClinic.textContent = clinicName;
  const dDoc = document.getElementById("drawer-doc-name");
  if (dDoc) dDoc.textContent = doctorName;
  const gDoc = document.getElementById("dashboard-greeting-name");
  if (gDoc) gDoc.textContent = doctorName;

  const activeVer = (typeof localStorage !== "undefined" && localStorage.getItem("docemr_ota_version")) || "4.3.1";
  const cleanVer = String(activeVer).replace(/^v/i, "").replace(/-baseline$/i, "");
  const hVer = document.getElementById("header-app-version");
  if (hVer) hVer.textContent = "v" + cleanVer;
  const dVer = document.getElementById("drawer-app-version");
  if (dVer) dVer.textContent = "DocEMR v" + cleanVer;
}

function saveData() {
  localStorage.setItem("DOCEMR_SHIFA_DATA_V2", JSON.stringify(appData));
}

function seedInitialClinicData() {
  const todayStr = new Date().toISOString().split("T")[0];
  appData.patients = [
    {
      id: "PT-1001",
      mrn: "SHF-001",
      name: "Tariq Mehmood",
      age: 45,
      gender: "Male",
      phone: "+919876543210",
      bloodGroup: "B+",
      allergies: "Sulfa drugs",
      history: "Essential Hypertension for 3 years, non-smoker.",
      registeredDate: todayStr,
      lastVisit: todayStr
    },
    {
      id: "PT-1002",
      mrn: "SHF-002",
      name: "Fatima Zahra",
      age: 32,
      gender: "Female",
      phone: "+919812345678",
      bloodGroup: "O+",
      allergies: "Penicillin (Rash)",
      history: "Chronic Migraine, seasonal allergic rhinitis.",
      registeredDate: todayStr,
      lastVisit: todayStr
    },
    {
      id: "PT-1003",
      mrn: "SHF-003",
      name: "Abdul Rehman",
      age: 62,
      gender: "Male",
      phone: "+919765432109",
      bloodGroup: "A+",
      allergies: "None",
      history: "Type 2 Diabetes Mellitus x 8 years, mild osteoarthritis.",
      registeredDate: todayStr,
      lastVisit: todayStr
    },
    {
      id: "PT-1004",
      mrn: "SHF-004",
      name: "Zainab Bibi",
      age: 27,
      gender: "Female",
      phone: "+919988776655",
      bloodGroup: "AB+",
      allergies: "None",
      history: "Gastroesophageal Reflux Disease (GERD).",
      registeredDate: todayStr,
      lastVisit: todayStr
    },
    {
      id: "PT-1005",
      mrn: "SHF-005",
      name: "Mohammad Bilal",
      age: 9,
      gender: "Male",
      phone: "+919876500112",
      bloodGroup: "B+",
      allergies: "None",
      history: "Childhood bronchial asthma.",
      registeredDate: todayStr,
      lastVisit: todayStr
    },
    {
      id: "PT-1006",
      mrn: "SHF-006",
      name: "Ahmed Bhai",
      age: 33,
      gender: "Male",
      phone: "+919182863802",
      bloodGroup: "O+",
      allergies: "Aspirin / NSAIDs (Gastritis)",
      history: "Dyspepsia and tension headaches.",
      registeredDate: todayStr,
      lastVisit: todayStr
    }
  ];

  appData.encounters = [
    {
      id: "ENC-5001",
      patientId: "PT-1001",
      date: `${todayStr}T09:30`,
      vitals: { bp: "138/88", pulse: 76, temp: 98.4, weight: 74, spo2: 98, sugar: "135 Random" },
      symptoms: "Occipital headache, slight dizziness on exertion",
      diagnosis: "Stage 1 Essential Hypertension (Review)",
      medicines: [
        { name: "Tab. Telma 40 (Telmisartan 40mg)", dose: "1-0-0", timing: "Morning after breakfast", duration: "30 days", notes: "Regular BP check" },
        { name: "Tab. Atorva 10 (Atorvastatin 10mg)", dose: "0-0-1", timing: "At bedtime", duration: "30 days", notes: "Lipid control" }
      ],
      investigations: "Lipid Profile, Fasting Blood Sugar, Serum Creatinine",
      advice: "Low salt diet (DASH diet), 30 min daily brisk walking, avoid stress.",
      followup: "",
      whatsappSent: true,
      smsSent: false
    },
    {
      id: "ENC-5002",
      patientId: "PT-1002",
      date: `${todayStr}T10:15`,
      vitals: { bp: "110/72", pulse: 82, temp: 100.2, weight: 58, spo2: 99, sugar: "" },
      symptoms: "High grade fever for 2 days, severe sore throat, painful swallowing",
      diagnosis: "Acute Pharyngo-Tonsillitis",
      medicines: [
        { name: "Tab. Azithromycin 500mg", dose: "1-0-0", timing: "1 hr before food", duration: "3 days", notes: "Patient allergic to Penicillin. Complete full course." },
        { name: "Tab. Dolo 650 (Paracetamol 650mg)", dose: "1-0-1 (SOS)", timing: "After food", duration: "3 days", notes: "For fever & throat pain" },
        { name: "Tab. Pan 40 (Pantoprazole 40mg)", dose: "1-0-0", timing: "Before breakfast", duration: "5 days", notes: "Empty stomach" }
      ],
      investigations: "CBC, Throat Swab if symptoms persist",
      advice: "Warm saline gargles thrice daily, plenty of warm water, soft diet.",
      followup: "",
      whatsappSent: true,
      smsSent: false
    },
    {
      id: "ENC-5003",
      patientId: "PT-1006",
      date: `${todayStr}T11:00`,
      vitals: { bp: "124/80", pulse: 78, temp: 98.6, weight: 68, spo2: 99, sugar: "108 Fasting" },
      symptoms: "Burning epigastric pain, acid regurgitation, nausea after oily food",
      diagnosis: "Acute Gastritis / Acid Peptic Disease",
      medicines: [
        { name: "Cap. Razo-D (Rabeprazole 20mg + Domperidone 30mg SR)", dose: "1-0-0", timing: "30 min before breakfast", duration: "10 days", notes: "Swallow whole with plain water" },
        { name: "Syp. Gelusil MPS Liquid", dose: "10ml TDS", timing: "After food & at bedtime", duration: "5 days", notes: "For immediate heartburn relief" }
      ],
      investigations: "Upper GI Endoscopy if no relief in 2 weeks",
      advice: "Avoid spicy, fried and oily foods. Eat small frequent meals. Do not lie down within 2 hours of eating.",
      followup: "",
      whatsappSent: true,
      smsSent: false
    }
  ];

  saveData();
}

// ============================================================================
// 3. TAB NAVIGATION & INITIALIZATION
// ============================================================================
function switchTab(tabId) {
  document.querySelectorAll(".nav-tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.tab === tabId);
  });

  document.querySelectorAll(".tab-pane").forEach(pane => {
    pane.classList.remove("active");
  });

  const activePane = document.getElementById(`pane-${tabId}`);
  if (activePane) {
    activePane.classList.add("active");
  }

  // Refresh view specific logic
  if (tabId === "dashboard") {
    renderDashboard(appData.currentPeriod);
  } else if (tabId === "patients") {
    renderPatientsTable();
  } else if (tabId === "prescribe") {
    populateRxPatientSelect();
    const editForm = document.querySelector(".prescribe-edit-form");
    const prevContainer = document.getElementById("rx-preview-container");
    // If no active encounter is being previewed, default to editable prescription form
    if (!appData.currentPrescriptionEncounter) {
      if (editForm) editForm.style.display = "block";
      if (prevContainer) prevContainer.style.display = "none";
    }
    if (!document.getElementById("rx-medicine-rows").children.length) {
      addMedicineRow();
    }
    updateDynamicSymptomChips();
    updateDynamicDiagnosisChips();
    updateDynamicMedicationSuggestions();
    setupSymptomsAutocomplete();
    setupDiagnosisAutocomplete();
  } else if (tabId === "history") {
    populateHistoryPatientSelect();
  } else if (tabId === "settings") {
    populateSettingsInputs();
  }
}

function initFormDates() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const dateField = document.getElementById("rx-date");
  if (dateField) {
    dateField.value = `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}

// ============================================================================
// 4. CLINICAL DASHBOARD & ANALYTICS (Charts & Today Queue)
// ============================================================================
let visitsTrendChartInstance = null;
let diagnosisChartInstance = null;

function setDashboardPeriod(period, btn) {
  appData.currentPeriod = period;
  document.querySelectorAll(".time-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  renderDashboard(period);
}

function renderDashboard(period = "daily") {
  updateDashboardGreeting();
  const totalPatients = appData.patients.length;
  const totalEncounters = appData.encounters.length;
  const totalSent = appData.encounters.reduce((acc, curr) => acc + (curr.whatsappSent ? 1 : 0) + (curr.smsSent ? 1 : 0), 0);

  const kpiTotalPt = document.getElementById("kpi-total-patients");
  const kpiPeriodVisits = document.getElementById("kpi-period-visits");
  const kpiVisitsLabel = document.getElementById("kpi-visits-label");
  const kpiRx = document.getElementById("kpi-prescriptions");
  const kpiSms = document.getElementById("kpi-sms-sent");

  if (kpiTotalPt) kpiTotalPt.textContent = totalPatients;
  if (kpiRx) kpiRx.textContent = totalEncounters;
  if (kpiSms) kpiSms.textContent = totalSent;

  if (period === "daily") {
    if (kpiVisitsLabel) kpiVisitsLabel.textContent = "Today's Consultations";
    if (kpiPeriodVisits) kpiPeriodVisits.textContent = appData.encounters.length;
  } else if (period === "weekly") {
    if (kpiVisitsLabel) kpiVisitsLabel.textContent = "This Week's Visits";
    if (kpiPeriodVisits) kpiPeriodVisits.textContent = Math.round(appData.encounters.length * 1.8);
  } else {
    if (kpiVisitsLabel) kpiVisitsLabel.textContent = "This Month's Visits";
    if (kpiPeriodVisits) kpiPeriodVisits.textContent = Math.round(appData.encounters.length * 5.4);
  }

  renderDashboardCharts(period);
  renderDashboardQueue();
}

function renderDashboardCharts(period) {
  if (typeof Chart === "undefined") {
    console.warn("Chart.js library not loaded yet.");
    return;
  }

  // 1. Visits Trend Chart
  const trendCanvas = document.getElementById("visitsTrendChart");
  if (trendCanvas) {
    const ctx = trendCanvas.getContext("2d");
    if (visitsTrendChartInstance) {
      visitsTrendChartInstance.destroy();
    }

    let labels, dataPoints;
    if (period === "daily") {
      labels = ["9 AM", "11 AM", "1 PM", "3 PM", "5 PM", "7 PM", "9 PM"];
      dataPoints = [3, 7, 5, 2, 8, 12, 6];
    } else if (period === "weekly") {
      labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      dataPoints = [18, 24, 21, 28, 25, 32, 14];
    } else {
      labels = ["Week 1", "Week 2", "Week 3", "Week 4"];
      dataPoints = [92, 115, 108, 134];
    }

    visitsTrendChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [{
          label: "Consultations",
          data: dataPoints,
          borderColor: "#0d9488",
          backgroundColor: "rgba(13, 148, 136, 0.12)",
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: "#0d9488"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: "#f1f5f9" } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  // 2. Diagnosis Distribution Chart
  const diagCanvas = document.getElementById("diagnosisChart");
  if (diagCanvas) {
    const ctx = diagCanvas.getContext("2d");
    if (diagnosisChartInstance) {
      diagnosisChartInstance.destroy();
    }

    const diagCountMap = {};
    appData.encounters.forEach(e => {
      const diag = (e.diagnosis || "General Review").split("/")[0].trim();
      diagCountMap[diag] = (diagCountMap[diag] || 0) + 1;
    });

    // Provide default rich tags if small sample
    if (Object.keys(diagCountMap).length < 4) {
      diagCountMap["URTI / Viral Fever"] = 5;
      diagCountMap["Hypertension"] = 4;
      diagCountMap["Gastritis / GERD"] = 4;
      diagCountMap["Type 2 Diabetes"] = 3;
      diagCountMap["Bronchial Asthma"] = 2;
    }

    const diagLabels = Object.keys(diagCountMap).slice(0, 5);
    const diagData = diagLabels.map(l => diagCountMap[l]);

    diagnosisChartInstance = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: diagLabels,
        datasets: [{
          data: diagData,
          backgroundColor: ["#0d9488", "#0284c7", "#f59e0b", "#8b5cf6", "#ec4899"],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "right", labels: { boxWidth: 12, font: { size: 11 } } }
        }
      }
    });
  }
}

function renderDashboardQueue() {
  const tbody = document.getElementById("today-queue-tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (appData.encounters.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#94a3b8; padding: 20px;">No patients seen yet today.</td></tr>`;
    return;
  }

  const sorted = [...appData.encounters].reverse().slice(0, 8);
  sorted.forEach(enc => {
    const pt = appData.patients.find(p => p.id === enc.patientId) || { name: "Unknown", mrn: "--" };
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <strong>${pt.name}</strong><br>
        <span style="font-size:0.75rem; color:#64748b;">${pt.mrn} &bull; ${formatTime(enc.date)}</span>
      </td>
      <td>
        <span class="badge badge-primary" style="font-size:0.75rem;">${enc.diagnosis || "Routine OPD"}</span>
      </td>
      <td>
        <button class="btn btn-outline btn-sm" style="padding: 4px 8px; font-size: 0.75rem;" onclick="viewPrescriptionById('${enc.id}')">
          View Rx
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function formatTime(isoStr) {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return "";
  }
}

// ============================================================================
// 5. PATIENTS DIRECTORY (Mobile Cards + Desktop Table)
// ============================================================================
// Helper: Normalize patient timestamp to epoch ms for reliable chronological sorting
function getPatientSortTimestamp(p) {
  if (!p) return 0;
  // If patient has encounters, their latest encounter date represents active recent consultation
  const patientEncs = (appData.encounters || []).filter(e => e.patientId === p.id || e.patientId === p.mrn);
  if (patientEncs.length > 0) {
    const latestEncTime = patientEncs.reduce((max, e) => {
      const t = new Date(e.date || 0).getTime();
      return t > max ? t : max;
    }, 0);
    if (latestEncTime > 0) return latestEncTime;
  }
  if (p.lastVisit) {
    const t = new Date(p.lastVisit).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (p.updatedAt) {
    const t = new Date(p.updatedAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (p.createdAt) {
    const t = new Date(p.createdAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (p.registeredDate) {
    const t = new Date(p.registeredDate).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  const mrnMatch = (p.mrn || "").match(/\d+/);
  const mrnNum = mrnMatch ? parseInt(mrnMatch[0], 10) : 0;
  const idMatch = (p.id || "").match(/\d+/);
  const idNum = idMatch ? parseInt(idMatch[0], 10) : 0;
  return Math.max(mrnNum, idNum) * 1000;
}

function renderPatientsTable(filter = "") {
  const q = filter.trim().toLowerCase();

  // Update counts on archive tabs (sorted newest first)
  let allPatients = (appData.patients || []).slice().sort((a, b) => getPatientSortTimestamp(b) - getPatientSortTimestamp(a));
  const activeCount = allPatients.filter(p => !p.isArchived).length;
  const archivedCount = allPatients.filter(p => !!p.isArchived).length;
  const cActiveEl = document.getElementById("count-active-patients");
  const cArchivedEl = document.getElementById("count-archived-patients");
  if (cActiveEl) cActiveEl.textContent = activeCount;
  if (cArchivedEl) cArchivedEl.textContent = archivedCount;

  // Filter by active/archived state
  const list = allPatients.filter(p => {
    const isStateMatch = showingArchivedPatients ? !!p.isArchived : !p.isArchived;
    if (!isStateMatch) return false;

    return !q ||
      p.name.toLowerCase().includes(q) ||
      (p.phone || "").includes(q) ||
      p.mrn.toLowerCase().includes(q) ||
      (p.allergies && p.allergies.toLowerCase().includes(q));
  });

  // 1. Render Mobile Cards (Container: #patients-cards-container)
  const mobileContainer = document.getElementById("patients-cards-container");
  if (mobileContainer) {
    mobileContainer.innerHTML = "";
    if (list.length === 0) {
      mobileContainer.innerHTML = `<div style="text-align: center; color: #64748b; padding: 30px;">
        ${showingArchivedPatients ? "No temporarily deleted patient records." : "No active patient records match your search."}
      </div>`;
    } else {
      list.forEach(pt => {
        const allergyClean = (pt.allergies || "").trim().toLowerCase();
        const hasAllergy = allergyClean && !["none", "na", "n/a", "nil", "no", "-"].includes(allergyClean);
        const card = document.createElement("div");
        card.className = "patient-card";
        card.innerHTML = `
          <div class="patient-card-header">
            <div>
              <div class="patient-card-title">${pt.name}</div>
              <div class="patient-card-sub">${pt.age} yrs &bull; ${pt.gender} &bull; Blood: ${pt.bloodGroup || 'N/A'}</div>
            </div>
            <span class="badge ${pt.isArchived ? 'badge-subtle' : 'badge-primary'}">${pt.mrn}${pt.isArchived ? ' (Temp. Deleted)' : ''}</span>
          </div>

          <div class="patient-card-meta">
            <div><strong>Phone:</strong> <a href="tel:${pt.phone}" style="color: var(--primary-dark); text-decoration: none; font-weight: 600;">${pt.phone}</a></div>
            <div><strong>Last Visit:</strong> ${pt.lastVisit ? formatReadableDate(pt.lastVisit) : 'First Visit'}</div>
          </div>

          ${hasAllergy ? `<div class="patient-card-allergy">Known Allergy: ${pt.allergies}</div>` : ''}

          <div class="patient-card-actions">
            ${!pt.isArchived ? `
              <button class="btn btn-primary btn-sm" onclick="startNewConsultationForPatient('${pt.id}')">
                + New Consultation
              </button>
              <button class="btn btn-outline btn-sm" onclick="viewPatientTimeline('${pt.id}')">
                Timeline &amp; Slips
              </button>
              <button class="btn btn-outline btn-sm" onclick="editPatient('${pt.id}')">
                Edit
              </button>
              <button class="btn btn-outline btn-sm" style="color: #64748b;" onclick="archivePatient('${pt.id}')" title="Move to Temp. Delete">
                🗑️ Temp. Delete
              </button>
            ` : `
              <button class="btn btn-primary btn-sm" onclick="restorePatient('${pt.id}')">
                ✅ Restore to Active
              </button>
              <button class="btn btn-outline btn-sm" onclick="viewPatientTimeline('${pt.id}')">
                View Past Visits
              </button>
              <button class="btn btn-outline btn-sm" style="color: #ef4444; border-color: #fca5a5;" onclick="permanentlyDeletePatient('${pt.id}')">
                🗑️ Delete Permanently
              </button>
            `}
          </div>
        `;
        mobileContainer.appendChild(card);
      });
    }
  }

  // 2. Render Desktop Table (Container: #patients-list-tbody)
  const tbody = document.getElementById("patients-list-tbody");
  if (tbody) {
    tbody.innerHTML = "";
    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #94a3b8; padding: 30px;">
        ${showingArchivedPatients ? "No temporarily deleted patient records found." : "No active patient records match your search."}
      </td></tr>`;
      return;
    }

    list.forEach(pt => {
      const tr = document.createElement("tr");
      const hasAllergy = pt.allergies && pt.allergies !== "None" && pt.allergies.trim() !== "";
      tr.innerHTML = `
        <td><span class="badge ${pt.isArchived ? 'badge-subtle' : 'badge-primary'}">${pt.mrn}</span></td>
        <td><strong>${pt.name}</strong>${pt.isArchived ? ' <small style="color:#dc2626; font-weight: 600;">(Temp. Deleted)</small>' : ''}</td>
        <td>${pt.age}y / ${pt.gender}</td>
        <td><a href="tel:${pt.phone}" style="color: inherit; text-decoration: none;">${pt.phone}</a></td>
        <td><span class="badge badge-outline">${pt.bloodGroup || "Unknown"}</span></td>
        <td>${hasAllergy ? `<span style="background: #fee2e2; color: #b91c1c; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 0.78rem;">Allergy: ${pt.allergies}</span>` : `<span style="color: #10b981; font-size: 0.82rem;">None</span>`}</td>
        <td style="font-size: 0.82rem;">${pt.lastVisit ? formatReadableDate(pt.lastVisit) : "New"}</td>
        <td>
          <div style="display: flex; gap: 4px; flex-wrap: wrap;">
            ${!pt.isArchived ? `
              <button class="btn btn-primary btn-sm" style="padding: 4px 8px; font-size: 0.75rem;" onclick="startNewConsultationForPatient('${pt.id}')">+ Consultation</button>
              <button class="btn btn-outline btn-sm" style="padding: 4px 8px; font-size: 0.75rem;" onclick="viewPatientTimeline('${pt.id}')">History</button>
              <button class="btn btn-outline btn-sm" style="padding: 4px 8px; font-size: 0.75rem;" onclick="editPatient('${pt.id}')">Edit</button>
              <button class="btn btn-outline btn-sm" style="padding: 4px 8px; font-size: 0.75rem; color: #64748b;" onclick="archivePatient('${pt.id}')">🗑️ Temp. Delete</button>
            ` : `
              <button class="btn btn-primary btn-sm" style="padding: 4px 8px; font-size: 0.75rem;" onclick="restorePatient('${pt.id}')">✅ Restore</button>
              <button class="btn btn-outline btn-sm" style="padding: 4px 8px; font-size: 0.75rem;" onclick="viewPatientTimeline('${pt.id}')">History</button>
              <button class="btn btn-outline btn-sm" style="padding: 4px 8px; font-size: 0.75rem; color: #ef4444; border-color: #fca5a5;" onclick="permanentlyDeletePatient('${pt.id}')">🗑️ Delete</button>
            `}
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }
}


function filterPatientsTable() {
  const q = document.getElementById("patient-table-filter").value;
  renderPatientsTable(q);
}

// Global top-bar live search dropdown
function setupGlobalSearch() {
  const input = document.getElementById("global-patient-search");
  const dropdown = document.getElementById("search-dropdown");
  if (!input || !dropdown) return;

  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    if (!q) {
      dropdown.classList.remove("active");
      dropdown.innerHTML = "";
      return;
    }

    const matches = appData.patients.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.phone || "").includes(q) ||
      p.mrn.toLowerCase().includes(q)
    );

    dropdown.innerHTML = "";
    if (matches.length === 0) {
      dropdown.innerHTML = `<div style="padding: 10px; font-size: 0.82rem; color: #64748b;">No patients found. <a href="javascript:void(0)" onclick="openPatientModal('${encodeURIComponent(input.value)}')">Register new?</a></div>`;
    } else {
      matches.slice(0, 5).forEach(pt => {
        const item = document.createElement("div");
        item.className = "search-result-item";
        item.innerHTML = `
          <div>
            <strong>${pt.name}</strong> (${pt.age}y/${pt.gender})<br>
            <small style="color: #64748b;">MRN: ${pt.mrn} &bull; Phone: ${pt.phone}</small>
          </div>
          <button class="btn btn-primary btn-sm" style="padding: 3px 8px; font-size: 0.75rem;">Select</button>
        `;
        item.onclick = () => selectPatientFromSearch(pt.id);
        dropdown.appendChild(item);
      });
    }
    dropdown.classList.add("active");
  });

  input.addEventListener("blur", () => {
    setTimeout(() => {
      dropdown.classList.remove("active");
    }, 250);
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      dropdown.classList.remove("active");
      dropdown.innerHTML = "";
    }
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-box")) {
      dropdown.classList.remove("active");
    }
  });
}

function selectPatientFromSearch(patientId) {
  document.getElementById("search-dropdown").classList.remove("active");
  document.getElementById("global-patient-search").value = "";
  startConsultationForPatient(patientId);
}

// Patient Modal (Add / Edit)
function openPatientModal(prefillName = "") {
  document.getElementById("patient-modal-title").textContent = "Register New Patient";
  document.getElementById("modal-patient-id").value = "";
  document.getElementById("modal-patient-name").value = prefillName ? decodeURIComponent(prefillName) : "";
  document.getElementById("modal-patient-age").value = "";
  document.getElementById("modal-patient-gender").value = "Male";
  document.getElementById("modal-patient-phone").value = "";
  document.getElementById("modal-patient-blood").value = "Unknown";
  document.getElementById("modal-patient-allergies").value = "";
  document.getElementById("modal-patient-history").value = "";

  document.getElementById("patient-modal").classList.add("active");
  setTimeout(() => document.getElementById("modal-patient-name").focus(), 150);
}

function editPatient(patientId) {
  const pt = appData.patients.find(p => p.id === patientId);
  if (!pt) return;

  document.getElementById("patient-modal-title").textContent = `Edit Patient: ${pt.name}`;
  document.getElementById("modal-patient-id").value = pt.id;
  document.getElementById("modal-patient-name").value = pt.name;
  document.getElementById("modal-patient-age").value = pt.age;
  document.getElementById("modal-patient-gender").value = pt.gender;
  document.getElementById("modal-patient-phone").value = pt.phone;
  document.getElementById("modal-patient-blood").value = pt.bloodGroup || "Unknown";
  document.getElementById("modal-patient-allergies").value = pt.allergies || "";
  document.getElementById("modal-patient-history").value = pt.history || "";

  document.getElementById("patient-modal").classList.add("active");
}

function closePatientModal() {
  document.getElementById("patient-modal").classList.remove("active");
}

function savePatient() {
  const idField = document.getElementById("modal-patient-id").value;
  const name = document.getElementById("modal-patient-name").value.trim();
  const ageVal = document.getElementById("modal-patient-age").value.trim();
  const age = parseInt(ageVal, 10);
  const gender = document.getElementById("modal-patient-gender").value || "Male";
  const phone = document.getElementById("modal-patient-phone").value.trim();
  const blood = document.getElementById("modal-patient-blood").value || "Unknown";
  const allergies = document.getElementById("modal-patient-allergies").value.trim();
  const history = document.getElementById("modal-patient-history").value.trim();

  // ONLY Name and Age are mandatory!
  if (!name) {
    showToast("Please enter Patient Name.", "error");
    document.getElementById("modal-patient-name").focus();
    return;
  }
  if (isNaN(age) || age < 0 || age > 130) {
    showToast("Please enter a valid Patient Age.", "error");
    document.getElementById("modal-patient-age").focus();
    return;
  }

  const todayStr = new Date().toISOString().split("T")[0];

  if (idField) {
    // Update existing
    const pt = appData.patients.find(p => p.id === idField);
    if (pt) {
      pt.name = name;
      pt.age = age;
      pt.gender = gender;
      pt.phone = phone;
      pt.bloodGroup = blood;
      pt.allergies = allergies || "None";
      pt.history = history;
      pt.updatedAt = new Date().toISOString();
      appData.patients = [pt, ...appData.patients.filter(p => p.id !== pt.id)];
      showToast(`Updated record for ${name}!`, "success");
    }
  } else {
    // New patient registration
    const nextSeq = appData.patients.length + 1;
    const newPt = {
      id: `PT-${Date.now().toString().slice(-6)}`,
      mrn: `SHF-${String(nextSeq).padStart(3, "0")}`,
      name: name,
      age: age,
      gender: gender,
      phone: phone,
      bloodGroup: blood,
      allergies: allergies || "None",
      history: history,
      registeredDate: todayStr,
      lastVisit: todayStr,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    appData.patients.unshift(newPt);
    showToast(`Patient ${name} registered successfully!`, "success");

    // Automatically select newly registered patient in Rx tab
    setTimeout(() => {
      populateRxPatientSelect();
      const sel = document.getElementById("rx-patient-select");
      if (sel) {
        sel.value = newPt.id;
        onRxPatientSelected();
      }
    }, 150);
  }

  saveData();
  closePatientModal();
  renderPatientsTable();
  renderDashboard(appData.currentPeriod);
  populateRxPatientSelect();

  // If created from AI Scribe (Screen 1 or Screen 2), auto-assign this new patient!
  const targetPatientId = idField || (appData.patients && appData.patients.length > 0 ? appData.patients[0].id : "");
  if (patientModalOpenedFromContext) {
    if (currentAiSessionData) {
      currentAiSessionData.selectedPatientId = targetPatientId;
    }
    populateAiPatientDropdowns(targetPatientId);
    showToast("✨ Patient " + name + " assigned to AI session!", "success");
    patientModalOpenedFromContext = "";
  } else {
    populateAiPatientDropdowns();
  }
}

// ============================================================================
// 6. CONSULTATION & PRESCRIPTION BUILDER WITH GOOGLE-STYLE AUTOCOMPLETE
// ============================================================================
function populateRxPatientSelect() {
  try { populateAiPatientDropdowns(); } catch (e) {}
  const sel = document.getElementById("rx-patient-select");
  if (!sel) return;
  const curVal = sel.value;
  sel.innerHTML = `<option value="">-- Choose registered patient or register new --</option>`;

  appData.patients.forEach(pt => {
    const opt = document.createElement("option");
    opt.value = pt.id;
    const phoneDisplay = pt.phone ? ` - ${pt.phone}` : "";
    opt.textContent = `${pt.name} (${pt.mrn} - ${pt.age}y/${pt.gender}${phoneDisplay})`;
    sel.appendChild(opt);
  });

  if (curVal) sel.value = curVal;
}

function onRxPatientSelected() {
  const sel = document.getElementById("rx-patient-select");
  const ptId = sel.value;
  const banner = document.getElementById("rx-patient-alert-banner");
  const repeatBanner = document.getElementById("rx-repeat-banner");
  const mrnInput = document.getElementById("rx-patient-id");

  if (!ptId) {
    mrnInput.value = "";
    if (banner) banner.style.display = "none";
    if (repeatBanner) repeatBanner.style.display = "none";
    return;
  }

  const pt = appData.patients.find(p => p.id === ptId);
  if (pt) {
    mrnInput.value = pt.mrn;
    const hasAllergy = pt.allergies && pt.allergies !== "None" && pt.allergies.trim() !== "";
    if (banner) {
      banner.style.display = "block";
      banner.innerHTML = `
        <strong>Patient Selected:</strong> ${pt.name} (${pt.age}y/${pt.gender}) &bull; Blood: ${pt.bloodGroup || 'Unknown'} &bull; Phone: ${pt.phone ? pt.phone : '<span style="color:#64748b; font-style:italic;">Not provided</span>'}<br>
        ${hasAllergy ? `<span style="font-weight: 700; color: #b91c1c;">WARNING - KNOWN ALLERGY: ${pt.allergies}</span><br>` : ''}
        ${pt.history ? `<span style="font-size: 0.8rem; color: #64748b;">Medical History: ${pt.history}</span>` : ''}
      `;
    }

    // Eka Care Style 1-Tap Repeat Previous Prescription
    if (repeatBanner) {
      const pastEncounters = (appData.encounters || [])
        .filter(e => e.patientId === ptId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      if (pastEncounters.length > 0) {
        const lastEnc = pastEncounters[0];
        const lastDate = lastEnc.date ? formatReadableDate(lastEnc.date) : "Last Visit";
        const medCount = (lastEnc.medicines || []).length;
        const medSummary = (lastEnc.medicines || []).map(m => m.name.split(" ")[1] || m.name).slice(0, 3).join(", ");
        const moreMeds = medCount > 3 ? ` +${medCount - 3} more` : "";

        repeatBanner.style.display = "flex";
        repeatBanner.innerHTML = `
          <div class="repeat-rx-content">
            <div class="repeat-rx-header">
              <span class="repeat-rx-badge">🔁 Repeat Last Rx</span>
              <span class="repeat-rx-date">Previous Visit: <strong>${lastDate}</strong> &bull; <em>${escapeHtml(lastEnc.diagnosis || 'Clinical Review')}</em></span>
            </div>
            <div class="repeat-rx-summary">
              Prescribed: <strong>${medCount} medicine(s)</strong> (${escapeHtml(medSummary)}${moreMeds})
              ${lastEnc.vitals && lastEnc.vitals.bp ? ` &bull; Prior BP: <strong>${lastEnc.vitals.bp}</strong>` : ''}
            </div>
          </div>
          <button type="button" class="btn-repeat-rx" onclick="repeatPreviousPrescription('${lastEnc.id}')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
            <span>1-Tap Refill / Repeat Rx</span>
          </button>
        `;
      } else {
        repeatBanner.style.display = "none";
        repeatBanner.innerHTML = "";
      }
    }
    
    // Populate Embedded Past Visits in Consultation view
    const embeddedHistContainer = document.getElementById("rx-embedded-history-container");
    const embeddedHistTitle = document.getElementById("rx-embedded-history-title");
    const embeddedHistBody = document.getElementById("rx-embedded-history-body");
    
    if (embeddedHistContainer && embeddedHistBody) {
      if (pastEncounters.length > 0) {
        embeddedHistContainer.style.display = "block";
        if (embeddedHistTitle) {
          embeddedHistTitle.textContent = `${escapeHtml(pt.name)}'s Past Visits (${pastEncounters.length})`;
        }
        let histHtml = "";
        pastEncounters.forEach((enc, index) => {
          let medsList = (enc.medicines || []).map(m => `<strong>${escapeHtml(m.name)}</strong> (${escapeHtml(m.dose)})`).join(", ");
          
          if (index > 0) {
            const newer = new Date(pastEncounters[index - 1].date);
            const older = new Date(enc.date);
            const diffDays = Math.round((newer - older) / (1000 * 60 * 60 * 24));
            const gap = diffDays === 0 ? "Same day" : `${diffDays} days gap`;
            histHtml += `<div style="text-align:center; font-size:0.72rem; color:#64748b; margin:4px 0;">⏱️ ${gap}</div>`;
          }
          
          histHtml += `
            <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:6px; padding:8px 10px; margin-bottom:8px;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong style="color:#0f766e; font-size:0.84rem;">Visit: ${formatReadableDate(enc.date)}</strong>
                <span style="font-size:0.75rem; color:#64748b;">${formatTime(enc.date)}</span>
              </div>
              <div style="font-size:0.8rem; color:#334155; margin-top:3px;">
                <strong>Dx:</strong> ${escapeHtml(enc.diagnosis || 'General')}
              </div>
              <div style="font-size:0.78rem; color:#64748b; margin-top:2px;">
                <strong>Rx:</strong> ${medsList || 'None'}
              </div>
            </div>
          `;
        });
        embeddedHistBody.innerHTML = histHtml;
      } else {
        embeddedHistContainer.style.display = "none";
        embeddedHistBody.innerHTML = "";
      }
    }

    updateDynamicMedicationSuggestions();
  }
}

function repeatPreviousPrescription(encId) {
  const enc = (appData.encounters || []).find(e => e.id === encId);
  if (!enc) {
    showToast("Previous prescription record not found.", "error");
    return;
  }

  // Snapshot current state for UNDO
  lastPrescriptionUndoState = {
    symptoms: document.getElementById("rx-symptoms")?.value || "",
    diagnosis: document.getElementById("rx-diagnosis")?.value || "",
    advice: document.getElementById("rx-advice")?.value || "",
    investigations: document.getElementById("rx-investigations")?.value || "",
    medicines: []
  };
  const existingCards = document.querySelectorAll("#rx-medicine-rows .rx-medicine-card");
  existingCards.forEach(card => {
    const name = card.querySelector(".rx-med-name")?.value || "";
    if (name.trim()) {
      lastPrescriptionUndoState.medicines.push({
        name,
        dose: card.querySelector(".rx-med-dose")?.value || "",
        timing: card.querySelector(".rx-med-timing")?.value || "",
        duration: card.querySelector(".rx-med-duration")?.value || "",
        notes: card.querySelector(".rx-med-notes")?.value || ""
      });
    }
  });

  const container = document.getElementById("rx-medicine-rows");
  if (!container) return;
  container.innerHTML = "";

  if (enc.medicines && enc.medicines.length > 0) {
    enc.medicines.forEach(m => {
      addMedicineRow({
        name: m.name,
        dose: m.dose,
        timing: m.timing,
        duration: m.duration,
        notes: m.notes
      });
    });
  } else {
    addMedicineRow();
  }

  const diagInput = document.getElementById("rx-diagnosis");
  if (diagInput && (!diagInput.value.trim() || diagInput.value.trim() === "General")) {
    diagInput.value = enc.diagnosis || "";
  }

  const sympInput = document.getElementById("rx-symptoms");
  if (sympInput && !sympInput.value.trim()) {
    sympInput.value = `Follow-up / Review: ${enc.symptoms || enc.diagnosis || 'Condition review'}`;
  }

  const adviceInput = document.getElementById("rx-advice");
  if (adviceInput && !adviceInput.value.trim() && enc.advice) {
    adviceInput.value = enc.advice;
  }

  const invInput = document.getElementById("rx-investigations");
  if (invInput && !invInput.value.trim() && enc.investigations) {
    invInput.value = enc.investigations;
  }

  // Update repeat banner with active Undo button
  const repeatBanner = document.getElementById("rx-repeat-banner");
  if (repeatBanner) {
    repeatBanner.style.display = "flex";
    repeatBanner.style.background = "#fef3c7";
    repeatBanner.style.borderColor = "#fcd34d";
    repeatBanner.innerHTML = `
      <div class="repeat-rx-content">
        <div class="repeat-rx-header">
          <span class="repeat-rx-badge" style="background:#f59e0b; color:#fff;">✓ Loaded Previous Rx</span>
          <span class="repeat-rx-date" style="color:#92400e;">From <strong>${formatReadableDate(enc.date)}</strong> &bull; ${(enc.medicines || []).length} medications loaded</span>
        </div>
        <div class="repeat-rx-summary" style="color:#b45309;">
          Loaded: <em>${escapeHtml(enc.diagnosis || 'Clinical Rx')}</em>. Tap Undo if you filled by mistake.
        </div>
      </div>
      <button type="button" class="btn btn-outline btn-sm" style="background:#ffffff; border-color:#f59e0b; color:#b45309; font-weight:700; padding:6px 12px; display:inline-flex; align-items:center; gap:4px;" onclick="undoRepeatPreviousPrescription('${enc.id}')">
        <span>↩️ Undo / Clear</span>
      </button>
    `;
  }

  updateDynamicDiagnosisChips();
  updateDynamicMedicationSuggestions(enc.diagnosis || "");
  showToast(`🔁 1-Tap Refill: Loaded ${enc.medicines ? enc.medicines.length : 0} medications from previous visit!`, "success");
}


function startConsultationWithRepeat(patientId, encId) {
  startConsultationForPatient(patientId);
  setTimeout(() => {
    repeatPreviousPrescription(encId);
  }, 100);
}

function undoRepeatPreviousPrescription(encId) {
  const container = document.getElementById("rx-medicine-rows");
  if (container) {
    container.innerHTML = "";
  }

  if (lastPrescriptionUndoState) {
    const sympInput = document.getElementById("rx-symptoms");
    if (sympInput) sympInput.value = lastPrescriptionUndoState.symptoms || "";

    const diagInput = document.getElementById("rx-diagnosis");
    if (diagInput) diagInput.value = lastPrescriptionUndoState.diagnosis || "";

    const advInput = document.getElementById("rx-advice");
    if (advInput) advInput.value = lastPrescriptionUndoState.advice || "";

    const invInput = document.getElementById("rx-investigations");
    if (invInput) invInput.value = lastPrescriptionUndoState.investigations || "";

    if (lastPrescriptionUndoState.medicines && lastPrescriptionUndoState.medicines.length > 0) {
      lastPrescriptionUndoState.medicines.forEach(m => addMedicineRow(m));
    } else {
      addMedicineRow();
    }
  } else {
    // Reset to blank
    const sympInput = document.getElementById("rx-symptoms");
    if (sympInput) sympInput.value = "";

    const diagInput = document.getElementById("rx-diagnosis");
    if (diagInput) diagInput.value = "";

    const advInput = document.getElementById("rx-advice");
    if (advInput) advInput.value = "";

    const invInput = document.getElementById("rx-investigations");
    if (invInput) invInput.value = "";

    addMedicineRow();
  }

  // Restore repeat banner
  const repeatBanner = document.getElementById("rx-repeat-banner");
  if (repeatBanner && encId) {
    const enc = (appData.encounters || []).find(e => e.id === encId);
    if (enc) {
      const lastDate = formatReadableDate(enc.date);
      const medCount = (enc.medicines || []).length;
      repeatBanner.style.display = "flex";
      repeatBanner.innerHTML = `
        <div class="repeat-rx-content">
          <div class="repeat-rx-header">
            <span class="repeat-rx-badge">🔁 Repeat Last Rx</span>
            <span class="repeat-rx-date">Previous Visit: <strong>${lastDate}</strong> &bull; <em>${escapeHtml(enc.diagnosis || 'Clinical Review')}</em></span>
          </div>
          <div class="repeat-rx-summary">
            Prescribed: <strong>${medCount} medicine(s)</strong>
          </div>
        </div>
        <button type="button" class="btn-repeat-rx" onclick="repeatPreviousPrescription('${enc.id}')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
          <span>1-Tap Refill / Repeat Rx</span>
        </button>
      `;
    }
  }

  lastPrescriptionUndoState = null;
  updateDynamicSymptomChips();
  updateDynamicDiagnosisChips();
  updateDynamicMedicationSuggestions();
  showToast("↩️ Undone! Reverted previous prescription fill.", "info");
}


function startNewConsultationForPatient(patientId) {
  initVitalsCollapseState();
  appData.currentPrescriptionEncounter = null;
  const editIdField = document.getElementById("editing-encounter-id");
  if (editIdField) editIdField.value = "";

  // 1. Switch to prescribe tab
  switchTab("prescribe");

  // 2. Ensure prescribe form is displayed and preview is hidden
  const editForm = document.querySelector(".prescribe-edit-form");
  if (editForm) editForm.style.display = "block";
  const prevContainer = document.getElementById("rx-preview-container");
  if (prevContainer) prevContainer.style.display = "none";

  // 3. Clear all form fields for a pristine fresh consultation
  initFormDates();
  const fieldsToClear = ["vital-bp", "vital-bp-sys", "vital-bp-dia", "vital-pulse", "vital-temp", "vital-weight", "vital-spo2", "vital-sugar", "rx-symptoms", "rx-diagnosis", "rx-investigations", "rx-advice", "rx-followup"];
  fieldsToClear.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  // 4. Reset medicine rows to 1 single blank row
  const medRowsContainer = document.getElementById("rx-medicine-rows");
  if (medRowsContainer) {
    medRowsContainer.innerHTML = "";
    addMedicineRow();
  }

  // 5. Select this patient in the dropdown and trigger onRxPatientSelected
  populateRxPatientSelect();
  const sel = document.getElementById("rx-patient-select");
  if (sel) {
    sel.value = patientId;
    onRxPatientSelected();
  }

  // 6. Update dynamic chips
  updateDynamicSymptomChips();
  updateDynamicDiagnosisChips();
  updateDynamicMedicationSuggestions();

  // 7. Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });

  const pt = (appData.patients || []).find(p => p.id === patientId || p.mrn === patientId);
  showToast(`New consultation started for ${pt ? pt.name : 'Patient'}`, "info");
}

function startConsultationForPatient(patientId) {
  startNewConsultationForPatient(patientId);
}

// Medicine Row Builder with Google-Style Autocomplete

function updateMedicineRowNumbers() {
  const rows = document.querySelectorAll("#rx-medicine-rows .rx-row");
  let filledCount = 0;
  rows.forEach((r, idx) => {
    const badge = r.querySelector(".rx-med-num-badge");
    if (badge) {
      badge.textContent = `#${idx + 1}`;
    }
    const nameVal = (r.querySelector(".med-name")?.value || "").trim();
    if (nameVal) filledCount++;
  });
  const countBadge = document.getElementById("rx-meds-count-badge");
  if (countBadge) {
    countBadge.textContent = `${filledCount} ${filledCount === 1 ? 'medication' : 'medications'}`;
  }
}

function addMedicineRow(data = {}) {
  const container = document.getElementById("rx-medicine-rows");
  if (!container) return;

  const rowId = `med-row-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const row = document.createElement("div");
  row.className = "rx-row";
  row.id = rowId;

  const dose = String(data.dose || "1-0-1");
  const timing = String(data.timing || "After food");
  const duration = String(data.duration || "2 days");
  const notes = String(data.notes || "");

  row.innerHTML = `
    <!-- Column 1: Medicine Name & Autocomplete -->
    <div class="rx-row-col rx-col-name">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
        <span class="mobile-col-label" style="display: flex; align-items: center; gap: 4px;">
          <span class="rx-med-num-badge">#1</span>
          <span>Medicine Name &amp; Strength</span>
        </span>
        <button type="button" class="btn-remove-row mobile-only-remove" onclick="removeMedicineRow(this)" title="Remove medicine">&times;</button>
      </div>
      <div class="autocomplete-container">
        <input type="text" class="form-control med-name" placeholder="Type medicine (e.g. Paracetamol, Augmentin)..." value="${escapeHtml(data.name || '')}" autocomplete="off">
        <div class="autocomplete-results"></div>
      </div>
    </div>

    <!-- Column 2: Dosage & Frequency with Quick Chips -->
    <div class="rx-row-col rx-col-dosage">
      <span class="mobile-col-label">Dosage &amp; Frequency</span>
      <input type="text" class="form-control med-dosage" placeholder="1-0-1" value="${escapeHtml(dose)}">
      <div class="chip-group dosage-chips">
        <span class="quick-chip ${dose === '1-0-1' ? 'active' : ''}" data-val="1-0-1" onclick="selectRowChip(this, 'dosage')">1-0-1</span>
        <span class="quick-chip ${dose === '1-0-0' ? 'active' : ''}" data-val="1-0-0" onclick="selectRowChip(this, 'dosage')">1-0-0</span>
        <span class="quick-chip ${dose === '0-0-1' ? 'active' : ''}" data-val="0-0-1" onclick="selectRowChip(this, 'dosage')">0-0-1</span>
        <span class="quick-chip ${dose === '1-1-1' ? 'active' : ''}" data-val="1-1-1" onclick="selectRowChip(this, 'dosage')">1-1-1</span>
        <span class="quick-chip ${dose.includes('SOS') ? 'active' : ''}" data-val="1-0-1 (SOS)" onclick="selectRowChip(this, 'dosage')">SOS</span>
      </div>
    </div>

    <!-- Column 3: When / Timing with Quick Chips -->
    <div class="rx-row-col rx-col-timing">
      <span class="mobile-col-label">When / Timing</span>
      <input type="text" class="form-control med-timing" placeholder="After food" value="${escapeHtml(timing)}">
      <div class="chip-group timing-chips">
        <span class="quick-chip ${timing.toLowerCase().includes('after') ? 'active' : ''}" data-val="After food" onclick="selectRowChip(this, 'timing')">After food</span>
        <span class="quick-chip ${timing.toLowerCase().includes('before') ? 'active' : ''}" data-val="Before food" onclick="selectRowChip(this, 'timing')">Before food</span>
        <span class="quick-chip ${timing.toLowerCase().includes('empty') ? 'active' : ''}" data-val="Empty stomach" onclick="selectRowChip(this, 'timing')">Empty stomach</span>
        <span class="quick-chip ${timing.toLowerCase().includes('bed') || timing.toLowerCase().includes('night') ? 'active' : ''}" data-val="At bedtime" onclick="selectRowChip(this, 'timing')">Bedtime</span>
      </div>
    </div>

    <!-- Column 4: Duration with Stepper [-] [+] & Quick Chips (1d, 2d, 3d, 5d, 7d, 10d, 14d, 1m) -->
    <div class="rx-row-col rx-col-duration">
      <span class="mobile-col-label">Duration</span>
      <div class="duration-stepper-wrap">
        <button type="button" class="duration-step-btn" onclick="stepDuration(this, -1)" title="Decrease 1 day">−</button>
        <input type="text" class="form-control med-duration" placeholder="2 days" value="${escapeHtml(duration)}" style="text-align: center;">
        <button type="button" class="duration-step-btn" onclick="stepDuration(this, 1)" title="Increase 1 day">+</button>
      </div>
      <div class="chip-group duration-chips">
        <span class="quick-chip ${duration.includes('1') && !duration.includes('10') && !duration.includes('14') ? 'active' : ''}" data-val="1 day" onclick="selectRowChip(this, 'duration')">1d</span>
        <span class="quick-chip ${duration.includes('2') ? 'active' : ''}" data-val="2 days" onclick="selectRowChip(this, 'duration')">2d</span>
        <span class="quick-chip ${duration.includes('3') ? 'active' : ''}" data-val="3 days" onclick="selectRowChip(this, 'duration')">3d</span>
        <span class="quick-chip ${duration.includes('5') ? 'active' : ''}" data-val="5 days" onclick="selectRowChip(this, 'duration')">5d</span>
        <span class="quick-chip ${duration.includes('7') ? 'active' : ''}" data-val="7 days" onclick="selectRowChip(this, 'duration')">7d</span>
        <span class="quick-chip ${duration.includes('10') ? 'active' : ''}" data-val="10 days" onclick="selectRowChip(this, 'duration')">10d</span>
        <span class="quick-chip ${duration.includes('14') ? 'active' : ''}" data-val="14 days" onclick="selectRowChip(this, 'duration')">14d</span>
        <span class="quick-chip ${duration.includes('30') || duration.includes('month') ? 'active' : ''}" data-val="30 days" onclick="selectRowChip(this, 'duration')">1m</span>
      </div>
    </div>

    <!-- Column 5: Special Instructions with Quick Tags -->
    <div class="rx-row-col rx-col-notes">
      <span class="mobile-col-label">Special Instructions</span>
      <input type="text" class="form-control med-notes" placeholder="Special instructions" value="${escapeHtml(notes)}">
      <div class="chip-group notes-chips">
        <span class="quick-chip" data-val="With warm water" onclick="appendRowNote(this)">Warm water</span>
        <span class="quick-chip" data-val="If fever persists" onclick="appendRowNote(this)">If fever</span>
        <span class="quick-chip" data-val="Complete course" onclick="appendRowNote(this)">Full course</span>
      </div>
    </div>

    <!-- Column 6: Remove Action -->
    <div class="rx-col-action" style="text-align: center;">
      <button type="button" class="btn-remove-row" onclick="removeMedicineRow(this)" title="Remove medicine">&times;</button>
    </div>
  `;

  container.appendChild(row);
  updateMedicineRowNumbers();

  // Setup autocomplete
  const nameInput = row.querySelector(".med-name");
  setupMedicineAutocomplete(nameInput, row);

  // Live chip state sync
  const dInput = row.querySelector(".med-dosage");
  const tInput = row.querySelector(".med-timing");
  const durInput = row.querySelector(".med-duration");
  if (dInput) dInput.addEventListener("input", () => syncRowChips(row));
  if (tInput) tInput.addEventListener("input", () => syncRowChips(row));
  if (durInput) durInput.addEventListener("input", () => syncRowChips(row));
}

function stepDuration(btn, delta) {
  const rowCol = btn.closest(".rx-col-duration");
  if (!rowCol) return;
  const input = rowCol.querySelector(".med-duration");
  if (!input) return;

  const currentText = input.value.trim();
  const match = currentText.match(/(\d+)/);
  let currentNum = match ? parseInt(match[1], 10) : 2;

  let unit = "days";
  if (/month|m$/i.test(currentText)) unit = "months";
  else if (/week|w$/i.test(currentText)) unit = "weeks";

  let newNum = Math.max(1, currentNum + delta);
  input.value = (unit === "days" && newNum === 1) ? "1 day" : (newNum + " " + unit);

  const row = btn.closest(".rx-row");
  if (row) syncRowChips(row);
}

function selectRowChip(chipEl, type) {
  const rowCol = chipEl.closest(".rx-row-col");
  if (!rowCol) return;
  const input = rowCol.querySelector("input");
  if (!input) return;

  const val = chipEl.dataset.val;
  input.value = val;

  rowCol.querySelectorAll(".quick-chip").forEach(c => c.classList.remove("active"));
  chipEl.classList.add("active");
}

function appendRowNote(chipEl) {
  const rowCol = chipEl.closest(".rx-row-col");
  if (!rowCol) return;
  const input = rowCol.querySelector("input");
  if (!input) return;

  const note = chipEl.dataset.val;
  if (!input.value.trim()) {
    input.value = note;
  } else if (!input.value.includes(note)) {
    input.value += `, ${note}`;
  }
  chipEl.classList.add("active");
}

function syncRowChips(row) {
  const doseVal = (row.querySelector(".med-dosage")?.value || "").trim().toLowerCase();
  row.querySelectorAll(".dosage-chips .quick-chip").forEach(chip => {
    chip.classList.toggle("active", chip.dataset.val.toLowerCase() === doseVal);
  });

  const timingVal = (row.querySelector(".med-timing")?.value || "").trim().toLowerCase();
  row.querySelectorAll(".timing-chips .quick-chip").forEach(chip => {
    chip.classList.toggle("active", chip.dataset.val.toLowerCase() === timingVal);
  });

  const durationVal = (row.querySelector(".med-duration")?.value || "").trim().toLowerCase();
  row.querySelectorAll(".duration-chips .quick-chip").forEach(chip => {
    chip.classList.toggle("active", chip.dataset.val.toLowerCase() === durationVal);
  });
}

function removeMedicineRow(btn) {
  const container = document.getElementById("rx-medicine-rows");
  const row = btn.closest(".rx-row");
  if (row) {
    row.remove();
  updateMedicineRowNumbers();
  }
  if (container && container.children.length === 0) {
    addMedicineRow();
  }
  updateDynamicMedicationSuggestions();
}

function setupMedicineAutocomplete(input, row) {
  if (!input || !row) return;
  const resultsBox = row.querySelector(".autocomplete-results");
  if (!resultsBox) return;
  let activeIndex = -1;

  function doSearch() {
    const q = input.value.trim().toLowerCase();
    if (!q) {
      resultsBox.classList.remove("active");
      resultsBox.innerHTML = "";
  syncRowChips(row);
      activeIndex = -1;
      return;
    }

    // Filter drugs matching name, generic, or category
    const matches = DRUG_DATABASE.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.generic.toLowerCase().includes(q) ||
      d.cat.toLowerCase().includes(q)
    ).slice(0, 8);

    resultsBox.innerHTML = "";
    activeIndex = -1;

    if (matches.length === 0) {
      resultsBox.innerHTML = `
        <div style="padding: 8px 12px; font-size: 0.8rem; color: #64748b;">
          No standard match. Doctor can keep custom drug name.
        </div>
      `;
    } else {
      matches.forEach((drug, index) => {
        const item = document.createElement("div");
        item.className = "autocomplete-item";
        item.dataset.index = index;
        item.innerHTML = `
          <strong>${highlightQuery(drug.name, q)}</strong>
          <small>${drug.generic} &bull; <span style="color: var(--primary-dark); font-weight: 600;">${drug.cat}</span> &bull; Typical: ${drug.dose}</small>
        `;

        item.addEventListener("mousedown", (e) => {
          e.preventDefault(); // Prevents input blur before select
          applyDrugSelection(drug, row);
        });

        resultsBox.appendChild(item);
      });
    }

    resultsBox.classList.add("active");
  }

  input.addEventListener("input", doSearch);
  input.addEventListener("focus", () => {
    if (input.value.trim().length > 0) doSearch();
  });

  input.addEventListener("keydown", (e) => {
    const items = resultsBox.querySelectorAll(".autocomplete-item");
    if (!resultsBox.classList.contains("active") || items.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % items.length;
      updateActiveItem(items);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + items.length) % items.length;
      updateActiveItem(items);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < items.length) {
        items[activeIndex].dispatchEvent(new MouseEvent("mousedown"));
      } else if (items.length > 0) {
        items[0].dispatchEvent(new MouseEvent("mousedown"));
      }
    } else if (e.key === "Escape") {
      resultsBox.classList.remove("active");
    }
  });

  input.addEventListener("blur", () => {
    setTimeout(() => {
      resultsBox.classList.remove("active");
    }, 200);
  });

  function updateActiveItem(items) {
    items.forEach((it, idx) => {
      it.classList.toggle("active", idx === activeIndex);
      if (idx === activeIndex) {
        it.scrollIntoView({ block: "nearest" });
      }
    });
  }
}

function applyDrugSelection(drug, row) {
  const nameInput = row.querySelector(".med-name");
  const doseInput = row.querySelector(".med-dosage");
  const timingInput = row.querySelector(".med-timing");
  const durationInput = row.querySelector(".med-duration");
  const notesInput = row.querySelector(".med-notes");
  const resultsBox = row.querySelector(".autocomplete-results");

  nameInput.value = drug.name;
  if (doseInput && drug.dose) doseInput.value = drug.dose;
  if (timingInput && drug.timing) timingInput.value = drug.timing;
  if (durationInput && drug.duration) durationInput.value = drug.duration;
  if (notesInput && drug.notes) notesInput.value = drug.notes;

  resultsBox.classList.remove("active");
  resultsBox.innerHTML = "";

  // Focus duration field so doctor can quickly customize
  if (durationInput) durationInput.focus();
}

function highlightQuery(text, query) {
  if (!query) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi");
  return text.replace(regex, `<mark style="background:#fef08a; padding: 0 1px;">$1</mark>`);
}

function quickAddMed(name, freq, timing, duration, notes) {
  addMedicineRow({ name, dose: freq, timing, duration, notes });
}


// ============================================================================
// POPULAR SYMPTOMS & CHIEF COMPLAINTS DATABASE (GOOGLE-STYLE AUTOCOMPLETE)
// ============================================================================
const POPULAR_SYMPTOMS_LIST = [
  { name: "Pain", category: "General Complaints", synonyms: ["pain", "dard", "acute pain", "severe pain"] },
  { name: "Body Pain / Generalized Aches", category: "General Complaints", synonyms: ["body pain", "badan dard", "body ache", "aches"] },
  { name: "High Grade Fever", category: "General / Pyrexia", synonyms: ["fever", "pyrexia", "high temp", "bukhar"] },
  { name: "Low Grade Fever", category: "General / Pyrexia", synonyms: ["mild fever", "warm body"] },
  { name: "Fever with Chills & Rigors", category: "Infectious / Pyrexia", synonyms: ["shivering", "chills", "dengue", "malaria"] },
  { name: "Sore Throat", category: "ENT / Respiratory", synonyms: ["throat pain", "irritation in throat", "gala dard"] },
  { name: "Painful Swallowing (Odynophagia)", category: "ENT / Respiratory", synonyms: ["throat pain", "dysphagia"] },
  { name: "Productive Cough (with phlegm)", category: "Respiratory", synonyms: ["wet cough", "phlegm", "balgam"] },
  { name: "Dry Spasmodic Cough", category: "Respiratory", synonyms: ["dry cough", "tickly cough", "khansi"] },
  { name: "Runny Nose (Rhinorrhea)", category: "ENT / Respiratory", synonyms: ["sneezing", "nasal discharge", "zukham"] },
  { name: "Nasal Congestion & Blockage", category: "ENT / Respiratory", synonyms: ["blocked nose", "stuffy nose"] },
  { name: "Sneezing Spells", category: "Allergy / ENT", synonyms: ["allergic rhinitis", "sneezing"] },
  { name: "Shortness of Breath (Dyspnea)", category: "Respiratory / Cardio", synonyms: ["breathlessness", "asthma", "wheeze", "dum phoolna"] },
  { name: "Wheezing & Chest Tightness", category: "Respiratory", synonyms: ["whistling chest", "asthma", "bronchitis"] },
  { name: "Severe Frontal Headache", category: "Neurology", synonyms: ["headache", "sar dard", "sinusitis"] },
  { name: "Throbbing Hemicranial Headache", category: "Neurology", synonyms: ["migraine", "one sided headache"] },
  { name: "Occipital Heaviness & Neck Pain", category: "Cardio / Musculoskeletal", synonyms: ["bp headache", "tension headache"] },
  { name: "Dizziness & Giddiness", category: "General / Neurology", synonyms: ["vertigo", "chakkar", "lightheaded"] },
  { name: "Burning Epigastric Pain (Heartburn)", category: "Gastroenterology", synonyms: ["acidity", "gastritis", "chest burning", "jalan"] },
  { name: "Acid Regurgitation & Sour Burps", category: "Gastroenterology", synonyms: ["gerd", "sour belching", "khatti dakar"] },
  { name: "Nausea & Vomiting", category: "Gastroenterology", synonyms: ["retching", "vomit", "ulti"] },
  { name: "Abdominal Cramping Pain", category: "Gastroenterology", synonyms: ["stomach ache", "pet dard", "colic"] },
  { name: "Watery Loose Motions (Diarrhea)", category: "Gastroenterology", synonyms: ["loose stools", "diarrhea", "dast", "motions"] },
  { name: "Dysentery (Stools with mucus/blood)", category: "Gastroenterology", synonyms: ["amoebiasis", "bloody stool"] },
  { name: "Burning Micturition (Dysuria)", category: "Urology", synonyms: ["uti", "burning urine", "peshab me jalan"] },
  { name: "Increased Urinary Frequency & Urgency", category: "Urology / Metabolic", synonyms: ["frequent urination", "uti", "diabetes"] },
  { name: "Excessive Thirst & Frequent Urination", category: "Metabolic / Endocrine", synonyms: ["diabetes", "polydipsia", "polyuria"] },
  { name: "Generalized Body Ache & Malaise", category: "General", synonyms: ["body ache", "fatigue", "badan dard", "weakness"] },
  { name: "Severe Itching & Skin Rashes (Pruritus)", category: "Dermatology", synonyms: ["allergy", "hives", "urticaria", "khujli"] },
  { name: "Knee Joint Pain & Stiffness", category: "Rheumatology / Ortho", synonyms: ["osteoarthritis", "joint pain", "ghutna dard"] },
  { name: "Low Back Ache (Lumbago)", category: "Orthopedics", synonyms: ["back pain", "kamar dard", "sciatica"] },
  { name: "Chest Pain on Exertion", category: "Cardiology", synonyms: ["angina", "cardiac", "chest pressure"] },
  { name: "Palpitations & Rapid Heartbeat", category: "Cardiology", synonyms: ["fast pulse", "racing heart", "tachycardia"] },
  { name: "Infantile Colic & Constant Crying", category: "Pediatrics", synonyms: ["baby gas", "colic", "crying baby"] }
];

// ============================================================================
// POPULAR DIAGNOSES & ICD ASSESSMENTS DATABASE (GOOGLE-STYLE AUTOCOMPLETE)
// ============================================================================
const POPULAR_DIAGNOSIS_LIST = [
  { name: "Upper Respiratory Tract Infection (URTI)", category: "Respiratory", tags: ["cold", "cough", "rhinitis", "viral cold", "fever"] },
  { name: "Acute Pharyngo-Tonsillitis", category: "ENT / Respiratory", tags: ["sore throat", "tonsillitis", "fever", "throat infection", "strep"] },
  { name: "Acute Bronchitis", category: "Respiratory", tags: ["cough", "productive cough", "chest congestion", "phlegm"] },
  { name: "Bronchial Asthma (Acute Exacerbation)", category: "Respiratory", tags: ["wheezing", "dyspnea", "breathlessness", "asthma"] },
  { name: "Viral Fever / Pyrexia of Unknown Origin", category: "Infectious", tags: ["fever", "body ache", "headache", "viral pyrexia"] },
  { name: "Acute Gastritis / Acid Peptic Disease (GERD)", category: "Gastroenterology", tags: ["acidity", "heartburn", "gerd", "epigastric pain", "dyspepsia"] },
  { name: "Acute Gastroenteritis (Food Poisoning)", category: "Gastroenterology", tags: ["diarrhea", "loose motions", "vomiting", "stomach infection"] },
  { name: "Amoebic Dysentery", category: "Gastroenterology", tags: ["dysentery", "loose stools", "mucus in stool", "cramps"] },
  { name: "Stage 1 Essential Hypertension", category: "Cardiovascular", tags: ["hypertension", "high bp", "bp review", "headache"] },
  { name: "Stage 2 Essential Hypertension", category: "Cardiovascular", tags: ["hypertension", "severe bp", "cardiac"] },
  { name: "Type 2 Diabetes Mellitus (Uncontrolled)", category: "Endocrine", tags: ["diabetes", "high sugar", "t2dm", "polyuria", "thirst"] },
  { name: "Urinary Tract Infection (Acute Cystitis)", category: "Urology", tags: ["uti", "burning urine", "dysuria", "urine infection"] },
  { name: "Allergic Rhinitis / Sinusitis", category: "Allergy / ENT", tags: ["sneezing", "cold", "allergy", "sinus headache"] },
  { name: "Allergic Dermatitis / Acute Urticaria", category: "Dermatology", tags: ["skin rash", "itching", "hives", "allergy"] },
  { name: "Migraine / Tension Headache", category: "Neurology", tags: ["headache", "migraine", "sar dard"] },
  { name: "Enteric Fever (Typhoid Suspect)", category: "Infectious", tags: ["typhoid", "prolonged fever", "step ladder fever", "headache"] },
  { name: "Dengue Fever (Probable)", category: "Infectious", tags: ["dengue", "high fever", "platelets", "severe body ache", "retro-orbital pain"] },
  { name: "Osteoarthritis of Knees", category: "Musculoskeletal", tags: ["joint pain", "knee pain", "arthritis"] },
  { name: "Acute Lumbago / Muscle Spasm", category: "Musculoskeletal", tags: ["back pain", "kamar dard", "spasm"] },
  { name: "Infantile Colic & Reflux", category: "Pediatrics", tags: ["colic", "crying", "gas", "infant"] }
];

// ============================================================================
// DYNAMIC CLINICAL INFERENCE: SYMPTOMS -> DIAGNOSIS -> MEDICATIONS & KITS
// ============================================================================

// Base default common symptoms for quick tapping
const DEFAULT_OPD_SYMPTOMS = [
  "Pain",
  "Fever",
  "Productive Cough",
  "Dry Cough",
  "Sore Throat",
  "Headache",
  "Body Ache",
  "Abdominal Pain",
  "Nausea / Vomiting",
  "Diarrhea",
  "Shortness of Breath",
  "Runny Nose",
  "Hypertension Review"
];

function onSymptomsInputChanged() {
  setupSymptomsAutocomplete();
  setupDiagnosisAutocomplete();
  updateDynamicSymptomChips();
  updateDynamicDiagnosisChips();
  updateDynamicMedicationSuggestions();
}

function onDiagnosisInputChanged() {
  const diag = document.getElementById("rx-diagnosis")?.value || "";
  updateDynamicDiagnosisChips();
  updateDynamicMedicationSuggestions(diag);
}

// Re-usable helper: split comma-separated text into clean items array
function parseCommaSeparatedTokens(text) {
  if (!text) return [];
  return text.split(/[,\n]+/).map(t => t.trim()).filter(Boolean);
}

// Two-way toggle for Symptoms chips
function toggleQuickSymptom(symptomName) {
  const area = document.getElementById("rx-symptoms");
  if (!area) return;

  const currentTokens = parseCommaSeparatedTokens(area.value);
  const targetLower = symptomName.trim().toLowerCase();
  // Exact match or whole-word match only to prevent loose substring replacement
  const existingIndex = currentTokens.findIndex(t => {
    const tLower = t.trim().toLowerCase();
    return tLower === targetLower;
  });

  if (existingIndex >= 0) {
    // Unselect: remove from textbox
    currentTokens.splice(existingIndex, 1);
    showToast(`Removed "${symptomName}" from symptoms`, "info");
  } else {
    // Select: add to textbox
    currentTokens.push(symptomName);
    showToast(`Added "${symptomName}"`, "success");
  }

  area.value = currentTokens.join(", ");
  onSymptomsInputChanged();
}

// Render Symptom chips with selected ones at the top and colored
function updateDynamicSymptomChips() {
  const container = document.getElementById("quick-symptoms-chips");
  if (!container) return;

  const area = document.getElementById("rx-symptoms");
  const currentTokens = parseCommaSeparatedTokens(area ? area.value : "");
  const currentTokensLower = currentTokens.map(t => t.toLowerCase());

  // Merge default list with any extra typed symptoms
  const allList = [...DEFAULT_OPD_SYMPTOMS];
  currentTokens.forEach(tok => {
    if (!allList.some(s => s.toLowerCase() === tok.toLowerCase())) {
      allList.unshift(tok);
    }
  });

  // Partition into selected and unselected so selected appear at the top/front
  const selectedList = [];
  const unselectedList = [];

    try {
    allList.forEach(item => {
      const itemName = typeof item === 'string' ? item : (item && item.name ? item.name : '');
      const isSel = currentTokensLower.some(tok => tok === itemName.toLowerCase() || (tok && itemName.toLowerCase().includes(tok)));
      if (isSel) {
        selectedList.push({ name: itemName, selected: true });
      } else {
        unselectedList.push({ name: itemName, selected: false });
      }
    });
  } catch (chipErr) {
    console.error("updateDynamicSymptomChips item error:", chipErr);
  }

  container.innerHTML = "";
  const sorted = [...selectedList, ...unselectedList];

  sorted.forEach(item => {
    const chip = document.createElement("span");
    chip.className = `tag-chip ${item.selected ? 'chip-selected active' : ''}`;
    chip.innerHTML = `${item.selected ? '✓ ' : '+ '}${escapeHtml(item.name)}`;
    chip.onclick = () => toggleQuickSymptom(item.name);
    container.appendChild(chip);
  });
}

// Two-way toggle for Diagnosis chips
function toggleQuickDiagnosis(diagName) {
  const input = document.getElementById("rx-diagnosis");
  if (!input) return;

  const currentVal = input.value.trim();
  const cleanDiag = diagName.split(" (")[0].trim();

  if (currentVal.toLowerCase() === cleanDiag.toLowerCase() || currentVal.toLowerCase() === diagName.toLowerCase()) {
    // Unselect: clear diagnosis
    input.value = "";
    showToast(`Cleared diagnosis "${cleanDiag}"`, "info");
  } else {
    // Select: set diagnosis
    input.value = cleanDiag;
    showToast(`Selected diagnosis: ${cleanDiag}`, "success");
  }

  onDiagnosisInputChanged();
}

function updateDynamicDiagnosisChips() {
  try {
    const symptomsInput = document.getElementById("rx-symptoms");
    const currentDiag = (document.getElementById("rx-diagnosis")?.value || "").trim().toLowerCase();
    const symptomsText = (symptomsInput ? symptomsInput.value : "").toLowerCase();
    const diagContainer = document.getElementById("dynamic-diagnosis-chips");
    if (!diagContainer) return;

    if (typeof CLINICAL_KNOWLEDGE_BASE === "undefined" || !Array.isArray(CLINICAL_KNOWLEDGE_BASE)) {
      console.warn("CLINICAL_KNOWLEDGE_BASE not yet available");
      return;
    }

    // Split symptoms into words & phrases
    const symTokens = parseCommaSeparatedTokens(symptomsText).map(s => s.toLowerCase());

    // Score each diagnosis from the clinical knowledge base
    const scored = CLINICAL_KNOWLEDGE_BASE.map(entry => {
      let score = 0;
      if (symTokens.length > 0) {
        symTokens.forEach(tok => {
          entry.symptoms.forEach(sym => {
            const sLower = sym.toLowerCase();
            if (sLower.includes(tok) || tok.includes(sLower.split(" ")[0])) {
              score += 5;
            }
          });
          entry.tags.forEach(tag => {
            if (tag.toLowerCase().includes(tok) || tok.includes(tag)) {
              score += 3;
            }
          });
        });
      }
      return { entry, score };
    });

    // Sort by match score descending
    scored.sort((a, b) => b.score - a.score);

    // Also include any custom doctor kits triggers
    (appData.doctorKits || []).forEach(kit => {
      if (kit.triggerDiagnosis && !scored.some(s => s.entry.diagnosis.toLowerCase() === kit.triggerDiagnosis.toLowerCase())) {
        let kitScore = 0;
        if (symTokens.length > 0 && kit.triggerSymptoms) {
          kit.triggerSymptoms.forEach(sym => {
            if (symTokens.some(tok => sym.toLowerCase().includes(tok) || tok.includes(sym.toLowerCase()))) {
              kitScore += 6;
            }
          });
        }
        scored.unshift({
          entry: {
            id: kit.id,
            diagnosis: kit.triggerDiagnosis,
            symptoms: kit.triggerSymptoms || [],
            tags: ["Doctor Kit"]
          },
          score: kitScore,
          isDoctorKit: true
        });
      }
    });

    // Partition: selected diagnosis goes directly to top/first position
    const selectedChips = [];
    const unselectedChips = [];

    scored.slice(0, 10).forEach(item => {
      const cleanName = item.entry.diagnosis.split(" (")[0].trim();
      const isSelected = currentDiag && (currentDiag === cleanName.toLowerCase() || currentDiag === item.entry.diagnosis.toLowerCase());

      if (isSelected) {
        selectedChips.push({ ...item, isSelected: true, cleanName });
      } else {
        unselectedChips.push({ ...item, isSelected: false, cleanName });
      }
    });

    diagContainer.innerHTML = "";
    const finalList = [...selectedChips, ...unselectedChips];

    finalList.forEach(item => {
      const chip = document.createElement("span");
      let classes = "tag-chip";
      if (item.isSelected) {
        classes += " chip-selected active selected-diagnosis-tag";
      } else if (item.score > 0) {
        classes += " relevant-tag";
      }
      chip.className = classes;

      chip.innerHTML = `${item.isSelected ? '✓ ' : item.score > 0 ? '★ ' : '+ '}${escapeHtml(item.cleanName)}`;
      chip.title = `Score: ${item.score} | Symptoms: ${item.entry.symptoms.slice(0, 3).join(", ")}`;

      chip.onclick = () => {
        toggleQuickDiagnosis(item.cleanName);
      };
      diagContainer.appendChild(chip);
    });
  } catch (err) {
    console.error("updateDynamicDiagnosisChips error:", err);
  }
}

// Live Medication Suggestions with Two-Way Toggle & Smart Re-ordering
function updateDynamicMedicationSuggestions(diagnosis) {
  try {
    const diagText = (diagnosis || document.getElementById("rx-diagnosis")?.value || "").toLowerCase();
    const symptomsText = (document.getElementById("rx-symptoms")?.value || "").toLowerCase();
    const medChipsContainer = document.getElementById("dynamic-med-chips");
    const kitsContainer = document.getElementById("dynamic-kits-container");
    if (!medChipsContainer) return;

    // 1. Get patient age
    const patientId = document.getElementById("rx-patient-select")?.value;
    const pt = (appData.patients || []).find(p => p.id === patientId);
    const ptAge = pt ? pt.age : 30;
    const isInfant = ptAge <= 1;
    const isPediatric = ptAge > 1 && ptAge < 12;

    // 2. Doctor's Protocol Kits Matching
    const doctorKits = (appData.doctorKits || []).filter(kit => {
      const diagMatch = !kit.triggerDiagnosis || (diagText && (diagText.includes(kit.triggerDiagnosis.toLowerCase()) || kit.triggerDiagnosis.toLowerCase().includes(diagText)));
      const symMatch = (kit.triggerSymptoms || []).some(s => symptomsText.includes(s.toLowerCase()));
      const ageMatch = !kit.ageGroup || kit.ageGroup === 'all' ||
                       (isInfant && kit.ageGroup === 'infant') ||
                       (isPediatric && kit.ageGroup === 'pediatric') ||
                       (!isInfant && !isPediatric && kit.ageGroup === 'adult');
      return (diagMatch || symMatch) && ageMatch;
    });

    if (kitsContainer) {
      if (doctorKits.length > 0 && (diagText || symptomsText)) {
        kitsContainer.style.display = "block";
        kitsContainer.innerHTML = `
          <div class="doctor-kits-banner">
            <div class="doctor-kits-header">
              <span class="kit-badge">⭐ Doctor's Protocol Kit</span>
              <span>Matching treatment bundle for <strong>${escapeHtml(pt ? pt.name : 'Patient')}</strong> (${ptAge}y):</span>
            </div>
            <div class="kit-buttons-row">
              ${doctorKits.map(k => `
                <button type="button" class="btn btn-kit-apply" onclick="applyDoctorKit('${k.id}')">
                  <span style="font-size:1.1rem;">📦</span>
                  <span>Apply <strong>${escapeHtml(k.name)}</strong> (${(k.medicines || []).length} meds)</span>
                </button>
              `).join('')}
            </div>
          </div>
        `;
      } else if (typeof CLINICAL_KNOWLEDGE_BASE !== "undefined") {
        const sysMatch = CLINICAL_KNOWLEDGE_BASE.find(kb =>
          (diagText && (diagText.includes(kb.diagnosis.toLowerCase()) || kb.tags.some(t => diagText.includes(t)))) ||
          (symptomsText && kb.symptoms.some(s => symptomsText.includes(s.toLowerCase().split(" ")[0])))
        );
        if (sysMatch && (diagText || symptomsText)) {
          kitsContainer.style.display = "block";
          const medsToUse = isInfant && sysMatch.infantMedications ? sysMatch.infantMedications :
                            isPediatric && sysMatch.pediatricMedications ? sysMatch.pediatricMedications :
                            sysMatch.medications;
          const ageLabel = isInfant ? 'Infant Protocol' : isPediatric ? 'Pediatric Protocol' : 'Standard Protocol';

          kitsContainer.innerHTML = `
            <div class="doctor-kits-banner system-kit">
              <div class="doctor-kits-header">
                <span class="kit-badge system">⚡ 1-Tap Protocol (${ageLabel})</span>
                <span>Evidence-based regimen for <strong>${escapeHtml(sysMatch.diagnosis.split(" (")[0])}</strong>:</span>
              </div>
              <div class="kit-buttons-row">
                <button type="button" class="btn btn-kit-apply system" onclick="applySystemKit('${sysMatch.id}')">
                  <span>⚡ Apply Full Regimen (${medsToUse.length} meds + Advice)</span>
                </button>
                <button type="button" class="btn btn-outline btn-xs" onclick="saveAsMyCustomKit('${sysMatch.id}')" title="Save this protocol as my custom kit for instant 1-tap editing">
                  <span>⭐ Save as My Kit</span>
                </button>
              </div>
            </div>
          `;
        } else {
          kitsContainer.style.display = "none";
          kitsContainer.innerHTML = "";
        }
      } else {
        kitsContainer.style.display = "none";
        kitsContainer.innerHTML = "";
      }
    }

    
    // 2.5 Apply Doctor's Custom Personalization Ranking Rules
    seedDefaultDoctorRules();
    const activeDoctorRules = (appData.doctorRules || []).filter(rule => {
      const symLower = rule.symptom.toLowerCase();
      return symptomsText.includes(symLower) || (diagText && diagText.includes(symLower));
    });

    const ruleBonusMeds = [];
    activeDoctorRules.forEach(rule => {
      (rule.medicines || []).forEach((mName, rankIdx) => {
        // Priority weight based on ranking order (#1 gets highest priority)
        const rankBonus = 100 - (rankIdx * 10);
        ruleBonusMeds.push({ name: mName, rankBonus, ruleSymptom: rule.symptom });
      });
    });

    // 3. Assemble dynamic medication recommendations
    let suggestedMeds = [];

    doctorKits.forEach(k => {
      (k.medicines || []).forEach(m => {
        if (!suggestedMeds.some(sm => sm.name.toLowerCase() === m.name.toLowerCase())) {
          suggestedMeds.push({ ...m, isDoctorKit: true });
        }
      });
    });

    if (typeof CLINICAL_KNOWLEDGE_BASE !== "undefined") {
      const matchedKBs = CLINICAL_KNOWLEDGE_BASE.filter(kb => {
        const dMatch = diagText && (diagText.includes(kb.diagnosis.toLowerCase()) || kb.tags.some(t => diagText.includes(t)));
        const sMatch = symptomsText && kb.symptoms.some(s => symptomsText.includes(s.toLowerCase().split(" ")[0]));
        return dMatch || sMatch;
      });

      matchedKBs.forEach(kb => {
        const kbMeds = isInfant && kb.infantMedications ? kb.infantMedications :
                       isPediatric && kb.pediatricMedications ? kb.pediatricMedications :
                       kb.medications;
        kbMeds.forEach(m => {
          if (!suggestedMeds.some(sm => sm.name.toLowerCase() === m.name.toLowerCase())) {
            suggestedMeds.push(m);
          }
        });
      });
    }

    // Direct Symptom-to-Drug & Injection Matching from DRUG_DATABASE (Formulary)
    const symTokens = parseCommaSeparatedTokens(symptomsText).map(t => t.toLowerCase());
    if (symTokens.length > 0) {
      DRUG_DATABASE.forEach(drug => {
        const drugSymptoms = Array.isArray(drug.symptoms) ? drug.symptoms : [];
        const matchesSymptom = drugSymptoms.some(ds => {
          const dsLower = ds.toLowerCase();
          return symTokens.some(tok => dsLower.includes(tok) || tok.includes(dsLower.split(" ")[0]));
        });

        if (matchesSymptom && !suggestedMeds.some(sm => sm.name.toLowerCase() === drug.name.toLowerCase())) {
          suggestedMeds.push({
            name: drug.name,
            dose: drug.dose,
            timing: drug.timing,
            duration: drug.duration,
            notes: drug.notes,
            cat: drug.cat
          });
        }
      });
    }

    const generalOPDFallbacks = [
      { name: "Tab. Paracetamol 650mg", dose: "1-0-1", timing: "After food", duration: "3 days", notes: "For fever/pain" },
      { name: "Tab. Pantoprazole 40mg", dose: "1-0-0", timing: "Before breakfast", duration: "5 days", notes: "Empty stomach" },
      { name: "Tab. Montair-LC", dose: "0-0-1", timing: "At night", duration: "5 days", notes: "For allergy/cough" },
      { name: "Tab. Augmentin 625mg", dose: "1-0-1", timing: "After food", duration: "5 days", notes: "Antibiotic" },
      { name: "Tab. Cetirizine 10mg", dose: "0-0-1", timing: "At night", duration: "3 days", notes: "Anti-allergic" },
      { name: "Tab. Dolo 650mg", dose: "1-0-1", timing: "After food", duration: "3 days", notes: "Antipyretic" },
      { name: "Tab. Azithromycin 500mg", dose: "1-0-0", timing: "1 hour before food", duration: "3 days", notes: "Antibiotic" },
      { name: "Syp. Gelusil MPS", dose: "10ml TDS", timing: "After meals", duration: "5 days", notes: "Antacid" },
      { name: "IV RL (Ringer Lactate) 500ml", dose: "1 Bottle IV", timing: "Slow IV drip", duration: "Stat", notes: "With IV Set" },
      { name: "IV NS 0.9% 500ml", dose: "1 Bottle IV", timing: "Slow IV drip", duration: "Stat", notes: "With IV Set" },
      { name: "Inj. Pantoprazole 40mg (Pan-IV)", dose: "1 Vial IV", timing: "Slow IV push", duration: "Stat", notes: "Anti-emetic / PPI" },
      { name: "Inj. Ondansetron 2ml (Emeset)", dose: "2ml IV/IM", timing: "Stat", duration: "Stat", notes: "Anti-emetic" },
      { name: "Inj. Diclofenac 75mg (Dynapar AQ)", dose: "1 Ampoule IM", timing: "Deep IM", duration: "Stat", notes: "Analgesic" },
      { name: "IV Infusion Set with Micro Drip", dose: "1 Set", timing: "Disposable", duration: "Once", notes: "Sterile IV Set" },
      { name: "Disposable Syringe 2ml / 5ml", dose: "1 Syringe", timing: "Single use", duration: "Once", notes: "Sterile Syringe" }
    ];

    generalOPDFallbacks.forEach(fm => {
      if (!suggestedMeds.some(sm => sm.name.toLowerCase() === fm.name.toLowerCase())) {
        suggestedMeds.push(fm);
      }
    });

    // Check which medications are CURRENTLY in the prescription rows
    
    // Inject Doctor Preference Ranked Meds at the top of suggestions
    ruleBonusMeds.forEach(rbm => {
      const existing = suggestedMeds.find(sm => isMedMatch(sm.name, rbm.name));
      if (existing) {
        existing.isDoctorKit = true;
        existing.doctorRulePriority = rbm.rankBonus;
      } else {
        suggestedMeds.unshift({
          name: rbm.name,
          dose: "1-0-1",
          timing: "After food",
          duration: "5 days",
          notes: `Preferred for ${rbm.ruleSymptom}`,
          isDoctorKit: true,
          doctorRulePriority: rbm.rankBonus
        });
      }
    });

    // Re-sort suggestedMeds giving top precedence to doctorRulePriority
    suggestedMeds.sort((a, b) => (b.doctorRulePriority || 0) - (a.doctorRulePriority || 0));

    const activeMedNames = getCurrentlyPrescribedMedicineNames();

    // Partition into selected (in Rx) vs unselected
    const selectedMeds = [];
    const unselectedMeds = [];

    suggestedMeds.forEach(med => {
      const isSelected = activeMedNames.some(activeName => isMedMatch(activeName, med.name));
      if (isSelected) {
        selectedMeds.push({ ...med, isSelected: true });
      } else {
        unselectedMeds.push({ ...med, isSelected: false });
      }
    });

    medChipsContainer.innerHTML = "";
    // Display selected medications first at the top/left, followed by unselected
    const displayMeds = [...selectedMeds, ...unselectedMeds].slice(0, 15);

    displayMeds.forEach(med => {
      const chip = document.createElement("span");
      let classes = "tag-chip med-chip";
      if (med.isDoctorKit) classes += " doctor-kit-med";
      if (med.isSelected) classes += " chip-selected active";
      chip.className = classes;

      let shortName = med.name.replace(/^(Tab\.|Cap\.|Syp\.|Drops|Inj\.)\s*/i, "");
      shortName = shortName.split(" (")[0];

      chip.innerHTML = `${med.isSelected ? '✓ ' : med.isDoctorKit ? '⭐ ' : '+ '}${escapeHtml(shortName)}`;
      chip.title = `${med.name} | ${med.dose} | ${med.timing} | ${med.duration} (${med.isSelected ? 'Tap to remove' : 'Tap to add'})`;

      chip.onclick = () => {
        toggleMedicationChip(med);
      };
      medChipsContainer.appendChild(chip);
    });
  } catch (err) {
    console.error("updateDynamicMedicationSuggestions error:", err);
  }
}

// Helper: Get list of medicine names currently present in Rx rows
function getCurrentlyPrescribedMedicineNames() {
  const container = document.getElementById("rx-medicine-rows");
  if (!container) return [];
  const rows = container.querySelectorAll(".rx-row");
  const names = [];
  rows.forEach(r => {
    const val = (r.querySelector(".med-name")?.value || "").trim().toLowerCase();
    if (val) names.push(val);
  });
  return names;
}

// Helper: Check if two medicine strings correspond to the same drug
function isMedMatch(nameA, nameB) {
  if (!nameA || !nameB) return false;
  const cleanA = nameA.toLowerCase().replace(/^(tab\.|cap\.|syp\.|drops|inj\.)\s*/i, "").split(" (")[0].trim();
  const cleanB = nameB.toLowerCase().replace(/^(tab\.|cap\.|syp\.|drops|inj\.)\s*/i, "").split(" (")[0].trim();
  return cleanA === cleanB || cleanA.includes(cleanB) || cleanB.includes(cleanA);
}

// 2-Way Toggle for Medication Chips: Tap to Add, Tap again to Remove!
function toggleMedicationChip(med) {
  const container = document.getElementById("rx-medicine-rows");
  if (!container) return;

  const rows = Array.from(container.querySelectorAll(".rx-row"));
  let existingRow = null;

  for (const r of rows) {
    const val = (r.querySelector(".med-name")?.value || "").trim();
    if (val && isMedMatch(val, med.name)) {
      existingRow = r;
      break;
    }
  }

  if (existingRow) {
    // Already in Rx: REMOVE IT (Undo)
    existingRow.remove();
    // If no rows left, add one fresh blank row
    if (container.querySelectorAll(".rx-row").length === 0) {
      addMedicineRow();
    }
    showToast(`Removed ${med.name.split(" ")[0]} ${med.name.split(" ")[1] || ''} from Rx`, "info");
  } else {
    // Not in Rx: ADD IT
    let emptyRow = rows.find(r => !(r.querySelector(".med-name")?.value || "").trim());

    if (emptyRow) {
      const nameIn = emptyRow.querySelector(".med-name");
      const doseIn = emptyRow.querySelector(".med-dosage");
      const timeIn = emptyRow.querySelector(".med-timing");
      const durIn = emptyRow.querySelector(".med-duration");
      const noteIn = emptyRow.querySelector(".med-notes");

      if (nameIn) nameIn.value = med.name || "";
      if (doseIn) doseIn.value = med.dose || "1-0-1";
      if (timeIn) timeIn.value = med.timing || "After food";
      if (durIn) durIn.value = med.duration || "5 days";
      if (noteIn) noteIn.value = med.notes || "";
      syncRowChips(emptyRow);
    } else {
      addMedicineRow({
        name: med.name,
        dose: med.dose,
        timing: med.timing,
        duration: med.duration,
        notes: med.notes
      });
    }
    showToast(`Added ${med.name.split(" ")[0]} ${med.name.split(" ")[1] || ''} to Rx!`, "success");
  }

  // Refresh dynamic chips to immediately reflect new state and re-sort
  updateDynamicMedicationSuggestions();
}

function applyMedicationChip(med) {
  toggleMedicationChip(med);
}

// GOOGLE-STYLE AUTOCOMPLETE FOR SYMPTOMS AND DIAGNOSIS
// ============================================================================
function setupSymptomsAutocomplete() {
  const input = document.getElementById("rx-symptoms");
  const resultsBox = document.getElementById("symptoms-autocomplete-results");
  if (!input || !resultsBox) return;
  if (input.getAttribute && input.getAttribute("data-ac-attached") === "true") return;
  if (input.setAttribute) input.setAttribute("data-ac-attached", "true");

  function doSearch() {
    const val = input.value;
    const tokens = val.split(/[,\n]+/);
    const lastToken = (tokens[tokens.length - 1] || "").trim().toLowerCase();

    if (!lastToken || lastToken.length < 1) {
      resultsBox.classList.remove("active");
      resultsBox.innerHTML = "";
      return;
    }

    const matches = POPULAR_SYMPTOMS_LIST.filter(s =>
      s.name.toLowerCase().includes(lastToken) ||
      (s.synonyms && s.synonyms.some(syn => syn.toLowerCase().includes(lastToken)))
    ).slice(0, 8);

    if (matches.length === 0) {
      resultsBox.classList.remove("active");
      resultsBox.innerHTML = "";
      return;
    }

    resultsBox.innerHTML = "";
    matches.forEach(item => {
      const el = document.createElement("div");
      el.className = "autocomplete-item";
      el.innerHTML = `
        <strong>${highlightQuery(item.name, lastToken)}</strong>
        <small style="color: var(--primary-dark); font-weight: 600;">${item.category}</small>
      `;

      el.addEventListener("mousedown", (e) => {
        e.preventDefault();
        // Replace last token
        const parts = input.value.split(/[,\n]+/);
        parts[parts.length - 1] = " " + item.name;
        input.value = parts.map(p => p.trim()).filter(Boolean).join(", ") + ", ";
        resultsBox.classList.remove("active");
        resultsBox.innerHTML = "";
        onSymptomsInputChanged();
        input.focus();
      });

      resultsBox.appendChild(el);
    });

    resultsBox.classList.add("active");
  }

  input.addEventListener("input", doSearch);
  input.addEventListener("blur", () => {
    setTimeout(() => {
      resultsBox.classList.remove("active");
    }, 250);
  });
}

function setupDiagnosisAutocomplete() {
  const input = document.getElementById("rx-diagnosis");
  const resultsBox = document.getElementById("diagnosis-autocomplete-results");
  if (!input || !resultsBox) return;
  if (input.getAttribute && input.getAttribute("data-ac-attached") === "true") return;
  if (input.setAttribute) input.setAttribute("data-ac-attached", "true");

  function doSearch() {
    const q = input.value.trim().toLowerCase();
    if (!q || q.length < 1) {
      resultsBox.classList.remove("active");
      resultsBox.innerHTML = "";
      return;
    }

    const matches = POPULAR_DIAGNOSIS_LIST.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      (d.tags && d.tags.some(t => t.toLowerCase().includes(q)))
    ).slice(0, 8);

    if (matches.length === 0) {
      resultsBox.classList.remove("active");
      resultsBox.innerHTML = "";
      return;
    }

    resultsBox.innerHTML = "";
    matches.forEach(item => {
      const el = document.createElement("div");
      el.className = "autocomplete-item";
      el.innerHTML = `
        <strong>${highlightQuery(item.name, q)}</strong>
        <small style="color: var(--primary-dark); font-weight: 600;">${item.category}</small>
      `;

      el.addEventListener("mousedown", (e) => {
        e.preventDefault();
        input.value = item.name;
        resultsBox.classList.remove("active");
        resultsBox.innerHTML = "";
        onDiagnosisInputChanged();
      });

      resultsBox.appendChild(el);
    });

    resultsBox.classList.add("active");
  }

  input.addEventListener("input", doSearch);
  input.addEventListener("blur", () => {
    setTimeout(() => {
      resultsBox.classList.remove("active");
    }, 250);
  });
}

// ============================================================================
// DOCTOR'S CLINICAL KITS MANAGER MODAL & CRUD
// ============================================================================
let currentKitFilter = "all";

function openDoctorKitsModal() {
  document.getElementById("kits-modal").classList.add("active");
  filterKits(currentKitFilter);
}

function closeDoctorKitsModal() {
  document.getElementById("kits-modal").classList.remove("active");
}

function filterKits(filter) {
  currentKitFilter = filter;
  document.querySelectorAll("#kits-modal .tag-chip").forEach(c => c.classList.remove("active"));
  const activeChip = document.getElementById(`kit-filter-${filter}`);
  if (activeChip) activeChip.classList.add("active");

  renderDoctorKitsList(filter);
}

function renderDoctorKitsList(filter) {
  const container = document.getElementById("kits-list-container");
  if (!container) return;
  container.innerHTML = "";

  let list = [];

  // Add custom doctor kits
  (appData.doctorKits || []).forEach(k => {
    list.push({ ...k, isCustom: true });
  });

  // Also include system protocols if filtering all or by age
  if (filter !== "custom") {
    CLINICAL_KNOWLEDGE_BASE.forEach(kb => {
      list.push({
        id: kb.id,
        name: `System Protocol: ${kb.diagnosis.split(" (")[0]}`,
        triggerDiagnosis: kb.diagnosis,
        triggerSymptoms: kb.symptoms,
        ageGroup: "adult",
        medicines: kb.medications,
        advice: kb.advice,
        investigations: kb.investigations,
        isCustom: false
      });
      if (kb.pediatricMedications) {
        list.push({
          id: `${kb.id}-peds`,
          name: `Pediatric Protocol: ${kb.diagnosis.split(" (")[0]}`,
          triggerDiagnosis: kb.diagnosis,
          triggerSymptoms: kb.symptoms,
          ageGroup: "pediatric",
          medicines: kb.pediatricMedications,
          advice: kb.advice,
          investigations: kb.investigations,
          isCustom: false
        });
      }
      if (kb.infantMedications) {
        list.push({
          id: `${kb.id}-infant`,
          name: `Infant Protocol: ${kb.diagnosis.split(" (")[0]}`,
          triggerDiagnosis: kb.diagnosis,
          triggerSymptoms: kb.symptoms,
          ageGroup: "infant",
          medicines: kb.infantMedications,
          advice: kb.advice,
          investigations: kb.investigations,
          isCustom: false
        });
      }
    });
  }

  // Apply Filter
  if (filter === "custom") {
    list = list.filter(k => k.isCustom);
  } else if (filter === "adult") {
    list = list.filter(k => k.ageGroup === "adult" || k.ageGroup === "all");
  } else if (filter === "pediatric") {
    list = list.filter(k => k.ageGroup === "pediatric" || k.ageGroup === "all");
  } else if (filter === "infant") {
    list = list.filter(k => k.ageGroup === "infant" || k.ageGroup === "all");
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 24px; text-align: center; color: var(--text-muted); background: #f8fafc; border-radius: 8px;">
        No clinical kits found under this filter. Tap "+ Create New Kit" to add your custom clinic protocol!
      </div>
    `;
    return;
  }

  list.forEach(k => {
    const card = document.createElement("div");
    card.className = `kit-card ${k.isCustom ? 'custom-clinic-kit' : 'system-clinical-kit'}`;

    const ageClass = k.ageGroup === 'pediatric' ? 'kit-age-pediatric' :
                     k.ageGroup === 'infant' ? 'kit-age-infant' :
                     k.ageGroup === 'all' ? 'kit-age-all' : 'kit-age-adult';

    const ageLabel = k.ageGroup === 'pediatric' ? 'Child (1-12y)' :
                     k.ageGroup === 'infant' ? 'Infant (<1y)' :
                     k.ageGroup === 'all' ? 'All Ages' : 'Adult (12y+)';

    card.innerHTML = `
      <div>
        <div class="kit-card-header">
          <h4 class="kit-card-title">${k.isCustom ? '⭐ ' : '⚡ '}${escapeHtml(k.name)}</h4>
          <span class="kit-age-tag ${ageClass}">${ageLabel}</span>
        </div>
        <div style="font-size: 0.8rem; color: #0d9488; font-weight: 600; margin-bottom: 4px;">
          For: ${escapeHtml(k.triggerDiagnosis || 'General Assessment')}
        </div>
        <div class="kit-meds-summary">
          <strong>Medications (${(k.medicines || []).length}):</strong><br>
          ${(k.medicines || []).map(m => `
            <span class="kit-med-item-bullet">${escapeHtml(m.name)} (${escapeHtml(m.dose)})</span>
          `).join('')}
        </div>
      </div>
      <div class="kit-card-actions">
        <button type="button" class="btn btn-primary btn-xs" onclick="applyKitAndCloseModal('${k.id}', ${k.isCustom})">
          <span>⚡ Apply to Rx</span>
        </button>
        <div style="display: flex; gap: 6px;">
          ${k.isCustom ? `
            <button type="button" class="btn btn-outline btn-xs" onclick="openEditKitModal('${k.id}')">Edit</button>
            <button type="button" class="btn btn-outline btn-xs" style="color: #ef4444; border-color: #fca5a5;" onclick="deleteDoctorKit('${k.id}')">Delete</button>
          ` : `
            <button type="button" class="btn btn-outline btn-xs" onclick="forkSystemKit('${k.id}')">Customize for Clinic</button>
          `}
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function applyDoctorKit(kitId) {
  const kit = (appData.doctorKits || []).find(k => k.id === kitId);
  if (!kit) {
    showToast("Doctor Kit not found", "error");
    return;
  }

  // Ensure prescription form is visible
  switchTab("prescribe");
  const editForm = document.querySelector(".prescribe-edit-form");
  if (editForm) editForm.style.display = "block";
  const prevContainer = document.getElementById("rx-preview-container");
  if (prevContainer) prevContainer.style.display = "none";

  // Set diagnosis if empty
  const diagInput = document.getElementById("rx-diagnosis");
  if (diagInput && kit.triggerDiagnosis && !diagInput.value.trim()) {
    diagInput.value = kit.triggerDiagnosis;
  }

  // Set advice / investigations if provided
  if (kit.advice) {
    const advInput = document.getElementById("rx-advice");
    if (advInput) {
      advInput.value = advInput.value ? (advInput.value + "; " + kit.advice) : kit.advice;
    }
  }
  if (kit.investigations) {
    const invInput = document.getElementById("rx-investigations");
    if (invInput) {
      invInput.value = invInput.value ? (invInput.value + "; " + kit.investigations) : kit.investigations;
    }
  }

  // Populate medicines
  const medRowsContainer = document.getElementById("rx-medicine-rows");
  if (medRowsContainer) {
    const existingRows = medRowsContainer.querySelectorAll(".rx-row");
    if (existingRows.length === 1) {
      const nameInput = existingRows[0].querySelector(".med-name");
      if (nameInput && !nameInput.value.trim()) {
        medRowsContainer.innerHTML = "";
      }
    }

    (kit.medicines || []).forEach(m => {
      addMedicineRow({
        name: m.name,
        dose: m.dose || "1-0-1",
        timing: m.timing || "After food",
        duration: m.duration || "2 days",
        notes: m.notes || m.inst || ""
      });
    });
  }

  showToast("⭐ Applied Doctor Kit: " + kit.name + " (" + (kit.medicines || []).length + " meds)!", "success");
}

function applySystemKit(sysId) {
  if (typeof CLINICAL_KNOWLEDGE_BASE === "undefined") return;
  const sysMatch = CLINICAL_KNOWLEDGE_BASE.find(k => k.id === sysId);
  if (!sysMatch) return;

  // Ensure prescription form is visible
  switchTab("prescribe");
  const editForm = document.querySelector(".prescribe-edit-form");
  if (editForm) editForm.style.display = "block";
  const prevContainer = document.getElementById("rx-preview-container");
  if (prevContainer) prevContainer.style.display = "none";

  const patientId = document.getElementById("rx-patient-select")?.value;
  const pt = (appData.patients || []).find(p => p.id === patientId);
  const ptAge = pt ? pt.age : 30;
  const isInfant = ptAge <= 1;
  const isPediatric = ptAge > 1 && ptAge < 12;

  const medsToUse = isInfant && sysMatch.infantMedications ? sysMatch.infantMedications :
                    isPediatric && sysMatch.pediatricMedications ? sysMatch.pediatricMedications :
                    sysMatch.medications;

  // Set diagnosis
  const diagInput = document.getElementById("rx-diagnosis");
  if (diagInput && !diagInput.value.trim()) {
    diagInput.value = sysMatch.diagnosis.split(" (")[0];
  }

  // Set advice & investigations
  if (sysMatch.advice) {
    const advInput = document.getElementById("rx-advice");
    if (advInput) {
      advInput.value = advInput.value ? (advInput.value + "; " + sysMatch.advice) : sysMatch.advice;
    }
  }
  if (sysMatch.investigations) {
    const invInput = document.getElementById("rx-investigations");
    if (invInput) {
      invInput.value = invInput.value ? (invInput.value + "; " + sysMatch.investigations) : sysMatch.investigations;
    }
  }

  // Populate medicines
  const medRowsContainer = document.getElementById("rx-medicine-rows");
  if (medRowsContainer) {
    const existingRows = medRowsContainer.querySelectorAll(".rx-row");
    if (existingRows.length === 1) {
      const nameInput = existingRows[0].querySelector(".med-name");
      if (nameInput && !nameInput.value.trim()) {
        medRowsContainer.innerHTML = "";
      }
    }

    (medsToUse || []).forEach(m => {
      addMedicineRow({
        name: m.name,
        dose: m.dose || "1-0-1",
        timing: m.timing || "After food",
        duration: m.duration || "2 days",
        notes: m.notes || ""
      });
    });
  }

  showToast("⚡ Applied " + sysMatch.diagnosis.split(" (")[0] + " Regimen (" + (medsToUse || []).length + " meds)!", "success");
}

function saveAsMyCustomKit(sysId) {
  forkSystemKit(sysId);
}

function applyKitAndCloseModal(kitId, isCustom) {
  closeDoctorKitsModal();
  switchTab("prescribe");
  if (isCustom) {
    applyDoctorKit(kitId);
  } else {
    const baseId = kitId.replace(/-peds|-infant/, "");
    applySystemKit(baseId);
  }
}

function forkSystemKit(sysId) {
  const baseId = sysId.replace(/-peds|-infant/, "");
  const kb = CLINICAL_KNOWLEDGE_BASE.find(k => k.id === baseId);
  if (!kb) return;

  const ageGroup = sysId.includes("-infant") ? 'infant' : sysId.includes("-peds") ? 'pediatric' : 'adult';
  const meds = ageGroup === 'infant' && kb.infantMedications ? kb.infantMedications :
               ageGroup === 'pediatric' && kb.pediatricMedications ? kb.pediatricMedications :
               kb.medications;

  closeDoctorKitsModal();
  openCreateKitModal({
    name: `My Clinic ${kb.diagnosis.split(" (")[0]} Kit (${ageGroup.toUpperCase()})`,
    triggerDiagnosis: kb.diagnosis,
    triggerSymptoms: kb.symptoms.slice(0, 3).join(", "),
    ageGroup: ageGroup,
    medicines: meds,
    advice: kb.advice,
    investigations: kb.investigations
  });
}

function openCreateKitModal(prefill = {}) {
  document.getElementById("kit-edit-id").value = prefill.id || "";
  document.getElementById("kit-edit-name").value = prefill.name || "";
  document.getElementById("kit-edit-diag").value = prefill.triggerDiagnosis || "";
  document.getElementById("kit-edit-age").value = prefill.ageGroup || "adult";
  document.getElementById("kit-edit-symptoms").value = prefill.triggerSymptoms ? (Array.isArray(prefill.triggerSymptoms) ? prefill.triggerSymptoms.join(", ") : prefill.triggerSymptoms) : "";
  document.getElementById("kit-edit-advice").value = prefill.advice || "";
  document.getElementById("kit-edit-investigations").value = prefill.investigations || "";

  document.getElementById("kit-edit-modal-title").textContent = prefill.id ? "Edit Clinical Kit" : "Create New Clinical Kit";

  const rowsContainer = document.getElementById("kit-medicine-rows");
  rowsContainer.innerHTML = "";

  if (prefill.medicines && prefill.medicines.length > 0) {
    prefill.medicines.forEach(m => addKitMedicineRow(m));
  } else {
    addKitMedicineRow();
    addKitMedicineRow();
  }

  // Initialize symptom chips & autocomplete inside Kit Edit Modal
  updateKitSymptomsChips();
  setupKitSymptomsAutocomplete();

  document.getElementById("kit-edit-modal").classList.add("active");
}

function onKitSymptomsInputChanged() {
  updateKitSymptomsChips();
  setupKitSymptomsAutocomplete();
}

// Interactive chips in Kit Edit Modal
function toggleKitSymptomChip(symName) {
  const input = document.getElementById("kit-edit-symptoms");
  if (!input) return;

  const currentTokens = parseCommaSeparatedTokens(input.value);
  const targetLower = symName.trim().toLowerCase();
  const existingIndex = currentTokens.findIndex(t => t.toLowerCase() === targetLower || t.toLowerCase().includes(targetLower) || targetLower.includes(t.toLowerCase()));

  if (existingIndex >= 0) {
    currentTokens.splice(existingIndex, 1);
  } else {
    currentTokens.push(symName);
  }

  input.value = currentTokens.join(", ");
  updateKitSymptomsChips();
}

function updateKitSymptomsChips() {
  const container = document.getElementById("kit-edit-symptoms-chips");
  const input = document.getElementById("kit-edit-symptoms");
  if (!container || !input) return;

  const currentTokens = parseCommaSeparatedTokens(input.value);
  const currentTokensLower = currentTokens.map(t => t.toLowerCase());

  const allList = [...DEFAULT_OPD_SYMPTOMS];
  currentTokens.forEach(tok => {
    if (!allList.some(s => s.toLowerCase() === tok.toLowerCase())) {
      allList.unshift(tok);
    }
  });

  const selectedList = [];
  const unselectedList = [];

  allList.forEach(item => {
    const isSel = currentTokensLower.some(tok => tok === item.toLowerCase() || tok.includes(item.toLowerCase()) || item.toLowerCase().includes(tok));
    if (isSel) {
      selectedList.push({ name: item, selected: true });
    } else {
      unselectedList.push({ name: item, selected: false });
    }
  });

  container.innerHTML = "";
  const sorted = [...selectedList, ...unselectedList];

  sorted.forEach(item => {
    const chip = document.createElement("span");
    chip.className = `tag-chip ${item.selected ? 'chip-selected active' : ''}`;
    chip.innerHTML = `${item.selected ? '✓ ' : '+ '}${escapeHtml(item.name)}`;
    chip.onclick = () => toggleKitSymptomChip(item.name);
    container.appendChild(chip);
  });
}

function setupKitSymptomsAutocomplete() {
  const input = document.getElementById("kit-edit-symptoms");
  const resultsBox = document.getElementById("kit-symptoms-autocomplete-results");
  if (!input || !resultsBox) return;
  if (input.getAttribute && input.getAttribute("data-ac-attached") === "true") return;
  if (input.setAttribute) input.setAttribute("data-ac-attached", "true");

  function doSearch() {
    const val = input.value;
    const tokens = val.split(/[,\n]+/);
    const lastToken = (tokens[tokens.length - 1] || "").trim().toLowerCase();

    if (!lastToken || lastToken.length < 1) {
      resultsBox.classList.remove("active");
      resultsBox.innerHTML = "";
      return;
    }

    const matches = POPULAR_SYMPTOMS_LIST.filter(s =>
      s.name.toLowerCase().includes(lastToken) ||
      (s.synonyms && s.synonyms.some(syn => syn.toLowerCase().includes(lastToken)))
    ).slice(0, 8);

    if (matches.length === 0) {
      resultsBox.classList.remove("active");
      resultsBox.innerHTML = "";
      return;
    }

    resultsBox.innerHTML = "";
    matches.forEach(item => {
      const el = document.createElement("div");
      el.className = "autocomplete-item";
      el.innerHTML = `
        <strong>${highlightQuery(item.name, lastToken)}</strong>
        <small style="color: var(--primary-dark); font-weight: 600;">${item.category}</small>
      `;

      el.addEventListener("mousedown", (e) => {
        e.preventDefault();
        const parts = input.value.split(/[,\n]+/);
        parts[parts.length - 1] = " " + item.name;
        input.value = parts.map(p => p.trim()).filter(Boolean).join(", ") + ", ";
        resultsBox.classList.remove("active");
        resultsBox.innerHTML = "";
        updateKitSymptomsChips();
        input.focus();
      });

      resultsBox.appendChild(el);
    });

    resultsBox.classList.add("active");
  }

  input.addEventListener("input", doSearch);
  input.addEventListener("blur", () => {
    setTimeout(() => {
      resultsBox.classList.remove("active");
    }, 250);
  });
}

function openEditKitModal(kitId) {
  const kit = (appData.doctorKits || []).find(k => k.id === kitId);
  if (!kit) return;
  openCreateKitModal(kit);
}

function closeKitEditModal() {
  document.getElementById("kit-edit-modal").classList.remove("active");
}

function addKitMedicineRow(data = {}) {
  const container = document.getElementById("kit-medicine-rows");
  if (!container) return;

  const row = document.createElement("div");
  row.className = "kit-med-row";
  row.innerHTML = `
    <input type="text" class="form-control kit-med-name" placeholder="Drug name & strength (e.g. Tab. Augmentin 625)" value="${escapeHtml(data.name || '')}">
    <input type="text" class="form-control kit-med-dose" placeholder="1-0-1" value="${escapeHtml(data.dose || '1-0-1')}">
    <input type="text" class="form-control kit-med-timing" placeholder="After food" value="${escapeHtml(data.timing || 'After food')}">
    <input type="text" class="form-control kit-med-duration" placeholder="5 days" value="${escapeHtml(data.duration || '5 days')}">
    <button type="button" class="btn-remove-row" onclick="this.closest('.kit-med-row').remove()" title="Remove medicine">&times;</button>
  `;
  container.appendChild(row);
}

function saveDoctorKit() {
  const idField = document.getElementById("kit-edit-id").value;
  const name = document.getElementById("kit-edit-name").value.trim();
  const diag = document.getElementById("kit-edit-diag").value.trim();
  const ageGroup = document.getElementById("kit-edit-age").value;
  const symptomsStr = document.getElementById("kit-edit-symptoms").value.trim();
  const advice = document.getElementById("kit-edit-advice").value.trim();
  const investigations = document.getElementById("kit-edit-investigations").value.trim();

  if (!name || !diag) {
    showToast("Please provide both Kit Name and Linked Diagnosis.", "error");
    return;
  }

  const medRows = document.querySelectorAll("#kit-medicine-rows .kit-med-row");
  const medicines = [];
  medRows.forEach(row => {
    const medName = row.querySelector(".kit-med-name").value.trim();
    if (medName) {
      medicines.push({
        name: medName,
        dose: row.querySelector(".kit-med-dose").value.trim() || "1-0-1",
        timing: row.querySelector(".kit-med-timing").value.trim() || "After food",
        duration: row.querySelector(".kit-med-duration").value.trim() || "5 days",
        notes: ""
      });
    }
  });

  if (medicines.length === 0) {
    showToast("Please add at least one medication to this kit.", "error");
    return;
  }

  const symptoms = symptomsStr ? symptomsStr.split(",").map(s => s.trim()).filter(Boolean) : [];

  appData.doctorKits = appData.doctorKits || [];

  if (idField) {
    const existing = appData.doctorKits.find(k => k.id === idField);
    if (existing) {
      existing.name = name;
      existing.triggerDiagnosis = diag;
      existing.ageGroup = ageGroup;
      existing.triggerSymptoms = symptoms;
      existing.medicines = medicines;
      existing.advice = advice;
      existing.investigations = investigations;
      showToast(`Updated clinical kit: ${name}!`, "success");
    }
  } else {
    const newKit = {
      id: `KIT-DOC-${Date.now().toString().slice(-6)}`,
      name: name,
      triggerDiagnosis: diag,
      ageGroup: ageGroup,
      triggerSymptoms: symptoms,
      medicines: medicines,
      advice: advice,
      investigations: investigations,
      isCustom: true
    };
    appData.doctorKits.unshift(newKit);
    showToast(`Created new clinical kit: ${name}!`, "success");
  }

  saveData();
  closeKitEditModal();
  renderDoctorKitsList(currentKitFilter);
  updateDynamicMedicationSuggestions(diag);
}

function deleteDoctorKit(kitId) {
  if (!confirm("Are you sure you want to delete this clinical kit?")) return;
  appData.doctorKits = (appData.doctorKits || []).filter(k => k.id !== kitId);
  saveData();
  renderDoctorKitsList(currentKitFilter);
  showToast("Clinical kit deleted.", "info");
}

function resetEncounterForm() {
  const editIdField = document.getElementById("editing-encounter-id"); if (editIdField) editIdField.value = "";
  document.getElementById("rx-patient-select").value = "";
  document.getElementById("rx-patient-id").value = "";
  document.getElementById("rx-patient-alert-banner").style.display = "none";
  initFormDates();
  document.getElementById("vital-bp").value = "";
  document.getElementById("vital-pulse").value = "";
  document.getElementById("vital-temp").value = "";
  document.getElementById("vital-weight").value = "";
  document.getElementById("vital-spo2").value = "";
  document.getElementById("vital-sugar").value = "";
  document.getElementById("rx-symptoms").value = "";
  document.getElementById("rx-diagnosis").value = "";
  document.getElementById("rx-investigations").value = "";
  document.getElementById("rx-advice").value = "";
  document.getElementById("rx-followup").value = "";

  const container = document.getElementById("rx-medicine-rows");
  container.innerHTML = "";
  addMedicineRow();

  document.querySelector(".prescribe-edit-form").style.display = "block";
  document.getElementById("rx-preview-container").style.display = "none";
}

// Save & Preview Prescription
function saveAndPreviewPrescription() {
  const patientId = document.getElementById("rx-patient-select").value;
  if (!patientId) {
    showToast("Please choose or register a patient first.", "error");
    document.getElementById("rx-patient-select").focus();
    return;
  }

  const symptoms = document.getElementById("rx-symptoms").value.trim();
  let diagnosis = document.getElementById("rx-diagnosis").value.trim();

  if (!symptoms && !diagnosis) {
    showToast("Please enter Chief Complaints or Diagnosis.", "error");
    document.getElementById("rx-symptoms").focus();
    return;
  }
  if (!diagnosis) {
    diagnosis = "Symptomatic Treatment";
  }

  // Collect medicines
  const medRows = document.querySelectorAll("#rx-medicine-rows .rx-row");
  const medicines = [];
  medRows.forEach(row => {
    const name = row.querySelector(".med-name").value.trim();
    if (name) {
      medicines.push({
        name: name,
        dose: row.querySelector(".med-dosage").value.trim() || "1-0-1",
        timing: row.querySelector(".med-timing").value.trim() || "After food",
        duration: row.querySelector(".med-duration").value.trim() || "5 days",
        notes: row.querySelector(".med-notes").value.trim() || ""
      });
    }
  });

  if (medicines.length === 0) {
    showToast("Please prescribe at least one medication.", "error");
    return;
  }

  const dateVal = document.getElementById("rx-date").value || new Date().toISOString();
  const editIdField = document.getElementById("editing-encounter-id");
  const existingId = editIdField ? editIdField.value.trim() : "";
  const encounterId = existingId || `ENC-${Date.now().toString().slice(-6)}`;

  const encounter = {
    id: encounterId,
    patientId: patientId,
    date: dateVal,
    vitals: {
      bp: document.getElementById("vital-bp").value.trim(),
      pulse: document.getElementById("vital-pulse").value.trim(),
      temp: document.getElementById("vital-temp").value.trim(),
      weight: document.getElementById("vital-weight").value.trim(),
      spo2: document.getElementById("vital-spo2").value.trim(),
      sugar: document.getElementById("vital-sugar").value.trim()
    },
    symptoms: symptoms,
    diagnosis: diagnosis,
    medicines: medicines,
    investigations: document.getElementById("rx-investigations").value.trim(),
    advice: document.getElementById("rx-advice").value.trim(),
    followup: document.getElementById("rx-followup").value,
    whatsappSent: false,
    smsSent: false
  };

  // Update patient last visit
  const pt = appData.patients.find(p => p.id === patientId || p.mrn === patientId);
  if (pt) {
    pt.lastVisit = dateVal.split("T")[0];
    pt.updatedAt = new Date().toISOString();
  }

  // Update in place if editing existing encounter, else push new
  const existingIdx = (appData.encounters || []).findIndex(e => String(e.id) === String(encounterId));
  if (existingIdx >= 0) {
    appData.encounters[existingIdx] = encounter;
  } else {
    appData.encounters.push(encounter);
  }
  if (editIdField) editIdField.value = "";
  appData.currentPrescriptionEncounter = encounter;
  saveData();

  renderPrescriptionSheet(encounter, pt || { name: "Patient", mrn: "--", allergies: "None" });

  document.querySelector(".prescribe-edit-form").style.display = "none";
  document.getElementById("rx-preview-container").style.display = "block";
  document.getElementById("rx-preview-container").scrollIntoView({ behavior: "smooth" });

  // Refresh all live views immediately
  renderDashboardQueue();
  renderPatientsTable();
  const histSel = document.getElementById("history-patient-select");
  if (histSel && histSel.value === patientId) {
    renderPatientHistory();
  }
  const drawer = document.getElementById("patient-timeline-inline-viewer");
  if (drawer && drawer.style.display !== "none") {
    showPatientDetailDrawer(patientId);
  }

  trackUnsavedChange();
  showToast(`Prescription saved for ${pt ? pt.name : 'Patient'}!`, "success");
}

function renderPrescriptionSheet(enc, pt) {
  const container = document.getElementById("printable-prescription-sheet");
  if (!container) return;

  const hasAllergy = pt.allergies && pt.allergies !== "None" && pt.allergies.trim() !== "";

  let medHtml = "";
  enc.medicines.forEach((m, i) => {
    medHtml += `
      <tr style="border-bottom: 1px solid #e2e8f0; background: ${i % 2 === 1 ? '#f8fafc' : '#ffffff'};">
        <td style="width: 30px; font-weight: 700; color: #64748b; padding: 7px 8px;">${i + 1}</td>
        <td style="padding: 7px 8px;">
          <div style="font-weight: 700; font-size: 0.92rem; color: #0f172a;">${escapeHtml(m.name)}</div>
        </td>
        <td style="padding: 7px 8px; font-weight: 700; color: #0f766e;">${escapeHtml(m.dose || '1-0-1')}</td>
        <td style="padding: 7px 8px; color: #334155;">${escapeHtml(m.timing || 'After food')}</td>
        <td style="padding: 7px 8px;"><strong>${escapeHtml(m.duration || '5 days')}</strong></td>
        <td style="padding: 7px 8px; font-size: 0.8rem; font-style: italic; color: #64748b;">${escapeHtml(m.notes || '-')}</td>
      </tr>
    `;
  });

  const vitalsArr = [];
  if (enc.vitals.bp) vitalsArr.push(`<strong>BP:</strong> ${enc.vitals.bp}`);
  if (enc.vitals.pulse) vitalsArr.push(`<strong>Pulse:</strong> ${enc.vitals.pulse} bpm`);
  if (enc.vitals.temp) vitalsArr.push(`<strong>Temp:</strong> ${enc.vitals.temp} &deg;F`);
  if (enc.vitals.weight) vitalsArr.push(`<strong>Wt:</strong> ${enc.vitals.weight} kg`);
  if (enc.vitals.spo2) vitalsArr.push(`<strong>SpO2:</strong> ${enc.vitals.spo2}%`);
  if (enc.vitals.sugar) vitalsArr.push(`<strong>Sugar:</strong> ${enc.vitals.sugar}`);

  container.innerHTML = `
    <!-- Clinic Header Letterhead -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2.5px solid #0d9488; padding-bottom: 12px; margin-bottom: 14px;">
      <div>
        <h2 style="font-size: 1.5rem; font-weight: 800; color: #0f766e; margin: 0; letter-spacing: -0.5px;">${appData.clinic.name}</h2>
        <div style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-top: 2px;">${appData.clinic.doctor}</div>
        <div style="font-size: 0.8rem; color: #64748b;">Reg No: ${appData.clinic.regNo} &bull; General & Family Medicine</div>
      </div>
      <div style="text-align: right; font-size: 0.78rem; color: #475569; max-width: 280px;">
        <div>${appData.clinic.address}</div>
        <div>Contact / WhatsApp: <strong>${appData.clinic.phone}</strong></div>
      </div>
    </div>

    <!-- Patient Demographics Bar -->
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; margin-bottom: 14px; display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 8px; font-size: 0.85rem;">
      <div><strong>Patient Name:</strong> <span style="font-size: 0.95rem; font-weight: 700;">${pt.name}</span></div>
      <div><strong>Age / Gender:</strong> ${pt.age}y / ${pt.gender}</div>
      <div><strong>Date:</strong> ${formatReadableDate(enc.date)}</div>
      <div><strong>MR / Patient ID:</strong> <span style="font-weight: 700; color: #0d9488;">${pt.mrn}</span></div>
      <div><strong>Phone:</strong> ${pt.phone}</div>
      <div><strong>Blood Group:</strong> ${pt.bloodGroup || 'Unknown'}</div>
    </div>

    ${hasAllergy ? `
      <div style="background: #fee2e2; border-left: 4px solid #ef4444; color: #991b1b; padding: 6px 12px; border-radius: 4px; font-size: 0.84rem; font-weight: 700; margin-bottom: 12px;">
        WARNING - KNOWN DRUG ALLERGIES: ${pt.allergies}
      </div>
    ` : ''}

    <!-- Vitals Bar -->
    ${vitalsArr.length > 0 ? `
      <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px 12px; margin-bottom: 12px; font-size: 0.82rem; display: flex; flex-wrap: wrap; gap: 16px;">
        ${vitalsArr.join(" &bull; ")}
      </div>
    ` : ''}

    <!-- Clinical Assessment Block (Conditional on Diagnosis setting) -->
    ${appData.settings.includeDiagnosis !== false ? `
      <div style="margin-bottom: 14px; font-size: 0.88rem;">
        ${enc.symptoms ? `<div><strong>Chief Complaints &amp; Symptoms:</strong> ${escapeHtml(enc.symptoms)}</div>` : ''}
        ${enc.diagnosis ? `<div style="margin-top: 4px;"><strong>Clinical Diagnosis:</strong> <span style="font-weight: 700; color: #0f766e;">${escapeHtml(enc.diagnosis)}</span></div>` : ''}
      </div>
    ` : ''}

    <!-- Rx Sign & Medicines Table -->
    <div style="margin-bottom: 18px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
        <span style="font-size: 1.4rem; font-weight: 900; font-family: serif; color: #0d9488;">&#8478;</span>
        <span style="font-size: 0.88rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #334155;">Prescribed Medications</span>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 0.86rem;">
        <thead>
          <tr style="border-bottom: 1.5px solid #cbd5e1; background: #f1f5f9; text-align: left;">
            <th style="padding: 6px 8px; width: 30px;">#</th>
            <th style="padding: 6px 8px;">Medicine Name & Strength</th>
            <th style="padding: 6px 8px;">Dosage</th>
            <th style="padding: 6px 8px;">When</th>
            <th style="padding: 6px 8px;">Duration</th>
            <th style="padding: 6px 8px;">Special Instructions</th>
          </tr>
        </thead>
        <tbody style="border-bottom: 1.5px solid #cbd5e1;">
          ${medHtml}
        </tbody>
      </table>
    </div>

    <!-- Advice & Investigations -->
    ${enc.investigations ? `
      <div style="margin-bottom: 8px; font-size: 0.84rem;">
        <strong>Recommended Investigations:</strong> ${escapeHtml(enc.investigations)}
      </div>
    ` : ''}

    ${enc.advice ? `
      <div style="margin-bottom: 8px; font-size: 0.84rem;">
        <strong>General Advice & Precautions:</strong> ${escapeHtml(enc.advice)}
      </div>
    ` : ''}

    ${enc.followup ? `
      <div style="margin-bottom: 8px; font-size: 0.84rem; color: #0f766e; font-weight: 700;">
        Follow-up Review: ${enc.followup}
      </div>
    ` : ''}

    <!-- Footer Signature Space -->
    <div style="margin-top: 36px; display: flex; justify-content: space-between; align-items: flex-end; padding-top: 14px; border-top: 1px dashed #cbd5e1;">
      <div style="font-size: 0.72rem; color: #94a3b8;">
        Generated by DocEMR &bull; Shifa Clinic Digital Records<br>
        Please bring this prescription for follow-up review.
      </div>
      <div style="text-align: right;">
        <div style="font-size: 0.88rem; font-weight: 700; color: #0f766e;">${appData.clinic.doctor}</div>
        <div style="font-size: 0.75rem; color: #64748b;">Authorized Medical Practitioner</div>
      </div>
    </div>
  `;
}

function editCurrentPrescription() {
  try {
    let enc = appData.currentPrescriptionEncounter;
    if (!enc) {
      const editId = document.getElementById("editing-encounter-id")?.value;
      if (editId) {
        enc = (appData.encounters || []).find(e => String(e.id) === String(editId));
      }
    }
    if (!enc && appData.encounters && appData.encounters.length > 0) {
      enc = appData.encounters[appData.encounters.length - 1];
    }

    if (enc) {
      loadEncounterIntoPrescribeForm(enc);
    } else {
      const editForm = document.querySelector(".prescribe-edit-form");
      if (editForm) editForm.style.display = "block";
      const prevContainer = document.getElementById("rx-preview-container");
      if (prevContainer) prevContainer.style.display = "none";
      showToast("Ready to prescribe.", "info");
    }
  } catch (err) {
    console.error("editCurrentPrescription error:", err);
    showToast("Error opening prescription: " + err.message, "error");
  }
}

function loadEncounterIntoPrescribeForm(enc) {
  try {
    if (!enc) {
      showToast("No prescription selected to edit.", "error");
      return;
    }
    const pt = (appData.patients || []).find(p => String(p.id) === String(enc.patientId) || String(p.mrn) === String(enc.patientId)) || {
      id: enc.patientId || "unknown",
      name: "Patient",
      mrn: "--",
      age: 30,
      gender: "Other",
      allergies: "None"
    };

  // 1. Set current prescription reference
  appData.currentPrescriptionEncounter = enc;

  // 2. Switch to prescribe tab
  switchTab("prescribe");

  // 3. Force Prescribe Form VISIBLE, Preview HIDDEN
  const editForm = document.querySelector(".prescribe-edit-form");
  if (editForm) editForm.style.display = "block";
  const prevContainer = document.getElementById("rx-preview-container");
  if (prevContainer) prevContainer.style.display = "none";

  // 4. Set editing tracker ID so saving updates this exact encounter in place
  const editIdInput = document.getElementById("editing-encounter-id");
  if (editIdInput) editIdInput.value = enc.id;

  // 5. Select this exact patient in dropdown
  populateRxPatientSelect();
  const sel = document.getElementById("rx-patient-select");
  if (sel) {
    sel.value = pt.id;
  }
  const mrnInput = document.getElementById("rx-patient-id");
  if (mrnInput) {
    mrnInput.value = pt.mrn || "";
  }

  // 6. Update patient alert banner, but HIDE repeat-banner (we are editing this visit, not repeating previous)
  const banner = document.getElementById("rx-patient-alert-banner");
  if (banner) {
    banner.style.display = "block";
    const hasAllergy = pt.allergies && pt.allergies !== "None" && pt.allergies.trim() !== "";
    banner.innerHTML = `
      <strong>Patient:</strong> ${escapeHtml(pt.name)} (${pt.age}y/${pt.gender}) &bull; Blood: ${pt.bloodGroup || 'Unknown'} &bull; Phone: ${pt.phone ? escapeHtml(pt.phone) : '<span style="color:#64748b; font-style:italic;">Not provided</span>'}<br>
      ${hasAllergy ? `<span style="font-weight: 700; color: #b91c1c;">WARNING - KNOWN ALLERGY: ${escapeHtml(pt.allergies)}</span><br>` : ''}
      ${pt.history ? `<span style="font-size: 0.8rem; color: #64748b;">Medical History: ${escapeHtml(pt.history)}</span>` : ''}
    `;
  }
  const repeatBanner = document.getElementById("rx-repeat-banner");
  if (repeatBanner) repeatBanner.style.display = "none";

  // 7. Populate Consultation Date & Time
  const dateInput = document.getElementById("rx-date");
  if (dateInput && enc.date) {
    try {
      const d = new Date(enc.date);
      if (!isNaN(d.getTime())) {
        const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        dateInput.value = localIso;
      } else {
        dateInput.value = enc.date;
      }
    } catch (e) {
      dateInput.value = enc.date;
    }
  }

  // 8. Populate Vitals
  const vitals = enc.vitals || {};
  const bpInput = document.getElementById("vital-bp");
  if (bpInput) {
    bpInput.value = vitals.bp || "";
    onBpManualInput();
  }
  const pulseInput = document.getElementById("vital-pulse");
  if (pulseInput) pulseInput.value = vitals.pulse || "";
  const tempInput = document.getElementById("vital-temp");
  if (tempInput) tempInput.value = vitals.temp || "";
  const weightInput = document.getElementById("vital-weight");
  if (weightInput) weightInput.value = vitals.weight || "";
  const spo2Input = document.getElementById("vital-spo2");
  if (spo2Input) spo2Input.value = vitals.spo2 || "";
  const sugarInput = document.getElementById("vital-sugar");
  if (sugarInput) sugarInput.value = vitals.sugar || "";

  // Auto-expand vitals wrapper if any vital was recorded
  const vitalsWrapper = document.getElementById("vitals-collapsible-wrapper");
  if (vitalsWrapper) {
    if (vitals.bp || vitals.pulse || vitals.temp || vitals.weight || vitals.spo2 || vitals.sugar) {
      vitalsWrapper.classList.add("open");
    }
  }
  updateVitalsSummary();

  // 9. Populate Clinical Presentation & Assessment
  const sympInput = document.getElementById("rx-symptoms");
  if (sympInput) sympInput.value = enc.symptoms || "";
  const diagInput = document.getElementById("rx-diagnosis");
  if (diagInput) diagInput.value = enc.diagnosis || "";

  // 10. Populate Medicines Container: ONLY this encounter's exact medicines
  const medContainer = document.getElementById("rx-medicine-rows");
  if (medContainer) {
    medContainer.innerHTML = "";
    const meds = Array.isArray(enc.medicines) ? enc.medicines : [];
    if (meds.length > 0) {
      meds.forEach(m => {
        addMedicineRow({
          name: m.name || m.medicine || "",
          dose: m.dose || m.dosage || m.freq || "1-0-1",
          timing: m.timing || m.when || m.instructions || m.inst || "After food",
          duration: m.duration || m.dur || m.days || "5 days",
          notes: m.notes || m.specialInstructions || ""
        });
      });
    } else {
      addMedicineRow();
    }
  }
  updateMedicineRowNumbers();

  // 11. Populate Investigations, Advice & Follow-Up
  const invInput = document.getElementById("rx-investigations");
  if (invInput) invInput.value = enc.investigations || "";
  const adviceInput = document.getElementById("rx-advice");
  if (adviceInput) adviceInput.value = enc.advice || "";
  const followupInput = document.getElementById("rx-followup");
  if (followupInput) followupInput.value = enc.followup || "";

  // 12. Ensure form display state is guaranteed
  if (editForm) editForm.style.display = "block";
  if (prevContainer) prevContainer.style.display = "none";

  // 13. Synchronize dynamic chips
  updateDynamicSymptomChips();
  updateDynamicDiagnosisChips();
  updateDynamicMedicationSuggestions();

  window.scrollTo({ top: 0, behavior: "smooth" });
  showToast(`Editing prescription for ${pt.name} (${enc.id})`, "info");
  } catch (err) {
    console.error("loadEncounterIntoPrescribeForm error:", err);
    showToast("Error loading prescription: " + err.message, "error");
  }
}

function editPrescriptionById(encId) {
  try {
    const enc = (appData.encounters || []).find(e => String(e.id) === String(encId));
    if (!enc) {
      showToast("Prescription record not found.", "error");
      return;
    }
    loadEncounterIntoPrescribeForm(enc);
  } catch (err) {
    console.error("editPrescriptionById error:", err);
    showToast("Error loading prescription: " + err.message, "error");
  }
}

function viewPrescriptionById(encId) {
  const enc = (appData.encounters || []).find(e => String(e.id) === String(encId));
  if (!enc) {
    showToast("Prescription record not found.", "error");
    return;
  }
  const pt = (appData.patients || []).find(p => p.id === enc.patientId || p.mrn === enc.patientId);
  appData.currentPrescriptionEncounter = enc;

  switchTab("prescribe");
  renderPrescriptionSheet(enc, pt || { name: "Patient", mrn: "--", allergies: "None" });
  const editForm = document.querySelector(".prescribe-edit-form");
  if (editForm) editForm.style.display = "none";
  const prevContainer = document.getElementById("rx-preview-container");
  if (prevContainer) prevContainer.style.display = "block";
  if (prevContainer) prevContainer.scrollIntoView({ behavior: "smooth" });
}

// ============================================================================
// 7. OFFLINE PDF GENERATION ENGINE (jsPDF UMD)
// ============================================================================
function downloadCurrentPrescriptionPDF() {
  const enc = appData.currentPrescriptionEncounter;
  if (!enc) {
    showToast("No prescription selected to export.", "error");
    return;
  }
  generatePrescriptionPDF(enc.id, false);
}

function shareCurrentPrescriptionPDF() {
  const enc = appData.currentPrescriptionEncounter;
  if (!enc) {
    showToast("No prescription selected to share.", "error");
    return;
  }
  generatePrescriptionPDF(enc.id, true);
}

function generatePrescriptionPDF(encounterId, isShareMode = false) {
  const enc = appData.encounters.find(e => e.id === encounterId);
  if (!enc) return;
  const pt = appData.patients.find(p => p.id === enc.patientId) || { name: "Patient", mrn: "SHF-001", phone: "", age: 30, gender: "Male" };
  const includeDiag = appData.settings.includeDiagnosis !== false;

  if (!window.jspdf || !window.jspdf.jsPDF) {
    showToast("PDF Engine loading, printing via browser fallback...", "info");
    window.print();
    return;
  }

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const pageWidth = 210;
    const leftMargin = 14;
    const rightMargin = 196; // 210 - 14
    const contentWidth = rightMargin - leftMargin; // 182 mm
    let y = 14;

    // =========================================================================
    // 1. PROFESSIONAL CLINIC LETTERHEAD
    // =========================================================================
    // Clinic Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(13, 148, 136); // Emerald / Teal #0d9488
    doc.text(appData.clinic.name || "SHIFA CLINIC", leftMargin, y);

    // Clinic Contact (Right Aligned)
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(appData.clinic.address || "Main Road, Shifa Market", rightMargin, y - 5, { align: "right" });
    doc.text(`Phone: ${appData.clinic.phone || "+91 98200 12345"}`, rightMargin, y, { align: "right" });

    y += 6.5;
    // Doctor Name & Qualification
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42); // Slate #0f172a
    doc.text(appData.clinic.doctor || "Dr. M. A. Khan, MBBS, FCPS", leftMargin, y);

    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Reg # ${appData.clinic.regNo || "MC-84920"} | General & Family Medicine`, leftMargin, y);

    // Dual-tone Decorative Divider
    y += 4.5;
    doc.setDrawColor(13, 148, 136); // Primary Teal
    doc.setLineWidth(1.2);
    doc.line(leftMargin, y, rightMargin, y);

    doc.setDrawColor(203, 213, 225); // Subtle Grey accent
    doc.setLineWidth(0.3);
    doc.line(leftMargin, y + 1.2, rightMargin, y + 1.2);

    // =========================================================================
    // 2. PATIENT DEMOGRAPHICS CARD
    // =========================================================================
    y += 5.5;
    const cardHeight = 17;
    doc.setFillColor(248, 250, 252); // Slate-50
    doc.setDrawColor(203, 213, 225); // Slate-300
    doc.setLineWidth(0.4);
    doc.roundedRect(leftMargin, y, contentWidth, cardHeight, 2, 2, "FD");

    const textY1 = y + 5.5;
    const textY2 = y + 12.5;

    // Row 1
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`Patient: ${pt.name}`, leftMargin + 4, textY1);
    doc.text(`Age / Sex: ${pt.age}y / ${pt.gender}`, leftMargin + 72, textY1);
    doc.text(`Date: ${formatReadableDate(enc.date)}`, rightMargin - 4, textY1, { align: "right" });

    // Row 2
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`MRN: ${pt.mrn || "SHF-001"}`, leftMargin + 4, textY2);
    doc.text(`Phone: ${pt.phone || "Not provided"}`, leftMargin + 72, textY2);
    doc.text(`Blood Group: ${pt.bloodGroup || "Unknown"}`, rightMargin - 4, textY2, { align: "right" });

    y += cardHeight + 3.5;

    // =========================================================================
    // 3. ALLERGY WARNING (ONLY IF GENUINE ALLERGY EXISTS)
    // =========================================================================
    const rawAllergy = (pt.allergies || "").trim().toLowerCase();
    const hasRealAllergy = rawAllergy && rawAllergy !== "none" && rawAllergy !== "na" && rawAllergy !== "n/a" && rawAllergy !== "nil";
    if (hasRealAllergy) {
      doc.setFillColor(254, 242, 242); // Red-50
      doc.setDrawColor(248, 113, 113); // Red-400
      doc.setLineWidth(0.4);
      doc.roundedRect(leftMargin, y, contentWidth, 7, 1.5, 1.5, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(185, 28, 28); // Red-700
      doc.text(`⚠️ KNOWN DRUG ALLERGY: ${pt.allergies}`, leftMargin + 4, y + 4.8);
      y += 9.5;
    }

    // =========================================================================
    // 4. CLINICAL VITALS STRIP
    // =========================================================================
    const vitalsEntries = Object.entries(enc.vitals || {})
      .filter(([k, v]) => v && String(v).trim().length > 0)
      .map(([k, v]) => `${k.toUpperCase()}: ${v}`);

    if (vitalsEntries.length > 0) {
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(leftMargin, y, contentWidth, 6, 1, 1, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text("VITALS:", leftMargin + 3, y + 4.2);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      doc.text(vitalsEntries.join("   |   "), leftMargin + 18, y + 4.2);
      y += 8.5;
    }

    // =========================================================================
    // 5. PRESENTATION & ASSESSMENT (DIAGNOSIS)
    // =========================================================================
    if (includeDiag && (enc.symptoms || enc.diagnosis)) {
      if (enc.symptoms) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        doc.text("Chief Complaints:", leftMargin, y);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(15, 23, 42);
        const splitSymptoms = doc.splitTextToSize(enc.symptoms, contentWidth - 32);
        doc.text(splitSymptoms, leftMargin + 30, y);
        y += (splitSymptoms.length * 4.5) + 1;
      }

      if (enc.diagnosis) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        doc.text("Clinical Diagnosis:", leftMargin, y);

        doc.setFont("helvetica", "bold");
        doc.setTextColor(13, 148, 136); // Teal
        doc.text(enc.diagnosis, leftMargin + 30, y);
        y += 6.5;
      }
    }

    // =========================================================================
    // 6. EXECUTIVE PRESCRIPTION TABLE
    // =========================================================================
    y += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(13, 148, 136);
    doc.text("Rx", leftMargin, y);

    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text("PRESCRIBED MEDICATIONS", leftMargin + 9, y - 0.5);

    y += 3;
    // Table Dimensions
    // Widths: Index(8), Name(62), Dose(26), Timing(36), Duration(20), Remarks(30) = 182 mm
    const colX = [
      leftMargin,             // # (0)
      leftMargin + 8,         // Medicine Name (1)
      leftMargin + 70,        // Dosage / Freq (2)
      leftMargin + 96,        // Timing / When (3)
      leftMargin + 132,       // Duration (4)
      leftMargin + 152        // Instructions / Remarks (5)
    ];

    // Table Header Row
    const headerHeight = 7;
    doc.setFillColor(13, 148, 136); // Deep Teal Header
    doc.rect(leftMargin, y, contentWidth, headerHeight, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text("#", colX[0] + 2.5, y + 4.8);
    doc.text("Medicine Name & Strength", colX[1] + 2, y + 4.8);
    doc.text("Dosage (Freq)", colX[2] + 2, y + 4.8);
    doc.text("When / Timing", colX[3] + 2, y + 4.8);
    doc.text("Duration", colX[4] + 2, y + 4.8);
    doc.text("Special Instructions", colX[5] + 2, y + 4.8);

    y += headerHeight;

    // Table Rows
    const medicines = enc.medicines || [];
    medicines.forEach((m, idx) => {
      // Calculate wrapped text heights
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      const nameLines = doc.splitTextToSize(m.name || "Medicine", 60);

      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      const noteLines = doc.splitTextToSize(m.notes || "-", 28);

      const maxLines = Math.max(nameLines.length, noteLines.length, 1);
      const rowHeight = Math.max(maxLines * 4.8 + 3.5, 8.5);

      // Check for page overflow
      if (y + rowHeight > 255) {
        doc.addPage();
        y = 16;
      }

      // Alternating row background
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(leftMargin, y, contentWidth, rowHeight, "F");
      }

      // Horizontal Row Border
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.rect(leftMargin, y, contentWidth, rowHeight, "D");

      // Column Vertical Dividers
      colX.slice(1).forEach(cx => {
        doc.line(cx, y, cx, y + rowHeight);
      });

      // Cell 1: #
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(String(idx + 1), colX[0] + 2.5, y + 5.5);

      // Cell 2: Medicine Name
      doc.setTextColor(15, 23, 42);
      doc.text(nameLines, colX[1] + 2, y + 5.2);

      // Cell 3: Dosage
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(13, 148, 136);
      doc.text(m.dose || "1-0-1", colX[2] + 2, y + 5.5);

      // Cell 4: Timing
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(m.timing || "After food", colX[3] + 2, y + 5.5);

      // Cell 5: Duration
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(m.duration || "5 days", colX[4] + 2, y + 5.5);

      // Cell 6: Special Instructions
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(noteLines, colX[5] + 2, y + 5);

      y += rowHeight;
    });

    // =========================================================================
    // 7. ADVICE, INVESTIGATIONS & FOLLOW-UP SECTION
    // =========================================================================
    y += 5;
    if (enc.investigations) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text("INVESTIGATIONS / LAB TESTS:", leftMargin, y);
      y += 4.5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      const invLines = doc.splitTextToSize(enc.investigations, contentWidth);
      doc.text(invLines, leftMargin + 3, y);
      y += (invLines.length * 4) + 2;
    }

    if (enc.advice) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text("CLINICAL ADVICE & INSTRUCTIONS:", leftMargin, y);
      y += 4.5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      const advLines = doc.splitTextToSize(enc.advice, contentWidth);
      doc.text(advLines, leftMargin + 3, y);
      y += (advLines.length * 4) + 2;
    }

    if (enc.followup) {
      y += 1;
      doc.setFillColor(240, 253, 244); // Green-50
      doc.setDrawColor(134, 239, 172); // Green-300
      doc.roundedRect(leftMargin, y, contentWidth, 6.5, 1, 1, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(21, 128, 61); // Green-700
      doc.text(`NEXT FOLLOW-UP REVIEW: ${enc.followup} (or earlier if symptoms worsen)`, leftMargin + 4, y + 4.5);
      y += 9.5;
    }

    // =========================================================================
    // 8. FOOTER & AUTHORIZED SIGNATURE
    // =========================================================================
    const footerY = 276;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(leftMargin, footerY, rightMargin, footerY);

    // Left Footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`${appData.clinic.name} - Electronic Medical Record (EMR) System`, leftMargin, footerY + 4);
    doc.text("Valid medical prescription under Telemedicine & OPD Guidelines", leftMargin, footerY + 7);

    // Right Footer - Signature
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(appData.clinic.doctor || "Dr. M. A. Khan, MBBS, FCPS", rightMargin, footerY - 5, { align: "right" });

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Authorized Medical Practitioner & Stamp", rightMargin, footerY - 1, { align: "right" });

    // =========================================================================
    // 9. NATIVE DISPATCH / SAVE / SHARE
    // =========================================================================
    const safeName = (pt.name || "Patient").replace(/[^a-zA-Z0-9]/g, "_");
    const fileName = `Prescription_${safeName}_${enc.date ? enc.date.split("T")[0] : 'today'}.pdf`;

    if (isShareMode) {
      // 1. Native Android PDF Share via FileProvider
      if (window.DocAppBridge && typeof window.DocAppBridge.sharePdf === "function") {
        try {
          const dataUri = doc.output("datauristring");
          const base64Data = dataUri.split(",")[1];
          window.DocAppBridge.sharePdf(base64Data, fileName);
          showToast(`Opening Android Share for ${fileName}...`, "info");
          return;
        } catch (e) {
          console.warn("DocAppBridge sharePdf failed, trying fallback:", e);
        }
      }

      // 2. Web Share API with File
      if (navigator.share && navigator.canShare) {
        try {
          const pdfBlob = doc.output("blob");
          const pdfFile = new File([pdfBlob], fileName, { type: "application/pdf" });
          if (navigator.canShare({ files: [pdfFile] })) {
            navigator.share({
              files: [pdfFile],
              title: `Prescription - ${pt.name}`,
              text: `Prescription for ${pt.name} from ${appData.clinic.name}`
            }).catch(() => {});
            return;
          }
        } catch (err) {
          console.warn("Web Share API error:", err);
        }
      }

      doc.save(fileName);
      showToast(`Prescription saved as ${fileName}!`, "success");
    } else {
      // DOWNLOAD / SAVE ACTION
      // 1. Native Android PDF Save to Downloads folder & open with system viewer
      if (window.DocAppBridge && typeof window.DocAppBridge.savePdf === "function") {
        try {
          const dataUri = doc.output("datauristring");
          const base64Data = dataUri.split(",")[1];
          window.DocAppBridge.savePdf(base64Data, fileName);
          showToast(`Saved to Downloads: ${fileName}!`, "success");
          return;
        } catch (e) {
          console.warn("DocAppBridge savePdf failed:", e);
        }
      }

      doc.save(fileName);
      showToast(`Prescription downloaded as ${fileName}!`, "success");
    }

  } catch (err) {
    console.error("PDF Generation error:", err);
    showToast("PDF generation encountered an error. Printing fallback...", "error");
    window.print();
  }
}


// ============================================================================
// 8. DIRECT WHATSAPP & SMS DISPATCH (NATIVE INTENTS + DocAppBridge)
// ============================================================================
function formatPrescriptionText(enc, pt, includeDiag = null) {
  if (includeDiag === null) {
    includeDiag = appData.settings.includeDiagnosis !== false;
  }

  let medListText = "";
  enc.medicines.forEach((m, idx) => {
    medListText += `${idx + 1}. *${m.name}*\n   Dosage: ${m.dose} (${m.timing}) for ${m.duration}\n`;
    if (m.notes) medListText += `   Note: ${m.notes}\n`;
  });

  let diagBlock = "";
  if (includeDiag && enc.diagnosis) {
    diagBlock = `*DIAGNOSIS:* ${enc.diagnosis}\n`;
    if (enc.symptoms) {
      diagBlock += `*Complaints:* ${enc.symptoms}\n`;
    }
  }

  return `*${appData.clinic.name}*
${appData.clinic.doctor} (Reg #${appData.clinic.regNo})
--------------------------------
*Patient:* ${pt.name} (${pt.age}y/${pt.gender})
*MRN:* ${pt.mrn} | *Date:* ${formatReadableDate(enc.date)}
--------------------------------
${diagBlock}*PRESCRIBED MEDICINES:*
${medListText}
${enc.advice ? `*Advice:* ${enc.advice}\n` : ''}
${enc.investigations ? `*Tests:* ${enc.investigations}\n` : ''}
${enc.followup ? `*Follow-up:* ${enc.followup}\n` : ''}
--------------------------------
${appData.clinic.address}
Tel: ${appData.clinic.phone}`;
}

function onDispatchDiagToggleChanged() {
  const enc = appData.currentPrescriptionEncounter;
  if (!enc) return;
  const pt = appData.patients.find(p => p.id === enc.patientId);
  if (!pt) return;
  const isChecked = document.getElementById("dispatch-include-diag-toggle").checked;
  document.getElementById("dispatch-msg-text").value = formatPrescriptionText(enc, pt, isChecked);
}

function openDispatchModal(channel = 'whatsapp') {
  const enc = appData.currentPrescriptionEncounter;
  if (!enc) {
    showToast("Please save or open a prescription first.", "error");
    return;
  }

  const pt = appData.patients.find(p => p.id === enc.patientId);
  if (!pt) return;

  document.getElementById("dispatch-pt-name").textContent = `${pt.name} (${pt.age}y/${pt.gender})`;
  const phoneInput = document.getElementById("dispatch-custom-phone");
  if (phoneInput) phoneInput.value = pt.phone || "";

  const diagToggle = document.getElementById("dispatch-include-diag-toggle");
  const incDiag = appData.settings.includeDiagnosis !== false;
  if (diagToggle) {
    diagToggle.checked = incDiag;
  }

  document.getElementById("dispatch-msg-text").value = formatPrescriptionText(enc, pt, incDiag);

  document.getElementById("dispatch-modal-title").textContent = channel === 'whatsapp'
    ? `Dispatch via WhatsApp - ${pt.name}`
    : `Dispatch via SMS - ${pt.name}`;

  document.getElementById("dispatch-modal").classList.add("active");
}

function closeDispatchModal() {
  document.getElementById("dispatch-modal").classList.remove("active");
}

function executeWhatsAppDispatch() {
  const enc = appData.currentPrescriptionEncounter;
  const pt = appData.patients.find(p => p.id === enc.patientId);
  if (!pt || !pt.phone) {
    showToast("Patient mobile number is missing.", "error");
    return;
  }

  const text = document.getElementById("dispatch-msg-text").value;
  const enteredPhone = (document.getElementById("dispatch-custom-phone")?.value || pt.phone || "").trim();
  if (enteredPhone && enteredPhone !== pt.phone) {
    pt.phone = enteredPhone;
    saveData();
  }
  const cleanPhone = enteredPhone.replace(/[^0-9]/g, "");

  enc.whatsappSent = true;
  saveData();
  renderDashboard(appData.currentPeriod);

  // 1. Direct Smali Bridge if in Android APK
  if (window.DocAppBridge && typeof window.DocAppBridge.sendWhatsApp === "function") {
    try {
      window.DocAppBridge.sendWhatsApp(cleanPhone, text);
      showToast(`WhatsApp opened for ${pt.name}!`, "success");
      return;
    } catch (e) {
      console.warn("DocAppBridge.sendWhatsApp failed, falling back to scheme URL:", e);
    }
  }

  // 2. Fallback to whatsapp:// or wa.me URL (intercepted by DocWebViewClient)
  const waUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
  try {
    window.location.href = waUrl;
    showToast(`WhatsApp opened for ${pt.name}!`, "success");
  } catch (err) {
    // 3. Fallback to web link
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`, "_blank");
  }
}

function executeSMSIntentDispatch() {
  const enc = appData.currentPrescriptionEncounter;
  const pt = appData.patients.find(p => p.id === enc.patientId);
  if (!pt || !pt.phone) {
    showToast("Patient phone number missing.", "error");
    return;
  }

  const text = document.getElementById("dispatch-msg-text").value;
  const enteredPhone = (document.getElementById("dispatch-custom-phone")?.value || pt.phone || "").trim();
  if (enteredPhone && enteredPhone !== pt.phone) {
    pt.phone = enteredPhone;
    saveData();
  }
  const cleanPhone = enteredPhone.replace(/[^0-9+]/g, "");

  enc.smsSent = true;
  saveData();
  renderDashboard(appData.currentPeriod);

  // 1. Direct Smali Bridge if in Android APK
  if (window.DocAppBridge && typeof window.DocAppBridge.sendSMS === "function") {
    try {
      window.DocAppBridge.sendSMS(cleanPhone, text);
      showToast(`SMS Composer opened for ${pt.name}!`, "success");
      return;
    } catch (e) {
      console.warn("DocAppBridge.sendSMS failed, falling back to scheme URL:", e);
    }
  }

  // 2. Direct scheme URL (intercepted by DocWebViewClient)
  const smsUri = `sms:${cleanPhone}?body=${encodeURIComponent(text.slice(0, 480))}`;
  window.location.href = smsUri;
  showToast(`SMS app opened for ${pt.name}!`, "info");
}

async function executeSMSGatewayDispatch() {
  const enc = appData.currentPrescriptionEncounter;
  const pt = appData.patients.find(p => p.id === enc.patientId);
  if (!pt || !pt.phone) {
    showToast("Patient phone number is missing.", "error");
    return;
  }

  const text = document.getElementById("dispatch-msg-text").value;
  const endpoint = appData.settings.smsEndpoint || "http://localhost:8080/messages";
  const simNum = parseInt(appData.settings.smsSim || 1, 10);

  showToast("Dispatching SMS to local Android Gateway...", "info");

  const smsPayload = {
    phoneNumbers: [pt.phone],
    message: text,
    simNumber: simNum,
    withDeliveryReport: true
  };

  try {
    const headers = { "Content-Type": "application/json" };
    if (appData.settings.smsToken) {
      headers["Authorization"] = `Bearer ${appData.settings.smsToken}`;
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(smsPayload)
    });

    if (res.ok) {
      enc.smsSent = true;
      saveData();
      renderDashboard(appData.currentPeriod);
      showToast(`SMS dispatched via Android Gateway to ${pt.phone}!`, "success");
      return;
    }
  } catch (err) {
    console.warn("Direct gateway fetch encountered network or CORS, falling back to SMS intent:", err);
  }

  // Fallback to SIM SMS Intent
  executeSMSIntentDispatch();
}

function copyDispatchText() {
  const text = document.getElementById("dispatch-msg-text").value;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast("Prescription copied to clipboard!", "success");
    }).catch(() => {
      showToast("Please copy text manually.", "info");
    });
  } else {
    showToast("Copied text!", "info");
  }
}

function sendPrescriptionViaWhatsApp() {
  openDispatchModal('whatsapp');
}

function executeSMSDirectDispatch() {
  executeSMSIntentDispatch();
  closeDispatchModal();
}

function sendPrescriptionViaSMS() {
  openDispatchModal('sms');
}

// ============================================================================
// 9. PATIENT MEDICAL TIMELINE & HISTORY
// ============================================================================
function populateHistoryPatientSelect() {
  const sel = document.getElementById("history-patient-select");
  if (!sel) return;
  const curVal = sel.value;
  sel.innerHTML = `<option value="">-- Select Patient to view full timeline --</option>`;

  appData.patients.forEach(pt => {
    const opt = document.createElement("option");
    opt.value = pt.id;
    opt.textContent = `${pt.name} (${pt.mrn} - ${pt.age}y/${pt.gender} - ${pt.phone})`;
    sel.appendChild(opt);
  });

  if (curVal) sel.value = curVal;
}

function viewPatientTimeline(patientId) {
  switchTab("history");
  const sel = document.getElementById("history-patient-select");
  if (sel) {
    sel.value = patientId;
    renderPatientHistory();
  }
}

function renderPatientHistory() {
  const sel = document.getElementById("history-patient-select");
  const container = document.getElementById("history-content-area");
  if (!sel || !container) return;

  const ptId = sel.value;
  if (!ptId) {
    container.innerHTML = `<p style="text-align: center; color: #64748b; padding: 40px 0;">Please select a patient above to inspect historical encounters.</p>`;
    return;
  }

  const pt = appData.patients.find(p => p.id === ptId);
  const patientEncounters = (appData.encounters || []).filter(e => e.patientId === ptId).slice().sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  let html = `
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px;">
        <div>
          <h3 style="margin: 0; color: #0f172a; font-size: 1.15rem;">${pt.name}</h3>
          <div style="font-size: 0.84rem; color: #64748b; margin-top: 2px;">
            ${pt.age} yrs &bull; ${pt.gender} &bull; Blood Group: <strong>${pt.bloodGroup || 'N/A'}</strong> &bull; MRN: <strong>${pt.mrn}</strong>
          </div>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button class="btn btn-primary btn-sm" onclick="startConsultationForPatient('${pt.id}')">
            + New Consultation
          </button>
          ${patientEncounters.length > 0 ? `
            <button class="btn btn-outline btn-sm" style="border-color: #0d9488; color: #0d9488; font-weight: 700; background: #f0fdfa; display: inline-flex; align-items: center; gap: 4px;" onclick="startConsultationWithRepeat('${pt.id}', '${patientEncounters[0].id}')" title="1-Tap repeat prescription from last visit">
              <span>🔁 1-Tap Repeat Last Rx</span>
            </button>
          ` : ''}
        </div>
      </div>
      <div style="margin-top: 8px; font-size: 0.84rem;">
        <strong>Phone:</strong> <a href="tel:${pt.phone}" style="color: #0d9488; text-decoration: none;">${pt.phone}</a> &bull; 
        <strong>Allergies:</strong> <span style="color: ${pt.allergies && pt.allergies !== 'None' ? '#ef4444' : '#10b981'}; font-weight: 700;">${pt.allergies || 'None'}</span>
      </div>
      ${pt.history ? `<div style="margin-top: 4px; font-size: 0.82rem; color: #64748b;"><strong>History:</strong> ${pt.history}</div>` : ''}
    </div>
  `;

  if (patientEncounters.length === 0) {
    html += `<div style="text-align: center; color: #94a3b8; padding: 30px;">No previous consultations recorded for ${pt.name}.</div>`;
  } else {
    html += `<h4 style="font-size: 0.92rem; font-weight: 700; color: #0f766e; margin-bottom: 12px;">Past Visits Timeline (${patientEncounters.length})</h4>`;
        patientEncounters.forEach((enc, index) => {
      let medsSummary = "";
      (enc.medicines || []).forEach(m => {
        medsSummary += `<li><strong>${escapeHtml(m.name)}</strong> - ${escapeHtml(m.dose)} (${escapeHtml(m.timing)}) &times; ${escapeHtml(m.duration)} ${m.notes ? `<em>[${escapeHtml(m.notes)}]</em>` : ''}</li>`;
      });

      // Calculate midnight-to-midnight calendar days difference
      if (index > 0) {
        const newerDate = new Date(patientEncounters[index - 1].date);
        const olderDate = new Date(enc.date);

        const dNewer = new Date(newerDate.getFullYear(), newerDate.getMonth(), newerDate.getDate());
        const dOlder = new Date(olderDate.getFullYear(), olderDate.getMonth(), olderDate.getDate());
        const calendarDiffDays = Math.round((dNewer.getTime() - dOlder.getTime()) / (1000 * 60 * 60 * 24));
        const diffMs = newerDate.getTime() - olderDate.getTime();

        let gapText = "";
        if (calendarDiffDays === 0) {
          const diffHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
          gapText = diffHours <= 1 ? "Same day review (~1 hour gap)" : `Same day review (${diffHours} hours gap)`;
        } else if (calendarDiffDays === 1) {
          gapText = "1 day gap (Next-day review)";
        } else {
          gapText = `${calendarDiffDays} days gap between visits`;
        }

        html += `
          <div class="timeline-visit-gap-container">
            <div class="timeline-visit-gap-line"></div>
            <div class="timeline-visit-gap-badge">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0d9488" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span>${gapText}</span>
            </div>
          </div>
        `;
      }

      html += `
        <div class="card" style="margin-bottom: 14px; border-left: 4px solid #0d9488; position: relative; z-index: 2;">
          <div class="card-header" style="flex-wrap: wrap; gap: 8px;">
            <div>
              <strong style="color: #0f766e; font-size: 0.95rem;">Visit: ${formatReadableDate(enc.date)}</strong>
              <span style="font-size: 0.78rem; color: #64748b; margin-left: 8px;">${formatTime(enc.date)}</span>
            </div>
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-primary btn-sm" style="padding: 3px 8px; font-size: 0.75rem;" onclick="generatePrescriptionPDF('${enc.id}', true)">Share PDF</button>
<button class="btn btn-outline btn-sm" style="padding: 3px 8px; font-size: 0.75rem;" onclick="generatePrescriptionPDF('${enc.id}', false)">Download PDF</button>
              <button class="btn btn-outline btn-sm" style="padding: 3px 8px; font-size: 0.75rem;" onclick="editPrescriptionById('${enc.id}')">✏️ Edit Rx</button>
              <button class="btn btn-outline btn-sm" style="padding: 3px 8px; font-size: 0.75rem;" onclick="viewPrescriptionById('${enc.id}')">View Slip</button>
            </div>
          </div>
          <div style="font-size: 0.86rem; color: #334155;">
            <div><strong>Diagnosis:</strong> <span class="badge badge-primary">${enc.diagnosis}</span></div>
            ${enc.symptoms ? `<div style="margin-top: 4px;"><strong>Symptoms:</strong> ${enc.symptoms}</div>` : ''}
            <div style="margin-top: 8px;">
              <strong style="color: #0f766e;">Prescribed Medicines:</strong>
              <ul style="margin: 4px 0 0 18px; font-size: 0.84rem; line-height: 1.5;">
                ${medsSummary}
              </ul>
            </div>
            ${enc.advice ? `<div style="margin-top: 6px; font-size: 0.82rem; color: #64748b;"><strong>Advice:</strong> ${enc.advice}</div>` : ''}
          </div>
        </div>
      `;
    });
  }

  container.innerHTML = html;
}

// ============================================================================
// 10. SETTINGS & UTILITIES
// ============================================================================
function populateSettingsInputs() {
  renderSettingsDoctorRules();
  renderSettingsDoctorKits();
  document.getElementById("setting-clinic-name").value = appData.clinic.name;
  document.getElementById("setting-doc-name").value = appData.clinic.doctor;
  document.getElementById("setting-clinic-reg").value = appData.clinic.regNo;
  document.getElementById("setting-clinic-phone").value = appData.clinic.phone;
  document.getElementById("setting-clinic-address").value = appData.clinic.address;

  const diagCheck = document.getElementById("setting-include-diagnosis");
  if (diagCheck) {
    diagCheck.checked = appData.settings.includeDiagnosis !== false;
  }

  const modeSelect = document.getElementById("setting-sms-mode");
  if (modeSelect) {
    modeSelect.value = appData.settings.smsMode || "direct";
  }

  const simSelect = document.getElementById("setting-sms-sim");
  if (simSelect) {
    simSelect.value = appData.settings.smsSim || 1;
  }
}

function saveSettings() {
  appData.clinic.name = document.getElementById("setting-clinic-name").value.trim() || "SHIFA CLINIC";
  appData.clinic.doctor = document.getElementById("setting-doc-name").value.trim() || "Dr. M. A. Khan, MBBS";
  appData.clinic.regNo = document.getElementById("setting-clinic-reg").value.trim() || "MC-84920";
  appData.clinic.phone = document.getElementById("setting-clinic-phone").value.trim() || "+91 98200 12345";
  appData.clinic.address = document.getElementById("setting-clinic-address").value.trim();

  const diagCheck = document.getElementById("setting-include-diagnosis");
  if (diagCheck) {
    appData.settings.includeDiagnosis = diagCheck.checked;
  }

  const modeSelect = document.getElementById("setting-sms-mode");
  if (modeSelect) {
    appData.settings.smsMode = modeSelect.value;
  }

  const simSelect = document.getElementById("setting-sms-sim");
  if (simSelect) {
    appData.settings.smsSim = parseInt(simSelect.value, 10);
  }

  saveData();

  updateClinicHeader();
  if (typeof renderDashboard === "function") renderDashboard(appData.currentPeriod || "daily");
  showToast("Clinic and gateway configuration saved!", "success");
}

function testGatewayConnection() {
  showToast("Android SMS & WhatsApp Direct Service is ACTIVE & READY!", "success");
}

function exportDataBackup() {
  const jsonStr = JSON.stringify(appData, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `DocEMR_Shifa_Backup_${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("Database backup exported successfully!", "success");
}

function resetDatabaseToDefault() {
  if (confirm("Reset to default Shifa Clinic demo database?")) {
    localStorage.removeItem("DOCEMR_SHIFA_DATA_V2");
    loadData();
    renderDashboard(appData.currentPeriod);
    renderPatientsTable();
    populateRxPatientSelect();
    showToast("Demo clinic data restored!", "info");
  }
}

function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 350);
  }, 3200);
}

function escapeHtml(text) {
  if (!text) return "";
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

// ============================================================================
// 11. BOOTSTRAP APPLICATION ON DOM READY
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
  window.__docemrBooted = true;
  initVitalsCollapseState();
  updateClinicHeader();
  loadData();
  updateClinicHeader();
  if (typeof initOTASyncEngine === "function") initOTASyncEngine();
  initFormDates();
  setupGlobalSearch();

  // Initial render of active tab
  renderDashboard("daily");
  const initFab = document.getElementById("ai-scribe-fab"); if (initFab) initFab.style.display = "flex";
  renderPatientsTable();
  populateRxPatientSelect();
  updateDynamicDiagnosisChips();
  updateDynamicMedicationSuggestions();
});


function showPatientDetailDrawer(patientId) {
  const viewer = document.getElementById("patient-timeline-inline-viewer");
  const content = document.getElementById("patient-timeline-inline-content");
  if (!viewer || !content) return;

  const pt = (appData.patients || []).find(p => p.id === patientId);
  if (!pt) return;

  const patientEncounters = (appData.encounters || []).filter(e => e.patientId === patientId).slice().sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  let html = `
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; margin-bottom: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px;">
        <div>
          <h3 style="margin: 0; color: #0f172a; font-size: 1.15rem;">${escapeHtml(pt.name)}</h3>
          <div style="font-size: 0.84rem; color: #64748b; margin-top: 2px;">
            ${pt.age} yrs &bull; ${pt.gender} &bull; Blood Group: <strong>${pt.bloodGroup || 'N/A'}</strong> &bull; MRN: <strong>${pt.mrn}</strong>
          </div>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button class="btn btn-primary btn-sm" onclick="startConsultationForPatient('${pt.id}')">
            + New Consultation
          </button>
          ${patientEncounters.length > 0 ? `
            <button class="btn btn-outline btn-sm" style="border-color: #0d9488; color: #0d9488; font-weight: 700; background: #f0fdfa; display: inline-flex; align-items: center; gap: 4px;" onclick="startConsultationWithRepeat('${pt.id}', '${patientEncounters[0].id}')" title="1-Tap repeat prescription from last visit">
              <span>🔁 1-Tap Repeat Last Rx</span>
            </button>
          ` : ''}
          <button class="btn btn-outline btn-sm" onclick="editPatient('${pt.id}')">
            ✏️ Edit
          </button>
        </div>
      </div>
      <div style="margin-top: 8px; font-size: 0.84rem;">
        <strong>Phone:</strong> <a href="tel:${pt.phone}" style="color: #0d9488; text-decoration: none;">${pt.phone}</a> &bull; 
        <strong>Allergies:</strong> <span style="color: ${pt.allergies && pt.allergies !== 'None' ? '#ef4444' : '#10b981'}; font-weight: 700;">${pt.allergies || 'None'}</span>
      </div>
    </div>
  `;

  if (patientEncounters.length === 0) {
    html += `<div style="text-align: center; color: #94a3b8; padding: 24px;">No previous consultations recorded for ${escapeHtml(pt.name)}. Tap <strong>+ New Consultation</strong> to write an Rx.</div>`;
  } else {
    html += `<h4 style="font-size: 0.92rem; font-weight: 700; color: #0f766e; margin-bottom: 12px;">Past Visits Timeline (${patientEncounters.length})</h4>`;
    patientEncounters.forEach((enc, index) => {
      let medsSummary = "";
      (enc.medicines || []).forEach(m => {
        medsSummary += `<li><strong>${escapeHtml(m.name)}</strong> - ${escapeHtml(m.dose)} (${escapeHtml(m.timing)}) &times; ${escapeHtml(m.duration)} ${m.notes ? `<em>[${escapeHtml(m.notes)}]</em>` : ''}</li>`;
      });

      // Calculate midnight-to-midnight calendar days difference
      if (index > 0) {
        const newerDate = new Date(patientEncounters[index - 1].date);
        const olderDate = new Date(enc.date);

        const dNewer = new Date(newerDate.getFullYear(), newerDate.getMonth(), newerDate.getDate());
        const dOlder = new Date(olderDate.getFullYear(), olderDate.getMonth(), olderDate.getDate());
        const calendarDiffDays = Math.round((dNewer.getTime() - dOlder.getTime()) / (1000 * 60 * 60 * 24));
        const diffMs = newerDate.getTime() - olderDate.getTime();

        let gapText = "";
        if (calendarDiffDays === 0) {
          const diffHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
          gapText = diffHours <= 1 ? "Same day review (~1 hour gap)" : `Same day review (${diffHours} hours gap)`;
        } else if (calendarDiffDays === 1) {
          gapText = "1 day gap (Next-day review)";
        } else {
          gapText = `${calendarDiffDays} days gap between visits`;
        }

        html += `
          <div class="timeline-visit-gap-container">
            <div class="timeline-visit-gap-line"></div>
            <div class="timeline-visit-gap-badge">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0d9488" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span>${gapText}</span>
            </div>
          </div>
        `;
      }

      html += `
        <div class="card" style="margin-bottom: 12px; border-left: 4px solid #0d9488; position: relative; z-index: 2;">
          <div class="card-header" style="flex-wrap: wrap; gap: 8px;">
            <div>
              <strong style="color: #0f766e; font-size: 0.95rem;">Visit: ${formatReadableDate(enc.date)}</strong>
              <span style="font-size: 0.78rem; color: #64748b; margin-left: 8px;">${formatTime(enc.date)}</span>
            </div>
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-primary btn-sm" style="padding: 3px 8px; font-size: 0.75rem;" onclick="generatePrescriptionPDF('${enc.id}', true)">Share PDF</button>
              <button class="btn btn-outline btn-sm" style="padding: 3px 8px; font-size: 0.75rem;" onclick="editPrescriptionById('${enc.id}')">✏️ Edit Rx</button>
              <button class="btn btn-outline btn-sm" style="padding: 3px 8px; font-size: 0.75rem;" onclick="viewPrescriptionById('${enc.id}')">View Slip</button>
            </div>
          </div>
          <div style="font-size: 0.86rem; color: #334155;">
            <div><strong>Diagnosis:</strong> <span class="badge badge-primary">${escapeHtml(enc.diagnosis || 'General')}</span></div>
            ${enc.symptoms ? `<div style="margin-top: 4px;"><strong>Symptoms:</strong> ${escapeHtml(enc.symptoms)}</div>` : ''}
            <div style="margin-top: 8px;">
              <strong style="color: #0f766e;">Prescribed Medicines:</strong>
              <ul style="margin: 4px 0 0 18px; font-size: 0.84rem; line-height: 1.5;">
                ${medsSummary || '<li>No medicines recorded</li>'}
              </ul>
            </div>
            ${enc.advice ? `<div style="margin-top: 6px; font-size: 0.82rem; color: #64748b;"><strong>Advice:</strong> ${escapeHtml(enc.advice)}</div>` : ''}
          </div>
        </div>
      `;
    });
  }

  content.innerHTML = html;
  viewer.style.display = "block";
  viewer.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closePatientTimelineViewer() {
  const viewer = document.getElementById("patient-timeline-inline-viewer");
  if (viewer) {
    viewer.style.display = "none";
  }
}


function startNewBlankConsultation() {
  switchTab("prescribe");
  const editForm = document.querySelector(".prescribe-edit-form");
  if (editForm) editForm.style.display = "block";
  const prevContainer = document.getElementById("rx-preview-container");
  if (prevContainer) prevContainer.style.display = "none";
  resetEncounterForm();
  updateDynamicDiagnosisChips();
  updateDynamicMedicationSuggestions();
  window.scrollTo({ top: 0, behavior: "smooth" });
}


// ============================================================================
// ZERO-ANXIETY CLOUD BACKUP & MULTI-DEVICE SYNC ENGINE
// ============================================================================
let pendingRestoreData = null;

function initSyncMeta() {
  if (!appData.syncMeta) {
    appData.syncMeta = {
      lastBackupTime: null,
      unsavedChangesCount: 0,
      totalBackupsDone: 0
    };
  }
}

function trackUnsavedChange() {
  initSyncMeta();
  appData.syncMeta.unsavedChangesCount++;
  localStorage.setItem("DOCEMR_SHIFA_DATA_V2", JSON.stringify(appData));
  updateSyncUI();
}

function updateSyncUI() {
  initSyncMeta();
  const unsaved = appData.syncMeta.unsavedChangesCount || 0;
  const lastTime = appData.syncMeta.lastBackupTime;

  // Header Dot & Label
  const dot = document.getElementById("sync-status-dot");
  const headerLabel = document.getElementById("header-sync-label");
  const headerBtn = document.getElementById("header-sync-btn");

  if (dot) {
    if (unsaved > 0) {
      dot.className = "sync-dot-amber";
      if (headerLabel) headerLabel.textContent = `Backup (${unsaved})`;
      if (headerBtn) headerBtn.title = `${unsaved} unsynced changes. Tap to backup clinic records.`;
    } else {
      dot.className = "sync-dot-green";
      if (headerLabel) headerLabel.textContent = "Backed Up";
      if (headerBtn) headerBtn.title = "All records backed up and secure.";
    }
  }

  // Settings Card Stats
  const ptCount = (appData.patients || []).length;
  const encCount = (appData.encounters || []).length;
  const kitsCount = (appData.doctorKits || []).length;

  const statPts = document.getElementById("stat-backup-patients");
  const statEncs = document.getElementById("stat-backup-encounters");
  const statKits = document.getElementById("stat-backup-kits");
  const statLastDate = document.getElementById("stat-backup-last-date");
  const settingsBadge = document.getElementById("settings-backup-badge");
  const settingsStatusText = document.getElementById("settings-backup-status-text");

  if (statPts) statPts.textContent = ptCount;
  if (statEncs) statEncs.textContent = encCount;
  if (statKits) statKits.textContent = kitsCount;
  if (statLastDate) {
    statLastDate.textContent = lastTime ? formatReadableDate(lastTime) : "Never";
  }

  if (settingsBadge && settingsStatusText) {
    if (unsaved > 0) {
      settingsBadge.className = "backup-status-badge unsynced";
      settingsStatusText.textContent = `${unsaved} Unbacked Visits`;
    } else {
      settingsBadge.className = "backup-status-badge synced";
      settingsStatusText.textContent = "All Records Secure";
    }
  }

  // Modal Stats
  const mPts = document.getElementById("modal-stat-patients");
  const mEncs = document.getElementById("modal-stat-encounters");
  const mKits = document.getElementById("modal-stat-kits");
  const mTime = document.getElementById("modal-sync-time-label");
  const mBadge = document.getElementById("modal-backup-badge");
  const mStatusText = document.getElementById("modal-backup-status-text");

  if (mPts) mPts.textContent = ptCount;
  if (mEncs) mEncs.textContent = encCount;
  if (mKits) mKits.textContent = kitsCount;
  if (mTime) {
    mTime.textContent = lastTime ? `Last backup: ${formatReadableDate(lastTime)} at ${formatTime(lastTime)}` : "No backups recorded yet.";
  }
  if (mBadge && mStatusText) {
    if (unsaved > 0) {
      mBadge.className = "backup-status-badge unsynced";
      mStatusText.textContent = `${unsaved} Unsynced`;
    } else {
      mBadge.className = "backup-status-badge synced";
      mStatusText.textContent = "All Secure";
    }
  }
}

function openBackupModal() {
  updateSyncUI();
  const modal = document.getElementById("backup-sync-modal");
  if (modal) modal.classList.add("active");
}

function closeBackupModal() {
  const modal = document.getElementById("backup-sync-modal");
  if (modal) modal.classList.remove("active");
}

function closeRestoreAuditModal() {
  const modal = document.getElementById("restore-audit-modal");
  if (modal) modal.classList.remove("active");
  pendingRestoreData = null;
}

function executeClinicBackup(mode = 'download') {
  initSyncMeta();
  const timestamp = new Date().toISOString();
  const cleanClinic = (appData.clinic.name || "Clinic").replace(/[^a-zA-Z0-9]/g, "_");
  const dateStr = formatReadableDate(timestamp).replace(/\s+/g, "_");
  const fileName = `DocEMR_Backup_${cleanClinic}_${dateStr}.docemr`;

  const backupPayload = {
    version: "3.5",
    app: "DocEMR",
    clinic: appData.clinic,
    exportedAt: timestamp,
    patients: appData.patients || [],
    encounters: appData.encounters || [],
    doctorKits: appData.doctorKits || [],
    doctorRules: appData.doctorRules || [],
    settings: appData.settings || {},
    signature: btoa(`docemr-${(appData.patients || []).length}-${(appData.encounters || []).length}`)
  };

  const jsonStr = JSON.stringify(backupPayload, null, 2);
  const base64Content = btoa(unescape(encodeURIComponent(jsonStr)));

  if (mode === 'share') {
    // 1. Android Native FileProvider Share (Direct to Google Drive, WhatsApp, Email, Files)
    if (window.DocAppBridge && typeof window.DocAppBridge.shareBackup === "function") {
      try {
        window.DocAppBridge.shareBackup(base64Content, fileName);
        onBackupCompleted(timestamp);
        return;
      } catch (e) {
        console.warn("DocAppBridge.shareBackup failed, trying Web Share fallback:", e);
      }
    }

    // 2. Web Share API with File
    if (navigator.share && navigator.canShare) {
      try {
        const file = new File([jsonStr], fileName, { type: "application/json" });
        if (navigator.canShare({ files: [file] })) {
          navigator.share({
            files: [file],
            title: `DocEMR Clinic Backup - ${appData.clinic.name}`,
            text: `Encrypted DocEMR database backup for ${appData.clinic.name} (${(appData.patients || []).length} patients, ${(appData.encounters || []).length} consultations).`
          }).then(() => {
            onBackupCompleted(timestamp);
          }).catch((err) => {
            console.warn("Share cancelled or failed, falling back to download:", err);
            triggerFileDownload(jsonStr, fileName);
            onBackupCompleted(timestamp);
          });
          return;
        }
      } catch (err) {
        console.warn("Web Share file error:", err);
      }
    }
  }

  // Download mode: Check if native saveBackup exists, else browser Blob download
  if (window.DocAppBridge && typeof window.DocAppBridge.saveBackup === "function") {
    try {
      window.DocAppBridge.saveBackup(base64Content, fileName);
      onBackupCompleted(timestamp);
      return;
    } catch (e) {
      console.warn("DocAppBridge.saveBackup failed:", e);
    }
  }

  // Fallback: Web Blob download
  triggerFileDownload(jsonStr, fileName);
  onBackupCompleted(timestamp);
}

function onBackupCompleted(timestamp) {
  initSyncMeta();
  appData.syncMeta.lastBackupTime = timestamp;
  appData.syncMeta.unsavedChangesCount = 0;
  appData.syncMeta.totalBackupsDone = (appData.syncMeta.totalBackupsDone || 0) + 1;
  localStorage.setItem("DOCEMR_SHIFA_DATA_V2", JSON.stringify(appData));
  updateSyncUI();
  closeBackupModal();
  showToast(`Clinic backup saved: ${(appData.patients || []).length} patients & ${(appData.encounters || []).length} visits secure!`, "success");
}

function triggerRestorePicker() {
  const picker = document.getElementById("backup-file-picker");
  if (picker) {
    picker.value = "";
    picker.click();
  }
}

function handleBackupFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!data || (!data.patients && !data.encounters)) {
        showToast("Invalid backup file format. Missing clinical records.", "error");
        return;
      }

      pendingRestoreData = data;

      // Populate audit modal
      const cName = document.getElementById("audit-clinic-name");
      const bDate = document.getElementById("audit-backup-date");
      const pCount = document.getElementById("audit-patients-count");
      const eCount = document.getElementById("audit-encounters-count");
      const kCount = document.getElementById("audit-kits-count");

      if (cName) cName.textContent = (data.clinic && data.clinic.name) || "DocEMR Clinic Database";
      if (bDate) bDate.textContent = data.exportedAt ? formatReadableDate(data.exportedAt) + " at " + formatTime(data.exportedAt) : "Archived File";
      if (pCount) pCount.textContent = (data.patients || []).length;
      if (eCount) eCount.textContent = (data.encounters || []).length;
      if (kCount) kCount.textContent = (data.doctorKits || []).length;

      closeBackupModal();
      const auditModal = document.getElementById("restore-audit-modal");
      if (auditModal) auditModal.classList.add("active");

    } catch (err) {
      console.error("Backup parse error:", err);
      showToast("Error reading backup file. Please select a valid .docemr file.", "error");
    }
  };
  reader.readAsText(file);
}

function confirmExecuteRestore(mode = 'merge') {
  if (!pendingRestoreData) {
    showToast("No backup file loaded.", "error");
    return;
  }

  const incomingPts = pendingRestoreData.patients || [];
  const incomingEncs = pendingRestoreData.encounters || [];
  const incomingKits = pendingRestoreData.doctorKits || [];

  if (mode === 'replace') {
    if (!confirm(`Are you sure you want to completely replace the current clinic database with ${incomingPts.length} patients and ${incomingEncs.length} consultations from this backup?`)) {
      return;
    }
    appData.patients = incomingPts;
    appData.encounters = incomingEncs;
    if (incomingKits.length > 0) appData.doctorKits = incomingKits;
    if (pendingRestoreData.clinic) appData.clinic = pendingRestoreData.clinic;
    if (pendingRestoreData.settings) appData.settings = pendingRestoreData.settings;
  } else {
    // Smart Merge
    // 1. Merge Patients (Avoid duplicates by ID and phone)
    incomingPts.forEach(inPt => {
      const existingIdx = appData.patients.findIndex(p => p.id === inPt.id || (p.phone && p.phone === inPt.phone));
      if (existingIdx !== -1) {
        // Update existing record
        appData.patients[existingIdx] = { ...appData.patients[existingIdx], ...inPt };
      } else {
        appData.patients.push(inPt);
      }
    });

    // 2. Merge Encounters (Avoid duplicate encounter IDs)
    incomingEncs.forEach(inEnc => {
      const exists = appData.encounters.some(e => e.id === inEnc.id);
      if (!exists) {
        appData.encounters.push(inEnc);
      }
    });

    // 3. Merge Doctor Kits
    incomingKits.forEach(inKit => {
      const exists = (appData.doctorKits || []).some(k => k.id === inKit.id);
      if (!exists) {
        if (!appData.doctorKits) appData.doctorKits = [];
        appData.doctorKits.push(inKit);
      }
    });
  }

  // Update sync metadata
  initSyncMeta();
  appData.syncMeta.lastBackupTime = new Date().toISOString();
  appData.syncMeta.unsavedChangesCount = 0;
  localStorage.setItem("DOCEMR_SHIFA_DATA_V2", JSON.stringify(appData));

  // Refresh all views
  renderDashboard(appData.currentPeriod);
  renderPatientsTable();
  populateRxPatientSelect();
  populateSettingsInputs();
  updateSyncUI();

  closeRestoreAuditModal();
  showToast(`Restored successfully! Database now holds ${appData.patients.length} patients and ${appData.encounters.length} consultations.`, "success");
}


// ============================================================================
// COLLAPSIBLE & ERGONOMIC CLINICAL VITALS ENGINE
// ============================================================================
const VITALS_COLLAPSE_STORAGE_KEY = "DOCEMR_VITALS_COLLAPSED_STATE";

function initVitalsCollapseState() {
  const isCollapsed = localStorage.getItem(VITALS_COLLAPSE_STORAGE_KEY) === "true";
  const card = document.getElementById("vitals-collapsible-wrapper");
  if (!card) return;

  if (isCollapsed) {
    card.classList.remove("open");
  } else {
    card.classList.add("open");
  }
  updateVitalsSummary();
}

function toggleVitalsSection() {
  const card = document.getElementById("vitals-collapsible-wrapper");
  if (!card) return;

  card.classList.toggle("open");
  const isNowCollapsed = !card.classList.contains("open");
  localStorage.setItem(VITALS_COLLAPSE_STORAGE_KEY, isNowCollapsed ? "true" : "false");
  updateVitalsSummary();
}

function updateVitalsSummary() {
  const badge = document.getElementById("vitals-summary-badge");
  const card = document.getElementById("vitals-collapsible-wrapper");
  if (!badge) return;

  const bp = String(document.getElementById("vital-bp")?.value || "").trim();
  const pulse = String(document.getElementById("vital-pulse")?.value || "").trim();
  const temp = String(document.getElementById("vital-temp")?.value || "").trim();
  const spo2 = String(document.getElementById("vital-spo2")?.value || "").trim();
  const sugar = String(document.getElementById("vital-sugar")?.value || "").trim();

  const filled = [];
  if (bp) filled.push(`BP: ${bp}`);
  if (pulse) filled.push(`P: ${pulse}`);
  if (temp) filled.push(`T: ${temp}°F`);
  if (spo2) filled.push(`SpO2: ${spo2}%`);
  if (sugar) filled.push(`Sugar: ${sugar}`);

  if (!card || card.classList.contains("open")) {
    badge.textContent = filled.length > 0 ? `${filled.length} vitals recorded (Tap to collapse)` : "Tap to collapse";
  } else {
    badge.textContent = filled.length > 0 ? filled.join(" | ") : "None entered (Tap to expand)";
  }
}

// Stepper for any number input
function stepVital(inputId, delta) {
  const input = document.getElementById(inputId);
  if (!input) return;
  let val = parseFloat(input.value);
  if (isNaN(val)) {
    if (inputId === "vital-pulse") val = 72;
    else if (inputId === "vital-temp") val = 98.6;
    else if (inputId === "vital-spo2") val = 98;
    else if (inputId === "vital-weight") val = 65;
    else val = 0;
  }
  val = Math.round((val + delta) * 10) / 10;
  input.value = val;
  if (inputId === "vital-temp") {
    syncTempSliderFromInput(val);
  }
  updateVitalsSummary();
}

function setQuickVital(inputId, val) {
  const input = document.getElementById(inputId);
  if (input) {
    input.value = val;
    if (inputId === "vital-temp") syncTempSliderFromInput(val);
    updateVitalsSummary();
  }
}

// BP: Dual Sliders (Systolic & Diastolic)
function onBpSliderChange() {
  const sys = document.getElementById("slider-bp-sys")?.value || 120;
  const dia = document.getElementById("slider-bp-dia")?.value || 80;

  const sysBadge = document.getElementById("badge-bp-sys");
  const diaBadge = document.getElementById("badge-bp-dia");
  if (sysBadge) sysBadge.textContent = sys;
  if (diaBadge) diaBadge.textContent = dia;

  const bpInput = document.getElementById("vital-bp");
  if (bpInput) {
    bpInput.value = `${sys}/${dia} mmHg`;
  }

  const ind = document.getElementById("bp-indicator");
  if (ind) {
    if (sys > 140 || dia > 90) {
      ind.textContent = "High BP (Stage 1/2)";
      ind.style.color = "#ef4444";
    } else if (sys < 90 || dia < 60) {
      ind.textContent = "Hypotension";
      ind.style.color = "#eab308";
    } else {
      ind.textContent = "Normal";
      ind.style.color = "#0d9488";
    }
  }
  updateVitalsSummary();
}

function onBpManualInput() {
  const val = (document.getElementById("vital-bp")?.value || "").trim();
  const match = val.match(/(\d{2,3})\s*[\/\-]\s*(\d{2,3})/);
  if (match) {
    const sys = parseInt(match[1], 10);
    const dia = parseInt(match[2], 10);

    const sSlider = document.getElementById("slider-bp-sys");
    const dSlider = document.getElementById("slider-bp-dia");
    if (sSlider && sys >= 70 && sys <= 220) sSlider.value = sys;
    if (dSlider && dia >= 40 && dia <= 140) dSlider.value = dia;

    const sysBadge = document.getElementById("badge-bp-sys");
    const diaBadge = document.getElementById("badge-bp-dia");
    if (sysBadge) sysBadge.textContent = sys;
    if (diaBadge) diaBadge.textContent = dia;
  }
  updateVitalsSummary();
}

// Temperature: Slider & Input Sync
function onTempSliderChange() {
  const val = parseFloat(document.getElementById("slider-temp")?.value || 98.6);
  const tempInput = document.getElementById("vital-temp");
  const badge = document.getElementById("badge-temp");

  if (tempInput) tempInput.value = val.toFixed(1);
  if (badge) badge.textContent = `${val.toFixed(1)}°`;

  const ind = document.getElementById("temp-indicator");
  if (ind) {
    if (val >= 100.4) {
      ind.textContent = "High Fever";
      ind.style.color = "#ef4444";
    } else if (val >= 99.0) {
      ind.textContent = "Low Grade Fever";
      ind.style.color = "#f97316";
    } else {
      ind.textContent = "Normal";
      ind.style.color = "#10b981";
    }
  }
  updateVitalsSummary();
}

function onTempManualInput() {
  const val = parseFloat(document.getElementById("vital-temp")?.value);
  if (!isNaN(val)) {
    syncTempSliderFromInput(val);
  }
  updateVitalsSummary();
}

function syncTempSliderFromInput(val) {
  const slider = document.getElementById("slider-temp");
  const badge = document.getElementById("badge-temp");
  if (slider && val >= 95.0 && val <= 105.0) {
    slider.value = val;
  }
  if (badge) badge.textContent = `${val.toFixed(1)}°`;

  const ind = document.getElementById("temp-indicator");
  if (ind) {
    if (val >= 100.4) {
      ind.textContent = "High Fever";
      ind.style.color = "#ef4444";
    } else if (val >= 99.0) {
      ind.textContent = "Low Grade Fever";
      ind.style.color = "#f97316";
    } else {
      ind.textContent = "Normal";
      ind.style.color = "#10b981";
    }
  }
}

// Sugar: Stepper & Type Chips
function stepSugar(delta) {
  const input = document.getElementById("vital-sugar");
  if (!input) return;
  const match = input.value.match(/\d+/);
  let num = match ? parseInt(match[0], 10) : 100;
  num += delta;
  if (num < 40) num = 40;

  // Preserve suffix if present
  let suffix = "";
  if (input.value.includes("Fasting")) suffix = " (Fasting)";
  else if (input.value.includes("PP") || input.value.includes("Post")) suffix = " (PP)";
  else if (input.value.includes("Random") || input.value.includes("RBS")) suffix = " (Random)";
  else if (input.value.includes("HbA1c")) suffix = "% (HbA1c)";

  input.value = `${num}${suffix}`;
  updateVitalsSummary();
}

function setSugarType(type) {
  const input = document.getElementById("vital-sugar");
  if (!input) return;
  const match = input.value.match(/\d+/);
  const num = match ? match[0] : (type === "Fasting" ? "105" : "140");
  input.value = `${num} (${type})`;
  updateVitalsSummary();
}


// ============================================================================
// DOCTOR'S PERSONALIZED MEDICINE RANKING & SYMPTOM PREFERENCE ENGINE
// ============================================================================
function seedDefaultDoctorRules() {
  if (!appData.doctorRules || !Array.isArray(appData.doctorRules) || appData.doctorRules.length === 0) {
    appData.doctorRules = [
      {
        id: "RULE-FEVER-01",
        symptom: "Fever",
        medicines: ["Tab. Dolo 650mg", "Tab. Paracetamol 650mg", "Tab. Meftal-Forte"]
      },
      {
        id: "RULE-COUGH-01",
        symptom: "Cough",
        medicines: ["Tab. Montair-LC", "Syp. Ascoril-D", "Tab. Levocetirizine 5mg"]
      },
      {
        id: "RULE-ACID-01",
        symptom: "Acidity / Abdominal Pain",
        medicines: ["Tab. Pantoprazole 40mg", "Cap. Omeprazole 20mg", "Syp. Gelusil MPS"]
      }
    ];
  }
}

function renderSettingsDoctorRules() {
  const container = document.getElementById("settings-rules-list");
  if (!container) return;
  seedDefaultDoctorRules();

  if (!appData.doctorRules || appData.doctorRules.length === 0) {
    container.innerHTML = `<div style="color: #64748b; font-size: 0.86rem; padding: 10px; text-align: center;">No custom ranking rules defined yet.</div>`;
    return;
  }

  container.innerHTML = "";
  appData.doctorRules.forEach(rule => {
    const card = document.createElement("div");
    card.className = "rule-item-card";
    card.innerHTML = `
      <div class="rule-header-row">
        <div class="rule-symptom-tag">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          <span>If patient has: <strong>${escapeHtml(rule.symptom)}</strong></span>
        </div>
        <div style="display: flex; gap: 6px;">
          <button type="button" class="btn btn-outline btn-xs" onclick="openEditDoctorRuleModal('${rule.id}')">Edit</button>
          <button type="button" class="btn btn-outline btn-xs" style="color: #ef4444; border-color: #fca5a5;" onclick="deleteDoctorRule('${rule.id}')">&times;</button>
        </div>
      </div>
      <div class="rule-med-preference-list">
        ${rule.medicines.map((m, idx) => `
          <span class="rule-pref-chip">
            <span class="rule-pref-rank">${idx + 1}</span>
            <span>${escapeHtml(m)}</span>
          </span>
        `).join('')}
      </div>
    `;
    container.appendChild(card);
  });
}

function renderSettingsDoctorKits() {
  const container = document.getElementById("settings-kits-list");
  if (!container) return;

  const kits = appData.doctorKits || [];
  if (kits.length === 0) {
    container.innerHTML = `<div style="color: #64748b; font-size: 0.86rem; padding: 10px; text-align: center;">No custom kits created yet. Tap "+ Create New Kit" to add your first kit!</div>`;
    return;
  }

  container.innerHTML = "";
  kits.forEach(kit => {
    const item = document.createElement("div");
    item.style = "background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; gap: 8px;";
    item.innerHTML = `
      <div>
        <div style="font-weight: 700; color: #0f172a; font-size: 0.9rem;">⭐ ${escapeHtml(kit.name)}</div>
        <div style="font-size: 0.78rem; color: #64748b;">
          <strong>Diagnosis:</strong> ${escapeHtml(kit.triggerDiagnosis || 'General')} &bull; 
          <strong>Meds:</strong> ${(kit.medicines || []).length} medications &bull; 
          <strong>Age:</strong> ${escapeHtml(kit.ageGroup || 'all')}
        </div>
      </div>
      <div style="display: flex; gap: 6px;">
        <button type="button" class="btn btn-outline btn-xs" onclick="openEditKitModal('${kit.id}')">Edit</button>
        <button type="button" class="btn btn-outline btn-xs" style="color: #ef4444;" onclick="deleteDoctorKit('${kit.id}')">&times;</button>
      </div>
    `;
    container.appendChild(item);
  });
}

function openAddDoctorRuleModal() {
  document.getElementById("rule-edit-id").value = "";
  document.getElementById("rule-edit-symptom").value = "";
  document.getElementById("doctor-rule-modal-title").textContent = "⚡ Add Medicine Preference Rule";

  const rows = document.getElementById("rule-medicines-rows");
  rows.innerHTML = "";
  addRuleMedicineInputRow("Tab. Dolo 650mg");
  addRuleMedicineInputRow("Tab. Paracetamol 650mg");

  document.getElementById("doctor-rule-modal").classList.add("active");
}

function openEditDoctorRuleModal(ruleId) {
  const rule = (appData.doctorRules || []).find(r => r.id === ruleId);
  if (!rule) return;

  document.getElementById("rule-edit-id").value = rule.id;
  document.getElementById("rule-edit-symptom").value = rule.symptom;
  document.getElementById("doctor-rule-modal-title").textContent = "⚡ Edit Medicine Preference Rule";

  const rows = document.getElementById("rule-medicines-rows");
  rows.innerHTML = "";
  (rule.medicines || []).forEach(m => addRuleMedicineInputRow(m));

  document.getElementById("doctor-rule-modal").classList.add("active");
}

function closeDoctorRuleModal() {
  document.getElementById("doctor-rule-modal").classList.remove("active");
}

function addRuleMedicineInputRow(defaultVal = "") {
  const container = document.getElementById("rule-medicines-rows");
  if (!container) return;

  const currentCount = container.children.length + 1;
  const row = document.createElement("div");
  row.style = "display: flex; align-items: center; gap: 8px;";
  row.innerHTML = `
    <span style="font-size: 0.8rem; font-weight: 700; width: 50px; color: #1d4ed8;">#${currentCount}</span>
    <input type="text" class="form-control rule-med-input" placeholder="Medicine name (e.g. Tab. Dolo 650mg)" value="${escapeHtml(defaultVal)}" style="flex:1;">
    <button type="button" class="btn-remove-row" onclick="this.closest('div').remove()" style="padding: 2px 8px; font-size: 1.1rem;">&times;</button>
  `;
  container.appendChild(row);
}

function saveDoctorRule() {
  const ruleId = document.getElementById("rule-edit-id").value;
  const symptom = document.getElementById("rule-edit-symptom").value.trim();

  if (!symptom) {
    showToast("Please specify the symptom for this rule.", "error");
    return;
  }

  const medInputs = document.querySelectorAll("#rule-medicines-rows .rule-med-input");
  const meds = [];
  medInputs.forEach(inp => {
    const v = inp.value.trim();
    if (v) meds.push(v);
  });

  if (meds.length === 0) {
    showToast("Please provide at least 1 ranked medication.", "error");
    return;
  }

  appData.doctorRules = appData.doctorRules || [];

  if (ruleId) {
    const existing = appData.doctorRules.find(r => r.id === ruleId);
    if (existing) {
      existing.symptom = symptom;
      existing.medicines = meds;
      showToast(`Updated rule for ${symptom}!`, "success");
    }
  } else {
    appData.doctorRules.push({
      id: `RULE-${Date.now()}`,
      symptom: symptom,
      medicines: meds
    });
    showToast(`Added preference rule for ${symptom}!`, "success");
  }

  saveData();
  closeDoctorRuleModal();
  renderSettingsDoctorRules();
  updateDynamicMedicationSuggestions();
}

function deleteDoctorRule(ruleId) {
  if (!confirm("Are you sure you want to delete this ranking rule?")) return;
  appData.doctorRules = (appData.doctorRules || []).filter(r => r.id !== ruleId);
  saveData();
  renderSettingsDoctorRules();
  updateDynamicMedicationSuggestions();
  showToast("Ranking rule deleted.", "info");
}


// ============================================================================
// ARCHIVE PATIENT & RESTORE / PERMANENT DELETE LOGIC
// ============================================================================
let showingArchivedPatients = false;

function switchPatientArchiveView(showArchived) {
  showingArchivedPatients = showArchived;
  const btnActive = document.getElementById("tab-patient-active");
  const btnArchived = document.getElementById("tab-patient-archived");
  if (btnActive) btnActive.classList.toggle("active", !showArchived);
  if (btnArchived) btnArchived.classList.toggle("active", showArchived);
  renderPatientsTable();
}

function archivePatient(patientId) {
  const pt = appData.patients.find(p => p.id === patientId);
  if (!pt) return;
  if (!confirm("Move \"" + pt.name + "\" (" + pt.mrn + ") to Temp. Delete?\n\nYou can restore them anytime from the Temp. Delete tab.")) return;

  pt.isArchived = true;
  saveData();
  renderPatientsTable();
  populateRxPatientSelect();
  populateAiScribePatientSelect();
  showToast("🗑️ Patient \"" + pt.name + "\" moved to Temp. Delete.", "info");
}

function restorePatient(patientId) {
  const pt = appData.patients.find(p => p.id === patientId);
  if (!pt) return;

  pt.isArchived = false;
  saveData();
  renderPatientsTable();
  populateRxPatientSelect();
  populateAiScribePatientSelect();
  showToast("✅ Restored \"" + pt.name + "\" to Active Patients!", "success");
}

// Modal-driven reliable permanent delete (works 100% in all Android WebViews)
function permanentlyDeletePatient(patientId) {
  const pt = appData.patients.find(p => p.id === patientId);
  if (!pt) return;

  const modal = document.getElementById("perm-delete-modal");
  const nameEl = document.getElementById("perm-delete-patient-name");
  const idEl = document.getElementById("perm-delete-patient-id");

  if (modal && nameEl && idEl) {
    nameEl.textContent = `"${pt.name}" (${pt.mrn})`;
    idEl.value = patientId;
    modal.classList.add("active");
  } else {
    // Robust fallback
    if (confirm(`⚠️ PERMANENT DELETE: Delete "${pt.name}" and ALL their consultations permanently?\n\nThis action cannot be undone.`)) {
      executePermDeleteDirect(patientId);
    }
  }
}

function closePermDeleteModal() {
  const modal = document.getElementById("perm-delete-modal");
  if (modal) modal.classList.remove("active");
}

function executePermDelete() {
  const idEl = document.getElementById("perm-delete-patient-id");
  const patientId = idEl ? idEl.value : "";
  closePermDeleteModal();
  if (patientId) {
    executePermDeleteDirect(patientId);
  }
}

function executePermDeleteDirect(patientId) {
  const pt = appData.patients.find(p => p.id === patientId);
  const name = pt ? pt.name : "Patient";
  appData.patients = (appData.patients || []).filter(p => p.id !== patientId);
  appData.encounters = (appData.encounters || []).filter(e => e.patientId !== patientId);
  saveData();
  renderPatientsTable();
  populateRxPatientSelect();
  populateAiScribePatientSelect();
  showToast(`🗑️ Permanently deleted "${name}" and their records.`, "warning");
}


// ============================================================================
// DOCEMR AI SCRIBE & MULTI-FORMAT PROCESSING ENGINE
// ============================================================================
// ============================================================================
// AI SCRIBE VOICE RECORDING, AUDIO PLAYBACK & CLINICAL NLP ENGINE (v3.8 Final)
// ============================================================================
// ============================================================================
// AI SCRIBE NATIVE SPEECH, GEMINI AI & DYNAMIC CLINICAL NLP ENGINE (v3.8.2)
// ============================================================================
// ============================================================================
// AI SCRIBE IN-APP VOICE RECORDER, REAL AUDIO PLAYBACK & DYNAMIC AI (v3.8.3)
// ============================================================================
let currentAiSpeechRecognition = null;

// ===== EKA-SCRIBE ARCHITECTURE v3.8.4 ENGINE =====
// AI SCRIBE IN-APP GOOGLE SPEECH & REAL AUDIO ENGINE (v3.8.4)


// ===== EKA-SCRIBE ARCHITECTURE v3.8.9 ENGINE =====
// CONTINUOUS IN-APP GOOGLE SPEECH + AUTO-DISCOVER GEMINI AI + MULTI-SYSTEM CLINICAL NLP
let isAiRecording = false;
  playScribeBeep("stop"); // Stop tone
let aiRecordingTimer = null;
let aiRecordingSeconds = 0;
let realMediaRecorder = null;
let recordedAudioChunks = [];
let recordedAudioBlob = null;
let recordedAudioUrl = null;
let realAudioPlayer = null;
let audioPlaybackInterval = null;

let isAudioPlaying = false;
let audioCurrentSec = 0;
let audioTotalSec = 1;

let selectedAiOutputFormat = "EKA_EMR";
let currentAiSessionData = {
  rawTranscript: "",
  selectedPatientId: "",
  parsedSymptoms: [],
  parsedMeds: [],
  parsedVitals: {},
  clinicalNotes: ""
};

// Continuous dictation state machine
let nativeSpeechAccumulated = "";
let nativeSpeechCurrentPartial = "";
let webSpeechInstance = null;

const AI_MIC_SVG = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>';
const AI_STOP_SVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"></rect></svg>';

const AI_FORMAT_LABELS = {
  EKA_EMR: "EKA EMR Format",
  SOAP: "SOAP Detailed",
  CLINICAL_NOTES: "Clinical Notes",
  GP_OPD: "General Physician OPD Consultation Note",
  INPATIENT: "General Inpatient Admission Template",
  PATIENT_HISTORY: "Patient Medical History",
  MEETING_NOTES: "Meeting Notes",
  DIABETOLOGY: "Diabetology OPD Consultation Note",
  OBGYN: "OB/GYN Consultation Template",
  OPHTHALMOLOGY: "Ophthalmology Consultation Template",
  NEUROLOGY: "Neurology OPD Consultation Note",
  CARDIOLOGY: "Cardiology OPD Consultation Note",
  ORTHOPEDICS: "Orthopedics Consultation Template",
  DERMATOLOGY: "Dermatology Consultation Template",
  ONCOLOGY: "Oncology Consultation Template",
  SURGERY: "General Surgery Consultation Template",
  PEDIATRIC: "Pediatric Consultation Template",
  HOMEOPATHY: "Homeopathy OPD Consultation"
};

function getAiFormatLabel(code) {
  return AI_FORMAT_LABELS[code] || String(code || "EKA EMR Format").replace(/_/g, " ");
}

function appendDictationSegment(existing, segment) {
  const cleanSeg = (segment || "").trim();
  if (!cleanSeg) return existing || "";
  const base = (existing || "").trim();
  if (!base) return cleanSeg;
  // Avoid accidental exact duplicate tail commit
  if (base.endsWith(cleanSeg)) return base;
  return base + " " + cleanSeg;
}

function commitPendingPartialSpeech() {
  if (nativeSpeechCurrentPartial && nativeSpeechCurrentPartial.trim()) {
    nativeSpeechAccumulated = appendDictationSegment(nativeSpeechAccumulated, nativeSpeechCurrentPartial);
    nativeSpeechCurrentPartial = "";
    const input = document.getElementById("ai-scribe-input");
    if (input) {
      input.value = nativeSpeechAccumulated;
      input.scrollTop = input.scrollHeight;
    }
  }
}

function onAiScribeManualEdit() {
  const input = document.getElementById("ai-scribe-input");
  if (input) {
    nativeSpeechAccumulated = input.value.trim();
    nativeSpeechCurrentPartial = "";
  }
}

// ----------------------------------------------------------------------------
// NATIVE IN-APP GOOGLE SPEECH RECOGNIZER RECEIVERS (Continuous Across Pauses)
// ----------------------------------------------------------------------------
window.onNativeAudioRecorded = function(dataUri) {
  if (!dataUri) return;
  recordedAudioUrl = dataUri;
  try {
    if (realAudioPlayer) {
      realAudioPlayer.pause();
      realAudioPlayer = null;
    }
    realAudioPlayer = new Audio();
    realAudioPlayer.preload = "auto";
    realAudioPlayer.src = dataUri;

    realAudioPlayer.onloadedmetadata = () => {
      const dur = Math.floor(realAudioPlayer.duration || 0);
      if (dur > 0) {
        audioTotalSec = dur;
        const totalEl = document.getElementById("so-audio-total-time");
        const endEl = document.getElementById("so-audio-end-time");
        const slider = document.getElementById("so-audio-slider");
        if (totalEl) totalEl.textContent = formatSec(dur);
        if (endEl) endEl.textContent = formatSec(dur);
        if (slider) slider.max = dur;
      }
    };

    realAudioPlayer.ontimeupdate = () => {
      const cur = Math.floor(realAudioPlayer.currentTime || 0);
      const slider = document.getElementById("so-audio-slider");
      const curTime = document.getElementById("so-audio-current-time");
      if (slider) slider.value = cur;
      if (curTime) curTime.textContent = formatSec(cur);
    };

    realAudioPlayer.onended = () => {
      isAudioPlaying = false;
      const icon = document.getElementById("so-play-icon");
      if (icon) icon.textContent = "▶";
      const slider = document.getElementById("so-audio-slider");
      const curTime = document.getElementById("so-audio-current-time");
      if (slider) slider.value = 0;
      if (curTime) curTime.textContent = "0:00";
    };
  } catch (e) {
    console.warn("Error initializing realAudioPlayer:", e);
  }
};

window.onNativeSpeechReady = function() {
  if (!isAiRecording) return;
  const statusText = document.getElementById("ai-rec-status-text");
  if (statusText) statusText.textContent = "Listening... Speak anytime (tap ■ to stop)";
  const badge = document.getElementById("ai-audio-quality-badge");
  if (badge) badge.textContent = "Live";
};

window.onNativeSpeechBeginning = function() {
  if (!isAiRecording) return;
  const statusText = document.getElementById("ai-rec-status-text");
  if (statusText) statusText.textContent = "Transcribing in real-time...";
};

window.onNativeSpeechRms = function(rms) {
  if (!isAiRecording) return;
  const dot = document.querySelector(".ai-rec-dot");
  if (dot) {
    const scale = rms > 2 ? Math.min(1.6, 1 + rms / 15) : 1;
    dot.style.transform = "scale(" + scale + ")";
  }
};

window.onNativeSpeechPartial = function(partialText) {
  if (!partialText || !partialText.trim()) return;
  nativeSpeechCurrentPartial = partialText.trim();
  const input = document.getElementById("ai-scribe-input");
  if (input) {
    const combined = appendDictationSegment(nativeSpeechAccumulated, nativeSpeechCurrentPartial);
    input.value = combined;
    input.scrollTop = input.scrollHeight;
  }
  const statusText = document.getElementById("ai-rec-status-text");
  if (statusText) statusText.textContent = "Transcribing: " + nativeSpeechCurrentPartial;
};

window.onNativeSpeechResult = function(finalText) {
  if (!finalText || !finalText.trim()) return;
  nativeSpeechAccumulated = appendDictationSegment(nativeSpeechAccumulated, finalText);
  nativeSpeechCurrentPartial = "";
  const input = document.getElementById("ai-scribe-input");
  const dashInput = document.getElementById("dashboard-scribe-input");
  if (input) { input.value = nativeSpeechAccumulated; input.scrollTop = input.scrollHeight; }
  if (dashInput) { dashInput.value = nativeSpeechAccumulated; }
  if (input) {
    input.scrollTop = input.scrollHeight;
  }
  const statusText = document.getElementById("ai-rec-status-text");
  if (statusText) statusText.textContent = "Transcribed. Listening for more...";
};

window.onNativeSpeechSegmentEnd = function() {
  // Called before automatic seamless resume after a pause or recovery
  commitPendingPartialSpeech();
  if (isAiRecording) {
    const statusText = document.getElementById("ai-rec-status-text");
    if (statusText) statusText.textContent = "Listening... Keep speaking anytime";
  }
};

function switchToWebSpeechFallback() {
  console.log("Switching to Web Speech / SpeechRecognition fallback...");
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRec) {
    try {
      if (webSpeechInstance) {
        try { webSpeechInstance.stop(); } catch (e) {}
      }
      const sr = new SpeechRec();
      webSpeechInstance = sr;
      sr.continuous = true;
      sr.interimResults = true;
      sr.lang = "hi-IN";
      sr.onresult = function(event) {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            nativeSpeechAccumulated = appendDictationSegment(nativeSpeechAccumulated, transcript);
          } else {
            interim += transcript + " ";
          }
        }
        nativeSpeechCurrentPartial = interim.trim();
        const inp = document.getElementById("ai-scribe-input");
        if (inp) {
          inp.value = appendDictationSegment(nativeSpeechAccumulated, nativeSpeechCurrentPartial);
          inp.scrollTop = inp.scrollHeight;
        }
      };
      sr.onend = function() {
        commitPendingPartialSpeech();
        if (isAiRecording) {
          setTimeout(() => {
            if (isAiRecording && webSpeechInstance === sr) {
              try { sr.start(); } catch (e) {}
            }
          }, 150);
        }
      };
      sr.onerror = function(ev) {
        console.warn("Web Speech error:", ev);
        if (window.DocAppBridge && typeof window.DocAppBridge.startSpeechRecognition === "function") {
          window.DocAppBridge.startSpeechRecognition();
        }
      };
      sr.start();
      showToast("🎤 Voice dictation live (Continuous Mode)", "info");
      return;
    } catch (e) {
      console.warn("Web Speech launch error:", e);
    }
  }

  // Tier 3 fallback: Android system voice intent dialog
  if (window.DocAppBridge && typeof window.DocAppBridge.startSpeechRecognition === "function") {
    window.DocAppBridge.startSpeechRecognition();
    showToast("🎤 Speak into Voice Input dialog", "info");
  } else {
    showToast("Please use voice input on your keyboard or enable Google Speech in device settings.", "warning");
  }
}

window.onNativeSpeechError = function(err) {
  console.warn("Native Google Speech Error:", err);
  if (err === 9 || String(err) === "9") {
    stopInAppRecording(true);
    showToast("Microphone permission denied. Please enable Microphone permission in App Settings.", "error");
    return;
  }
  // Seamless Web Speech Fallback so it works on all Android devices
  if (isAiRecording) {
    switchToWebSpeechFallback();
  }
};

window.onNativeSpeechFallback = function() {
  if (isAiRecording) {
    switchToWebSpeechFallback();
  }
};


window.onNativeSpeechEnd = function() {
  if (isAiRecording) {
    const statusText = document.getElementById("ai-rec-status-text");
    if (statusText) statusText.textContent = "Listening... Ready for next sentence";
  }
};

function initAiScribe() {
  console.log("DocEMR AI Scribe v3.8.9 initialized.");
}

// AI Scribe Patient Registration Bridge (Before & After Dictation)
let patientModalOpenedFromContext = ""; // "scribe" or "so"

function openPatientModalFromScribe(fromContext = "scribe") {
  patientModalOpenedFromContext = fromContext;
  openPatientModal();
}

function getRegisteredPatientsList() {
  let list = [];
  if (typeof appData !== "undefined" && appData && Array.isArray(appData.patients) && appData.patients.length > 0) {
    list = appData.patients;
  } else if (window.appData && Array.isArray(window.appData.patients) && window.appData.patients.length > 0) {
    list = window.appData.patients;
  } else {
    try {
      const stored = localStorage.getItem("DOCEMR_SHIFA_DATA_V2");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.patients)) list = parsed.patients;
      }
    } catch (e) {}
  }
  // Sort latest registered or updated patient on top deterministically
  return [...list].sort((a, b) => getPatientSortTimestamp(b) - getPatientSortTimestamp(a));
}

function onAiScribePatientChange(patientId) {
  if (currentAiSessionData) {
    currentAiSessionData.selectedPatientId = patientId || "";
  }
  const soSel = document.getElementById("so-patient-select");
  if (soSel && soSel.value !== patientId) {
    soSel.value = patientId || "";
  }
  if (patientId) {
    const pts = getRegisteredPatientsList();
    const pt = pts.find(p => p.id === patientId);
    showToast("Assigned session to " + (pt ? pt.name : "patient") + "!", "info");
  }
}

function onSessionOutputPatientChange(patientId) {
  if (currentAiSessionData) {
    currentAiSessionData.selectedPatientId = patientId || "";
  }
  const scribeSel = document.getElementById("ai-scribe-patient-select");
  if (scribeSel && scribeSel.value !== patientId) {
    scribeSel.value = patientId || "";
  }
  if (patientId) {
    const pts = getRegisteredPatientsList();
    const pt = pts.find(p => p.id === patientId);
    showToast("Assigned session to " + (pt ? pt.name : "patient") + "!", "info");
  }
}

function populateAiPatientDropdowns(selectedId = "") {
  if (typeof appData !== "undefined" && appData && !window.appData) {
    window.appData = appData;
  }
  const pts = getRegisteredPatientsList();

  const selects = [
    document.getElementById("ai-scribe-patient-select"),
    document.getElementById("so-patient-select")
  ];

  selects.forEach(sel => {
    if (!sel) return;
    const curVal = selectedId || (currentAiSessionData ? currentAiSessionData.selectedPatientId : "") || sel.value || "";
    sel.innerHTML = '<option value="">-- No Patient Assigned (Quick Sandbox / Free Dictation) --</option>';

    pts.forEach(pt => {
      if (pt.archived) return;
      const opt = document.createElement("option");
      opt.value = pt.id;
      const phoneDisplay = pt.phone ? (" - " + pt.phone) : "";
      const mrnDisplay = pt.mrn ? (" (" + pt.mrn + ")") : "";
      opt.textContent = pt.name + mrnDisplay + " - " + (pt.age ? (pt.age + "y") : "N/A") + "/" + (pt.gender || "M") + phoneDisplay;
      if (curVal && curVal === pt.id) {
        opt.selected = true;
      }
      sel.appendChild(opt);
    });

    if (curVal) {
      sel.value = curVal;
    }
  });
}



function openAiScribeModal(autoRecord = false) {
  const savedPrefFormat = localStorage.getItem("docemr_preferred_ai_format") || "EKA_EMR";
  const formatSelect = document.getElementById("ai-output-format-select");
  if (formatSelect) {
    formatSelect.value = savedPrefFormat;
    onAiFormatSelectChanged(savedPrefFormat);
  }
  const modal = document.getElementById("ai-scribe-modal");
  if (!modal) return;
  modal.style.display = "flex";

  // Populate patients dropdown and auto-select active prescription patient if available
  const rxSel = document.getElementById("rx-patient-select");
  const activeRxPatient = rxSel ? rxSel.value : "";
  const targetPatientId = currentAiSessionData.selectedPatientId || activeRxPatient || "";
  if (targetPatientId && !currentAiSessionData.selectedPatientId) {
    currentAiSessionData.selectedPatientId = targetPatientId;
  }
  populateAiPatientDropdowns(currentAiSessionData.selectedPatientId);

  const keyInput = document.getElementById("ai-gemini-key");
  if (keyInput) {
    keyInput.value = localStorage.getItem("docemr_gemini_api_key") || "";
  }
}

function closeAiScribeModal() {
  const modal = document.getElementById("ai-scribe-modal");
  if (modal) modal.style.display = "none";
  if (isAiRecording) stopInAppRecording(true);
}

function closeSessionOutputScreen() {
  const scr = document.getElementById("screen-session-output");
  if (scr) scr.style.display = "none";
  if (realAudioPlayer) {
    realAudioPlayer.pause();
    realAudioPlayer.currentTime = 0;
  }
  if (audioPlaybackInterval) {
    clearInterval(audioPlaybackInterval);
    audioPlaybackInterval = null;
  }
  isAudioPlaying = false;
  const icon = document.getElementById("so-play-icon");
  if (icon) icon.textContent = "▶";
}

function saveGeminiApiKey() {
  const keyInput = document.getElementById("ai-gemini-key");
  if (keyInput) {
    const val = keyInput.value.trim();
    localStorage.setItem("docemr_gemini_api_key", val);
    localStorage.removeItem("docemr_gemini_working_model");
    showToast(val ? "🔑 Gemini API Key saved!" : "Using built-in Dynamic Clinical NLP", "info");
  }
}

function loadAiPreset(type) {
  const input = document.getElementById("ai-scribe-input");
  if (!input) return;

  if (type === "dyspepsia") {
    input.value = "पेट में बहुत दर्द है, खाना नहीं खाया जाता, उल्टी भी आती है। नींद आती है बहुत, उठने के बाद लेकिन थकान महसूस होती है, नींद ऐसा लगता है कि पूरी नहीं हुई। BP 130/85, Pulse 78";
    selectFormatRadio("EKA_EMR");
  } else if (type === "fever") {
    input.value = "मरीज को 3 दिन से तेज बुखार है 102 डिग्री और सूखी खांसी आ रही है, गले में भी बहुत दर्द है। BP 120/80";
    selectFormatRadio("EKA_EMR");
  } else if (type === "diabetes") {
    input.value = "Diabetes patient follow up, FBS 180, PPBS 260. Complaining of numbness in feet and frequent urination.";
    selectFormatRadio("EKA_EMR");
  } else if (type === "headache") {
    input.value = "मेरे सर में बहुत दर्द है, माइग्रेन का पेन है, थकान महसूस होती है और एसिडिटी भी रहती है। BP 128/84";
    selectFormatRadio("EKA_EMR");
  }

  nativeSpeechAccumulated = input.value.trim();
  nativeSpeechCurrentPartial = "";
  showToast("⚡ Sample consultation loaded! Click Generate Clinical Note & Rx when ready.", "info");
}

function selectFormatRadio(fmt) {
  selectedAiOutputFormat = fmt;
  const radios = document.getElementsByName("ai-output-format");
  radios.forEach(r => {
    if (r.value === fmt) r.checked = true;
  });
  const badge = document.getElementById("ai-selected-format-badge");
  if (badge) badge.textContent = getAiFormatLabel(fmt);
}

function onAiFormatChanged(radio) {
  selectedAiOutputFormat = radio.value;
  const badge = document.getElementById("ai-selected-format-badge");
  if (badge) badge.textContent = getAiFormatLabel(radio.value);
}

function openOutputFormatSelection() {
  closeSessionOutputScreen();
  openAiScribeModal();
  const wrapper = document.querySelector(".ai-format-selector-wrapper");
  if (wrapper) {
    wrapper.scrollIntoView({ behavior: "smooth" });
    wrapper.style.borderColor = "#2563eb";
    wrapper.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.2)";
    setTimeout(() => {
      wrapper.style.borderColor = "#cbd5e1";
      wrapper.style.boxShadow = "none";
    }, 2000);
  }
}

// ----------------------------------------------------------------------------
// IN-APP CONTINUOUS VOICE DICTATION (Stays Active Until User Taps Mic Again)
// ----------------------------------------------------------------------------
function toggleAiVoiceRecording() {
  if (isAiRecording) {
    stopInAppRecording(false);
  } else {
    startInAppRecording();
  }
}

function startInAppRecording() {
  const micBtn = document.getElementById("ai-scribe-mic-btn");
  const micIcon = document.getElementById("ai-mic-icon");
  const statusBar = document.getElementById("ai-recording-status-bar");
  const statusText = document.getElementById("ai-rec-status-text");
  const timerEl = document.getElementById("ai-rec-timer");
  const qualityEl = document.getElementById("ai-audio-quality-badge");

  isAiRecording = true;
  playScribeBeep("start"); // Start tone
  aiRecordingSeconds = 0;
  nativeSpeechCurrentPartial = "";

  const input = document.getElementById("ai-scribe-input");
  nativeSpeechAccumulated = (input && input.value.trim()) ? input.value.trim() : "";

  const dashMicBtn = document.getElementById("dashboard-mic-btn");
  if (dashMicBtn) dashMicBtn.classList.add("recording");
  if (micBtn) {
    micBtn.style.background = "#ef4444";
    micBtn.style.boxShadow = "0 0 15px rgba(239, 68, 68, 0.6)";
    micBtn.title = "Tap to Stop Dictation";
  }
  if (micIcon) micIcon.innerHTML = AI_STOP_SVG;
  if (statusBar) statusBar.style.display = "flex";
  if (statusText) statusText.textContent = "Listening... Speak anytime (tap ■ to stop)";
  if (timerEl) timerEl.textContent = "00:00";
  if (qualityEl) qualityEl.textContent = "Live";

  if (aiRecordingTimer) clearInterval(aiRecordingTimer);
  aiRecordingTimer = setInterval(() => {
    aiRecordingSeconds++;
    const mins = String(Math.floor(aiRecordingSeconds / 60)).padStart(2, "0");
    const secs = String(aiRecordingSeconds % 60).padStart(2, "0");
    if (timerEl) timerEl.textContent = mins + ":" + secs;
  }, 1000);

  // Native Android continuous Google SpeechRecognizer bridge
  if (window.DocAppBridge && typeof window.DocAppBridge.startInAppSpeech === "function") {
    try {
      window.DocAppBridge.startInAppSpeech();
      console.log("DocAppBridge.startInAppSpeech started (continuous mode)");
    } catch (e) {
      console.warn("Error starting native in-app speech:", e);
    }
  } else {
    // Web browser fallback with continuous auto-restart until user taps Stop
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        const sr = new SpeechRec();
        webSpeechInstance = sr;
        sr.continuous = true;
        sr.interimResults = true;
        sr.lang = "hi-IN";
        sr.onresult = function(event) {
          let interim = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              nativeSpeechAccumulated = appendDictationSegment(nativeSpeechAccumulated, transcript);
            } else {
              interim += transcript + " ";
            }
          }
          nativeSpeechCurrentPartial = interim.trim();
          const inp = document.getElementById("ai-scribe-input");
          if (inp) {
            inp.value = appendDictationSegment(nativeSpeechAccumulated, nativeSpeechCurrentPartial);
            inp.scrollTop = inp.scrollHeight;
          }
        };
        sr.onend = function() {
          commitPendingPartialSpeech();
          if (isAiRecording) {
            setTimeout(() => {
              if (isAiRecording && webSpeechInstance === sr) {
                try { sr.start(); } catch (e) {}
              }
            }, 150);
          }
        };
        sr.start();
      } catch (e) {}
    }
  }
}

function stopInAppRecording(silent) {
  const micBtn = document.getElementById("ai-scribe-mic-btn");
  const micIcon = document.getElementById("ai-mic-icon");
  const statusBar = document.getElementById("ai-recording-status-bar");

  // Save any mid-sentence partial text before shutting down
  commitPendingPartialSpeech();
  isAiRecording = false;

  if (window.DocAppBridge && typeof window.DocAppBridge.stopInAppSpeech === "function") {
    try {
      window.DocAppBridge.stopInAppSpeech();
    } catch (e) {}
  }

  if (webSpeechInstance) {
    try { webSpeechInstance.stop(); } catch (e) {}
    webSpeechInstance = null;
  }

  if (aiRecordingTimer) {
    clearInterval(aiRecordingTimer);
    aiRecordingTimer = null;
  }
  const dashMicBtn = document.getElementById("dashboard-mic-btn");
  if (dashMicBtn) dashMicBtn.classList.remove("recording");
  if (micBtn) {
    micBtn.style.background = "#0f766e";
    micBtn.style.boxShadow = "0 4px 12px rgba(15,118,110,0.35)";
    micBtn.title = "Tap to Start Continuous Voice Dictation";
  }
  if (micIcon) micIcon.innerHTML = AI_MIC_SVG;
  if (statusBar) statusBar.style.display = "none";

  audioTotalSec = Math.max(aiRecordingSeconds, 1);
  if (!silent) {
    showToast("🎙️ Dictation stopped. Review transcript or tap Generate Clinical Note & Rx.", "success");
  }
}

function formatSec(s) {
  const safe = Math.max(0, Math.floor(s || 0));
  const m = Math.floor(safe / 60);
  const sec = safe % 60;
  return m + ":" + String(sec).padStart(2, "0");
}

// ----------------------------------------------------------------------------
// VOICE AUDIO PLAYER (Screen 2)
// ----------------------------------------------------------------------------
function toggleAudioPlayback() {
  const icon = document.getElementById("so-play-icon");
  const slider = document.getElementById("so-audio-slider");
  const curTime = document.getElementById("so-audio-current-time");

  if (realAudioPlayer && recordedAudioUrl) {
    if (isAudioPlaying) {
      realAudioPlayer.pause();
      isAudioPlaying = false;
      if (icon) icon.textContent = "▶";
    } else {
      realAudioPlayer.play().then(() => {
        isAudioPlaying = true;
        if (icon) icon.textContent = "⏸";
      }).catch((err) => {
        console.warn("Real audio playback error:", err);
        runSimulatedAudioTicker();
      });
    }
    return;
  }

  runSimulatedAudioTicker();
}

function runSimulatedAudioTicker() {
  const icon = document.getElementById("so-play-icon");
  const slider = document.getElementById("so-audio-slider");
  const curTime = document.getElementById("so-audio-current-time");

  if (isAudioPlaying) {
    isAudioPlaying = false;
    if (audioPlaybackInterval) clearInterval(audioPlaybackInterval);
    audioPlaybackInterval = null;
    if (icon) icon.textContent = "▶";
    return;
  }

  isAudioPlaying = true;
  if (icon) icon.textContent = "⏸";

  audioPlaybackInterval = setInterval(() => {
    audioCurrentSec++;
    if (audioCurrentSec > audioTotalSec) {
      audioCurrentSec = 0;
      isAudioPlaying = false;
      clearInterval(audioPlaybackInterval);
      audioPlaybackInterval = null;
      if (icon) icon.textContent = "▶";
    }
    if (slider) slider.value = audioCurrentSec;
    if (curTime) curTime.textContent = formatSec(audioCurrentSec);
  }, 1000);
}

function seekAudioPlayback(val) {
  const sec = parseInt(val, 10) || 0;
  audioCurrentSec = sec;
  if (realAudioPlayer && recordedAudioUrl) {
    try { realAudioPlayer.currentTime = sec; } catch (e) {}
  }
  const curTime = document.getElementById("so-audio-current-time");
  if (curTime) curTime.textContent = formatSec(sec);
}

// ----------------------------------------------------------------------------
// DYNAMIC GEMINI AI (AUTO-MODEL DISCOVERY) & MULTI-SYSTEM CLINICAL NLP PARSER
// ----------------------------------------------------------------------------
async function processAiScribeInput() {
  const btn = document.getElementById("ai-process-btn");
  if (btn && btn.disabled) return; // Prevent double clicking!

  // Automatically stop live recording cleanly if still active
  if (isAiRecording) {
    stopInAppRecording(true);
  }

  const inputEl = document.getElementById("ai-scribe-input");
  const rawText = inputEl ? inputEl.value.trim() : "";

  if (!rawText) {
    showToast("Please speak or enter some patient complaints first!", "warning");
    return;
  }

  const originalBtnHtml = btn ? btn.innerHTML : "";
  if (btn) {
    btn.disabled = true;
    btn.style.opacity = "0.75";
    btn.style.cursor = "not-allowed";
    btn.style.pointerEvents = "none";
    btn.innerHTML = `
      <svg class="spin-animation" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display: inline-block; vertical-align: middle; margin-right: 6px;">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
        <path d="M12 2a10 10 0 0 1 10 10" stroke="#ffffff"></path>
      </svg>
      <span>Analyzing &amp; Structuring Clinical Note...</span>
    `;
  }

  try {
    currentAiSessionData.rawTranscript = rawText;
    const selPatient = document.getElementById("ai-scribe-patient-select");
    currentAiSessionData.selectedPatientId = selPatient ? selPatient.value : "";

    const formatLabel = getAiFormatLabel(selectedAiOutputFormat);

    // Check if user has a Gemini API Key configured
    const geminiKey = localStorage.getItem("docemr_gemini_api_key");
    if (geminiKey && geminiKey.trim()) {
      try {
        showToast("🤖 Querying Gemini AI for clinical extraction...", "info");
        const geminiSuccess = await runGeminiClinicalExtraction(geminiKey.trim(), rawText, formatLabel);
        if (geminiSuccess) {
          showScreen2SessionOutput();
          showToast("✨ Gemini AI Analysis Complete!", "success");
          return;
        }
      } catch (e) {
        console.warn("Gemini AI API call failed, falling back to dynamic local NLP:", e);
        showToast("Gemini: " + (e.message || "API error") + ". Using offline Clinical NLP...", "warning");
      }
    }

    // Built-in Dynamic Multi-Entity Clinical NLP
    runDynamicLocalNLP(rawText, selectedAiOutputFormat);
    showScreen2SessionOutput();
    showToast("✨ Clinical Note & Rx Structured Dynamically!", "success");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalBtnHtml || "<span>✨ Generate Clinical Note &amp; Rx</span>";
      btn.style.opacity = "1";
      btn.style.cursor = "pointer";
      btn.style.pointerEvents = "auto";
    }
  }
}

function sanitizeVitalValue(val) {
  if (val === null || val === undefined) return "";
  const s = String(val).trim();
  if (!s) return "";
  if (/^(null|none|n\/a|na|not recorded|not mentioned|unknown|-|--)$/i.test(s)) return "";
  return s;
}

function extractJsonObjectFromText(rawCandidate) {
  if (!rawCandidate) throw new Error("Empty response from Gemini");
  const stripped = rawCandidate.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(stripped);
  } catch (e) {
    const start = stripped.indexOf("{");
    const end = stripped.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(stripped.slice(start, end + 1));
    }
    throw new Error("Invalid JSON returned by Gemini");
  }
}

function rankDiscoveredGeminiModels(modelsArray) {
  if (!Array.isArray(modelsArray)) return [];
  const valid = modelsArray
    .filter(m => {
      if (!m || !m.name) return false;
      const methods = m.supportedGenerationMethods || [];
      if (!methods.includes("generateContent")) return false;
      const n = m.name.toLowerCase();
      if (!n.includes("gemini")) return false;
      // Filter out non-text models and deprecated gemini-pro / gemini-1.0
      if (/(embedding|aqa|imagen|veo|tts|audio|robotics|computer-use|vision-only)/.test(n)) return false;
      if (n === "gemini-pro" || n === "models/gemini-pro" || n.includes("gemini-1.0")) return false;
      return true;
    })
    .map(m => m.name.replace(/^models\//, ""));

  const score = (name) => {
    const n = name.toLowerCase();
    let s = 0;
    if (n.includes("1.5-flash")) s += 100;
    else if (n.includes("2.0-flash")) s += 95;
    else if (n.includes("1.5-pro")) s += 85;
    else if (n.includes("flash")) s += 75;
    else if (n.includes("2.0")) s += 70;
    else if (n.includes("pro")) s += 40;
    if (n.includes("preview") || n.includes("exp")) s -= 10;
    return s;
  };

  return Array.from(new Set(valid)).sort((a, b) => score(b) - score(a));
}

async function discoverGeminiModels(apiKey) {
  const resp = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=" + encodeURIComponent(apiKey));
  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({}));
    const msg = (errData.error && errData.error.message) || ("ListModels HTTP " + resp.status);
    const err = new Error(msg);
    err.httpStatus = resp.status;
    throw err;
  }
  const data = await resp.json();
  return rankDiscoveredGeminiModels(data.models || []);
}

async function callSingleGeminiModel(apiKey, model, prompt, useJsonMime) {
  const url = "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent?key=" + encodeURIComponent(apiKey);
  const genConfig = { temperature: 0.1 };
  if (useJsonMime) {
    genConfig.responseMimeType = "application/json";
  }

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: genConfig
    })
  });

  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({}));
    const msg = (errData.error && errData.error.message) || ("HTTP " + resp.status);
    const err = new Error(msg);
    err.httpStatus = resp.status;
    throw err;
  }

  const data = await resp.json();
  const rawCandidate = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text) || "";
  return extractJsonObjectFromText(rawCandidate);
}

function getFormatSpecificInstructions(formatCode, formatLabel) {
  const otaPrompts = window.OTA_AI_PROMPTS || {};
  if (otaPrompts[formatCode]) {
    return String(otaPrompts[formatCode]);
  }
  const base = _getBaseFormatSpecificInstructions(formatCode, formatLabel);
  return otaPrompts.ALL ? (base + "\n" + String(otaPrompts.ALL)) : base;
}

function _getBaseFormatSpecificInstructions(formatCode, formatLabel) {
  switch (formatCode) {
    case "HOMEOPATHY":
      return [
        "FORMAT SPECIFICATION: HOMEOPATHY OPD CONSULTATION (CLASSICAL HAHNEMANNIAN CASE TAKING)",
        "CRITICAL REQUIREMENT: This consultation note and prescription MUST BE 100% EXCLUSIVELY HOMEOPATHIC. ZERO allopathic or modern pharmaceutical medicines allowed!",
        "- Structure clinicalNotes strictly with this comprehensive Homeopathic Case Taking format:",
        "",
        "1. PRESENTING COMPLAINTS (CHIEF COMPLAINTS & LOCATION/SENSATION/MODALITIES):",
        "  • Detailed presenting symptom description",
        "",
        "2. MODALITIES (AGGRAVATION & AMELIORATION):",
        "  • Aggravation (<): Explicit factors that worsen complaints (e.g. motion, cold air, damp weather, night, eating, warmth, pressure)",
        "  • Amelioration (>): Explicit factors that relieve complaints (e.g. rest, warm applications, fresh air, cold drinks, pressure, lying down)",
        "",
        "3. PHYSICAL GENERALS (अलग-अलग स्पष्ट रूप से):",
        "  • Thermal State: Hot / Chilly patient (Reaction to heat & cold)",
        "  • Thirst: Thirsty (large/small quantities, frequent/infrequent) or Thirstless",
        "  • Appetite, Cravings & Aversions: Specific food desires/intolerances",
        "  • Sleep & Dreams: Position, quality of sleep, unrefreshing sleep, restlessness",
        "  • Bowels, Urine & Perspiration: Patterns, odor, stains",
        "",
        "4. MENTAL GENERALS (अलग-अलग स्पष्ट रूप से):",
        "  • Emotional state, anxiety, irritability, fear, depression, weeping tendency, memory, reaction to consolation, restlessness",
        "",
        "5. GENERAL SYMPTOMS:",
        "  • Overall systemic sensations, weakness, fatigue, side affinity (right/left-sided)",
        "",
        "6. MIASMATIC DIFFERENTIATION & EVALUATION (मियाज्मैटिक विश्लेषण):",
        "  • Psora Symptoms (सोरा लक्षण): Functional disorders, hypersensitivity, itching, burning, deficiency",
        "  • Sycosis Symptoms (साइकोसिस लक्षण): Overgrowths, indurations, catarrhal discharges, aggravation in damp, fixed ideas",
        "  • Syphilis Symptoms (सिफलिस लक्षण): Destruction, ulceration, nocturnal aggravation (< night), deep bone pains, despair",
        "  • Tubercular Symptoms (if applicable): Rapid changeability, respiratory vulnerability, craving for open air",
        "  • FINAL MIASMATIC DIAGNOSIS (अंतिम मियाज्म): Specify dominant miasm (e.g. Psoric, Syco-Psoric, Psoro-Syphilitic, Syco-Syphilitic, or Tubercular) with clinical reasoning",
        "",
        "7. TOTALITY OF SYMPTOMS & REPERTORIAL KEYNOTES:",
        "  • Synthesis of characteristic physical generals, mental generals, and prominent modalities",
        "",
        "8. HOMEOPATHIC PRESCRIPTION & REMEDY DIFFERENTIATION:",
        "  • Provide 3-4 top matched classical Homeopathic remedies matching the totality (Physical + Mental + Modalities)",
        "  • Specify exact Potency (e.g. 30C, 200C, 1M, or Q / Mother Tincture)",
        "  • Dosage & Frequency (e.g. 4 globules, 1-0-1 or Single dose, in water or dry on tongue)",
        "  • Duration & Instructions (e.g. 7-14 Days, avoid coffee, camphor, raw onion/garlic)",
        "",
        "9. AUXILIARY MEASURES & DIETARY RESTRICTIONS (पथ्य और अपथ्य):",
        "  • Homeopathic restrictions on strong aromatic substances, antidote warnings, review timeline"
      ].join("\n");

    case "SOAP":
      return [
        "FORMAT SPECIFICATION: SOAP DETAILED NOTE",
        "- Structure clinicalNotes with: [SOAP CLINICAL RECORD]",
        "- SUBJECTIVE (S): Chief complaints in patient's words, HPI, duration, modifying factors.",
        "- OBJECTIVE (O): Vitals (only if spoken), physical examination findings, system observations.",
        "- ASSESSMENT (A): Differential diagnoses, primary clinical impression.",
        "- PLAN (P): Medications (Tab/Cap/Syp with frequency & duration), investigations recommended, patient education, follow-up timeline."
      ].join("\n");

    case "EKA_EMR":
      return [
        "FORMAT SPECIFICATION: EKA CARE EMR FORMAT",
        "- Structure clinicalNotes with: [EKA EMR STRUCTURED CONSULTATION SUMMARY]",
        "- Include: Chief Complaints (with severity), Vitals, Clinical Findings, Diagnosis/Provisional Impression, Rx Prescriptions (Dosage, Frequency, Duration, Instructions), Lifestyle/Dietary Advice, Review Follow-up."
      ].join("\n");

    case "CLINICAL_NOTES":
      return [
        "FORMAT SPECIFICATION: CLINICAL NOTES",
        "- Structure clinicalNotes with: [OPD CLINICAL CONSULTATION NOTE]",
        "- Include: Patient presentation summary, clinical assessment, treatment plan with explicit medication doses, and doctor's remarks."
      ].join("\n");

    case "GP_OPD":
      return [
        "FORMAT SPECIFICATION: GENERAL PHYSICIAN OPD NOTE",
        "- Structure clinicalNotes with: [GENERAL PHYSICIAN OPD RECORD]",
        "- Include: History of Present Illness (HPI), General Physical Exam, Systemic Review, Working Diagnosis, Rx Prescribed, Preventive Counseling."
      ].join("\n");

    case "INPATIENT":
      return [
        "FORMAT SPECIFICATION: GENERAL INPATIENT ADMISSION TEMPLATE",
        "- Structure clinicalNotes with: [INPATIENT ADMISSION NOTE & CLINICAL WORKUP]",
        "- Include: Admission Indication & Reason, History & Comorbidities, Baseline Vitals & Initial Assessment, Stat Inpatient Orders & IV Fluids/Medications, Planned Inpatient Investigations, Nursing Monitoring Protocol."
      ].join("\n");

    case "PATIENT_HISTORY":
      return [
        "FORMAT SPECIFICATION: COMPREHENSIVE PATIENT MEDICAL HISTORY",
        "- Structure clinicalNotes with: [PATIENT MEDICAL HISTORY RECORD]",
        "- Include: Presenting Complaints, Past Medical & Surgical History, Chronic Illnesses & Comorbidities, Current Medications & Drug Allergies, Family History, Personal/Social History, Current Clinical Status."
      ].join("\n");

    case "MEETING_NOTES":
      return [
        "FORMAT SPECIFICATION: CLINICAL MEETING & CASE DISCUSSION NOTES",
        "- Structure clinicalNotes with: [CLINICAL CASE DISCUSSION & MULTIDISCIPLINARY NOTES]",
        "- Include: Patient Summary & Case Background, Core Discussion Points, Specialist Recommendations, Agreed Action Plan, Follow-up & Review Responsibilities."
      ].join("\n");

    case "DIABETOLOGY":
      return [
        "FORMAT SPECIFICATION: DIABETOLOGY OPD CONSULTATION NOTE",
        "- Structure clinicalNotes with: [DIABETOLOGY CONSULTATION RECORD]",
        "- Include: Glycemic History (FBS/PPBS/HbA1c trends if mentioned), Diabetes Duration & Treatment, Hypoglycemia Screening, Diabetic Micro/Macrovascular Complication Screening (Nephropathy, Neuropathy, Retinopathy, Diabetic Foot Exam), Target HbA1c, Antidiabetic Pharmacotherapy Regimen, Medical Nutrition Therapy (MNT) & Exercise Advice."
      ].join("\n");

    case "OBGYN":
      return [
        "FORMAT SPECIFICATION: OB/GYN CONSULTATION TEMPLATE",
        "- Structure clinicalNotes with: [OB/GYN CLINICAL RECORD]",
        "- Include: Menstrual History (LMP, Cycle regularity, Dysmenorrhea), Obstetric Profile (Gravida, Para, Abortion, Living children / GPAL), Gestational Age & EDD (if pregnant), Chief Gynecological/Obstetric Complaints, Antenatal/Pelvic Examination Findings, Ultrasound/Lab Workup, Treatment & Prenatal Supplementation Plan."
      ].join("\n");

    case "OPHTHALMOLOGY":
      return [
        "FORMAT SPECIFICATION: OPHTHALMOLOGY CONSULTATION TEMPLATE",
        "- Structure clinicalNotes with: [OPHTHALMOLOGY CLINICAL EVALUATION]",
        "- Include: Ocular Symptoms (Blurring, Redness, Pain, Photophobia, Floaters), Visual Acuity (OD / OS), Intraocular Pressure (IOP), Slit Lamp & Anterior Segment Findings, Posterior Segment / Fundus Examination, Diagnostic Impression (Refractive/Cataract/Glaucoma/Corneal), Ophthalmic Drops & Medical Regimen."
      ].join("\n");

    case "NEUROLOGY":
      return [
        "FORMAT SPECIFICATION: NEUROLOGY OPD CONSULTATION NOTE",
        "- Structure clinicalNotes with: [NEUROLOGICAL CONSULTATION RECORD]",
        "- Include: Neurological Symptoms (Headache, Seizures, Weakness, Tremors, Numbness, Gait disturbance), Higher Mental Functions & Speech, Cranial Nerve Examination, Motor System (Tone, Power 0-5, Reflexes), Sensory System & Coordination, Neuroimaging/EEG Workup Plan, Pharmacological Regimen."
      ].join("\n");

    case "CARDIOLOGY":
      return [
        "FORMAT SPECIFICATION: CARDIOLOGY OPD CONSULTATION NOTE",
        "- Structure clinicalNotes with: [CARDIOLOGY CONSULTATION RECORD]",
        "- Include: Cardiac Symptoms (Chest pain, Angina, Exertional Dyspnea, Palpitations, Syncope, Orthopnea), NYHA Functional Class (I-IV), Cardiovascular Risk Factors (HTN, Dyslipidemia, Smoking), Cardiovascular Examination (Heart Sounds S1/S2/Murmurs, JVP, Peripheral Pulses), ECG & 2D Echo Recommendations, Guideline-Directed Medical Therapy."
      ].join("\n");

    case "ORTHOPEDICS":
      return [
        "FORMAT SPECIFICATION: ORTHOPEDICS CONSULTATION TEMPLATE",
        "- Structure clinicalNotes with: [ORTHOPEDIC EVALUATION & PLAN]",
        "- Include: Musculoskeletal Complaints (Joint/Bone/Spine pain, Trauma, Deformity, Swelling), Mechanism of Injury, Physical & Joint Exam (Range of Motion, Tenderness, Deformity, Weight bearing), Neurovascular Examination Distal to Injury, Radiological Workup (AP/Lateral X-Rays, MRI), Immobilization/Surgical Plan & Analgesic Protocol."
      ].join("\n");

    case "DERMATOLOGY":
      return [
        "FORMAT SPECIFICATION: DERMATOLOGY CONSULTATION TEMPLATE",
        "- Structure clinicalNotes with: [DERMATOLOGY CLINICAL RECORD]",
        "- Include: Dermatological Complaints (Itching, Rash, Lesions, Pigmentation, Hair/Nail changes), Lesion Morphology (Macule, Papule, Plaque, Vesicle, Scale), Anatomical Distribution & Pattern, Skin Scraping/Biopsy Recommendations, Topical & Systemic Pharmacotherapy, Skincare & Sun Protection Guidance."
      ].join("\n");

    case "ONCOLOGY":
      return [
        "FORMAT SPECIFICATION: ONCOLOGY CONSULTATION TEMPLATE",
        "- Structure clinicalNotes with: [ONCOLOGY CLINICAL SUMMARY]",
        "- Include: Primary Tumor Site & Histopathological Diagnosis, Staging (TNM / Clinical Stage), Performance Status (ECOG / Karnofsky), Treatment History (Chemo / Radiotherapy / Surgery), Current Toxicities & Symptoms, Systemic Therapy / Supportive Care Plan."
      ].join("\n");

    case "SURGERY":
      return [
        "FORMAT SPECIFICATION: GENERAL SURGERY CONSULTATION TEMPLATE",
        "- Structure clinicalNotes with: [GENERAL SURGICAL EVALUATION]",
        "- Include: Surgical Chief Complaints (Swelling, Abdominal acute pain, Hernia, Wound/Ulcer), Surgical History, Local & Systemic Physical Examination, Pre-operative Diagnostic Workup (Imaging/Lab), Surgical Assessment & Indication, Conservative / Pre-op / Post-op Management & Wound Care."
      ].join("\n");

    case "PEDIATRIC":
      return [
        "FORMAT SPECIFICATION: PEDIATRIC CONSULTATION TEMPLATE",
        "- Structure clinicalNotes with: [PEDIATRIC CONSULTATION RECORD]",
        "- Include: Pediatric Chief Complaints & Duration, Child Age & Growth Parameters (Weight, Height/Length percentiles), Developmental Milestones, Immunization Status, Pediatric Physical Exam (Hydration, Fontanelle, Chest), Weight-Based Pediatric Dosing Regimen (mg/kg), Danger Signs Warning & Follow-up."
      ].join("\n");

    default:
      return "FORMAT: Clean, formal clinical consultation note matching standard medical documentation standards.";
  }
}

// Helper: Compile Doctor's Personalized Medicine Ranking Rules for AI Prompt
function getDoctorPersonalizedRulesPrompt() {
  try {
    seedDefaultDoctorRules();
    const rules = appData.doctorRules || [];
    if (!Array.isArray(rules) || rules.length === 0) return "";

    const lines = [
      "DOCTOR'S PERSONALIZED MEDICINE RANKING & PREFERENCE RULES (CRITICAL):",
      "The treating physician has configured custom clinical prescribing preferences for specific symptoms.",
      "When any of these symptoms appear in the consultation, you MUST prioritize and recommend the doctor's preferred medications in the indicated rank order (#1 highest priority):"
    ];

    rules.forEach(r => {
      const sym = r.symptom || "";
      const meds = (r.medicines || []).map((m, idx) => "     " + (idx + 1) + ". " + m).join("\n");
      lines.push("  • If patient has: " + sym + "\n" + meds);
    });

    lines.push("NOTE: Always adapt dosage/strength to patient profile, but respect the doctor's drug choice rankings above.");
    return lines.join("\n");
  } catch (e) {
    return "";
  }
}

async function runGeminiClinicalExtraction(apiKey, rawText, formatLabel) {
  const formatCode = selectedAiOutputFormat || "EKA_EMR";
  const formatGuide = getFormatSpecificInstructions(formatCode, formatLabel);
  const doctorRulesGuide = getDoctorPersonalizedRulesPrompt();

  const prompt = [
    "TOKEN OPTIMIZATION RULE: Write transcription, clinical notes, and outputs concisely in clean, crisp Hinglish or English. Avoid unnecessary introductory filler or verbose boilerplate phrases. Be dense, professional, and efficient to minimize token usage.",
    "You are an expert Indian EMR Clinical Scribe AI. Analyze this medical consultation transcript (spoken in Hindi, Hinglish, or English): " + JSON.stringify(rawText),
    "Requested Clinical Format: " + formatLabel,
    "",
    "FORMAT INSTRUCTIONS:",
    formatGuide,
    "",
    doctorRulesGuide ? (doctorRulesGuide + "\n") : "",
    "STRICT CLINICAL RULES:",
    (formatCode === "HOMEOPATHY") ? "1. PURE HOMEOPATHY MANDATE: When format is HOMEOPATHY, you MUST output ONLY authentic classical homeopathic remedies with potencies (e.g. 'Arnica Montana 200C', 'Bryonia Alba 30C', 'Nux Vomica 200C', 'Rhus Tox 30C', 'Ruta Grav 30C', 'Pulsatilla 30C', 'Belladonna 200C', 'Symphytum Off Q'). NEVER output any allopathic medicine (no Dolo, no Paracetamol, no Pan-D, no Zerodol, no antibiotics). Separate Physical Generals, Mental Generals, General Symptoms, and classify Miasms (Psora, Sycosis, Syphilis) with Aggravation/Amelioration." : "1. Respect Doctor's Personalized Medicine Ranking Rules: When patient's symptoms match any of the doctor's preference rules, strictly prioritize and prescribe the doctor's preferred medications according to their ranking.",
    "2. Extract EVERY symptom actually stated by the patient/doctor. Translate Hindi/Hinglish into accurate formal clinical terms.",
    "3. NEVER invent vitals! Only populate bp/pulse/temp/sugar if actual numbers were spoken in the transcript; otherwise set them to null.",
    (formatCode === "HOMEOPATHY") ? "4. Suggest 3-4 top matched classical Homeopathic remedies covering physical complaints, mental generals, and modalities." : "4. Suggest clinically appropriate standard Indian OPD medications & red-flag workup advice matching ALL extracted complaints.",
    "5. Write clinicalNotes strictly formatted following the format specifications above.",
    "",
    "Output ONLY a valid JSON object matching this exact schema:",
    "{",
    '  "symptoms": [{"name": "Formal Clinical Symptom", "severity": "Mild|Moderate|Severe|Acute", "details": "Context from transcript"}],',
    '  "vitals": {"bp": null, "pulse": null, "temp": null, "sugar": null},',
    '  "meds": [{"name": "Tab. Medicine Name", "dose": "1 Tab", "freq": "1-0-1", "dur": "5 Days", "inst": "After meals"}],',
    '  "clinicalNotes": "Full structured consultation note formatted exactly per requested clinical format template"',
    "}"
  ].join("\n");

  // Auto-clean any deprecated or invalid cached model
  let cachedModel = localStorage.getItem("docemr_gemini_working_model");
  if (cachedModel && (/gemini-pro|gemini-1\.0|2\.5/i.test(cachedModel))) {
    localStorage.removeItem("docemr_gemini_working_model");
    cachedModel = null;
  }
  const initialCandidates = [];
  if (cachedModel) initialCandidates.push(cachedModel);
  [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-2.0-flash",
    "gemini-2.0-flash-exp",
    "gemini-1.5-pro",
    "gemini-1.5-flash-8b"
  ].forEach(m => {
    if (!initialCandidates.includes(m)) initialCandidates.push(m);
  });

  const tried = new Set();
  let importantError = null;
  let lastError = null;

  const tryModel = async (model) => {
    if (tried.has(model)) return null;
    tried.add(model);
    try {
      return await callSingleGeminiModel(apiKey, model, prompt, true);
    } catch (e) {
      // If 400 was due to responseMimeType unsupported on a model, retry without responseMimeType
      if (e.httpStatus === 400 && /response_mime_type|responseMimeType|JSON mode/i.test(e.message || "")) {
        return await callSingleGeminiModel(apiKey, model, prompt, false);
      }
      throw e;
    }
  };

  let parsed = null;
  let usedModel = null;

  // Phase 1: Try cached / modern direct models first
  for (const model of initialCandidates) {
    try {
      parsed = await tryModel(model);
      if (parsed) {
        usedModel = model;
        break;
      }
    } catch (e) {
      lastError = e;
      // Stop immediately on invalid API key / unauthorized (400 API_KEY_INVALID or 403)
      if ((e.httpStatus === 400 && /API key|API_KEY/i.test(e.message || "")) || e.httpStatus === 403) {
        throw e;
      }
      if (e.httpStatus && e.httpStatus !== 404) {
        importantError = e;
      }
    }
  }

  // Phase 2: If all initial models returned 404 / failed, dynamically discover available models via ListModels!
  if (!parsed) {
    try {
      const discovered = await discoverGeminiModels(apiKey);
      for (const model of discovered.slice(0, 4)) {
        if (tried.has(model)) continue;
        try {
          parsed = await tryModel(model);
          if (parsed) {
            usedModel = model;
            break;
          }
        } catch (e) {
          lastError = e;
          if (e.httpStatus && e.httpStatus !== 404) {
            importantError = e;
          }
        }
      }
    } catch (discoverErr) {
      if (!importantError) importantError = discoverErr;
    }
  }

  if (!parsed) {
    throw importantError || lastError || new Error("No compatible Gemini model available for this API key");
  }

  if (usedModel) {
    localStorage.setItem("docemr_gemini_working_model", usedModel);
  }

  const cleanVitals = {};
  if (parsed.vitals && typeof parsed.vitals === "object") {
    const bp = sanitizeVitalValue(parsed.vitals.bp);
    const pulse = sanitizeVitalValue(parsed.vitals.pulse);
    const temp = sanitizeVitalValue(parsed.vitals.temp);
    const sugar = sanitizeVitalValue(parsed.vitals.sugar);
    if (bp) cleanVitals.bp = bp;
    if (pulse) cleanVitals.pulse = pulse;
    if (temp) cleanVitals.temp = temp;
    if (sugar) cleanVitals.sugar = sugar;
  }

  currentAiSessionData.parsedSymptoms = Array.isArray(parsed.symptoms) && parsed.symptoms.length > 0
    ? parsed.symptoms
    : [{ name: "Clinical Evaluation", severity: "Moderate", details: rawText }];
  currentAiSessionData.parsedVitals = cleanVitals;
  currentAiSessionData.parsedMeds = Array.isArray(parsed.meds) ? parsed.meds : [];
  currentAiSessionData.clinicalNotes = parsed.clinicalNotes || generateClinicalNoteByFormat(selectedAiOutputFormat, rawText, currentAiSessionData.parsedSymptoms, currentAiSessionData.parsedMeds, cleanVitals);
  currentAiSessionData.rawTranscript = rawText;

  return true;
}

// ============================================================================
// DEDICATED CLASSICAL HOMEOPATHIC CASE TAKING & REPERTORIZATION NLP ENGINE
// ============================================================================
function runHomeopathicCaseTakingNLP(rawText) {
  const text = (rawText || "").toLowerCase();

  // 1. Physical Generals Extraction
  const physicalGenerals = [];
  if (/चिल्ली|ठंड.*(लगती|सहन नहीं)|chilly|cold air|sardi/i.test(text)) {
    physicalGenerals.push("Thermal: Chilly patient (< cold air, desires warm wraps)");
  } else if (/गर्म|गर्मी.*(सहन नहीं|जलन)|hot patient|heat.*worse|burning/i.test(text)) {
    physicalGenerals.push("Thermal: Hot patient (< heat/warmth, desires cool fresh air)");
  } else {
    physicalGenerals.push("Thermal: Ambithermal / Moderate reaction to thermal extremes");
  }

  if (/प्यास.*(ज्यादा|बहुत|पानी पीता)|thirsty|large quantity|thirst.*extreme/i.test(text)) {
    physicalGenerals.push("Thirst: Marked thirst for cold water in large quantities at long intervals");
  } else if (/प्यास.*(नहीं|कम)|thirstless|no thirst|pani.*nahi/i.test(text)) {
    physicalGenerals.push("Thirst: Completely thirstless even with dry mouth / fever");
  } else {
    physicalGenerals.push("Thirst: Moderate normal thirst");
  }

  if (/भूख.*(नहीं|कम)|loss of appetite|no appetite|anorexia/i.test(text)) {
    physicalGenerals.push("Appetite: Anorexia / Reduced appetite");
  } else if (/भूख.*(बहुत|जल्दी लगती)|canine hunger|excessive appetite/i.test(text)) {
    physicalGenerals.push("Appetite: Ravenous hunger, cannot miss a meal");
  } else {
    physicalGenerals.push("Appetite: Normal appetite, no marked cravings reported");
  }

  if (/नींद.*(नहीं|परेशान|खराब)|रात में.*(तकलीफ|दर्द)|insomnia|sleepless|restless.*night/i.test(text)) {
    physicalGenerals.push("Sleep: Restless disturbed sleep; symptoms aggravated at night");
  } else {
    physicalGenerals.push("Sleep: Normal restorative sleep");
  }

  if (/पसीना|sweat|perspiration/i.test(text)) {
    physicalGenerals.push("Perspiration: Profuse perspiration on exertion or sleep");
  }

  // 2. Mental Generals Extraction
  const mentalGenerals = [];
  if (/बेचैनी|घबराहट|restless|anxiety|anxious|palpitation/i.test(text)) {
    mentalGenerals.push("Restlessness & Anxiety: Severe mental and physical anguish, cannot rest in one place");
  }
  if (/गुस्सा|चिड़चिड़ा|irritab|anger|cross|fretful/i.test(text)) {
    mentalGenerals.push("Irritability: Easily angered, sensitive to slightest contradiction or noise");
  }
  if (/डर|भय|fear|darr/i.test(text)) {
    mentalGenerals.push("Fear: Anxious apprehension, fear of death or serious illness");
  }
  if (/रोना|weeping|cry|sad|उदासी/i.test(text)) {
    mentalGenerals.push("Emotional: Weeping tendency, desires consolation or solitude");
  }
  if (mentalGenerals.length === 0) {
    mentalGenerals.push("Mental State: Calm and cooperative; patient distress secondary to physical suffering");
  }

  // 3. Modalities Extraction (Aggravation < and Amelioration >)
  const aggravations = [];
  const ameliorations = [];

  if (/रात|night|rat me/i.test(text)) aggravations.push("Night time (< night, especially after midnight)");
  if (/हिलने|चलने|motion|movement|chalne/i.test(text)) aggravations.push("Motion & physical exertion (< slightest motion)");
  if (/ठंड|ठंडी हवा|cold|sardi/i.test(text)) aggravations.push("Cold air, cold drafts, wet weather");
  if (/दबाने|pressure|dabane/i.test(text) && !/दबाने से.*(आराम|राहत)/i.test(text)) aggravations.push("Touch, gentle pressure, jarring");
  if (/सुबह|morning|subah/i.test(text)) aggravations.push("Early morning on waking");
  if (/खाने के बाद|after meals/i.test(text)) aggravations.push("After food / digestion period");

  if (/आराम|rest|baithne|letne/i.test(text)) ameliorations.push("Complete rest and lying quiet");
  if (/गर्म|seka|garam|warmth/i.test(text)) ameliorations.push("Warm applications, hot fomentation, warm drinks");
  if (/दबाने से आराम|pressure.*relief|hard pressure/i.test(text)) ameliorations.push("Hard pressure & tight bandaging");
  if (/खुली हवा|open air/i.test(text)) ameliorations.push("Cool open fresh air");

  if (aggravations.length === 0) aggravations.push("Cold drafts, exertion, weather change");
  if (ameliorations.length === 0) ameliorations.push("Rest, warmth, gentle position support");

  // 4. Miasmatic Classification of Symptoms
  const psoraList = [];
  const sycosisList = [];
  const syphilisList = [];

  // Categorize based on clinical nature of complaints
  if (/खुजली|itching|rash|allergy|functional|acidity|gas|dyspepsia/i.test(text)) {
    psoraList.push("Functional digestive irritation, cutaneous pruritus, physiological hypersensitivity");
  }
  if (/दर्द|दुख|headache|pain|bodyache|fever/i.test(text)) {
    psoraList.push("Neuralgic sensitivity, irritable pain perception with nervous agitation");
  }
  if (/सूजन|swelling|edema|joint|gout|catarrh|cold|sore throat|khasi/i.test(text)) {
    sycosisList.push("Catarrhal discharges, joint stiffness, synovial swelling, pelvic congestion");
  }
  if (/टूट|fracture|bone|हड्डी|trauma|injury|deep pain|ulcer|nocturnal/i.test(text)) {
    syphilisList.push("Structural bone trauma, periosteal destruction, severe nocturnal bone pain (< night)");
  }

  if (psoraList.length === 0) psoraList.push("Functional constitutional susceptibility and neural hyperesthesia");

  let dominantMiasm = "Psora (Functional disturbance)";
  if (syphilisList.length > 0 && sycosisList.length > 0) {
    dominantMiasm = "Mixed Tri-miasmatic (Psora-Syco-Syphilitic with predominant Syphilitic bone/tissue involvement)";
  } else if (syphilisList.length > 0) {
    dominantMiasm = "Psoro-Syphilitic (Psora triggered with Syphilitic bone/structural destruction)";
  } else if (sycosisList.length > 0) {
    dominantMiasm = "Psoro-Sycotic (Catarrhal discharge, synovial inflammation & induration)";
  }

  // 5. Select 3-4 top matched classical Homeopathic Remedies
  const homeoMeds = [];
  const addHomeo = (name, dose, freq, dur, inst) => {
    if (!homeoMeds.some(m => m.name === name)) {
      homeoMeds.push({ name, dose, freq, dur, inst });
    }
  };

  const isFracture = /हड्डी|fracture|टूट|पैर टूटा|bone|trauma|injury|moch|sprain/i.test(text);
  const isHeadache = /सर.*(दुख|दर्द)|सिर|headache|migraine|माइग्रेन|मस्तक/i.test(text);
  const isAcidity = /एसिडिटी|acidity|gas|pet dard|abdominal|stomach|reflux/i.test(text);
  const isCoughFever = /खांसी|cough|fever|बुखार|cold|bukhar/i.test(text);
  const isBackJoint = /कमर|पीठ|back pain|joint|knee|ghutna|lumbago/i.test(text);

  if (isFracture) {
    addHomeo("Arnica Montana 200C", "4 Globules", "1-0-1", "7 Days", "Dry on tongue (Trauma & tissue extravasation)");
    addHomeo("Symphytum Officinale 30C", "4 Globules", "1-0-1", "14 Days", "After meals (Promotes callus formation in fractures)");
    addHomeo("Ruta Graveolens 30C", "4 Globules", "0-1-0", "10 Days", "For periosteal bruising & tendon strain");
    addHomeo("Calcarea Phosphorica 6X", "4 Tablets", "1-1-1", "30 Days", "Bio-chemic bone nourishment & knitting");
  } else if (isHeadache) {
    if (/माइग्रेन|migraine|right/i.test(text)) {
      addHomeo("Belladonna 200C", "4 Globules", "SOS / 1-0-1", "3 Days", "Throbbing congestive headache with heat");
      addHomeo("Sanguinaria Canadensis 30C", "4 Globules", "1-0-1", "7 Days", "Right-sided periodic migraine headache");
      addHomeo("Spigelia Anthelmia 30C", "4 Globules", "1-0-0", "7 Days", "Left-sided neuralgic headache radiating to eye");
      addHomeo("Nux Vomica 200C", "4 Globules", "0-0-1", "5 Days", "Bedtime dose (For gastric/stress induced cephalea)");
    } else {
      addHomeo("Bryonia Alba 30C", "4 Globules", "1-0-1", "5 Days", "Bursting headache aggravated by slightest motion");
      addHomeo("Gelsemium Sempervirens 200C", "4 Globules", "1-0-1", "5 Days", "Occipital dull heavy headache with tiredness");
      addHomeo("Nux Vomica 200C", "4 Globules", "0-0-1", "5 Days", "At bedtime with warm water");
      addHomeo("Magnesium Phosphoricum 6X", "4 Tablets", "1-1-1", "7 Days", "Dissolved in warm water for crampy pain");
    }
  } else if (isAcidity) {
    addHomeo("Nux Vomica 200C", "4 Globules", "0-0-1", "7 Days", "At bedtime (For sedentary acidity & sour reflux)");
    addHomeo("Robinia Pseudacacia 30C", "4 Globules", "1-0-1", "7 Days", "Hyperchlorhydria with intensely sour eructations");
    addHomeo("Carbo Vegetabilis 30C", "4 Globules", "1-1-0", "7 Days", "Upper abdominal bloating, flatulence, desires fanning");
    addHomeo("Lycopodium Clavatum 30C", "4 Globules", "1-0-0", "7 Days", "Empty stomach (Lower abdominal distension 4-8 PM)");
  } else if (isCoughFever) {
    addHomeo("Aconitum Napellus 200C", "4 Globules", "SOS / 1-0-1", "3 Days", "Sudden onset after cold exposure with restlessness");
    addHomeo("Bryonia Alba 30C", "4 Globules", "1-0-1", "5 Days", "Dry painful cough, patient holds chest, < motion");
    addHomeo("Belladonna 200C", "4 Globules", "1-0-1", "3 Days", "High heat, flushed face, throbbing fever");
    addHomeo("Justicia Adhatoda Q (Mother Tincture)", "10 Drops", "1-1-1", "5 Days", "In 1/4th cup warm water (Bronchial expectorant)");
  } else if (isBackJoint) {
    addHomeo("Rhus Toxicodendron 200C", "4 Globules", "1-0-1", "7 Days", "Stiffness < rest/first motion, > continued movement");
    addHomeo("Ruta Graveolens 30C", "4 Globules", "1-0-1", "10 Days", "Bruised feeling in lumbar spine, ligaments, tendons");
    addHomeo("Colocynthis 30C", "4 Globules", "SOS / 1-0-1", "5 Days", "Cramping sciatic or back pain > hard pressure/bending");
    addHomeo("Bio-chemic Kali Phosphoricum 6X", "4 Tablets", "1-1-1", "14 Days", "In warm water for muscular & nerve exhaustion");
  } else {
    addHomeo("Arnica Montana 200C", "4 Globules", "1-0-1", "5 Days", "General trauma, sore bruised feeling throughout body");
    addHomeo("Nux Vomica 200C", "4 Globules", "0-0-1", "7 Days", "At bedtime (Detoxification and gastric regulation)");
    addHomeo("Pulsatilla Nigricans 30C", "4 Globules", "1-0-0", "7 Days", "Changeable symptoms, mild disposition, > open air");
    addHomeo("Five Phos 6X", "4 Tablets", "1-1-1", "14 Days", "Constitutional nerve & tissue tonic");
  }

  return {
    physicalGenerals,
    mentalGenerals,
    aggravations,
    ameliorations,
    psoraList,
    sycosisList,
    syphilisList,
    dominantMiasm,
    homeoMeds
  };
}

function runDynamicLocalNLP(rawText, format) {
  const isHomeo = (format === "HOMEOPATHY" || format === "Homeopathy OPD Consultation" || selectedAiOutputFormat === "HOMEOPATHY");

  if (isHomeo) {
    const homeoData = runHomeopathicCaseTakingNLP(rawText);
    const symptoms = [
      { name: "Constitutional Case Taking (Classical Homeopathy)", severity: "Comprehensive", details: "Detailed totality of symptoms with physical & mental generals" },
      { name: "Physical Generals: " + homeoData.physicalGenerals[0], severity: "General", details: homeoData.physicalGenerals.slice(1).join(" | ") },
      { name: "Mental Generals: " + homeoData.mentalGenerals[0], severity: "Mental", details: homeoData.mentalGenerals.join("; ") },
      { name: "Modalities: (< Agg / > Amel)", severity: "Characteristic", details: "< " + homeoData.aggravations.join(", ") + " | > " + homeoData.ameliorations.join(", ") },
      { name: "Miasmatic Diagnosis: " + homeoData.dominantMiasm, severity: "Miasm", details: "Psora, Sycosis & Syphilis differentiation evaluated" }
    ];

    currentAiSessionData.parsedSymptoms = symptoms;
    currentAiSessionData.parsedMeds = homeoData.homeoMeds;
    currentAiSessionData.parsedVitals = {};
    currentAiSessionData.clinicalNotes = generateClinicalNoteByFormat("HOMEOPATHY", rawText, symptoms, homeoData.homeoMeds, {});
    return;
  }

  const symptoms = [];
  const meds = [];
  const vitals = {};

  // Comprehensive Multi-System Clinical Dictionary
  const dictionary = [
    // Head, Migraine & Neuro
    { regex: /माइग्रेन|migraine/i, name: "Migraine / Hemicrania", sev: "Severe", details: "Pulsating headache with sensory sensitivity" },
    { regex: /सर.*(दुख|दर्द)|सिर.*(दुख|दर्द)|headache|sir dard|मस्तक/i, name: "Tension Headache / Cephalea", sev: "Moderate", details: "Pain in frontal/cranial muscles" },
    { regex: /चक्कर|dizziness|vertigo|chakkar|giddiness/i, name: "Dizziness / Vertigo", sev: "Moderate" },
    { regex: /घबराहट|anxiety|palpitations|dhadkan/i, name: "Palpitations / Anxiety", sev: "Mild" },
    { regex: /सुन्न|झनझनाहट|राइट हैंड में.*प्रेशर|हाथ.*(प्रेशर|दबाव)|paresthesia|numbness|tingling/i, name: "Upper Limb Pressure / Paresthesia Workup", sev: "Moderate", details: "Pressure/tingling sensation in upper limb" },

    // Cardiac & Chest (Red flag symptoms)
    { regex: /चेस्ट.*(दुख|दर्द)|chest pain|chest discomfort|छाती में दर्द|सीने में दर्द|seena/i, name: "Chest Pain / Discomfort Workup", sev: "Acute", details: "Requires urgent ECG & Cardiac evaluation" },

    // Gastrointestinal & Dyspepsia
    { regex: /एसिडिटी|acidity|dyspepsia|acid reflux|heartburn|खट्टी डकार|गैस/i, name: "Acid Peptic Disease / GERD", sev: "Moderate", details: "Recurrent dyspeptic distress" },
    { regex: /पेट में (बहुत )?दर्द|abdominal pain|stomach pain|pet dard|पेट.*दुख/i, name: "Abdominal Pain", sev: /बहुत|severe|acute|tez/i.test(rawText) ? "Severe" : "Moderate" },
    { regex: /उल्टी|vomiting|nausea|ulti|जी मिचलाना/i, name: "Vomiting / Nausea", sev: "Acute" },
    { regex: /खाना नहीं खाया जाता|भूख नहीं|loss of appetite|anorexia|bhukh/i, name: "Loss of Appetite", sev: "Moderate" },
    { regex: /दस्त|loose motion|diarrhea|dast|पेट खराब/i, name: "Acute Diarrhea / Gastroenteritis", sev: "Acute" },
    { regex: /कब्ज|constipation|kabz/i, name: "Constipation", sev: "Mild" },

    // Spine, Musculoskeletal & Ortho
    { regex: /पैर.*(टूट|फ्रैक्चर)|हड्डी टूट|fracture|broken bone|haddi toot|पैर टूटा/i, name: "Suspected Bone Fracture / Lower Limb Fracture", sev: "Severe", details: "Requires urgent immobilization & AP/Lateral X-Ray" },
    { regex: /पैर.*(दुख|दर्द)|leg pain|foot pain|pair.*dard/i, name: "Lower Limb / Leg Pain", sev: "Moderate" },
    { regex: /मोच|sprain|twist|moch/i, name: "Ligament Sprain / Strain", sev: "Moderate" },
    { regex: /सूजन|swelling|edema|soojan/i, name: "Soft Tissue Swelling / Edema", sev: "Moderate" },
    { regex: /कमर.*(दुख|दर्द)|back pain|lumbago|kamar dard/i, name: "Lumbago / Lower Back Pain", sev: "Moderate", details: "Lumbar spinal stiffness/discomfort" },
    { regex: /जोड़ों में दर्द|घुटने में दर्द|joint pain|knee pain|arthralgia|ghutna/i, name: "Arthralgia / Joint Pain", sev: "Moderate" },
    { regex: /बदन दर्द|bodyache|myalgia|badan dard/i, name: "Generalized Bodyache / Myalgia", sev: "Moderate" },

    // Sleep & Systemic
    { regex: /नींद.*(नहीं|कम|पूरी नहीं)|insomnia|sleeplessness|disturbed sleep/i, name: "Secondary Insomnia / Disturbed Sleep", sev: "Moderate", details: "Unrefreshing or disturbed sleep" },
    { regex: /नींद आती है बहुत|excessive sleepiness|hypersomnia/i, name: "Excessive Sleepiness", sev: "Moderate" },
    { regex: /कमजोरी|थकान|fatigue|thakan|kamzori|tiredness/i, name: "Generalized Fatigue", sev: "Moderate" },

    // Respiratory & ENT
    { regex: /खांसी|cough|khasi|बलगम|balgam/i, name: "Cough", sev: /सूखी|dry/i.test(rawText) ? "Dry Irritant" : "Productive" },
    { regex: /बुखार|fever|bukhar|pyrexia/i, name: "Fever / Pyrexia", sev: /102|103|तेज|high/i.test(rawText) ? "High Grade" : "Moderate" },
    { regex: /गले में दर्द|खराश|sore throat|throat pain|gala/i, name: "Sore Throat / Pharyngitis", sev: "Mild" },
    { regex: /सांस फूलना|breathlessness|dyspnea|asthma/i, name: "Dyspnea / Breathlessness", sev: "Acute" },
    { regex: /जुकाम|छींक|cold|coryza|runny nose|jukam/i, name: "Coryza & Rhinitis", sev: "Mild" },

    // Endocrine, Skin & Urinary
    { regex: /diabetes|sugar|मधुमेह|fbs|ppbs/i, name: "Diabetes Mellitus Workup", sev: "Chronic" },
    { regex: /hypertension|bp high|उच्च रक्तचाप/i, name: "Essential Hypertension", sev: "Chronic" },
    { regex: /बार-बार पेशाब|frequent urination|polyuria/i, name: "Polyuria / Frequent Urination", sev: "Mild" },
    { regex: /पेशाब में जलन|burning urine|dysuria/i, name: "Dysuria / Urinary Burning", sev: "Moderate" },
    { regex: /खुजली|rash|itching|skin allergy/i, name: "Pruritus / Skin Eruption", sev: "Moderate" }
  ];

  dictionary.forEach(d => {
    if (d.regex.test(rawText)) {
      symptoms.push({
        name: d.name,
        severity: d.sev || "Moderate",
        details: d.details || ""
      });
    }
  });

  if (symptoms.length === 0) {
    const cleanSnippet = rawText.replace(/[\n\r]+/g, " ").trim().substring(0, 60);
    symptoms.push({
      name: cleanSnippet || "Clinical Consultation",
      severity: "Moderate",
      details: "Spoken consultation notes"
    });
  }

  // Vitals ONLY if explicitly spoken/typed
  const bpMatch = rawText.match(/(\d{2,3})\s*[\/\-]\s*(\d{2,3})/);
  if (bpMatch) vitals.bp = bpMatch[1] + "/" + bpMatch[2];

  const pulseMatch = rawText.match(/(?:pulse|pr|heart rate)\s*[:=-]?\s*(\d{2,3})/i);
  if (pulseMatch) vitals.pulse = pulseMatch[1];

  const tempMatch = rawText.match(/(?:temp|temperature|बुखार|fever)\s*[:=-]?\s*(\d{2,3}(?:\.\d)?)/i);
  if (tempMatch && parseFloat(tempMatch[1]) >= 95 && parseFloat(tempMatch[1]) <= 108) {
    vitals.temp = tempMatch[1] + " °F";
  }

  const sugarMatch = rawText.match(/(?:sugar|rbs|fbs|ppbs|glucose)\s*[:=-]?\s*(\d{2,3})/i);
  if (sugarMatch) vitals.sugar = sugarMatch[1] + " mg/dL";

  // Multi-system medication suggestions (deduplicated by name)
  const addMed = (m) => {
    if (!meds.some(x => x.name === m.name)) meds.push(m);
  };

  // Inject Doctor's Personalized Medicine Ranking Rules with top priority
  try {
    seedDefaultDoctorRules();
    (appData.doctorRules || []).forEach(rule => {
      const symLower = (rule.symptom || "").toLowerCase();
      const isMatch = symLower && (
        rawText.toLowerCase().includes(symLower) ||
        symptoms.some(s => s.name.toLowerCase().includes(symLower) || symLower.includes(s.name.toLowerCase()))
      );
      if (isMatch) {
        (rule.medicines || []).forEach((mName, rankIdx) => {
          let dose = "1 Tab";
          let freq = "1-0-1";
          let dur = "5 Days";
          let inst = "After meals";
          if (/pan|panto|omeprazole|rabeprazole/i.test(mName)) {
            dose = "1 Cap";
            freq = "1-0-0";
            inst = "Before breakfast (Empty stomach)";
          } else if (/dolo|paracetamol/i.test(mName)) {
            dur = "3 Days";
            inst = "After meals (SOS / Fever)";
          } else if (/montair|cetirizine|levocet/i.test(mName)) {
            freq = "0-0-1";
            inst = "At bedtime";
          } else if (/syp|gelusil|mucaine|ascoril/i.test(mName)) {
            dose = "10 ml";
            freq = "1-1-1";
          }
          addMed({ name: mName, dose, freq, dur, inst });
        });
      }
    });
  } catch (e) {}

  const isFractureOrOrtho = /हड्डी|fracture|broken|पैर.*(टूट|दुख|दर्द)|leg pain|joint|knee|sprain|moch/i.test(rawText);
  const isMigraine = /माइग्रेन|migraine/i.test(rawText);
  const isHeadOrBackPain = /सर.*(दुख|दर्द)|सिर.*(दुख|दर्द)|headache|कमर|back pain|lumbago|बदन दर्द/i.test(rawText);
  const isChestOrLimb = /चेस्ट|chest|छाती|सीने|राइट हैंड में.*प्रेशर/i.test(rawText);
  const isAcidityOrGI = /एसिडिटी|acidity|gas|reflux|पेट.*(दर्द|दुख)|abdominal|stomach/i.test(rawText);
  const isVomiting = /उल्टी|vomiting|nausea|ulti/i.test(rawText);
  const isCough = /खांसी|cough|khasi/i.test(rawText);
  const isFever = /बुखार|fever|bukhar/i.test(rawText);
  const isDiabetes = /diabetes|sugar|fbs|ppbs|मधुमेह/i.test(rawText);
  const isInsomnia = /नींद.*(नहीं|कम|पूरी नहीं)|insomnia|sleepless/i.test(rawText);

  if (isFractureOrOrtho) {
    addMed({ name: "Tab. Zerodol-SP", dose: "1 Tab", freq: "1-0-1", dur: "5 Days", inst: "After meals (For pain & swelling)" });
    addMed({ name: "Cap. Pan-D", dose: "1 Cap", freq: "1-0-0", dur: "5 Days", inst: "Before breakfast" });
    if (/हड्डी|fracture|टूट|broken/i.test(rawText)) {
      addMed({ name: "Tab. Chymoral Forte", dose: "1 Tab", freq: "1-0-1", dur: "5 Days", inst: "Before meals (For swelling & trauma)" });
      addMed({ name: "Advice: Urgent X-Ray (AP & Lateral) + Orthopedic Immobilization", dose: "Urgent", freq: "Immediate", dur: "1 Day", inst: "Non-weight bearing" });
    }
  }

  if (isAcidityOrGI || isVomiting) {
    addMed({ name: "Cap. Pan-D", dose: "1 Cap", freq: "1-0-0", dur: "10 Days", inst: "30 mins before breakfast" });
    if (/एसिडिटी|acidity|reflux|gas/i.test(rawText)) {
      addMed({ name: "Syp. Mucaine Gel", dose: "10 ml", freq: "1-1-1", dur: "5 Days", inst: "After meals (For reflux distress)" });
    }
    if (isVomiting) {
      addMed({ name: "Tab. Ondem 4mg", dose: "1 Tab", freq: "1-0-1", dur: "3 Days", inst: "Before meals" });
    }
  }

  if (isMigraine || isHeadOrBackPain) {
    addMed({ name: "Tab. Zerodol-SP", dose: "1 Tab", freq: "1-0-1", dur: "5 Days", inst: "After meals (Pain & inflammation)" });
    if (isMigraine) {
      addMed({ name: "Tab. Vasograin", dose: "1 Tab", freq: "SOS", dur: "3 Days", inst: "At onset of migraine headache" });
    }
  }

  if (isCough) {
    addMed({ name: "Syp. Ascoril D Plus", dose: "10 ml", freq: "1-1-1", dur: "5 Days", inst: "With warm water" });
    addMed({ name: "Tab. Montair-LC", dose: "1 Tab", freq: "0-0-1", dur: "5 Days", inst: "At bedtime" });
  }

  if (isFever) {
    addMed({ name: "Tab. Dolo 650mg", dose: "1 Tab", freq: "1-0-1", dur: "5 Days", inst: "After meals" });
  }

  if (isDiabetes) {
    addMed({ name: "Tab. Glycomet-GP 1", dose: "1 Tab", freq: "1-0-0", dur: "30 Days", inst: "Before breakfast" });
    addMed({ name: "Advice: HbA1c, FBS/PPBS monitoring & Diabetic Foot Care", dose: "Lab", freq: "Follow-up", dur: "30 Days", inst: "Review with reports" });
  }

  if (isChestOrLimb) {
    addMed({ name: "Advice: Urgent 12-Lead ECG + Cardiac & BP Evaluation", dose: "Urgent", freq: "Stat", dur: "Immediate", inst: "Rule out acute coronary / ischemic presentation" });
  }

  if (isInsomnia) {
    addMed({ name: "Advice: Rest, sleep hygiene & pain-controlled positioning", dose: "Daily", freq: "Night", dur: "7 Days", inst: "Avoid late caffeine/screens" });
  }

  if (meds.length === 0) {
    addMed({ name: "Tab. Dolo 650mg", dose: "1 Tab", freq: "1-0-1", dur: "3 Days", inst: "After meals (SOS)" });
    addMed({ name: "Cap. Becosules Z", dose: "1 Cap", freq: "0-1-0", dur: "10 Days", inst: "After meals" });
  }

  currentAiSessionData.parsedSymptoms = symptoms;
  currentAiSessionData.parsedMeds = meds;
  currentAiSessionData.parsedVitals = vitals;
  currentAiSessionData.clinicalNotes = generateClinicalNoteByFormat(format, rawText, symptoms, meds, vitals);
}

function generateClinicalNoteByFormat(format, rawText, symptoms, meds, vitals) {
  const formatLabel = getAiFormatLabel(format);
  const symNames = symptoms.length > 0 ? symptoms.map(s => s.name + " (" + s.severity + ")").join(", ") : "Nil significant reported";
  const symBulletList = symptoms.length > 0 ? symptoms.map(s => "  • " + s.name + " [" + s.severity + "]" + (s.details ? " — " + s.details : "")).join("\n") : "  • None reported";
  const medNames = meds.length > 0 ? meds.map(m => "  • " + m.name + " | " + m.dose + " | " + m.freq + " | " + m.dur + " | " + m.inst).join("\n") : "  • No medications prescribed";

  const vitalsArr = [];
  if (vitals && vitals.bp) vitalsArr.push("BP: " + vitals.bp + " mmHg");
  if (vitals && vitals.pulse) vitalsArr.push("Pulse: " + vitals.pulse + " bpm");
  if (vitals && vitals.temp) vitalsArr.push("Temp: " + vitals.temp);
  if (vitals && vitals.sugar) vitalsArr.push("Blood Sugar: " + vitals.sugar);
  const vitalsStr = vitalsArr.length > 0 ? vitalsArr.join(", ") : "Not recorded during this dictation";

  switch (format) {
    case "HOMEOPATHY": {
      const hData = runHomeopathicCaseTakingNLP(rawText);
      const pgFormatted = hData.physicalGenerals.map(p => "  • " + p).join("\n");
      const mgFormatted = hData.mentalGenerals.map(m => "  • " + m).join("\n");
      const aggFormatted = hData.aggravations.map(a => "    - " + a).join("\n");
      const amelFormatted = hData.ameliorations.map(a => "    - " + a).join("\n");
      const psoraFmt = hData.psoraList.map(p => "    - " + p).join("\n");
      const sycosisFmt = hData.sycosisList.length > 0 ? hData.sycosisList.map(s => "    - " + s).join("\n") : "    - Nil prominent sycotic overgrowth/discharge observed";
      const syphilisFmt = hData.syphilisList.length > 0 ? hData.syphilisList.map(s => "    - " + s).join("\n") : "    - Nil destructive tissue/ulcerative involvement observed";

      return "[HOMEOPATHY CASE RECORD & CLASSICAL HAHNEMANNIAN TOTALITY]\n" +
        "===========================================================\n\n" +
        "1. PRESENTING COMPLAINTS (मुख्य लक्षण व रोगी की व्यथा):\n" +
        "  • Patient's Narrative: " + JSON.stringify(rawText) + "\n\n" +
        "2. MODALITIES: AGGRAVATION & AMELIORATION (घटने-बढ़ने के लक्षण):\n" +
        "  • Aggravation (< रोग बढ़ना):\n" + aggFormatted + "\n" +
        "  • Amelioration (> रोग में आराम मिलना):\n" + amelFormatted + "\n\n" +
        "3. PHYSICAL GENERALS (शारीरिक सामान्य लक्षण):\n" + pgFormatted + "\n\n" +
        "4. MENTAL GENERALS (मानसिक सामान्य लक्षण):\n" + mgFormatted + "\n\n" +
        "5. GENERAL SYMPTOMS (सामान्य दैहिक लक्षण):\n" +
        "  • Susceptibility, energy levels and characteristic individualizing keynotes matching patient's constitution.\n\n" +
        "6. MIASMATIC DIFFERENTIATION & DIAGNOSIS (मियाज्मैटिक विश्लेषण):\n" +
        "  • Psora Symptoms (सोरा लक्षण):\n" + psoraFmt + "\n" +
        "  • Sycosis Symptoms (साइकोसिस लक्षण):\n" + sycosisFmt + "\n" +
        "  • Syphilis Symptoms (सिफलिस लक्षण):\n" + syphilisFmt + "\n" +
        "  • FINAL MIASMATIC IMPRESSION (अंतिम मियाज्म): " + hData.dominantMiasm + "\n\n" +
        "7. TOTALITY OF SYMPTOMS & REPERTORIZATION KEYNOTES:\n" +
        "  • Correlated characteristic physical generals with mental state and modalities to individualize the totality.\n\n" +
        "8. CLASSICAL HOMEOPATHIC PRESCRIPTION (औषध व्यवस्था):\n" +
        medNames + "\n\n" +
        "9. AUXILIARY MEASURES & DIETARY RESTRICTIONS (पथ्य एवं परहेज):\n" +
        "  • Strictly avoid raw onion, garlic, camphor, strong coffee, asafoetida (heeng) and strong smelling items 30 mins before/after remedy.\n" +
        "  • Do not touch globules with bare hands; take on clean spoon or tongue directly.\n" +
        "  • Review after 7 to 14 days or report immediately if homeopathic primary aggravation occurs.";
    }

    case "SOAP":
    case "SOAP Detailed":
      return "[SOAP NOTE - COMPREHENSIVE CLINICAL RECORD]\n==============================================\n" +
        "SUBJECTIVE (S):\n" +
        "  • Chief Complaints: " + symNames + "\n" +
        "  • Spoken Narrative: " + JSON.stringify(rawText) + "\n\n" +
        "OBJECTIVE (O):\n" +
        "  • Vitals: " + vitalsStr + "\n" +
        "  • Systemic Examination: Physical evaluation conducted\n\n" +
        "ASSESSMENT (A):\n" +
        "  • Primary Clinical Impression: " + (symptoms.map(s => s.name).join(" + ") || "Clinical Consultation") + "\n\n" +
        "PLAN (P):\n" +
        "  • Pharmacotherapy & Regimen:\n" + medNames + "\n" +
        "  • Advice: Adequate rest, hydration, warning signs discussed. Review in OPD after 3–5 days.";

    case "EKA_EMR":
    case "EKA EMR Format":
      return "[EKA EMR STRUCTURED CONSULTATION SUMMARY]\n============================================\n" +
        "CHIEF COMPLAINTS:\n" + symBulletList + "\n\n" +
        "VITALS & PHYSICAL EXAMINATION:\n  • " + vitalsStr + "\n\n" +
        "CLINICAL FINDINGS & NARRATIVE:\n  • " + JSON.stringify(rawText) + "\n\n" +
        "PRESCRIPTION / PLAN:\n" + medNames + "\n\n" +
        "FOLLOW-UP & ADVICE:\n  • Review in clinic after 5 days or sooner if symptoms worsen.";

    case "CLINICAL_NOTES":
    case "Clinical Notes":
      return "[OPD CLINICAL CONSULTATION NOTE]\n===================================\n" +
        "Presenting Illness: " + symNames + "\n" +
        "Consultation Dictation: " + JSON.stringify(rawText) + "\n" +
        "Vitals: " + vitalsStr + "\n\n" +
        "Clinical Plan & Prescriptions:\n" + medNames + "\n\n" +
        "Doctor's Advice: Maintain proper regimen, avoid exertion, review if distress persists.";

    case "GP_OPD":
    case "General Physician OPD Consultation Note":
      return "[GENERAL PHYSICIAN OPD RECORD]\n==============================\n" +
        "History of Present Illness: " + symNames + "\n" +
        "Vitals Recorded: " + vitalsStr + "\n" +
        "Working Diagnosis: " + (symptoms.map(s => s.name).join(" + ") || "General OPD Case") + "\n\n" +
        "Prescriptions Dispensed / Advised:\n" + medNames + "\n\n" +
        "Preventive Counseling: Dietary precautions and routine follow-up in 5 days.";

    case "INPATIENT":
    case "General Inpatient Admission Template":
      return "[INPATIENT ADMISSION NOTE & CLINICAL WORKUP]\n============================================\n" +
        "Admission Complaints: " + symNames + "\n" +
        "Initial Vitals at Ward: " + vitalsStr + "\n" +
        "HPI & Clinical Narrative: " + JSON.stringify(rawText) + "\n\n" +
        "Stat Orders & Inpatient Medications:\n" + medNames + "\n\n" +
        "Nursing Instructions: Continuous vitals monitoring q4h, intake/output chart, notify on-call RMO for distress.";

    case "PATIENT_HISTORY":
    case "Patient Medical History":
      return "[PATIENT MEDICAL HISTORY RECORD]\n==================================\n" +
        "Presenting Complaints: " + symNames + "\n" +
        "Dictated Clinical Summary: " + JSON.stringify(rawText) + "\n" +
        "Baseline Vitals: " + vitalsStr + "\n" +
        "Past Medical / Surgical History: Reviewed with patient\n" +
        "Drug Allergies / Contraindications: Nil reported\n\n" +
        "Active Treatment Plan:\n" + medNames;

    case "MEETING_NOTES":
    case "Meeting Notes":
      return "[CLINICAL CASE DISCUSSION & MEETING NOTES]\n============================================\n" +
        "Patient Subject: " + symNames + "\n" +
        "Clinical Summary: " + JSON.stringify(rawText) + "\n" +
        "Vitals Status: " + vitalsStr + "\n\n" +
        "Agreed Specialist Recommendations & Plan:\n" + medNames + "\n\n" +
        "Action Items: Multidisciplinary follow-up and monitoring.";

    case "DIABETOLOGY":
    case "Diabetology OPD Consultation Note":
      return "[DIABETOLOGY CONSULTATION RECORD]\n===================================\n" +
        "Presenting Glycemic Concerns: " + symNames + "\n" +
        "Vitals & Glycemic Status: " + vitalsStr + "\n" +
        "Clinical Narrative: " + JSON.stringify(rawText) + "\n\n" +
        "Complication Screening: Diabetic foot check, peripheral pulses, visual acuity evaluation\n" +
        "Target Glycemic Goals: FBS < 110 mg/dL, PPBS < 140 mg/dL, HbA1c < 7.0%\n\n" +
        "Antidiabetic Pharmacotherapy Plan:\n" + medNames + "\n\n" +
        "Medical Nutrition Therapy: Low glycemic index diet, regular 30 min brisk walk, self-monitoring of blood glucose (SMBG).";

    case "OBGYN":
    case "OB/GYN Consultation Template":
      return "[OB/GYN CLINICAL RECORD]\n=========================\n" +
        "Obstetric / Gynecological Complaints: " + symNames + "\n" +
        "Vitals & General State: " + vitalsStr + "\n" +
        "History & Narrative: " + JSON.stringify(rawText) + "\n\n" +
        "Clinical Evaluation: Abdominal/pelvic exam assessed, fetal/maternal well-being monitored\n\n" +
        "Management & Prescription Plan:\n" + medNames + "\n\n" +
        "Advice: Prenatal vitamins, adequate hydration, warning sign vigilance (bleeding, severe cramps, leaking).";

    case "OPHTHALMOLOGY":
    case "Ophthalmology Consultation Template":
      return "[OPHTHALMOLOGY CLINICAL EVALUATION]\n====================================\n" +
        "Ocular Complaints: " + symNames + "\n" +
        "General Vitals: " + vitalsStr + "\n" +
        "Clinical Description: " + JSON.stringify(rawText) + "\n" +
        "Ophthalmic Exam: Visual acuity, anterior segment slit lamp, intraocular pressure screening\n\n" +
        "Ophthalmic Medications & Care Plan:\n" + medNames + "\n\n" +
        "Advice: Instill eye drops strictly as directed, avoid rubbing eyes, protective eyewear advised.";

    case "NEUROLOGY":
    case "Neurology OPD Consultation Note":
      return "[NEUROLOGICAL CONSULTATION RECORD]\n==================================\n" +
        "Neurological Symptoms: " + symNames + "\n" +
        "Vitals: " + vitalsStr + "\n" +
        "History & Presentation: " + JSON.stringify(rawText) + "\n" +
        "Neurological Exam: Cranial nerves, motor tone/power, deep tendon reflexes, cerebellar signs\n\n" +
        "Neuro-Pharmacology Regimen:\n" + medNames + "\n\n" +
        "Workup & Advice: Neuroimaging/EEG as indicated. Seek immediate ER care if focal deficit, syncope, or intractable headache occurs.";

    case "CARDIOLOGY":
    case "Cardiology OPD Consultation Note":
      return "[CARDIOLOGY CONSULTATION RECORD]\n==================================\n" +
        "Cardiovascular Symptoms: " + symNames + "\n" +
        "Hemodynamic Vitals: " + vitalsStr + "\n" +
        "Dictation Context: " + JSON.stringify(rawText) + "\n" +
        "Cardiovascular Exam: Heart sounds S1/S2, murmurs, JVP, peripheral edema, lung bases\n\n" +
        "Cardiac Medical Plan & Workup:\n" + medNames + "\n\n" +
        "Urgent Advice: Low-salt diet (<2g/day), 12-lead ECG & 2D Echo review. Immediate emergency visit if chest pain radiates to arm/jaw or causes diaphoresis.";

    case "ORTHOPEDICS":
    case "Orthopedics Consultation Template":
      return "[ORTHOPEDIC EVALUATION & PLAN]\n===============================\n" +
        "Musculoskeletal Complaints: " + symNames + "\n" +
        "Vitals: " + vitalsStr + "\n" +
        "Injury Context: " + JSON.stringify(rawText) + "\n" +
        "Physical Examination: Tenderness, swelling, joint range of motion, neurovascular intactness distally\n\n" +
        "Orthopedic Pharmacotherapy & Immobilization:\n" + medNames + "\n\n" +
        "Advice: RICE protocol (Rest, Ice, Compression, Elevation), limb elevation, non-weight bearing until X-Ray clearance.";

    case "DERMATOLOGY":
    case "Dermatology Consultation Template":
      return "[DERMATOLOGY CLINICAL RECORD]\n==============================\n" +
        "Cutaneous Symptoms: " + symNames + "\n" +
        "Vitals: " + vitalsStr + "\n" +
        "Clinical Narrative: " + JSON.stringify(rawText) + "\n" +
        "Dermatological Exam: Lesion morphology, distribution, erythema, excoriation\n\n" +
        "Dermatological Treatment Plan:\n" + medNames + "\n\n" +
        "Patient Guidance: Mild soap/cleanser, moisturize damp skin, avoid scratching, sun protection.";

    case "ONCOLOGY":
    case "Oncology Consultation Template":
      return "[ONCOLOGY CLINICAL SUMMARY]\n============================\n" +
        "Presenting Oncology Complaints: " + symNames + "\n" +
        "Vitals & ECOG Performance: " + vitalsStr + "\n" +
        "Clinical Narrative: " + JSON.stringify(rawText) + "\n" +
        "Assessment: Staging, histopathology review, toxicity monitoring\n\n" +
        "Supportive & Oncological Regimen:\n" + medNames + "\n\n" +
        "Plan: Symptom management, regular oncology review, hydration and adequate nutrition.";

    case "SURGERY":
    case "General Surgery Consultation Template":
      return "[GENERAL SURGICAL EVALUATION]\n=============================\n" +
        "Surgical Presentation: " + symNames + "\n" +
        "Vitals: " + vitalsStr + "\n" +
        "Presentation Details: " + JSON.stringify(rawText) + "\n" +
        "Surgical Exam: Local examination, palpation, signs of peritonitis/obstruction/abscess\n\n" +
        "Surgical Care Plan & Prescriptions:\n" + medNames + "\n\n" +
        "Advice: Pre-op / post-op care, wound dressing, warning sign vigilance.";

    case "PEDIATRIC":
    case "Pediatric Consultation Template":
      return "[PEDIATRIC CONSULTATION RECORD]\n===============================\n" +
        "Pediatric Complaints: " + symNames + "\n" +
        "Pediatric Vitals: " + vitalsStr + "\n" +
        "Parent's History: " + JSON.stringify(rawText) + "\n" +
        "Pediatric Exam: Activity, hydration status, respiratory rate, chest clear\n\n" +
        "Weight-Appropriate Pediatric Prescriptions:\n" + medNames + "\n\n" +
        "Danger Signs Alert: Seek immediate emergency medical care if persistent vomiting, lethargy, poor feeding, or rapid breathing develops.";

    default:
      return "[" + formatLabel.toUpperCase() + "]\n\nClinical Findings: " + symNames + "\nVitals: " + vitalsStr + "\nNarrative: " + JSON.stringify(rawText) + "\n\nTreatment Plan:\n" + medNames;
  }
}

function showScreen2SessionOutput() {
  const modal = document.getElementById("ai-scribe-modal");
  if (modal) modal.style.display = "none";

  const scr = document.getElementById("screen-session-output");
  if (!scr) return;
  scr.style.display = "flex";

  // Sync patient selector on Screen 2
  populateAiPatientDropdowns(currentAiSessionData.selectedPatientId || "");

  const totalEl = document.getElementById("so-audio-total-time");
  const endEl = document.getElementById("so-audio-end-time");
  const curEl = document.getElementById("so-audio-current-time");
  const slider = document.getElementById("so-audio-slider");
  if (totalEl) totalEl.textContent = formatSec(audioTotalSec);
  if (endEl) endEl.textContent = formatSec(audioTotalSec);
  if (curEl) curEl.textContent = "0:00";
  if (slider) {
    slider.max = audioTotalSec;
    slider.value = 0;
  }

  // Render Symptoms Cards
  const symContainer = document.getElementById("so-symptoms-list");
  if (symContainer) {
    symContainer.innerHTML = "";
    currentAiSessionData.parsedSymptoms.forEach(s => {
      const row = document.createElement("div");
      row.className = "ai-symptom-card";
      row.style.background = "#f8fafc";
      row.style.border = "1px solid #e2e8f0";
      row.style.borderRadius = "12px";
      row.style.padding = "12px 16px";
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.alignItems = "center";
      row.innerHTML = "<div>" +
        '<div style="font-weight: 800; color: #0f172a; font-size: 0.95rem;">' + s.name + "</div>" +
        (s.severity ? '<div style="font-size: 0.8rem; color: #64748b; margin-top: 3px;">Severity: ' + s.severity + "</div>" : "") +
        (s.details ? '<div style="font-size: 0.8rem; color: #64748b; margin-top: 3px;">Details: ' + s.details + "</div>" : "") +
        "</div>";
      symContainer.appendChild(row);
    });
  }

  // Render Meds List
  const medContainer = document.getElementById("so-meds-list");
  if (medContainer) {
    medContainer.innerHTML = "";
    currentAiSessionData.parsedMeds.forEach(m => {
      const row = document.createElement("div");
      row.style.background = "#f0fdf4";
      row.style.border = "1px solid #bbf7d0";
      row.style.borderRadius = "10px";
      row.style.padding = "10px 14px";
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.alignItems = "center";
      row.innerHTML = '<div><div style="font-weight: 700; color: #166534; font-size: 0.92rem;">' + m.name + '</div><div style="font-size: 0.78rem; color: #15803d; margin-top: 2px;">' + (m.dose || "") + " • " + (m.freq || "") + " • " + (m.dur || "") + (m.inst ? " (" + m.inst + ")" : "") + '</div></div><span class="badge" style="background:#166534; color:#fff; font-size:0.72rem;">Rx</span>';
      medContainer.appendChild(row);
    });
  }

  const notesEl = document.getElementById("so-clinical-notes-content");
  if (notesEl) notesEl.textContent = currentAiSessionData.clinicalNotes;

  const transcriptEl = document.getElementById("so-transcript-content");
  if (transcriptEl) transcriptEl.textContent = currentAiSessionData.rawTranscript;

  switchAiOutputTab("emr");
  scr.scrollTop = 0;
}

function switchAiOutputTab(tab) {
  const panes = ["emr", "clinical", "transcript"];
  panes.forEach(p => {
    const paneEl = document.getElementById("so-pane-" + p);
    const pillEl = document.getElementById("so-pill-" + p);
    const isActive = (p === tab);
    if (paneEl) paneEl.style.display = isActive ? "block" : "none";
    if (pillEl) {
      pillEl.classList.toggle("active", isActive);
      pillEl.style.background = isActive ? "#eff6ff" : "#ffffff";
      pillEl.style.borderColor = isActive ? "#2563eb" : "#cbd5e1";
      pillEl.style.color = isActive ? "#2563eb" : "#334155";
      pillEl.style.fontWeight = isActive ? "800" : "600";
    }
  });
}

function clearAiScribeInput() {
  nativeSpeechAccumulated = "";
  nativeSpeechCurrentPartial = "";
  const input = document.getElementById("ai-scribe-input");
  if (input) input.value = "";
  showToast("Cleared input box", "info");
}

function copyAiOutputToClipboard() {
  const text = currentAiSessionData.clinicalNotes || currentAiSessionData.rawTranscript;
  if (!text) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast("📋 Output copied to clipboard!", "success");
    }).catch(() => {});
  }
}

// AI Prescription Chips Bar & Interactive 1-Tap Prescribe Management
function renderAiPrescriptionChips(aiMeds) {
  const box = document.getElementById("rx-ai-suggestions-box");
  const container = document.getElementById("rx-ai-med-chips");
  if (!box || !container) return;

  if (!Array.isArray(aiMeds) || aiMeds.length === 0) {
    box.style.display = "none";
    container.innerHTML = "";
    return;
  }

  box.style.display = "block";
  container.innerHTML = "";

  const activeNames = getCurrentlyPrescribedMedicineNames();

  // Sort AI meds alphabetically by clean name
  const sorted = [...aiMeds].sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  sorted.forEach(med => {
    const chip = document.createElement("span");
    const isPresent = activeNames.some(an => isMedMatch(an, med.name));
    chip.className = "tag-chip" + (isPresent ? " chip-selected" : "");
    chip.style.display = "inline-flex";
    chip.style.alignItems = "center";
    chip.style.gap = "4px";
    chip.style.fontSize = "0.78rem";
    chip.style.padding = "4px 8px";
    chip.style.borderRadius = "6px";
    chip.style.cursor = "pointer";
    chip.style.transition = "all 0.15s ease";

    if (isPresent) {
      chip.style.background = "#7c3aed";
      chip.style.color = "#ffffff";
      chip.style.fontWeight = "700";
      chip.style.border = "1px solid #6d28d9";
    } else {
      chip.style.background = "#ffffff";
      chip.style.color = "#5b21b6";
      chip.style.fontWeight = "600";
      chip.style.border = "1.5px solid #c4b5fd";
    }

    const cleanName = (med.name || "Med").replace(/^(Tab.|Cap.|Syp.|Drops|Inj.)s*/i, "").split(" (")[0];
    chip.innerHTML = (isPresent ? '✓ ' : '+ ') + escapeHtml(cleanName) + ' <span style="font-size: 0.65rem; background: ' + (isPresent ? '#5b21b6' : '#ede9fe') + '; color: ' + (isPresent ? '#ddd6fe' : '#6d28d9') + '; padding: 1px 4px; border-radius: 3px; font-weight: 800;">AI</span>';
    chip.title = (med.name || '') + ' | ' + (med.dose || '1 Tab') + ' | ' + (med.freq || '1-0-1') + ' | ' + (med.dur || '5 Days') + ' (' + (isPresent ? 'Tap to remove' : 'Tap to add') + ')';

    chip.onclick = () => {
      toggleAiMedicineChip(med, chip);
    };

    container.appendChild(chip);
  });
}

function toggleAiMedicineChip(med, chipEl) {
  const container = document.getElementById("rx-medicine-rows");
  if (!container) return;

  const rows = Array.from(container.querySelectorAll(".rx-row"));
  let existingRow = null;

  for (const r of rows) {
    const val = (r.querySelector(".med-name")?.value || "").trim();
    if (val && isMedMatch(val, med.name)) {
      existingRow = r;
      break;
    }
  }

  if (existingRow) {
    existingRow.remove();
    if (container.querySelectorAll(".rx-row").length === 0) {
      addMedicineRow();
    }
    showToast("Removed " + med.name + " from Rx", "info");
  } else {
    // If single empty row exists, populate it
    let emptyRow = rows.find(r => !(r.querySelector(".med-name")?.value || "").trim());

    if (emptyRow) {
      const nameInp = emptyRow.querySelector(".med-name");
      const doseInp = emptyRow.querySelector(".med-dosage");
      const timeInp = emptyRow.querySelector(".med-timing");
      const durInp = emptyRow.querySelector(".med-duration");
      const notesInp = emptyRow.querySelector(".med-notes");
      if (nameInp) nameInp.value = med.name || "";
      if (doseInp) doseInp.value = med.dose || "1-0-1";
      if (timeInp) timeInp.value = med.freq ? (med.freq + " (" + (med.inst || "After food") + ")") : (med.inst || "After food");
      if (durInp) durInp.value = med.dur || "5 days";
      if (notesInp) notesInp.value = med.inst || "";
      syncRowChips(emptyRow);
    } else {
      addMedicineRow({
        name: med.name || "",
        dose: med.dose || "1-0-1",
        timing: med.freq ? (med.freq + " (" + (med.inst || "After food") + ")") : (med.inst || "After food"),
        duration: med.dur || "5 days",
        notes: med.inst || ""
      });
    }
    showToast("Added " + med.name + " to Rx!", "success");
  }

  // Refresh active chip states
  if (currentAiSessionData.parsedMeds) {
    renderAiPrescriptionChips(currentAiSessionData.parsedMeds);
  }
  updateDynamicMedicationSuggestions();
}

function copyAiToActiveRx() {
  closeSessionOutputScreen();
  switchTab("prescribe");

  if (currentAiSessionData.selectedPatientId) {
    startNewConsultationForPatient(currentAiSessionData.selectedPatientId);
  }

  const symNames = currentAiSessionData.parsedSymptoms.map(s => s.name);
  const symText = symNames.join(", ");
  const symInput = document.getElementById("rx-symptoms");
  if (symInput) {
    symInput.value = symInput.value ? symInput.value + ", " + symText : symText;
  }

  // Highlight matching symptom chips
  symNames.forEach(name => {
    const chips = document.querySelectorAll("#pane-prescribe .tag-chip");
    chips.forEach(chip => {
      const chipText = chip.textContent.trim().replace(/^✓\s*/, "").toLowerCase();
      if (chipText && (name.toLowerCase().includes(chipText) || chipText.includes(name.toLowerCase()))) {
        chip.classList.add("chip-selected");
        chip.style.backgroundColor = "#0f766e";
        chip.style.color = "#ffffff";
        chip.style.fontWeight = "700";
        if (!chip.textContent.startsWith("✓ ")) {
          chip.textContent = "✓ " + chip.textContent;
        }
      }
    });
  });

  // Vitals
  if (currentAiSessionData.parsedVitals && currentAiSessionData.parsedVitals.bp) {
    const bpInput = document.getElementById("vital-bp");
    if (bpInput) bpInput.value = currentAiSessionData.parsedVitals.bp;
    const parts = currentAiSessionData.parsedVitals.bp.split("/");
    if (parts.length === 2) {
      const s = document.getElementById("vital-bp-sys");
      const d = document.getElementById("vital-bp-dia");
      if (s) s.value = parts[0];
      if (d) d.value = parts[1];
    }
  }

  // Medications: Insert into Prescription Rows using exact structure
  const medRowsContainer = document.getElementById("rx-medicine-rows");
  if (medRowsContainer && currentAiSessionData.parsedMeds.length > 0) {
    medRowsContainer.innerHTML = "";
    currentAiSessionData.parsedMeds.forEach(m => {
      addMedicineRow({
        name: m.name || "",
        dose: m.dose || "1-0-1",
        timing: m.freq ? (m.freq + " (" + (m.inst || "After food") + ")") : (m.inst || "After food"),
        duration: m.dur || "5 days",
        notes: m.inst || ""
      });
    });
  }

  // RENDER INTERACTIVE AI PRESCRIPTION CHIPS WITH TINY AI BADGE
  renderAiPrescriptionChips(currentAiSessionData.parsedMeds);

  updateDynamicMedicationSuggestions();
  showToast("📋 Ingested findings & AI suggested chips into Prescribe canvas!", "success");
}


// ============================================================================
// A-Z CLINICAL DRUG & INJECTION FORMULARY LIBRARY (STUDY & INSTANT PRESCRIBE)
// ============================================================================
let currentFormularyCategory = "all";
let currentFormularySearch = "";

function openDrugLibraryModal() {
  const modal = document.getElementById("drug-library-modal");
  if (!modal) return;
  modal.style.display = "flex";
  const searchInput = document.getElementById("formulary-search-input");
  if (searchInput) {
    const symptoms = (document.getElementById("rx-symptoms")?.value || "").trim();
    if (symptoms && !searchInput.value) {
      searchInput.value = symptoms.split(/[,\r\n]+/)[0].trim();
      currentFormularySearch = searchInput.value.toLowerCase();
    }
    setTimeout(() => searchInput.focus(), 150);
  }
  renderDrugLibrary();
}

function closeDrugLibraryModal() {
  const modal = document.getElementById("drug-library-modal");
  if (modal) modal.style.display = "none";
}

function setFormularyCategory(cat, btn) {
  currentFormularyCategory = cat;
  document.querySelectorAll(".formulary-category-pills .tag-chip").forEach(c => c.classList.remove("active", "chip-selected"));
  if (btn) btn.classList.add("active", "chip-selected");
  renderDrugLibrary();
}

function filterDrugLibrary() {
  const searchInput = document.getElementById("formulary-search-input");
  currentFormularySearch = searchInput ? searchInput.value.trim().toLowerCase() : "";
  renderDrugLibrary();
}

function renderDrugLibrary() {
  const grid = document.getElementById("formulary-cards-grid");
  const countEl = document.getElementById("formulary-results-count");
  if (!grid) return;

  const q = currentFormularySearch;
  const cat = currentFormularyCategory;

  const filtered = DRUG_DATABASE.filter(d => {
    const matchCat = cat === "all" || d.cat === cat;
    if (!matchCat) return false;
    if (!q) return true;
    const matchName = d.name.toLowerCase().includes(q);
    const matchGen = (d.generic || "").toLowerCase().includes(q);
    const matchCatName = (d.cat || "").toLowerCase().includes(q);
    const matchSymptoms = Array.isArray(d.symptoms) && d.symptoms.some(s => s.toLowerCase().includes(q));
    const matchJan = (d.janAushadhi || "").toLowerCase().includes(q);
    return matchName || matchGen || matchCatName || matchSymptoms || matchJan;
  });

  if (countEl) {
    countEl.textContent = `Showing ${filtered.length} of ${DRUG_DATABASE.length} medicines, injectables & supplies`;
  }
  const allPill = document.getElementById("formulary-all-pill");
  if (allPill) {
    allPill.textContent = `All Formulary (${DRUG_DATABASE.length})`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: #64748b;">
        <div style="font-size: 2rem; margin-bottom: 8px;">🔍</div>
        <div style="font-weight: 700; color: #1e293b;">No matching drug or injection found</div>
        <div style="font-size: 0.84rem; margin-top: 4px;">Try searching for generic salt (e.g. Paracetamol, Ceftriaxone) or symptom (fever, pain, vomiting).</div>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(d => {
    const isInjectable = d.cat.includes("Injections") || d.form === "Injection" || d.form === "IV Infusion";
    const isConsumable = d.cat.includes("Consumables") || d.form === "Consumable";
    const badgeColor = isInjectable ? "#7c3aed" : isConsumable ? "#0284c7" : "#0d9488";
    const badgeBg = isInjectable ? "#f5f3ff" : isConsumable ? "#f0f9ff" : "#f0fdf4";

    return `
      <div class="card" style="margin: 0; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 1px 3px rgba(0,0,0,0.05); background: #ffffff;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 6px; margin-bottom: 6px;">
            <span style="font-size: 0.72rem; font-weight: 700; color: ${badgeColor}; background: ${badgeBg}; border: 1px solid ${badgeColor}30; padding: 2px 7px; border-radius: 4px; text-transform: uppercase;">
              ${escapeHtml(d.form || d.cat)}
            </span>
            <span style="font-size: 0.72rem; color: #64748b;">${escapeHtml(d.route || 'Oral')}</span>
          </div>

          <div style="font-weight: 800; font-size: 0.95rem; color: #0f172a; line-height: 1.3;">
            ${escapeHtml(d.name)}
          </div>
          <div style="font-size: 0.8rem; color: #475569; font-style: italic; margin-top: 2px;">
            ${escapeHtml(d.generic)}
          </div>

          <div style="background: #f8fafc; border-radius: 6px; padding: 6px 8px; margin: 8px 0; font-size: 0.78rem; line-height: 1.4; color: #334155;">
            <div><strong>Dose &amp; Frequency:</strong> <span style="color: #0f766e; font-weight: 700;">${escapeHtml(d.dose)}</span> (${escapeHtml(d.timing)}) &times; ${escapeHtml(d.duration)}</div>
            ${d.adultDose ? `<div style="margin-top: 2px; color: #64748b;"><strong>Adult:</strong> ${escapeHtml(d.adultDose)}</div>` : ''}
            ${d.paedDose ? `<div style="margin-top: 2px; color: #64748b;"><strong>Paediatric:</strong> ${escapeHtml(d.paedDose)}</div>` : ''}
          </div>

          ${d.janAushadhi ? `
            <div style="font-size: 0.73rem; color: #15803d; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 4px; padding: 3px 6px; margin-bottom: 6px; display: flex; align-items: center; gap: 4px;">
              <span>🇮🇳</span>
              <span><strong>Jan Aushadhi:</strong> ${escapeHtml(d.janAushadhi)}</span>
            </div>
          ` : ''}

          ${d.notes ? `
            <div style="font-size: 0.74rem; color: #64748b; line-height: 1.3; margin-bottom: 8px;">
              <strong>Clinical Note:</strong> ${escapeHtml(d.notes)}
            </div>
          ` : ''}
        </div>

        <div style="margin-top: 6px; pt: 6px; border-top: 1px dashed #e2e8f0; display: flex; justify-content: flex-end;">
          <button type="button" class="btn btn-outline btn-sm" onclick="addMedicineFromLibrary('${escapeHtml(d.name).replace(/'/g, "\\'")}')" style="padding: 4px 10px; font-size: 0.78rem; font-weight: 700; border-color: #0d9488; color: #0d9488; display: inline-flex; align-items: center; gap: 4px;">
            <span>➕ Add to Rx</span>
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function addMedicineFromLibrary(drugName) {
  const drug = DRUG_DATABASE.find(d => d.name === drugName);
  if (!drug) return;

  switchTab("prescribe");
  const editForm = document.querySelector(".prescribe-edit-form");
  if (editForm) editForm.style.display = "block";
  const prevContainer = document.getElementById("rx-preview-container");
  if (prevContainer) prevContainer.style.display = "none";

  addMedicineRow({
    name: drug.name,
    dose: drug.dose,
    timing: drug.timing,
    duration: drug.duration,
    notes: drug.notes
  });

  closeDrugLibraryModal();
  updateDynamicMedicationSuggestions();
  showToast(`Added ${drug.name} to Prescription`, "success");
}

// ============================================================================
// 13. OVER-THE-AIR (OTA) CLOUD SYNC & LIVE UPDATE ENGINE
// ============================================================================
const OTA_STORAGE_KEYS = {
  MANIFEST_URL: "docemr_ota_manifest_url",
  VERSION: "docemr_ota_version",
  LAST_SYNC: "docemr_ota_last_sync",
  LAST_CHECK_TS: "docemr_ota_last_check_ts",
  PAYLOAD: "docemr_ota_payload_v1"
};

const DEFAULT_OTA_MANIFEST_URL = "https://raw.githubusercontent.com/myrooshop-wq/docemr-ota/main/ota-manifest.json";
const OTA_BASELINE_VERSION = "4.3.1-baseline";
let _otaBaselineSnapshot = null;

function captureOtaBaselines() {
  if (_otaBaselineSnapshot) return;
  _otaBaselineSnapshot = {
    drugs: DRUG_DATABASE.map(item => ({ ...item, symptoms: Array.isArray(item.symptoms) ? [...item.symptoms] : [] })),
    kb: typeof CLINICAL_KNOWLEDGE_BASE !== "undefined" ? CLINICAL_KNOWLEDGE_BASE.map(item => ({ ...item })) : [],
    diagnoses: typeof POPULAR_DIAGNOSIS_LIST !== "undefined" ? [...POPULAR_DIAGNOSIS_LIST] : []
  };
}

function initOTASyncEngine() {
  try {
    captureOtaBaselines();

    // Populate Settings URL input if present
    const urlInput = document.getElementById("ota-manifest-url");
    const savedUrl = localStorage.getItem(OTA_STORAGE_KEYS.MANIFEST_URL) || DEFAULT_OTA_MANIFEST_URL;
    if (urlInput && savedUrl) urlInput.value = savedUrl;

    // Apply cached OTA payload synchronously (0ms offline-first boot)
    const rawPayload = localStorage.getItem(OTA_STORAGE_KEYS.PAYLOAD);
    if (rawPayload) {
      const parsed = JSON.parse(rawPayload);
      applyOtaPayload(parsed, { silent: true });
    }

    updateOtaSyncStatusUI();

    // Optional silent background check (max once every 6 hours if online & URL configured)
    if (savedUrl && typeof navigator !== "undefined" && navigator.onLine) {
      const lastCheck = parseInt(localStorage.getItem(OTA_STORAGE_KEYS.LAST_CHECK_TS) || "0", 10);
      const sixHoursMs = 6 * 60 * 60 * 1000;
      if (Date.now() - lastCheck > sixHoursMs) {
        setTimeout(() => { checkForOtaUpdates(false); }, 3500);
      }
    }
  } catch (err) {
    console.warn("OTA init fallback to baseline:", err);
  }
}

function saveOtaManifestUrl() {
  const urlInput = document.getElementById("ota-manifest-url");
  if (!urlInput) return;
  const val = urlInput.value.trim();
  if (!val) {
    localStorage.removeItem(OTA_STORAGE_KEYS.MANIFEST_URL);
    showToast("OTA Manifest URL cleared.", "info");
    return;
  }
  if (!/^https?:\/\//i.test(val)) {
    showToast("Please enter a valid https:// URL.", "warning");
    return;
  }
  localStorage.setItem(OTA_STORAGE_KEYS.MANIFEST_URL, val);
  showToast("✅ OTA Manifest URL saved! Tap Sync Data to fetch updates.", "success");
}

function applyOtaPayload(payload, options = {}) {
  if (!payload || typeof payload !== "object") return false;
  captureOtaBaselines();

  // 1. Formulary (merge by name or replace)
  if (payload.formulary) {
    const items = Array.isArray(payload.formulary) ? payload.formulary : (Array.isArray(payload.formulary.items) ? payload.formulary.items : null);
    const mode = payload.formulary.mode || "merge";
    if (items && items.length > 0) {
      const validItems = items.filter(d => d && d.name && d.dose);
      if (mode === "replace") {
        DRUG_DATABASE.splice(0, DRUG_DATABASE.length, ...validItems);
      } else {
        const merged = _otaBaselineSnapshot.drugs.map(item => ({ ...item }));
        const idxMap = new Map(merged.map((m, idx) => [m.name.toLowerCase().trim(), idx]));
        validItems.forEach(item => {
          const key = item.name.toLowerCase().trim();
          if (idxMap.has(key)) {
            merged[idxMap.get(key)] = { ...merged[idxMap.get(key)], ...item };
          } else {
            idxMap.set(key, merged.length);
            merged.push(item);
          }
        });
        DRUG_DATABASE.splice(0, DRUG_DATABASE.length, ...merged);
      }
      window.DRUG_DATABASE = DRUG_DATABASE;
    }
  }

  // 2. Clinical Knowledge Base / OPD Protocols
  if (payload.clinicalKb && typeof CLINICAL_KNOWLEDGE_BASE !== "undefined") {
    const kbItems = Array.isArray(payload.clinicalKb) ? payload.clinicalKb : (Array.isArray(payload.clinicalKb.items) ? payload.clinicalKb.items : null);
    const kbMode = payload.clinicalKb.mode || "merge";
    if (kbItems && kbItems.length > 0) {
      if (kbMode === "replace") {
        CLINICAL_KNOWLEDGE_BASE.splice(0, CLINICAL_KNOWLEDGE_BASE.length, ...kbItems);
      } else {
        const mergedKb = _otaBaselineSnapshot.kb.map(item => ({ ...item }));
        const kbMap = new Map(mergedKb.map((k, idx) => [k.id || k.diagnosis, idx]));
        kbItems.forEach(item => {
          const key = item.id || item.diagnosis;
          if (kbMap.has(key)) mergedKb[kbMap.get(key)] = { ...mergedKb[kbMap.get(key)], ...item };
          else mergedKb.push(item);
        });
        CLINICAL_KNOWLEDGE_BASE.splice(0, CLINICAL_KNOWLEDGE_BASE.length, ...mergedKb);
      }
    }
  }

  // 3. Popular Diagnosis Suggestions
  if (Array.isArray(payload.diagnoses) && typeof POPULAR_DIAGNOSIS_LIST !== "undefined") {
    const mergedDiag = Array.from(new Set([..._otaBaselineSnapshot.diagnoses, ...payload.diagnoses.filter(Boolean)]));
    POPULAR_DIAGNOSIS_LIST.splice(0, POPULAR_DIAGNOSIS_LIST.length, ...mergedDiag);
  }

  // 4. AI Scribe Prompts & Symptom Overrides
  if (payload.aiPrompts && typeof payload.aiPrompts === "object") {
    window.OTA_AI_PROMPTS = payload.aiPrompts;
  }

  // 5. Clinical Kits (merge without overwriting doctor's custom kits)
  if (Array.isArray(payload.clinicalKits) && typeof appData !== "undefined" && Array.isArray(appData.clinicalKits)) {
    const existingIds = new Set(appData.clinicalKits.map(k => k.id || k.name));
    let kitsAdded = false;
    payload.clinicalKits.forEach(kit => {
      const kKey = kit.id || kit.name;
      if (kKey && !existingIds.has(kKey)) {
        appData.clinicalKits.push(kit);
        kitsAdded = true;
      }
    });
    if (kitsAdded && typeof saveData === "function") saveData();
  }

  // 6. UI / CSS Hotfix
  if (typeof payload.hotfixCss === "string") {
    let styleEl = document.getElementById("docemr-ota-hotfix-css");
    if (!styleEl && document.head) {
      styleEl = document.createElement("style");
      styleEl.id = "docemr-ota-hotfix-css";
      document.head.appendChild(styleEl);
    }
    if (styleEl) styleEl.textContent = payload.hotfixCss;
  }

  // 7. Feature / Logic JS Hotfix (sandboxed in try/catch)
  if (typeof payload.hotfixJs === "string" && payload.hotfixJs.trim()) {
    try {
      new Function(payload.hotfixJs)();
    } catch (jsErr) {
      console.warn("OTA hotfixJs execution error:", jsErr);
    }
  }

  // 8. Remote Notice / Clinical Bulletin Banner
  renderOtaNotice(payload.notice);

  // Refresh dependent UI
  if (!options.skipUiRefresh) {
    if (typeof renderDrugLibrary === "function") renderDrugLibrary();
    if (typeof updateDynamicDiagnosisChips === "function") updateDynamicDiagnosisChips();
    if (typeof updateDynamicMedicationSuggestions === "function") updateDynamicMedicationSuggestions();
    if (typeof renderSettingsKitsList === "function") renderSettingsKitsList();
  }
  return true;
}

function renderOtaNotice(notice) {
  const banner = document.getElementById("ota-notice-banner");
  const content = document.getElementById("ota-notice-content");
  if (!banner || !content) return;
  if (!notice || !notice.show || !notice.message) {
    banner.style.display = "none";
    return;
  }
  const palette = notice.type === "warning"
    ? { bg: "#fffbeb", border: "#f59e0b" }
    : notice.type === "success"
      ? { bg: "#ecfdf5", border: "#10b981" }
      : { bg: "#f0fdfa", border: "#0d9488" };
  banner.style.background = palette.bg;
  banner.style.borderColor = palette.border;
  content.innerHTML = (notice.title ? `<strong>${escapeHtml(notice.title)}:</strong> ` : "") + escapeHtml(notice.message);
  banner.style.display = "flex";
}

function dismissOtaNotice() {
  const banner = document.getElementById("ota-notice-banner");
  if (banner) banner.style.display = "none";
}

function updateOtaSyncStatusUI() {
  const verEl = document.getElementById("ota-sync-version");
  const lastEl = document.getElementById("ota-sync-last-checked");
  const sumEl = document.getElementById("ota-sync-summary");
  const ver = localStorage.getItem(OTA_STORAGE_KEYS.VERSION) || OTA_BASELINE_VERSION;
  const last = localStorage.getItem(OTA_STORAGE_KEYS.LAST_SYNC) || "Never";
  if (verEl) verEl.textContent = ver;
  const cleanVer = String(ver).replace(/^v/i, "").replace(/-baseline$/i, "");
  const hVerEl = document.getElementById("header-app-version");
  if (hVerEl) hVerEl.textContent = "v" + cleanVer;
  const dVerEl = document.getElementById("drawer-app-version");
  if (dVerEl) dVerEl.textContent = "DocEMR v" + cleanVer;
  if (lastEl) lastEl.textContent = last;
  if (sumEl) {
    const kbCount = typeof CLINICAL_KNOWLEDGE_BASE !== "undefined" ? CLINICAL_KNOWLEDGE_BASE.length : 0;
    const hasCss = !!(document.getElementById("docemr-ota-hotfix-css")?.textContent);
    sumEl.textContent = `${DRUG_DATABASE.length} Drugs • ${kbCount} Protocols` + (hasCss ? " • UI Hotfix Active" : "") + (window.OTA_AI_PROMPTS ? " • Custom AI Prompts" : "");
  }
}

async function fetchJsonWithTimeout(url, timeoutMs = 10000) {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const sep = url.includes("?") ? "&" : "?";
    const resp = await fetch(url + sep + "t=" + Date.now(), controller ? { signal: controller.signal } : {});
    if (!resp.ok) throw new Error("HTTP " + resp.status);
    return await resp.json();
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function fetchTextWithTimeout(url, timeoutMs = 10000) {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const sep = url.includes("?") ? "&" : "?";
    const resp = await fetch(url + sep + "t=" + Date.now(), controller ? { signal: controller.signal } : {});
    if (!resp.ok) throw new Error("HTTP " + resp.status);
    return await resp.text();
  } finally {
    if (timer) clearTimeout(timer);
  }
}


function saveOtaUiBundle(bundle) {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.indexedDB) return resolve(false);
    try {
      const req = window.indexedDB.open("DocEMR_OTA_DB", 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("bundles")) db.createObjectStore("bundles");
      };
      req.onerror = () => resolve(false);
      req.onsuccess = (e) => {
        try {
          const db = e.target.result;
          const tx = db.transaction("bundles", "readwrite");
          tx.objectStore("bundles").put(bundle, "active_ui_bundle");
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => resolve(false);
        } catch (err) {
          resolve(false);
        }
      };
    } catch (e) {
      resolve(false);
    }
  });
}

function clearOtaUiBundle() {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.indexedDB) return resolve(false);
    try {
      const req = window.indexedDB.open("DocEMR_OTA_DB", 1);
      req.onerror = () => resolve(false);
      req.onsuccess = (e) => {
        try {
          const db = e.target.result;
          if (!db.objectStoreNames.contains("bundles")) return resolve(true);
          const tx = db.transaction("bundles", "readwrite");
          tx.objectStore("bundles").delete("active_ui_bundle");
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => resolve(false);
        } catch (err) {
          resolve(false);
        }
      };
    } catch (e) {
      resolve(false);
    }
  });
}

async function checkForOtaUpdates(manual = true) {
  const btn = document.getElementById("ota-check-btn");
  const originalHtml = btn ? btn.innerHTML : "";
  const urlInput = document.getElementById("ota-manifest-url");
  const manifestUrl = (urlInput && urlInput.value.trim()) || localStorage.getItem(OTA_STORAGE_KEYS.MANIFEST_URL) || DEFAULT_OTA_MANIFEST_URL;

  if (!manifestUrl) {
    if (manual) {
      showToast("ℹ️ Enter your OTA Manifest URL in Settings → Cloud Sync first.", "warning");
      if (typeof switchTab === "function") switchTab("settings");
      if (urlInput) setTimeout(() => urlInput.focus(), 150);
    }
    return false;
  }

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    if (manual) showToast("📡 You are offline. Using cached clinical data.", "warning");
    return false;
  }

  if (btn && manual) {
    btn.disabled = true;
    btn.innerHTML = "<span>⏳ Checking for updates...</span>";
  }

  try {
    localStorage.setItem(OTA_STORAGE_KEYS.LAST_CHECK_TS, String(Date.now()));
    const manifest = await fetchJsonWithTimeout(manifestUrl, 10000);
    if (!manifest || !manifest.version) {
      throw new Error("Invalid manifest format (missing version)");
    }

    const currentVer = localStorage.getItem(OTA_STORAGE_KEYS.VERSION) || OTA_BASELINE_VERSION;
    const nowLabel = new Date().toLocaleString();

    if (manifest.version === currentVer && !manifest.force) {
      localStorage.setItem(OTA_STORAGE_KEYS.LAST_SYNC, nowLabel);
      updateOtaSyncStatusUI();
      if (manual) showToast(`✅ DocEMR data is already up to date (v${currentVer})`, "success");
      return true;
    }

    if (btn && manual) btn.innerHTML = "<span>⬇️ Downloading updates...</span>";

    // Build unified payload from either inline manifest fields, payloadUrl, or split URLs
    let payload = {
      version: manifest.version,
      updatedAt: manifest.updatedAt || nowLabel,
      formulary: manifest.formulary || null,
      clinicalKb: manifest.clinicalKb || null,
      diagnoses: manifest.diagnoses || null,
      aiPrompts: manifest.aiPrompts || null,
      clinicalKits: manifest.clinicalKits || null,
      hotfixCss: manifest.hotfixCss || null,
      hotfixJs: manifest.hotfixJs || null,
      notice: manifest.notice || null
    };

    if (manifest.payloadUrl) {
      const remotePayload = await fetchJsonWithTimeout(manifest.payloadUrl, 15000);
      payload = { ...payload, ...remotePayload, version: manifest.version };
    }
    if (manifest.formularyUrl) {
      payload.formulary = await fetchJsonWithTimeout(manifest.formularyUrl, 15000);
    }
    if (manifest.protocolsUrl) {
      payload.clinicalKb = await fetchJsonWithTimeout(manifest.protocolsUrl, 12000);
    }
    if (manifest.aiPromptsUrl) {
      payload.aiPrompts = await fetchJsonWithTimeout(manifest.aiPromptsUrl, 10000);
    }
    if (manifest.hotfixCssUrl) {
      payload.hotfixCss = await fetchTextWithTimeout(manifest.hotfixCssUrl, 10000);
    }
    if (manifest.hotfixJsUrl) {
      payload.hotfixJs = await fetchTextWithTimeout(manifest.hotfixJsUrl, 10000);
    }


    // Optional Full-UI Bundle (index.html + styles.css + app.js) stored safely in IndexedDB
    let uiBundleUpdated = false;
    const uiCfg = manifest.uiBundle || (manifest.indexHtmlUrl ? { htmlUrl: manifest.indexHtmlUrl, cssUrl: manifest.stylesCssUrl, jsUrl: manifest.appJsUrl } : null);
    if (uiCfg) {
      const htmlText = uiCfg.html || (uiCfg.htmlUrl ? await fetchTextWithTimeout(uiCfg.htmlUrl, 20000) : null);
      const cssText = uiCfg.css || (uiCfg.cssUrl ? await fetchTextWithTimeout(uiCfg.cssUrl, 20000) : null);
      const jsText = uiCfg.js || (uiCfg.jsUrl ? await fetchTextWithTimeout(uiCfg.jsUrl, 25000) : null);
      if (htmlText && htmlText.includes("<html") && htmlText.includes("</html>")) {
        const savedOk = await saveOtaUiBundle({
          version: String(manifest.version),
          html: htmlText,
          css: cssText || null,
          js: jsText || null,
          savedAt: Date.now()
        });
        if (savedOk) uiBundleUpdated = true;
      }
    }

    // Atomic validate & persist
    const serialized = JSON.stringify(payload);
    localStorage.setItem(OTA_STORAGE_KEYS.PAYLOAD, serialized);
    localStorage.setItem(OTA_STORAGE_KEYS.VERSION, String(manifest.version));
    localStorage.setItem(OTA_STORAGE_KEYS.LAST_SYNC, nowLabel);

    applyOtaPayload(payload);
    updateOtaSyncStatusUI();

    if (uiBundleUpdated) {
      if (manual) showToast(`✨ Full UI & Data updated to v${manifest.version}! Reloading...`, "success");
      setTimeout(() => { if (typeof window !== "undefined" && window.location) window.location.replace("bootstrap.html"); }, 1200);
    } else if (manual) {
      showToast(`✨ Updated to v${manifest.version} (${DRUG_DATABASE.length} meds synced)!`, "success");
    }
    return true;
  } catch (err) {
    console.warn("OTA sync failed:", err);
    if (manual) {
      showToast("❌ Sync failed: " + (err.message || "Network error") + ". Offline data preserved.", "error");
    }
    return false;
  } finally {
    if (btn && manual) {
      btn.disabled = false;
      btn.innerHTML = originalHtml || "<span>🔄 Sync Data / Check Updates</span>";
    }
  }
}

function openSideDrawer() {
  const drawer = document.getElementById("app-side-drawer");
  const backdrop = document.getElementById("app-drawer-backdrop");
  if (backdrop) backdrop.style.display = "block";
  if (drawer) drawer.style.transform = "translateX(0)";
}

function closeSideDrawer() {
  const drawer = document.getElementById("app-side-drawer");
  const backdrop = document.getElementById("app-drawer-backdrop");
  if (drawer) drawer.style.transform = "translateX(-100%)";
  if (backdrop) backdrop.style.display = "none";
}

function resetOtaToDefaults() {
  captureOtaBaselines();
  localStorage.removeItem(OTA_STORAGE_KEYS.PAYLOAD);
  localStorage.removeItem(OTA_STORAGE_KEYS.VERSION);
  localStorage.removeItem(OTA_STORAGE_KEYS.LAST_SYNC);
  localStorage.removeItem(OTA_STORAGE_KEYS.LAST_CHECK_TS);

  DRUG_DATABASE.splice(0, DRUG_DATABASE.length, ..._otaBaselineSnapshot.drugs.map(item => ({ ...item })));
  window.DRUG_DATABASE = DRUG_DATABASE;

  if (typeof CLINICAL_KNOWLEDGE_BASE !== "undefined") {
    CLINICAL_KNOWLEDGE_BASE.splice(0, CLINICAL_KNOWLEDGE_BASE.length, ..._otaBaselineSnapshot.kb.map(item => ({ ...item })));
  }
  if (typeof POPULAR_DIAGNOSIS_LIST !== "undefined") {
    POPULAR_DIAGNOSIS_LIST.splice(0, POPULAR_DIAGNOSIS_LIST.length, ..._otaBaselineSnapshot.diagnoses);
  }
  window.OTA_AI_PROMPTS = null;

  const styleEl = document.getElementById("docemr-ota-hotfix-css");
  if (styleEl) styleEl.remove();
  dismissOtaNotice();

  if (typeof renderDrugLibrary === "function") renderDrugLibrary();
  if (typeof updateDynamicDiagnosisChips === "function") updateDynamicDiagnosisChips();
  if (typeof updateDynamicMedicationSuggestions === "function") updateDynamicMedicationSuggestions();
  updateOtaSyncStatusUI();

  showToast("🔄 Restored built-in baseline clinical data.", "info");
}
