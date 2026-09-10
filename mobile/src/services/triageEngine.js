import { SYMPTOMS_LIST } from '../utils/translations';

/**
 * Evaluates patient symptoms against NHM / Maharashtra CDSS guidelines.
 * @param {Array<string>} selectedSymptomIds - list of symptom IDs e.g. ['fever', 'chest_pain']
 * @param {string} duration - 'today' | 'days2_3' | 'week1' | 'moreThanWeek'
 * @returns {Object} Triage result with decision, urgency, matched flags, and recommendations
 */
export function evaluateTriage(selectedSymptomIds = [], duration = 'today') {
  const selectedSymptoms = SYMPTOMS_LIST.filter(s => selectedSymptomIds.includes(s.id));
  const redFlags = selectedSymptoms.filter(s => s.isRedFlag);

  // Criteria for Referral:
  // 1. Any direct red flag symptom
  // 2. High fever/cough lasting > 1 week without resolution
  // 3. Multimorbid presentation (e.g. 3+ acute symptoms)
  const isProtractedIllness = (selectedSymptomIds.includes('fever') || selectedSymptomIds.includes('cough')) && duration === 'moreThanWeek';
  const isMultiSymptom = selectedSymptomIds.length >= 3;

  if (redFlags.length > 0 || isProtractedIllness) {
    const reasons = [];
    if (redFlags.length > 0) {
      reasons.push(...redFlags.map(r => r.labelEn));
    }
    if (isProtractedIllness) {
      reasons.push("Protracted illness (> 1 week duration without relief)");
    }

    return {
      decision: "REFERRED",
      urgency: redFlags.some(r => ['chest_pain', 'unconsciousness', 'breathlessness'].includes(r.id)) ? "HIGH" : "MODERATE",
      reasons,
      selectedSymptoms,
      recommendedAction: "Issue referral to nearest PHC / Community Health Centre (CHC) via HFR registry. Pre-alert receiving facility.",
      medicinesPermitted: ["ORS sachet for hydration during transport"]
    };
  }

  // Criteria for Local Care
  return {
    decision: "LOCAL_CARE",
    urgency: "LOW",
    reasons: ["Mild to moderate symptoms without critical red flags"],
    selectedSymptoms,
    recommendedAction: "Provide standard NHM ASHA kit remedies, advise oral hydration and rest. Schedule follow-up visit in 48 hours.",
    medicinesPermitted: [
      "Paracetamol 500mg (1 tablet TDS for fever/pain)",
      "ORS Packets (1L water solution)",
      "Zinc Sulphate 20mg (for diarrhea)",
      "Iron Folic Acid (IFA) tablets"
    ]
  };
}
