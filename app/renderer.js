const marked = require("marked");
const { remote, ipcRenderer, shell } = require("electron");
const path = require("path");

const mainProcess = remote.require("./main.js");
const currentWindow = remote.getCurrentWindow();

let filePath = "";
let originalContent = "";
let isEdited = false;

const markdownView = document.querySelector("#markdown");
const htmlView = document.querySelector("#html");
const newFileButton = document.querySelector("#new-file");
const openFileButton = document.querySelector("#open-file");
const saveMarkdownButton = document.querySelector("#save-markdown");
const revertButton = document.querySelector("#revert");
const saveHtmlButton = document.querySelector("#save-html");
const showFileButton = document.querySelector("#show-file");
const openInDefaultButton = document.querySelector("#open-in-default");

const renderMarkdownToHtml = (markdown) => {
	htmlView.innerHTML = marked(markdown, { sanitize: true });
};

const updateUserInterface = (isEdited) => {
	let title = "Fire Sale";
	if (filePath) {
		title = `${path.basename(filePath)} - ${title}`;
	}

	if (isEdited) {
		title = `${title} (Unsaved)`;
	}

	if (filePath) currentWindow.setRepresentedFilename(filePath); // MacOS specific UI updates
	currentWindow.setDocumentEdited(isEdited); // MacOS specific UI updates

	// showFileButton.disabled = !isEdited;
	// openInDefaultButton.disabled = !isEdited;
	showFileButton.disabled = false;
	openInDefaultButton.disabled = false;

	saveMarkdownButton.disabled = !isEdited;
	revertButton.disabled = !isEdited;
	saveHtmlButton.disabled = !isEdited;

	currentWindow.setTitle(title);
};

markdownView.addEventListener("keyup", (event) => {
	const currentContent = event.target.value;

	renderMarkdownToHtml(currentContent);
	updateUserInterface(currentContent !== originalContent);
});

openFileButton.addEventListener("click", () => {
	mainProcess.getFileFromUser();
});

const saveMarkdown = () => {
	mainProcess.saveMarkdown(filePath, markdownView.value);
};

saveMarkdownButton.addEventListener("click", saveMarkdown);

ipcRenderer.on("save-markdown", saveMarkdown);

const saveHtml = () => {
	mainProcess.saveHtml(htmlView.innerHTML);
};

saveHtmlButton.addEventListener("click", saveHtml);

ipcRenderer.on("save-html", saveHtml);

showFileButton.addEventListener("click", () => {
	if (!filePath) {
		return alert("Nope!!");
	}

	shell.showItemInFolder(filePath);
});

openInDefaultButton.addEventListener("click", () => {
	if (!filePath) {
		return alert("Nope !!!");
	}

	shell.openItem(filePath);
});

ipcRenderer.on("file-opened", (event, file, content) => {
	filePath = file;
	originalContent = content;

	markdownView.value = content;
	updateUserInterface(false);
	renderMarkdownToHtml(content);
});

// Preventing default drag-n-drop behaviour on the entire DOM
document.addEventListener("dragstart", (event) => event.preventDefault());
document.addEventListener("dragover", (event) => event.preventDefault());
document.addEventListener("dragleave", (event) => event.preventDefault());
document.addEventListener("drop", (event) => event.preventDefault());

// Helpers
const getDraggedFile = (event) => event.dataTransfer.items[0];

const getDroppedFile = (event) => event.dataTransfer.files[0];

const fileTypeIsSupported = (file) =>
	["text/plain", "text/markdown"].includes(file.type);

markdownView.addEventListener("dragover", (event) => {
	const file = getDraggedFile(event);

	if (fileTypeIsSupported(file)) {
		markdownView.classList.add("drag-over");
	} else {
		markdownView.classList.add("drag-error");
	}
});

markdownView.addEventListener("dragleave", (event) => {
	markdownView.classList.remove("drag-over");
	markdownView.classList.remove("drag-error");
});

markdownView.addEventListener("drop", (event) => {
	const file = getDroppedFile(event);

	if (fileTypeIsSupported(file)) {
		mainProcess.openFile(file.path);
	} else {
		alert("This file type is not supported...");
	}
});
