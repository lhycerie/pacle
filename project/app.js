import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

// smooth scrolling
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  touchMultiplier: 1.5,
});
window.lenis = lenis;

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);



// contact dialog with accessible focus management
const dialog = document.getElementById('contact-dialog');
const openDialogBtn = document.getElementById('open-contact-btn');
const closeDialogBtn = document.getElementById('close-dialog-btn');
let lastFocusedElement = null;

function openContactModal() {
  if (!dialog) return;
  lastFocusedElement = document.activeElement;
  dialog.showModal();
  const firstInput = dialog.querySelector('input, textarea');
  if (firstInput) firstInput.focus();
}

function closeContactModal() {
  if (dialog && dialog.open) {
    dialog.close();
  }
}

if (openDialogBtn) {
  openDialogBtn.addEventListener('click', openContactModal);
}
if (closeDialogBtn) {
  closeDialogBtn.addEventListener('click', closeContactModal);
}
if (dialog) {
  dialog.addEventListener('click', (e) => {
    const rect = dialog.getBoundingClientRect();
    const isInDialog = (
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width
    );
    if (!isInDialog) closeContactModal();
  });

  dialog.addEventListener('close', () => {
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
  });
}

// open the dialog from navigation
document.querySelectorAll('a[href="#contact"]').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    openContactModal();
  });
});

// mobile menu with aria and keyboard support
const menuBtn = document.querySelector('.mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

if (menuBtn && mobileMenu) {
  function closeMenu() {
    mobileMenu.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
  }

  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = mobileMenu.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(isOpen));
    mobileMenu.setAttribute('aria-hidden', String(!isOpen));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
      closeMenu();
      menuBtn.focus();
    }
  });

  document.addEventListener('click', (e) => {
    if (!mobileMenu.contains(e.target) && !menuBtn.contains(e.target)) {
      closeMenu();
    }
  });

  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });
}

// open an inquiry email draft
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(contactForm);
    const name = encodeURIComponent(formData.get('name') || '');
    const message = encodeURIComponent(formData.get('message') || '');
    window.location.href = `mailto:pacle.official26@gmail.com?subject=Project%20inquiry%20from%20${name}&body=${message}`;
    closeContactModal();
  });
}

// jump to the hero without scrolling through the project runway
document.querySelectorAll('a[href="#home"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    lenis.scrollTo(0, { immediate: true });
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    if (window.location.hash) {
      history.pushState(null, '', window.location.pathname);
    }

    document.querySelectorAll('.reveal-text, article, .skill-row, .manifesto-heading').forEach((el) => {
      el.classList.remove('is-revealed');
    });
  });
});

// scroll to anchors with navbar clearance
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    const targetId = anchor.getAttribute('href');
    if (targetId && targetId !== '#' && targetId !== '#home' && targetId !== '#contact') {
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        const offset = targetId === '#projects' ? 0 : -110;
        lenis.scrollTo(targetElement, { offset, duration: 1.2 });
      }
    }
  });
});

// horizontal project scrolling
const projectsSection = document.getElementById('projects');
const projectsTrack = document.getElementById('projects-track');

if (projectsSection && projectsTrack) {
  let cachedProjectsTop = 0;
  let cachedMaxTranslate = 0;
  let cachedScrollDistance = 0;
  const START_HOLD = 420; // Hold buffer before horizontal translation begins
  const END_HOLD = 380;   // Hold buffer at the end before unpinning

  function syncProjectsDimensions() {
    const rect = projectsSection.getBoundingClientRect();
    cachedProjectsTop = rect.top + window.scrollY;
    cachedMaxTranslate = Math.max(0, projectsTrack.scrollWidth - window.innerWidth);
    const targetHeight = `${cachedMaxTranslate + START_HOLD + END_HOLD + window.innerHeight}px`;
    if (projectsSection.style.height !== targetHeight) {
      projectsSection.style.height = targetHeight;
      lenis.resize();
    }
    cachedScrollDistance = projectsSection.offsetHeight - window.innerHeight;
    updateProjectsHorizontalScroll();
  }

  function updateProjectsHorizontalScroll() {
    if (cachedScrollDistance <= 0) return;

    const currentScroll = typeof lenis.scroll === 'number' ? lenis.scroll : window.scrollY;
    const scrollOffset = currentScroll - cachedProjectsTop;

    if (scrollOffset <= START_HOLD) {
      // Hold at initial position (Slide 0 / ePDS and initial slides cleanly visible)
      projectsTrack.style.transform = 'translate3d(0px, 0, 0)';
    } else if (scrollOffset >= cachedMaxTranslate + START_HOLD) {
      // Hold at final project before unpinning into Team section
      projectsTrack.style.transform = `translate3d(-${cachedMaxTranslate}px, 0, 0)`;
    } else {
      // Smooth horizontal movement between START_HOLD and cachedMaxTranslate + START_HOLD
      const horizontalOffset = scrollOffset - START_HOLD;
      projectsTrack.style.transform = `translate3d(-${horizontalOffset.toFixed(2)}px, 0, 0)`;
    }
  }

  lenis.on('scroll', updateProjectsHorizontalScroll);
  window.addEventListener('resize', syncProjectsDimensions);
  window.addEventListener('load', syncProjectsDimensions);

  syncProjectsDimensions();
  setTimeout(syncProjectsDimensions, 100);
  setTimeout(syncProjectsDimensions, 500);
}

// pause offscreen project videos to free up GPU decoder contexts and eliminate scroll hitching
const projectVideos = document.querySelectorAll('.project-slide video');
if ('IntersectionObserver' in window && projectVideos.length > 0) {
  const videoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting) {
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {});
          }
        } else {
          video.pause();
        }
      });
    },
    { rootMargin: '0px 200px 0px 200px', threshold: 0.01 }
  );

  projectVideos.forEach((video) => videoObserver.observe(video));
}

// observe stationary wrappers so clipped headings can reveal
function revealTarget(target) {
  if (target.classList.contains('baseline-wrap')) {
    target.querySelectorAll('.reveal-text').forEach((el) => {
      el.classList.add('is-revealed');
    });
    return;
  }

  target.classList.add('is-revealed');
}

const revealTargets = document.querySelectorAll(
  '.baseline-wrap, article, .skill-row, .manifesto-heading'
);

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        revealTarget(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  revealTargets.forEach((el) => revealObserver.observe(el));
} else {
  revealTargets.forEach(revealTarget);
}

// reveal skills on scroll
const skillRows = document.querySelectorAll('.skill-row');
if (skillRows.length > 0) {
  function updateSkillsScrollState() {
    const vh = window.innerHeight;

    skillRows.forEach((row) => {
      const rect = row.getBoundingClientRect();


      if (rect.top < vh * 0.90) {
        row.classList.add('is-revealed');
      }
    });
  }

  lenis.on('scroll', updateSkillsScrollState);
  window.addEventListener('resize', updateSkillsScrollState);

  setTimeout(updateSkillsScrollState, 80);
}

// reset reveals at the hero so they replay
function resetRevealsAtTop() {
  const currentScroll = window.scrollY || lenis.scroll || 0;
  if (currentScroll <= 60) {
    document.querySelectorAll('.reveal-text, article, .skill-row, .manifesto-heading').forEach((el) => {
      el.classList.remove('is-revealed');
    });
  }
}
lenis.on('scroll', resetRevealsAtTop);

// roll skill titles on scroll
const skillsSection = document.getElementById('services');
const skillTracks = document.querySelectorAll('.skill-title-track');

if (skillsSection && skillTracks.length > 0) {
  function updateSkillsRollingOnScroll() {
    const vh = window.innerHeight;
    const rect = skillsSection.getBoundingClientRect();

    if (rect.bottom < -100 || rect.top > vh + 100) return;

    skillTracks.forEach((track) => {
      const row = track.closest('.skill-row');
      if (!row || row.matches(':hover')) return;

      const trackRect = track.getBoundingClientRect();
      const distFromCenter = ((trackRect.top + trackRect.height / 2) - (vh / 2)) / (vh / 2);
      const clamped = Math.max(-1, Math.min(1, distFromCenter));
      const pitch = clamped * 12;

      track.style.setProperty('--skill-scroll-pitch', `${pitch.toFixed(1)}deg`);
    });
  }

  lenis.on('scroll', updateSkillsRollingOnScroll);
  window.addEventListener('resize', updateSkillsRollingOnScroll);
  setTimeout(updateSkillsRollingOnScroll, 100);
}

// slide story text on scroll
const storySection = document.getElementById('story');
const storyLines = document.querySelectorAll('.story-kinetic-line');

if (storySection && storyLines.length > 0) {
  let cachedStoryTop = 0;
  let cachedStoryHeight = 0;

  function syncStoryDimensions() {
    const rect = storySection.getBoundingClientRect();
    cachedStoryTop = rect.top + window.scrollY;
    cachedStoryHeight = storySection.offsetHeight;
  }

  function updateStoryScroll() {
    const currentScroll = typeof lenis.scroll === 'number' ? lenis.scroll : window.scrollY;
    const vh = window.innerHeight;
    const sectionTop = cachedStoryTop - currentScroll;
    const sectionBottom = sectionTop + cachedStoryHeight;

    if (sectionBottom < -100 || sectionTop > vh + 100) return;

    // smooth distance from viewport center
    const sectionCenter = sectionTop + cachedStoryHeight / 2;
    const viewportCenter = vh / 2;
    const totalTravel = (vh + cachedStoryHeight) / 2;
    const rawProgress = (sectionCenter - viewportCenter) / totalTravel;
    const progress = Math.max(-1.5, Math.min(1.5, rawProgress));

    // Smooth quadratic curve avoids harsh V-shaped derivative at center
    const absProg = Math.min(1.4, Math.abs(progress));
    const smoothFactor = absProg * absProg;
    const maxShift = Math.min(window.innerWidth * 0.22, 220);

    storyLines.forEach((line) => {
      const dir = parseFloat(line.getAttribute('data-story-dir') || '-1');
      const shiftX = dir * smoothFactor * maxShift;
      const opacity = absProg >= 1.2 ? Math.max(0, 1 - (absProg - 1.2) * 3) : 1;

      line.style.setProperty('--story-line-x', `${shiftX.toFixed(1)}px`);
      line.style.setProperty('--story-line-opacity', opacity.toFixed(2));
    });
  }

  lenis.on('scroll', updateStoryScroll);
  window.addEventListener('resize', () => {
    syncStoryDimensions();
    updateStoryScroll();
  });
  window.addEventListener('load', () => {
    syncStoryDimensions();
    updateStoryScroll();
  });

  syncStoryDimensions();
  updateStoryScroll();
  setTimeout(() => {
    syncStoryDimensions();
    updateStoryScroll();
  }, 100);
}

// swap the logo from right to left after the hero
const logoContainer = document.querySelector('.navbar-logo-container');
const navContainer = document.querySelector('.navbar-nav-container');
const contentLayer = document.querySelector('.content-layer');

function syncNavbarMetrics() {
  if (!logoContainer || !navContainer) return;
  const isMobile = window.innerWidth <= 768;
  const gap = isMobile ? 8 : 12;
  const navWidth = navContainer.offsetWidth;
  const logoWidth = logoContainer.offsetWidth;


  logoContainer.style.setProperty('--logo-shift-x', `${navWidth + gap}px`);

  navContainer.style.setProperty('--nav-shift-x', `-${logoWidth + gap}px`);
}

function updateNavbarScrollState() {
  if (!contentLayer) return;
  const rect = contentLayer.getBoundingClientRect();

  const isScrolled = rect.top <= 130;
  if (isScrolled) {
    document.body.classList.add('navbar-scrolled');
  } else {
    document.body.classList.remove('navbar-scrolled');
  }
}

lenis.on('scroll', updateNavbarScrollState);
window.addEventListener('resize', () => {
  syncNavbarMetrics();
  updateNavbarScrollState();
});
window.addEventListener('load', () => {
  syncNavbarMetrics();
  updateNavbarScrollState();
});

syncNavbarMetrics();
updateNavbarScrollState();
setTimeout(syncNavbarMetrics, 80);
setTimeout(syncNavbarMetrics, 400);

// hero shader
try {
  const { createShader } = await import('shaders/js');
  const canvasEl = document.getElementById('canvas');
  if (canvasEl) {
    const shader = await createShader(canvasEl, {
      components: [
        {
          type: 'MagneticFilings',
          id: 'idmvgg6ghr3qna5wv8u',
          props: {
            colorA: '#6B0081',
            colorB: '#C2B8FF',
            visible: false
          }
        },
        {
          type: 'InkFlow',
          id: 'idmvggih81kzo348m9s',
          props: {
            color: '#',
            color1: '#6B0081',
            color2: '#9422bd',
            color3: '#C2B8FF',
            colorMode: 'custom',
            decay: 1,
            force: 0.2,
            radius: 0.55
          }
        }
      ]
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        shader?.pause?.();
      } else {
        shader?.play?.();
      }
    });
  }
} catch (e) {
  console.warn('Shader canvas fallback active.', e);
}
