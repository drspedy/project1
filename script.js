/* =========================================================
   Ember Studio — all interactive behaviour lives here.
   Plain vanilla JavaScript, no dependencies.
   ========================================================= */
(function () {
    'use strict';

    const $ = (selector, scope = document) => scope.querySelector(selector);
    const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scrollBehavior = reducedMotion ? 'auto' : 'smooth';
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    /* ---------- Toast notifications ---------- */
    const toast = $('#toast');
    const toastMessage = $('#toast-message');
    let toastTimer;

    function showToast(message) {
        toastMessage.textContent = message;
        toast.hidden = false;
        // Force a reflow so the entrance transition always runs.
        void toast.offsetWidth;
        toast.classList.add('is-visible');
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(function () {
            toast.classList.remove('is-visible');
            window.setTimeout(function () { toast.hidden = true; }, 300);
        }, 3200);
    }

    /* ---------- Light / dark theme ---------- */
    const root = document.documentElement;
    const themeToggle = $('#theme-toggle');

    function storedTheme() {
        try { return localStorage.getItem('ember-theme'); } catch (error) { return null; }
    }
    function saveTheme(theme) {
        try { localStorage.setItem('ember-theme', theme); } catch (error) { /* storage unavailable */ }
    }
    function applyTheme(theme) {
        const isDark = theme === 'dark';
        root.setAttribute('data-theme', theme);
        themeToggle.setAttribute('aria-pressed', String(isDark));
        themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
        saveTheme(theme);
    }

    const saved = storedTheme();
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(saved === 'dark' || saved === 'light' ? saved : (prefersDark ? 'dark' : 'light'));

    themeToggle.addEventListener('click', function () {
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        showToast(next === 'dark' ? 'Dark mode enabled.' : 'Light mode enabled.');
    });

    /* ---------- Mobile navigation ---------- */
    const menuToggle = $('#menu-toggle');
    const nav = $('#primary-nav');

    function openMenu() {
        nav.classList.add('is-open');
        menuToggle.setAttribute('aria-expanded', 'true');
        menuToggle.setAttribute('aria-label', 'Close navigation menu');
    }
    function closeMenu() {
        nav.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Open navigation menu');
    }

    menuToggle.addEventListener('click', function () {
        if (nav.classList.contains('is-open')) { closeMenu(); } else { openMenu(); }
    });
    $$('a', nav).forEach(function (link) { link.addEventListener('click', closeMenu); });
    document.addEventListener('click', function (event) {
        if (nav.classList.contains('is-open') && !event.target.closest('.site-header')) { closeMenu(); }
    });
    window.addEventListener('resize', function () {
        if (window.innerWidth > 900) { closeMenu(); }
    });

    /* ---------- Live local date and time (updates every second) ---------- */
    const dateEl = $('#clock-date');
    const timeEl = $('#clock-time');
    const zoneEl = $('#clock-zone');
    const dateFormatter = new Intl.DateTimeFormat(undefined, {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
    const timeFormatter = new Intl.DateTimeFormat(undefined, {
        hour: 'numeric', minute: '2-digit', second: '2-digit'
    });
    const shortZoneFormatter = new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' });

    function updateClock() {
        const now = new Date();
        const localDate = [now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, '0'),
            String(now.getDate()).padStart(2, '0')].join('-');

        dateEl.textContent = dateFormatter.format(now);
        dateEl.dateTime = localDate;
        timeEl.textContent = timeFormatter.format(now);
        timeEl.dateTime = now.toTimeString().slice(0, 8);

        const zoneParts = shortZoneFormatter.formatToParts(now);
        const shortZone = zoneParts.find(function (part) { return part.type === 'timeZoneName'; });
        const longZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';
        zoneEl.textContent = 'Time zone: ' + ((shortZone ? shortZone.value + ' · ' : '') + longZone.replace(/_/g, ' '));
    }

    updateClock();
    window.setInterval(updateClock, 1000);

    /* ---------- Scroll reveal ---------- */
    const revealItems = $$('[data-reveal]');
    if (revealItems.length && 'IntersectionObserver' in window && !reducedMotion) {
        document.body.setAttribute('data-reveal-ready', '');
        const revealObserver = new IntersectionObserver(function (entries, observer) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        revealItems.forEach(function (item) { revealObserver.observe(item); });
    }

    /* ---------- Animated statistics ---------- */
    const statNumbers = $$('.stat-number');
    function countUp(el) {
        const target = Number(el.dataset.target) || 0;
        if (reducedMotion) { el.textContent = String(target); return; }
        const duration = 1200;
        const start = performance.now();
        function step(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = String(Math.round(target * eased));
            if (progress < 1) { requestAnimationFrame(step); }
        }
        requestAnimationFrame(step);
    }
    if ('IntersectionObserver' in window) {
        const statObserver = new IntersectionObserver(function (entries, observer) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    countUp(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        statNumbers.forEach(function (el) { statObserver.observe(el); });
    } else {
        statNumbers.forEach(function (el) { el.textContent = el.dataset.target || '0'; });
    }

    /* ---------- Case study dialog ---------- */
    const caseStudies = {
        northwind: {
            tag: 'Branding · Web',
            title: 'Northwind Coffee',
            body: 'A neighbourhood roaster with big ambitions needed an identity that could hold its own on a supermarket shelf while keeping the warmth of the original café. We rebuilt the brand from the wordmark up, then designed and developed a storefront that loads fast and makes subscribing effortless.',
            points: [
                'New positioning, identity system and packaging guidelines',
                'Responsive e-commerce site with a guided subscription flow',
                '38% more online orders in the first twelve weeks'
            ]
        },
        lumen: {
            tag: 'Product · UX',
            title: 'Lumen Analytics',
            body: 'Lumen had powerful analytics buried inside an interface that felt like homework. We mapped the real jobs people were trying to do, simplified the information architecture and designed a calmer, clearer dashboard that surfaces the right number at the right moment.',
            points: [
                'User interviews and a complete UX audit',
                'Reusable component library for the product team',
                '24% lift in weekly active users after launch'
            ]
        },
        fieldnotes: {
            tag: 'Editorial · Growth',
            title: 'Fieldnotes Magazine',
            body: 'An independent publication wanted a reading experience that felt as considered as its writing. We created an editorial design system, a lightweight publishing platform and a set of growth experiments that brought new readers back again and again.',
            points: [
                'Editorial design system with flexible article layouts',
                'Fast, accessible, mobile-first publishing platform',
                '62% more time on site and 3× newsletter sign-ups'
            ]
        }
    };

    const modal = $('#case-modal');
    const modalPanel = $('.modal-panel', modal);
    const modalClose = $('.modal-close', modal);
    let lastFocused = null;

    function openModal(key) {
        const data = caseStudies[key];
        if (!data) { return; }
        $('#modal-tag').textContent = data.tag;
        $('#modal-title').textContent = data.title;
        $('#modal-body').textContent = data.body;
        const pointItems = data.points.map(function (point) {
            const li = document.createElement('li');
            li.textContent = point;
            return li;
        });
        $('#modal-points').replaceChildren(...pointItems);
        lastFocused = document.activeElement;
        modal.hidden = false;
        document.body.classList.add('modal-open');
        modalClose.focus();
    }
    function closeModal() {
        if (modal.hidden) { return; }
        modal.hidden = true;
        document.body.classList.remove('modal-open');
        if (lastFocused && typeof lastFocused.focus === 'function') { lastFocused.focus(); }
    }

    $$('[data-project]').forEach(function (button) {
        button.addEventListener('click', function () { openModal(button.dataset.project); });
    });
    $$('[data-close-modal]', modal).forEach(function (element) {
        element.addEventListener('click', closeModal);
    });
    modal.addEventListener('keydown', function (event) {
        if (event.key !== 'Tab') { return; }
        const focusable = $$('a[href], button:not([disabled]), input, select, textarea', modalPanel)
            .filter(function (el) { return el.offsetParent !== null; });
        if (!focusable.length) { return; }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });

    /* ---------- Testimonial carousel ---------- */
    const slides = $$('#testimonial-track .testimonial');
    const dotsWrap = $('#carousel-dots');
    let activeSlide = 0;

    slides.forEach(function (_, index) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'dot';
        dot.setAttribute('aria-label', 'Show testimonial ' + (index + 1));
        dot.addEventListener('click', function () { showSlide(index); });
        dotsWrap.appendChild(dot);
    });
    const dots = $$('.dot', dotsWrap);

    function showSlide(index) {
        activeSlide = (index + slides.length) % slides.length;
        slides.forEach(function (slide, i) {
            const active = i === activeSlide;
            slide.hidden = !active;
            slide.classList.toggle('is-active', active);
        });
        dots.forEach(function (dot, i) {
            dot.setAttribute('aria-current', String(i === activeSlide));
        });
    }
    $('#prev-testimonial').addEventListener('click', function () { showSlide(activeSlide - 1); });
    $('#next-testimonial').addEventListener('click', function () { showSlide(activeSlide + 1); });
    showSlide(0);

    /* ---------- FAQ accordion ---------- */
    const faqTriggers = $$('.accordion-trigger');
    faqTriggers.forEach(function (button) {
        button.addEventListener('click', function () {
            const panel = document.getElementById(button.getAttribute('aria-controls'));
            const shouldOpen = button.getAttribute('aria-expanded') !== 'true';
            faqTriggers.forEach(function (other) {
                other.setAttribute('aria-expanded', 'false');
                document.getElementById(other.getAttribute('aria-controls')).hidden = true;
            });
            if (shouldOpen) {
                button.setAttribute('aria-expanded', 'true');
                panel.hidden = false;
            }
        });
    });

    /* ---------- "Discuss this service" buttons ---------- */
    const serviceSelect = $('#service');
    const nameInput = $('#name');
    $$('[data-service]').forEach(function (button) {
        button.addEventListener('click', function () {
            serviceSelect.value = button.dataset.service;
            $('#contact').scrollIntoView({ behavior: scrollBehavior, block: 'start' });
            window.setTimeout(function () {
                try { nameInput.focus({ preventScroll: true }); } catch (error) { nameInput.focus(); }
            }, reducedMotion ? 0 : 550);
            showToast('Service added to your enquiry.');
        });
    });

    /* ---------- Contact form validation ---------- */
    const contactForm = $('#contact-form');
    const formStatus = $('#form-status');

    function setFieldError(input, message) {
        const errorEl = document.getElementById(input.id + '-error');
        if (errorEl) { errorEl.textContent = message; }
        if (message) {
            input.setAttribute('aria-invalid', 'true');
        } else {
            input.removeAttribute('aria-invalid');
        }
        return Boolean(message);
    }

    function clearFieldError(input) {
        const errorEl = document.getElementById(input.id + '-error');
        if (errorEl) { errorEl.textContent = ''; }
        input.removeAttribute('aria-invalid');
    }

    function validateContactForm() {
        let invalid = false;
        const name = nameInput.value.trim();
        const email = $('#email').value.trim();
        const service = serviceSelect.value;
        const message = $('#message').value.trim();

        invalid = setFieldError(nameInput, name ? '' : 'Please enter your name.') || invalid;
        invalid = setFieldError($('#email'), emailPattern.test(email) ? '' : 'Please enter a valid email address.') || invalid;
        invalid = setFieldError(serviceSelect, service ? '' : 'Please choose a service.') || invalid;
        invalid = setFieldError($('#message'), message.length >= 10 ? '' : 'Please write at least 10 characters.') || invalid;
        return !invalid;
    }

    contactForm.addEventListener('submit', function (event) {
        event.preventDefault();
        if (!validateContactForm()) {
            formStatus.hidden = true;
            showToast('Please check the highlighted fields.');
            const firstInvalid = $('[aria-invalid="true"]', contactForm);
            if (firstInvalid) { firstInvalid.focus(); }
            return;
        }
        const name = nameInput.value.trim();
        formStatus.textContent = 'Thanks, ' + name + '! Your message checks out — we will reply within one business day.';
        formStatus.hidden = false;
        contactForm.reset();
        $$('input, select, textarea', contactForm).forEach(clearFieldError);
        showToast('Message validated successfully.');
    });

    $$('input, select, textarea', contactForm).forEach(function (field) {
        ['input', 'change'].forEach(function (type) {
            field.addEventListener(type, function () {
                if (field.getAttribute('aria-invalid') === 'true') { clearFieldError(field); }
                formStatus.hidden = true;
            });
        });
    });

    /* ---------- Newsletter form ---------- */
    const newsletterForm = $('#newsletter-form');
    const newsletterEmail = $('#newsletter-email');
    const newsletterError = $('#newsletter-error');

    newsletterEmail.addEventListener('input', function () {
        newsletterError.textContent = '';
        newsletterEmail.removeAttribute('aria-invalid');
    });
    newsletterForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const value = newsletterEmail.value.trim();
        if (!emailPattern.test(value)) {
            newsletterError.textContent = 'Enter a valid email address.';
            newsletterEmail.setAttribute('aria-invalid', 'true');
            newsletterEmail.focus();
            return;
        }
        newsletterError.textContent = '';
        newsletterEmail.removeAttribute('aria-invalid');
        newsletterForm.reset();
        showToast('You are on the list. Thanks for subscribing!');
    });

    /* ---------- Share page ---------- */
    $('#share-btn').addEventListener('click', async function () {
        const shareData = { title: document.title, text: 'Take a look at Ember Studio.', url: window.location.href };
        if (navigator.share) {
            try {
                await navigator.share(shareData);
                return;
            } catch (error) {
                if (error && error.name === 'AbortError') { return; }
                // Fall back to copying the link below.
            }
        }
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(window.location.href);
            } else {
                const temp = document.createElement('textarea');
                temp.value = window.location.href;
                temp.setAttribute('readonly', '');
                temp.style.position = 'fixed';
                temp.style.opacity = '0';
                document.body.appendChild(temp);
                temp.select();
                const copied = document.execCommand('copy');
                temp.remove();
                if (!copied) { throw new Error('Copy not supported'); }
            }
            showToast('Page link copied to clipboard.');
        } catch (error) {
            showToast('Copy the page URL from your browser to share it.');
        }
    });

    /* ---------- Back to top ---------- */
    $('#back-to-top').addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: scrollBehavior });
    });

    /* ---------- Footer year ---------- */
    $('#year').textContent = String(new Date().getFullYear());

    /* ---------- Escape closes overlays ---------- */
    document.addEventListener('keydown', function (event) {
        if (event.key !== 'Escape') { return; }
        if (!modal.hidden) {
            closeModal();
        } else if (nav.classList.contains('is-open')) {
            closeMenu();
            menuToggle.focus();
        }
    });
})();
