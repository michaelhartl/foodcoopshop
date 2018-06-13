#!/usr/bin/env bash

source $(dirname $0)/locales.sh

#get and merge translations for main app
bin/cake i18n extract --ignore-model-validation --output src\\Locale --paths src,config --overwrite --extract-core yes --merge no --no-location --exclude plugins
for locale in "${LOCALES[@]}"
do
    msgmerge src/Locale/$locale/cake.po src/Locale/cake.pot --output-file=src/Locale/$locale/cake.po --width=86
    msgmerge src/Locale/$locale/default.po src/Locale/default.pot --output-file=src/Locale/$locale/default.po --width=86
done

#get and merge translations for admin plugin
bin/cake i18n extract --plugin Admin --ignore-model-validation --overwrite --extract-core no --merge yes --no-location
for locale in "${LOCALES[@]}"
do
    msgmerge plugins/Admin/src/Locale/$locale/admin.po plugins/Admin/src/Locale/default.pot --output-file=plugins/Admin/src/Locale/$locale/admin.po --width=86
done

#get and merge translations for network plugin
bin/cake i18n extract --plugin Network --ignore-model-validation --overwrite --extract-core no --merge yes --no-location
for locale in "${LOCALES[@]}"
do
    msgmerge plugins/Network/src/Locale/$locale/network.po plugins/Network/src/Locale/default.pot --output-file=plugins/Network/src/Locale/$locale/network.po --width=86
done