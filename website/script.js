const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18 }
);

document.querySelectorAll(".reveal").forEach((element) => {
  revealObserver.observe(element);
});

const counters = document.querySelectorAll("[data-count]");
let countersStarted = false;

const countObserver = new IntersectionObserver(
  ([entry]) => {
    if (!entry.isIntersecting || countersStarted) return;
    countersStarted = true;

    counters.forEach((counter) => {
      const target = Number(counter.dataset.count);
      const duration = 1100;
      const startTime = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        counter.textContent = Math.round(target * eased).toLocaleString("zh-CN");
        if (progress < 1) requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    });
  },
  { threshold: 0.35 }
);

const metrics = document.querySelector(".metrics");
if (metrics) countObserver.observe(metrics);

const stackNotes = {
  auth: "多角色账号体系覆盖管理员、农户、加工厂、物流与监管方。",
  gs1: "GS1-128 编码把批次号、生产日期、单位换算和贴标锁定放进同一套规则。",
  chain: "业务明细留在系统内，关键数据摘要以哈希形式锚定到 EVM 兼容链。",
  stream: "消费者查看批次时，可基于当前药材、产地和质检上下文获得更贴近场景的咨询结果。"
};

const stackButtons = document.querySelectorAll("[data-stack]");
const stackNote = document.querySelector("#stack-note");

stackButtons.forEach((button) => {
  button.addEventListener("click", () => {
    stackButtons.forEach((item) => item.classList.remove("is-selected"));
    button.classList.add("is-selected");
    stackNote.textContent = stackNotes[button.dataset.stack];
  });
});

const tiltTarget = document.querySelector("[data-tilt]");
const plane = tiltTarget?.querySelector(".glass-plane");

if (tiltTarget && plane) {
  tiltTarget.addEventListener("pointermove", (event) => {
    const rect = tiltTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    plane.style.transform = `rotateX(${3 - y * 5}deg) rotateY(${-8 + x * 8}deg) translateY(${y * 8}px)`;
  });

  tiltTarget.addEventListener("pointerleave", () => {
    plane.style.transform = "rotateX(3deg) rotateY(-8deg)";
  });
}
