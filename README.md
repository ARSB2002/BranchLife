# BranchLife 🎮

A text-based life simulator game inspired by BitLife, built with HTML/JavaScript and packaged as an Android APK.

## ✨ Features

### Core Gameplay
- **Life simulation from birth to death** - Make choices that shape your character's life
- **Year-by-year progression** - Pass time and experience random life events
- **20+ job types** - From Laborer to Surgeon, each with education requirements, skill requirements, and named promotion paths
- **University system** - Apply to 4 university types with 3 funding methods (self-funded, guardian, scholarship)
- **School life** - Attend school from age 7-17, interact with classmates and teachers

### Bilingual Support (English/Persian)
- **Full i18n system** - Complete separation of English and Persian text (0 translation leaks)
- **Dual calendar** - Gregorian calendar (English) / Jalali solar calendar (Persian)
- **Dual currency** - USD (English) / Toman (Persian)
- **RTL/LTR layout** - Automatic direction switching based on language
- **Persian digits** - Numbers displayed in Persian numerals when in Persian mode

### Advanced Systems (v2)
- **Karma system** - A new stat (0-100) that affects event probabilities. Good choices boost karma, bad choices reduce it. High karma → more positive events; low karma → more negative events.
- **Skill-based job requirements** - Some jobs require specific skills (e.g., Programmer needs code skill ≥ 30, Designer needs art skill ≥ 30)
- **Named promotion paths** - Each job has a named career path (e.g., Junior dev → Developer → Senior dev → Tech Lead)
- **NPC dynamic events** - Parents can get promoted, lose jobs, or get sick. NPCs with jobs get occasional raises.
- **Skill XP progression** - Activities like study, gym, and hobby now grant skill XP that unlocks new job opportunities
- **Life Goals** - Set up to 5 goals (wealth, marriage, education, etc.) and track progress
- **Gold investment** - Buy/sell gold with fluctuating prices
- **Stock market** - Invest in 6 fictional companies with realistic fluctuations
- **Real estate** - Buy/sell houses and rent property
- **Heir system** - Designate an heir and continue life through them after death
- **NPC intelligence** - Characters have jobs, incomes, and make autonomous life decisions
- **Career paths** - Train in art, sports, music, business, or tech - affects job opportunities and salary
- **Difficulty levels** - Easy/Normal/Hard with substantial gameplay differences (cash, expenses, inflation, job luck, salary, activity quotas)

### New Events (v2)
- **Lost Wallet** - Karma-based choice (hand to police / keep cash / leave)
- **Stray Puppy** - Adopt or ignore (affects karma)
- **Lottery Ticket** - Buy a ticket with a chance to win
- **Witness a Crime** - Report / intervene / look away (affects karma)
- **Blood Donation** - Donate blood for karma and fame
- **Tax Audit** - Cooperate or hide income (risk of fines)
- **Depression/Mental Health** - Seek therapy or push through alone
- **Prison Fight** - Fight back / walk away / report to guard
- **Pet Illness** - Take to vet or wait and see
- **Parent Promotion/Job Loss** - Dynamic NPC life events

### Social Features
- **Relationships** - Family, friends, partners with love/trust/respect/anger metrics
- **Smart NPC memory** - Characters reference past interactions
- **Phone apps** - Dating app, gambling, social media, subscription platform
- **Classmates** - Close friends from school join your relations
- **Marriage & children** - Start a family with realistic consequences

### Additional Features
- **Superhero system** - Join hero organizations, go on missions, rank up
- **Crime system** - Commit crimes, go to jail, get paroled
- **Health system** - Diseases, treatments, insurance
- **Appearance** - Salon, gym, plastic surgery, gender reassignment (with custom name selection)
- **Identity change** - Fake your death and start fresh (with custom name selection)
- **Achievements** - 20+ achievements to unlock
- **Self-test** - Built-in automated test suite

## 📱 Installation

### Android APK
1. Download `BranchLife.apk` from this repository
2. Enable "Install from unknown sources" in your Android settings
3. Install the APK file

### Web Version
1. Download `BranchLife.html`
2. Open it in any modern web browser

## 🎯 How to Play

1. **Start a new life** - Choose your name, gender, country, family background, and difficulty
2. **Pass time** - Click "Pass time (one year)" to advance your age
3. **Make choices** - Respond to random life events that appear
4. **Manage your life** - Use the tabs to navigate:
   - 🏠 **Home** - Overview and activities
   - 🧬 **Character** - Personality traits and records
   - 👨‍👩‍👦 **Relations** - Family, friends, partner (Memories section removed for cleaner UI)
   - 🏫 **School & University** - Education and classmates
   - 💼 **Work** - Jobs and career
   - 💳 **Finance** - Money, investments, gold, loans
   - 🏘 **Assets** - House, car, insurance
   - 📱 **Phone** - Dating, gambling, social media
   - 🧭 **Life Path** - Skills, career paths, health, crime, appearance, superhero
   - 📊 **Market & Family** - Stocks, real estate, family tree, heir system
   - 🌍 **World** - Economy, migration
   - 📜 **History** - Achievements, goals, biography
   - ⚙️ **Settings** - Language, theme, saves

## 🌍 Supported Countries
Iran, USA, Canada, Germany, Turkey, Japan, UK

## 💾 Save System
- 3 save slots with automatic saving
- Backup system (auto and manual)
- Export/import saves as JSON

## 🛠 Technical Details

- **Built with**: Vanilla HTML/CSS/JavaScript (no dependencies)
- **Size**: ~261KB (HTML) / ~4.2MB (APK)
- **APK wrapper**: Capacitor (Android WebView)
- **Storage**: Browser localStorage
- **Compatibility**: Modern browsers, Android 7+
- **Default language**: English (switchable to Persian)
- **Start year**: 2025 (Gregorian) / 1403 (Jalali)

## 📄 License

This project is open source. Feel free to use, modify, and distribute.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or report issues.
