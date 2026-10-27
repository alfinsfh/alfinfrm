    const hamburger = document.getElementById("hamburger");
    const mobileNav = document.getElementById("mobileNav");
    hamburger.addEventListener("click", () => {
      const isExpanded = hamburger.getAttribute("aria-expanded") === "true";
      hamburger.setAttribute("aria-expanded", String(!isExpanded));
      hamburger.setAttribute(
        "aria-label",
        isExpanded ? "Open navigation menu" : "Close navigation menu"
      );
      mobileNav.classList.toggle("active", !isExpanded);
    });

    mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mobileNav.classList.remove("active");
        hamburger.setAttribute("aria-expanded", "false");
        hamburger.setAttribute("aria-label", "Open navigation menu");
      });
    });

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const initializeMarquee = (viewport, track, hiddenClass = null) => {
      if (track.dataset.marqueeInitialized === "true") {
        return;
      }

      track.dataset.marqueeInitialized = "true";
      const cards = Array.from(track.children).filter(
        (card) => !hiddenClass || !card.classList.contains(hiddenClass)
      );
      cards.forEach((card) => card.removeAttribute("data-aos"));
      const clones = [];
      const direction = viewport.dataset.marqueeDirection === "reverse" ? -1 : 1;
      let cycleWidth = 0;

      const appendClone = (card) => {
        const clone = card.cloneNode(true);
        clone.removeAttribute("data-aos");
        clone.setAttribute("aria-hidden", "true");
        clone.dataset.marqueeClone = "true";
        clone.querySelectorAll("img").forEach((image) => image.setAttribute("alt", ""));
        track.appendChild(clone);
        clones.push(clone);
      };

      const updateClones = () => {
        const previousCycleWidth = cycleWidth;
        const scrollProgress = previousCycleWidth
          ? (viewport.scrollLeft % previousCycleWidth) / previousCycleWidth
          : 0;

        track.querySelectorAll('[data-marquee-clone="true"]').forEach((clone) => clone.remove());
        clones.length = 0;
        cards.forEach((card) => appendClone(card));
        cycleWidth = clones[0] ? clones[0].offsetLeft - cards[0].offsetLeft : 0;

        while (cards.length && cycleWidth > 0 &&
          track.scrollWidth < viewport.clientWidth + cycleWidth) {
          cards.forEach((card) => appendClone(card));
        }

        viewport.scrollLeft = (direction < 0 ? cycleWidth : 0) + scrollProgress * cycleWidth;
      };

      updateClones();

      let interactionTimeout;
      let isInteracting = false;
      let dragStartX = null;
      let dragStartScrollLeft = 0;
      let pointerStartX = null;
      let dragMoved = false;
      let lastFrameTime = 0;

      const animate = (timestamp) => {
        if (lastFrameTime && !isInteracting && !reducedMotion.matches && !document.hidden) {
          const bounds = viewport.getBoundingClientRect();
          if (bounds.bottom > 0 && bounds.top < window.innerHeight && cycleWidth > 0) {
            const elapsed = Math.min(timestamp - lastFrameTime, 64);
            const nextScrollLeft = viewport.scrollLeft + direction * elapsed * 0.035;
            viewport.scrollLeft =
              direction < 0 && nextScrollLeft < 0
                ? cycleWidth + (nextScrollLeft % cycleWidth)
                : nextScrollLeft % cycleWidth;
          }
        }

        lastFrameTime = timestamp;
        window.requestAnimationFrame(animate);
      };

      const pause = () => {
        isInteracting = true;
        window.clearTimeout(interactionTimeout);
      };

      const resume = () => {
        window.clearTimeout(interactionTimeout);
        interactionTimeout = window.setTimeout(() => {
          isInteracting = viewport.matches(":focus-within");
        }, 1800);
      };

      viewport.addEventListener("pointerdown", (event) => {
        pause();
        pointerStartX = event.clientX;
        dragMoved = false;
        delete viewport.dataset.suppressCardClick;
        if (event.pointerType !== "mouse" || event.button !== 0) {
          return;
        }

        event.preventDefault();
        dragStartX = event.clientX;
        dragStartScrollLeft = viewport.scrollLeft;
        viewport.classList.add("is-dragging");
      });
      viewport.addEventListener("pointermove", (event) => {
        if (pointerStartX !== null && Math.abs(event.clientX - pointerStartX) > 8) {
          dragMoved = true;
        }
        if (dragStartX !== null && event.pointerType === "mouse") {
          if (dragMoved && !viewport.hasPointerCapture(event.pointerId)) {
            viewport.setPointerCapture(event.pointerId);
          }
          viewport.scrollLeft = dragStartScrollLeft - (event.clientX - dragStartX);
        }
      });
      const stopDrag = () => {
        if (dragMoved) {
          viewport.dataset.suppressCardClick = "true";
          window.setTimeout(() => delete viewport.dataset.suppressCardClick, 500);
        }
        pointerStartX = null;
        dragStartX = null;
        dragMoved = false;
        viewport.classList.remove("is-dragging");
        resume();
      };
      viewport.addEventListener("pointerup", stopDrag);
      viewport.addEventListener("pointercancel", stopDrag);
      viewport.addEventListener("focusin", pause);
      viewport.addEventListener("focusout", resume);
      window.addEventListener("resize", updateClones);
      window.requestAnimationFrame(animate);
    };

    initializeMarquee(
      document.querySelector("#certi .certificates-viewport"),
      document.querySelector("#certi .certificates-scroll"),
      "certificate-card--hidden"
    );
    document.querySelectorAll(".projects-viewport").forEach((viewport) => {
      initializeMarquee(viewport, viewport.querySelector(".projects-scroll"));
    });

    const previewDialog = document.querySelector(".preview-dialog");
    const previewImage = previewDialog.querySelector(".preview-dialog__image");
    const previewTitle = previewDialog.querySelector(".preview-dialog__title");
    const previewCloseButton = previewDialog.querySelector(".preview-dialog__close");

    document.querySelectorAll(".certificate-card:not(.certificate-card--hidden)").forEach((card) => {
      const title = card.querySelector(".certificate-name")?.textContent.trim();
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", card.dataset.marqueeClone === "true" ? "-1" : "0");
      card.setAttribute("aria-haspopup", "dialog");
      card.setAttribute("aria-label", title ? `Preview ${title}` : "Preview image");
    });

    const openPreview = (card) => {
      const image = card.querySelector(".certificate-image");
      const title = card.querySelector(".certificate-name")?.textContent.trim();
      if (!image) {
        return;
      }

      previewImage.src = image.currentSrc || image.src;
      previewImage.alt = image.alt || title || "";
      previewTitle.textContent = title || image.alt || "";
      previewDialog.showModal();
    };

    document.addEventListener("click", (event) => {
      if (event.target.closest(".game-roblox-link")) {
        return;
      }

      const card = event.target.closest(".certificate-card:not(.certificate-card--hidden)");
      if (!card) {
        if (event.target === previewDialog) {
          previewDialog.close();
        }
        return;
      }

      const viewport = card.closest(".certificates-viewport");
      if (viewport?.dataset.suppressCardClick === "true") {
        event.preventDefault();
        return;
      }

      openPreview(card);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && previewDialog.open) {
        previewDialog.close();
        return;
      }

      if (event.target.closest(".game-roblox-link")) {
        return;
      }

      const card = event.target.closest(".certificate-card[role='button']");
      if (!card || (event.key !== "Enter" && event.key !== " ")) {
        return;
      }

      event.preventDefault();
      openPreview(card);
    });

    previewCloseButton.addEventListener("click", () => previewDialog.close());

    const contactForm = document.querySelector(".contact-form");
    const contactNotice = document.getElementById("contactNotice");
    const whatsappNumber = "628567954569";

    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const senderName = contactForm.elements.user_name.value.trim();
      const message = contactForm.elements.user_message.value.trim();
      const whatsappMessage = `From: ${senderName}\n\n${message}`;
      const whatsappUrl =
        `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

      contactNotice.textContent = "Opening WhatsApp to send your message...";
      window.location.assign(whatsappUrl);
    });

    AOS.init();


    const leavesCount = 100;
    const leaves = [];

    const svgPaths = [
      "https://peppy-horse-0fee5a.netlify.app/leaf1.svg",
      "https://peppy-horse-0fee5a.netlify.app/leaf2.svg",
      "https://peppy-horse-0fee5a.netlify.app/leaf3.svg",
      "https://peppy-horse-0fee5a.netlify.app/leaf4.svg"
    ];

    const MIN_DELAY = 5000;
    const MAX_DELAY = 7000;
    const MIN_DURATION = 6000;
    const MAX_DURATION = 11000;
    const LANDING_DURATION = 1500;

    let animationId = null;
    let animationRunning = false;
    let startTimer = null;
    let sequenceId = 0;

    function randomRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    function randomItem(items) {
      return items[Math.floor(Math.random() * items.length)];
    }

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function cubicBezier(t, p0, p1, p2, p3) {
      const u = 1 - t;

      return (
        u ** 3 * p0 +
        3 * u ** 2 * t * p1 +
        3 * u * t ** 2 * p2 +
        t ** 3 * p3
      );
    }

    class Leaf {
      constructor() {
        this.el = document.createElement("div");
        this.el.className = "leaf";

        this.img = document.createElement("img");
        this.img.alt = "";
        this.img.draggable = false;
        this.img.decoding = "async";

        Object.assign(this.img.style, {
          width: "100%",
          height: "100%",
          display: "block",
          pointerEvents: "none"
        });

        this.el.appendChild(this.img);

        Object.assign(this.el.style, {
          position: "fixed",
          top: "0",
          left: "0",
          display: "none",
          pointerEvents: "none",
          willChange: "transform",
          zIndex: "9999"
        });

        document.body.appendChild(this.el);

        this.img.onerror = () => {
          this.el.style.visibility = "hidden";
        };

        this.img.onload = () => {
          this.el.style.visibility = "visible";
        };

        this.reset();
      }

      reset() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.el.style.position = "fixed";
        this.el.style.willChange = "transform";
        this.size = randomRange(40, 70);

        this.el.style.width = `${this.size}px`;
        this.el.style.height = `${this.size}px`;

        this.img.src = randomItem(svgPaths);

        // Posisi awal dan akhir.
        this.startX = randomRange(
          -this.size,
          Math.max(-this.size, width - this.size)
        );

        this.startY = -this.size - randomRange(0, 100);

        this.endX = randomRange(
          0,
          Math.max(0, width - this.size)
        );

        this.endY = randomRange(
          height * 0.3,
          height * 0.9
        );

        // Titik kontrol lintasan.
        this.cp1X = randomRange(-this.size, width);
        this.cp1Y = randomRange(
          this.startY,
          this.startY + (this.endY - this.startY) * 0.45
        );

        this.cp2X = randomRange(-this.size, width);
        this.cp2Y = randomRange(
          this.startY + (this.endY - this.startY) * 0.4,
          this.endY
        );

        this.duration = reducedMotion.matches
          ? 0
          : randomRange(MIN_DURATION, MAX_DURATION);

        this.rotation = randomRange(0, 360);
        this.rotationSpeed = randomRange(50, 180);

        this.startTime = 0;
        this.landingStartTime = null;
        this.landedX = 0;
        this.landedY = 0;
        this.landedRotation = 0;
        this.sweepVelocityX = 0;
        this.sweepVelocityY = 0;
        this.sweepWindX = 0;
        this.sweepWindY = 0;
        this.sweepAngularVelocity = 0;
        this.lastSweepUpdate = null;

        this.isFalling = false;
        this.hasLanded = false;

        this.el.style.display = "none";
        this.el.style.visibility = "visible";

        this.setPosition(
          this.startX,
          this.startY,
          this.rotation
        );
      }

      setPosition(x, y, rotation) {
        this.el.style.transform =
          `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg)`;
      }

      land(x, y, rotation) {
        this.el.style.position = "absolute";
        this.el.style.willChange = "auto";
        this.landedX = x + window.scrollX;
        this.landedY = y + window.scrollY;
        this.landedRotation = rotation;
        this.sweepVelocityX = 0;
        this.sweepVelocityY = 0;
        this.sweepWindX = 0;
        this.sweepWindY = 0;
        this.sweepAngularVelocity = 0;
        this.lastSweepUpdate = null;
        this.setPosition(this.landedX, this.landedY, rotation);
      }

      startFalling(now) {
        this.startTime = now;
        this.landingStartTime = null;
        this.isFalling = true;
        this.hasLanded = false;

        this.el.style.display = "block";

        if (reducedMotion.matches) {
          this.land(this.endX, this.endY, this.rotation);
          this.isFalling = false;
          this.hasLanded = true;
          return;
        }

        ensureAnimation();
      }

      update(now) {
        if (!this.isFalling) {
          this.updateSweep(now);
          return;
        }

        const elapsed = now - this.startTime;
        const t = clamp(elapsed / this.duration, 0, 1);

        if (elapsed < this.duration) {
          const x = cubicBezier(
            t,
            this.startX,
            this.cp1X,
            this.cp2X,
            this.endX
          );

          const y = cubicBezier(
            t,
            this.startY,
            this.cp1Y,
            this.cp2Y,
            this.endY
          );

          const rotation =
            this.rotation +
            this.rotationSpeed * (elapsed / 1000);

          this.setPosition(x, y, rotation);
          return;
        }

        // Mulai animasi pendaratan.
        if (this.landingStartTime === null) {
          this.landingStartTime = now;
        }

        const landingElapsed = now - this.landingStartTime;

        const landingT = clamp(
          landingElapsed / LANDING_DURATION,
          0,
          1
        );

        const eased = easeOutCubic(landingT);

        const finalRotation =
          this.rotation +
          this.rotationSpeed * (this.duration / 1000);

        // Daun bergerak sedikit saat menyentuh tanah.
        const landingOffset = 8 * eased;
        const landingRotation = 6 * eased;

        if (landingT >= 1) {
          this.land(
            this.endX,
            this.endY + landingOffset,
            finalRotation + landingRotation
          );
          this.isFalling = false;
          this.hasLanded = true;
        } else {
          this.setPosition(
            this.endX,
            this.endY + landingOffset,
            finalRotation + landingRotation
          );
        }
      }

      updateSweep(now) {
        if (!this.hasLanded || this.lastSweepUpdate === null) return;

        const elapsed = Math.min(now - this.lastSweepUpdate, 32) / 1000;
        this.lastSweepUpdate = now;

        if (elapsed <= 0) return;

        const windResponse = 1 - Math.exp(-5 * elapsed);
        this.sweepVelocityX += (this.sweepWindX - this.sweepVelocityX) * windResponse;
        this.sweepVelocityY += (this.sweepWindY - this.sweepVelocityY) * windResponse;
        this.landedX += this.sweepVelocityX * elapsed;
        this.landedY += this.sweepVelocityY * elapsed;

        const minX = window.scrollX;
        const maxX = minX + window.innerWidth - this.size;
        const minY = window.scrollY;
        const maxY = Math.max(minY, document.documentElement.scrollHeight - this.size);
        const boundedX = clamp(this.landedX, minX, maxX);
        const boundedY = clamp(this.landedY, minY, maxY);
        if (boundedX !== this.landedX) {
          this.sweepVelocityX = 0;
          this.sweepWindX = 0;
        }
        if (boundedY !== this.landedY) {
          this.sweepVelocityY = 0;
          this.sweepWindY = 0;
        }
        this.landedX = boundedX;
        this.landedY = boundedY;

        const windFade = Math.pow(0.985, elapsed * 60);
        const airDrag = Math.pow(0.96, elapsed * 60);
        this.sweepWindX *= windFade;
        this.sweepWindY *= windFade;
        this.sweepVelocityX *= airDrag;
        this.sweepVelocityY *= airDrag;
        this.landedRotation += this.sweepAngularVelocity * elapsed;
        this.sweepAngularVelocity *= Math.pow(0.9, elapsed * 60);
        this.setPosition(this.landedX, this.landedY, this.landedRotation);

        if (
          Math.hypot(this.sweepVelocityX, this.sweepVelocityY) < 4 &&
          Math.hypot(this.sweepWindX, this.sweepWindY) < 4 &&
          Math.abs(this.sweepAngularVelocity) < 4
        ) {
          this.sweepVelocityX = 0;
          this.sweepVelocityY = 0;
          this.sweepWindX = 0;
          this.sweepWindY = 0;
          this.sweepAngularVelocity = 0;
          this.lastSweepUpdate = null;
        }
      }
    }

    function ensureAnimation() {
      if (animationRunning) return;

      animationRunning = true;
      animationId = requestAnimationFrame(animateLeaves);
    }

    function animateLeaves(now) {
      for (const leaf of leaves) {
        leaf.update(now);
      }

      const hasActiveLeaves = leaves.some(
        leaf => leaf.isFalling || leaf.lastSweepUpdate !== null
      );

      if (hasActiveLeaves) {
        animationId = requestAnimationFrame(animateLeaves);
      } else {
        animationRunning = false;
        animationId = null;
      }
    }

    let previousPointer = null;
    window.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "touch") {
        previousPointer = {
          x: event.clientX,
          y: event.clientY,
          time: performance.now()
        };
      }
    });

    window.addEventListener("pointermove", (event) => {
      const now = performance.now();
      const currentPointer = { x: event.clientX, y: event.clientY, time: now };
      if (!previousPointer) {
        previousPointer = currentPointer;
        return;
      }

      const elapsed = Math.max((now - previousPointer.time) / 1000, 0.008);
      const moveX = currentPointer.x - previousPointer.x;
      const moveY = currentPointer.y - previousPointer.y;
      const pointerSpeed = Math.hypot(moveX, moveY) / elapsed;
      const moveLength = Math.hypot(moveX, moveY);
      const minimumSweepSpeed = event.pointerType === "touch" ? 12 : 35;

      if (pointerSpeed > minimumSweepSpeed && moveLength > 0) {
        const windStrength = Math.min(pointerSpeed * 0.18, 240);
        const startX = previousPointer.x;
        const startY = previousPointer.y;
        const segmentLengthSquared = moveX * moveX + moveY * moveY;

        for (const leaf of leaves) {
          if (!leaf.hasLanded) continue;

          const centerX = leaf.landedX - window.scrollX + leaf.size / 2;
          const centerY = leaf.landedY - window.scrollY + leaf.size / 2;
          const segmentPosition = segmentLengthSquared
            ? clamp(((centerX - startX) * moveX + (centerY - startY) * moveY) / segmentLengthSquared, 0, 1)
            : 0;
          const closestX = startX + segmentPosition * moveX;
          const closestY = startY + segmentPosition * moveY;
          const distance = Math.hypot(centerX - closestX, centerY - closestY);
          const sweepRadius = leaf.size * 0.8;

          if (distance > sweepRadius) continue;

          const proximity = 1 - distance / sweepRadius;
          leaf.sweepWindX = clamp(
            leaf.sweepWindX + (moveX / moveLength) * windStrength * proximity,
            -280,
            280
          );
          leaf.sweepWindY = clamp(
            leaf.sweepWindY + (moveY / moveLength) * windStrength * proximity,
            -280,
            280
          );
          const offsetX = closestX - centerX;
          const offsetY = closestY - centerY;
          const torque = (offsetX * moveY - offsetY * moveX) / (moveLength * sweepRadius);
          leaf.sweepAngularVelocity = clamp(
            leaf.sweepAngularVelocity + torque * windStrength * proximity * 0.8,
            -240,
            240
          );
          leaf.lastSweepUpdate = now;
        }

        if (leaves.some((leaf) => leaf.lastSweepUpdate !== null)) {
          ensureAnimation();
        }
      }

      previousPointer = currentPointer;
    });

    const resetTouchPointer = (event) => {
      if (event.pointerType === "touch") {
        previousPointer = null;
      }
    };
    window.addEventListener("pointerup", resetTouchPointer);
    window.addEventListener("pointercancel", resetTouchPointer);

    function startLeavesFallingSequentially() {
      // Batalkan urutan sebelumnya.
      sequenceId++;

      const currentSequence = sequenceId;
      let index = 0;

      if (startTimer !== null) {
        clearTimeout(startTimer);
        startTimer = null;
      }

      function startNextLeaf() {
        if (currentSequence !== sequenceId) return;
        if (index >= leaves.length) return;

        leaves[index].startFalling(performance.now());
        index++;

        if (index < leaves.length) {
          const delay = reducedMotion.matches
            ? 100
            : randomRange(MIN_DELAY, MAX_DELAY);

          startTimer = setTimeout(startNextLeaf, delay);
        } else {
          startTimer = null;
        }
      }

      startNextLeaf();
    }

    function initializeLeaves() {
      for (let i = 0; i < leavesCount; i++) {
        leaves.push(new Leaf());
      }

      startLeavesFallingSequentially();
    }

    function handleResize() {
      // Batalkan timer dan urutan sebelumnya.
      sequenceId++;

      if (startTimer !== null) {
        clearTimeout(startTimer);
        startTimer = null;
      }

      // Hentikan loop animasi yang sedang berjalan.
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
      }

      animationId = null;
      animationRunning = false;

      // Atur ulang daun sesuai ukuran layar baru.
      for (const leaf of leaves) {
        leaf.reset();
      }

      startLeavesFallingSequentially();
    }

    let resizeTimer = null;

    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);

      resizeTimer = setTimeout(() => {
        handleResize();
      }, 150);
    });

    reducedMotion.addEventListener("change", () => {
      handleResize();
    });

    initializeLeaves();
