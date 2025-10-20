const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const Papa = require("papaparse");


// Create Main Window 

function createWindow() 
{
	const win = new BrowserWindow({
		width: 800, 
		height: 600,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
		},	
	});
	
	win.webContents.session.clearCache().then(() => {
		win.loadFile("index.html");
	});
}


// Open window

app.whenReady().then(createWindow);


// Handle Save As from renderer 

ipcMain.on("save-file", async (event, content) => 
{
	const win = BrowserWindow.getFocusedWindow();
	
	const { canceled, filePath } = await dialog.showSaveDialog(win, {
		title: "Save File",
		defaultPath: "untitled",
		filters: [
			{ name: "Text Files", extensions: ["txt"] }, 
			{ name: "PDF Files", extensions: ["pdf"] },
			{ name: "All Files", extensions: ["*"] }
		],	
	});	
	
	if (!canceled && filePath) 
	{
		if (filePath.endsWith(".pdf"))
		{
			win.webContents.send("set-content", content);
			
			setTimeout(async () => 
			{
				const pdfData = await win.webContents.printToPDF({});
				fs.writeFileSync(filePath, pdfData);
				console.log("PDF saved to: ", filePath);
				event.reply("save-success", filePath);
			}, 100);
		}	
		else
		{	
			fs.writeFileSync(filePath, content);
			console.log("File saved to: ", filePath);
			event.reply("save-success", filePath);
		}	
	}
});	


// Handle Opening file

ipcMain.on("open-file", async (event) => 
{
	const win = BrowserWindow.getFocusedWindow();
	
	const { canceled, filePaths } = await dialog.showOpenDialog(win, {
		title: "Open CSV File", 
		filters: [
			{ name:  "CSV Files", extensions: ["csv"] },
			{ name: "All Files", extensions: ["*"] },
		],
		properties: ["openFile"],
	});

	if (canceled || !filePaths.length)
	{
		return;
	}
	
	const filePath = filePaths[0];
	const fileContent = fs.readFileSync(filePath, "utf-8");
	
	// Parse CSV File data
	const parsed = Papa.parse(fileContent, { header: true });
	const data = parsed.data;
	
	// Send data to renderer
	event.reply("file-opened", data);
});