const OPENAI_API_KEY = window.OPENAI_API_KEY || "YOUR_OPENAI_API_KEY";

async function generateLyrics() {
    const theme = document.getElementById("theme").value;
    const genre = document.getElementById("genre").value;

    const responseBox = document.getElementById("lyrics");
    const spinner = document.getElementById("spinner");
    const copyBtn = document.getElementById("copy");
    const playBtn = document.getElementById("play");
    const downloadBtn = document.getElementById("download");

    spinner.hidden = false;
    copyBtn.hidden = true;
    playBtn.hidden = true;
    downloadBtn.hidden = true;

    responseBox.innerText = "Generating lyrics...";

    const prompt = `Write a ${genre} song about: ${theme}. Format with [Verse], [Chorus], [Bridge]`;

    try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 500
            })
        });

        if (!res.ok) {
            throw new Error(`API error: ${res.status}`);
        }

        const data = await res.json();
        const lyrics = data.choices[0].message.content;
        responseBox.innerText = lyrics;
        copyBtn.hidden = false;
        playBtn.hidden = false;
        downloadBtn.hidden = false;
    } catch (error) {
        responseBox.innerText = "Error generating lyrics.";
        console.error(error);
    }
    spinner.hidden = true;
}

window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('generate').addEventListener('click', generateLyrics);
    document.getElementById('copy').addEventListener('click', async () => {
        const text = document.getElementById('lyrics').innerText;
        try {
            await navigator.clipboard.writeText(text);
            const copyBtn = document.getElementById('copy');
            copyBtn.innerText = 'Copied!';
            setTimeout(() => { copyBtn.innerText = 'Copy Lyrics'; }, 2000);
        } catch (err) {
            console.error('Copy failed', err);
        }
    });

    document.getElementById('play').addEventListener('click', () => {
        const text = document.getElementById('lyrics').innerText;
        const utterance = new SpeechSynthesisUtterance(text);
        speechSynthesis.speak(utterance);
    });

    document.getElementById('download').addEventListener('click', () => {
        const text = document.getElementById('lyrics').innerText;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'lyrics.txt';
        a.click();
        URL.revokeObjectURL(url);
    });
});
