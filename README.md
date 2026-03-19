# glassrevival

<p align="center">
  <strong>Full-stack fitness tracker with AI integration</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#tech-stack">Tech Stack</a>
</p>

---

## 📱 About

Full-stack fitness tracker with AI integration. Built with modern web technologies for a fast, responsive experience.


## ✨ Features

### 🎯 Core Functionality

| Feature | Description |
|---------|-------------|
| **Workout Tracking** | Log exercises, sets, and reps |
| **CSV Import** | Import training plans from spreadsheets |
| **Calendar View** | Schedule and plan workouts |
| **Progress Tracking** | Monitor fitness goals over time |
| **Offline Support** | Use without internet connection |


## 📦 Installation

### Prerequisites

- PostgreSQL database

### Local Development

```bash
# Clone the repository
git clone https://github.com/poferraz/glassrevival.git
cd glassrevival

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
# Create optimized build
npm run build
```

## 🔐 Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### Required Variables

- `VITE_OPENROUTER_API_KEY`
- `VITE_AI_MODEL`

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React** | UI framework |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Styling |
| **Vite** | Build tool |
| **Express.js** | Backend framework |
| **Drizzle ORM** | Database |


## 🗂️ Project Structure

```
glassrevival/
├── LICENSE/
├── server/
├── shared/
├── docs/
├── tailwind.config.ts/
├── package-lock.json/
├── package.json/
├── components.json/
├── tsconfig.json/
├── drizzle.config.ts/
```


## 📝 Usage

1. Clone the repository
2. Install dependencies
3. Run the development server
4. Open in your browser


## 🐛 Troubleshooting

### Common Issues

**Build fails:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Development server won't start:**
- Check that all environment variables are set
- Verify Node.js version (18+ required)


## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


---

<p align="center">
  Built with ❤️ by <a href="https://github.com/poferraz">poferraz</a>
</p>
