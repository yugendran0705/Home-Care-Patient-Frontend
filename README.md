# Home Care Patient App

This is a React Native mobile application for patients using the Home Care service. It allows patients to manage their profiles, addresses, and more.

## Getting Started

### Prerequisites

- Node.js
- npm or yarn
- Expo CLI

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yugendran0705/Home-Care-Patient-Frontend.git
   ```
2. Navigate to the project directory:
   ```bash
   cd Home-Care-Patient-Frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Running the application

- To start the development server:
  ```bash
  npm start
  ```
  or
  ```bash
  expo start
  ```
- To run on Android:
  ```bash
  npm run android
  ```
- To run on iOS:
  ```bash
  npm run ios
  ```
- To run on web:
  ```bash
  npm run web
  ```

## Folder Structure

- `app/`: Contains the screens and navigation logic of the application, using Expo Router.
- `assets/`: Contains static assets like images and fonts.
- `components/`: Contains reusable React components.
- `constants/`: Contains constants like colors and styles.
- `hooks/`: Contains custom React hooks.
- `node_modules/`: Contains all the installed dependencies.

## Contributing

When working on a ticket, please follow this branching strategy.

### Branching Strategy

Create a new branch from `main` for each ticket. The branch name should be in the following format:

`{Type of ticket}/{Ticket number}-{Small_description_with_underscores}`

**Types of tickets:**

- `feature`: For new features.
- `bugfix`: For bug fixes.
- `chore`: for routine tasks, maintenance, or refactoring.
- and more as needed.

**Example:**

`feature/123-add_new_profile_screen`
`bugfix/456-fix_login_issue`
`chore/789-update_dependencies`

### Commit Messages

Please use the following format for your commit messages:

`{Type of ticket}: {Ticket number}-{what you have solved}`

**Example:**

`feature: 123 Implemented the new profile screen UI`
