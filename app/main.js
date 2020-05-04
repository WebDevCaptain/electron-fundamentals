const { app, BrowserWindow, dialog } = require("electron");
const fs = require("fs");

let mainWindow = null;

app.on("ready", () => {
	mainWindow = new BrowserWindow({
		show: false,
		webPreferences: {
			nodeIntegration: true,
		},
	});

	mainWindow.loadFile(`${__dirname}/index.html`);

	mainWindow.once("ready-to-show", () => {
		mainWindow.show();
	});
});

exports.getFileFromUser = () => {
	const files = dialog.showOpenDialogSync({
		properties: ["openFile"],
		filters: [
			{
				name: "Text Files",
				extensions: ["txt", "text"],
			},
			{
				name: "Markdown Files",
				extensions: ["md", "mdown", "markdown"],
			},
		],
		buttonLabel: "Unveil",
		title: "Open a Firesale Document !!",
	});

	if (!files) return;

	const file = files[0];
	openFile(file);
};

const openFile = (file) => {
	const content = fs.readFileSync(file).toString();
	mainWindow.webContents.send("file-opened", file, content);
};
