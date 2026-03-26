"use strict";

// Tap Miner - beginner-friendly, extensible game architecture.
// We keep one game state object and a small set of helper functions.
// This makes it easier to add achievements, prestige, skins, etc. later.

const STORAGE_KEY = "tapMinerSave_v1";

// Central game config. Put balancing numbers here so tuning is easy.
const BALANCE = {
  tap: {
    basePower: 1,
    baseCost: 10,
    costMultiplier: 1.5,
    powerPerLevel: 1,
  },
  autoMiner: {
    baseCost: 25,
    costMultiplier: 1.7,
    coinsPerLevelPerSecond: 1,
  },
};

// Default state used for new players or reset.
const DEFAULT_STATE = {
  coins: 0,
  strongerTapLevel: 0,
  autoMinerLevel: 0,
};

const state = loadState();

const ui = {
  coinsDisplay: document.getElementById("coinsDisplay"),
  perSecondDisplay: document.getElementById("perSecondDisplay"),
  tapPowerDisplay: document.getElementById("tapPowerDisplay"),
  strongerTapButton: document.getElementById("strongerTapButton"),
  strongerTapLevel: document.getElementById("strongerTapLevel"),
  strongerTapCost: document.getElementById("strongerTapCost"),
  autoMinerButton: document.getElementById("autoMinerButton"),
  autoMinerLevel: document.getElementById("autoMinerLevel"),
  autoMinerCost: document.getElementById("autoMinerCost"),
  tapButton: document.getElementById("tapButton"),
  resetButton: document.getElementById("resetButton"),
};

// ----- Core calculations -----

function getTapPower() {
  return BALANCE.tap.basePower + state.strongerTapLevel * BALANCE.tap.powerPerLevel;
}

function getCoinsPerSecond() {
  return state.autoMinerLevel * BALANCE.autoMiner.coinsPerLevelPerSecond;
}

function getUpgradeCost(type) {
  if (type === "tap") {
    return Math.floor(BALANCE.tap.baseCost * BALANCE.tap.costMultiplier ** state.strongerTapLevel);
  }

  return Math.floor(
    BALANCE.autoMiner.baseCost * BALANCE.autoMiner.costMultiplier ** state.autoMinerLevel
  );
}

// Prevents negative values due to future feature bugs.
function clampCoins(value) {
  return Math.max(0, value);
}

function canAfford(cost) {
  return state.coins >= cost;
}

function addCoins(amount) {
  if (amount <= 0) return;
  state.coins = clampCoins(state.coins + amount);
}

function spendCoins(amount) {
  if (amount <= 0) return true;
  if (!canAfford(amount)) return false;
  state.coins = clampCoins(state.coins - amount);
  return true;
}

// ----- UI helpers -----

function formatNumber(value) {
  // Compact formatting keeps big numbers readable on mobile.
  return new Intl.NumberFormat("en-US", {
    notation: value >= 100000 ? "compact" : "standard",
    maximumFractionDigits: value >= 100000 ? 2 : 0,
  }).format(Math.floor(value));
}

function updateUpgradeButtonState(button, cost) {
  const affordable = canAfford(cost);
  button.disabled = !affordable;
  button.classList.toggle("affordable", affordable);
}

function render() {
  const tapCost = getUpgradeCost("tap");
  const autoCost = getUpgradeCost("auto");
  const tapPower = getTapPower();
  const coinsPerSecond = getCoinsPerSecond();

  ui.coinsDisplay.textContent = formatNumber(state.coins);
  ui.perSecondDisplay.textContent = `+${formatNumber(coinsPerSecond)} / sec`;
  ui.tapPowerDisplay.textContent = `+${formatNumber(tapPower)} per tap`;

  ui.strongerTapLevel.textContent = `Level ${state.strongerTapLevel}`;
  ui.strongerTapCost.textContent = `Cost: ${formatNumber(tapCost)}`;

  ui.autoMinerLevel.textContent = `Level ${state.autoMinerLevel}`;
  ui.autoMinerCost.textContent = `Cost: ${formatNumber(autoCost)}`;

  updateUpgradeButtonState(ui.strongerTapButton, tapCost);
  updateUpgradeButtonState(ui.autoMinerButton, autoCost);
}

// ----- Save system -----

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };

    const parsed = JSON.parse(raw);

    return {
      coins: Number.isFinite(parsed.coins) ? clampCoins(parsed.coins) : 0,
      strongerTapLevel: Number.isFinite(parsed.strongerTapLevel)
        ? Math.max(0, Math.floor(parsed.strongerTapLevel))
        : 0,
      autoMinerLevel: Number.isFinite(parsed.autoMinerLevel)
        ? Math.max(0, Math.floor(parsed.autoMinerLevel))
        : 0,
    };
  } catch {
    // If save data is corrupted, start fresh.
    return { ...DEFAULT_STATE };
  }
}

function resetProgress() {
  const confirmed = window.confirm("Reset all Tap Miner progress? This cannot be undone.");
  if (!confirmed) return;

  Object.assign(state, DEFAULT_STATE);
  saveState();
  render();
}

// ----- Game actions -----

function onTapMine() {
  addCoins(getTapPower());
  saveState();
  render();
}

function buyStrongerTap() {
  const cost = getUpgradeCost("tap");
  if (!spendCoins(cost)) return;

  state.strongerTapLevel += 1;
  saveState();
  render();
}

function buyAutoMiner() {
  const cost = getUpgradeCost("auto");
  if (!spendCoins(cost)) return;

  state.autoMinerLevel += 1;
  saveState();
  render();
}

// ----- Timers / loops -----

// Auto miner tick every second.
setInterval(() => {
  const income = getCoinsPerSecond();
  if (income <= 0) return;

  addCoins(income);
  saveState();
  render();
}, 1000);

// ----- Event wiring -----

ui.tapButton.addEventListener("click", onTapMine);
ui.strongerTapButton.addEventListener("click", buyStrongerTap);
ui.autoMinerButton.addEventListener("click", buyAutoMiner);
ui.resetButton.addEventListener("click", resetProgress);

// Initial paint.
render();
