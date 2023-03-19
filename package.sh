#!/bin/sh

rm ~/Downloads/extension.zip

zip -r extension.zip * -x package.sh README.md LICENSE extension.zip
cp extension.zip ~/Downloads/

