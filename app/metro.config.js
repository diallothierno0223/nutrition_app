// Le noyau métier vit à la racine du repo (../noyau), partagé avec les Edge Functions.
const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
config.watchFolders = [path.resolve(__dirname, "../noyau")];

module.exports = config;
