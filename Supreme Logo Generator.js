/*
 * Author: Hans Bas
 *
 * Date: 08-19-2018
 */

const ERROR_MESSAGES = [
	'',
	'There were no valid rows found in this CSV file.',
	'There was no layer called Title found.',
	'There was no layer called Background found.',
	'The Title layer is not a text layer. Add text to resolve this issue.'
];
const ENDING_SCRIPT_STRING = 'Ending script.';

const START_STRING = 'Start';
const STOP_STRING = 'Stop';

const TITLE_STRING = 'Title';
const BACKGROUND_STRING = 'Background';

const FONT_POSTSCRIPT = "FuturaStd-HeavyOblique";
const DEFAULT_FONT_SIZE = 830;
const POINTS = "pt";

const LOWER_BOUND = 0;

const CSV_HEX_MODE = 'HEX';
const CSV_HEX_MODE_ROW_LENGTH = 4; // DO NOT CHANGE UNLESS YOU INTEND TO RESTRUCTURE HOW THE CSV FILE IS READ.

const CSV_RGB_MODE = 'RGB';
const CSV_RGB_MODE_ROW_LENGTH = 8; // DO NOT CHANGE UNLESS YOU INTEND TO RESTRUCTURE HOW THE CSV FILE IS READ.

const HORIZONTAL_PADDING = 140;
const VERTICAL_PADDING = 80;
const PIXELS = "px";

const PNG_EXTENSION = ".png";

/** Main method for the program -- takes in user input to generate Supreme Box Logos to an output directory. */
function main() {

	// Prompt the user to select a CSV file.
	const inputFilePath = promptUserToSelectCSVFile();
	validateFilePath(inputFilePath); // Will exit the program if the user selects 'Cancel' during the prompt.

	// Read and extract data from the CSV file.
	var csvData = readCSV(inputFilePath);
	var numberOfValidRows = csvData.length;
	validateNumberOfRows(numberOfValidRows); // Will exit the program if the CSV file contains no valid data.

	// Prompt the user to enter what data row to start generating images.
	var enterStartIndexPrompt = createEnterNumberPrompt(START_STRING, numberOfValidRows, LOWER_BOUND);
	var startRow = promptUserToEnterNumber(START_STRING, enterStartIndexPrompt, LOWER_BOUND, numberOfValidRows);

	// Prompt the user to enter what data row to end generating images.
	var enterStopIndexPrompt = createEnterNumberPrompt(STOP_STRING, numberOfValidRows, startRow);
	var stopRow = promptUserToEnterNumber(STOP_STRING, enterStopIndexPrompt, startRow, numberOfValidRows);

	// Prompt the user to select a directory to output the generated images to.
	const outputFilePath = promptUserToSelectOutputFilePath();
	validateFilePath(outputFilePath); // Will exit the program if the user selects 'Cancel' during the prompt.

	changeRulerUnitsToPixels(); // Change ruler units of the document to pixels/px.
	createImageRange(csvData, outputFilePath, startRow, stopRow); // Create an image based off the data in the CSV and the user-specified range.

}

/**
 * Check to see if a file path is valid (not null/empty/undefined). If the filepath is invalid, exit with exit code 0.
 * @param {string} filePath - the file path being evaluated.
 */
function validateFilePath(filePath) {
	if (stringIsNullOrEmpty(filePath)) {
		exit(0);
	}
}

/**
 * Returns whether or not a string is null or undefined.
 * @param {string} str - the string that is being checked if it is null or undefined.
 * @returns {boolean} TRUE if str is null or undefined, FALSE otherwise.
 */
function stringIsNullOrEmpty(str) {
	return str == null || str == undefined;
}

/**
 * Prompt the user to select the CSV file to read from.
 * @returns {string} the file path to the CSV file that the program will read from.
 */
function promptUserToSelectCSVFile() {
	const SELECT_CSV_FILE_PROMPT = 'Select the CSV file to generate images from.';
	return File.openDialog(SELECT_CSV_FILE_PROMPT,filterCSVFiles,true);
}

/**
 * Filters out any file that is not a CSV file.
 * @param {string} file paths to any file
 * @returns {boolean} TRUE if the file path ends with '.csv', FALSE otherwise.
 */
function filterCSVFiles(file){
	if (file.constructor.name == "Folder") { return true; }
    if (file.name.match(/\.csv$/)) { return true; }
    return false
}

/**
 * Prompt the user to select the directory to output the generated images to.
 * @returns {string} file path to the output directory.
 */
function promptUserToSelectOutputFilePath() {
	const SELECT_OUTPUT_FILE_PATH_PROMPT = 'Select the directory to output the generated images.'
	return Folder.selectDialog(SELECT_OUTPUT_FILE_PATH_PROMPT);
}

/**
 * Reads a CSV file and parses its data into Objects that represent the row of data.
 * @param {string} csvFile - the file path to the CSV file to read from.
 * @returns {Object[]} an array of Objects that represent all of the data from a row in the CSV file. (File name, text name, text color, BG color)
 */
function readCSV(csvFile) {

	// Open and read the file
	var reader = new File(csvFile);
	reader.open('r');

	// Read the CSV file and separate all of the data by row and column
	var data = [];	
	while (!reader.eof) {

		// Check to see if the entries in this row are valid and if they are, create an Object to represent it
		var values = reader.readln().split(',');
		var nonEmptyValues = removeEmptyEntriesFromRow(values); // Remove all of the empty entries from the row
		if (invalidCSVRow(nonEmptyValues)) { continue; }

		// Create an object to represent the data in the row and push it to the data array
		var rowData = createRowObject(nonEmptyValues);
		data.push(rowData);

	}

	// CLOSE THE READER -- FLUSH BUFFER
	reader.close();

	return data;
}

/**
 * Check to see if a row in the CSV file is invalid.
 * @param {string[]} row - an array of strings that represent all of the data on the CSV row.
 * @returns {boolean} TRUE if the row is invalid, FALSE otherwise.
 */
function invalidCSVRow(row) {
	return !validCSVRow(row);
}

/**
 * Check to see if a row in the CSV file is valid.
 * A row is considered VALID if:
 *   -the row has a valid CSV row length (4 for HEX, 8 for RGB).
 *   -the row has valid CSV row values ([0-9A-F] for HEX, a numeric number between 0 and 255 for RGB).
 * @param {string[]} row - an array of strings that represent all of the data on the CSV row.
 * @returns {boolean} TRUE if the row is valid, FALSE otherwise.
 */
function validCSVRow(row) {
	if (invalidCSVRowLength(row)) { return false; } // If the row has an invalid row length (not 4 or 8) return FALSE
	var csvMode = getCSVMode(row);
	return validCSVRowValues(row, csvMode);
}

/**
 * Creates an array of non-empty values.
 * @param {string[]} row - the row that will have its null/empty entries removed.
 * @returns {string[]} a copy of the row passed in but with only non-empty entries.
 */
function removeEmptyEntriesFromRow(row) {
	var nonEmptyArray = [];
	for (var i = 0; i < row.length; i++) {
		var rowEntry = row[i];
		if (rowEntry) { nonEmptyArray.push(rowEntry); }
	}
	return nonEmptyArray;
}

/**
 * Determines what type of row this is based upon how many entries there are (4 for HEX, 8 for RGB).
 * @param {string[]} row - the row that will be used to determine if it is HEX or RGB.
 * @returns {string} the type of data will be in the row ('HEX' or 'RGB')
 */
function getCSVMode(row) {
	switch (row.length) {
		case CSV_HEX_MODE_ROW_LENGTH:
			return CSV_HEX_MODE;
		case CSV_RGB_MODE_ROW_LENGTH:
			return CSV_RGB_MODE;
	} 
}

/**
 * Check to see if the length of a row of data is invalid (not 4 or 8).
 * @param {string[]} row - the row that will be checked to see if its length is invalid.
 * @returns {boolean} TRUE if the row's length is invalid, FALSE otherwise.
 */
function invalidCSVRowLength(row) {
	return !validCSVRowLength(row);
}

/**
 * Check to see if the length of a row of data is valid (has 4 or 8 entries).
 * @param {string[]} row - the row that will be checked to see if its length is valid.
 * @returns {boolean} TRUE if the row's length is valid, FALSE otherwise.
 */
function validCSVRowLength(row) {
	return row.length == CSV_HEX_MODE_ROW_LENGTH || row.length == CSV_RGB_MODE_ROW_LENGTH;
}

/**
 * Check to see if the the data within a row is valid ([0-9A-F] for HEX, a numeric number between 0 and 255 for RGB).
 * @param {string[]} row - the row that will be checked to see if its values are valid. 
 * @param {string} csvMode - the type of data this row should contain ('HEX' or 'RGB').
 * @returns {boolean} TRUE if the row contains valid values, FALSE otherwise.
 */
function validCSVRowValues(row, csvMode) {
	switch (csvMode) {
		case CSV_HEX_MODE:
			return validCSVRowValuesHex(row);
		case CSV_RGB_MODE:
			return validCSVRowValuesRGB(row);
	}
}

/**
 * Check to see if the data within a row are valid HEX values ([0-9A-F] of length 6 or 3).
 * @param {string[]} row - the row that will be checked to see if its values are valid hex.
 * @returns {boolean} TRUE if the text color and background color are valid, FALSE otherwise.
 */
function validCSVRowValuesHex(row) {
	const CSV_HEX_TITLE_INDEX = 2;
	const CSV_HEX_BACKGROUND_INDEX = 3;
	var textColor = row[CSV_HEX_TITLE_INDEX];
	var backgroundColor = row[CSV_HEX_BACKGROUND_INDEX];
	return isHexColor(textColor) && isHexColor(backgroundColor);
}

/**
 * Check to see if a row value is valid hex ([0-9A-F] of length 6 or 3).
 * @param {string} color - the row value that will be checked to see if it is valid hex.
 * @returns {boolean} TRUE if the color is valid hex, FALSE otherwise.
 */
function isHexColor(color) {
	if (color.charAt(0) != '#') {
		var colorWithPound = '#' + color;
		return isHexColor(colorWithPound);
	}
	return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(color.toUpperCase());
}

/**
 * Check to see if the data within a row are valid RGB values (numeric numbers between 0 and 255).
 * @param {string[]} row - the row that will be checked to see if its values are valid RGB.
 * @returns {boolean} TRUE if all of the values in this row are valid RGB, FALSE otherwise.
 */
function validCSVRowValuesRGB(row) {
	const RGB_ROW_START_DATA_INDEX = 2;
	const RGB_ROW_STOP_DATA_INDEX = 8;	
	for (var i = RGB_ROW_START_DATA_INDEX; i < RGB_ROW_STOP_DATA_INDEX; i++) {
		if (!isRGBColor(row[i])) { return false; }
	}
	return true;
}

/**
 * Check to see if a row value is valid RGB (a numeric number between 0 and 255).
 * @param {string} color - the row value that will be checked to see if it is valid RGB.
 * @returns {boolean} TRUE if the color is valid RGB, FALSE otherwise.
 */
function isRGBColor(color) {
	const RGB_LOWER_BOUND = 0;
	const RGB_UPPER_BOUND = 255;
	if (isNaN(color)) { return false; }
	return color >= RGB_LOWER_BOUND && color <= RGB_UPPER_BOUND;
}

/**
 * Create an Object that represents the data in this row.
 * @param {string[]} row - the row that will be used to create an Object.
 * @returns {Object} rowObject - an Object that represents the data in this row (file name, text, text color, background color)
 */
function createRowObject(row) {
	var csvMode = getCSVMode(row);
	switch (csvMode) {
		case CSV_HEX_MODE:
			return createRowObjectHex(row);
		case CSV_RGB_MODE:
			return createRowObjectRGB(row);
	}
}

/**
 * Create an Object that represents the hex data in this row.
 * @param {string[]} row - the row that will be used to create an Object.
 * @returns {Object} rowObject - an Object that represents the data in this row (file name, text, text color, background color)
 * @returns {string} rowObject.fileName - the file name of the image generate from this Object.
 * @returns {string} rowObject.layerText - the text of the Photoshop text layer.
 * @returns {string} rowObject.fontColor - the font color of the Photoshop text layer.
 * @returns {string} rowObject.solidBackgroundColor - the color of the background layer.
 * @returns {string} rowObject.objectType - 'HEX' to show that this Object is representative of a row holding hex values.
 */
function createRowObjectHex(row) {
	var rowObject = {
		fileName: row[0],
		layerText: row[1],
		fontColor: row[2],
		solidBackgroundColor: row[3],
		objectType: CSV_HEX_MODE
	};
	return rowObject;
}

/**
 * Create an Object that represents the hex data in this row.
 * @param {string[]} row - the row that will be used to create an Object.
 * @returns {Object} rowObject - an Object that represents the data in this row (file name, text, text color, background color)
 * @returns {string} rowObject.fileName - the file name of the image generate from this Object.
 * @returns {string} rowObject.layerText - the text of the Photoshop text layer.
 * @returns {Object} rowObject.fontColor - the font color of the Photoshop text layer. (Stores RGB values as fields: r, g, b)
 * @returns {Object} rowObject.solidBackgroundColor - the color of the background layer. (Stores RGB values as fields: r, g, b)
 * @returns {string} rowObject.objectType - 'HEX' to show that this Object is representative of a row holding hex values.
 */
function createRowObjectRGB(row) {
	var rowObject = {
		fileName: row[0],
		layerText: row[1],
		fontColor: {
			'r': row[2],
			'g': row[3],
			'b': row[4]
		},
		solidBackgroundColor: {
			'r': row[5],
			'g': row[6],
			'b': row[7]
		},
		objectType: CSV_RGB_MODE
	};
	return rowObject;
}

/**
 * Check to see if there are any valid rows from a parsed CSV file. If there are no valid rows, exit with exit code 1.
 * @param {number} numberOfRows – the number of rows in an Object[] that represents all of the valid rows of the CSV file.
 */
function validateNumberOfRows(numberOfRows) {
	if (numberOfRows == 0) {
		exit(1);
	}
}

/**
 * Generate the string prompt that will ask the user to input the range of the rows in the CSV they want to generate.
 * @param {string} startOrStop - either 'Start' or 'Stop' to denote whether the user will be entering the start of the range or end of the range.
 * @param {number} numberOfRows - the total number of valid rows.
 * @param {number} lowerBound - the lowest possible number allowed to input.
 * @returns {string} a prompt asking the user at which row they would like to start/stop generating images from.
 */
function createEnterNumberPrompt(startOrStop, numberOfRows, lowerBound) {
	switch (startOrStop) {
		case START_STRING:
			return createEnterStartRowPrompt(numberOfRows);
		case STOP_STRING:
			return createEnterStopRowPrompt(numberOfRows, lowerBound);
	}
}

/**
 * Creates a prompt asking the user which row they would like to start generating images from.
 * @param {number} numberOfRows - the total number of valid rows.
 * @returns {string} a prompt asking the user which row they would like to start generating images from.
 */
function createEnterStartRowPrompt(numberOfRows) {
	const INCLUSIVE_LOWER_BOUND = '[';
	const EXCLUSIVE_UPPER_BOUND = ')';
	const RANGE_STRING = createRangeString(LOWER_BOUND, numberOfRows, INCLUSIVE_LOWER_BOUND, EXCLUSIVE_UPPER_BOUND);
	return createEnterRowPrompt(numberOfRows, START_STRING, RANGE_STRING);
}

/**
 * Creates a prompt asking the user at which row they would like to stop generating images.
 * @param {number} numberOfRows - the total number of valid rows.
 * @param {number} lowerBound - the lowest possible number allowed to input.
 * @returns {string} a prompt asking the user at which row they would like to stop generating images.
 */
function createEnterStopRowPrompt(numberOfRows, lowerBound) {
	const EXCLUSIVE_LOWER_BOUND = '('
	const INCLUSIVE_UPPER_BOUND = ']';
	const RANGE_STRING = createRangeString(lowerBound, numberOfRows, EXCLUSIVE_LOWER_BOUND, INCLUSIVE_UPPER_BOUND);
	return createEnterRowPrompt(numberOfRows, STOP_STRING, RANGE_STRING);
}

/**
 * Creates a string that represents the range of numbers the user is allowed to select numbers from. '(lower, upper]' or '[lower, upper)'
 * @param {number} lowerBound - the lowest possible number allowed to input.
 * @param {number} upperBound - the highest possible number allowed to input.
 * @param {string} inclusiveOrExclusiveLowerBound - '[' or '(' depending on whether or not the lower bound is inclusive or exclusive.
 * @param {string} inclusiveOrExclusiveUpperBound - ']' or ')' depending on whether or not the upper bound is inclusive or exclusive.
 * @returns {string} a string representing the range of numbers: '(lower, upper]' or '[lower, upper)'
 */
function createRangeString(lowerBound, upperBound, inclusiveOrExclusiveLowerBound, inclusiveOrExclusiveUpperBound) {
	return inclusiveOrExclusiveLowerBound + lowerBound + ', ' + upperBound + inclusiveOrExclusiveUpperBound;
}

/**
 * Create a prompt asking the user which row to start/stop generating images at.
 * @param {number} numberOfRows - the total number of rows allowed to input.
 * @param {string} startOrStop - 'Start' or 'Stop'
 * @returns {string} a string representing the prompt that will be given to the user.
 */
function createEnterRowPrompt(numberOfRows, startOrStop, rangeString) {
	return 'There are ' + numberOfRows + ' valid rows in this CSV file. ' + startOrStop + ' creating images at what row? Please enter a number in the range ' + rangeString + '.';
}

/**
 * Prompt the user to enter a number determining where to begin/end generating images. 
 * @param {string} startOrStop - 'Start' or 'Stop'
 * @param {string} promptString - the string to be used in the prompt.
 * @param {number} lowerBound - the lowest possible number a user can enter.
 * @param {number} upperBound - the highest possible number a user can enter.
 * @returns {number} the number that the user entered.
 */
function promptUserToEnterNumber(startOrStop, promptString, lowerBound, upperBound) {
	var number = null;
	var numberIsInvalid = true;

	// Prompt the user until they select 'Cancel' or enter a valid number.
	while (numberIsInvalid) {

		// Prompt the user to enter a number.
		number = prompt(promptString);

		// If the user selects 'Cancel' - exit the program with exit code 0.
		if (stringIsNullOrEmpty(number)) {
			exit(0);
		}

		// If the user input is not a number, prompt the user again.
		if (isNaN(number)) {
			alert('Input was not a number.');
			continue;
		}

		// If the user enters a negative number, prompt the user again.
		if (number < 0) {
			alert('Input was negative. Only select non-negative indices.');
			continue;
		}

		// If the user enters a number lower than the lower bound, prompt the user again.
		if (invalidLowerBound(startOrStop, number, lowerBound)) {
			alert('Input was lower than or equal to than the lower bound of ' + lowerBound + '.');
			continue;
		}

		// If the user enters a number higher than the upper bound, prompt the user again.
		if (invalidUpperBound(startOrStop, number, upperBound)) {
			alert('Input was larger than the total number of rows.');
			continue;
		}

		// If the program reaches this point then the user has entered a valid number.
		numberIsInvalid = false;

	}

	return number;

}

/**
 * Check to see if a number that the user input is invalid (lower than the lower bound).
 * @param {string} startOrStop - 'Start' or 'Stop'
 * @param {number} number - the number that the user input.
 * @param {number} lowerBound - the lowest possible number that the user can input.
 * @returns {boolean} TRUE if the user input a number lower than the lower bound, FALSE otherwise.
 */
function invalidLowerBound(startOrStop, number, lowerBound) {
	return !validLowerBound(startOrStop, number, lowerBound);
}

/**
 * Check to see if a number that the user input is valid (higher than the lower bound).
 * @param {string} startOrStop - 'Start' or 'Stop'
 * @param {number} number - the number that the user input.
 * @param {number} lowerBound - the lowest possible number that the user can input.
 * @returns {boolean} TRUE if the user input a number higher than the lower bound, FALSE otherwise.
 */
function validLowerBound(startOrStop, number, lowerBound) {
	switch (startOrStop) {
		case START_STRING:
			return number >= lowerBound;
		case STOP_STRING:
			return number > lowerBound;
	}
}

/**
 * Check to see if a number that the user input is invalid (higher than the upper bound).
 * @param {string} startOrStop - 'Start' or 'Stop'
 * @param {number} number - the number that the user input.
 * @param {number} upperBound - the highest possible number that the user can input.
 * @returns {boolean} TRUE if the user input a number higher than the upper bound, FALSE otherwise.
 */
function invalidUpperBound(startOrStop, number, upperBound) {
	return !validUpperBound(startOrStop, number, upperBound);
}

/**
 * Check to see if a number that the user input is valid (lower than the upper bound).
 * @param {string} startOrStop - 'Start' or 'Stop'
 * @param {number} number - the number that the user input.
 * @param {number} upperBound - the highest possible number that the user can input.
 * @returns {boolean} TRUE if the user input a number lower than the upper bound, FALSE otherwise.
 */
function validUpperBound(startOrStop, number, upperBound) {
	switch (startOrStop) {
		case START_STRING:
			return number < upperBound;
		case STOP_STRING:
			return number <= upperBound;
	}
}

/**
 * Changes the ruler units of the active Photoshop document to pixels.
 */
function changeRulerUnitsToPixels() {
	app.preferences.rulerUnits = Units.PIXELS;
}

/**
 * Generate images from a certain range of data [first, last).
 * @param {Object[]} data - an array of Objects that represent the parsed data from the CSV file.
 * @param {string} outputFilePath - the filepath to the directory where the generated images will be output to.
 * @param {number} first - the index of where the program will begin generating images (inclusive).
 * @param {number} last - the index of where the program will end generating images (exclusive).
 */
function createImageRange(data, outputFilePath, first, last) {
	for (var i = first; i < last; i++) {
		var rowObject = data[i];
		createImage(rowObject, outputFilePath); 
	}
}

/**
 * Generate an image using data from the CSV file.
 * @param {Object} rowObject - an Object that represents the data within a row of the CSV file.
 * @param {string} outputFilePath - the file path where the generated image will be placed.
 */
function createImage(rowObject, outputFilePath) {
 
	// Get a reference to the Title layer and set it as the active layer.
	var titleLayer = getTitleLayer();
	var backgroundLayer = getBackgroundLayer();

	// Set the Title layer as the active layer.
	setActiveLayer(titleLayer);

	// Set the text, font, and size of the Title layer.
	var text = rowObject.layerText;
	setLayerText(titleLayer, text);
	setLayerFont(titleLayer, FONT_POSTSCRIPT);
	setLayerFontSize(titleLayer, DEFAULT_FONT_SIZE);

	// Set the color of the Title layer.
	var objectType = rowObject.objectType;
	var textColor = createColor(rowObject, objectType, TITLE_STRING);
	setLayerTextColor(titleLayer, textColor);

	// Resize the Photoshop document canvas.
	var textWidth = getLayerWidth(titleLayer);
	var textHeight = getLayerHeight(titleLayer);
	resizeDocumentCanvas(textWidth, HORIZONTAL_PADDING, textHeight, VERTICAL_PADDING);

	// Center the Title layer.
	centerLayer(titleLayer);

	// Get a reference to the Background layer and set it as the active layer.
	setActiveLayer(backgroundLayer);

	// Fill the Background layer with its respective color.
	var backgroundColor = createColor(rowObject, objectType, BACKGROUND_STRING);
	fillLayer(backgroundColor);

	// Create the image.
	var fileName = rowObject.fileName;
	savePNG(fileName, outputFilePath);

}

/**
 * Retrieve a reference to the Title layer.
 * @returns {Object} a reference to the Title layer.
 */
function getTitleLayer() {
	try {
		return getLayer(TITLE_STRING);
	} catch (err) {
		exit(2);
	}
}

/**
 * Retrieve a reference to the Background layer.
 * @returns {Object} a reference to the Background layer.
 */
function getBackgroundLayer() {
	try {
		return getLayer(BACKGROUND_STRING);
	} catch (err) {
		exit(3);
	}
}

/**
 * Retrieve a reference to a layer within the Photoshop document.
 * @param {string} layerName - the name of the layer to retrieve a reference to.
 * @returns {Object} a reference to the layer.
 */
function getLayer(layerName) {
	return app.activeDocument.artLayers.getByName(layerName);
}

/**
 * Set a layer to be the active layer within the Photoshop document.
 * @param {Object} layer - the reference to a layer to be set as active.
 */
function setActiveLayer(layer) {
	app.activeDocument.activeLayer = layer;
}

/**
 * Change a text layer's text content.
 * @param {Object} layer - the reference to a text layer.
 * @param {string} textContent - the text content to set upon this text layer.
 */
function setLayerText(layer, textContent) {
	layer.textItem.contents = textContent;
}

/**
 * Change a text layer's font.
 * @param {Object} layer - the reference to a text layer.
 * @param {string} fontPostscript - the postscript of the font to set onto this text layer.
 */
function setLayerFont(layer, fontPostscript) {
	layer.textItem.font = fontPostscript;
}

/**
 * Change a text layer's font size.
 * @param {Object} layer - the reference to a text layer.
 * @param {number} size - the size (in pt) of the font.
 */
function setLayerFontSize(layer, size) {
	layer.textItem.size = new UnitValue(size, POINTS)
}

/**
 * Change a text layer's font color.
 * @param {Object} layer - the reference to a text layer.
 * @param {SolidColor} color - the colo to set onto this text layer.
 */
function setLayerTextColor(layer, color) {
	layer.textItem.color = color;
}

/**
 * Create a color object.
 * @param {Object} data - an Object that contains the information to create a color object.
 * @param {string} objectType - 'HEX' or 'RGB'. Will determine how to retrieve the information for the color object.
 * @param {string} textOrBackground - 'Title' or 'Background'. Will determine which layer this color object is being created for.
 * @returns {SolidColor} an Object that stores the information to apply a color to a Title layer or a Background layer.
 */
function createColor(data, objectType, textOrBackground) {
	switch (objectType) {
		case CSV_HEX_MODE:
			return createColorHex(data, textOrBackground);
		case CSV_RGB_MODE:
			return createColorRGB(data, textOrBackground);
	}
}

/**
 * Create a color object using hex values.
 * @param {Object} data - an Object that contains the information to create a color object.
 * @param {string} textOrBackground - 'Title' or 'Background'. Will determine which layer this color object is being created for.
 * @returns {SolidColor} an Object that stores the information to apply a color to a Title layer or a Background layer.
 */
function createColorHex(data, textOrBackground) {
	switch (textOrBackground) {
		case TITLE_STRING:
			return createColorHexTitle(data);
		case BACKGROUND_STRING:
			return createColorHexBackground(data);
	}
}

/**
 * Create a color object for the Title layer using hex values.
 * @param {Object} data - an Object that contains the information to create a color object.
 * @returns {SolidColor} an Object that stores the information to apply a color to a Title layer.
 */
function createColorHexTitle(data) {
	var color = new SolidColor();
	var titleHex = data.fontColor;
	var colorData = hexToRGB(titleHex);
	setSolidColor(color, colorData);
	return color;
}

/**
 * Create a color object for the Background layer using hex values.
 * @param {Object} data - an Object that contains the information to create a color object.
 * @returns {SolidColor} an Object that stores the information to apply a color to a Background layer.
 */
function createColorHexBackground(data) {
	var color = new SolidColor();
	var backgroundHex = data.solidBackgroundColor;
	var colorData = hexToRGB(backgroundHex);
	setSolidColor(color, colorData);
	return color;
}

/**
 * Convert a hex value to RGB values for a color object.
 * @param {string} hex - the hex value of a color.
 * @returns {Object} an object that represents the hex value converted into RGB values.
 */
function hexToRGB(hex) {
	if (hex.charAt(0) == '#') { return hexToRGB(hex.substring(1)); }
	if (hex.length == 3) {
		return parseShorthandHex(hex);
	}
	return parseHex(hex);
}

/**
 * Convert a hex value (ex. #FFFFFF) to RGB values for a color object.
 * @param {string} hex - the hex value of a color.
 * @returns {Object} an object that represents the hex value converted into RGB values.
 */
function parseHex(hex) {
	var redHex = hex.substring(0, 2);
	var redValue = parseInt(redHex, 16);

	var greenHex = hex.substring(2, 4);
	var greenValue = parseInt(greenHex, 16);

	var blueHex = hex.substring(4, 6);
	var blueValue = parseInt(blueHex, 16);

	return {"r": redValue, 
			"g": greenValue, 
			"b": blueValue};
}

/**
 * Convert a shorthand hex value (ex. #FFF) to RGB values for a color object.
 * @param {string} shorthandHex - the shorthand hex value of a color.
 * @returns {Object} an object that represents the shorthand hex value converted into RGB values.
 */
function parseShorthandHex(shorthandHex) {
	var redHexShorthand = Array(3).join(shorthandHex.charAt(0));
	var greenHexShorthand = Array(3).join(shorthandHex.charAt(1));
	var blueHexShorthand = Array(3).join(shorthandHex.charAt(2));

	var regularHex = redHexShorthand + greenHexShorthand + blueHexShorthand;

	return parseHex(regularHex);
}

/**
 * Create a color object using RGB values.
 * @param {Object} data - an Object that contains the information to create a color object.
 * @param {string} textOrBackground - 'Title' or 'Background'. Will determine which layer this color object is being created for.
 * @returns {SolidColor} an Object that stores the information to apply a color to a Title layer or a Background layer.
 */
function createColorRGB(data, textOrBackground) {
	switch (textOrBackground) {
		case TITLE_STRING:
			return createColorRGBTitle(data);
		case BACKGROUND_STRING:
			return createColorRGBBackground(data);
	}
}

/**
 * Create a color object for the Title layer using RGB values.
 * @param {Object} data - an Object that contains the information to create a color object.
 * @returns {SolidColor} an Object that stores the information to apply a color to a Title layer.
 */
function createColorRGBTitle(data) {
	var color = new SolidColor();
	var titleRGBData = data.fontColor;
	setSolidColor(color, titleRGBData);
	return color;
}

/**
 * Create a color object for the Background layer using RGB values.
 * @param {Object} data - an Object that contains the information to create a color object.
 * @returns {SolidColor} an Object that stores the information to apply a color to a Title layer.
 */
function createColorRGBBackground(data) {
	var color = new SolidColor();
	var backgroundRGBData = data.solidBackgroundColor;
	setSolidColor(color, backgroundRGBData);
	return color;
}

/**
 * Set the red, green, and blue properties of a SolidColor object.
 * @param {Object} solidColor - the SolidColor object to be altered.
 * @param {Object} colorData - an Object that stores the RGB values from the CSV file to create a color object.
 */
function setSolidColor(solidColor, colorData) {
	solidColor.rgb.red = colorData.r;
	solidColor.rgb.green = colorData.g;
	solidColor.rgb.blue = colorData.b;
}

/**
 * Get the width of a layer.
 * @param {Object} layer - a reference to the layer to get the width of.
 * @returns {number} the width of the layer.
 */
function getLayerWidth(layer) {
	return layer.bounds[2] - layer.bounds[0];
}

/**
 * Get the height of a layer.
 * @param {Object} layer - a reference to the layer to get the height of.
 * @returns {number} the height of the layer.
 */
function getLayerHeight(layer) {
	return layer.bounds[3] - layer.bounds[1];
}

/**
 * Resize the document canvas.
 * @param {number} width - the new width of the document.
 * @param {number} widthPadding - the padding on the left and right sides of the new document width.
 * @param {number} height - the new height of the document.
 * @param {number} heightPadding - the padding on the top and bottom sides of the new document height.
 */
function resizeDocumentCanvas(width, widthPadding, height, heightPadding) {
	app.activeDocument.resizeCanvas(UnitValue(width + widthPadding, PIXELS), UnitValue(height + heightPadding, PIXELS));
}

/**
 * Center the layer.
 * @param {Object} layer - a reference to the layer being centered.
 */
function centerLayer(layer) {
	var documentWidth = app.activeDocument.width;
	var documentHeight = app.activeDocument.height;
	var documentWidthCenter = documentWidth / 2;
	var documentHeightCenter = documentHeight / 2;

	var layerRightBound = layer.bounds[2];
	var layerLeftBound = layer.bounds[0];
	var layerWidthCenter = (layerRightBound + layerLeftBound) / 2;

	var layerTopBound = layer.bounds[3];
	var layerBottomBound = layer.bounds[1];
	var layerHeightCenter = (layerTopBound + layerBottomBound) / 2;

	layer.translate(documentWidthCenter - layerWidthCenter, documentHeightCenter - layerHeightCenter);
}

/**
 * Fill the entire layer with a color.
 * @param {SolidColor} color - the color to fill the layer with.
 */
function fillLayer(color) {
	app.activeDocument.selection.selectAll();
	app.activeDocument.selection.fill(color);
	app.activeDocument.selection.deselect();
}

// SAVE THE IMAGE AS A PNG FILE
/**
 * Save the current state of the Photoshop document as a PNG and export it to a output directory.
 * @param {string} fileName - the name of the file to be exported as.
 * @param {string} outputFilePath - the filepath of the directory to export the PNG to.
 */
function savePNG(fileName, outputFilePath) {

	// Create export settings.
	var opts = new ExportOptionsSaveForWeb();
	opts.format = SaveDocumentType.PNG;
	opts.PNG8 = false;
	opts.quality = 100;

	// Export PNG file and save to computer.
	var file = new File(outputFilePath + '/' + fileName + ' Supreme Box Logo' + PNG_EXTENSION);
	app.activeDocument.exportDocument(file, ExportType.SAVEFORWEB, opts);	
}

/**
 * Stops the execution of the program when encountering an issue and throws an error with an error message.
 * @param {number} exitCode - the exit code to exit the program on.
 * @throws Will throw an error with an error message.
 */
function exit(exitCode) {
	var exitMessage = ERROR_MESSAGES[exitCode];
	throw new Error(exitMessage);
}

try {
	main();
} catch (err) {
	if (stringIsNullOrEmpty(err.message)) { alert(ENDING_SCRIPT_STRING); } 
	else { alert(err.message + ' ' + ENDING_SCRIPT_STRING); }
}