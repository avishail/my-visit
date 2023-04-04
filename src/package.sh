#!/bin/bash

zip -r shraga_v$VERSION.zip * -x \
    'src/*'     \
    README.md   \
    LICENSE     \
    shraga_v$VERSION.zip
