// MW Hope Center — site behavior (LIVE backend version)
//
// SETUP REQUIRED before this works:
// 1. Add this script tag in <head> of every page, ABOVE this file's <script src="js/main.js">:
//      <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"><\/script>
// 2. Replace SUPABASE_URL and SUPABASE_ANON_KEY below with your real project values
//    (Supabase dashboard -> Settings -> API). The anon key is safe to expose in
//    frontend code — it can only do what your Row Level Security policies allow.

const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";

const supabaseClient = (window.supabase && SUPABASE_URL.includes("YOUR-PROJECT") === false)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Maps each form's id attribute to its Supabase table and a function that
// builds the row object from the form's fields.
const FORM_CONFIG = {
  "get-help-form": {
    table: "get_help_submissions",
    build: (fd) => ({
      name: fd.get("name"),
      email: fd.get("email") || null,
      phone: fd.get("phone"),
      contact_method: fd.get("contact_method"),
      county: fd.get("county"),
      best_time: fd.get("best_time") || null,
      assistance_type: fd.get("assistance_type"),
      housing_status: fd.get("housing_status") || null,
      description: fd.get("description"),
    }),
  },
  "volunteer-form": {
    table: "volunteer_applications",
    build: (fd, form) => ({
      name: fd.get("name"),
      address: fd.get("address"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      age_confirmation: fd.get("age_confirmation"),
      heard_about: fd.get("heard_about") || null,
      interest: Array.from(form.querySelector('[name="interest"]').selectedOptions).map(o => o.value).join(", "),
      availability: fd.get("availability") || null,
      group_type: fd.get("group_type") || null,
      skills: fd.get("skills") || null,
      experience_children: form.querySelector('[name="experience_children"]')?.checked || false,
      background_check_ack: true,
      code_of_conduct_ack: true,
    }),
  },
  "contact-form": {
    table: "contact_messages",
    build: (fd) => ({
      name: fd.get("name"),
      email: fd.get("email"),
      subject: fd.get("subject"),
      message: fd.get("message"),
    }),
  },
  "newsletter-form": {
    table: "newsletter_signups",
    build: (fd) => ({ email: fd.get("email") }),
  },
};

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Mobile nav ---------- */
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  const overlay = document.querySelector('.mobile-nav-overlay');
  const closeBtn = document.querySelector('.mobile-nav-close');

  function openMenu() {
    mobileNav.classList.add('open');
    overlay.classList.add('open');
    document.body.classList.add('nav-open');
    menuToggle.setAttribute('aria-expanded', 'true');
    const first = mobileNav.querySelector('a, button');
    if (first) first.focus();
  }
  function closeMenu() {
    mobileNav.classList.remove('open');
    overlay.classList.remove('open');
    document.body.classList.remove('nav-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.focus();
  }
  if (menuToggle && mobileNav) {
    menuToggle.addEventListener('click', () => {
      mobileNav.classList.contains('open') ? closeMenu() : openMenu();
    });
    overlay.addEventListener('click', closeMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileNav.classList.contains('open')) closeMenu();
    });
    mobileNav.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const focusables = mobileNav.querySelectorAll('a, button, input');
      if (!focusables.length) return;
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ---------- Desktop dropdowns ---------- */
  document.querySelectorAll('.has-drop').forEach(group => {
    const btn = group.querySelector('button');
    const dd = group.querySelector('.dropdown');
    if (!btn || !dd) return;
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');
    function setOpen(open) {
      group.setAttribute('data-open', open ? 'true' : 'false');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      dd.style.display = open ? 'block' : 'none';
    }
    setOpen(false);
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      setOpen(group.getAttribute('data-open') !== 'true');
    });
    document.addEventListener('click', (e) => {
      if (!group.contains(e.target)) setOpen(false);
    });
    group.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { setOpen(false); btn.focus(); }
    });
  });

  /* ---------- Back to top ---------- */
  const backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('show', window.scrollY > 600);
    });
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ---------- Forms: real Supabase submission ---------- */
  document.querySelectorAll('form[data-demo-form]').forEach(form => {
    const status = form.querySelector('.form-status');
    const config = FORM_CONFIG[form.id];

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (!status) return;

      if (!supabaseClient || !config) {
        status.className = 'form-status show error';
        status.textContent = 'This form is not yet connected. Please contact us directly.';
        console.warn('Supabase not configured, or no FORM_CONFIG entry for form id:', form.id);
        return;
      }

      status.className = 'form-status show loading';
      status.setAttribute('role', 'status');
      status.textContent = 'Sending…';

      const fd = new FormData(form);
      const row = config.build(fd, form);

      const { error } = await supabaseClient.from(config.table).insert(row);

      if (error) {
        console.error(error);
        status.className = 'form-status show error';
        status.textContent = "Something went wrong — please try again, or contact us directly.";
        return;
      }

      status.className = 'form-status show success';
      status.textContent = form.dataset.successMessage || "Thanks — we've received this and will be in touch soon.";
      form.reset();
    });
  });

  /* ---------- Donation tiers ---------- */
  const tierGroup = document.querySelector('[data-tier-group]');
  const segment = document.querySelector('[data-segment]');
  if (tierGroup) {
    const tiers = tierGroup.querySelectorAll('.tier');
    const customInput = tierGroup.querySelector('.tier.custom input');
    const submitBtn = document.querySelector('#donate-form button[type="submit"]');

    function selectTier(t) {
      tiers.forEach(x => x.setAttribute('aria-pressed', 'false'));
      t.setAttribute('aria-pressed', 'true');
      if (t.classList.contains('custom')) t.querySelector('input').focus();
      refresh();
    }
    function currentAmount() {
      const a = tierGroup.querySelector('.tier[aria-pressed="true"]');
      if (!a) return '50';
      if (a.classList.contains('custom')) {
        const v = a.querySelector('input').value.replace(/[^0-9]/g, '');
        return v || '0';
      }
      return a.querySelector('.amt').textContent.replace('$', '');
    }
    function currentFreq() {
      const a = segment && segment.querySelector('button[aria-pressed="true"]');
      return a && a.textContent.includes('Monthly') ? '/mo' : ' now';
    }
    function refresh() {
      if (submitBtn) submitBtn.textContent = 'Give $' + currentAmount() + currentFreq();
    }
    tiers.forEach(t => {
      t.addEventListener('click', () => selectTier(t));
      t.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectTier(t); }
      });
    });
    if (customInput) customInput.addEventListener('input', refresh);
    if (segment) {
      segment.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
        segment.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', 'false'));
        b.setAttribute('aria-pressed', 'true');
        refresh();
      }));
    }
    refresh();
  }
  // NOTE: the donate form submit itself is NOT wired here — see the
  // "Handle Donate separately" step. It needs a real payment processor
  // (Stripe/PayPal/Givebutter), not a database insert.
});
