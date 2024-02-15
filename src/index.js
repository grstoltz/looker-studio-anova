const dscc = require("@google/dscc");
const local = require("./localMessage.js");
const anova1 = require("@stdlib/stats-anova1");

const DSCC_IS_LOCAL = true;

const drawViz = (data) => {
	//Helper functions
	const getValues = (array, position, delimiter) => {
		return array[position]
			.split(delimiter)
			.map((item) => item.trim())
			.filter((item) => item);
	};

	const appendRows = (array, parent) => {
		const tableRow = parent.createElement("tr");
		array.forEach(function (cell) {
			const tableCell = document.createElement("td");
			if (typeof cell == "number") {
				tableCell.textContent = new Intl.NumberFormat().format(cell);
			} else {
				tableCell.textContent = cell;
			}
			tableRow.appendChild(tableCell);
		});
		tableBody.appendChild(tableRow);
	};

	//Turn Looker Studio data into separate arrays
	let x = data.tables.DEFAULT.map(function (el) {
		return el.metricID[0];
	});
	let y = data.tables.DEFAULT.map(function (el) {
		return el.dimID[0];
	});

	//Get alpha and decision values
	let alpha = data.tables.DEFAULT[0].alphaID[0];
	let decision = data.tables.DEFAULT[0].decisionID[0];

	//See if container exists, if it does, empty the container, if it does not, create a container.
	let container = document.getElementById("container");
	if (container) {
		container.innerHTML = "";
	} else {
		container = document.createElement("div");
		container.id = "container";
		document.body.appendChild(container);
	}

	if (alpha >= 1 || alpha <= 0) {
		container.innerHTML =
			"ERROR: Please enter an alpha value between 0 and 1";
		return;
	}

	if (typeof decision !== "boolean") {
		container.innerHTML =
			"ERROR: Please enter a boolean for the decision field";
		return;
	}

	//Run the ANOVA
	let outArr;
	try {
		let out = anova1(x, y, {
			alpha,
			decision,
		});
		outArr = out.print().split("\n");
	} catch (e) {
		container.innerHTML = e;
	}

	//Extract data from the ANOVA output
	const headers = getValues(outArr, 5, "  ");
	const treatmentArr = getValues(outArr, 6, " ");
	const errorsArr = getValues(outArr, 7, " ");
	const conclusion = outArr[9];

	const table = document.createElement("table");
	const tableHeader = document.createElement("thead");
	const tableBody = document.createElement("tbody");

	//Prepend blank header
	headers.unshift("");
	headers.forEach((column) => {
		const tableColumn = document.createElement("th");
		tableColumn.textContent = column;
		tableHeader.appendChild(tableColumn);
	});

	appendRows(treatmentArr, document);
	appendRows(errorsArr, document);

	//Add conclusion
	const tableRow = document.createElement("tr");
	const tableCell = document.createElement("td");
	tableCell.setAttribute("colspan", `${headers.length + 1}`);
	tableCell.textContent = conclusion;
	table.appendChild(tableHeader);
	table.appendChild(tableBody);
	tableBody.appendChild(tableRow);
	tableRow.appendChild(tableCell);

	// Render the table.
	container.appendChild(table);
};

// Renders locally
if (DSCC_IS_LOCAL) {
	drawViz(local.message);
} else {
	dscc.subscribeToData(drawViz, { transform: dscc.objectTransform });
}
