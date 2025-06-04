# LyricForge

LyricForge is a simple single-page web app that generates song lyrics with OpenAI's API.

## Setup
1. Obtain an OpenAI API key from [OpenAI](https://openai.com/).
2. In `script.js`, replace `YOUR_OPENAI_API_KEY` with your key or set an environment variable named `OPENAI_API_KEY` when deploying.
3. Serve the files locally (for example with `python3 -m http.server`) and open
   `index.html` in your browser.

## Usage
- Enter a song theme (e.g., "lost love").
- Pick a genre from the dropdown.
- Click **Generate Lyrics** to fetch AI-written lyrics.

The page uses a dark theme with the Roboto font. Lyrics appear below the button after the request completes. You can copy the lyrics to the clipboard, play them with built-in speech synthesis, or download them as a text file.
