# Express Telemetry Desktop Client

Native desktop client for monitoring logs, traces and metrics.

This project part of the Express Telemetry project which aims to be a comprehensive alternative to OpenTelemetry.

## Project Status
Currently the project is in active development. Features and functionality are going to change on the fly.

## Features

- [x] Local Logs forwarded via gRPC
- [x] Logs filtering
- [x] Log search
- [x] Service name switching and filtering
- [ ] Trace view
- [ ] Metrics view
- [ ] Access to Remote observability backend


## Prerequisites

Before you begin, ensure you have the following installed:

1. **Rust**: Install from [https://www.rust-lang.org/tools/install](https://www.rust-lang.org/tools/install)

2. **Node.js**: Download and install from [https://nodejs.org/](https://nodejs.org/)

3. **pnpm**: Install globally using npm:
   ```
   npm install -g pnpm
   ```

4. **Tauri CLI**: Install using Cargo (Rust's package manager):
   ```
   cargo install tauri-cli
   ```

## Getting Started

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/your-tauri-app.git
   cd your-tauri-app
   ```

2. Install dependencies:
   ```
   pnpm install
   ```

3. Run the development server:
   ```
   cargo tauri dev
   ```


## License

[MIT License](LICENSE)
