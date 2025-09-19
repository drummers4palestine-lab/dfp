# Drummers for Palestine

## Overview
This is a full-stack web application designed to teach protest rhythms and fusion beats in solidarity with Palestine. It features an interactive drum machine that allows users to learn traditional tunes and protest-themed rhythms. The project aims to blend musical education with activism and social justice, providing a platform for engaging with and creating solidarity-focused music.

## User Preferences
Preferred communication style: Simple, everyday language.
Design preference: Black and white theme, no random images, only relevant Palestinian solidarity imagery.
Audio preference: Keep existing sound players intact as they are working well.

## System Architecture
The application employs a modern full-stack architecture with distinct frontend and backend components.

### Frontend
- **Framework**: React 18 with TypeScript.
- **Styling**: Tailwind CSS, utilizing a custom Keffiyeh-inspired design system.
- **UI Components**: Radix UI primitives with custom theming.
- **State Management**: React hooks paired with TanStack Query for server state management.
- **Routing**: Wouter for client-side routing.
- **Audio**: Leverages the Web Audio API for rhythm playback and visual feedback.
- **UI/UX Decisions**: Mobile-first design approach with responsive breakpoints, circular beats with glowing animations, 4-beat musical groupings visually separated, and gradient effects for visual appeal. The overall aesthetic is black and white, emphasizing Palestinian solidarity. The application avoids generic imagery, focusing solely on relevant solidarity-themed visuals.

### Backend
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript with ES modules.
- **Database**: PostgreSQL with Drizzle ORM for type-safe interactions.
- **Session Management**: Connect-pg-simple for PostgreSQL-backed sessions.

### Core Features
- **Audio Engine**: Web Audio API-driven rhythm player with real-time pattern visualization, individual instrument volume controls, tempo adjustment, and looping. Uses authentic drum samples for diverse sounds and supports specific audio file mapping for instruments like agogô and snare.
- **Pattern System**: Supports complex rhythm notation using string patterns for various instruments (surdo, repinique, snare, tamborim, agogô, shaker) with mnemonic aids for learning.
- **Data Models**: Includes "Tunes" (traditional fusion rhythms with multiple patterns) and "Protest Beats" (simplified rhythms for demonstrations). User management is prepared for future authentication features.
- **UI Components**: Key components include the interactive BeatboxPlayer, real-time PatternVisualizer, InstrumentToggle for individual controls, and responsive navigation.
- **Experiment Page**: Allows users to design custom beats using a 16-step grid interface, supporting dynamic pattern length adjustment and MP3 download functionality of custom beats.
- **Social Media Integration**: Features an Instagram page with embeds from UK Drummers for Palestine accounts. Includes contact information for joining local groups via Instagram messaging.
- **Instruments Page**: Comprehensive guide to samba instruments (surdo, repinique, snare, tamborim, agogô, shaker) with playing techniques, functions, and protest roles. Includes detailed snare rudiments section covering single/double stroke rolls, paradiddles, flams, drags, and rim shots with protest applications.
- **Theory Page**: Educational content on rhythm fundamentals, 4/4 time signatures, bars and counts. Features interactive visualizations of Palestinian chants ("Free Free Palestine", "1,2,3,4 Occupation No More", "From the River to the Sea", "Intifada") mapped to beat patterns with color-coded timing displays. Emphasizes playing with chants, not over them - teaching drummers to support rather than drown out the voices.
- **Shop Page**: Embedded Canva catalogue iframe displaying D4P merchandise and solidarity products with responsive design and external link integration. Includes comprehensive order form with customer details, multiple item support, size/color/logo dropdowns, quantity controls, and automatic email generation to drummers4palestine@gmail.com with all order details and payment information.

## External Dependencies

### Core Technologies
- **@neondatabase/serverless**: For PostgreSQL database connectivity.
- **drizzle-orm**: Type-safe ORM for PostgreSQL.
- **@tanstack/react-query**: For server state management and caching.
- **@radix-ui/***: Provides accessible UI component primitives.

### Audio & Visualization
- **Web Audio API**: Native browser API for audio processing.
- Custom audio synthesis and a robust pattern parsing and visualization system.

### Development Tools
- **tsx**: For TypeScript execution during development.
- **tailwindcss**: Utility-first CSS framework.