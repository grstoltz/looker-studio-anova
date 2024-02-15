const path = require("path");
const fs = require("fs");
const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const getBuildableComponents = () => {
	const packageJson = JSON.parse(fs.readFileSync("package.json", "utf-8"));

	if (!("dsccViz" in packageJson)) {
		throw new Error(`missing "dsccViz" in package.json`);
	}
	if (!("components" in packageJson.dsccViz)) {
		throw new Error(`missing "dsccViz.components" in package.json`);
	}

	const { components } = packageJson.dsccViz;

	if (components.length === 0) {
		throw new Error("no components to build");
	}
	if (typeof components[0].jsFile != "string") {
		throw new Error("no components.jsFile to build");
	}

	return components;
};

const components = getBuildableComponents();
const componentIndexToBuild = Number(process.env.WORKING_COMPONENT_INDEX) || 0;
const component = components[componentIndexToBuild];

console.log(`Building ${component.tsFile || component.jsFile}...`);

const cssFilePath = path.resolve(__dirname, "src", component.cssFile || "");
const jsFilePath = path.resolve(__dirname, "src", component.jsFile || "");

const plugins = [
	// Add DSCC_IS_LOCAL definition
	new webpack.DefinePlugin({
		DSCC_IS_LOCAL: "true",
	}),
];

let body = '<script src="main.js"></script>';
if (fs.existsSync(cssFilePath)) {
	body = body + '\n<link rel="stylesheet" href="index.css">';
	plugins.push(new CopyWebpackPlugin([{ from: cssFilePath, to: "." }]));
}
const iframeHTML = `
<!doctype html>
<html><body>
${body}
</body></html>
`;

fs.writeFileSync(path.resolve(__dirname, "dist", "vizframe.html"), iframeHTML);

module.exports = [
	{
		mode: "development",
		entry: jsFilePath,
		devServer: {
			contentBase: "./dist",
		},
		output: {
			filename: "main.js",
			path: path.resolve(__dirname, "dist"),
		},
		plugins: plugins,
	},
];
