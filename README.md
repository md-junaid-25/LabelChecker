# 🏷️ LabelCheck India

> Scan any food barcode to get nutrition facts, health ratings, allergen warnings, and personalised advice for diabetes, hypertension, and more — powered by India's largest open food database.

![React](https://img.shields.io/badge/React-18-61dafb?logo=react)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

- 🔍 **Barcode search** — type any EAN/UPC barcode number
- 📷 **Camera scanner** — live real-time barcode scanning via webcam/phone camera
- 🖼️ **Image scanner** — upload a photo and extract the barcode automatically
- 🥗 **Nutrition panel** — energy, protein, carbs, fat, sugar, sodium with visual bars
- 💊 **Health score** — A–E grade calculated from nutrients + NOVA processing level
- ⚠️ **Allergen warnings** — contains / may-contain with icons
- 🩸 **Condition advice** — personalised warnings for Diabetes, High BP, Obesity, Cholesterol, Kidney Disease
- 📋 **Ingredients & additives** — E-number safety rating (safe / caution / concerning)
- 🌙 **Dark / Light mode** — toggle with persistent preference
- 🇮🇳 **India-first** — built-in offline database of 20+ popular Indian brands (Maggi, Amul, Parle-G, Haldirams, Britannia, Lays, Cadbury and more)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- npm 8+

### Run locally

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME

# 2. Install dependencies
npm install

# 3. Start development server
npm start
```

App opens at `http://localhost:3000`

---

## 🌐 Deploy to GitHub Pages

### Option A — Automatic (recommended)

This repo includes a **GitHub Actions workflow** that automatically builds and deploys to GitHub Pages on every push to `main`.

**One-time setup:**
1. Push this repo to GitHub
2. Go to **Settings → Pages**
3. Under **Source**, select **GitHub Actions**
4. Push any commit — the workflow runs automatically

Your app will be live at:
```
https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
```

### Option B — Manual deploy

```bash
# Update homepage in package.json first:
# "homepage": "https://YOUR_USERNAME.github.io/YOUR_REPO_NAME"

npm run deploy
```

---

## 📁 Project Structure

```
src/
├── App.js                    # Main app, state management
├── App.css                   # All styles (dark + light theme)
├── api.js                    # Product fetch logic + India offline DB
├── index.js                  # React entry point
├── index.css                 # CSS variables + animations
└── components/
    ├── BarcodeScanner.js     # Camera + image barcode scanner (Quagga2)
    ├── ThemeToggle.js        # Dark/light mode toggle
    ├── ScoreRing.js          # Animated SVG health score ring
    ├── NutrientBar.js        # Animated nutrient progress bar
    ├── NutritionPanel.js     # Nutrition tab content
    ├── IngredientsPanel.js   # Ingredients + E-numbers tab
    ├── HealthPanel.js        # Health advice tab
    ├── AllergensPanel.js     # Allergens tab
    ├── ConditionWarnings.js  # Disease-specific warnings
    ├── Badge.js              # Colored tag pill
    ├── Tab.js                # Tab bar component
    └── Icons.js              # SVG icon components
```

---

## 🔌 Data Sources

| Source | Coverage |
|--------|----------|
| [Open Food Facts](https://world.openfoodfacts.org) | Global, strong India coverage |
| [Open Food Facts India](https://in.openfoodfacts.org) | India mirror fallback |
| Built-in offline DB | 20+ top Indian brands (instant, no network) |

No API keys required. All data is free and open.

---

## 📸 Camera Permissions

The camera scanner requires browser camera permissions. On mobile:
- **Android Chrome**: Allow when prompted
- **iOS Safari**: Settings → Safari → Camera → Allow

Camera scanning works best with **good lighting** and holding the barcode **steady** within the viewfinder.

---

## 🛠️ Built With

- [React 18](https://react.dev)
- [@ericblade/quagga2](https://github.com/ericblade/quagga2) — barcode scanning
- [Open Food Facts API](https://openfoodfacts.org) — product data
- [Google Fonts](https://fonts.google.com) — Syne + DM Sans

---

## 📄 License

MIT — free to use, modify, and distribute.

---

> ⚠️ **Disclaimer**: For educational purposes only. Always verify nutritional information on the physical product label. Not a substitute for professional medical advice.
