#!/bin/bash

echo -n "Please enter your API-Key: "
read key

echo -e "module.exports = {\n\tapiKey: '$key'\n};" > config.js