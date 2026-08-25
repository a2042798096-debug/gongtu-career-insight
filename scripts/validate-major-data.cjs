const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname,"..");
const read = file => fs.readFileSync(path.join(root,file),"utf8");
const appSource = read("app.js");
const dataOnlyApp = appSource.slice(0,appSource.indexOf("const SOURCES ="));
const profileHelpers = appSource.slice(appSource.indexOf("function directionDescription"),appSource.indexOf("function renderMajorPreview"));
const forecastData = appSource.slice(appSource.indexOf("const FORECAST_EVIDENCE"),appSource.indexOf("let currentMajor"));
const forecastHelpers = appSource.slice(appSource.indexOf("function forecastDisciplineTags"),appSource.indexOf("function renderForecastEvidence"));
const validation = `
const validationFailures = [];
const catalogMajors = PROFESSIONAL_TAXONOMY.flatMap(family => family[2]);
let currentMajor = "";
for (const major of catalogMajors) {
  try {
    if (!ensureMajorAnalysis(major)) throw new Error("无法定位专业类");
    const family = getFamilyForMajor(major);
    const data = DATA[major];
    const pathway = PATHWAY_DATA[major];
    const examples = buildMajorRouteExamples(major,family);
    if (!data || data.directions.length < 6) throw new Error("就业方向少于 6 个");
    if (!data.directions.every(item => item.name && item.tasks.length >= 3 && item.skills.length >= 4)) throw new Error("就业方向字段不完整");
    if (!pathway || pathway.routes.length !== 4) throw new Error("升学体制路径不完整");
    if (!pathway.routes.every(route => route.notes.length >= 4 && route.target)) throw new Error("路径注意事项不足");
    if (![examples.civil,examples.graduate,examples.institution,examples.soe].every(items => items.length >= 6)) throw new Error("岗位或方向示例少于 6 个");
    currentMajor = major;
    const forecast = getForecastContext(major);
    const forecastSeries = buildForecastSeries(forecast,"base");
    if (forecast.evidence.length < 3) throw new Error("预测证据少于 3 条");
    if (!Number.isFinite(forecast.confidence) || forecast.confidence < 40 || forecast.confidence > 100) throw new Error("预测置信度异常");
    if (forecastSeries.length !== 3 || !forecastSeries.every(item => item.values.length === 5 && item.values.every(Number.isFinite))) throw new Error("五年预测序列异常");
  } catch (error) {
    validationFailures.push({major,message:error.message});
  }
}
validationResult = {
  total:catalogMajors.length,
  generated:GENERATED_MAJOR_NAMES.size,
  expert:EXPERT_MAJOR_NAMES.size,
  forecastValidated:catalogMajors.length-validationFailures.length,
  failures:validationFailures
};`;

const context = {console};
vm.runInNewContext(`${read("catalog-2026.js")}\n${read("catalog-profiles.js")}\n${dataOnlyApp}\n${profileHelpers}\n${forecastData}\n${forecastHelpers}\nlet validationResult;\n${validation}\nthis.__result = validationResult;`,context,{filename:"major-data-validation.js"});

if (context.__result.failures.length) {
  console.error(JSON.stringify(context.__result,null,2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(context.__result,null,2));
}
