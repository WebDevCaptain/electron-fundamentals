const { app, BrowserWindow, dialog, Menu } = require("electron");
const fs = require("fs");

let mainWindow = null;

app.on("ready", () => {
	mainWindow = new BrowserWindow({
		show: false,
		webPreferences: {
			nodeIntegration: true,
		},
	});

	Menu.setApplicationMenu(applicationMenu);

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
				name: "Markdown Files",
				extensions: ["md", "mdown", "markdown"],
			},
			{
				name: "Text Files",
				extensions: ["txt", "text"],
			},
		],
		buttonLabel: "Unveil",
		title: "Open a Firesale Document !!",
	});

	if (!files) return;

	const file = files[0];
	openFile(file);
};

exports.saveMarkdown = (file, content) => {
	if (!file) {
		file = dialog.showSaveDialogSync({
			title: "Save Markdown",
			defaultPath: app.getPath("desktop"),
			filters: [
				{
					name: "Markdown File",
					extensions: ["md", "markdown", "mdown"],
				},
			],
		});
	}

	if (!file) return;

	fs.writeFileSync(file, content);
	openFile(file);
};

exports.saveHtml = (content) => {
	// If we are on MacOS and want to give a native feel, we can pass the window object as the first argument for 'showSaveDialogSync' like functions
	const file = dialog.showSaveDialogSync({
		title: "Export HTML",
		defaultPath: app.getPath("desktop"),
		filters: [
			{
				name: "HTML file",
				extensions: ["html", "htm"],
			},
		],
	});

	if (!file) return;
	fs.writeFileSync(file, content);
};

const openFile = (exports.openFile = (file) => {
	const content = fs.readFileSync(file).toString();
	app.addRecentDocument(file);
	mainWindow.webContents.send("file-opened", file, content);
});

const template = [
	{
		label: "File",
		submenu: [
			{
				label: "Open File",
				accelerator: "CommandOrControl+O",
				click() {
					exports.getFileFromUser();
				},
			},
			{
				label: "Copy",
				role: "copy",
			},
			{
				label: "Save File",
				accelerator: "CommandOrControl+S",
				click() {
					mainWindow.webContents.send("save-markdown");
				},
			},
			{
				label: "Save HTML",
				accelerator: "CommandOrControl+M",
				click() {
					mainWindow.webContents.send("save-html");
				},
			},
			{
				label: `Quit`,
				role: "quit",
			},
		],
	},
];

// MacOS specific check
if (process.platform === "darwin") {
	const applicationName = "Fire Sale";
	template.unshift({
		label: applicationName,
		submenu: [
			{
				label: `About ${applicationName}`,
			},
			{
				label: `Quit ${applicationName}`,
			},
		],
	});
}
const applicationMenu = Menu.buildFromTemplate(template);
