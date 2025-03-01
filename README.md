# Philosophy Learning System

A structured, concept-based approach to learning philosophy through Michael Sugrue's lecture series. This application focuses on deep understanding rather than passive consumption through readiness checks, guided viewing, reflective exercises, and mastery demonstrations.

## Project Overview

The Philosophy Learning System is built using Next.js 14 with App Router, TypeScript, and SQLite (via Prisma ORM) following Model-View-Controller (MVC) architecture principles.

### Core Features

- **Concept-Based Learning**: Organizing knowledge around philosophical concepts rather than chronology
- **Prerequisite Mapping**: Ensuring learners have necessary foundational knowledge before advancing
- **Active Engagement**: Promoting reflection and critical thinking through structured prompts
- **Mastery-Based Progression**: Requiring demonstrated understanding before advancing
- **Knowledge Decay Model**: Addressing the forgetting curve through timely review
- **AI-Enhanced Feedback**: Using AI to evaluate understanding and provide personalized guidance

## Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn
- Git

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/philosophy-learning-system.git
cd philosophy-learning-system
```

2. Install dependencies:

```bash
npm install
# or
yarn
```

3. Configure environment variables:

```bash
cp .env.example .env
```

4. Set up the database:

```bash
npx prisma migrate dev --name init
```

5. Run the development server:

```bash
npm run dev
# or
yarn dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

The project follows MVC architecture:

- **Models**: Located in `src/models/` and Prisma schema
- **Views**: React components in `src/components/` and pages in `src/app/`
- **Controllers**: API routes in `src/app/api/` and controller logic in `src/controllers/`

### Key Directories

```
philosophy-learning-system/
├── public/                  # Static files
├── src/                     # Application source code
│   ├── app/                 # Next.js App Router pages and layouts
│   │   ├── admin/           # Admin routes
│   │   ├── api/             # Next.js API routes (controller layer)
│   │   ├── auth/            # Authentication routes
│   │   ├── dashboard/       # Student dashboard
│   │   ├── profile/         # User profile
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home page
│   ├── components/          # Reusable UI components (view layer)
│   ├── controllers/         # Business logic (controller layer)
│   ├── lib/                 # Utility functions and libraries
│   │   ├── constants.ts     # Application constants
│   │   └── db/              # Database connection
│   └── types/               # TypeScript type definitions
├── prisma/                  # Prisma ORM
│   └── schema.prisma        # Database schema
└── tests/                   # Test files
```

## Development Notes

### Database

This project uses SQLite for development, stored in the `prisma/dev.db` file. You can view the database schema in `prisma/schema.prisma`.

To explore the database with Prisma Studio:

```bash
npx prisma studio
```

### Authentication

User authentication is handled with NextAuth.js. The configuration can be found in `src/app/api/auth/[...nextauth]/route.ts`.

## Testing

Run the test suite with:

```bash
npm test
# or
yarn test
```

## Deployment

This project can be deployed on platforms that support Next.js applications:

1. Build the project:

```bash
npm run build
# or
yarn build
```

2. Start the production server:

```bash
npm start
# or
yarn start
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[MIT License](LICENSE)

## Acknowledgements

- Michael Sugrue for his excellent philosophy lectures
- Next.js team for the framework
- Prisma team for the ORM
- TailwindCSS for styling
