/**
 * Internationalization (English & Hindi) dictionary
 */

export const translations = {
  en: {
    app_title: "Invisible Queue",
    app_subtitle: "Smart Waiting-Time & Crowd Intelligence for Public Services",
    tagline: "Make the queue visible and predictable before you leave home.",
    citizen_portal: "Citizen View",
    org_portal: "Hospital Dashboard",
    select_location: "Select Facility / Hospital",
    select_service: "Select Service / Counter",
    loading: "Loading wait times...",
    failed_load: "Unable to load data. Please retry.",
    retry: "Retry",
    
    // Status Card
    current_crowd: "Current Crowd Status",
    estimated_wait: "Estimated Waiting Time",
    expected_range: "Expected Range",
    confidence: "Prediction Confidence",
    confidence_explanation: "Confidence Score Breakdown",
    data_source: "Data Origin",
    last_updated: "Last Updated",
    minutes: "mins",
    hours: "hours",
    
    // Tiers
    tier_low: "Low Crowd",
    tier_moderate: "Moderate Crowd",
    tier_high: "High Crowd",
    tier_very_high: "Very High Crowd",
    conf_low: "Low",
    conf_medium: "Moderate",
    conf_high: "High",

    // Warnings & Recommendations
    warning_title: "Service Schedule Alert",
    planner_title: "Smart Visit Window",
    recommended_time: "Recommended Visit Window",
    why_recommended: "Why this time?",
    closing_warning: "Warning: High risk of counters closing before you reach the front of the line.",
    
    // Reporting
    submit_report_cta: "At the hospital? Submit Crowd Observation",
    report_modal_title: "Submit Live Observation",
    report_modal_desc: "Help fellow citizens plan their visit. Submissions are 100% anonymous.",
    crowd_prompt: "How crowded is the waiting area right now?",
    wait_prompt: "Approximate waiting time observed (optional):",
    submit_btn: "Submit Observation",
    submitting: "Submitting...",
    report_success: "Observation submitted successfully!",
    report_impact: "Real-time impact:",

    // Org Dashboard
    org_login_title: "Hospital Staff / Administrative Login",
    org_login_subtitle: "Access live crowd monitors, hourly peak analytics, and capacity management tools.",
    login_btn: "Sign In to Dashboard",
    hourly_trend_title: "Today's Hourly Congestion Pattern",
    peak_hours_title: "Peak Congestion & Resource Alerts",
    active_reports_title: "Live Citizen Reports Stream",
    service_capacity: "Est. Capacity / Hour",
    status_overview: "Operational Status",
    logout: "Sign Out"
  },
  hi: {
    app_title: "अदृश्य कतार (Invisible Queue)",
    app_subtitle: "सरकारी अस्पतालों और सेवाओं के लिए प्रतीक्षारत समय और भीड़ का स्मार्ट अनुमान",
    tagline: "घर से निकलने से पहले कतार और समय की सही स्थिति जानें।",
    citizen_portal: "नागरिक सेवा",
    org_portal: "अस्पताल डैशबोर्ड",
    select_location: "अस्पताल या स्वास्थ्य केंद्र चुनें",
    select_service: "सेवा या काउंटर चुनें",
    loading: "डेटा लोड हो रहा है...",
    failed_load: "डेटा लोड करने में असमर्थ। कृपया पुनः प्रयास करें।",
    retry: "पुनः प्रयास करें",
    
    // Status Card
    current_crowd: "वर्तमान भीड़ की स्थिति",
    estimated_wait: "अनुमानित प्रतीक्षा समय",
    expected_range: "अनुमानित समय सीमा",
    confidence: "अनुमान की सटीकता (विश्वास स्कोर)",
    confidence_explanation: "विश्वास स्कोर का विवरण",
    data_source: "डेटा का स्रोत",
    last_updated: "अंतिम अपडेट",
    minutes: "मिनट",
    hours: "घंटे",
    
    // Tiers
    tier_low: "कम भीड़",
    tier_moderate: "सामान्य भीड़",
    tier_high: "अधिक भीड़",
    tier_very_high: "अत्यधिक भीड़",
    conf_low: "कम",
    conf_medium: "मध्यम",
    conf_high: "उच्च",

    // Warnings & Recommendations
    warning_title: "काउंटर समय चेतावनी",
    planner_title: "सुझाया गया उपयुक्त समय",
    recommended_time: "आने का सबसे उपयुक्त समय",
    why_recommended: "यह समय क्यों उपयुक्त है?",
    closing_warning: "सावधानी: काउंटर बंद होने से पहले बारी न आने का उच्च जोखिम है।",
    
    // Reporting
    submit_report_cta: "क्या आप अस्पताल में हैं? भीड़ की स्थिति साझा करें",
    report_modal_title: "भीड़ की स्थिति दर्ज करें",
    report_modal_desc: "अन्य नागरिकों की मदद करें। आपकी रिपोर्ट पूरी तरह से गोपनीय और अज्ञात है।",
    crowd_prompt: "प्रतीक्षा क्षेत्र में अभी कितनी भीड़ है?",
    wait_prompt: "अनुमानित प्रतीक्षा समय (वैकल्पिक):",
    submit_btn: "स्थिति सबमिट करें",
    submitting: "भेजा जा रहा है...",
    report_success: "आपकी रिपोर्ट सफलतापूर्वक दर्ज कर ली गई है!",
    report_impact: "अनुमान पर तात्कालिक प्रभाव:",

    // Org Dashboard
    org_login_title: "अस्पताल प्रशासन / स्टाफ लॉगिन",
    org_login_subtitle: "भीड़ निगरानी, व्यस्ततम घंटों का विश्लेषण और संसाधन प्रबंधन देखें।",
    login_btn: "डैशबोर्ड में प्रवेश करें",
    hourly_trend_title: "आज का प्रति घंटा भीड़ पैटर्न",
    peak_hours_title: "व्यस्ततम घंटे और काउंटर चेतावनी",
    active_reports_title: "नागरिकों द्वारा भेजी गई लाइव रिपोर्ट",
    service_capacity: "प्रति घंटा सेवा क्षमता",
    status_overview: "सक्रिय स्थिति",
    logout: "लॉगआउट"
  }
};
