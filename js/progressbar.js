let interval;
let timer;
const barCount = 10; // Ensure this is declared at the top of your script

const equalizer = document.getElementById("equalizer");
const progressText = document.getElementById("progress-text");
const stepLabels = document.getElementById("step-labels");
const downloadBtn = document.getElementById("downloadBtn");

// Other parts of your code...
// Colors and Icons for the progress bars
const colors = [
  "#00c9ff",
  "#00bcd4",
  "#4caf50",
  "#ffeb3b",
  "#ff9800",
  "#ff5722",
  "#e91e63",
  "#f44336",
  "#d32f2f",
  "#b71c1c",
];

const icons = [
  "🎵",
  "🎶",
  "🎼",
  "🎧",
  "🎤",
  "🎷",
  "🎸",
  "🎺",
  "🎻",
  "🎚️",
];

const steps = [
  "Creating Models",
  "Creating Migrations",
  "Creating Seeders",
  "Creating Controllers",
  "Creating Actions",
  "Creating DTOs",
  "Creating Messages",
  "Creating Rules",
  "Creating Services",
  "Creating Image Traits",
  "Creating Exceptions",
  "Creating Helpers",
  "Creating Vue Templates",
  "Creating up Routes",
  "Finalizing Files",
  "Created",
];


// Create bars dynamically with increasing heights
for (let i = 0; i < barCount; i++) {
  let bar = document.createElement("div");
  bar.classList.add("bar");
  bar.style.backgroundColor = colors[i];
  bar.dataset.maxHeight = `${(i + 1) * 10}%`;
  let icon = document.createElement("i");
  icon.innerText = icons[i];
  bar.appendChild(icon);
  equalizer.appendChild(bar);
}

function resetProgress() {
  progress = 0;
  let bars = document.querySelectorAll(".bar");
  bars.forEach((bar) => {
    bar.style.height = "10%";
    let icon = bar.querySelector("i");
    icon.style.opacity = 0;
  });
  progressText.innerText = "Processing...";
  stepLabels.innerText = "Step 1: Generating Models";
}

function startProgress() {
  resetProgress();
  $('#progressModal').modal('show');
  progress = 0;
  let duration = 5000;
  let intervalDuration = duration / barCount;

  let bars = document.querySelectorAll(".bar");
  let index = 0;
  
  // Clear any existing timer if a new progress is started
  if (timer) clearInterval(timer);

  timer = setInterval(() => {
      if (index >= bars.length) {
          clearInterval(timer);
          progressText.innerText = "CRUD App Generated!";
          progressText.style.animation = "fadeIn 1s forwards";
          stepLabels.innerText = "Process Complete!";
          downloadBtn.style.display = "inline-block"; // Show the download button
          return;
      }

      progress = (index + 1) * 10;
      progressText.innerText = `Processing: ${steps[index]} ${progress}%`;
      stepLabels.innerText = steps[index];

      // Delay step change slightly before updating the bar height
      setTimeout(() => {
          bars[index].style.height = bars[index].dataset.maxHeight;
          let icon = bars[index].querySelector("i");
          icon.style.opacity = 1;
      }, 100); // Delay in updating bar height to allow step text to show

      index++;
  }, intervalDuration);
}

function setProgressBar(progress, text) {
  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");

  // Update progress bar width and text
  progressBar.style.width = `${progress}%`;
  progressText.innerText = text;

  // If the progress reaches 100, you can hide the progress bar or perform other actions
  if (progress === 100) {
      setTimeout(() => {
          progressText.style.animation = "fadeOut 1s forwards"; // Add fade-out animation
          downloadBtn.style.display = "inline-block"; // Show the download button
      }, 500); // Delay before fading out text
  }
}

// Stop the progress bar
function stopProgress() {
  if (timer) {
    clearInterval(timer);
   
    progressText.innerText = "Process Stopped";
    stepLabels.innerText = "Process Stopped";
  }
  // You can also hide the modal if needed
  $('#progressModal').modal('hide');
}
