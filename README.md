# Smart Agriculture App

A React-based web application for real-time smart farming insights, using data from IoT sensors via Firebase and providing crop recommendations with the Gemini API.

## Features

- Live sensor data display for temperature, humidity, soil moisture, and NPK values.
- Soil health analysis and color-coded feedback.
- Crop recommendation and soil health suggestions using the Gemini API.
- Securely integrated with Firebase Realtime Database.
- Dark mode for better viewing comfort.

## Setup & Deployment

This project is configured for automated deployment to GitHub Pages using GitHub Actions.

### Local Development

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/Arkomustafi2/smartagri.git](https://github.com/Arkomustafi2/smartagri.git)
    cd smartagri
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create an environment file:** Create a file named `.env` in the root of the project and add your Firebase and Gemini API keys. Use `.env.example` as a template.
    ```
    # .env
    REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
    REACT_APP_FIREBASE_API_KEY=your_firebase_api_key_here
    ...
    ```

4.  **Start the development server:**
    ```bash
    npm start
    ```

### Deployment

Deployment is handled automatically by the GitHub Action defined in `.github/workflows/deploy.yml`.

1.  **Add Secrets to GitHub:** Before pushing, ensure you have added all the necessary `REACT_APP_*` keys (for both Firebase and Gemini) to your repository's secrets.
    - Go to your repository > **Settings** > **Secrets and variables** > **Actions**.
    - Add a **New repository secret** for each variable in your `.env` file.

2.  **Push to `main`:** Push your changes to the `main` branch. The GitHub Action will automatically build and deploy your application to GitHub Pages.

Your deployed site will be available at: `https://arkomustafi2.github.io/smartagri/`
