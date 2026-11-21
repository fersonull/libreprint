"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "fil";

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    brand: "libreprint",
    brand_tagline: "Local Print Service",
    upload_nav: "Upload Docs",
    staff_nav: "Staff Desk",
    upload_title: "Submit Documents for Printing",
    upload_subtitle: "Upload your files and get an instant paper claim ticket to track your printing progress.",
    full_name: "Your Full Name",
    name_hint: "This name will be announced at the counter when your prints are ready.",
    name_placeholder: "e.g. Maria Santos",
    select_docs: "Select Documents to Print",
    drag_drop_title: "Click to upload or drag and drop",
    drag_drop_subtitle: "PDF, Word (DOCX), PNG, JPG • Up to 50 MB each",
    selected_docs: "Documents Selected",
    clear_all: "Clear all",
    paper_size: "Paper Size",
    copies: "Copies",
    color_mode: "Color Mode",
    bw: "B&W",
    color: "Color",
    orientation: "Orientation",
    portrait: "Portrait",
    landscape: "Landscape",
    duplex: "Print Sidedness",
    single_sided: "Single-sided",
    double_sided: "Back-to-Back",
    notes_label: "Special Instructions / Notes",
    notes_placeholder: "e.g. Staple top-left, page 1-3 only, thick paper...",
    submit_ticket: "Create Print Ticket",
    find_ticket_title: "Already submitted a document?",
    ticket_code_label: "Ticket code",
    ticket_code_placeholder: "Enter your code, e.g. PQ-4819",
    find_ticket_button: "Find ticket",
    submitting: "Submitting to Queue...",
    // Ticket page
    ticket_title: "Paper Claim Ticket",
    ticket_subtitle: "Keep this ticket stub open to watch live progress.",
    copy_code: "Copy Code",
    copied: "Copied",
    copy_failed: "Could not copy code",
    prepared_for: "Prepared for",
    submitted_at: "Submitted at",
    progress: "Print Progress",
    all_ready: "All Documents Ready for Pickup",
    currently_printing: "Currently Printing Documents",
    queued_status: "Waiting in Print Queue",
    how_to_collect_title: "How to claim your documents",
    how_to_collect_body: "Present your paper claim ticket code to the counter staff when collecting your printed sheets.",
    submit_another: "Submit another document",
    // Staff Desk
    desk_title: "Staff Print Desk",
    desk_subtitle: "Manage document queue, preview files, and print on demand.",
    queued_kpi: "Queued Documents",
    printing_kpi: "Currently Printing",
    completed_kpi: "Completed Prints",
    total_tickets_kpi: "Total Tickets",
    all_tickets_tab: "All Tickets",
    queued_tab: "Queued",
    printing_tab: "Printing",
    completed_tab: "Completed",
    search_placeholder: "Search ticket code or client name...",
    open_and_print: "Open & Print",
    open_all: "Open All to Print",
    mark_printing: "Mark Printing",
    mark_done: "Mark Done",
    mark_all_done: "Mark All Done",
    cancel_btn: "Cancel",
    confirm_cancel_title: "Cancel Document?",
    confirm_cancel_msg: "This operation cannot be undone. Are you sure you want to cancel this print job?",
    keep_btn: "Keep Document",
    confirm_cancel_action: "Yes, Cancel Document",
    sign_in_title: "Staff Desk Login",
    sign_in_subtitle: "Enter the local staff password to manage incoming print queues.",
    password_label: "Access Password",
    sign_in_btn: "Sign In to Staff Desk",
    sign_out: "Sign Out",
    refresh: "Refresh Queue",
  },
  fil: {
    brand: "libreprint",
    brand_tagline: "Lokal na Serbisyo sa Pag-print",
    upload_nav: "Mag-upload",
    staff_nav: "Tanggapan ng Staff",
    upload_title: "Mag-print ng Dokumento",
    upload_subtitle: "I-upload ang iyong mga dokumento at kumuha agad ng paper claim ticket para masubaybayan ang pag-print.",
    full_name: "Iyong Buong Pangalan",
    name_hint: "Tatawagin ang pangalang ito sa counter kapag tapos na ang iyong print.",
    name_placeholder: "Hal. Juan Dela Cruz",
    select_docs: "Pumili ng mga Dokumentong Iimprinta",
    drag_drop_title: "Pindutin para pumili o i-drag and drop ang mga file",
    drag_drop_subtitle: "PDF, Word (DOCX), PNG, JPG • Hanggang 50 MB bawat file",
    selected_docs: "Mga Dokumentong Napili",
    clear_all: "Alisin lahat",
    paper_size: "Sukat ng Papel",
    copies: "Kopya",
    color_mode: "Kulay",
    bw: "Itim at Puti",
    color: "May Kulay",
    orientation: "Oryentasyon",
    portrait: "Patayo (Portrait)",
    landscape: "Pahiga (Landscape)",
    duplex: "Pagkaka-print",
    single_sided: "Isahang-Mukha",
    double_sided: "Likod-sa-Likod",
    notes_label: "Espesyal na Tagubilin / Paalala",
    notes_placeholder: "Hal. Paki-staple sa kaliwa, pahina 1 hanggang 5 lamang...",
    submit_ticket: "Kumuha ng Print Ticket",
    find_ticket_title: "Nakapagsumite na ng dokumento?",
    ticket_code_label: "Ticket code",
    ticket_code_placeholder: "Ilagay ang code, hal. PQ-4819",
    find_ticket_button: "Hanapin ang tiket",
    submitting: "Ipinapadala sa Pila...",
    // Ticket page
    ticket_title: "Papel na Claim Ticket",
    ticket_subtitle: "Panatilihing bukas ang tiket na ito upang masubaybayan ang takbo ng pag-print.",
    copy_code: "Kopyahin ang Code",
    copied: "Nakopya na",
    copy_failed: "Hindi nakopya ang code",
    prepared_for: "Para kay",
    submitted_at: "Oras ng pagsumite",
    progress: "Progreso ng Pag-print",
    all_ready: "Handa na Para Kunin sa Counter",
    currently_printing: "Kasalukuyang Iniimprenta ang Dokumento",
    queued_status: "Nasa Pila ng Pag-iimprenta",
    how_to_collect_title: "Paano kunin ang iyong mga print",
    how_to_collect_body: "Ipakita ang numero ng iyong claim ticket sa counter staff upang kunin ang iyong mga naimprentang papel.",
    submit_another: "Magsumite ng iba pang dokumento",
    // Staff Desk
    desk_title: "Tanggapan ng Staff",
    desk_subtitle: "Pamahalaan ang pila ng dokumento, i-preview ang mga file, at mag-print agad.",
    queued_kpi: "Nasa Pila",
    printing_kpi: "Iniimprenta",
    completed_kpi: "Tapos Na",
    total_tickets_kpi: "Kabuuang Tiket",
    all_tickets_tab: "Lahat ng Tiket",
    queued_tab: "Nasa Pila",
    printing_tab: "Iniimprenta",
    completed_tab: "Tapos Na",
    search_placeholder: "Maghanap ng ticket code o pangalan...",
    open_and_print: "Buksan at I-print",
    open_all: "Buksan Lahat Para I-print",
    mark_printing: "Gawing Iniimprenta",
    mark_done: "Gawing Tapos Na",
    mark_all_done: "Gawing Tapos Lahat",
    cancel_btn: "Kanselahin",
    confirm_cancel_title: "Kanselahin ang Dokumento?",
    confirm_cancel_msg: "Hindi na ito maibabalik kapag kinansela. Sigurado ka bang nais mong kanselahin ang trabahong ito?",
    keep_btn: "Huwag Kanselahin",
    confirm_cancel_action: "Oo, Kanselahin",
    sign_in_title: "Pag-login sa Tanggapan ng Staff",
    sign_in_subtitle: "Ipasok ang lokal na staff password upang pamahalaan ang mga print queue.",
    password_label: "Password ng Tanggapan",
    sign_in_btn: "Mag-sign In sa Tanggapan",
    sign_out: "Mag-sign Out",
    refresh: "I-refresh ang Pila",
  },
};

const I18nContext = createContext<I18nContextType>({
  lang: "en",
  setLang: () => {},
  t: (key: string) => key,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("libreprint_lang") as Language;
    if (saved === "en" || saved === "fil") {
      setLangState(saved);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("libreprint_lang", newLang);
  };

  const t = (key: string): string => {
    return translations[lang]?.[key] || translations.en[key] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
