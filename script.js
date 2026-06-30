// ========================================
// ADITYA SHARMA - PORTFOLIO
// Interactive JavaScript Functionality
// ========================================

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {

    // ========================================
    // STARFIELD BACKGROUND ANIMATION
    // ========================================

    const canvas = document.getElementById('starfield');
    const ctx = canvas.getContext('2d');

    // Set canvas size
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // ----- 3D Starfield -----
    // Stars live in a 3D cube, rotate slowly around the Y axis, and are
    // projected onto the 2D canvas with perspective. The whole field also
    // parallax-tilts toward the mouse for an interactive depth effect.

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const stars = [];
    const starCount = window.innerWidth < 768 ? 180 : 340;
    const SPREAD = 1000;          // half-size of the 3D cube
    const FOCAL = 420;            // perspective focal length
    const starColors = [
        [255, 255, 255],
        [240, 171, 252],   // light pink
        [217, 70, 239],    // magenta
        [168, 85, 247],    // violet
    ];

    class Star3D {
        constructor() {
            this.reset(true);
        }

        reset(initial) {
            this.x = (Math.random() - 0.5) * SPREAD * 2;
            this.y = (Math.random() - 0.5) * SPREAD * 2;
            this.z = initial ? (Math.random() - 0.5) * SPREAD * 2 : SPREAD;
            this.radius = Math.random() * 1.6 + 0.4;
            this.color = starColors[Math.floor(Math.random() * starColors.length)];
            this.twinkle = Math.random() * Math.PI * 2;
        }
    }

    for (let i = 0; i < starCount; i++) {
        stars.push(new Star3D());
    }

    // ----- 3D Wireframe Icosahedron (scroll-reactive) -----
    // A 20-faced wireframe gem. Its rotation, position and scale are driven
    // by how far down the page you've scrolled (with a gentle idle spin).

    const PHI = (1 + Math.sqrt(5)) / 2;
    const icoBase = [
        [0, 1, PHI], [0, -1, PHI], [0, 1, -PHI], [0, -1, -PHI],
        [1, PHI, 0], [-1, PHI, 0], [1, -PHI, 0], [-1, -PHI, 0],
        [PHI, 0, 1], [-PHI, 0, 1], [PHI, 0, -1], [-PHI, 0, -1],
    ];
    const ICO_SCALE = window.innerWidth < 768 ? 120 : 200;
    const icoVerts = icoBase.map(v => ({
        x: v[0] * ICO_SCALE, y: v[1] * ICO_SCALE, z: v[2] * ICO_SCALE,
    }));

    // Edges = vertex pairs at the minimum (edge) distance
    const icoEdges = [];
    for (let i = 0; i < icoBase.length; i++) {
        for (let j = i + 1; j < icoBase.length; j++) {
            const dx = icoBase[i][0] - icoBase[j][0];
            const dy = icoBase[i][1] - icoBase[j][1];
            const dz = icoBase[i][2] - icoBase[j][2];
            if (Math.abs(dx * dx + dy * dy + dz * dz - 4) < 0.01) {
                icoEdges.push([i, j]);
            }
        }
    }

    const icoColor = [217, 70, 239];   // magenta edges
    const icoGlow = [240, 171, 252];   // bright pink vertices
    let scrollProgress = 0;

    let angle = 0;
    let targetTiltX = 0, targetTiltY = 0;
    let tiltX = 0, tiltY = 0;

    window.addEventListener('mousemove', function (e) {
        targetTiltY = (e.clientX / window.innerWidth - 0.5) * 0.5;
        targetTiltX = (e.clientY / window.innerHeight - 0.5) * 0.5;
    });

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        // Ease the rotation + mouse tilt
        angle += reduceMotion ? 0 : 0.0012;
        tiltX += (targetTiltX - tiltX) * 0.05;
        tiltY += (targetTiltY - tiltY) * 0.05;

        const sinY = Math.sin(angle + tiltY);
        const cosY = Math.cos(angle + tiltY);
        const sinX = Math.sin(tiltX);
        const cosX = Math.cos(tiltX);

        for (const s of stars) {
            // Rotate around Y axis
            let x = s.x * cosY - s.z * sinY;
            let z = s.x * sinY + s.z * cosY;
            // Rotate around X axis (mouse tilt)
            let y = s.y * cosX - z * sinX;
            z = s.y * sinX + z * cosX;

            // Perspective projection
            const scale = FOCAL / (FOCAL + z + SPREAD);
            if (scale <= 0) continue;

            const sx = cx + x * scale;
            const sy = cy + y * scale;
            if (sx < 0 || sx > canvas.width || sy < 0 || sy > canvas.height) continue;

            s.twinkle += 0.03;
            const depth = Math.max(0, Math.min(1, scale));
            const alpha = (0.25 + 0.55 * depth) * (0.7 + 0.3 * Math.sin(s.twinkle));
            const r = s.radius * scale * 1.8;
            const [cr, cg, cb] = s.color;

            ctx.beginPath();
            ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${alpha})`;
            ctx.arc(sx, sy, Math.max(0.3, r), 0, Math.PI * 2);
            ctx.fill();
        }

        // ----- Render the scroll-reactive icosahedron -----
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const sp = Math.min(1, Math.max(0, window.pageYOffset / maxScroll));
        scrollProgress += (sp - scrollProgress) * 0.08; // smooth follow

        const now = performance.now();
        // Rotation: mostly scroll-driven, with a slow idle spin
        const rx = scrollProgress * Math.PI * 4 + (reduceMotion ? 0 : now * 0.00018);
        const ry = scrollProgress * Math.PI * 6 + (reduceMotion ? 0 : now * 0.00026);
        const cosRx = Math.cos(rx), sinRx = Math.sin(rx);
        const cosRy = Math.cos(ry), sinRy = Math.sin(ry);

        // Position drifts right -> left and waves vertically as you scroll
        const offX = (0.3 - scrollProgress * 0.6) * canvas.width;
        const offY = Math.sin(scrollProgress * Math.PI * 1.5) * canvas.height * 0.12;
        const breathe = 1 + scrollProgress * 0.35; // grows a little on scroll

        const ip = icoVerts.map(v => {
            // rotate around X
            let y = v.y * cosRx - v.z * sinRx;
            let z = v.y * sinRx + v.z * cosRx;
            let x = v.x;
            // rotate around Y
            const x2 = x * cosRy + z * sinRy;
            const z2 = -x * sinRy + z * cosRy;
            const scale = (FOCAL / (FOCAL + z2 + SPREAD)) * breathe;
            return {
                sx: cx + offX + x2 * scale,
                sy: cy + offY + y * scale,
                z: z2,
            };
        });

        const [ir, ig, ib] = icoColor;
        ctx.lineWidth = 1.4;
        for (const [a, b] of icoEdges) {
            const pa = ip[a], pb = ip[b];
            const depth = 0.5 + 0.5 * ((pa.z + pb.z) / 2 + SPREAD) / (SPREAD * 2);
            ctx.strokeStyle = `rgba(${ir}, ${ig}, ${ib}, ${0.25 + 0.45 * depth})`;
            ctx.shadowColor = `rgba(${ir}, ${ig}, ${ib}, 0.6)`;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.moveTo(pa.sx, pa.sy);
            ctx.lineTo(pb.sx, pb.sy);
            ctx.stroke();
        }
        ctx.shadowBlur = 0;

        const [gr, gg, gb] = icoGlow;
        for (const p of ip) {
            ctx.beginPath();
            ctx.fillStyle = `rgba(${gr}, ${gg}, ${gb}, 0.9)`;
            ctx.shadowColor = `rgba(${gr}, ${gg}, ${gb}, 0.9)`;
            ctx.shadowBlur = 10;
            ctx.arc(p.sx, p.sy, 2.6, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;

        requestAnimationFrame(animate);
    }

    animate();

    // ========================================
    // SMOOTH SCROLL NAVIGATION
    // ========================================

    const navLinks = document.querySelectorAll('.nav-links a');

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                const navHeight = document.querySelector('nav').offsetHeight;
                const targetPosition = targetSection.offsetTop - navHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ========================================
    // ACTIVE NAV LINK ON SCROLL
    // ========================================

    const sections = document.querySelectorAll('section[id]');

    function updateActiveNav() {
        const scrollY = window.pageYOffset;

        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - 100;
            const sectionId = section.getAttribute('id');
            const navLink = document.querySelector(`.nav-links a[href="#${sectionId}"]`);

            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navLinks.forEach(link => link.classList.remove('active'));
                if (navLink) {
                    navLink.classList.add('active');
                }
            }
        });
    }

    window.addEventListener('scroll', updateActiveNav);

    // ========================================
    // NAVBAR SCROLL EFFECT
    // ========================================

    const nav = document.querySelector('nav');

    window.addEventListener('scroll', function () {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });

    // ========================================
    // PROJECT FILTERING
    // ========================================

    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', function () {
            const filter = this.getAttribute('data-filter');

            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Filter projects
            projectCards.forEach(card => {
                const categories = card.getAttribute('data-category').split(' ');

                if (filter === 'all' || categories.includes(filter)) {
                    card.style.display = 'block';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'scale(1)';
                    }, 10);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.8)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 300);
                }
            });
        });
    });

    // ========================================
    // SCROLL ANIMATIONS
    // ========================================

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all sections and cards
    const animatedElements = document.querySelectorAll('section, .project-card, .education-item, .skill-category, .experience-card');
    animatedElements.forEach(el => observer.observe(el));

    // ========================================
    // CONTACT FORM HANDLING (Formspree)
    // ========================================

    const contactForm = document.getElementById('contact-form');

    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            // Let Formspree handle the submission
            // Show success message after form submission
            setTimeout(function () {
                const successMsg = document.getElementById('form-success');
                if (successMsg) {
                    successMsg.style.display = 'block';
                    contactForm.reset();

                    // Hide success message after 5 seconds
                    setTimeout(function () {
                        successMsg.style.display = 'none';
                    }, 5000);
                }
            }, 1000);
        });
    }


    // ========================================
    // MOBILE MENU TOGGLE
    // ========================================

    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinksContainer = document.querySelector('.nav-links');

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function () {
            navLinksContainer.classList.toggle('active');
        });

        // Close menu when clicking on a link
        navLinks.forEach(link => {
            link.addEventListener('click', function () {
                navLinksContainer.classList.remove('active');
            });
        });
    }

    // ========================================
    // TYPING EFFECT FOR HERO SUBTITLE
    // ========================================

    const heroSubtitle = document.querySelector('.hero-subtitle');
    if (heroSubtitle) {
        const text = heroSubtitle.textContent;
        heroSubtitle.textContent = '';
        let index = 0;

        function typeWriter() {
            if (index < text.length) {
                heroSubtitle.textContent += text.charAt(index);
                index++;
                setTimeout(typeWriter, 50);
            }
        }

        // Start typing after a short delay
        setTimeout(typeWriter, 1000);
    }

    // ========================================
    // SMOOTH REVEAL ON LOAD
    // ========================================

    window.addEventListener('load', function () {
        document.body.style.opacity = '1';
    });

    // ========================================
    // PARALLAX EFFECT FOR GRADIENT ORBS
    // ========================================

    const orbs = document.querySelectorAll('.gradient-orb');

    window.addEventListener('mousemove', function (e) {
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;

        orbs.forEach((orb, index) => {
            const speed = (index + 1) * 20;
            const x = (mouseX - 0.5) * speed;
            const y = (mouseY - 0.5) * speed;

            orb.style.transform = `translate(${x}px, ${y}px)`;
        });
    });

    // ========================================
    // 3D TILT EFFECT ON CARDS
    // ========================================

    const supportsHover = window.matchMedia('(hover: hover)').matches;

    if (supportsHover && !reduceMotion) {
        const tiltCards = document.querySelectorAll(
            '.project-card, .experience-card, .skill-category, .education-item, .achievement-card, .contact-item'
        );

        const MAX_TILT = 9; // degrees

        tiltCards.forEach(card => {
            card.addEventListener('mousemove', function (e) {
                const rect = card.getBoundingClientRect();
                const px = (e.clientX - rect.left) / rect.width;
                const py = (e.clientY - rect.top) / rect.height;

                const rotateY = (px - 0.5) * (MAX_TILT * 2);
                const rotateX = (0.5 - py) * (MAX_TILT * 2);

                card.classList.add('tilt-active');
                card.style.transform =
                    `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px) scale(1.015)`;
            });

            card.addEventListener('mouseleave', function () {
                card.style.transform = '';
                // Drop the fast transition after it settles so the CSS hover transition resumes
                setTimeout(() => card.classList.remove('tilt-active'), 150);
            });
        });
    }

    // ========================================
    // SCROLL TO TOP BUTTON
    // ========================================

    const scrollToTopBtn = document.createElement('button');
    scrollToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    scrollToTopBtn.className = 'scroll-to-top';
    scrollToTopBtn.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
        color: white;
        border: none;
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 1000;
        box-shadow: 0 4px 15px rgba(6, 182, 212, 0.4);
    `;

    document.body.appendChild(scrollToTopBtn);

    window.addEventListener('scroll', function () {
        if (window.scrollY > 500) {
            scrollToTopBtn.style.opacity = '1';
            scrollToTopBtn.style.visibility = 'visible';
        } else {
            scrollToTopBtn.style.opacity = '0';
            scrollToTopBtn.style.visibility = 'hidden';
        }
    });

    scrollToTopBtn.addEventListener('click', function () {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    scrollToTopBtn.addEventListener('mouseenter', function () {
        this.style.transform = 'translateY(-5px)';
        this.style.boxShadow = '0 6px 20px rgba(6, 182, 212, 0.6)';
    });

    scrollToTopBtn.addEventListener('mouseleave', function () {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 4px 15px rgba(6, 182, 212, 0.4)';
    });

    // ========================================
    // CONSOLE MESSAGE
    // ========================================

    console.log('%c👋 Hello, Developer!', 'font-size: 20px; font-weight: bold; color: #06b6d4;');
    console.log('%cInterested in the code? Check out my GitHub: https://github.com/lucifer-cyber007', 'font-size: 14px; color: #10b981;');

});
