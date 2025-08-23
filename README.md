# JNU Wiki

A modern, interactive service directory and information portal built with Next.js for Jinan University community.

## 🌟 Features

- **Service Directory**: Comprehensive categorized listing of university services
- **Smart Search**: Fuzzy matching for quick service discovery
- **Category Filtering**: Browse services by academic, administrative, or student life categories
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Modern UI**: Built with Tailwind CSS and Radix UI components

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone https://github.com/iconiconii/jnu-wiki.git
cd jnu-wiki
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
jnu-wiki/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Main page with service grid
│   ├── layout.tsx         # Root layout
│   └── loading.tsx        # Loading component
├── components/            # React components
│   ├── ServiceCard.tsx    # Individual service card
│   ├── CategoryCard.tsx   # Category display card
│   ├── ServicesGrid.tsx   # Main services grid
│   └── ui/               # UI primitives
├── data/                  # Data layer
│   └── services.ts       # Services data and configuration
├── types/                 # TypeScript definitions
│   └── services.ts       # Type definitions
├── config/               # Configuration files
│   └── auth-config.json  # Authentication settings
└── public/               # Static assets
```

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Search**: Custom fuzzy matching implementation

## 📋 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production application  
- `npm run start` - Start production server
- `npm run lint` - Run ESLint code linting

## 🎨 Customization

### Adding New Services

Edit `data/services.ts` to add new services:

```typescript
{
  id: 'your-service-id',
  name: 'Service Name',
  description: 'Service description',
  category: 'academic' | 'administrative' | 'student-life',
  tags: ['tag1', 'tag2'],
  // ... other properties
}
```

### Modifying Categories

Update the `categories` array in `data/services.ts` to modify available categories.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🏫 About JNU

This project is created for the Jinan University community to provide easy access to university services and information.

---

Built with ❤️ for JNU students, faculty, and staff.