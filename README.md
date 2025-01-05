# GitPainter 🎨

GitPainter is a modern web application designed to help you create stunning pixel art on your **GitHub contribution graph**. Built with Next.js and Tailwind CSS, it offers a seamless experience to design, preview, and deploy your commit history art directly to GitHub.

## ✨ Features

- **Interactive Grid Editor**: Draw your contribution graph pixel by pixel.
- **Real-time Preview**: See how your graph will look before deploying.
- **Direct Deployment**: Deploys commits directly to your GitHub repository using `isomorphic-git` (Serverless compatible).
- **Customizable Options**: Choose specific years, ignore weekends, and randomize commit times.
- **Modern UI**: A sleek, dark-themed interface built with Tailwind CSS and Framer Motion.
- **Vercel Ready**: Optimized for serverless environments with long-running process support.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed.
- A GitHub account.
- A **Personal Access Token (PAT)** with `repo` scope permissions.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/gitpainter.git
   cd gitpainter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to start painting!

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Directory)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Git Operations**: [isomorphic-git](https://isomorphic-git.org/) (Pure JS Git implementation)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: CSS Animations & Framer Motion concepts

## 📝 Usage Guide

1. **Configuration**:
   - Enter your **GitHub Username**.
   - Specify the **Target Repository** (it's recommended to create a new, empty repository for this).
   - Paste your **Personal Access Token**.
   - Select the **Year** you want the art to appear in.

2. **Design**:
   - Click on the grid cells to toggle them (Green = Commits, Empty = No Commits).
   - Use the "Weekend Mode" or "Randomize" options for deeper customization.

3. **Deploy**:
   - Click **"Deploy to GitHub"**.
   - Watch the terminal logs as the bot generates commits and pushes them to your repository.
   - **Done!** Check your GitHub profile to see your new graph.

## ⚠️ Disclaimer

This tool is for educational and aesthetic purposes only. Manipulating your contribution graph artificially may not be seen as "genuine" activity by some. Use responsibly.

## Update: 2025-12-31T16:10:51.753Z
<!-- 2024-12-29T00:00:00.000Z-0 -->
<!-- 2024-12-29T00:00:00.000Z-1 -->
<!-- 2024-12-29T00:00:00.000Z-2 -->
<!-- 2024-12-29T00:00:00.000Z-3 -->
<!-- 2024-12-29T00:00:00.000Z-4 -->
<!-- 2024-12-29T00:00:00.000Z-5 -->
<!-- 2025-01-05T00:00:00.000Z-0 -->
<!-- 2025-01-05T00:00:00.000Z-1 -->
<!-- 2025-01-05T00:00:00.000Z-2 -->